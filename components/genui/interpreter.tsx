"use client"

// The React interpreter: walks the tree Jev composed and renders each node with
// shadcn primitives. Nodes still being decided render as skeletons of their kind.

import * as React from "react"
import { cn } from "cn"
import {
  ArrowDownRight, ArrowUpRight, Bookmark, Check, CircleAlert, CircleCheck, Copy, Delete, Heart, Info, MessageCircle, Minus, Paperclip, Pause,
  Play, Plus, Quote, Repeat, Search, SendHorizontal, Shuffle, SkipBack, SkipForward, SlidersHorizontal, Star,
  Share2, TriangleAlert, UploadCloud, Volume2, X,
} from "lucide-react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, XAxis } from "recharts"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Calendar } from "@/components/ui/calendar"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
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
  listings, metricValue, pick, rng, series, tierPrices, DETAIL_ITEMS, VIDEO_TITLES, posts, comments, CODE_SAMPLES, LEADERBOARD,
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

const SMALL = new Set(["field", "toggle", "slider", "radio", "button", "separator", "badges", "heading", "price", "rating", "status", "segmented", "searchbox", "otp", "quantity", "swatches", "pagination", "breadcrumb", "banner", "checklist"])
function PendingView({ node }: { node: UINode }) {
  if (["grid", "stats", "features", "listings", "pricing", "gallery", "carousel", "logos"].includes(node.kind)) {
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
      {left && <Placeholder seed={`${node.path}|hero`} icon="image" aspect="photo" className="rounded-2xl" label={subject || undefined} />}
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
                  <div key={title} className="flex flex-col gap-2 overflow-hidden rounded-lg bg-background p-3 text-sm shadow-xs ring-1 ring-foreground/5">
                    {node.props.covers === "covers" && <Placeholder seed={`${node.path}|${title}`} icon="image" aspect="wide" className="-mx-3 -mt-3 mb-1 w-[calc(100%+1.5rem)] [&>div:last-of-type]:size-8" />}
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
        <Placeholder seed={`${node.path}|art`} icon={icon} aspect="square" className="rounded-xl sm:w-40" />
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
      <Placeholder seed={`${node.path}|cover`} aspect="banner" className="h-28" iconless />
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
      <Placeholder seed={`media|${item.title}`} icon={item.icon} aspect="photo">
        {item.badge && <Badge className="absolute top-2.5 left-2.5">{item.badge}</Badge>}
        <button type="button" className="absolute top-2.5 right-2.5 grid size-8 place-items-center rounded-full bg-background/80 text-muted-foreground"><Heart className="size-4" /></button>
      </Placeholder>
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
          <Placeholder seed={`${node.path}|swipe`} icon={card.icon} aspect="portrait" />
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

const LIST_ICON: Record<string, string> = { leaderboard: "trophy", holdings: "wallet", files: "file", notifications: "bell", events: "calendar", products: "package", transactions: "receipt", apps: "layout-grid", services: "server", tracks: "music" }

function ListView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const kind = B.LIST_KINDS[str(node.props.title)]?.[0] ?? str(node.props.items, "people")
  const media = str(node.props.media, "none")
  const subject = str(node.props.subject, LIST_ICON[kind] ?? "image")
  const items = React.useMemo(() => (kind === "leaderboard" ? LEADERBOARD(r) : listItems(r, kind, kind === "tasks" ? 6 : 4)), [r, kind])
  const title = str(node.props.title, "Recent activity")

  if (media === "covers") {
    return (
      <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
        <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => (
            <Card key={i} className="gap-3 overflow-hidden pt-0">
              <Placeholder seed={`${node.path}|${i}`} icon={subject} aspect="photo" />
              <div className="flex items-start gap-3 px-4">
                {kind === "tasks" && <Checkbox defaultChecked={"done" in it && it.done} className="mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-medium", "done" in it && it.done && "text-muted-foreground line-through")}>{it.title}</p>
                  <p className="text-xs text-muted-foreground">{it.meta}</p>
                </div>
                {it.trailing && <span className="text-sm text-muted-foreground tabular-nums">{it.trailing}</span>}
              </div>
            </Card>
          ))}
        </div>
      </section>
    )
  }

  if (kind === "tasks") return <TodoView node={node} items={items as ReturnType<typeof listItems>} media={media} subject={subject} title={title} />

  return (
    <Frame node={node} title={title}>
      <ul className="flex flex-col divide-y">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            {"rank" in it && <span className={cn("w-5 text-center text-sm font-semibold tabular-nums", it.rank <= 3 ? "text-primary" : "text-muted-foreground")}>{it.rank}</span>}
            {kind === "tasks" && <Checkbox defaultChecked={"done" in it && it.done} />}
            {media === "thumbnails" ? <Placeholder seed={`${node.path}|${i}`} icon={subject} aspect="square" className="size-12 shrink-0 rounded-lg [&>div:last-of-type]:size-7" iconless={false} />
              : kind === "tasks" ? null
              : "avatar" in it && it.avatar ? <Avatar className="size-8"><AvatarFallback className="text-xs">{it.avatar}</AvatarFallback></Avatar>
              : kind === "leaderboard" ? <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(it.title)}</AvatarFallback></Avatar>
              : <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted"><Icon name={LIST_ICON[kind]} className="size-4 text-muted-foreground" /></div>}
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm font-medium", "done" in it && it.done && "text-muted-foreground line-through")}>{it.title}</p>
              <p className="truncate text-xs text-muted-foreground">{it.meta}</p>
            </div>
            {it.trailing && kind === "apps" ? <Button variant="outline" size="sm">{it.trailing}</Button>
              : it.trailing && kind === "services" ? <span className={cn("flex items-center gap-1.5 text-xs", "positive" in it && it.positive ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400")}><span className="size-2 rounded-full bg-current" />{it.trailing}</span>
              : it.trailing && <span className={cn("text-sm tabular-nums", "positive" in it && it.positive === true && "text-emerald-600 dark:text-emerald-400", !("positive" in it) && "text-muted-foreground")}>{it.trailing}</span>}
          </li>
        ))}
      </ul>
    </Frame>
  )
}

/** A to-do list that behaves like one: add, check off, filter, see progress, optional photos. */
function TodoView({ node, items, media, subject, title }: { node: UINode; items: ReturnType<typeof listItems>; media: string; subject: string; title: string }) {
  const { attrs } = useNode(node)
  const [tasks, setTasks] = React.useState(() => items.map((it, i) => ({ ...it, id: i, done: !!it.done })))
  const [filter, setFilter] = React.useState("All")
  const [draft, setDraft] = React.useState("")
  const done = tasks.filter((t) => t.done).length
  const shown = tasks.filter((t) => (filter === "Active" ? !t.done : filter === "Done" ? t.done : true))
  const toggle = (id: number) => setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  const add = () => {
    if (!draft.trim()) return
    setTasks((ts) => [{ title: draft.trim(), meta: "Due today", id: Date.now(), done: false }, ...ts])
    setDraft("")
  }
  const photos = media !== "none"
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-4 px-5")}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground tabular-nums">{done} of {tasks.length} done</p>
        </div>
        <ToggleGroup value={[filter]} onValueChange={(v) => v[0] && setFilter(v[0])} variant="outline" size="sm">
          {["All", "Active", "Done"].map((f) => <ToggleGroupItem key={f} value={f}>{f}</ToggleGroupItem>)}
        </ToggleGroup>
      </div>
      <Progress value={tasks.length ? (done / tasks.length) * 100 : 0} />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); add() }}>
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Add a task..." />
        {photos && <Button type="button" variant="outline" size="icon" aria-label="Attach photo"><Icon name="camera" className="size-4" /></Button>}
        <Button type="submit"><Plus />Add</Button>
      </form>
      <ul className={cn(media === "covers" ? "grid gap-3 sm:grid-cols-2" : "flex flex-col divide-y")}>
        {shown.map((t) => (
          <li key={t.id} className={cn(media === "covers" ? "overflow-hidden rounded-xl ring-1 ring-foreground/10" : "flex items-center gap-3 py-2.5 first:pt-0 last:pb-0")}>
            {media === "covers" && <Placeholder seed={`${node.path}|${t.id}`} icon={subject} aspect="wide" />}
            <div className={cn("flex items-center gap-3", media === "covers" && "p-3")}>
              <Checkbox checked={t.done} onCheckedChange={() => toggle(t.id)} />
              {media === "thumbnails" && <Placeholder seed={`${node.path}|${t.id}`} icon={subject} aspect="square" className="size-12 shrink-0 rounded-lg [&>div:last-of-type]:size-7" />}
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm font-medium", t.done && "text-muted-foreground line-through")}>{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">{t.meta}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
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

const ASPECT: Record<string, string> = {
  wide: "aspect-video", square: "aspect-square", portrait: "aspect-[3/4]", photo: "aspect-[4/3]", banner: "aspect-[3/1]", tall: "aspect-[2/3]",
}

/**
 * The image placeholder every photo slot uses: an accent-tinted gradient mesh,
 * a seeded texture, the subject's icon and an optional caption. Deterministic
 * per slot, so it never flickers while you type.
 */
function Placeholder({ seed, icon, label, aspect = "photo", className, children, iconless }: {
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

function ImageView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><Placeholder seed={node.path} icon={node.props.icon} aspect={str(node.props.aspect, "photo")} className={cn("rounded-xl", nested(node) && "max-h-48")} /></div>
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

// ---------------------------------------------------------------------------
// Media and commerce primitives

function DetailView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const kind = str(node.props.item, "product")
  const item = DETAIL_ITEMS[kind] ?? DETAIL_ITEMS.product
  const name = str(node.props.name, "Signature collection")
  const price = React.useMemo(() => item.price(r), [item, r])
  const [shot, setShot] = React.useState(0)
  return (
    <section {...attrs} className={cn(attrs.className, "grid gap-8 lg:grid-cols-2")}>
      <div className="flex flex-col gap-3">
        <Placeholder seed={`${node.path}|shot${shot}`} icon={item.icon} aspect="square" className="rounded-2xl" label={`${name}, photo ${shot + 1} of 4`} />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <button key={i} type="button" onClick={() => setShot(i)} className={cn("overflow-hidden rounded-lg ring-offset-2 ring-offset-background", shot === i && "ring-2 ring-primary")}>
              <Placeholder seed={`${node.path}|shot${i}`} icon={item.icon} aspect="square" iconless />
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <Badge variant="secondary" className="w-fit">{item.category}</Badge>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">{name}</h1>
          <StarsLine seed={`${node.path}|stars`} />
        </div>
        <div className="text-3xl font-semibold tracking-tight tabular-nums">{price}</div>
        <p className="text-pretty text-muted-foreground">{item.blurb}</p>
        {item.facts.length > 0 && (
          <div className="grid grid-cols-4 gap-2 rounded-xl bg-muted/50 p-3 text-center">
            {item.facts.map(([k, v]) => <div key={k}><div className="font-semibold">{v}</div><div className="text-xs text-muted-foreground">{k}</div></div>)}
          </div>
        )}
        {kind === "product" && <SwatchPicker kind="colors and sizes" />}
        <div className="flex gap-3">
          {(kind === "product" || kind === "dish") && <Stepper />}
          <Button size="lg" className="flex-1">{str(node.props.cta, "Add to cart")}</Button>
          <Button size="lg" variant="outline" aria-label="Save"><Heart /></Button>
        </div>
        <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          {(kind === "product" ? ["Free delivery", "Free returns", "2-year warranty", "Secure payment"] : kind === "hotel" ? ["Free cancellation", "Breakfast included", "Fast wifi", "Late checkout"] : ["Secure payment", "Instant confirmation", "Friendly support", "Easy changes"]).map((t) => (
            <li key={t} className="flex items-center gap-2"><Check className="size-4 text-primary" />{t}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function StarsLine({ seed }: { seed: string }) {
  const ctx = React.useContext(InterpreterContext)
  const { score, count } = React.useMemo(() => {
    const r = rng(`${ctx.seed}|${seed}`)
    return { score: +between(r, 4.3, 4.95).toFixed(1), count: Math.round(between(r, 40, 3200)) }
  }, [ctx.seed, seed])
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-4", i < Math.round(score) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />)}</div>
      <span className="font-medium">{score}</span><span className="text-muted-foreground">({count.toLocaleString("en-US")} reviews)</span>
    </div>
  )
}

const COLORS = ["oklch(0.25 0 0)", "oklch(0.93 0 0)", "oklch(0.55 0.12 60)", "oklch(0.5 0.1 250)", "oklch(0.55 0.12 150)"]
function SwatchPicker({ kind }: { kind: string }) {
  const [color, setColor] = React.useState(0)
  const [size, setSize] = React.useState("M")
  return (
    <div className="flex flex-col gap-4">
      {kind !== "sizes" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Color</span>
          <div className="flex gap-2">
            {COLORS.map((c, i) => (
              <button key={c} type="button" aria-label={`Color ${i + 1}`} onClick={() => setColor(i)} className={cn("size-8 rounded-full ring-1 ring-foreground/15 ring-offset-2 ring-offset-background", color === i && "ring-2 ring-primary")} style={{ background: c }} />
            ))}
          </div>
        </div>
      )}
      {kind !== "colors" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Size</span>
          <div className="flex flex-wrap gap-2">
            {["XS", "S", "M", "L", "XL"].map((sz) => (
              <button key={sz} type="button" onClick={() => setSize(sz)} className={cn("h-9 min-w-11 rounded-md border px-3 text-sm", size === sz ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted", sz === "XS" && "text-muted-foreground line-through")}>{sz}</button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Stepper() {
  const [n, setN] = React.useState(1)
  return (
    <div className="flex h-10 items-center gap-1 rounded-lg border px-1">
      <Button variant="ghost" size="icon-sm" onClick={() => setN((v) => Math.max(1, v - 1))} aria-label="Less"><Minus /></Button>
      <span className="w-6 text-center text-sm tabular-nums">{n}</span>
      <Button variant="ghost" size="icon-sm" onClick={() => setN((v) => v + 1)} aria-label="More"><Plus /></Button>
    </div>
  )
}

const GALLERY_ASPECTS = ["portrait", "square", "photo", "tall", "square", "photo", "portrait", "square", "photo"]
function GalleryView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const n = Number(str(node.props.count, "6")) || 6
  const title = str(node.props.title)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      {title && <h2 className="text-lg font-semibold tracking-tight">{title}</h2>}
      <div className={cn("gap-3 [&>*]:mb-3", n >= 9 ? "columns-3" : "columns-2 sm:columns-3")}>
        {Array.from({ length: n }, (_, i) => (
          <Placeholder key={i} seed={`${node.path}|${i}`} icon={node.props.subject} aspect={GALLERY_ASPECTS[i % GALLERY_ASPECTS.length]} className="break-inside-avoid rounded-xl" iconless={i % 3 !== 0} />
        ))}
      </div>
    </section>
  )
}

function CarouselView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const type = str(node.props.items, "products")
  const items = React.useMemo(() => listings(r, type, 6), [r, type])
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      <Carousel opts={{ align: "start" }} className="w-full">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight">{B.LISTING_TITLES[type] ?? "Featured"}</h2>
          <div className="flex gap-2"><CarouselPrevious className="static translate-y-0" /><CarouselNext className="static translate-y-0" /></div>
        </div>
        <CarouselContent>
          {items.map((it, i) => <CarouselItem key={i} className="basis-4/5 sm:basis-1/2 lg:basis-1/3"><MediaCard item={it} /></CarouselItem>)}
        </CarouselContent>
      </Carousel>
    </section>
  )
}

function VideoView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const kind = str(node.props.video, "lesson")
  const [title, length] = VIDEO_TITLES[kind] ?? VIDEO_TITLES.lesson
  const live = length === "LIVE"
  const [playing, setPlaying] = React.useState(false)
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-3 overflow-hidden pt-0")}>
      <Placeholder seed={`${node.path}|poster`} aspect="wide" iconless>
        <button type="button" onClick={() => setPlaying((p) => !p)} className="absolute inset-0 grid place-items-center" aria-label="Play">
          <span className="grid size-16 place-items-center rounded-full bg-background/85 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-105">{playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}</span>
        </button>
        {live ? <Badge variant="destructive" className="absolute top-3 left-3">LIVE</Badge> : <span className="absolute right-3 bottom-4 rounded bg-black/70 px-1.5 py-0.5 text-xs text-white tabular-nums">{length}</span>}
        {!live && <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20"><div className="h-full w-1/3 bg-primary" /></div>}
      </Placeholder>
      <div className="flex items-start justify-between gap-3 px-4">
        <div><div className="font-medium">{title}</div><div className="text-sm text-muted-foreground">{live ? "1.2K watching" : "14K views · 2 weeks ago"}</div></div>
        <Button variant="outline" size="sm">{kind === "lesson" ? "Next lesson" : "Share"}</Button>
      </div>
    </Card>
  )
}

function MapView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const places = str(node.props.places, "one location")
  const single = places === "one location"
  const delivery = places === "deliveries"
  const map = React.useMemo(() => {
    const roads = Array.from({ length: 7 }, (_, i) => ({ h: i % 2 === 0, at: 40 + i * 48 + between(r, -10, 10), tilt: between(r, -18, 18) }))
    const pins = Array.from({ length: single ? 1 : delivery ? 2 : 6 }, (_, i) => ({ x: single ? 300 : 70 + between(r, 0, 460), y: single ? 170 : 50 + between(r, 0, 250), label: `$${Math.round(between(r, 1, 9))}.${Math.round(between(r, 0, 9))}k`, i }))
    return { roads, pins }
  }, [r, single, delivery])
  const priced = places === "homes" || places === "hotels"
  const icon = { homes: "home", restaurants: "utensils", hotels: "bed", pros: "user-plus", events: "ticket", deliveries: "truck" }[places] ?? "map-pin"
  return (
    <Card {...attrs} className={cn(attrs.className, "relative overflow-hidden p-0")}>
      <svg viewBox="0 0 600 340" className="block h-auto w-full" aria-label="Map">
        <rect width="600" height="340" className="fill-muted" />
        <path d="M0 250 C 120 210, 200 300, 330 270 S 520 200, 600 240 V 340 H 0 Z" className="fill-sky-500/15" />
        <rect x="360" y="40" width="130" height="90" rx="18" className="fill-emerald-500/15" />
        <rect x="60" y="60" width="90" height="70" rx="14" className="fill-emerald-500/10" />
        {map.roads.map((rd, i) => rd.h
          ? <line key={i} x1="0" y1={rd.at} x2="600" y2={rd.at + rd.tilt} className="stroke-background" strokeWidth={i === 2 ? 10 : 6} />
          : <line key={i} x1={rd.at} y1="0" x2={rd.at + rd.tilt} y2="340" className="stroke-background" strokeWidth={i === 3 ? 10 : 6} />)}
        {delivery && <path d={`M${map.pins[0].x} ${map.pins[0].y} L${map.pins[1].x} ${map.pins[1].y}`} className="stroke-primary" strokeWidth="4" strokeDasharray="8 8" fill="none" />}
        {map.pins.map((p) => priced ? (
          <g key={p.i} transform={`translate(${p.x} ${p.y})`}>
            <rect x="-26" y="-14" width="52" height="28" rx="14" className={p.i === 0 ? "fill-primary" : "fill-background"} stroke="currentColor" strokeOpacity="0.1" />
            <text textAnchor="middle" y="5" className={cn("text-[13px] font-semibold", p.i === 0 ? "fill-primary-foreground" : "fill-foreground")}>{p.label}</text>
          </g>
        ) : (
          <g key={p.i} transform={`translate(${p.x} ${p.y})`}>
            <circle r="16" className="fill-primary/20" />
            <circle r="9" className="fill-primary" stroke="white" strokeWidth="3" />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-3 left-3 flex max-w-xs items-center gap-3 rounded-xl bg-background/95 p-3 shadow-md ring-1 ring-foreground/5 backdrop-blur">
        <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Icon name={icon} className="size-5" /></div>
        <div className="min-w-0 text-sm">
          <div className="truncate font-medium">{delivery ? "Arriving in 12 min" : single ? "2999 Harbor Ave, Suite 500" : `${map.pins.length} places nearby`}</div>
          <div className="truncate text-xs text-muted-foreground">{delivery ? "Your order is on its way" : single ? "Open today until 9:00 PM" : "Move the map to search this area"}</div>
        </div>
      </div>
      <div className="absolute top-3 right-3 flex flex-col overflow-hidden rounded-lg bg-background shadow-sm ring-1 ring-foreground/10">
        <button type="button" className="grid size-8 place-items-center border-b" aria-label="Zoom in"><Plus className="size-4" /></button>
        <button type="button" className="grid size-8 place-items-center" aria-label="Zoom out"><Minus className="size-4" /></button>
      </div>
    </Card>
  )
}

const LOGO_ICONS = ["zap", "globe", "leaf", "rocket", "gem", "anchor"]
function LogosView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const names = ["Northwind", "Globex", "Initech", "Vandelay", "Brightline", "Bluefin"]
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col items-center gap-5 py-4")}>
      <p className="text-sm text-muted-foreground">{str(node.props.label, "Trusted by teams at")}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 text-muted-foreground">
        {names.map((n, i) => (
          <span key={n} className={cn("flex items-center gap-2 text-lg", i % 3 === 0 ? "font-bold tracking-tight" : i % 3 === 1 ? "font-semibold uppercase tracking-widest text-sm" : "font-medium")}>
            <Icon name={LOGO_ICONS[i]} className="size-5" />{n}
          </span>
        ))}
      </div>
    </section>
  )
}

function FeedView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const kind = str(node.props.source, "social")
  const list = React.useMemo(() => posts(r, kind), [r, kind])
  return (
    <section {...attrs} className={cn(attrs.className, "mx-auto flex w-full max-w-xl flex-col gap-4")}>
      <Card className="flex-row items-center gap-3 px-4 py-3">
        <Avatar className="size-9"><AvatarFallback className="text-xs">{initials(PEOPLE[0])}</AvatarFallback></Avatar>
        <Input placeholder="Share something..." className="flex-1" />
        <Button size="icon" variant="ghost" aria-label="Add photo"><Icon name="camera" className="size-4" /></Button>
      </Card>
      {list.map((p, i) => (
        <Card key={i} className="gap-3 px-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-9"><AvatarFallback className="text-xs">{initials(p.name)}</AvatarFallback></Avatar>
            <div className="text-sm"><span className="font-medium">{p.name}</span> <span className="text-muted-foreground">{p.handle} · {p.time}</span></div>
          </div>
          <p className="text-sm">{p.text}</p>
          {p.photo && <Placeholder seed={`${node.path}|post${i}`} icon="camera" aspect="photo" className="rounded-xl" iconless={i > 0} />}
          <div className="flex items-center gap-5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Heart className="size-4" />{p.likes.toLocaleString("en-US")}</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="size-4" />{p.comments}</span>
            <span className="flex items-center gap-1.5"><Share2 className="size-4" />Share</span>
            <Bookmark className="ml-auto size-4" />
          </div>
        </Card>
      ))}
    </section>
  )
}

function CommentsView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const kind = str(node.props.style, "discussion")
  const list = React.useMemo(() => comments(r, kind), [r, kind])
  const reviews = kind === "reviews"
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{reviews ? "Reviews" : kind === "questions" ? "Questions and answers" : "Comments"} <span className="font-normal text-muted-foreground">({reviews ? 128 : 24})</span></h2>
        {!reviews && <Button variant="outline" size="sm">{kind === "questions" ? "Ask a question" : "Newest"}</Button>}
      </div>
      {reviews && (
        <div className="flex items-center gap-6">
          <div><div className="text-4xl font-semibold tracking-tight">4.8</div><div className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className="size-4 fill-amber-400 text-amber-400" />)}</div></div>
          <div className="flex flex-1 flex-col gap-1">
            {[82, 12, 4, 1, 1].map((v, i) => <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground"><span className="w-3">{5 - i}</span><div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-amber-400" style={{ width: `${v}%` }} /></div></div>)}
          </div>
        </div>
      )}
      <ul className="flex flex-col gap-4">
        {list.map((c, i) => (
          <li key={i} className="flex gap-3">
            <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(c.name)}</AvatarFallback></Avatar>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2 text-sm"><span className="font-medium">{c.name}</span><span className="text-xs text-muted-foreground">{c.time}</span></div>
              {c.stars && <div className="flex">{Array.from({ length: 5 }, (_, k) => <Star key={k} className={cn("size-3.5", k < c.stars! ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />)}</div>}
              <p className="text-sm text-pretty text-muted-foreground">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>
      {!reviews && <div className="flex gap-2"><Input placeholder="Write a comment..." /><Button>Post</Button></div>}
    </Card>
  )
}

const BOOKING_TITLES: Record<string, string> = {
  "table reservation": "Reserve a table", appointment: "Book an appointment", class: "Book a class",
  call: "Schedule a call", tour: "Schedule a tour", "court booking": "Book a court",
}
function TimeslotsView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const booking = str(node.props.booking, "appointment")
  const days = ["Mon 22", "Tue 23", "Wed 24", "Thu 25", "Fri 26", "Sat 27", "Sun 28"]
  const slots = booking === "table reservation" ? ["5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM"] : ["9:00 AM", "9:30 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:30 PM", "3:00 PM", "4:30 PM"]
  const taken = React.useMemo(() => slots.map(() => r() < 0.3), [r, slots.length]) // eslint-disable-line react-hooks/exhaustive-deps
  const [day, setDay] = React.useState(2)
  const [slot, setSlot] = React.useState<number | null>(null)
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-semibold">{BOOKING_TITLES[booking] ?? "Book a time"}</h2>
        {booking === "table reservation" && <ToggleGroup defaultValue={["2"]} variant="outline" size="sm">{["2", "4", "6"].map((g) => <ToggleGroupItem key={g} value={g}>{g} guests</ToggleGroupItem>)}</ToggleGroup>}
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((d, i) => {
          const [w, n] = d.split(" ")
          return (
            <button key={d} type="button" onClick={() => setDay(i)} className={cn("flex flex-col items-center rounded-lg border py-2 text-xs", day === i ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>
              <span className={day === i ? "" : "text-muted-foreground"}>{w}</span><span className="text-base font-semibold">{n}</span>
            </button>
          )
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {slots.map((t, i) => (
          <Button key={t} variant={slot === i ? "default" : "outline"} disabled={taken[i]} onClick={() => setSlot(i)} className={cn(taken[i] && "line-through")}>{t}</Button>
        ))}
      </div>
      <Button size="lg" disabled={slot === null}>{slot === null ? "Pick a time" : `Confirm ${days[day]} at ${slots[slot]}`}</Button>
    </Card>
  )
}

function FooterView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const { brand } = React.useContext(InterpreterContext)
  const cols: [string, string[]][] = [["Product", ["Features", "Pricing", "Changelog"]], ["Company", ["About", "Careers", "Press"]], ["Support", ["Help center", "Contact", "Status"]]]
  return (
    <footer {...attrs} className={cn(attrs.className, "mt-4 flex flex-col gap-8 border-t pt-8")}>
      <div className="grid gap-8 sm:grid-cols-4">
        <div className="flex flex-col gap-2"><span className="font-semibold tracking-tight">{brand || "Acme"}</span><span className="text-sm text-muted-foreground">Made with care.</span></div>
        {cols.map(([h, links]) => (
          <div key={h} className="flex flex-col gap-2 text-sm"><span className="font-medium">{h}</span>{links.map((l) => <span key={l} className="text-muted-foreground">{l}</span>)}</div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t pt-4 text-xs text-muted-foreground">
        <span>© 2026 {brand || "Acme"}. All rights reserved.</span>
        <div className="flex gap-3"><Icon name="globe" className="size-4" /><Icon name="mail" className="size-4" /><Icon name="camera" className="size-4" /></div>
      </div>
    </footer>
  )
}

function BannerView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return (
    <div {...attrs} className={cn(attrs.className, "flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-center text-sm text-primary-foreground")}>
      <Icon name="sparkles" className="size-4 shrink-0" />
      <span>{str(node.props.message, "Something new is here")}</span>
      <span className="font-medium underline underline-offset-4">Learn more</span>
    </div>
  )
}

function HeatmapView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const cells = React.useMemo(() => Array.from({ length: 7 * 22 }, () => { const v = r(); return v < 0.35 ? 0 : v < 0.6 ? 1 : v < 0.8 ? 2 : v < 0.93 ? 3 : 4 }), [r])
  const shade = ["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-4 px-5")}>
      <div className="flex items-end justify-between gap-4">
        <div><div className="font-semibold">{str(node.props.metric, "Activity")}</div><div className="text-sm text-muted-foreground">{cells.filter(Boolean).length} days in the last 22 weeks</div></div>
        <div className="text-right"><div className="text-2xl font-semibold tabular-nums">{Math.round(between(r, 5, 30))}</div><div className="text-xs text-muted-foreground">day streak</div></div>
      </div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto">
        {cells.map((c, i) => <div key={i} className={cn("size-3 rounded-[3px]", shade[c])} />)}
      </div>
      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">Less {shade.map((s) => <div key={s} className={cn("size-3 rounded-[3px]", s)} />)} More</div>
    </Card>
  )
}

function CodeView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const [lang, code] = CODE_SAMPLES[str(node.props.snippet, "install command")] ?? CODE_SAMPLES["install command"]
  const [copied, setCopied] = React.useState(false)
  return (
    <div {...attrs} className={cn(attrs.className, "overflow-hidden rounded-xl bg-zinc-950 text-zinc-100 ring-1 ring-foreground/10")}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2 text-xs text-zinc-400">
        <span className="font-mono">{lang}</span>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(code); setCopied(true) }} className="flex items-center gap-1.5 hover:text-zinc-100">{copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed"><code>{code}</code></pre>
    </div>
  )
}

function RingView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const v = React.useMemo(() => Math.round(35 + r() * 60), [r])
  const c = 2 * Math.PI * 42
  return (
    <div {...attrs} className={cn(attrs.className, "flex flex-col items-center gap-2")}>
      <div className="relative size-28">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90">
          <circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="9" />
          <circle cx="50" cy="50" r="42" className="fill-none stroke-primary" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-xl font-semibold tabular-nums">{v}%</div>
      </div>
      <span className="text-sm text-muted-foreground">{str(node.props.label, "Goal")}</span>
    </div>
  )
}

function SwatchesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <div {...attrs} className={attrs.className}><SwatchPicker kind={str(node.props.choices, "colors")} /></div>
}

function UploadView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const accept = str(node.props.accept, "any file")
  const photos = accept === "photos"
  return (
    <div {...attrs} className={cn(attrs.className, "flex w-full flex-col gap-3")}>
      <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center">
        <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary"><UploadCloud className="size-5" /></div>
        <div className="text-sm"><span className="font-medium text-primary">Click to upload</span> or drag and drop</div>
        <div className="text-xs text-muted-foreground">{photos ? "PNG or JPG, up to 10 MB" : accept === "spreadsheet" ? "CSV or XLSX, up to 5 MB" : accept === "documents" ? "PDF or DOCX, up to 20 MB" : "Any file, up to 50 MB"}</div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border p-2.5">
        {photos ? <Placeholder seed={`${node.path}|up`} aspect="square" className="size-10 rounded-md" iconless /> : <div className="grid size-10 place-items-center rounded-md bg-muted"><Icon name="file" className="size-4 text-muted-foreground" /></div>}
        <div className="min-w-0 flex-1 text-sm">
          <div className="truncate font-medium">{photos ? "IMG_2041.jpg" : accept === "spreadsheet" ? "customers.csv" : "Q3 report.pdf"}</div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full w-2/3 rounded-full bg-primary" /></div>
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">68%</span>
      </div>
    </div>
  )
}

function PaginationView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const [page, setPage] = React.useState(2)
  return (
    <Pagination {...attrs} className={cn(attrs.className, "mx-0 w-auto")}>
      <PaginationContent>
        <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)) }} /></PaginationItem>
        {[1, 2, 3].map((n) => <PaginationItem key={n}><PaginationLink href="#" isActive={page === n} onClick={(e) => { e.preventDefault(); setPage(n) }}>{n}</PaginationLink></PaginationItem>)}
        <PaginationItem><PaginationEllipsis /></PaginationItem>
        <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); setPage((p) => p + 1) }} /></PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

function BreadcrumbView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const { brand } = React.useContext(InterpreterContext)
  return (
    <Breadcrumb {...attrs} className={attrs.className}>
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbLink href="#">{brand || "Catalog"}</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Details</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function ChecklistView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return (
    <ul {...attrs} className={cn(attrs.className, "flex flex-col gap-2 text-sm")}>
      {arr(node.props.items).map((t) => <li key={t} className="flex items-center gap-2.5"><span className="grid size-5 place-items-center rounded-full bg-primary/10 text-primary"><Check className="size-3" /></span>{t}</li>)}
    </ul>
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
  detail: DetailView, gallery: GalleryView, carousel: CarouselView, video: VideoView, map: MapView, logos: LogosView,
  feed: FeedView, comments: CommentsView, timeslots: TimeslotsView, footer: FooterView, banner: BannerView,
  heatmap: HeatmapView, code: CodeView, ring: RingView, swatches: SwatchesView, upload: UploadView,
  pagination: PaginationView, breadcrumb: BreadcrumbView, checklist: ChecklistView,
}
