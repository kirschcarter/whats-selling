"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function PricingPage() {
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-4xl font-bold">Go Pro</h1>
        <p className="mt-3 text-lg text-gray-700">
          Get the full breakdown for every daily idea
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border p-6">
            <h2 className="text-xl font-semibold">Free</h2>
            <p className="mt-2 text-sm text-gray-600">
              See a couple ideas and previews
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li>• Daily feed</li>
              <li>• Limited posts</li>
              <li>• Preview only</li>
            </ul>
            <div className="mt-6 text-2xl font-bold">$0</div>
            <a
              href="/"
              className="mt-5 inline-block rounded-md border px-4 py-2 text-sm font-medium"
            >
              Back to today
            </a>
          </div>

          <div className="rounded-2xl border p-6">
            <div className="inline-flex items-center rounded-full bg-black px-3 py-1 text-xs font-semibold text-white">
              Most popular
            </div>

            <h2 className="mt-3 text-xl font-semibold">Pro</h2>
            <p className="mt-2 text-sm text-gray-600">
              Full details on every post
            </p>

            <ul className="mt-5 space-y-2 text-sm">
              <li>• Why it’s selling</li>
              <li>• How to copy it</li>
              <li>• Price range, demand, competition</li>
              <li>• All daily ideas</li>
            </ul>

            <div className="mt-6 text-2xl font-bold">
              $9
              <span className="text-base font-medium text-gray-600">
                /month
              </span>
            </div>

            <button
              type="button"
              className="mt-5 block w-full rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white disabled:opacity-60"
              disabled={loading}
              onClick={async () => {
                setLoading(true)
                try {
                  const { data } = await supabase.auth.getSession()
                  const token = data.session?.access_token

                  if (!token) {
                    window.location.href = "/login"
                    return
                  }

                  const res = await fetch("/api/checkout", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: token }),
                  })

                  const out = await res.json()
                  if (out?.url) window.location.href = out.url
                  else alert(out?.error || "Checkout error")
                } finally {
                  setLoading(false)
                }
              }}
            >
              {loading ? "Redirecting" : "Start Pro"}
            </button>

            <p className="mt-3 text-xs text-gray-500">
              Cancel anytime
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}


