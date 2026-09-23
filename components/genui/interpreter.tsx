"use client"

// The React interpreter: walks the tree Jev composed and renders each node with
// shadcn primitives. Nodes still being decided render as skeletons of their kind.

import * as React from "react"
import { cn } from "cn"
import { ArrowDownRight, ArrowUpRight, CircleAlert, CircleCheck, Info, TriangleAlert } from "lucide-react"
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
import { RADIOS } from "@/lib/genui/catalog"
import {
  FAQ_ANSWERS, FIELD_OPTIONS, FIELD_PLACEHOLDERS, PEOPLE, axisLabels, cell, formatMetric,
  initials, listItems, metricValue, rng, series, type Rand,
} from "@/lib/genui/sample"
import { accentStyle } from "@/lib/genui/theme"
import type { UINode } from "@/lib/genui/types"
import { Icon } from "./icons"

type Ctx = { seed: string; highlight: string | null }
const InterpreterContext = React.createContext<Ctx>({ seed: "", highlight: null })

const str = (v: unknown, fallback = "") => (typeof v === "string" && v !== "none" ? v : fallback)

function useNode(node: UINode) {
  const { seed, highlight } = React.useContext(InterpreterContext)
  const r = React.useMemo(() => rng(`${seed}|${node.path}|${node.kind}`), [seed, node.path, node.kind])
  const hl = highlight === node.id
  return {
    r,
    attrs: {
      "data-node": node.id,
      className: cn(
        "animate-in fade-in-0 duration-500 transition-shadow",
        hl && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      ),
    },
  }
}

export function Interpreter({ tree, seed, highlight }: { tree: UINode; seed: string; highlight: string | null }) {
  const brand = str(tree.props.brand, "")
  return (
    <InterpreterContext.Provider value={{ seed, highlight }}>
      <div className="genui-preview bg-background text-foreground" style={accentStyle(tree.props.accent)}>
        <header className="flex h-14 items-center gap-3 border-b px-5">
          {tree.pending ? (
            <Skeleton className="h-5 w-32" />
          ) : (
            <div className="flex items-center gap-2 animate-in fade-in-0">
              <div className="grid size-7 place-items-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
                {initials(brand || "A")}
              </div>
              <span className="font-semibold tracking-tight">{brand}</span>
            </div>
          )}
          <div className="ml-auto flex items-center gap-3">
            <Avatar className="size-7">
              <AvatarFallback className="text-[11px]">{initials(PEOPLE[0])}</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-5 sm:p-8">
          {tree.children.map((c) => (
            <NodeView key={`${c.id}-${c.kind}`} node={c} />
          ))}
          {Array.from({ length: tree.pendingSlots ? 3 : 0 }, (_, i) => (
            <Skeleton key={i} className={cn("w-full rounded-xl", i === 0 ? "h-40" : "h-28")} />
          ))}
        </main>
      </div>
    </InterpreterContext.Provider>
  )
}

function NodeView({ node }: { node: UINode }) {
  if (node.pending) return <PendingView node={node} />
  const View = VIEWS[node.kind]
  return View ? <View node={node} /> : null
}

function Children({ node, className }: { node: UINode; className?: string }) {
  return (
    <>
      {node.children.map((c) => (
        <NodeView key={`${c.id}-${c.kind}`} node={c} />
      ))}
      {Array.from({ length: Math.min(node.pendingSlots, 3) }, (_, i) => (
        <Skeleton key={`s${i}`} className={cn("h-16 w-full rounded-lg", className)} />
      ))}
    </>
  )
}

function PendingView({ node }: { node: UINode }) {
  const tall = ["chart", "table", "hero", "list", "calendar", "accordion", "form", "split", "tabs"].includes(node.kind)
  if (node.kind === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </div>
    )
  }
  if (["field", "toggle", "slider", "radio", "button", "separator", "badges"].includes(node.kind)) {
    return <Skeleton className="h-9 w-full rounded-md" />
  }
  return (
    <div className={cn("flex flex-col gap-3 rounded-xl p-4 ring-1 ring-foreground/10", tall ? "min-h-56" : "min-h-28")}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="mt-auto h-full min-h-10 w-full flex-1" />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Containers

function HeroView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
  const subject = str(p.subject, "")
  const headline = str(p.headline, "Welcome").replace("{subject}", subject)
  const left = p.align === "left"
  return (
    <section {...attrs} className={cn(attrs.className, "grid items-center gap-8 rounded-2xl py-10 sm:py-16", left ? "lg:grid-cols-2" : "text-center")}>
      <div className={cn("flex flex-col gap-5", !left && "mx-auto max-w-2xl items-center")}>
        <Badge variant="secondary" className="w-fit">{subject || "New"}</Badge>
        <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{headline}</h1>
        <p className="text-lg text-pretty text-muted-foreground">{str(p.subtitle)}</p>
        <div className="flex flex-wrap gap-3">
          <Button size="lg">{str(p.cta, "Get started")}</Button>
          {str(p.cta2) && <Button size="lg" variant="outline">{str(p.cta2)}</Button>}
        </div>
      </div>
      {left && <ImageBlock icon="sparkles" aspect="wide" />}
    </section>
  )
}

const GRID_COLS: Record<number, string> = { 1: "", 2: "sm:grid-cols-2", 3: "sm:grid-cols-2 lg:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }

function GridView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const n = Math.max(1, Math.min(4, node.children.length + Math.min(node.pendingSlots, 4)))
  return (
    <div {...attrs} className={cn(attrs.className, "grid gap-4", GRID_COLS[n])}>
      <Children node={node} className="h-28 rounded-xl" />
    </div>
  )
}

const SPLIT: Record<string, string> = {
  "wide-left": "lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]",
  equal: "lg:grid-cols-2",
  "wide-right": "lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]",
}

function SplitView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return (
    <div {...attrs} className={cn(attrs.className, "grid items-start gap-4", SPLIT[str(node.props.ratio, "wide-left")] ?? SPLIT["wide-left"])}>
      <Children node={node} className="h-56 rounded-xl" />
    </div>
  )
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
              {str(c.props.tabLabel, c.kind[0].toUpperCase() + c.kind.slice(1))}
            </TabsTrigger>
          ))}
        </TabsList>
        {node.children.map((c) => (
          <TabsContent key={c.id} value={c.id} className="mt-3">
            <NodeView node={c} />
          </TabsContent>
        ))}
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
      <CardContent className="flex flex-1 flex-col gap-4">
        <Children node={node} />
      </CardContent>
      {str(p.action) && (
        <CardFooter className="border-t py-3">
          <Button variant="outline" size="sm">{str(p.action)}</Button>
        </CardFooter>
      )}
    </Card>
  )
}

function FormView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
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
            <Children node={node} className="h-9" />
            <Button type="submit" className="w-full">{str(p.submit, "Submit")}</Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Data views

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
  const compact = node.depth >= 2
  const config = {
    value: { label: metric, color: "var(--chart-1)" },
    previous: { label: "Previous period", color: "var(--chart-2)" },
  } satisfies ChartConfig
  const tick = { tickLine: false, axisLine: false, tickMargin: 8 } as const

  let chart: React.ReactElement
  if (type === "pie") {
    chart = (
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="label" innerRadius="55%" strokeWidth={2}>
          {data.map((_, i) => <Cell key={i} fill={`var(--chart-${(i % 5) + 1})`} />)}
        </Pie>
      </PieChart>
    )
  } else if (type === "bar") {
    chart = (
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...tick} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {compare && <Bar dataKey="previous" fill="var(--color-previous)" radius={4} />}
        <Bar dataKey="value" fill="var(--color-value)" radius={4} />
      </BarChart>
    )
  } else if (type === "line") {
    chart = (
      <LineChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...tick} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {compare && <Line dataKey="previous" stroke="var(--color-previous)" strokeWidth={2} dot={false} strokeDasharray="4 4" />}
        <Line dataKey="value" stroke="var(--color-value)" strokeWidth={2} dot={false} />
      </LineChart>
    )
  } else {
    chart = (
      <AreaChart data={data} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" {...tick} />
        <ChartTooltip content={<ChartTooltipContent />} />
        {compare && <Area dataKey="previous" stroke="var(--color-previous)" fill="var(--color-previous)" fillOpacity={0.1} strokeDasharray="4 4" />}
        <Area dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.25} strokeWidth={2} />
      </AreaChart>
    )
  }

  const body = (
    <ChartContainer config={config} className={cn("w-full", compact ? "h-36" : "h-60", type === "pie" && "mx-auto aspect-square h-56")}>
      {chart}
    </ChartContainer>
  )
  // Inside a card the parent already provides the frame and title.
  if (node.depth >= 2 && node.path.split(".").length > 2) return <div {...attrs}>{body}</div>
  return (
    <Card {...attrs} className={cn(attrs.className, "h-full")}>
      <CardHeader>
        <CardDescription>{metric}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{formatMetric(metric, type === "pie" || metric.includes("rate") ? cur[cur.length - 1] : total, true)}</CardTitle>
        <CardAction>
          <Badge variant="outline">{X_CAPTION[str(p.x, "months")]}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  )
}

function TableView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const p = node.props
  const cols = [p.col1, p.col2, p.col3, p.col4].map((c) => str(c)).filter(Boolean)
  const rows = Array.from({ length: 5 }, (_, i) => cols.map((c) => cell(r, c, i)))
  const table = (
    <Table>
      <TableHeader>
        <TableRow>
          {cols.map((c, i) => <TableHead key={c} className={cn(i === cols.length - 1 && cols.length > 2 && "text-right")}>{c}</TableHead>)}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => (
          <TableRow key={i}>
            {row.map((c, j) => (
              <TableCell key={j} className={cn(j === 0 && "font-medium", j === row.length - 1 && row.length > 2 && "text-right")}>
                {c.badge ? <Badge variant={c.badge}>{c.text}</Badge> : c.text}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
  if (node.path.split(".").length > 2) return <div {...attrs}>{table}</div>
  return (
    <Card {...attrs} className={attrs.className}>
      <CardHeader>
        <CardTitle>{str(p.title, "Records")}</CardTitle>
        <CardAction><Button variant="ghost" size="sm">View all</Button></CardAction>
      </CardHeader>
      <CardContent>{table}</CardContent>
    </Card>
  )
}

function ListView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const p = node.props
  const kind = str(p.items, "people")
  const items = listItems(r, kind)
  const list = (
    <ul className="flex flex-col divide-y">
      {items.map((it, i) => (
        <li key={i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          {kind === "tasks" ? (
            <Checkbox defaultChecked={it.done} />
          ) : it.avatar ? (
            <Avatar className="size-8"><AvatarFallback className="text-xs">{it.avatar}</AvatarFallback></Avatar>
          ) : (
            <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
              <Icon name={{ files: "file", notifications: "bell", events: "calendar", products: "package", transactions: "receipt" }[kind]} className="size-4 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className={cn("truncate text-sm font-medium", it.done && "text-muted-foreground line-through")}>{it.title}</p>
            <p className="truncate text-xs text-muted-foreground">{it.meta}</p>
          </div>
          {it.trailing && (
            <span className={cn("text-sm tabular-nums", it.positive === true && "text-emerald-600 dark:text-emerald-400", it.positive === undefined && "text-muted-foreground")}>{it.trailing}</span>
          )}
        </li>
      ))}
    </ul>
  )
  if (node.path.split(".").length > 2) return <div {...attrs}>{list}</div>
  return (
    <Card {...attrs} className={cn(attrs.className, "h-full")}>
      <CardHeader><CardTitle>{str(p.title, "Recent activity")}</CardTitle></CardHeader>
      <CardContent>{list}</CardContent>
    </Card>
  )
}

function AccordionView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const p = node.props
  const qs = [p.q1, p.q2, p.q3].map((q) => str(q)).filter(Boolean)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      <h2 className="text-xl font-semibold tracking-tight">{str(p.title, "Frequently asked questions")}</h2>
      <Accordion className="rounded-xl ring-1 ring-foreground/10">
        {qs.map((q) => (
          <AccordionItem key={q} value={q} className="px-4">
            <AccordionTrigger>{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{FAQ_ANSWERS[q] ?? "We would be happy to help. Get in touch."}</AccordionContent>
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
  const tone = (str(node.props.tone, "info") as keyof typeof TONES) in TONES ? (str(node.props.tone, "info") as keyof typeof TONES) : "info"
  const T = TONES[tone]
  return (
    <Alert {...attrs} variant={tone === "error" ? "destructive" : "default"} className={cn(attrs.className, T.cls)}>
      <T.icon />
      <AlertTitle>{str(node.props.title, "Heads up")}</AlertTitle>
      <AlertDescription>{T.text}</AlertDescription>
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
// Leaves

function StatView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const label = str(node.props.label, "Revenue")
  const { value, delta, good } = metricValue(r, label)
  const Up = delta >= 0 ? ArrowUpRight : ArrowDownRight
  const inCard = node.path.split(".").length > 2
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="grid size-8 place-items-center rounded-md bg-primary/10 text-primary">
          <Icon name={node.props.icon} className="size-4" />
        </div>
      </div>
      <div className="text-2xl font-semibold tracking-tight tabular-nums">{formatMetric(label, value, true)}</div>
      <div className={cn("flex items-center gap-1 text-xs", good ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
        <Up className="size-3.5" />
        <span className="tabular-nums">{Math.abs(delta).toFixed(1)}%</span>
        <span className="text-muted-foreground">vs last period</span>
      </div>
    </>
  )
  if (inCard) return <div {...attrs} className={cn(attrs.className, "flex flex-col gap-1.5")}>{body}</div>
  return <Card {...attrs} className={cn(attrs.className, "gap-1.5 px-4")}>{body}</Card>
}

function TextView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <p {...attrs} className={cn(attrs.className, "text-sm leading-relaxed text-pretty text-muted-foreground")}>{str(node.props.body)}</p>
}

function ProgressView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const v = Math.round(30 + r() * 65)
  return (
    <Progress {...attrs} value={v} className={attrs.className}>
      <ProgressLabel>{str(node.props.label, "Goal")}</ProgressLabel>
      <ProgressValue />
    </Progress>
  )
}

const SELECTS = new Set(Object.keys(FIELD_OPTIONS))
const TEXTAREAS = new Set(["Message", "Notes", "Bio", "Description"])
const DATES = new Set(["Date", "Date of birth", "Due date", "Start date", "End date"])

function FieldView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const label = str(node.props.label, "Name")
  const id = `f-${node.id}`
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
    const type = label === "Email" ? "email" : label.includes("assword") ? "password" : DATES.has(label) ? "date" : label === "Time" ? "time" : "text"
    control = <Input id={id} type={type} placeholder={type === "password" ? "••••••••" : FIELD_PLACEHOLDERS[label] ?? ""} />
  }
  return (
    <Field {...attrs} className={attrs.className}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {control}
    </Field>
  )
}

function ToggleView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const label = str(node.props.label, "Notifications")
  const id = `t-${node.id}`
  const on = React.useMemo(() => r() > 0.4, [r])
  if (node.props.style === "checkbox") {
    return (
      <Field {...attrs} orientation="horizontal" className={attrs.className}>
        <Checkbox id={id} defaultChecked={label === "Remember me"} />
        <FieldLabel htmlFor={id} className="font-normal">{label}</FieldLabel>
      </Field>
    )
  }
  return (
    <Field {...attrs} orientation="horizontal" className={cn(attrs.className, "justify-between")}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Switch id={id} defaultChecked={on} />
    </Field>
  )
}

function SliderView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const start = React.useMemo(() => Math.round(20 + r() * 60), [r])
  const [v, setV] = React.useState(start)
  return (
    <Field {...attrs} className={attrs.className}>
      <div className="flex items-center justify-between">
        <FieldLabel>{str(node.props.label, "Amount")}</FieldLabel>
        <span className="text-sm text-muted-foreground tabular-nums">{v}</span>
      </div>
      <Slider value={[v]} onValueChange={(x) => setV(Array.isArray(x) ? x[0] : x)} />
    </Field>
  )
}

function RadioView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const group = str(node.props.group, "Plan")
  const options = RADIOS[group] ?? ["Option A", "Option B"]
  return (
    <FieldSet {...attrs} className={attrs.className}>
      <FieldLegend variant="label">{group}</FieldLegend>
      <RadioGroup defaultValue={options[0]} className="flex flex-wrap gap-4">
        {options.map((o) => (
          <Field key={o} orientation="horizontal" className="w-auto">
            <RadioGroupItem value={o} id={`${node.id}-${o}`} />
            <FieldLabel htmlFor={`${node.id}-${o}`} className="font-normal">{o}</FieldLabel>
          </Field>
        ))}
      </RadioGroup>
    </FieldSet>
  )
}

function ButtonView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const variant = (["default", "outline", "ghost", "destructive"] as const).find((v) => v === node.props.variant) ?? "default"
  return <Button {...attrs} variant={variant} className={cn(attrs.className, "w-fit")}>{str(node.props.label, "Continue")}</Button>
}

function BadgesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const tags = [node.props.tag1, node.props.tag2, node.props.tag3].map((t) => str(t)).filter(Boolean)
  return (
    <div {...attrs} className={cn(attrs.className, "flex flex-wrap gap-2")}>
      {tags.map((t, i) => <Badge key={t} variant={i === 0 ? "default" : "secondary"}>{t}</Badge>)}
    </div>
  )
}

function AvatarsView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const start = Math.floor(r() * 8)
  return (
    <div {...attrs} className={cn(attrs.className, "flex items-center gap-3")}>
      <AvatarGroup>
        {PEOPLE.slice(start, start + 4).map((p) => (
          <Avatar key={p}><AvatarFallback className="text-xs">{initials(p)}</AvatarFallback></Avatar>
        ))}
        <AvatarGroupCount className="text-xs">+{Math.round(3 + r() * 20)}</AvatarGroupCount>
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
  return (
    <div {...attrs} className={attrs.className}>
      <ImageBlock icon={node.props.icon} aspect={node.props.aspect} className={cn(node.path.split(".").length > 2 && "max-h-40")} />
    </div>
  )
}

function SeparatorView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  return <Separator {...attrs} />
}

const VIEWS: Partial<Record<UINode["kind"], React.ComponentType<{ node: UINode }>>> = {
  hero: HeroView, grid: GridView, split: SplitView, tabs: TabsView, card: CardView, form: FormView,
  chart: ChartView, table: TableView, list: ListView, accordion: AccordionView, alert: AlertView,
  calendar: CalendarView, stat: StatView, text: TextView, progress: ProgressView, field: FieldView,
  toggle: ToggleView, slider: SliderView, radio: RadioView, button: ButtonView, badges: BadgesView,
  avatars: AvatarsView, image: ImageView, separator: SeparatorView,
}

export type { Rand }
