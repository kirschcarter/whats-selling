import Stripe from "stripe"
import { headers } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

function isActiveSub(status: Stripe.Subscription.Status) {
  return status === "active" || status === "trialing"
}

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return new Response("Missing webhook signature or secret", { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err: any) {
    return new Response(`Webhook signature verification failed: ${err?.message ?? "unknown"}`, {
      status: 400,
    })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const supabaseUserId = session.metadata?.supabase_user_id
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id

      if (!supabaseUserId || !subscriptionId || !customerId) {
        return new Response("Missing metadata or subscription or customer", { status: 200 })
      }

      const sub = await stripe.subscriptions.retrieve(subscriptionId)

      await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: supabaseUserId,
            is_pro: isActiveSub(sub.status),
            stripe_customer_id: customerId,
            stripe_subscription_id: sub.id,
            stripe_price_id: sub.items.data[0]?.price?.id ?? null,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          },
          { onConflict: "id" }
        )

      return new Response("ok", { status: 200 })
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object as Stripe.Subscription

      const supabaseUserId = sub.metadata?.supabase_user_id
      if (!supabaseUserId) {
        return new Response("No supabase_user_id on subscription metadata", { status: 200 })
      }

      await supabaseAdmin
        .from("profiles")
        .update({
          is_pro: isActiveSub(sub.status),
          stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? null,
          stripe_subscription_id: sub.id,
          stripe_price_id: sub.items.data[0]?.price?.id ?? null,
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        })
        .eq("id", supabaseUserId)

      return new Response("ok", { status: 200 })
    }

    return new Response("ignored", { status: 200 })
  } catch (err: any) {
    return new Response(`Webhook handler failed: ${err?.message ?? "unknown"}`, { status: 500 })
  }
}

