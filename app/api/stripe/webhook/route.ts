import Stripe from "stripe"
import { headers } from "next/headers"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: Request) {
  const sig = (await headers()).get("stripe-signature")
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return new Response("Missing stripe signature or webhook secret", { status: 400 })
  }

  const rawBody = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, secret)
  } catch (err: any) {
    return new Response(`Webhook signature verification failed: ${err?.message ?? "unknown"}`, {
      status: 400,
    })
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session

      const userId = session.metadata?.supabase_user_id
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id

      if (!userId) return new Response("No supabase_user_id in metadata", { status: 200 })

      // Mark user Pro after successful checkout
      const { error } = await supabaseAdmin
        .from("profiles")
        .upsert(
          {
            id: userId,
            is_pro: true,
            stripe_customer_id: customerId ?? null,
            stripe_subscription_id: subscriptionId ?? null,
          },
          { onConflict: "id" }
        )

      if (error) {
        return new Response(`Supabase update failed: ${error.message}`, { status: 500 })
      }

      return new Response("ok", { status: 200 })
    }

    // ignore other events for now
    return new Response("ignored", { status: 200 })
  } catch (err: any) {
    return new Response(`Webhook handler failed: ${err?.message ?? "unknown"}`, { status: 500 })
  }
}
