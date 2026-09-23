import { compose } from "@/lib/genui/engine"
import type { ComposeEvent, RoundStat, UINode } from "@/lib/genui/types"

export const maxDuration = 30

const MAX_QUERY = 160
const RATE_LIMIT = 120 // compositions per IP per minute; typing fires one per pause

// Per-instance memory. Fluid compute reuses instances, so this absorbs repeats
// (backspacing, re-typing a suggestion) without calling Jev again.
type Entry = { tree: UINode; rounds: RoundStat[]; totalMs: number }
const cache = new Map<string, Entry>()
const hits = new Map<string, { n: number; reset: number }>()

function remember(key: string, entry: Entry) {
  cache.set(key, entry)
  if (cache.size > 500) cache.delete(cache.keys().next().value!)
}

function limited(ip: string) {
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || h.reset < now) {
    hits.set(ip, { n: 1, reset: now + 60_000 })
    return false
  }
  h.n++
  return h.n > RATE_LIMIT
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const raw = typeof body?.query === "string" ? body.query : ""
  const query = raw.trim().replace(/\s+/g, " ").slice(0, MAX_QUERY)
  if (!query) return Response.json({ error: "Type something first." }, { status: 400 })

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
  if (limited(ip)) return Response.json({ error: "Slow down a little, then try again." }, { status: 429 })

  const key = query.toLowerCase()
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: ComposeEvent) => controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"))
      const hit = cache.get(key)
      if (hit) {
        send({ type: "done", ...hit, cached: true })
        controller.close()
        return
      }
      const started = Date.now()
      try {
        const { tree, rounds } = await compose(query, {
          signal: req.signal,
          onRound: (t, stat) => send({ type: "round", tree: t, stat }),
        })
        const entry = { tree, rounds, totalMs: Date.now() - started }
        remember(key, entry)
        send({ type: "done", ...entry, cached: false })
      } catch (e) {
        if (!req.signal.aborted) {
          console.error("compose failed", e)
          send({ type: "error", message: "Jev did not answer this time. Keep typing to try again." })
        }
      } finally {
        try {
          controller.close()
        } catch {
          // Client already went away.
        }
      }
    },
  })

  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  })
}
