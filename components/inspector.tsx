"use client"

import * as React from "react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { RoundStat, UINode } from "@/lib/genui/types"

function flatten(n: UINode, out: UINode[] = []) {
  out.push(n)
  n.children.forEach((c) => flatten(c, out))
  return out
}

function strip(n: UINode): unknown {
  const { kind, props, children } = n
  return { kind, ...(Object.keys(props).length ? { props } : {}), ...(children.length ? { children: children.map(strip) } : {}) }
}

const pct = (p: number | null) => (p == null ? "n/a" : `${Math.round(p * 100)}%`)

export function Inspector({
  tree,
  rounds,
  onHover,
}: {
  tree: UINode | null
  rounds: RoundStat[]
  onHover: (id: string | null) => void
}) {
  const nodes = tree ? flatten(tree).filter((n) => n.decisions.length) : []
  const decisions = nodes.reduce((a, n) => a + n.decisions.length, 0)
  return (
    <Tabs defaultValue="decisions" className="flex h-full min-h-0 flex-col gap-0">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <TabsList>
          <TabsTrigger value="decisions">Decisions</TabsTrigger>
          <TabsTrigger value="tree">Tree</TabsTrigger>
        </TabsList>
        <span className="text-xs text-muted-foreground tabular-nums">{decisions} choices</span>
      </div>

      {rounds.length > 0 && (
        <div className="flex flex-wrap gap-1.5 border-b px-4 py-2.5">
          {rounds.map((r) => (
            <Badge key={r.round} variant="secondary" className="font-normal tabular-nums">
              Round {r.round} · {r.ms}ms · {r.questions}q{r.calls > 1 ? ` · ${r.calls} calls` : ""}
            </Badge>
          ))}
        </div>
      )}

      <TabsContent value="decisions" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-1 p-2">
            {nodes.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">Every choice Jev makes shows up here, with its probability and the runners-up.</p>
            )}
            {nodes.map((n) => (
              <div
                key={n.id}
                onMouseEnter={() => onHover(n.id)}
                onMouseLeave={() => onHover(null)}
                className="rounded-lg p-2 transition-colors hover:bg-muted/60"
              >
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="font-mono text-[11px] text-muted-foreground">{n.path || "root"}</span>
                  <span className="text-sm font-medium">{n.kind}</span>
                </div>
                <dl className="flex flex-col gap-1.5">
                  {n.decisions.map((d) => (
                    <div key={d.prop} className="grid grid-cols-[76px_minmax(0,1fr)_40px] items-center gap-2 text-xs">
                      <dt className="truncate text-muted-foreground">{d.prop}</dt>
                      <dd className="min-w-0">
                        <div className="truncate font-medium" title={d.alternatives.map((a) => `${a.option} ${pct(a.p)}`).join(" · ")}>
                          {d.choice}
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-foreground/70" style={{ width: pct(d.probability ?? 0) }} />
                        </div>
                        {d.alternatives[0] && (
                          <div className="mt-1 truncate text-[11px] text-muted-foreground">
                            next: {d.alternatives.slice(0, 2).map((a) => `${a.option} ${pct(a.p)}`).join(", ")}
                          </div>
                        )}
                        {d.note && <div className="mt-0.5 text-[11px] text-amber-700 dark:text-amber-400">{d.note}</div>}
                      </dd>
                      <span className={cn("text-right tabular-nums", (d.probability ?? 1) < 0.5 && "text-amber-700 dark:text-amber-400")}>
                        {pct(d.probability)}
                      </span>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="tree" className="min-h-0 flex-1">
        <ScrollArea className="h-full">
          <pre className="p-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
            {tree ? JSON.stringify(strip(tree), null, 2) : "The tree the interpreter renders appears here."}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
}
