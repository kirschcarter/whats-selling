"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Post = {
  id: string
  publish_date: string
  title: string | null
  platform: string | null
  price_range: string | null
  demand: string | null
  competition: string | null
  is_free: boolean | null
  why?: string | null
  how_to_copy?: string | null
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([])
  const [error, setError] = useState<string>("")
  const [loading, setLoading] = useState(true)

  const [isSignedIn, setIsSignedIn] = useState(false)
  const [isPro, setIsPro] = useState(false)

  const success =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("success")

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError("")

      const today = new Date().toISOString().slice(0, 10)

      const { data: sessionData } = await supabase.auth.getSession()
      const session = sessionData.session
      setIsSignedIn(!!session)

      if (session?.user?.id) {
        const { data: profile, error: profErr } = await supabase
          .from("profiles")
          .select("is_pro")
          .eq("id", session.user.id)
          .single()

        if (profErr) {
          setError(profErr.message)
        } else {
          setIsPro(!!profile?.is_pro)
        }
      } else {
        setIsPro(false)
      }

      const { data, error: postsErr } = await supabase
        .from("posts")
        .select("*")
        .eq("publish_date", today)
        .order("created_at", { ascending: false })

      if (postsErr) setError(postsErr.message)
      else setPosts((data as Post[]) || [])

      setLoading(false)
    }

    load()
  }, [])

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-bold">What’s Selling Today</h1>

        {success && (
          <div className="mt-6 rounded-md border border-green-300 bg-green-50 px-4 py-3 text-green-800">
            🎉 Payment success. Checking your Pro status...
          </div>
        )}

        <p className="mt-2 text-sm text-gray-600">
          Updated daily. Real demand. Simple explanations.
        </p>

        <div className="mt-4 text-sm text-gray-700">
          Status:{" "}
          {isSignedIn ? (
            <span className="font-medium">Signed in</span>
          ) : (
            <span className="font-medium">Not signed in</span>
          )}
          {" • "}
          Plan:{" "}
          {isPro ? (
            <span className="font-medium">Pro</span>
          ) : (
            <span className="font-medium">Free</span>
          )}
        </div>

        {error ? (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Error: {error}
          </div>
        ) : null}

        {loading ? (
          <p className="mt-8 text-gray-700">Loading...</p>
        ) : posts.length === 0 ? (
          <p className="mt-8 text-gray-700">No posts for today yet.</p>
        ) : (
          <div className="mt-8 space-y-4">
            {posts.map((p) => {
              const locked = !p.is_free && !isPro

              return (
                <div key={p.id} className="rounded-xl border p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-semibold">{p.title ?? "Untitled"}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {p.platform ?? "n a"}
                        {p.price_range ? ` • ${p.price_range}` : ""}
                        {p.demand ? ` • Demand ${p.demand}` : ""}
                        {p.competition ? ` • Competition ${p.competition}` : ""}
                      </p>
                    </div>

                    <span
                      className={
                        "rounded-full border px-3 py-1 text-xs " +
                        (p.is_free ? "bg-green-50" : isPro ? "bg-green-50" : "bg-gray-50")
                      }
                    >
                      {p.is_free ? "Free" : isPro ? "Pro" : "Pro"}
                    </span>
                  </div>

                  {!locked ? (
                    <div className="mt-4 space-y-3">
                      {p.why ? (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Why it’s selling
                          </div>
                          <div className="mt-1 text-sm text-gray-800">{p.why}</div>
                        </div>
                      ) : null}

                      {p.how_to_copy ? (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            How to copy it
                          </div>
                          <div className="mt-1 text-sm text-gray-800">{p.how_to_copy}</div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <div className="relative overflow-hidden rounded-lg border bg-gray-50 p-4">
                        <div className="pointer-events-none select-none blur-sm">
                          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            Why it’s selling
                          </div>
                          <div className="mt-1 text-sm text-gray-800">
                            {p.why ?? "Preview only"}
                          </div>

                          <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                            How to copy it
                          </div>
                          <div className="mt-1 text-sm text-gray-800">
                            {p.how_to_copy ?? "Preview only"}
                          </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 to-white/90">
                          <div className="text-center">
                            <div className="text-sm font-semibold">Unlock the full breakdown</div>
                            <div className="mt-1 text-xs text-gray-600">
                              Pro members get all daily ideas
                            </div>
                            <a
                              href="/pricing"
                              className="mt-3 inline-block rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
                            >
                              Go Pro
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

