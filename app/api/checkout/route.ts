import Stripe from "stripe"
import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

export const runtime = "nodejs"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const accessToken = body?.accessToken as string | undefined

    if (!accessToken) {
      return NextResponse.json({ error: "Missing access token" }, { status: 401 })
    }

    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(accessToken)

    if (userErr || !userData.user) {
      return NextResponse.json({ error: "Not signed in" }, { status: 401 })
    }

    const user = userData.user
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const priceId = process.env.STRIPE_PRICE_ID as string

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email ?? undefined,
      metadata: { supabase_user_id: user.id },
      subscription_data: {
        metadata: { supabase_user_id: user.id },
      },
      success_url: `${siteUrl}/?success=1`,
      cancel_url: `${siteUrl}/pricing`,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 })
  }
}
