"use client"

// Shared building blocks for the interpreter and the primitive library: the
// render context, per-node hooks, the molecule frame and the image placeholder.

import * as React from "react"
import { cn } from "cn"

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { rng } from "@/lib/genui/sample"
import type { UINode } from "@/lib/genui/types"
import { Icon } from "./icons"

export type Ctx = { seed: string; brand: string; highlight: string | null; overlay: boolean }
export const InterpreterContext = React.createContext<Ctx>({ seed: "", brand: "", highlight: null, overlay: false })

export const str = (v: unknown, fallback = "") => (typeof v === "string" && v !== "none" ? v : fallback)
export const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : [])
/** Nested inside a card-like parent, a molecule drops its own card frame. */
export const nested = (n: UINode) => n.path.split(".").length > 2 || n.depth >= 2

export function confidence(n: UINode) {
  const ps = n.decisions.map((d) => d.probability).filter((p): p is number => p != null)
  return ps.length ? Math.min(...ps) : 1
}

export function useNode(node: UINode) {
  const { seed, highlight, overlay } = React.useContext(InterpreterContext)
  const r = React.useMemo(() => rng(`${seed}|${node.path}|${node.kind}`), [seed, node.path, node.kind])
  const c = confidence(node)
  return {
    r,
    attrs: {
      "data-node": node.id,
      className: cn(
        "animate-in fade-in-0 duration-500",
        highlight === node.id && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        overlay && "outline-2 outline-offset-2 outline-dashed",
        overlay && (c >= 0.75 ? "outline-emerald-500/70" : c >= 0.45 ? "outline-amber-500/80" : "outline-rose-500/80"),
      ),
    },
  }
}

/** A molecule's frame: a titled card at section level, bare when nested in a card. */
export function Frame({ node, title, action, children, className }: { node: UINode; title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  const { attrs } = useNode(node)
  if (nested(node)) return <div {...attrs} className={cn(attrs.className, className)}>{children}</div>
  return (
    <Card {...attrs} className={cn(attrs.className, "h-full")}>
      {(title || action) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {action && <CardAction>{action}</CardAction>}
        </CardHeader>
      )}
      <CardContent className={className}>{children}</CardContent>
    </Card>
  )
}

export const ASPECT: Record<string, string> = {
  wide: "aspect-video", square: "aspect-square", portrait: "aspect-[3/4]", photo: "aspect-[4/3]", banner: "aspect-[3/1]", tall: "aspect-[2/3]",
}

/**
 * The image placeholder every photo slot uses: an accent-tinted gradient mesh,
 * a seeded texture, the subject's icon and an optional caption. Deterministic
 * per slot, so it never flickers while you type.
 */
export function Placeholder({ seed, icon, label, aspect = "photo", className, children, iconless }: {
  seed: string; icon?: unknown; label?: string; aspect?: string; className?: string; children?: React.ReactNode; iconless?: boolean
}) {
  const ctx = React.useContext(InterpreterContext)
  const id = React.useId().replace(/:/g, "")
  const { blobs, pattern } = React.useMemo(() => {
    const r = rng(`ph|${ctx.seed}|${seed}`)
    return {
      blobs: Array.from({ length: 3 }, () => ({ x: r() * 100, y: r() * 100, size: 45 + r() * 55, o: 0.25 + r() * 0.35 })),
      pattern: Math.floor(r() * 4),
    }
  }, [ctx.seed, seed])
  return (
    <div className={cn("relative isolate grid w-full place-items-center overflow-hidden bg-muted", ASPECT[aspect] ?? ASPECT.photo, className)}>
      <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/40 via-primary/15 to-primary/5" />
      {blobs.map((b, i) => (
        <div key={i} className="absolute -z-10 rounded-full bg-primary blur-2xl" style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.size}%`, height: `${b.size}%`, opacity: b.o, transform: "translate(-50%, -50%)" }} />
      ))}
      {pattern < 3 && (
        <svg className="absolute inset-0 -z-10 size-full text-foreground/[0.08]" aria-hidden>
          <defs>
            <pattern id={`p${id}`} width="16" height="16" patternUnits="userSpaceOnUse" patternTransform={pattern === 1 ? "rotate(45)" : undefined}>
              {pattern === 0 ? <circle cx="2" cy="2" r="1.2" fill="currentColor" /> : pattern === 1 ? <path d="M0 0V16" stroke="currentColor" strokeWidth="1.5" /> : <path d="M16 0H0V16" fill="none" stroke="currentColor" />}
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill={`url(#p${id})`} />
        </svg>
      )}
      {!iconless && (
        <div className="grid size-11 place-items-center rounded-full bg-background/70 text-primary shadow-sm ring-1 ring-foreground/5 backdrop-blur">
          <Icon name={icon ?? "image"} className="size-5" />
        </div>
      )}
      {label && <span className="absolute bottom-2 left-2 max-w-[80%] truncate rounded-md bg-background/75 px-1.5 py-0.5 text-[11px] text-muted-foreground backdrop-blur">{label}</span>}
      {children}
    </div>
  )
}
