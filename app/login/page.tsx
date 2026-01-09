"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [msg, setMsg] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-md px-6 py-12">
        <h1 className="text-3xl font-bold">Sign in</h1>
        <p className="mt-2 text-sm text-gray-600">
          We will email you a magic link
        </p>

        <input
          className="mt-6 w-full rounded-md border px-3 py-2"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          className="mt-4 w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
          disabled={!email || loading}
          onClick={async () => {
            try {
              setLoading(true)
              setMsg("")
              const { error } = await supabase.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: "http://localhost:3000" },
              })
              if (error) setMsg(error.message)
              else setMsg("Check your email for the sign in link")
            } finally {
              setLoading(false)
            }
          }}
        >
          {loading ? "Sending" : "Send magic link"}
        </button>

        {msg ? <div className="mt-4 text-sm text-gray-700">{msg}</div> : null}

        <a href="/" className="mt-6 inline-block text-sm underline">
          Back
        </a>
      </div>
    </main>
  )
}
