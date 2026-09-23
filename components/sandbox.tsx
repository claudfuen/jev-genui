"use client"

import * as React from "react"
import { cn } from "cn"
import { Crosshair, Link2, Moon, RotateCcw, ScanEye, Search, Sun, X } from "lucide-react"
import { useTheme } from "next-themes"

import { Interpreter } from "@/components/genui/interpreter"
import { Inspector } from "@/components/inspector"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { ComposeEvent, Overrides, RoundStat, UINode } from "@/lib/genui/types"

const SUGGESTIONS = [
  "sales dashboard for a coffee shop",
  "kanban board for a design team",
  "chat app for customer support",
  "pricing page for a saas",
  "tinder for dogs",
  "checkout for a sneaker store",
  "music player",
  "hotel search results in lisbon",
  "crm for a law firm",
  "landing page for a surf school",
]

const REPO = "https://github.com/claudfuen/jev-genui"
const DEBOUNCE_MS = 220

type Result = { tree: UINode; rounds: RoundStat[]; totalMs: number }

function normalize(q: string) {
  return q.trim().replace(/\s+/g, " ").toLowerCase()
}

export function Sandbox() {
  const [query, setQuery] = React.useState("")
  const [swaps, setSwaps] = React.useState<{ key: string; overrides: Overrides }>({ key: "", overrides: {} })
  const [shown, setShown] = React.useState<{ key: string; tree: UINode; rounds: RoundStat[] } | null>(null)
  const [status, setStatus] = React.useState<"idle" | "composing" | "done" | "error">("idle")
  const [meta, setMeta] = React.useState<{ totalMs: number; cached: boolean } | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [highlight, setHighlight] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<string | null>(null)
  const [inspect, setInspect] = React.useState(false)
  const [overlay, setOverlay] = React.useState(false)
  const cache = React.useRef(new Map<string, Result>())
  const inputRef = React.useRef<HTMLInputElement>(null)

  const key = normalize(query)
  const overrides = swaps.key === key ? swaps.overrides : {}
  const overridesKey = JSON.stringify(Object.entries(overrides).sort())
  const cacheKey = `${key}::${overridesKey}`

  // Shareable links: ?q= restores a composition.
  React.useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    if (q) setQuery(q.slice(0, 160))
  }, [])
  React.useEffect(() => {
    const url = key ? `?q=${encodeURIComponent(query.trim())}` : window.location.pathname
    window.history.replaceState(null, "", url)
  }, [key]) // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    setSelected(null)
    if (!key) {
      setShown(null)
      setStatus("idle")
      setMeta(null)
      return
    }
    if ([...key].length < 2) {
      setStatus("idle")
      return
    }
    const hit = cache.current.get(cacheKey)
    if (hit) {
      setShown({ key, tree: hit.tree, rounds: hit.rounds })
      setMeta({ totalMs: hit.totalMs, cached: true })
      setStatus("done")
      return
    }
    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setStatus("composing")
      setError(null)
      try {
        const res = await fetch("/api/compose", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ query, overrides }),
          signal: ctrl.signal,
        })
        if (!res.ok || !res.body) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error ?? `Request failed (${res.status})`)
        }
        const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
        const rounds: RoundStat[] = []
        let buf = ""
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          buf += value
          let nl: number
          while ((nl = buf.indexOf("\n")) >= 0) {
            const line = buf.slice(0, nl)
            buf = buf.slice(nl + 1)
            if (!line) continue
            const e = JSON.parse(line) as ComposeEvent
            if (e.type === "round") {
              rounds.push(e.stat)
              // Keep the previous UI on screen until the new one has real structure,
              // so typing does not flash skeletons on every keystroke.
              setShown((prev) => (!prev || e.stat.round >= 2 ? { key, tree: e.tree, rounds: [...rounds] } : prev))
            } else if (e.type === "done") {
              cache.current.set(cacheKey, { tree: e.tree, rounds: e.rounds, totalMs: e.totalMs })
              setShown({ key, tree: e.tree, rounds: e.rounds })
              setMeta({ totalMs: e.totalMs, cached: e.cached })
              setStatus("done")
            } else {
              throw new Error(e.message)
            }
          }
        }
      } catch (err) {
        if (ctrl.signal.aborted) return
        setStatus("error")
        setError(err instanceof Error ? err.message : "Something went wrong.")
      }
    }, DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [cacheKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const swap = (path: string, prop: string, value: string) =>
    setSwaps((s) => ({ key, overrides: { ...(s.key === key ? s.overrides : {}), [`${path}|${prop}`]: value } }))

  const active = key.length > 0
  const brand = typeof shown?.tree.props.brand === "string" ? shown.tree.props.brand : ""
  const host = brand ? `${brand.toLowerCase().replace(/[^a-z0-9]+/g, "")}.app` : "preview"
  const swapCount = Object.keys(overrides).length

  const input = (
    <div
      className={cn(
        "group flex w-full items-center gap-3 rounded-full border bg-background px-5 shadow-xs transition-shadow focus-within:shadow-md hover:shadow-md",
        active ? "h-11 max-w-2xl" : "h-14 max-w-2xl",
      )}
    >
      {status === "composing" ? <Spinner className="size-4 text-muted-foreground" /> : <Search className="size-4 text-muted-foreground" />}
      <input
        ref={inputRef}
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Describe any interface..."
        aria-label="Describe an interface"
        maxLength={160}
        className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery("")
            inputRef.current?.focus()
          }}
          className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Clear"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )

  if (!active) {
    return (
      <div className="flex min-h-svh flex-col">
        <TopBar />
        <main className="flex flex-1 flex-col items-center justify-center gap-8 px-4 pb-24">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="text-5xl font-semibold tracking-tight sm:text-6xl">
              Jev<span className="text-muted-foreground">/ui</span>
            </h1>
            <p className="max-w-md text-pretty text-muted-foreground">Type anything. Jev composes the interface as you type, one decision at a time.</p>
          </div>
          {input}
          <div className="flex max-w-2xl flex-wrap justify-center gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>
        </main>
        <footer className="px-4 pb-6 text-center text-xs text-muted-foreground">Jev never writes code. It answers typed choices, and a React interpreter renders them.</footer>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col lg:h-svh">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-background px-4 py-2.5 sm:gap-4">
        <button type="button" onClick={() => setQuery("")} className="hidden shrink-0 text-lg font-semibold tracking-tight sm:block">
          Jev<span className="text-muted-foreground">/ui</span>
        </button>
        <div className="flex min-w-0 flex-1 justify-center">{input}</div>
        <Status status={status} meta={meta} error={error} />
        <ThemeToggle />
      </header>

      <div className="flex flex-col gap-4 p-3 sm:p-4 lg:grid lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section className="relative flex h-[75svh] flex-col overflow-hidden rounded-2xl border bg-muted/30 lg:h-auto lg:min-h-0">
          <div className="flex items-center gap-2 border-b bg-background px-3 py-1.5">
            <div className="flex gap-1.5 px-1">
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="size-2.5 rounded-full bg-foreground/15" />
              <span className="size-2.5 rounded-full bg-foreground/15" />
            </div>
            <div className="mx-auto min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-1 text-center font-mono text-xs text-muted-foreground sm:max-w-sm">{host}</div>
            <div className="flex items-center gap-0.5">
              {swapCount > 0 && (
                <ToolButton label={`Undo ${swapCount} swap${swapCount > 1 ? "s" : ""}`} onClick={() => setSwaps({ key, overrides: {} })}>
                  <RotateCcw />
                </ToolButton>
              )}
              <ToolButton label="Inspect: click a component to see Jev's choices" active={inspect} onClick={() => setInspect((v) => !v)}>
                <Crosshair />
              </ToolButton>
              <ToolButton label="Confidence overlay: green sure, amber unsure, red guessing" active={overlay} onClick={() => setOverlay((v) => !v)}>
                <ScanEye />
              </ToolButton>
              <ToolButton label="Copy share link" onClick={() => navigator.clipboard?.writeText(window.location.href)}>
                <Link2 />
              </ToolButton>
            </div>
          </div>
          {status === "composing" && (
            <div className="absolute inset-x-0 top-[41px] z-10 h-0.5 overflow-hidden">
              <div className="h-full w-1/3 animate-[jev-scan_1.1s_ease-in-out_infinite] bg-foreground/40" />
            </div>
          )}
          <div
            className={cn("min-h-0 flex-1 overflow-auto transition-opacity", status === "composing" && shown?.key !== key && "opacity-60", inspect && "cursor-crosshair")}
            onClickCapture={(e) => {
              if (!inspect) return
              const el = (e.target as HTMLElement).closest("[data-node]")
              if (!el) return
              e.preventDefault()
              e.stopPropagation()
              setSelected(el.getAttribute("data-node"))
            }}
          >
            {shown ? (
              <Interpreter tree={shown.tree} seed={shown.key} highlight={highlight ?? selected} overlay={overlay} />
            ) : (
              <div className="grid h-full place-items-center p-8 text-sm text-muted-foreground">{status === "error" ? error : [...key].length < 2 ? "Keep typing..." : "Composing..."}</div>
            )}
          </div>
        </section>

        <aside className="flex h-[70svh] flex-col overflow-hidden rounded-2xl border bg-background lg:h-auto lg:min-h-0">
          <Inspector tree={shown?.tree ?? null} rounds={shown?.rounds ?? []} selected={selected} onHover={setHighlight} onSwap={swap} />
        </aside>
      </div>
    </div>
  )
}

function ToolButton({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant={active ? "secondary" : "ghost"} size="icon-sm" aria-label={label} aria-pressed={active} onClick={onClick}>
            {children}
          </Button>
        }
      />
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function Status({ status, meta, error }: { status: string; meta: { totalMs: number; cached: boolean } | null; error: string | null }) {
  let text = ""
  if (status === "composing") text = "Jev is composing"
  else if (status === "error") text = error ?? "Error"
  else if (meta) text = meta.cached ? "cached" : `${(meta.totalMs / 1000).toFixed(1)}s`
  return (
    <span className={cn("hidden w-32 truncate text-right text-xs tabular-nums sm:block", status === "error" ? "text-destructive" : "text-muted-foreground")}>{text}</span>
  )
}

function TopBar() {
  return (
    <div className="flex items-center justify-end gap-1 p-3">
      <Button variant="ghost" size="sm" nativeButton={false} render={<a href={REPO} target="_blank" rel="noreferrer" />}>
        GitHub
      </Button>
      <ThemeToggle />
    </div>
  )
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      <Sun className="hidden size-4 dark:block" />
      <Moon className="size-4 dark:hidden" />
    </Button>
  )
}
