"use client"

// The React interpreter: walks the tree Jev composed and renders each node with
// shadcn primitives. Nodes still being decided render as skeletons of their kind.

import * as React from "react"
import { cn } from "cn"
import {
  ArrowDownRight, ArrowUpRight, Check, CircleAlert, CircleCheck, Delete, Heart, Info, Minus, Paperclip, Pause,
  Play, Plus, Quote, Repeat, Search, SendHorizontal, Shuffle, SkipBack, SkipForward, SlidersHorizontal, Star,
  TriangleAlert, Volume2, X,
} from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis } from "recharts"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import * as B from "@/lib/genui/banks"
import {
  BOARD_CARDS, CHAT_SCRIPTS, FAQ_ANSWERS, FIELD_OPTIONS, FIELD_PLACEHOLDERS, PEOPLE, PRICE_RANGES, PROFILES,
  SWIPE_CARDS, TIMELINE_ENTRIES, TRACKS, axisLabels, between, cell, formatMetric, initials, kvValues, listItems,
  listings, metricValue, pick, rng, series, tierPrices,
} from "@/lib/genui/sample"
import { accentStyle } from "@/lib/genui/theme"
import type { UINode } from "@/lib/genui/types"
import { Icon } from "./icons"

type Ctx = { seed: string; brand: string; highlight: string | null; overlay: boolean }
const InterpreterContext = React.createContext<Ctx>({ seed: "", brand: "", highlight: null, overlay: false })

const str = (v: unknown, fallback = "") => (typeof v === "string" && v !== "none" ? v : fallback)
const arr = (v: unknown) => (Array.isArray(v) ? (v as string[]) : [])
/** Nested inside a card-like parent, a molecule drops its own card frame. */
const nested = (n: UINode) => n.path.split(".").length > 2 || n.depth >= 2

export function confidence(n: UINode) {
  const ps = n.decisions.map((d) => d.probability).filter((p): p is number => p != null)
  return ps.length ? Math.min(...ps) : 1
}

function useNode(node: UINode) {
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

export function Interpreter({ tree, seed, highlight, overlay = false }: { tree: UINode; seed: string; highlight: string | null; overlay?: boolean }) {
  const brand = str(tree.props.brand, "")
  const layout = str(tree.props.layout, "topbar")
  const nav = arr(tree.props.nav)
  const sections = (
    <>
      {tree.children.map((c) => <NodeView key={`${c.id}-${c.kind}`} node={c} />)}
      {Array.from({ length: tree.pendingSlots ? 3 : 0 }, (_, i) => (
        <Skeleton key={i} className={cn("w-full rounded-xl", i === 0 ? "h-40" : "h-28")} />
      ))}
    </>
  )
  const logo = (
    <div className="flex items-center gap-2 animate-in fade-in-0">
      <div className="grid size-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">{initials(brand || "A")}</div>
      <span className="truncate font-semibold tracking-tight">{brand}</span>
    </div>
  )

  let body: React.ReactNode
  if (layout === "bare" && !tree.pending) {
    body = <main className="flex min-h-[70svh] flex-col items-center justify-center gap-6 p-8">{sections}</main>
  } else if (layout === "sidebar" && !tree.pending) {
    body = (
      <div className="flex min-h-[70svh]">
        <aside className="hidden w-56 shrink-0 flex-col gap-1 border-r bg-muted/30 p-3 md:flex">
          <div className="mb-3 px-2 py-1.5">{logo}</div>
          {nav.map((item, i) => (
            <div key={item} className={cn("flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm", i === 0 ? "bg-background font-medium shadow-xs ring-1 ring-foreground/5" : "text-muted-foreground")}>
              <Icon name={B.NAV[item]} className="size-4" />
              {item}
            </div>
          ))}
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex h-14 items-center gap-3 border-b px-5">
            <span className="font-semibold tracking-tight md:hidden">{brand}</span>
            <span className="hidden text-sm font-medium md:block">{nav[0] ?? "Overview"}</span>
            <div className="ml-auto flex items-center gap-3">
              <InputGroup className="hidden w-56 sm:flex"><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput placeholder="Search" /></InputGroup>
              <Avatar className="size-7"><AvatarFallback className="text-[11px]">{initials(PEOPLE[0])}</AvatarFallback></Avatar>
            </div>
          </header>
          <main className="flex flex-col gap-6 p-5 sm:p-6">{sections}</main>
        </div>
      </div>
    )
  } else {
    body = (
      <>
        <header className="flex h-14 items-center gap-3 border-b px-5">
          {tree.pending ? <Skeleton className="h-5 w-32" /> : logo}
          <div className="ml-auto flex items-center gap-3">
            <Avatar className="size-7"><AvatarFallback className="text-[11px]">{initials(PEOPLE[0])}</AvatarFallback></Avatar>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 sm:p-8">{sections}</main>
      </>
    )
  }

  return (
    <InterpreterContext.Provider value={{ seed, brand, highlight, overlay }}>
      <div className="genui-preview min-h-full bg-background text-foreground" style={accentStyle(tree.props.accent)}>{body}</div>
    </InterpreterContext.Provider>
  )
}

/** Props still coming from a follow-up round (table columns, detail and settings rows). */
const awaiting = (n: UINode) =>
  (n.kind === "table" && !n.props.columns) || ((n.kind === "details" || n.kind === "settings") && !n.props.rows)

function NodeView({ node }: { node: UINode }) {
  if (node.pending || awaiting(node)) return <PendingView node={node} />
  const View = VIEWS[node.kind]
  return View ? <View node={node} /> : null
}

function Children({ node, className }: { node: UINode; className?: string }) {
  return (
    <>
      {node.children.map((c) => <NodeView key={`${c.id}-${c.kind}`} node={c} />)}
      {Array.from({ length: Math.min(node.pendingSlots, 3) }, (_, i) => (
        <Skeleton key={`s${i}`} className={cn("h-16 w-full rounded-lg", className)} />
      ))}
    </>
  )
}

const SMALL = new Set(["field", "toggle", "slider", "radio", "button", "separator", "badges", "heading", "price", "rating", "status", "segmented", "searchbox", "otp", "quantity"])
function PendingView({ node }: { node: UINode }) {
  if (node.kind === "grid" || node.kind === "stats" || node.kind === "features" || node.kind === "listings" || node.kind === "pricing") {
    return <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
  }
  if (SMALL.has(node.kind)) return <Skeleton className="h-9 w-full rounded-md" />
  return (
    <div className="flex min-h-40 flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="mt-auto h-full min-h-10 w-full flex-1" />
    </div>
  )
}

/** A molecule's frame: a titled card at section level, bare when nested in a card. */
function Frame({ node, title, action, children, className }: { node: UINode; title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
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

// ---------------------------------------------------------------------------
// Containers

const GRID_COLS: Record<number, string> = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4", 6: "sm:grid-cols-2 lg:grid-cols-3" }

function GridView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const n = Math.max(1, Math.min(4, node.children.length + Math.min(node.pendingSlots, 4)))
  return <div {...attrs} className={cn(attrs.className, "grid gap-4", GRID_COLS[n])}><Children node={node} className="h-28 rounded-xl" /></div>
}

const SPLIT: Record<string, string> = {
  "wide-left": "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
  equal: "lg:grid-cols-2",
  "wide-right": "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
}

function SplitView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={cn(attrs.className, "grid items-start gap-4", SPLIT[str(node.props.ratio, "wide-left")] ?? SPLIT["wide-left"])}><Children node={node} className="h-56 rounded-xl" /></div>
}

function TabsView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const first = node.children[0]?.id
  return (
    <div {...attrs}>
      <Tabs defaultValue={first} key={first}>
        <TabsList>
          {node.children.map((c) => (
            <TabsTrigger key={c.id} value={c.id}>
              {str(c.props.title) || str(c.props.metric) || B.LISTING_TITLES[str(c.props.items)] || c.kind[0].toUpperCase() + c.kind.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        {node.children.map((c) => <TabsContent key={c.id} value={c.id} className="mt-3"><NodeView node={c} /></TabsContent>)}
      </Tabs>
    </div>
  )
}

function CardView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
  return (
    <Card {...attrs} className={cn(attrs.className, "h-full")}>
      <CardHeader>
        <CardTitle>{str(p.title, "Overview")}</CardTitle>
        {str(p.description) && <CardDescription>{str(p.description)}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4"><Children node={node} /></CardContent>
      {str(p.action) && <CardFooter className="border-t py-3"><Button variant="outline" size="sm">{str(p.action)}</Button></CardFooter>}
    </Card>
  )
}

function RowView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={cn(attrs.className, "flex flex-wrap items-center gap-3")}><Children node={node} className="h-9 w-24" /></div>
}

// ---------------------------------------------------------------------------
// Marketing molecules

function HeroView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
  const subject = str(p.subject, "")
  const headline = str(p.headline, "Welcome").replace("{subject}", subject)
  const left = p.align === "left"
  return (
    <section {...attrs} className={cn(attrs.className, "grid items-center gap-8 rounded-2xl py-10 sm:py-14", left ? "lg:grid-cols-2" : "text-center")}>
      <div className={cn("flex flex-col gap-5", !left && "mx-auto max-w-2xl items-center")}>
        {subject && <Badge variant="secondary" className="w-fit">{subject}</Badge>}
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{headline}</h1>
        <p className="text-lg text-pretty text-muted-foreground">{str(p.subtitle).replace("{subject}", subject || "you")}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">{str(p.cta, "Get started")}</Button>
          {str(p.cta2) && <Button size="lg" variant="outline">{str(p.cta2)}</Button>}
        </div>
      </div>
      {left && <ImageBlock icon="sparkles" aspect="wide" />}
    </section>
  )
}

function FeaturesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const items = arr(node.props.items)
  return (
    <section {...attrs} className={cn(attrs.className, "grid gap-6 sm:grid-cols-2", items.length % 3 === 0 && "lg:grid-cols-3")}>
      {items.map((f) => <FeatureTile key={f} title={f} />)}
    </section>
  )
}

function FeatureTile({ title }: { title: string }) {
  const [icon, desc] = B.FEATURES[title] ?? ["sparkles", ""]
  return (
    <div className="flex flex-col gap-2">
      <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Icon name={icon} className="size-5" /></div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm text-pretty text-muted-foreground">{desc}</p>
    </div>
  )
}

function FeatureView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <Card {...attrs} className={cn(attrs.className, "px-4")}><FeatureTile title={str(node.props.feature, "Set up in minutes")} /></Card>
}

function PricingView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
  const tiers = B.TIER_PRESETS[str(p.tiers)] ?? ["Free", "Pro", "Team"]
  const period = str(p.period, "month")
  const prices = tierPrices(tiers, period)
  const features = arr(p.features)
  const highlight = tiers.length === 3 ? 1 : tiers.length - 1
  return (
    <section {...attrs} className={cn(attrs.className, "grid items-start gap-4", tiers.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>
      {tiers.map((t, i) => {
        const count = Math.max(2, Math.round((features.length * (i + 1)) / tiers.length))
        return (
          <Card key={t} className={cn("gap-5 px-5", i === highlight && "ring-2 ring-primary")}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{t}</span>
              {i === highlight && <Badge>Most popular</Badge>}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight">{prices[i]}</span>
              {prices[i] !== "Custom" && period !== "one-time" && <span className="text-sm text-muted-foreground">/ {period}</span>}
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {features.slice(0, count).map((f) => <li key={f} className="flex items-center gap-2"><Check className="size-4 text-primary" />{f}</li>)}
            </ul>
            <Button variant={i === highlight ? "default" : "outline"} className="w-full">{prices[i] === "Custom" ? "Contact sales" : str(p.cta, "Get started")}</Button>
          </Card>
        )
      })}
    </section>
  )
}

function TestimonialView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const person = pick(r, PEOPLE)
  return (
    <figure {...attrs} className={cn(attrs.className, "mx-auto flex max-w-2xl flex-col items-center gap-5 py-6 text-center")}>
      <Quote className="size-8 text-primary/60" />
      <blockquote className="text-xl font-medium text-balance sm:text-2xl">{str(node.props.quote, B.QUOTES[0])}</blockquote>
      <figcaption className="flex items-center gap-3">
        <Avatar><AvatarFallback className="text-xs">{initials(person)}</AvatarFallback></Avatar>
        <div className="text-left text-sm"><div className="font-medium">{person}</div><div className="text-muted-foreground">Customer since 2024</div></div>
      </figcaption>
    </figure>
  )
}

function CtaView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const { brand: subject } = React.useContext(InterpreterContext)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-10 text-center text-primary-foreground")}>
      <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{str(node.props.headline, "Ready to get started?").replace("{subject}", subject)}</h2>
      <Button variant="secondary" size="lg">{str(node.props.button, "Get started")}</Button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// App molecules

function StatsView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const metrics = arr(node.props.metrics)
  return (
    <div {...attrs} className={cn(attrs.className, "grid gap-4 sm:grid-cols-2", metrics.length >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
      {metrics.map((m, i) => <StatTile key={m} label={m} seed={`${node.path}|${i}`} />)}
    </div>
  )
}

function StatTile({ label, seed, bare }: { label: string; seed: string; bare?: boolean }) {
  const ctx = React.useContext(InterpreterContext)
  const r = React.useMemo(() => rng(`${ctx.seed}|${seed}`), [ctx.seed, seed])
  const { value, delta, good } = metricValue(r, label)
  const Up = delta >= 0 ? ArrowUpRight : ArrowDownRight
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary"><Icon name={B.METRICS[label]} className="size-4" /></div>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatMetric(label, value, true)}</div>
      <div className={cn("flex items-center gap-1 text-xs", good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
        <Up className="size-3.5" />
        <span className="tabular-nums">{Math.abs(delta).toFixed(1)}%</span>
        <span className="text-muted-foreground">vs last period</span>
      </div>
    </>
  )
  if (bare) return <div className="flex flex-col gap-1.5">{body}</div>
  return <Card className="gap-1.5 px-4">{body}</Card>
}

function BoardView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const pipeline = str(node.props.pipeline, "product work")
  const columns = B.PIPELINES[pipeline] ?? B.PIPELINES["product work"]
  const cards = BOARD_CARDS[pipeline] ?? BOARD_CARDS["product work"]
  let k = Math.floor(r() * 3)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      {str(node.props.title) && <h2 className="text-lg font-semibold tracking-tight">{str(node.props.title)}</h2>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col, ci) => {
          const n = [3, 2, 2, 1][ci] ?? 1
          return (
            <div key={col} className="flex flex-col gap-2 rounded-xl bg-muted/50 p-2.5">
              <div className="flex items-center justify-between px-1 text-sm font-medium">{col}<span className="text-xs text-muted-foreground">{n}</span></div>
              {Array.from({ length: n }, () => {
                const title = cards[k++ % cards.length]
                const person = pick(r, PEOPLE)
                return (
                  <div key={title} className="flex flex-col gap-2 rounded-lg bg-background p-3 text-sm shadow-xs ring-1 ring-foreground/5">
                    <span className="font-medium">{title}</span>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="font-normal">{pick(r, ["Design", "Bug", "Feature", "Urgent", "Research"])}</Badge>
                      <Avatar className="size-6"><AvatarFallback className="text-[10px]">{initials(person)}</AvatarFallback></Avatar>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </section>
  )
}

function ChatView({ node }: { node: UINode }) {
  const persona = str(node.props.persona, "support")
  const lines = CHAT_SCRIPTS[persona] ?? CHAT_SCRIPTS.support
  const other = persona === "assistant" ? "Assistant" : persona === "team" ? "#general" : PEOPLE[2]
  return (
    <Frame node={node} className="flex flex-col gap-3">
      <div className="flex items-center gap-3 border-b pb-3">
        <Avatar className="size-8"><AvatarFallback className="text-xs">{persona === "assistant" ? "AI" : initials(other)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1"><div className="text-sm font-medium">{str(node.props.title, other)}</div><div className="text-xs text-emerald-600 dark:text-emerald-400">Online</div></div>
      </div>
      <div className="flex flex-col gap-2.5 py-1">
        {lines.map((l, i) => (
          <div key={i} className={cn("max-w-[80%] rounded-2xl px-3.5 py-2 text-sm", l.me ? "self-end rounded-br-sm bg-primary text-primary-foreground" : "self-start rounded-bl-sm bg-muted")}>{l.text}</div>
        ))}
      </div>
      <InputGroup>
        <InputGroupAddon><Paperclip /></InputGroupAddon>
        <InputGroupInput placeholder="Write a message..." />
        <InputGroupAddon align="inline-end"><Button size="icon-sm" className="rounded-full"><SendHorizontal /></Button></InputGroupAddon>
      </InputGroup>
    </Frame>
  )
}

function PlayerView({ node }: { node: UINode }) {
  const media = str(node.props.media, "music")
  const tracks = TRACKS[media] ?? TRACKS.music
  const [playing, setPlaying] = React.useState(false)
  const icon = { music: "music", podcast: "mic", audiobook: "book", video: "video" }[media]
  return (
    <Frame node={node} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="grid aspect-square w-full place-items-center rounded-xl bg-linear-to-br from-primary/40 via-primary/15 to-muted sm:w-40"><Icon name={icon} className="size-12 text-primary" /></div>
        <div className="flex flex-1 flex-col gap-3">
          <div><div className="text-lg font-semibold tracking-tight">{tracks[0].title}</div><div className="text-sm text-muted-foreground">{tracks[0].by}</div></div>
          <Slider defaultValue={[34]} />
          <div className="flex justify-between text-xs text-muted-foreground tabular-nums"><span>1:14</span><span>{tracks[0].length}</span></div>
          <div className="flex items-center justify-center gap-2">
            <Button variant="ghost" size="icon"><Shuffle /></Button>
            <Button variant="ghost" size="icon"><SkipBack /></Button>
            <Button size="icon-lg" className="rounded-full" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause /> : <Play />}</Button>
            <Button variant="ghost" size="icon"><SkipForward /></Button>
            <Button variant="ghost" size="icon"><Repeat /></Button>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-muted-foreground"><Volume2 className="size-4" /><Slider defaultValue={[70]} className="max-w-40" /></div>
      <ul className="flex flex-col divide-y border-t pt-1">
        {tracks.slice(1).map((t, i) => (
          <li key={t.title} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-4 text-muted-foreground tabular-nums">{i + 2}</span>
            <span className="flex-1 truncate">{t.title}</span>
            <span className="text-muted-foreground tabular-nums">{t.length}</span>
          </li>
        ))}
      </ul>
    </Frame>
  )
}

function ProfileView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const prof = PROFILES[str(node.props.persona, "professional")] ?? PROFILES.professional
  return (
    <Card {...attrs} className={cn(attrs.className, "overflow-hidden pt-0")}>
      <div className="h-24 bg-linear-to-r from-primary/40 via-primary/20 to-muted" />
      <div className="-mt-10 flex flex-col gap-4 px-5 sm:flex-row sm:items-end">
        <Avatar className="size-20 ring-4 ring-card"><AvatarFallback className="text-xl">{initials(prof.name.replace("Dr. ", ""))}</AvatarFallback></Avatar>
        <div className="flex-1">
          <div className="text-xl font-semibold tracking-tight">{prof.name}</div>
          <div className="text-sm text-muted-foreground">{prof.role} · {prof.location}</div>
        </div>
        <div className="flex gap-2">
          <Button>{str(node.props.action, "Follow")}</Button>
          <Button variant="outline">Message</Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 border-t px-5 pt-4">
        {prof.stats.map(([k, v]) => <div key={k}><div className="text-lg font-semibold tabular-nums">{v}</div><div className="text-xs text-muted-foreground">{k}</div></div>)}
      </div>
    </Card>
  )
}

function DetailsView({ node }: { node: UINode }) {
  const { r } = useNode(node)
  const rows = arr(node.props.rows)
  const values = kvValues(r, rows)
  return (
    <Frame node={node} title={str(node.props.title, "Details")}>
      <dl className="flex flex-col gap-2.5 text-sm">
        {rows.map((k) => (
          <div key={k} className={cn("flex items-center justify-between gap-4", k === "Total" && "border-t pt-2.5 text-base font-semibold")}>
            <dt className={cn(k !== "Total" && "text-muted-foreground")}>{k}</dt>
            <dd className="text-right tabular-nums">{values[k]}</dd>
          </div>
        ))}
      </dl>
    </Frame>
  )
}

function ListingsView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const n = Number(str(node.props.count, "3")) || 3
  const items = listings(r, str(node.props.items, "products"), n)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      <h2 className="text-lg font-semibold tracking-tight">{str(node.props.title) || B.LISTING_TITLES[str(node.props.items, "products")]}</h2>
      <div className={cn("grid gap-4 sm:grid-cols-2", n === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3")}>
        {items.map((it, i) => <MediaCard key={i} item={it} />)}
      </div>
    </section>
  )
}

function MediaCard({ item }: { item: ReturnType<typeof listings>[number] }) {
  return (
    <Card className="gap-3 overflow-hidden pt-0">
      <div className="relative grid aspect-4/3 place-items-center bg-linear-to-br from-primary/25 via-primary/10 to-muted">
        <Icon name={item.icon} className="size-9 text-primary/70" />
        {item.badge && <Badge className="absolute top-2.5 left-2.5">{item.badge}</Badge>}
        <button type="button" className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground"><Heart className="size-4" /></button>
      </div>
      <div className="flex flex-col gap-1 px-4">
        <div className="flex items-start justify-between gap-2">
          <span className="font-medium">{item.title}</span>
          {item.rating && <span className="flex shrink-0 items-center gap-1 text-sm"><Star className="size-3.5 fill-current text-amber-500" />{item.rating}</span>}
        </div>
        <span className="text-sm text-muted-foreground">{item.meta}</span>
        {item.price && <span className="mt-1 font-semibold">{item.price}</span>}
      </div>
    </Card>
  )
}

function MediaView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const [item] = listings(r, str(node.props.items, "products"), 1)
  return <div {...attrs} className={attrs.className}><MediaCard item={item} /></div>
}

function SearchView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const scope = str(node.props.scope, "everything")
  const filters = arr(node.props.filters)
  return (
    <div {...attrs} className={cn(attrs.className, "flex flex-col gap-3 sm:flex-row sm:items-center")}>
      <InputGroup className="h-10 flex-1"><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput placeholder={`Search ${scope}...`} /></InputGroup>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => <Button key={f} variant="outline" size="sm" className="h-10">{f}</Button>)}
        <Button variant="ghost" size="icon" className="size-10"><SlidersHorizontal /></Button>
      </div>
    </div>
  )
}

function SettingsView({ node }: { node: UINode }) {
  const { r } = useNode(node)
  const rows = arr(node.props.rows)
  const on = React.useMemo(() => rows.map(() => r() > 0.4), [r, rows])
  return (
    <Frame node={node} title={str(node.props.title, "Settings")}>
      <div className="flex flex-col divide-y">
        {rows.map((row, i) => (
          <Field key={row} orientation="horizontal" className="justify-between gap-6 py-3 first:pt-0 last:pb-0">
            <div className="flex flex-col gap-0.5"><FieldLabel htmlFor={`${node.id}-${i}`}>{row}</FieldLabel><span className="text-sm text-muted-foreground">{B.SETTINGS_ROWS[row]}</span></div>
            <Switch id={`${node.id}-${i}`} defaultChecked={on[i]} />
          </Field>
        ))}
      </div>
    </Frame>
  )
}

function StepsView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const steps = B.FLOWS[str(node.props.flow, "checkout")] ?? B.FLOWS.checkout
  const current = Math.min(steps.length, Math.max(1, Number(str(node.props.current, "2")) || 2)) - 1
  return (
    <ol {...attrs} className={cn(attrs.className, "flex items-center gap-2")}>
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2">
          <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs font-medium", i < current ? "bg-primary text-primary-foreground" : i === current ? "ring-2 ring-primary text-primary" : "bg-muted text-muted-foreground")}>
            {i < current ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span className={cn("hidden text-sm sm:block", i === current ? "font-medium" : "text-muted-foreground")}>{s}</span>
          {i < steps.length - 1 && <div className={cn("h-px flex-1", i < current ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  )
}

function TimelineView({ node }: { node: UINode }) {
  const entries = TIMELINE_ENTRIES[str(node.props.story, "project activity")] ?? TIMELINE_ENTRIES["project activity"]
  return (
    <Frame node={node} title={str(node.props.title, "Activity")}>
      <ol className="relative flex flex-col gap-5 border-l pl-5">
        {entries.map(([t, m], i) => (
          <li key={t} className="relative">
            <span className={cn("absolute top-1 -left-[25px] size-2.5 rounded-full ring-4 ring-card", i === 0 ? "bg-primary" : "bg-muted-foreground/40")} />
            <div className="text-sm font-medium">{t}</div>
            <div className="text-xs text-muted-foreground">{m}</div>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

function EmptyView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const [icon, title, body, action] = B.EMPTY_SCENARIOS[str(node.props.scenario, "no results")] ?? B.EMPTY_SCENARIOS["no results"]
  const big = title === "Page not found"
  return (
    <div {...attrs} className={cn(attrs.className, "flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center")}>
      {big ? <div className="text-6xl font-semibold tracking-tight text-primary">404</div> : <div className="grid size-12 place-items-center rounded-full bg-muted"><Icon name={icon} className="size-6 text-muted-foreground" /></div>}
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      <Button variant={big ? "default" : "outline"} className="mt-2">{action}</Button>
    </div>
  )
}

function SwipeView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const subject = str(node.props.subject, "people")
  const [card] = SWIPE_CARDS[subject] ?? SWIPE_CARDS.people
  return (
    <div {...attrs} className={cn(attrs.className, "mx-auto flex w-full max-w-sm flex-col items-center gap-5")}>
      <div className="relative w-full">
        <div className="absolute inset-x-4 -bottom-2 h-full rounded-2xl bg-muted ring-1 ring-foreground/5" />
        <Card className="relative gap-0 overflow-hidden py-0">
          <div className="grid aspect-3/4 place-items-center bg-linear-to-br from-primary/35 via-primary/15 to-muted"><Icon name={card.icon} className="size-16 text-primary/80" /></div>
          <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-linear-to-t from-black/70 to-transparent p-5 text-white">
            <div className="text-2xl font-semibold">{card.title}</div>
            <div className="text-sm text-white/80">{card.meta}</div>
            <div className="flex flex-wrap gap-1.5">{card.tags.map((t) => <span key={t} className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs backdrop-blur">{t}</span>)}</div>
          </div>
        </Card>
      </div>
      <div className="flex items-center gap-5">
        <Button variant="outline" size="icon-lg" className="size-14 rounded-full"><X className="size-6" /></Button>
        <Button size="icon-lg" className="size-16 rounded-full"><Heart className="size-7" /></Button>
        <Button variant="outline" size="icon-lg" className="size-14 rounded-full"><Star className="size-6" /></Button>
      </div>
    </div>
  )
}

function KeypadView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const mode = str(node.props.mode, "calculator")
  const [display, setDisplay] = React.useState(mode === "calculator" ? "128 × 3" : mode === "tip calculator" ? "$86.40" : "")
  const keys = mode === "calculator"
    ? ["C", "±", "%", "÷", "7", "8", "9", "×", "4", "5", "6", "−", "1", "2", "3", "+", "0", ".", "⌫", "="]
    : ["1", "2", "3", "4", "5", "6", "7", "8", "9", mode === "phone dialer" ? "*" : "", "0", "⌫"]
  const press = (k: string) => {
    if (k === "C") return setDisplay("")
    if (k === "⌫") return setDisplay((d) => d.slice(0, -1))
    if (k === "=") {
      try {
        setDisplay(calc(display))
      } catch {
        setDisplay("Error")
      }
      return
    }
    if (k && k !== "±" && k !== "%") setDisplay((d) => d + (/[+×÷−]/.test(k) ? ` ${k} ` : k))
  }
  return (
    <Card {...attrs} className={cn(attrs.className, "mx-auto w-full max-w-xs gap-3 px-4")}>
      {mode === "tip calculator" && (
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Tip</span><ToggleGroup defaultValue={["20%"]} variant="outline" size="sm">{["15%", "18%", "20%"].map((t) => <ToggleGroupItem key={t} value={t}>{t}</ToggleGroupItem>)}</ToggleGroup></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Split between</span><span>4 people</span></div>
          <div className="flex justify-between text-base font-semibold"><span>Each pays</span><span>$25.92</span></div>
        </div>
      )}
      <div className={cn("rounded-lg bg-muted px-4 py-3 text-right font-mono tabular-nums", mode === "PIN pad" ? "text-center text-2xl tracking-[0.5em]" : "text-3xl")}>
        {mode === "PIN pad" ? "•".repeat(display.length).padEnd(4, "○") : display || "0"}
      </div>
      <div className={cn("grid gap-2", mode === "calculator" ? "grid-cols-4" : "grid-cols-3")}>
        {keys.map((k, i) => k ? (
          <Button key={i} variant={/[÷×−+=]/.test(k) ? "default" : "secondary"} className="h-12 text-lg" onClick={() => press(k)}>
            {k === "⌫" ? <Delete /> : k}
          </Button>
        ) : <span key={i} />)}
      </div>
      {mode === "phone dialer" && <Button className="h-12 rounded-full bg-emerald-600 text-white hover:bg-emerald-600/90">Call</Button>}
    </Card>
  )
}

/** Evaluates "12 × 3 + 4" with the usual precedence; no eval. */
function calc(input: string): string {
  const tokens = input.split(" ").filter(Boolean)
  const nums: number[] = []
  const ops: string[] = []
  for (const t of tokens) {
    if (/^[+−×÷]$/.test(t)) ops.push(t)
    else if (!Number.isNaN(Number(t))) nums.push(Number(t))
    else return "Error"
  }
  if (nums.length !== ops.length + 1) return "Error"
  const n = [nums[0]]
  const o: string[] = []
  ops.forEach((op, i) => {
    if (op === "×") n[n.length - 1] *= nums[i + 1]
    else if (op === "÷") n[n.length - 1] /= nums[i + 1]
    else {
      o.push(op)
      n.push(nums[i + 1])
    }
  })
  const v = o.reduce((acc, op, i) => (op === "+" ? acc + n[i + 1] : acc - n[i + 1]), n[0])
  return Number.isFinite(v) ? String(+v.toFixed(8)) : "Error"
}

const FORECAST_DAYS = ["Today", "Thu", "Fri", "Sat", "Sun"]
const FORECAST_HOURS = ["Now", "1 PM", "2 PM", "3 PM", "4 PM"]
const SKIES: [icon: string, label: string][] = [["sun", "Sunny"], ["cloud", "Partly cloudy"], ["cloud-rain", "Showers"], ["sun", "Clear"], ["cloud", "Cloudy"]]

function ForecastView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const hourly = node.props.range === "hourly"
  const data = React.useMemo(() => {
    const base = Math.round(between(r, 72, 88))
    return (hourly ? FORECAST_HOURS : FORECAST_DAYS).map((label, i) => {
      const sky = SKIES[Math.floor(r() * SKIES.length)]
      const hi = base + Math.round(between(r, -3, 4)) + (hourly ? i : 0)
      return { label, sky, hi, lo: hi - Math.round(between(r, 6, 11)), rain: Math.round(between(r, 0, 70)) }
    })
  }, [r, hourly])
  const now = data[0]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-sm text-muted-foreground">{hourly ? "Next hours" : "This week"}</div>
          <div className="text-5xl font-semibold tracking-tight tabular-nums">{now.hi}°</div>
          <div className="text-sm text-muted-foreground">{now.sky[1]} · H {now.hi}° L {now.lo}°</div>
        </div>
        <Icon name={now.sky[0]} className="size-16 text-primary" />
      </div>
      <div className="grid grid-cols-5 gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex flex-col items-center gap-1.5 rounded-xl bg-muted/50 py-3 text-sm">
            <span className="text-muted-foreground">{d.label}</span>
            <Icon name={d.sky[0]} className="size-5 text-primary" />
            <span className="font-medium tabular-nums">{d.hi}°</span>
            <span className="text-xs text-muted-foreground tabular-nums">{hourly ? `${d.rain}%` : `${d.lo}°`}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PersonView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const prof = PROFILES[str(node.props.persona, "professional")] ?? PROFILES.professional
  return (
    <Card {...attrs} className={cn(attrs.className, "items-center gap-3 px-4 text-center")}>
      <Avatar className="size-14"><AvatarFallback>{initials(prof.name.replace("Dr. ", ""))}</AvatarFallback></Avatar>
      <div><div className="font-medium">{prof.name}</div><div className="text-sm text-muted-foreground">{prof.role}</div></div>
      <Button variant="outline" size="sm">{str(node.props.action, "Follow")}</Button>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Forms and data

function FormView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
  const controls = arr(p.controls)
  const types = Object.fromEntries(B.CONTROLS)
  const standalone = node.depth === 1
  return (
    <Card {...attrs} className={cn(attrs.className, standalone && "mx-auto w-full max-w-md")}>
      <CardHeader>
        <CardTitle className="text-lg">{str(p.title, "Get started")}</CardTitle>
        {str(p.description) && <CardDescription>{str(p.description)}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <FieldGroup className="gap-4">
            {controls.map((c) => <Control key={c} id={`${node.id}-${c}`} label={c} type={types[c] ?? "field"} />)}
            <Button type="submit" className="w-full">{str(p.submit, "Submit")}</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

const SELECTS = new Set(Object.keys(FIELD_OPTIONS))
const TEXTAREAS = new Set(["Message", "Notes", "Bio", "Description"])
const DATES = new Set(["Date", "Date of birth", "Due date", "Start date", "End date"])

function Control({ id, label, type }: { id: string; label: string; type: string }) {
  if (type === "toggle") {
    if (B.CHECKBOX_TOGGLES.has(label)) {
      return <Field orientation="horizontal"><Checkbox id={id} defaultChecked={label === "Remember me"} /><FieldLabel htmlFor={id} className="font-normal">{label}</FieldLabel></Field>
    }
    return <Field orientation="horizontal" className="justify-between"><FieldLabel htmlFor={id}>{label}</FieldLabel><Switch id={id} defaultChecked /></Field>
  }
  if (type === "radio") {
    const options = B.RADIOS[label] ?? ["Option A", "Option B"]
    return (
      <FieldSet>
        <FieldLegend variant="label">{label}</FieldLegend>
        <RadioGroup defaultValue={options[0]} className="flex flex-wrap gap-4">
          {options.map((o) => <Field key={o} orientation="horizontal" className="w-auto"><RadioGroupItem value={o} id={`${id}-${o}`} /><FieldLabel htmlFor={`${id}-${o}`} className="font-normal">{o}</FieldLabel></Field>)}
        </RadioGroup>
      </FieldSet>
    )
  }
  if (type === "slider") return <SliderControl label={label} start={50} />
  let control: React.ReactNode
  if (SELECTS.has(label)) {
    control = (
      <NativeSelect id={id} className="w-full" defaultValue="">
        <NativeSelectOption value="" disabled>Select {label.toLowerCase()}</NativeSelectOption>
        {FIELD_OPTIONS[label].map((o) => <NativeSelectOption key={o} value={o}>{o}</NativeSelectOption>)}
      </NativeSelect>
    )
  } else if (TEXTAREAS.has(label)) {
    control = <Textarea id={id} placeholder={label === "Message" ? "Tell us a little about what you need" : ""} />
  } else {
    const t = label === "Email" ? "email" : label.includes("assword") ? "password" : DATES.has(label) ? "date" : label === "Time" ? "time" : "text"
    control = <Input id={id} type={t} placeholder={t === "password" ? "••••••••" : FIELD_PLACEHOLDERS[label] ?? ""} />
  }
  return <Field><FieldLabel htmlFor={id}>{label}</FieldLabel>{control}</Field>
}

function SliderControl({ label, start }: { label: string; start: number }) {
  const [v, setV] = React.useState(start)
  return (
    <Field>
      <div className="flex items-center justify-between"><FieldLabel>{label}</FieldLabel><span className="text-sm text-muted-foreground tabular-nums">{v}</span></div>
      <Slider value={[v]} onValueChange={(x) => setV(Array.isArray(x) ? x[0] : x)} />
    </Field>
  )
}

const X_CAPTION: Record<string, string> = {
  months: "Last 7 months", weeks: "Last 8 weeks", weekdays: "This week", hours: "Today",
  regions: "By region", channels: "By channel", products: "By product line",
}

function ChartView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const p = node.props
  const metric = str(p.metric, "Revenue")
  const type = str(p.type, "area")
  const x = str(p.x, "months")
  const labels = React.useMemo(() => axisLabels(x), [x])
  const compare = p.compare === "compare" && type !== "pie"
  // Memoized so re-renders during streaming do not restart recharts' entrance animation.
  const { cur, data } = React.useMemo(() => {
    const cur = series(r, metric, labels.length)
    const data = labels.map((label, i) => ({ label, value: cur[i], previous: +(cur[i] * (0.72 + r() * 0.2)).toFixed(2) }))
    return { cur, data }
  }, [r, metric, labels])
  const total = cur.reduce((a, b) => a + b, 0)
  const config = { value: { label: metric, color: "var(--chart-1)" }, previous: { label: "Previous period", color: "var(--chart-2)" } } satisfies ChartConfig
  const tick = { tickLine: false, axisLine: false, tickMargin: 8 } as const

  let chart: React.ReactElement
  if (type === "pie") {
    chart = (
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="label" innerRadius="55%" strokeWidth={2}>{data.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}</Pie>
      </PieChart>
    )
  } else if (type === "bar") {
    chart = (
      <BarChart data={data}>
        <CartesianGrid vertical={false} /><XAxis dataKey="label" {...tick} /><ChartTooltip content={<ChartTooltipContent />} />
        {compare && <Bar dataKey="previous" fill="var(--color-previous)" radius={4} />}
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    )
  } else if (type === "line") {
    chart = (
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} /><XAxis dataKey="label" {...tick} /><ChartTooltip content={<ChartTooltipContent />} />
        {compare && <Line dataKey="previous" stroke="var(--color-previous)" strokeWidth={2} dot={false} strokeDasharray="4 4" />}
        <Line dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
      </LineChart>
    )
  } else {
    chart = (
      <AreaChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} /><XAxis dataKey="label" {...tick} /><ChartTooltip content={<ChartTooltipContent />} />
        {compare && <Area dataKey="previous" stroke="var(--color-previous)" fill="var(--color-previous)" fillOpacity={0.1} strokeDasharray="4 4" />}
        <Area dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.25} strokeWidth={2} />
      </AreaChart>
    )
  }
  const body = <ChartContainer config={config} className={cn("w-full", node.depth >= 2 ? "h-36" : "h-60", type === "pie" && "mx-auto aspect-square h-56")}>{chart}</ChartContainer>
  if (nested(node)) return <div {...attrs}>{body}</div>
  return (
    <Card {...attrs} className={cn(attrs.className, "h-full")}>
      <CardHeader>
        <CardDescription>{metric}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{formatMetric(metric, type === "pie" || /rate|index|rating|uptime|temperature|humidity|latency|time/i.test(metric) ? cur[cur.length - 1] : total, true)}</CardTitle>
        <CardAction><Badge variant="outline">{X_CAPTION[x]}</Badge></CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

function TableView({ node }: { node: UINode }) {
  const { r } = useNode(node)
  const cols = arr(node.props.columns)
  const rows = React.useMemo(() => Array.from({ length: 5 }, (_, i) => cols.map((c) => cell(r, c, i))), [r, cols])
  return (
    <Frame node={node} title={str(node.props.title, "Records")} action={<Button variant="ghost" size="sm">View all</Button>}>
      <Table>
        <TableHeader><TableRow>{cols.map((c, i) => <TableHead key={c} className={cn(i === cols.length - 1 && cols.length > 2 && "text-right")}>{c}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              {row.map((c, j) => <TableCell key={j} className={cn(j === 0 && "font-medium", j === row.length - 1 && row.length > 2 && "text-right")}>{c.badge ? <Badge variant={c.badge}>{c.text}</Badge> : c.text}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Frame>
  )
}

const LIST_ICON: Record<string, string> = { holdings: "wallet", files: "file", notifications: "bell", events: "calendar", products: "package", transactions: "receipt", apps: "layout-grid", services: "server", tracks: "music" }

function ListView({ node }: { node: UINode }) {
  const { r } = useNode(node)
  const kind = B.LIST_KINDS[str(node.props.title)]?.[0] ?? str(node.props.items, "people")
  const items = React.useMemo(() => listItems(r, kind), [r, kind])
  return (
    <Frame node={node} title={str(node.props.title, "Recent activity")}>
      <ul className="flex flex-col divide-y">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            {kind === "tasks" ? <Checkbox defaultChecked={it.done} />
              : it.avatar ? <Avatar className="size-8"><AvatarFallback className="text-xs">{it.avatar}</AvatarFallback></Avatar>
              : <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted"><Icon name={LIST_ICON[kind]} className="size-4 text-muted-foreground" /></div>}
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", it.done && "text-muted-foreground line-through")}>{it.title}</p>
              <p className="truncate text-xs text-muted-foreground">{it.meta}</p>
            </div>
            {it.trailing && kind === "apps" ? <Button variant="outline" size="sm">{it.trailing}</Button>
              : it.trailing && kind === "services" ? <span className={cn("flex items-center gap-1.5 text-xs", it.positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}><span className="size-2 rounded-full bg-current" />{it.trailing}</span>
              : it.trailing && <span className={cn("text-sm tabular-nums", it.positive === true && "text-emerald-600 dark:text-emerald-400", it.positive === undefined && "text-muted-foreground")}>{it.trailing}</span>}
          </li>
        ))}
      </ul>
    </Frame>
  )
}

function AccordionView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const qs = arr(node.props.questions)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      <h2 className="text-xl font-semibold tracking-tight">{str(node.props.title, "Frequently asked questions")}</h2>
      <Accordion className="rounded-xl ring-1 ring-foreground/10">
        {qs.map((q) => (
          <AccordionItem key={q} value={q} className="px-4">
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{FAQ_ANSWERS[q] ?? "We would be happy to help. Get in touch any time."}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}

const TONES = {
  info: { icon: Info, text: "Here is something worth knowing before you continue.", cls: "" },
  success: { icon: CircleCheck, text: "Everything went through as expected.", cls: "text-emerald-700 dark:text-emerald-400 *:data-[slot=alert-description]:text-emerald-700/80 dark:*:data-[slot=alert-description]:text-emerald-400/80" },
  warning: { icon: TriangleAlert, text: "Take a look when you have a moment.", cls: "text-amber-700 dark:text-amber-400 *:data-[slot=alert-description]:text-amber-700/80 dark:*:data-[slot=alert-description]:text-amber-400/80" },
  error: { icon: CircleAlert, text: "Please review and try again.", cls: "" },
} as const

function AlertView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const t = B.ALERTS[str(node.props.title)] ?? str(node.props.tone, "info")
  const tone = (t in TONES ? t : "info") as keyof typeof TONES
  const T = TONES[tone]
  return (
    <Alert {...attrs} variant={tone === "error" ? "destructive" : "default"} className={cn(attrs.className, T.cls)}>
      <T.icon /><AlertTitle>{str(node.props.title, "Heads up")}</AlertTitle><AlertDescription>{T.text}</AlertDescription>
    </Alert>
  )
}

function CalendarView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const [date, setDate] = React.useState<Date | undefined>(new Date(2026, 8, 25))
  return (
    <div {...attrs} className={cn(attrs.className, "flex justify-center")}>
      <Calendar mode="single" selected={date} onSelect={setDate} defaultMonth={new Date(2026, 8, 1)} className="rounded-xl ring-1 ring-foreground/10" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Atoms

function HeadingView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <h2 {...attrs} className={cn(attrs.className, "text-xl font-semibold tracking-tight")}>{str(node.props.text, "Overview")}</h2>
}

function StatView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><StatTile label={str(node.props.label, "Revenue")} seed={node.path} bare={nested(node)} /></div>
}

function TextView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <p {...attrs} className={cn(attrs.className, "text-sm leading-relaxed text-pretty text-muted-foreground")}>{str(node.props.body)}</p>
}

function ProgressView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const v = React.useMemo(() => Math.round(30 + r() * 65), [r])
  return <Progress {...attrs} value={v} className={attrs.className}><ProgressLabel>{str(node.props.label, "Goal")}</ProgressLabel><ProgressValue /></Progress>
}

function FieldView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><Control id={`f-${node.id}`} label={str(node.props.label, "Name")} type="field" /></div>
}

function ToggleView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><Control id={`t-${node.id}`} label={str(node.props.label, "Notifications")} type="toggle" /></div>
}

function SliderView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><SliderControl label={str(node.props.label, "Amount")} start={60} /></div>
}

function RadioView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><Control id={`r-${node.id}`} label={str(node.props.group, "Plan")} type="radio" /></div>
}

function ButtonView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const variant = (["default", "outline", "ghost", "destructive"] as const).find((v) => v === node.props.variant) ?? "default"
  return <Button {...attrs} variant={variant} size={node.depth === 1 ? "lg" : "default"} className={cn(attrs.className, "w-fit", node.depth === 1 && "self-center")}>{str(node.props.label, "Continue")}</Button>
}

function BadgesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={cn(attrs.className, "flex flex-wrap gap-2")}>{arr(node.props.tags).map((t, i) => <Badge key={t} variant={i === 0 ? "default" : "secondary"}>{t}</Badge>)}</div>
}

function AvatarsView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const start = React.useMemo(() => Math.floor(r() * 8), [r])
  return (
    <div {...attrs} className={cn(attrs.className, "flex items-center gap-3")}>
      <AvatarGroup>
        {PEOPLE.slice(start, start + 4).map((p) => <Avatar key={p}><AvatarFallback className="text-xs">{initials(p)}</AvatarFallback></Avatar>)}
        <AvatarGroupCount className="text-xs">+{start + 5}</AvatarGroupCount>
      </AvatarGroup>
    </div>
  )
}

const ASPECT: Record<string, string> = { wide: "aspect-video", square: "aspect-square", portrait: "aspect-[3/4]" }
function ImageBlock({ icon, aspect, className }: { icon: unknown; aspect: unknown; className?: string }) {
  return (
    <div className={cn("grid w-full place-items-center overflow-hidden rounded-xl bg-linear-to-br from-primary/25 via-primary/10 to-muted", ASPECT[str(aspect, "wide")] ?? ASPECT.wide, className)}>
      <Icon name={icon} className="size-10 text-primary/70" />
    </div>
  )
}

function ImageView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><ImageBlock icon={node.props.icon} aspect={node.props.aspect} className={cn(nested(node) && "max-h-40")} /></div>
}

function SeparatorView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <Separator {...attrs} />
}

function PriceView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const [lo, hi] = PRICE_RANGES[str(node.props.tier, "mid")] ?? PRICE_RANGES.mid
  const v = React.useMemo(() => Math.round(between(r, lo, hi)), [r, lo, hi])
  const period = str(node.props.period, "one-time")
  return (
    <div {...attrs} className={cn(attrs.className, "flex items-baseline gap-1")}>
      <span className="text-3xl font-semibold tracking-tight tabular-nums">${v.toLocaleString("en-US")}</span>
      {period !== "one-time" && <span className="text-sm text-muted-foreground">/ {period}</span>}
    </div>
  )
}

function RatingView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const { score, count } = React.useMemo(() => ({ score: +between(r, 4.2, 4.95).toFixed(1), count: Math.round(between(r, 40, 3200)) }), [r])
  return (
    <div {...attrs} className={cn(attrs.className, "flex items-center gap-2 text-sm")}>
      <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-4", i < Math.round(score) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />)}</div>
      <span className="font-medium">{score}</span><span className="text-muted-foreground">({count.toLocaleString("en-US")} reviews)</span>
    </div>
  )
}

const STATE_COLOR: Record<string, string> = { Online: "bg-emerald-500", Operational: "bg-emerald-500", "In stock": "bg-emerald-500", "Open now": "bg-emerald-500", Live: "bg-emerald-500", Busy: "bg-amber-500", Degraded: "bg-amber-500", Draft: "bg-muted-foreground", Offline: "bg-muted-foreground", Closed: "bg-muted-foreground", Outage: "bg-rose-500", "Sold out": "bg-rose-500" }
function StatusView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const s = str(node.props.state, "Online")
  return <div {...attrs} className={cn(attrs.className, "flex items-center gap-2 text-sm")}><span className={cn("size-2 rounded-full", STATE_COLOR[s] ?? "bg-emerald-500")} />{s}</div>
}

function SegmentedView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const opts = B.SEGMENTS[str(node.props.options)] ?? B.SEGMENTS["Day, Week, Month"]
  return (
    <div {...attrs} className={attrs.className}>
      <ToggleGroup defaultValue={[opts[0]]} variant="outline" size="sm">{opts.map((o) => <ToggleGroupItem key={o} value={o}>{o}</ToggleGroupItem>)}</ToggleGroup>
    </div>
  )
}

function SearchboxView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return (
    <div {...attrs} className={cn(attrs.className, "w-full max-w-md")}>
      <InputGroup><InputGroupAddon><Search /></InputGroupAddon><InputGroupInput placeholder={`Search ${str(node.props.scope, "everything")}...`} /></InputGroup>
    </div>
  )
}

function OtpView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return (
    <div {...attrs} className={cn(attrs.className, "flex flex-col items-center gap-3")}>
      <span className="text-sm text-muted-foreground">Enter the 6-digit code we sent you</span>
      <InputOTP maxLength={6}>
        <InputOTPGroup>{[0, 1, 2].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup>{[3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}</InputOTPGroup>
      </InputOTP>
    </div>
  )
}

function QuantityView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const [n, setN] = React.useState(1)
  return (
    <div {...attrs} className={cn(attrs.className, "flex w-fit items-center gap-1 rounded-lg border p-1")}>
      <Button variant="ghost" size="icon-sm" onClick={() => setN((v) => Math.max(0, v - 1))}><Minus /></Button>
      <span className="w-8 text-center text-sm tabular-nums">{n}</span>
      <Button variant="ghost" size="icon-sm" onClick={() => setN((v) => v + 1)}><Plus /></Button>
    </div>
  )
}

const VIEWS: Partial<Record<UINode["kind"], React.ComponentType<{ node: UINode }>>> = {
  grid: GridView, split: SplitView, tabs: TabsView, card: CardView, row: RowView,
  hero: HeroView, stats: StatsView, form: FormView, chart: ChartView, table: TableView, list: ListView,
  board: BoardView, chat: ChatView, player: PlayerView, pricing: PricingView, profile: ProfileView,
  details: DetailsView, listings: ListingsView, search: SearchView, settings: SettingsView,
  features: FeaturesView, steps: StepsView, testimonial: TestimonialView, cta: CtaView, timeline: TimelineView,
  accordion: AccordionView, alert: AlertView, calendar: CalendarView, empty: EmptyView, swipe: SwipeView,
  keypad: KeypadView, forecast: ForecastView, media: MediaView, feature: FeatureView, person: PersonView, heading: HeadingView,
  stat: StatView, text: TextView, progress: ProgressView, field: FieldView, toggle: ToggleView,
  slider: SliderView, radio: RadioView, button: ButtonView, badges: BadgesView, avatars: AvatarsView,
  image: ImageView, separator: SeparatorView, price: PriceView, rating: RatingView, status: StatusView,
  segmented: SegmentedView, searchbox: SearchboxView, otp: OtpView, quantity: QuantityView,
}
