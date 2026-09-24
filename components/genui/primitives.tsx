"use client"

// The wider primitive library, added from the 196-use-case coverage study
// (evals/coverage). Each view reads Jev's props, adapts its content to the chosen
// variant, and works: timers tick, converters convert, quizzes lock answers.

import * as React from "react"
import { cn } from "cn"
import {
  ArrowDown, ArrowUp, ArrowUpDown, Bold, Check, ChevronDown, ChevronLeft, ChevronRight, CircleCheck, CircleX, Clock,
  Copy, Flag, Flashlight, Hand, Heading1, Heading2, Image as ImageIcon, Italic, Link2, List, ListChecks, Loader, Mail,
  MessageCircle, Mic, MicOff, Minus, MonitorUp, MoreHorizontal, Paperclip, Pause, Phone, Play, Plus, Quote, RotateCcw,
  Search, Send, Share2, Smile, Star, ThumbsDown, ThumbsUp, Timer as TimerIcon, Trash2, Underline, Users, Video, VideoOff,
  Wifi, X,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { PEOPLE, between, initials, pick, type Rand } from "@/lib/genui/sample"
import type { UINode } from "@/lib/genui/types"
import { Icon } from "./icons"
import { InterpreterContext, Placeholder, str, useNode } from "./kit"

type View = React.ComponentType<{ node: UINode }>

function useTick(ms = 1000, on = true) {
  const [, set] = React.useState(0)
  React.useEffect(() => {
    if (!on) return
    const id = setInterval(() => set((n) => n + 1), ms)
    return () => clearInterval(id)
  }, [ms, on])
}

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, "0")
const money = (v: number) => `$${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function Stepper({ value, onChange, min = 0 }: { value: number; onChange: (v: number) => void; min?: number }) {
  return (
    <div className="flex h-8 items-center rounded-lg border">
      <Button variant="ghost" size="icon-sm" aria-label="Less" onClick={() => onChange(Math.max(min, value - 1))}><Minus /></Button>
      <span className="w-6 text-center text-sm tabular-nums">{value}</span>
      <Button variant="ghost" size="icon-sm" aria-label="More" onClick={() => onChange(value + 1)}><Plus /></Button>
    </div>
  )
}

function Seg({ options, value, onChange, size = "sm" }: { options: string[]; value: string; onChange: (v: string) => void; size?: "sm" | "default" }) {
  return (
    <ToggleGroup value={[value]} onValueChange={(v) => v[0] && onChange(v[0])} variant="outline" size={size}>
      {options.map((o) => <ToggleGroupItem key={o} value={o}>{o}</ToggleGroupItem>)}
    </ToggleGroup>
  )
}

// ---------------------------------------------------------------------------
// Status and time

const TRACK: Record<string, { title: string; sub: string; steps: string[]; icon: string; badge: string }> = {
  order: { title: "Order #1042", sub: "Arriving Thursday, Sep 25", steps: ["Ordered", "Packed", "Shipped", "Out for delivery", "Delivered"], icon: "package", badge: "Shipped" },
  delivery: { title: "Your order is on the way", sub: "Arriving in 12 to 18 min", steps: ["Placed", "Preparing", "Picked up", "Arriving"], icon: "truck", badge: "On the way" },
  shipment: { title: "Shipment 1Z 999 AA1 0123", sub: "Estimated delivery Sep 26", steps: ["Label created", "In transit", "Out for delivery", "Delivered"], icon: "truck", badge: "In transit" },
  application: { title: "Application #A-2231", sub: "Senior Product Designer", steps: ["Submitted", "Under review", "Interview", "Decision"], icon: "briefcase", badge: "Under review" },
  repair: { title: "Service request #R-88", sub: "Laptop screen replacement", steps: ["Requested", "Diagnosed", "In repair", "Ready for pickup"], icon: "settings", badge: "In repair" },
  ride: { title: "Driver on the way", sub: "Gray Toyota Camry · 7XK 219", steps: ["Driver assigned", "On the way", "Arrived", "On trip"], icon: "car", badge: "4 min away" },
}

function TrackerView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const t = TRACK[str(node.props.subject, "order")] ?? TRACK.order
  const current = t.steps.length > 4 ? 2 : 1
  const person = PEOPLE[3]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex items-start gap-3">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Icon name={t.icon} className="size-5" /></div>
        <div className="min-w-0 flex-1"><div className="font-semibold">{t.title}</div><div className="text-sm text-muted-foreground">{t.sub}</div></div>
        <Badge>{t.badge}</Badge>
      </div>
      <ol className="flex items-start">
        {t.steps.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-2 text-center last:flex-none">
            <div className="flex w-full items-center">
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full text-xs", i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-primary/15 text-primary ring-2 ring-primary" : "bg-muted text-muted-foreground")}>
                {i < current ? <Check className="size-3.5" /> : i + 1}
              </span>
              {i < t.steps.length - 1 && <span className={cn("h-0.5 flex-1", i < current ? "bg-primary" : "bg-border")} />}
            </div>
            <span className={cn("-ml-4 w-16 text-[11px] leading-tight sm:w-20 sm:text-xs", i === current ? "font-medium" : "text-muted-foreground")}>{s}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3 rounded-xl bg-muted/50 p-3">
        <Avatar className="size-9"><AvatarFallback className="text-xs">{initials(person)}</AvatarFallback></Avatar>
        <div className="min-w-0 flex-1 text-sm"><div className="font-medium">{person}</div><div className="text-xs text-muted-foreground">{str(node.props.subject) === "application" ? "Recruiter" : "Your courier · 4.9 ★"}</div></div>
        <Button variant="outline" size="sm"><MessageCircle />Message</Button>
        {str(node.props.subject) !== "application" && <Button variant="outline" size="sm"><Phone />Call</Button>}
      </div>
    </Card>
  )
}

const COUNTDOWN: Record<string, { label: string; cta: string; days: number; hours: number; email?: boolean }> = {
  launch: { label: "Launching in", cta: "Notify me", days: 12, hours: 6, email: true },
  sale: { label: "Sale ends in", cta: "Shop the sale", days: 0, hours: 9 },
  event: { label: "Doors open in", cta: "Get tickets", days: 3, hours: 14 },
  maintenance: { label: "We will be back in", cta: "Notify me", days: 0, hours: 1, email: true },
  offer: { label: "Offer ends in", cta: "Claim offer", days: 1, hours: 4 },
  "new year": { label: "Counting down to midnight", cta: "Share", days: 98, hours: 11 },
}

function CountdownView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const c = COUNTDOWN[str(node.props.event, "launch")] ?? COUNTDOWN.launch
  const [target] = React.useState(() => Date.now() + (c.days * 24 + c.hours) * 3_600_000 + 1_234_000)
  useTick(1000)
  const left = Math.max(0, target - Date.now()) / 1000
  const parts: [string, number][] = [["Days", left / 86400], ["Hours", (left % 86400) / 3600], ["Minutes", (left % 3600) / 60], ["Seconds", left % 60]]
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col items-center gap-5 rounded-2xl bg-muted/40 px-6 py-10 text-center")}>
      <span className="text-sm font-medium tracking-wide text-muted-foreground uppercase">{c.label}</span>
      <div className="flex gap-2 sm:gap-4">
        {parts.map(([label, v]) => (
          <div key={label} className="flex flex-col items-center gap-1.5">
            <div className="grid h-16 w-14 place-items-center rounded-xl bg-background text-3xl font-semibold tabular-nums shadow-xs ring-1 ring-foreground/10 sm:h-20 sm:w-20 sm:text-4xl">{pad(v)}</div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
      {c.email ? (
        <form className="flex w-full max-w-sm gap-2" onSubmit={(e) => e.preventDefault()}><Input type="email" placeholder="you@example.com" /><Button type="submit">{c.cta}</Button></form>
      ) : <Button size="lg">{c.cta}</Button>}
    </section>
  )
}

function TimerView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const mode = str(node.props.mode, "stopwatch")
  const countdown = mode === "timer" || mode === "pomodoro"
  const total = mode === "pomodoro" ? 25 * 60 : 10 * 60
  const [running, setRunning] = React.useState(mode === "tracker")
  const [elapsed, setElapsed] = React.useState(mode === "tracker" ? 1 * 3600 + 23 * 60 + 12 : 0)
  const [laps, setLaps] = React.useState<number[]>([])
  React.useEffect(() => {
    if (!running) return
    const id = setInterval(() => setElapsed((e) => e + 0.1), 100)
    return () => clearInterval(id)
  }, [running])
  const shown = countdown ? Math.max(0, total - elapsed) : elapsed
  const h = Math.floor(shown / 3600), m = Math.floor((shown % 3600) / 60), s = Math.floor(shown % 60), t = Math.floor((shown * 10) % 10)
  const digits = countdown ? `${pad(m)}:${pad(s)}` : mode === "tracker" ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}.${t}`
  const ring = 2 * Math.PI * 88
  return (
    <Card {...attrs} className={cn(attrs.className, "items-center gap-6 px-6 py-8")}>
      {mode === "tracker" && (
        <div className="flex w-full flex-wrap items-center gap-2">
          <Input defaultValue="Homepage redesign" className="flex-1" aria-label="What are you working on?" />
          <NativeSelect defaultValue="Acme" aria-label="Project"><NativeSelectOption value="Acme">Acme Co.</NativeSelectOption><NativeSelectOption value="Globex">Globex</NativeSelectOption></NativeSelect>
        </div>
      )}
      {countdown ? (
        <div className="relative size-52">
          <svg viewBox="0 0 200 200" className="size-full -rotate-90">
            <circle cx="100" cy="100" r="88" className="fill-none stroke-muted" strokeWidth="10" />
            <circle cx="100" cy="100" r="88" className="fill-none stroke-primary transition-[stroke-dashoffset]" strokeWidth="10" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - shown / total)} />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center"><div className="font-mono text-5xl font-semibold tabular-nums">{digits}</div>{mode === "pomodoro" && <div className="text-sm text-muted-foreground">Focus · 2 of 4</div>}</div>
          </div>
        </div>
      ) : (
        <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums sm:text-7xl">{digits}</div>
      )}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Reset" onClick={() => { setRunning(false); setElapsed(0); setLaps([]) }}><RotateCcw /></Button>
        <Button size="icon-lg" className="size-14 rounded-full" aria-label={running ? "Pause" : "Start"} onClick={() => setRunning((r) => !r)}>{running ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}</Button>
        {mode === "stopwatch" && <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Lap" onClick={() => setLaps((l) => [elapsed, ...l])}><Flag /></Button>}
        {countdown && <Button variant="outline" size="icon-lg" className="rounded-full" aria-label="Add a minute" onClick={() => setElapsed((e) => e - 60)}><Plus /></Button>}
      </div>
      {mode === "stopwatch" && laps.length > 0 && (
        <ul className="w-full max-w-xs divide-y text-sm">{laps.map((l, i) => <li key={i} className="flex justify-between py-1.5 tabular-nums"><span className="text-muted-foreground">Lap {laps.length - i}</span><span className="font-mono">{pad(l / 60)}:{pad(l % 60)}.{Math.floor((l * 10) % 10)}</span></li>)}</ul>
      )}
      {mode === "tracker" && (
        <ul className="w-full divide-y text-sm">
          {[["Client onboarding call", "Globex", "0:45"], ["Wireframes v2", "Acme Co.", "2:10"], ["Invoice prep", "Internal", "0:25"]].map(([a, b, c]) => (
            <li key={a} className="flex items-center gap-3 py-2"><span className="size-2 rounded-full bg-primary" /><span className="flex-1">{a}<span className="ml-2 text-muted-foreground">{b}</span></span><span className="font-mono tabular-nums">{c}</span></li>
          ))}
        </ul>
      )}
    </Card>
  )
}

const TZ: Record<string, [string, string][]> = {
  world: [["New York", "America/New_York"], ["London", "Europe/London"], ["Dubai", "Asia/Dubai"], ["Tokyo", "Asia/Tokyo"], ["Sydney", "Australia/Sydney"], ["São Paulo", "America/Sao_Paulo"]],
  us: [["New York", "America/New_York"], ["Chicago", "America/Chicago"], ["Denver", "America/Denver"], ["Los Angeles", "America/Los_Angeles"], ["Anchorage", "America/Anchorage"], ["Honolulu", "Pacific/Honolulu"]],
  europe: [["London", "Europe/London"], ["Lisbon", "Europe/Lisbon"], ["Paris", "Europe/Paris"], ["Berlin", "Europe/Berlin"], ["Madrid", "Europe/Madrid"], ["Athens", "Europe/Athens"]],
  team: [["Miami", "America/New_York"], ["Mexico City", "America/Mexico_City"], ["Lisbon", "Europe/Lisbon"], ["Berlin", "Europe/Berlin"], ["Bangalore", "Asia/Kolkata"], ["Singapore", "Asia/Singapore"]],
}

function ClocksView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const cities = TZ[str(node.props.cities, "world")] ?? TZ.world
  useTick(1000)
  const now = new Date()
  const localHour = now.getHours() + now.getMinutes() / 60
  return (
    <section {...attrs} className={cn(attrs.className, "grid gap-3 sm:grid-cols-2 lg:grid-cols-3")}>
      {cities.map(([city, zone]) => {
        const time = new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", minute: "2-digit" }).format(now)
        const date = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", month: "short", day: "numeric" }).format(now)
        const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: zone, hour: "numeric", hourCycle: "h23" }).format(now))
        const diff = Math.round(hour - Math.floor(localHour))
        const off = ((diff + 36) % 24) - 12
        const day = hour >= 6 && hour < 19
        return (
          <Card key={city} className="gap-1 px-4">
            <div className="flex items-center justify-between text-sm"><span className="font-medium">{city}</span><Icon name={day ? "sun" : "moon"} className={cn("size-4", day ? "text-amber-500" : "text-indigo-400")} /></div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">{time}</div>
            <div className="text-xs text-muted-foreground">{date} · {off === 0 ? "Same time" : `${off > 0 ? "+" : ""}${off}h`}</div>
          </Card>
        )
      })}
    </section>
  )
}

const DAY_ITEMS: Record<string, { label: string[]; icon: string[] }> = {
  workouts: { label: ["Run 5K", "Upper body", "Rest", "Yoga", "Legs", "Swim", "Long run"], icon: ["footprints", "dumbbell", "moon", "leaf", "dumbbell", "droplets", "footprints"] },
  habits: { label: ["Done", "Done", "Missed", "Done", "Done", "", ""], icon: ["check-circle", "check-circle", "x", "check-circle", "check-circle", "", ""] },
  meals: { label: ["Salmon bowl", "Tacos", "Pasta", "Stir fry", "Pizza night", "Brunch", "Roast"], icon: ["utensils", "utensils", "utensils", "utensils", "utensils", "coffee", "utensils"] },
  sleep: { label: ["7h 42m", "6h 58m", "8h 05m", "7h 20m", "6h 31m", "", ""], icon: ["moon", "moon", "moon", "moon", "moon", "", ""] },
}

function DaysView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const track = str(node.props.track, "workouts")
  const items = DAY_ITEMS[track] ?? DAY_ITEMS.workouts
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  const today = 4
  const done = items.label.slice(0, today).filter((l) => l && l !== "Missed" && l !== "Rest").length
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-4 px-5")}>
      <div className="flex items-end justify-between">
        <div><div className="font-semibold">This week</div><div className="text-sm text-muted-foreground">{done} of {today} so far</div></div>
        <div className="flex items-center gap-1.5 text-sm"><Icon name="flame" className="size-4 text-orange-500" /><span className="font-semibold tabular-nums">12</span><span className="text-muted-foreground">day streak</span></div>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d, i) => {
          const past = i < today, isToday = i === today, missed = items.label[i] === "Missed"
          return (
            <div key={d} className={cn("flex flex-col items-center gap-1.5 rounded-xl px-1 py-2.5 text-center", isToday ? "bg-primary text-primary-foreground" : past ? "bg-muted/60" : "ring-1 ring-foreground/10")}>
              <span className={cn("text-[11px]", !isToday && "text-muted-foreground")}>{d}</span>
              <span className="text-sm font-semibold tabular-nums">{22 + i}</span>
              {items.icon[i] ? <Icon name={items.icon[i]} className={cn("size-4", missed ? "text-rose-500" : isToday ? "" : "text-primary")} /> : <span className="size-4 rounded-full border border-dashed" />}
              <span className={cn("line-clamp-2 text-[10px] leading-tight", !isToday && "text-muted-foreground")}>{items.label[i] || "Planned"}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Search, compare and choose

const FACET_OPTIONS: Record<string, string[]> = {
  Brand: ["Northwind", "Globex", "Initech", "Vandelay"], Category: ["New arrivals", "Bestsellers", "On sale", "Accessories"],
  Cuisine: ["Italian", "Mexican", "Japanese", "Vegan"], Airlines: ["Delta", "American", "United", "JetBlue"],
  Amenities: ["Wifi", "Parking", "Pool", "Pet friendly"], Level: ["Beginner", "Intermediate", "Advanced"], Status: ["Active", "Pending", "Archived"],
}

function FacetControl({ facet, seed }: { facet: string; seed: number }) {
  const [price, setPrice] = React.useState([40, 320])
  const [dist, setDist] = React.useState([10])
  if (facet === "Price range") {
    return (
      <div className="flex flex-col gap-3">
        <Slider value={price} min={0} max={500} onValueChange={(v) => Array.isArray(v) && setPrice(v)} />
        <div className="flex items-center gap-2 text-sm"><Input value={`$${price[0]}`} readOnly className="h-8" /><span className="text-muted-foreground">to</span><Input value={`$${price[1]}`} readOnly className="h-8" /></div>
      </div>
    )
  }
  if (facet === "Distance") return <div className="flex items-center gap-3"><Slider value={dist} min={1} max={50} onValueChange={(v) => Array.isArray(v) && setDist(v)} /><span className="w-14 text-right text-sm tabular-nums">{dist[0]} mi</span></div>
  if (facet === "Rating") {
    return (
      <div className="flex flex-col gap-1.5">
        {[4, 3].map((n) => (
          <label key={n} className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked={n === 4} />
            <span className="flex">{Array.from({ length: 5 }, (_, i) => <Star key={i} className={cn("size-3.5", i < n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/40")} />)}</span>& up
          </label>
        ))}
      </div>
    )
  }
  if (facet === "Size") return <div className="flex flex-wrap gap-1.5">{["XS", "S", "M", "L", "XL"].map((s, i) => <button key={s} type="button" className={cn("h-8 min-w-10 rounded-md border px-2 text-sm", i === 2 && "border-primary bg-primary text-primary-foreground")}>{s}</button>)}</div>
  if (facet === "Color") return <div className="flex gap-2">{["#111", "#eee", "#b45309", "#1d4ed8", "#15803d", "#be123c"].map((c, i) => <button key={c} type="button" aria-label={`Color ${i + 1}`} className={cn("size-7 rounded-full ring-1 ring-foreground/15 ring-offset-2 ring-offset-background", i === 0 && "ring-2 ring-primary")} style={{ background: c }} />)}</div>
  if (facet === "Availability") return <label className="flex items-center justify-between gap-2 text-sm">In stock only<Switch defaultChecked /></label>
  if (facet === "Bedrooms" || facet === "Duration" || facet === "Stops") {
    const opts = facet === "Bedrooms" ? ["Any", "1", "2", "3", "4+"] : facet === "Stops" ? ["Any", "Nonstop", "1 stop"] : ["< 1h", "1-3h", "3h+"]
    return <ToggleGroup defaultValue={[opts[1]]} variant="outline" size="sm" className="flex-wrap">{opts.map((o) => <ToggleGroupItem key={o} value={o}>{o}</ToggleGroupItem>)}</ToggleGroup>
  }
  if (facet === "Date range") return <div className="flex gap-2"><Input type="date" defaultValue="2026-10-02" className="h-8" /><Input type="date" defaultValue="2026-10-06" className="h-8" /></div>
  const opts = FACET_OPTIONS[facet] ?? ["Option A", "Option B", "Option C"]
  return (
    <div className="flex flex-col gap-2">
      {opts.map((o, i) => (
        <label key={o} className="flex items-center gap-2 text-sm"><Checkbox defaultChecked={i === 0} />{o}<span className="ml-auto text-xs text-muted-foreground tabular-nums">{((seed + i * 37) % 180) + 12}</span></label>
      ))}
    </div>
  )
}

function FiltersView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const facets = (Array.isArray(node.props.facets) ? node.props.facets : ["Price range", "Rating", "Brand"]) as string[]
  if (str(node.props.layout, "panel") === "bar") {
    return (
      <div {...attrs} className={cn(attrs.className, "flex flex-wrap items-center gap-2")}>
        {facets.map((f, i) => <Button key={f} variant={i === 0 ? "secondary" : "outline"} size="sm">{f}{i === 0 && <Badge className="ml-1 h-4 px-1 text-[10px]">2</Badge>}<ChevronDown /></Button>)}
        <Button variant="ghost" size="sm" className="text-muted-foreground">Clear all</Button>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground"><ArrowUpDown className="size-4" />Sort: <span className="font-medium text-foreground">Recommended</span></div>
      </div>
    )
  }
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-0 px-0 py-0")}>
      <div className="flex items-center justify-between border-b px-4 py-3"><span className="font-semibold">Filters</span><Button variant="ghost" size="sm" className="h-7 text-muted-foreground">Clear all</Button></div>
      {facets.map((f, i) => (
        <div key={f} className="flex flex-col gap-3 border-b px-4 py-4 last:border-b-0">
          <span className="text-sm font-medium">{f}</span>
          <FacetControl facet={f} seed={i * 53 + 17} />
        </div>
      ))}
      <div className="p-4 pt-0"><Button className="w-full">Show 128 results</Button></div>
    </Card>
  )
}

const COMPARE: Record<string, { cols: [string, string][]; rows: [string, (string | boolean)[]][] }> = {
  plans: { cols: [["Free", "$0"], ["Pro", "$19"], ["Team", "$49"]], rows: [["Projects", ["3", "Unlimited", "Unlimited"]], ["Storage", ["1 GB", "100 GB", "1 TB"]], ["Custom domain", [false, true, true]], ["Priority support", [false, true, true]], ["SSO and audit log", [false, false, true]]] },
  rooms: { cols: [["Standard", "$189"], ["Deluxe", "$249"], ["Suite", "$389"]], rows: [["Size", ["24 m²", "32 m²", "58 m²"]], ["Bed", ["Queen", "King", "King + sofa"]], ["View", ["City", "Garden", "Ocean"]], ["Breakfast", [false, true, true]], ["Late checkout", [false, false, true]]] },
  products: { cols: [["Lite", "$299"], ["Standard", "$449"], ["Pro", "$699"]], rows: [["Battery", ["10 h", "14 h", "20 h"]], ["Storage", ["128 GB", "256 GB", "512 GB"]], ["Water resistant", [false, true, true]], ["Warranty", ["1 year", "2 years", "3 years"]]] },
  cars: { cols: [["Base", "$32,900"], ["Sport", "$38,400"], ["Touring", "$44,100"]], rows: [["Range", ["272 mi", "305 mi", "341 mi"]], ["0-60 mph", ["5.8 s", "4.4 s", "4.9 s"]], ["Heated seats", [false, true, true]], ["Autopilot", [false, false, true]]] },
}
const PERM_ROLES = ["Owner", "Admin", "Editor", "Viewer"]
const PERMS: [string, boolean[]][] = [["View projects", [true, true, true, true]], ["Edit projects", [true, true, true, false]], ["Invite members", [true, true, false, false]], ["Manage billing", [true, true, false, false]], ["Export data", [true, true, true, false]], ["Delete workspace", [true, false, false, false]]]

function MatrixView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  if (str(node.props.mode, "permissions") === "comparison") {
    const c = COMPARE[str(node.props.subject, "plans")] ?? COMPARE.plans
    return (
      <Card {...attrs} className={cn(attrs.className, "px-0 pb-0")}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3 pl-5" />
              {c.cols.map(([n, p], i) => (
                <TableHead key={n} className={cn("py-3 text-center", i === 1 && "bg-primary/5")}>
                  {i === 1 && <Badge className="mb-1">Recommended</Badge>}
                  <div className="text-base font-semibold text-foreground">{n}</div>
                  <div className="text-sm font-normal text-muted-foreground">{p}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {c.rows.map(([label, vals]) => (
              <TableRow key={label}>
                <TableCell className="pl-5 text-muted-foreground">{label}</TableCell>
                {vals.map((v, i) => <TableCell key={i} className={cn("text-center", i === 1 && "bg-primary/5")}>{v === true ? <Check className="mx-auto size-4 text-primary" /> : v === false ? <Minus className="mx-auto size-4 text-muted-foreground/50" /> : v}</TableCell>)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    )
  }
  return (
    <Card {...attrs} className={cn(attrs.className, "px-0 pb-0")}>
      <CardHeader className="px-5"><CardTitle>Roles and permissions</CardTitle><CardDescription>Choose what each role can do in this workspace.</CardDescription></CardHeader>
      <Table>
        <TableHeader><TableRow><TableHead className="pl-5">Permission</TableHead>{PERM_ROLES.map((r) => <TableHead key={r} className="text-center">{r}</TableHead>)}</TableRow></TableHeader>
        <TableBody>
          {PERMS.map(([p, vals]) => (
            <TableRow key={p}><TableCell className="pl-5">{p}</TableCell>{vals.map((v, i) => <TableCell key={i} className="text-center"><Checkbox defaultChecked={v} disabled={i === 0} aria-label={`${PERM_ROLES[i]} can ${p}`} /></TableCell>)}</TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
}

const CARRIERS = [["Delta", "DL"], ["TAP Air Portugal", "TP"], ["United", "UA"], ["JetBlue", "B6"]]
function ItineraryView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const mode = str(node.props.mode, "flights")
  const [sort, setSort] = React.useState("Best")
  const results = React.useMemo(() => Array.from({ length: 4 }, (_, i) => {
    const dep = 6 + i * 3 + Math.round(r() * 2)
    const dur = mode === "trains" ? 2.5 + r() * 2 : 7.5 + r() * 4
    const stops = mode === "trains" ? 0 : i === 0 ? 0 : Math.round(r() * 1.4)
    return { carrier: mode === "trains" ? ["Amtrak Acela", "Northeast Regional", "Acela Express", "Keystone"][i] : CARRIERS[i][0], code: mode === "trains" ? "AM" : CARRIERS[i][1], dep, arr: (dep + dur) % 24, dur, stops, price: Math.round(mode === "trains" ? between(r, 49, 189) : between(r, 420, 980)) }
  }), [r, mode])
  const [from, to] = mode === "trains" ? ["NYP", "WAS"] : ["MIA", "LIS"]
  const fmt = (h: number) => `${Math.floor(h) % 12 || 12}:${pad((h % 1) * 60)} ${Math.floor(h) % 24 < 12 ? "AM" : "PM"}`
  if (mode === "booked") {
    return (
      <Card {...attrs} className={cn(attrs.className, "gap-4 px-5")}>
        <div className="flex items-center justify-between"><div><div className="font-semibold">Miami to Lisbon</div><div className="text-sm text-muted-foreground">Fri, Oct 3 · 1 stop · Confirmation K7Q2TX</div></div><Badge variant="secondary">Confirmed</Badge></div>
        {[["MIA", "JFK", "DL 1142", "6:05 AM", "9:02 AM", "Seat 14C · Gate D4"], ["JFK", "LIS", "TP 202", "7:40 PM", "7:45 AM +1", "Seat 22A · Terminal 1"]].map(([a, b, f, t1, t2, seat], i) => (
          <div key={f}>
            {i === 1 && <div className="my-2 flex items-center gap-2 text-xs text-muted-foreground"><Clock className="size-3.5" />10h 38m layover in New York</div>}
            <div className="flex items-center gap-4 rounded-xl bg-muted/50 p-4">
              <div className="text-center"><div className="text-lg font-semibold">{t1}</div><div className="text-xs text-muted-foreground">{a}</div></div>
              <div className="flex flex-1 flex-col items-center text-xs text-muted-foreground"><span>{f}</span><div className="my-1 h-px w-full bg-border" /><Icon name="plane" className="size-4" /></div>
              <div className="text-center"><div className="text-lg font-semibold">{t2}</div><div className="text-xs text-muted-foreground">{b}</div></div>
              <div className="hidden text-right text-xs text-muted-foreground sm:block">{seat}</div>
            </div>
          </div>
        ))}
      </Card>
    )
  }
  const sorted = [...results].sort((a, b) => (sort === "Cheapest" ? a.price - b.price : sort === "Fastest" ? a.dur - b.dur : 0))
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{from} to {to}</span> · Fri, Oct 3 · 1 adult</div><Seg options={["Best", "Cheapest", "Fastest"]} value={sort} onChange={setSort} /></div>
      {sorted.map((f, i) => (
        <Card key={f.carrier} className={cn("flex-row flex-wrap items-center gap-4 px-5 py-4", i === 0 && "ring-2 ring-primary")}>
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold">{f.code}</div>
          <div className="flex min-w-48 flex-1 items-center gap-3">
            <div><div className="text-base font-semibold whitespace-nowrap tabular-nums sm:text-lg">{fmt(f.dep)}</div><div className="text-xs text-muted-foreground">{from}</div></div>
            <div className="flex flex-1 flex-col items-center gap-1 text-xs text-muted-foreground">
              <span className="whitespace-nowrap">{Math.floor(f.dur)}h {pad((f.dur % 1) * 60)}m</span>
              <div className="relative h-px w-full bg-border">{f.stops > 0 && <span className="absolute top-1/2 left-1/2 size-1.5 -translate-1/2 rounded-full bg-muted-foreground" />}</div>
              <span className={cn("whitespace-nowrap", !f.stops && "text-emerald-600 dark:text-emerald-400")}>{f.stops ? `${f.stops} stop` : "Nonstop"}</span>
            </div>
            <div className="text-right"><div className="text-base font-semibold whitespace-nowrap tabular-nums sm:text-lg">{fmt(f.arr)}</div><div className="text-xs text-muted-foreground">{to}</div></div>
          </div>
          <div className="text-sm text-muted-foreground sm:w-28">{f.carrier}</div>
          <div className="flex items-center gap-3"><div className="text-right"><div className="text-xl font-semibold tabular-nums">${f.price}</div><div className="text-xs text-muted-foreground">round trip</div></div><Button>Select</Button></div>
        </Card>
      ))}
    </section>
  )
}

function Qr({ seed }: { seed: string }) {
  const cells = React.useMemo(() => {
    let h = 0
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0
    return Array.from({ length: 21 * 21 }, (_, i) => { h = (h * 1103515245 + 12345) >>> 0; return (h >>> 16) % 2 === 0 || (i % 21 < 7 && Math.floor(i / 21) < 7) })
  }, [seed])
  const finder = (x: number, y: number) => (x < 7 && y < 7) || (x > 13 && y < 7) || (x < 7 && y > 13)
  return (
    <svg viewBox="0 0 21 21" className="size-28 rounded-md bg-white p-1.5" aria-label="QR code">
      {cells.map((on, i) => {
        const x = i % 21, y = Math.floor(i / 21)
        if (finder(x, y)) {
          const fx = x < 7 ? x : x - 14, fy = y < 7 ? y : y - 14
          const ring = fx === 0 || fy === 0 || fx === 6 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4)
          return ring ? <rect key={i} x={x} y={y} width="1" height="1" fill="#111" /> : null
        }
        return on ? <rect key={i} x={x} y={y} width="1" height="1" fill="#111" /> : null
      })}
    </svg>
  )
}

const PASSES: Record<string, { head: string; title: string; sub: string; fields: [string, string][]; code: string }> = {
  "boarding pass": { head: "Boarding pass", title: "MIA → LIS", sub: "TAP Air Portugal · TP 202", fields: [["Passenger", "Olivia Martin"], ["Seat", "22A"], ["Gate", "D14"], ["Boards", "7:05 PM"]], code: "K7Q2TX" },
  "event ticket": { head: "Admit one", title: "Neon Coast Live", sub: "The Fillmore · Sat, Oct 4 · 8:00 PM", fields: [["Section", "Floor"], ["Row", "GA"], ["Doors", "7:00 PM"], ["Holder", "Olivia Martin"]], code: "TKT-44817" },
  coupon: { head: "Coupon", title: "20% off", sub: "Your next order over $50", fields: [["Code", "SAVE20"], ["Expires", "Oct 31"], ["Uses", "1"], ["Stores", "All"]], code: "SAVE20" },
  membership: { head: "Member", title: "Gold member", sub: "Since March 2024", fields: [["Name", "Olivia Martin"], ["Member ID", "M-20931"], ["Points", "12,480"], ["Tier", "Gold"]], code: "M-20931" },
}

function TicketView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const { brand } = React.useContext(InterpreterContext)
  const t = PASSES[str(node.props.pass, "event ticket")] ?? PASSES["event ticket"]
  return (
    <div {...attrs} className={cn(attrs.className, "mx-auto w-full max-w-sm")}>
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10">
        <div className="flex flex-col gap-1 bg-primary px-5 py-5 text-primary-foreground">
          <div className="flex items-center justify-between text-xs uppercase tracking-wider opacity-80"><span>{brand || "Acme"}</span><span>{t.head}</span></div>
          <div className="text-3xl font-semibold tracking-tight">{t.title}</div>
          <div className="text-sm opacity-85">{t.sub}</div>
        </div>
        <div className="grid grid-cols-2 gap-4 px-5 py-4">
          {t.fields.map(([k, v]) => <div key={k}><div className="text-xs text-muted-foreground">{k}</div><div className="font-medium">{v}</div></div>)}
        </div>
        <div className="relative mx-5 border-t border-dashed">
          <span className="absolute -top-3 -left-8 size-6 rounded-full bg-background" />
          <span className="absolute -top-3 -right-8 size-6 rounded-full bg-background" />
        </div>
        <div className="flex flex-col items-center gap-2 px-5 py-5"><Qr seed={t.code} /><span className="font-mono text-sm tracking-widest text-muted-foreground">{t.code}</span></div>
      </div>
      <Button variant="outline" className="mt-3 w-full"><Icon name="wallet" className="size-4" />Add to wallet</Button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Money

const BREAKDOWNS: Record<string, { unit: "$" | "%" | "h" | "g"; total?: string; rows: [string, number, number?][] }> = {
  spending: { unit: "$", rows: [["Bills and utilities", 1240], ["Groceries", 612], ["Shopping", 520], ["Dining out", 380], ["Transport", 214], ["Entertainment", 145]] },
  budget: { unit: "$", rows: [["Rent", 1800, 1800], ["Groceries", 612, 700], ["Dining out", 380, 300], ["Transport", 214, 250], ["Shopping", 520, 400], ["Fun", 145, 200]] },
  portfolio: { unit: "%", rows: [["Bitcoin", 42], ["Ethereum", 24], ["US stocks", 14], ["Solana", 12], ["Cash", 8]] },
  time: { unit: "h", rows: [["Deep work", 14], ["Meetings", 9], ["Email and chat", 5], ["Planning", 3], ["Breaks", 2]] },
  nutrition: { unit: "g", total: "1,780 of 2,100 kcal", rows: [["Carbs", 180, 230], ["Protein", 142, 160], ["Fat", 58, 70], ["Fiber", 24, 30]] },
  traffic: { unit: "%", rows: [["Organic search", 42], ["Paid", 23], ["Social", 18], ["Email", 11], ["Referral", 6]] },
}

function BreakdownView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const measure = str(node.props.measure, "spending")
  const b = BREAKDOWNS[measure] ?? BREAKDOWNS.spending
  const sum = b.rows.reduce((s, r) => s + r[1], 0)
  const fmt = (v: number) => (b.unit === "$" ? `$${v.toLocaleString("en-US")}` : b.unit === "%" ? `${v}%` : `${v}${b.unit}`)
  const title = { spending: "Spending this month", budget: "Budget", portfolio: "Allocation", time: "Time this week", nutrition: "Today's intake", traffic: "Traffic sources" }[measure] ?? "Breakdown"
  const donut = str(node.props.style, "bars") === "donut"
  const color = (i: number) => `var(--chart-${(i % 5) + 1})`
  let acc = 0
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex items-end justify-between">
        <div><div className="text-sm text-muted-foreground">{title}</div><div className="text-2xl font-semibold tracking-tight tabular-nums">{b.total ?? (b.unit === "%" ? `${b.rows.length} sources` : fmt(sum))}</div></div>
        <Seg options={["Week", "Month"]} value="Month" onChange={() => {}} />
      </div>
      <div className={cn(donut && "grid items-center gap-6 sm:grid-cols-[160px_1fr]")}>
        {donut && (
          <svg viewBox="0 0 42 42" className="mx-auto size-40 -rotate-90">
            {b.rows.map(([k, v], i) => {
              const pct = (v / sum) * 100
              const el = <circle key={k} cx="21" cy="21" r="15.9" fill="none" stroke={color(i)} strokeWidth="6" strokeDasharray={`${pct} ${100 - pct}`} strokeDashoffset={-acc} />
              acc += pct
              return el
            })}
          </svg>
        )}
        <ul className="flex flex-col gap-3.5">
          {b.rows.map(([k, v, limit], i) => {
            const pct = limit ? (v / limit) * 100 : (v / sum) * 100
            const over = limit !== undefined && v > limit
            return (
              <li key={k} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 rounded-full" style={{ background: color(i) }} />
                  <span className="flex-1">{k}</span>
                  <span className="font-medium tabular-nums">{fmt(v)}</span>
                  {(limit !== undefined || b.unit !== "%") && <span className={cn("w-20 text-right text-xs tabular-nums", over ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground")}>{limit ? (over ? `${fmt(v - limit)} over` : `of ${fmt(limit)}`) : `${Math.round((v / sum) * 100)}%`}</span>}
                </div>
                {!donut && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    {/* Budgets use fixed meaning colors, never the accent: green within, amber close, red over. */}
                    <div className={cn("h-full rounded-full", limit !== undefined && (over ? "bg-rose-500" : pct > 85 ? "bg-amber-400" : "bg-emerald-500"))} style={{ width: `${Math.min(100, pct)}%`, background: limit === undefined ? color(i) : undefined }} />
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>
    </Card>
  )
}

function WalletView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const accounts = str(node.props.mode, "cards") === "accounts"
  if (accounts) {
    const rows: [string, string, number, string][] = [["Everyday checking", "•••• 4821", 12480.22, "wallet"], ["High-yield savings", "•••• 1190", 48200, "piggy-bank"], ["Travel credit card", "•••• 4242", -1204.5, "credit-card"]]
    return (
      <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3")}>
        <div className="rounded-2xl bg-linear-to-br from-primary to-primary/70 p-5 text-primary-foreground shadow-sm">
          <div className="text-sm opacity-80">Total balance</div>
          <div className="text-4xl font-semibold tracking-tight tabular-nums">{money(rows.reduce((s, r) => s + r[2], 0))}</div>
          <div className="mt-4 flex gap-2"><Button variant="secondary" size="sm"><Send />Send</Button><Button variant="secondary" size="sm"><ArrowDown />Request</Button><Button variant="secondary" size="sm"><Plus />Add money</Button></div>
        </div>
        {rows.map(([name, num, bal, icon]) => (
          <Card key={name} className="flex-row items-center gap-3 px-4 py-3">
            <div className="grid size-10 place-items-center rounded-full bg-muted"><Icon name={icon} className="size-4 text-muted-foreground" /></div>
            <div className="flex-1"><div className="text-sm font-medium">{name}</div><div className="text-xs text-muted-foreground">{num}</div></div>
            <div className={cn("font-semibold tabular-nums", bal < 0 && "text-rose-600 dark:text-rose-400")}>{bal < 0 ? `-${money(-bal)}` : money(bal)}</div>
          </Card>
        ))}
      </section>
    )
  }
  const cards: [string, string, string, boolean][] = [["Visa", "4242", "08/28", true], ["Mastercard", "1881", "03/27", false]]
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-4")}>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {cards.map(([brand, last, exp], i) => (
          <div key={last} className={cn("flex aspect-[1.586] w-72 shrink-0 flex-col justify-between rounded-2xl p-5 text-white shadow-md", i === 0 ? "bg-linear-to-br from-zinc-800 to-zinc-950" : "bg-linear-to-br from-primary to-primary/60")}>
            <div className="flex items-center justify-between"><div className="h-7 w-10 rounded-md bg-amber-200/80" /><span className="text-lg font-semibold italic">{brand}</span></div>
            <div className="font-mono text-lg tracking-widest">•••• •••• •••• {last}</div>
            <div className="flex justify-between text-xs uppercase opacity-80"><span>Olivia Martin</span><span>{exp}</span></div>
          </div>
        ))}
      </div>
      <Card className="gap-0 px-0 py-0">
        {cards.map(([brand, last, exp, def]) => (
          <div key={last} className="flex items-center gap-3 border-b px-4 py-3">
            <div className="grid h-8 w-12 shrink-0 place-items-center rounded-md bg-muted text-[10px] font-semibold uppercase">{brand === "Mastercard" ? "MC" : brand}</div>
            <div className="flex-1 text-sm"><div className="font-medium">{brand} ending in {last}</div><div className="text-xs text-muted-foreground">Expires {exp}</div></div>
            {def ? <Badge variant="secondary">Default</Badge> : <Button variant="ghost" size="sm">Make default</Button>}
            <Button variant="ghost" size="icon-sm" aria-label="Remove card"><Trash2 /></Button>
          </div>
        ))}
        <button type="button" className="flex items-center gap-2 px-4 py-3 text-sm font-medium text-primary"><Plus className="size-4" />Add payment method</button>
      </Card>
    </section>
  )
}

const CART: Record<string, [string, string, number, string][]> = {
  products: [["Classic leather tote", "Cognac · One size", 189, "package"], ["Everyday sneaker", "White · Size 9", 110, "shirt"], ["Wool beanie", "Charcoal", 32, "shirt"]],
  food: [["Margherita pizza", "Large · Extra basil", 18.5, "utensils"], ["Garlic knots", "6 pieces", 7, "utensils"], ["Sparkling water", "500 ml", 3.5, "droplets"]],
  tickets: [["General admission", "Sat, Oct 4 · Floor", 65, "ticket"], ["VIP upgrade", "Early entry and lounge", 45, "star"], ["Parking pass", "Lot B", 20, "car"]],
}

function CartView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const kind = str(node.props.items, "products")
  const [qty, setQty] = React.useState<number[]>(() => (CART[kind] ?? CART.products).map((_, i) => (i === 1 ? 2 : 1)))
  const items = CART[kind] ?? CART.products
  const sub = items.reduce((s, it, i) => s + it[2] * qty[i], 0)
  const ship = kind === "food" ? 2.99 : sub > 100 ? 0 : 8
  const tax = sub * 0.08
  return (
    <section {...attrs} className={cn(attrs.className, "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]")}>
      <Card className="gap-0 px-0 py-0">
        <div className="border-b px-5 py-3 font-semibold">{kind === "food" ? "Your order" : "Your cart"} <span className="font-normal text-muted-foreground">({qty.reduce((a, b) => a + b, 0)} items)</span></div>
        {items.map(([name, variant, price, icon], i) => qty[i] > 0 && (
          <div key={name} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
            <Placeholder seed={`cart|${name}`} icon={icon} aspect="square" className="size-16 shrink-0 rounded-lg [&>div:last-of-type]:size-8" />
            <div className="min-w-0 flex-1"><div className="font-medium">{name}</div><div className="text-sm text-muted-foreground">{variant}</div></div>
            <Stepper value={qty[i]} onChange={(v) => setQty((q) => q.map((x, j) => (j === i ? v : x)))} />
            <div className="w-20 text-right font-medium tabular-nums">{money(price * qty[i])}</div>
            <Button variant="ghost" size="icon-sm" aria-label={`Remove ${name}`} onClick={() => setQty((q) => q.map((x, j) => (j === i ? 0 : x)))}><Trash2 /></Button>
          </div>
        ))}
      </Card>
      <Card className="gap-3 px-5">
        <div className="font-semibold">Summary</div>
        <div className="flex gap-2"><Input placeholder="Promo code" /><Button variant="outline">Apply</Button></div>
        {[["Subtotal", money(sub)], [kind === "food" ? "Delivery" : "Shipping", ship ? money(ship) : "Free"], ["Tax", money(tax)]].map(([k, v]) => <div key={k} className="flex justify-between text-sm"><span className="text-muted-foreground">{k}</span><span className="tabular-nums">{v}</span></div>)}
        <div className="flex justify-between border-t pt-3 font-semibold"><span>Total</span><span className="tabular-nums">{money(sub + ship + tax)}</span></div>
        <Button size="lg">Checkout</Button>
      </Card>
    </section>
  )
}

const CHOICE_SETS: Record<string, { title: string; items: [string, string, number][] }> = {
  tickets: { title: "Choose tickets", items: [["General admission", "Standing, floor access", 45], ["Reserved seat", "Balcony, rows A to F", 75], ["VIP", "Early entry, lounge and merch", 150]] },
  options: { title: "Choose a package", items: [["Essential", "The basics, done well", 29], ["Plus", "Everything in Essential and more", 59], ["Complete", "The full treatment", 119]] },
  donation: { title: "Make a donation", items: [] },
}

function ChoicesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const mode = str(node.props.mode, "tickets")
  const [qty, setQty] = React.useState([2, 0, 0])
  const [pick, setPick] = React.useState(1)
  const [amount, setAmount] = React.useState(50)
  const [freq, setFreq] = React.useState("Monthly")
  if (mode === "donation") {
    return (
      <Card {...attrs} className={cn(attrs.className, "mx-auto w-full max-w-md gap-4 px-5")}>
        <div className="font-semibold">Make a donation</div>
        <Seg options={["One time", "Monthly"]} value={freq} onChange={setFreq} size="default" />
        <div className="grid grid-cols-3 gap-2">
          {[10, 25, 50, 100, 250, 500].map((a) => <button key={a} type="button" onClick={() => setAmount(a)} className={cn("h-12 rounded-lg border text-lg font-semibold tabular-nums", amount === a ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}>${a}</button>)}
        </div>
        <Input placeholder="Other amount" inputMode="decimal" />
        <p className="text-sm text-muted-foreground">${amount} {freq === "Monthly" ? "a month" : ""} provides {Math.round(amount / 5)} warm meals for families in need.</p>
        <Button size="lg">Donate ${amount}{freq === "Monthly" ? " monthly" : ""}</Button>
      </Card>
    )
  }
  const set = CHOICE_SETS[mode] ?? CHOICE_SETS.tickets
  const sub = mode === "tickets" ? set.items.reduce((s, it, i) => s + it[2] * qty[i], 0) : set.items[pick][2]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-3 px-5")}>
      <div className="font-semibold">{set.title}</div>
      {set.items.map(([name, desc, price], i) => (
        <div key={name} role={mode === "tickets" ? undefined : "button"} onClick={() => mode !== "tickets" && setPick(i)} className={cn("flex items-center gap-4 rounded-xl border p-4", mode !== "tickets" && "cursor-pointer", mode !== "tickets" && pick === i && "border-primary bg-primary/5 ring-1 ring-primary")}>
          {mode !== "tickets" && <span className={cn("grid size-5 place-items-center rounded-full border", pick === i && "border-primary bg-primary text-primary-foreground")}>{pick === i && <Check className="size-3" />}</span>}
          <div className="flex-1"><div className="font-medium">{name}</div><div className="text-sm text-muted-foreground">{desc}</div></div>
          <div className="font-semibold tabular-nums">${price}</div>
          {mode === "tickets" && <Stepper value={qty[i]} onChange={(v) => setQty((q) => q.map((x, j) => (j === i ? v : x)))} />}
        </div>
      ))}
      <div className="flex items-center justify-between border-t pt-3"><span className="text-sm text-muted-foreground">{mode === "tickets" ? `${qty.reduce((a, b) => a + b, 0)} tickets` : "Selected"}</span><span className="text-lg font-semibold tabular-nums">{money(sub)}</span></div>
      <Button size="lg" disabled={sub === 0}>Continue</Button>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// People and places

const PEOPLE_TITLES: Record<string, string[]> = {
  speakers: ["Head of Design, Northwind", "CTO, Globex", "Founder, Brightline", "Research Lead, Initech", "Author and investor", "VP Product, Bluefin"],
  team: ["CEO and cofounder", "Head of Engineering", "Product Designer", "Growth Lead", "Customer Success", "Engineer"],
  instructors: ["Vinyasa yoga · 8 years", "Strength coach · 6 years", "Pilates · 10 years", "Mobility · 5 years", "HIIT · 7 years", "Meditation · 12 years"],
  doctors: ["Cardiologist · 4.9 ★", "Family medicine · 4.8 ★", "Dermatologist · 5.0 ★", "Pediatrician · 4.9 ★", "Therapist · 4.9 ★", "Orthopedics · 4.7 ★"],
  judges: ["Chef and restaurateur", "Food critic", "Pastry chef", "TV host", "Sommelier", "Winner, season 3"],
}

function PeopleView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const role = str(node.props.role, "team")
  const titles = PEOPLE_TITLES[role] ?? PEOPLE_TITLES.team
  return (
    <section {...attrs} className={cn(attrs.className, "grid grid-cols-2 gap-4 lg:grid-cols-4")}>
      {titles.slice(0, 4).map((t, i) => {
        const name = (role === "doctors" ? "Dr. " : "") + PEOPLE[(i * 3 + 1) % PEOPLE.length]
        return (
          <Card key={t} className="gap-3 overflow-hidden pt-0">
            <Placeholder seed={`person|${name}`} icon="users" aspect="square" iconless label={undefined} />
            <div className="flex flex-col gap-0.5 px-4"><div className="font-medium">{name}</div><div className="text-sm text-muted-foreground">{t}</div></div>
            <div className="px-4">{role === "doctors" ? <Button size="sm" className="w-full">Book visit</Button> : <div className="flex gap-2 text-muted-foreground"><Icon name="globe" className="size-4" /><Icon name="mail" className="size-4" /></div>}</div>
          </Card>
        )
      })}
    </section>
  )
}

function StoriesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const stories = str(node.props.mode, "stories") === "stories"
  return (
    <div {...attrs} className={cn(attrs.className, "flex gap-4 overflow-x-auto pb-1")}>
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div className="relative"><Avatar className="size-16"><AvatarFallback>{initials(PEOPLE[0])}</AvatarFallback></Avatar><span className="absolute -right-0.5 -bottom-0.5 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background">{stories ? <Plus className="size-3" /> : <Search className="size-3" />}</span></div>
        <span className="text-xs">{stories ? "Your story" : "Search"}</span>
      </div>
      {PEOPLE.slice(1, 9).map((p, i) => (
        <div key={p} className="flex shrink-0 flex-col items-center gap-1.5">
          <div className={cn("rounded-full p-[3px]", stories && (i < 5 ? "bg-linear-to-tr from-amber-400 via-rose-500 to-fuchsia-600" : "bg-border"))}>
            <Avatar className="size-[60px] ring-2 ring-background"><AvatarFallback>{initials(p)}</AvatarFallback></Avatar>
          </div>
          <span className="w-16 truncate text-center text-xs">{p.split(" ")[0]}</span>
        </div>
      ))}
    </div>
  )
}

const AMENITY_SETS: Record<string, [string, string][]> = {
  rental: [["wifi", "Fast wifi"], ["utensils", "Full kitchen"], ["car", "Free parking"], ["droplets", "Washer"], ["wind", "Air conditioning"], ["briefcase", "Workspace"], ["paw", "Pets allowed"], ["sun", "Balcony"]],
  hotel: [["wifi", "Free wifi"], ["droplets", "Pool"], ["dumbbell", "Fitness center"], ["coffee", "Breakfast"], ["utensils", "Restaurant"], ["car", "Valet parking"], ["sparkles", "Spa"], ["plane", "Airport shuttle"]],
  gym: [["dumbbell", "Free weights"], ["activity", "Cardio machines"], ["users", "Group classes"], ["droplets", "Showers"], ["lock", "Lockers"], ["sparkles", "Sauna"], ["clock", "Open 24/7"], ["car", "Parking"]],
  office: [["wifi", "Gigabit wifi"], ["coffee", "Coffee bar"], ["users", "Meeting rooms"], ["phone", "Phone booths"], ["lock", "24/7 access"], ["bike", "Bike storage"], ["mail", "Mail handling"], ["sun", "Rooftop"]],
  car: [["zap", "Electric"], ["users", "5 seats"], ["map-pin", "Navigation"], ["headphones", "Premium audio"], ["sun", "Sunroof"], ["shield", "Lane assist"], ["thermometer", "Heated seats"], ["package", "Roof rack"]],
}

function AmenitiesView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const set = AMENITY_SETS[str(node.props.place, "rental")] ?? AMENITY_SETS.rental
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-4")}>
      <h2 className="text-lg font-semibold tracking-tight">What this place offers</h2>
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        {set.map(([icon, label]) => <div key={label} className="flex items-center gap-3 text-sm"><Icon name={icon} className="size-5 text-muted-foreground" />{label}</div>)}
      </div>
      <Button variant="outline" className="w-fit">Show all 32 amenities</Button>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Communication

function InviteView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const purpose = str(node.props.purpose, "teammates")
  const [chips, setChips] = React.useState(["mia@northwind.com", "lucas@northwind.com"])
  const [draft, setDraft] = React.useState("")
  const title = { teammates: "Invite teammates", guests: "Invite guests", collaborators: "Share this document", recipients: "Add recipients" }[purpose] ?? "Invite people"
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-4 px-5")}>
      <div><div className="font-semibold">{title}</div><div className="text-sm text-muted-foreground">They will get an email with a link to join.</div></div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex min-h-10 flex-1 flex-wrap items-center gap-1.5 rounded-lg border px-2 py-1.5">
          {chips.map((c) => <span key={c} className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm">{c}<button type="button" aria-label={`Remove ${c}`} onClick={() => setChips((cs) => cs.filter((x) => x !== c))}><X className="size-3" /></button></span>)}
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if ((e.key === "Enter" || e.key === ",") && draft.trim()) { e.preventDefault(); setChips((cs) => [...cs, draft.trim()]); setDraft("") } }} placeholder={chips.length ? "" : "Add emails..."} className="min-w-24 flex-1 bg-transparent text-sm outline-none" />
        </div>
        {purpose !== "recipients" && <NativeSelect defaultValue={purpose === "collaborators" ? "Can edit" : "Member"} aria-label="Role">{(purpose === "collaborators" ? ["Can view", "Can comment", "Can edit"] : ["Admin", "Member", "Viewer"]).map((r) => <NativeSelectOption key={r} value={r}>{r}</NativeSelectOption>)}</NativeSelect>}
        <Button disabled={!chips.length}><Send />Send {chips.length > 1 ? `${chips.length} invites` : "invite"}</Button>
      </div>
      <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2 pl-3 text-sm"><Link2 className="size-4 text-muted-foreground" /><span className="flex-1 truncate text-muted-foreground">acme.app/join/k7q2-tx81</span><Button variant="outline" size="sm"><Copy />Copy link</Button></div>
      <div className="flex flex-col divide-y text-sm">
        {[["Noah Garcia", "noah@northwind.com", "Pending"], ["Ava Patel", "ava@northwind.com", "Joined"]].map(([n, e, s]) => (
          <div key={e} className="flex items-center gap-3 py-2.5"><Avatar className="size-8"><AvatarFallback className="text-xs">{initials(n)}</AvatarFallback></Avatar><div className="flex-1"><div className="font-medium">{n}</div><div className="text-xs text-muted-foreground">{e}</div></div><Badge variant={s === "Joined" ? "secondary" : "outline"}>{s}</Badge>{s === "Pending" && <Button variant="ghost" size="sm">Resend</Button>}</div>
        ))}
      </div>
    </Card>
  )
}

function ReaderView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const ticket = str(node.props.mode, "email") === "ticket"
  const from = PEOPLE[4]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">{ticket ? <><span className="font-mono">#T-2041</span><Badge variant="destructive">High</Badge><Badge variant="outline">Open</Badge></> : <><Badge variant="secondary">Inbox</Badge><Badge variant="outline">Clients</Badge></>}</div>
          <h2 className="text-xl font-semibold tracking-tight">{ticket ? "Charged twice for my September invoice" : "Proposal for the Q4 campaign"}</h2>
        </div>
        <div className="flex gap-1"><Button variant="ghost" size="icon-sm" aria-label="Archive"><Icon name="inbox" className="size-4" /></Button><Button variant="ghost" size="icon-sm" aria-label="Delete"><Trash2 /></Button><Button variant="ghost" size="icon-sm" aria-label="More"><MoreHorizontal /></Button></div>
      </div>
      <div className="flex items-center gap-3">
        <Avatar><AvatarFallback className="text-xs">{initials(from)}</AvatarFallback></Avatar>
        <div className="flex-1 text-sm"><div><span className="font-medium">{from}</span> <span className="text-muted-foreground">&lt;{from.split(" ")[0].toLowerCase()}@globex.com&gt;</span></div><div className="text-xs text-muted-foreground">to me · Today, 9:41 AM</div></div>
      </div>
      <div className="flex flex-col gap-3 text-sm leading-relaxed">
        {(ticket
          ? ["Hi there, I was charged $49.00 twice on September 12 for the same invoice. I have attached both receipts from my bank statement.", "Could you refund the duplicate charge? Thanks for the help."]
          : ["Hi Olivia,", "Attached is the proposal for the Q4 campaign we discussed on Tuesday. It covers the three launch moments, the budget split and a timeline through December.", "Happy to walk through it on a call this week. Would Thursday at 2pm work?", "Best,\nSofia"]
        ).map((p, i) => <p key={i} className="whitespace-pre-line">{p}</p>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {(ticket ? ["receipt-1.png", "receipt-2.png"] : ["Q4-proposal.pdf", "budget.xlsx"]).map((f) => <span key={f} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><Paperclip className="size-4 text-muted-foreground" />{f}</span>)}
      </div>
      <div className="flex flex-col gap-2 rounded-xl border p-3">
        <textarea placeholder={ticket ? "Reply to the customer..." : `Reply to ${from.split(" ")[0]}...`} className="min-h-16 resize-none bg-transparent text-sm outline-none" />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex gap-1 text-muted-foreground"><Button variant="ghost" size="icon-sm" aria-label="Attach"><Paperclip /></Button><Button variant="ghost" size="icon-sm" aria-label="Emoji"><Smile /></Button></div>
          <div className="flex flex-wrap gap-2">{ticket && <Button variant="outline" size="sm">Internal note</Button>}<Button size="sm"><Send />{ticket ? "Send and resolve" : "Send"}</Button></div>
        </div>
      </div>
    </Card>
  )
}

function CallView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const [mic, setMic] = React.useState(true)
  const [cam, setCam] = React.useState(true)
  if (str(node.props.mode, "meeting") === "preview") {
    return (
      <section {...attrs} className={cn(attrs.className, "grid items-center gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]")}>
        <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
          <Placeholder seed="self" aspect="wide" iconless className="opacity-40" />
          <div className="absolute inset-0 grid place-items-center">{!cam && <Avatar className="size-20"><AvatarFallback className="text-xl">{initials(PEOPLE[0])}</AvatarFallback></Avatar>}</div>
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-3">
            <Button variant={mic ? "secondary" : "destructive"} size="icon-lg" className="rounded-full" onClick={() => setMic((m) => !m)} aria-label="Microphone">{mic ? <Mic /> : <MicOff />}</Button>
            <Button variant={cam ? "secondary" : "destructive"} size="icon-lg" className="rounded-full" onClick={() => setCam((c) => !c)} aria-label="Camera">{cam ? <Video /> : <VideoOff />}</Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div><div className="text-2xl font-semibold tracking-tight">Ready to join?</div><div className="text-sm text-muted-foreground">Dr. William Kim is in the call</div></div>
          <AvatarGroup>{PEOPLE.slice(3, 5).map((p) => <Avatar key={p}><AvatarFallback className="text-xs">{initials(p)}</AvatarFallback></Avatar>)}</AvatarGroup>
          <NativeSelect defaultValue="mic" aria-label="Microphone"><NativeSelectOption value="mic">MacBook Pro Microphone</NativeSelectOption></NativeSelect>
          <NativeSelect defaultValue="cam" aria-label="Camera"><NativeSelectOption value="cam">FaceTime HD Camera</NativeSelectOption></NativeSelect>
          <Button size="lg">Join now</Button>
        </div>
      </section>
    )
  }
  const people = PEOPLE.slice(0, 6)
  return (
    <section {...attrs} className={cn(attrs.className, "flex flex-col gap-3 rounded-2xl bg-zinc-950 p-3 text-white")}>
      <div className="flex items-center justify-between px-1 text-sm"><span className="font-medium">Weekly sync</span><span className="flex items-center gap-2 text-white/70"><span className="size-2 animate-pulse rounded-full bg-rose-500" />REC 24:18</span></div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
        {people.map((p, i) => (
          <div key={p} className={cn("relative overflow-hidden rounded-xl bg-zinc-800", i === 1 && "ring-2 ring-emerald-400")}>
            <Placeholder seed={`call|${p}`} aspect="wide" iconless className="opacity-30" />
            <div className="absolute inset-0 grid place-items-center"><Avatar className="size-14"><AvatarFallback className="bg-zinc-700 text-white">{initials(p)}</AvatarFallback></Avatar></div>
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-xs">{i % 3 === 2 && <MicOff className="size-3" />}{i === 0 ? "You" : p.split(" ")[0]}</span>
            {i === 4 && <Hand className="absolute top-2 right-2 size-4 text-amber-300" />}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-2 pt-1">
        <Button variant="secondary" size="icon-lg" className="rounded-full" onClick={() => setMic((m) => !m)} aria-label="Microphone">{mic ? <Mic /> : <MicOff />}</Button>
        <Button variant="secondary" size="icon-lg" className="rounded-full" onClick={() => setCam((c) => !c)} aria-label="Camera">{cam ? <Video /> : <VideoOff />}</Button>
        <Button variant="secondary" size="icon-lg" className="rounded-full" aria-label="Share screen"><MonitorUp /></Button>
        <Button variant="secondary" size="icon-lg" className="rounded-full" aria-label="Chat"><MessageCircle /></Button>
        <Button variant="secondary" size="icon-lg" className="rounded-full" aria-label="People"><Users /></Button>
        <Button variant="destructive" className="ml-2 h-10 rounded-full px-5"><Phone className="rotate-[135deg]" />Leave</Button>
      </div>
    </section>
  )
}

function ThreadView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const style = str(node.props.style, "voting")
  const [score, setScore] = React.useState(() => Math.round(between(r, 120, 2400)))
  const [vote, setVote] = React.useState(0)
  const cast = (v: number) => { setScore((s) => s - vote + (vote === v ? 0 : v)); setVote((x) => (x === v ? 0 : v)) }
  const replies: [string, string, number, number][] = [
    [PEOPLE[2], style === "qa" ? "Use a debounce of about 200ms and cancel stale requests with an AbortController. That keeps typing smooth." : "This matches what we saw too. The second option was much easier to maintain.", 0, 184],
    [PEOPLE[6], "Agreed, and it scales better once the team grows.", 1, 42],
    [PEOPLE[9], style === "qa" ? "Also worth caching results per query so backspacing is instant." : "Would love to see a follow-up post with numbers.", 0, 27],
  ]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-5 px-5")}>
      <div className="flex gap-4">
        {style !== "forum" && (
          <div className="flex flex-col items-center gap-0.5">
            <Button variant="ghost" size="icon-sm" aria-label="Upvote" onClick={() => cast(1)} className={cn(vote === 1 && "text-primary")}><ArrowUp /></Button>
            <span className="text-sm font-semibold tabular-nums">{score.toLocaleString("en-US")}</span>
            <Button variant="ghost" size="icon-sm" aria-label="Downvote" onClick={() => cast(-1)} className={cn(vote === -1 && "text-rose-500")}><ArrowDown /></Button>
          </div>
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="text-xs text-muted-foreground"><span className="font-medium text-foreground">{style === "qa" ? "Asked by" : "r/design"}</span> · {PEOPLE[5]} · 5h</div>
          <h2 className="text-lg font-semibold tracking-tight text-balance">{style === "qa" ? "How do I keep a live preview fast while the user is typing?" : "We rebuilt our design system from scratch. Here is what we learned."}</h2>
          <p className="text-sm text-pretty text-muted-foreground">{style === "qa" ? "Every keystroke triggers a request and the UI flickers. What is the right pattern here?" : "Six months, two rewrites and a lot of opinions. The short version: fewer components, stricter tokens, and docs that live next to the code."}</p>
          <div className="flex gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><MessageCircle className="size-4" />86 comments</span><span className="flex items-center gap-1.5"><Share2 className="size-4" />Share</span></div>
        </div>
      </div>
      <div className="flex gap-2"><Input placeholder={style === "qa" ? "Write an answer..." : "Add a comment..."} /><Button>Post</Button></div>
      <ul className="flex flex-col gap-4">
        {replies.map(([name, text, depth, votes], i) => (
          <li key={i} className={cn("flex gap-3", depth && "ml-8 border-l pl-4")}>
            <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(name)}</AvatarFallback></Avatar>
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2 text-sm"><span className="font-medium">{name}</span><span className="text-xs text-muted-foreground">{i + 1}h</span>{style === "qa" && i === 0 && <Badge className="gap-1"><CircleCheck className="size-3" />Accepted</Badge>}</div>
              <p className="text-sm text-pretty">{text}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><ArrowUp className="size-3.5" />{votes}</span><button type="button">Reply</button></div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Writing and reading

function EditorView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const mode = str(node.props.mode, "document")
  const tools = [Bold, Italic, Underline, null, Heading1, Heading2, null, List, ListChecks, Quote, null, Link2, ImageIcon]
  const toolbar = (
    <div className="flex flex-wrap items-center gap-0.5 border-b px-2 py-1.5">
      {tools.map((T, i) => (T ? <Button key={i} variant="ghost" size="icon-sm" aria-label="Format"><T /></Button> : <span key={i} className="mx-1 h-5 w-px bg-border" />))}
    </div>
  )
  if (mode === "email") {
    return (
      <Card {...attrs} className={cn(attrs.className, "gap-0 px-0 py-0")}>
        <div className="flex items-center justify-between border-b px-4 py-2.5 text-sm font-medium">New message<Button variant="ghost" size="icon-sm" aria-label="Close"><X /></Button></div>
        <div className="flex items-center gap-2 border-b px-4 py-2 text-sm"><span className="text-muted-foreground">To</span><span className="rounded-md bg-muted px-2 py-0.5">sofia@globex.com</span><input className="flex-1 bg-transparent outline-none" aria-label="Add recipient" /><span className="text-muted-foreground">Cc Bcc</span></div>
        <input defaultValue="Proposal for the Q4 campaign" aria-label="Subject" className="border-b px-4 py-2.5 text-sm font-medium outline-none bg-transparent" />
        {toolbar}
        <div contentEditable suppressContentEditableWarning className="min-h-40 px-4 py-3 text-sm leading-relaxed outline-none">Hi Sofia,<br /><br />Thanks for sending this over. A few thoughts on the timeline below.<br /><br />Best,<br />Olivia</div>
        <div className="flex items-center justify-between border-t px-4 py-2.5"><div className="flex gap-1 text-muted-foreground"><Button variant="ghost" size="icon-sm" aria-label="Attach"><Paperclip /></Button><Button variant="ghost" size="icon-sm" aria-label="Schedule"><Clock /></Button></div><Button><Send />Send</Button></div>
      </Card>
    )
  }
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-0 px-0 py-0")}>
      {toolbar}
      <div className="flex flex-col gap-3 px-6 py-6 sm:px-10">
        {mode === "post" && <Placeholder seed={`${node.path}|cover`} icon="image" aspect="banner" className="rounded-xl" label="Add a cover image" />}
        <div contentEditable suppressContentEditableWarning className="text-3xl font-semibold tracking-tight outline-none">{mode === "post" ? "What we learned shipping in public" : "Q4 planning"}</div>
        <div className="text-sm text-muted-foreground">{mode === "post" ? "Draft · Saved 2 min ago" : "Olivia Martin · Edited just now"}</div>
        <div contentEditable suppressContentEditableWarning className="flex flex-col gap-3 text-[15px] leading-relaxed outline-none">
          <p>{mode === "post" ? "For a year we published every decision, every number and every mistake. Here is what that did to the business." : "Goals for the quarter, owners and the first milestones. Comments welcome."}</p>
          <h3 className="text-lg font-semibold">{mode === "post" ? "Why we started" : "Goals"}</h3>
          {mode === "post" ? <p>It began as an experiment in accountability. It became our best marketing channel.</p> : (
            <ul className="flex flex-col gap-1.5">{["Launch the new onboarding by Oct 15", "Cut support response time to under 2 hours", "Hire two engineers"].map((g, i) => <li key={g} className="flex items-center gap-2"><Checkbox defaultChecked={i === 0} />{g}</li>)}</ul>
          )}
          <div className="flex gap-3 rounded-lg bg-muted/60 p-3 text-sm"><Icon name="sparkles" className="size-4 shrink-0 text-primary" />Type / for commands, or @ to mention someone.</div>
        </div>
      </div>
      {mode === "post" && <div className="flex items-center justify-between border-t px-4 py-3"><div className="flex gap-1.5"><Badge variant="secondary">Startups</Badge><Badge variant="secondary">Growth</Badge></div><div className="flex gap-2"><Button variant="outline">Preview</Button><Button>Publish</Button></div></div>}
    </Card>
  )
}

const ARTICLES: Record<string, { kicker: string; title: string; meta: string; sections: [string, string][] }> = {
  blog: { kicker: "Design", title: "The case for fewer, better components", meta: "8 min read · Sep 18, 2026", sections: [["", "Every design system starts small and ends up sprawling. The teams that stay fast are the ones that say no most often."], ["Start with the jobs", "List the jobs your interface has to do before you list components. Most products need far fewer than they think."], ["Make the defaults great", "A component nobody has to configure is a component nobody gets wrong. Spend your time on defaults."]] },
  legal: { kicker: "Legal", title: "Terms of Service", meta: "Last updated September 1, 2026", sections: [["1. Accepting these terms", "By creating an account or using the service, you agree to these terms. If you use it for an organization, you accept them on its behalf."], ["2. Your account", "You are responsible for your account and for keeping your password secure. Tell us right away about any unauthorized use."], ["3. Payment and renewal", "Paid plans renew automatically until cancelled. You can cancel at any time from billing settings, effective at the end of the period."], ["4. Termination", "We may suspend accounts that break these terms. You can export your data for 30 days after closing an account."]] },
  help: { kicker: "Help center / Billing", title: "How do I change my plan?", meta: "Updated 3 days ago · 2 min read", sections: [["", "You can upgrade, downgrade or cancel your plan at any time. Changes are prorated automatically."], ["Change your plan", "1. Open Settings and choose Billing.\n2. Select Change plan.\n3. Pick the new plan and confirm."], ["What happens to my data?", "Nothing is deleted when you change plans. Features outside your new plan become read-only."]] },
  docs: { kicker: "API reference", title: "Create a payment", meta: "POST /v1/payments", sections: [["", "Creates a payment for the given amount and currency. Returns the payment object on success."], ["Parameters", "amount (integer, required): amount in the smallest currency unit.\ncurrency (string, required): three-letter ISO code.\ncustomer (string): the customer id."], ["Errors", "402 card_declined when the card is declined. 429 rate_limited when you send too many requests."]] },
}

function ArticleView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const type = str(node.props.type, "blog")
  const a = ARTICLES[type] ?? ARTICLES.blog
  const toc = type === "legal" || type === "docs"
  return (
    <article {...attrs} className={cn(attrs.className, "mx-auto grid w-full max-w-4xl gap-10", toc && "lg:grid-cols-[200px_minmax(0,1fr)]")}>
      {toc && (
        <nav className="hidden flex-col gap-2 text-sm lg:flex">
          <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">On this page</span>
          {a.sections.filter(([h]) => h).map(([h], i) => <a key={h} href="#" className={cn(i === 0 ? "font-medium text-foreground" : "text-muted-foreground")}>{h}</a>)}
        </nav>
      )}
      <div className="flex max-w-2xl flex-col gap-5">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium text-primary">{a.kicker}</span>
          <h1 className={cn("font-semibold tracking-tight text-balance", type === "blog" ? "text-4xl" : "text-3xl")}>{a.title}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {type === "blog" && <Avatar className="size-7"><AvatarFallback className="text-[10px]">{initials(PEOPLE[4])}</AvatarFallback></Avatar>}
            {type === "blog" && <span className="font-medium text-foreground">{PEOPLE[4]}</span>}
            <span className={cn(type === "docs" && "rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground")}>{a.meta}</span>
          </div>
        </div>
        {type === "blog" && <Placeholder seed={`${node.path}|cover`} icon="image" aspect="wide" className="rounded-2xl" />}
        {a.sections.map(([h, body]) => (
          <section key={h || body.slice(0, 12)} className="flex flex-col gap-2">
            {h && <h2 className="text-xl font-semibold tracking-tight">{h}</h2>}
            {type === "docs" && h === "Parameters" ? (
              <dl className="divide-y rounded-xl border text-sm">{body.split("\n").map((l) => { const [k, ...rest] = l.split(": "); return <div key={k} className="flex flex-col gap-0.5 p-3"><dt className="font-mono text-[13px]">{k}</dt><dd className="text-muted-foreground">{rest.join(": ")}</dd></div> })}</dl>
            ) : <p className="whitespace-pre-line text-[15px] leading-relaxed text-pretty text-muted-foreground">{body}</p>}
          </section>
        ))}
        {type === "docs" && <pre className="overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-[13px] text-zinc-100">{`curl https://api.acme.dev/v1/payments \\\n  -u sk_test_123: \\\n  -d amount=2500 \\\n  -d currency=usd`}</pre>}
        {type === "help" && <div className="flex items-center gap-3 border-t pt-4 text-sm text-muted-foreground">Was this helpful?<Button variant="outline" size="sm"><ThumbsUp />Yes</Button><Button variant="outline" size="sm"><ThumbsDown />No</Button></div>}
      </div>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Scheduling

const WEEK_EVENTS: Record<string, [number, number, number, string][]> = {
  calendar: [[0, 9, 1, "Standup"], [0, 13, 1.5, "Design review"], [1, 10, 2, "Focus: roadmap"], [2, 9, 1, "Standup"], [2, 15, 1, "1:1 with Mia"], [3, 11, 1, "Customer call"], [3, 14, 2, "Workshop"], [4, 9, 1, "Standup"], [4, 16, 1, "Team drinks"]],
  classes: [[0, 7, 1, "Sunrise flow · Ava"], [0, 18, 1, "Power hour · Mateo"], [1, 12, 1, "Pilates · Chloe"], [2, 7, 1, "Sunrise flow · Ava"], [2, 18, 1.5, "Strength · Liam"], [3, 12, 1, "Mobility · Noah"], [4, 17, 1, "HIIT · Mateo"], [5, 9, 1.5, "Weekend flow · Ava"], [6, 10, 1, "Meditation · Mia"]],
}

function WeekView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const mode = str(node.props.mode, "calendar")
  const [view, setView] = React.useState("Week")
  if (mode === "guide") {
    const channels = ["News 24", "Sports One", "Movies HD", "Kids", "Nature"]
    const shows = [["Morning Report", "Market Watch", "World Today"], ["Match Day Live", "Highlights", "Post-game"], ["The Harbor", "Night Train"], ["Space Friends", "Draw Along", "Story Time"], ["Wild Coasts", "Deep Blue", "Big Cats"]]
    return (
      <Card {...attrs} className={cn(attrs.className, "gap-0 overflow-hidden px-0 py-0")}>
        <div className="grid grid-cols-[110px_repeat(6,minmax(0,1fr))] border-b text-xs text-muted-foreground"><span className="p-2.5">Tonight</span>{["7 PM", "7:30", "8 PM", "8:30", "9 PM", "9:30"].map((t) => <span key={t} className="border-l p-2.5">{t}</span>)}</div>
        {channels.map((c, ci) => (
          <div key={c} className="grid grid-cols-[110px_repeat(6,minmax(0,1fr))] border-b last:border-b-0">
            <span className="p-2.5 text-sm font-medium">{c}</span>
            {shows[ci].map((s, si) => <span key={s} className={cn("m-1 truncate rounded-md px-2 py-1.5 text-xs", si === 0 ? "bg-primary text-primary-foreground" : "bg-muted")} style={{ gridColumn: `span ${si === shows[ci].length - 1 ? 6 - (shows[ci].length - 1) * 2 : 2}` }}>{s}</span>)}
          </div>
        ))}
      </Card>
    )
  }
  const events = WEEK_EVENTS[mode] ?? WEEK_EVENTS.calendar
  const hours = mode === "classes" ? [7, 9, 11, 13, 15, 17, 19] : [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]
  const start = hours[0], end = hours[hours.length - 1] + (mode === "classes" ? 2 : 1)
  const days = ["Mon 22", "Tue 23", "Wed 24", "Thu 25", "Fri 26", "Sat 27", "Sun 28"]
  const H = 44
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-3 px-0 pb-0")}>
      <div className="flex flex-wrap items-center gap-2 px-5">
        <span className="font-semibold">September 22 - 28</span>
        <div className="flex"><Button variant="ghost" size="icon-sm" aria-label="Previous week"><ChevronLeft /></Button><Button variant="ghost" size="icon-sm" aria-label="Next week"><ChevronRight /></Button></div>
        <Button variant="outline" size="sm">Today</Button>
        <div className="ml-auto"><Seg options={["Day", "Week", "Month"]} value={view} onChange={setView} /></div>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[640px] grid-cols-[48px_repeat(7,minmax(0,1fr))] border-t">
          <span />
          {days.map((d, i) => <span key={d} className={cn("border-l py-2 text-center text-xs", i === 2 ? "font-semibold text-primary" : "text-muted-foreground")}>{d}</span>)}
          <div className="relative" style={{ height: (end - start) * H }}>
            {Array.from({ length: end - start }, (_, i) => <span key={i} className="absolute right-1 -translate-y-1/2 text-[10px] text-muted-foreground" style={{ top: i * H }}>{i === 0 ? "" : `${((start + i - 1) % 12) + 1}${start + i < 12 ? "a" : "p"}`}</span>)}
          </div>
          {days.map((d, di) => (
            <div key={d} className="relative border-t border-l" style={{ height: (end - start) * H, backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 ${H - 1}px, var(--border) ${H - 1}px ${H}px)` }}>
              {events.filter((e) => e[0] === di).map(([, h, len, title], i) => (
                <div key={i} className="absolute inset-x-1 overflow-hidden rounded-md px-1.5 py-1 text-[11px] leading-tight" style={{ top: (h - start) * H + 1, height: len * H - 3, background: `color-mix(in oklch, var(--chart-${(i % 4) + 1}) 22%, transparent)`, borderLeft: `3px solid var(--chart-${(i % 4) + 1})` }}>
                  <div className="font-medium">{title}</div><div className="text-muted-foreground">{h > 12 ? h - 12 : h}:00</div>
                </div>
              ))}
              {di === 2 && <div className="absolute inset-x-0 z-10 h-0.5 bg-rose-500" style={{ top: (11.5 - start) * H }}><span className="absolute -top-1 -left-1 size-2.5 rounded-full bg-rose-500" /></div>}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Learning

const QUESTIONS: [string, string[], number][] = [
  ["Which planet is known as the Red Planet?", ["Venus", "Mars", "Jupiter", "Mercury"], 1],
  ["What is the largest ocean on Earth?", ["Atlantic", "Indian", "Pacific", "Arctic"], 2],
  ["Who painted the Mona Lisa?", ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], 2],
]
const CARDS: [string, string][] = [["Ubiquitous", "Present, appearing or found everywhere."], ["Ephemeral", "Lasting for a very short time."], ["Serendipity", "Finding something good without looking for it."]]

function QuizView({ node }: { node: UINode }) {
  const { r, attrs } = useNode(node)
  const mode = str(node.props.mode, "question")
  const [q] = React.useState(() => Math.floor(r() * QUESTIONS.length))
  const [chosen, setChosen] = React.useState<number | null>(null)
  const [locked, setLocked] = React.useState(false)
  const [flipped, setFlipped] = React.useState(false)
  if (mode === "results") {
    const c = 2 * Math.PI * 42
    return (
      <Card {...attrs} className={cn(attrs.className, "mx-auto w-full max-w-md items-center gap-5 px-6 py-8 text-center")}>
        <div className="relative size-36"><svg viewBox="0 0 100 100" className="size-full -rotate-90"><circle cx="50" cy="50" r="42" className="fill-none stroke-muted" strokeWidth="9" /><circle cx="50" cy="50" r="42" className="fill-none stroke-primary" strokeWidth="9" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * 0.2} /></svg><div className="absolute inset-0 grid place-items-center"><div><div className="text-4xl font-semibold tabular-nums">8/10</div><div className="text-xs text-muted-foreground">correct</div></div></div></div>
        <div><div className="text-2xl font-semibold tracking-tight">Great job!</div><div className="text-sm text-muted-foreground">You beat 76% of players · 2:14 total time</div></div>
        <div className="grid w-full grid-cols-3 gap-2 text-sm">{[["Correct", "8"], ["Wrong", "2"], ["Streak", "5"]].map(([k, v]) => <div key={k} className="rounded-xl bg-muted/60 p-3"><div className="text-lg font-semibold">{v}</div><div className="text-xs text-muted-foreground">{k}</div></div>)}</div>
        <div className="flex w-full gap-2"><Button variant="outline" className="flex-1">Review answers</Button><Button className="flex-1">Play again</Button></div>
      </Card>
    )
  }
  if (mode === "flashcard") {
    const [term, def] = CARDS[q % CARDS.length]
    return (
      <section {...attrs} className={cn(attrs.className, "mx-auto flex w-full max-w-md flex-col gap-4")}>
        <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Card 7 of 24</span><span>Vocabulary · Set 3</span></div>
        <Progress value={29} />
        <button type="button" onClick={() => setFlipped((f) => !f)} className="grid min-h-60 place-items-center rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-foreground/10 transition-transform active:scale-[0.99]">
          {flipped ? <p className="text-xl text-pretty">{def}</p> : <span className="text-4xl font-semibold tracking-tight">{term}</span>}
        </button>
        <span className="text-center text-xs text-muted-foreground">Tap the card to flip</span>
        <div className="grid grid-cols-2 gap-2"><Button variant="outline" size="lg"><X />Still learning</Button><Button size="lg"><Check />Know it</Button></div>
      </section>
    )
  }
  const [question, options, answer] = QUESTIONS[q]
  return (
    <Card {...attrs} className={cn(attrs.className, "mx-auto w-full max-w-xl gap-5 px-6")}>
      <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Question 3 of 10</span><span className="flex items-center gap-1.5 font-medium tabular-nums"><TimerIcon className="size-4 text-primary" />0:18</span></div>
      <Progress value={30} />
      <h2 className="text-xl font-semibold tracking-tight text-balance">{question}</h2>
      <div className="flex flex-col gap-2">
        {options.map((o, i) => {
          const right = locked && i === answer, wrong = locked && chosen === i && i !== answer
          return (
            <button key={o} type="button" disabled={locked} onClick={() => setChosen(i)} className={cn("flex items-center gap-3 rounded-xl border p-4 text-left transition-colors", chosen === i && !locked && "border-primary bg-primary/5", right && "border-emerald-500 bg-emerald-500/10", wrong && "border-rose-500 bg-rose-500/10", !locked && "hover:bg-muted")}>
              <span className={cn("grid size-7 shrink-0 place-items-center rounded-full border text-sm font-medium", chosen === i && !locked && "border-primary bg-primary text-primary-foreground")}>{String.fromCharCode(65 + i)}</span>
              <span className="flex-1">{o}</span>
              {right && <CircleCheck className="size-5 text-emerald-500" />}{wrong && <CircleX className="size-5 text-rose-500" />}
            </button>
          )
        })}
      </div>
      <Button size="lg" disabled={chosen === null} onClick={() => setLocked(true)}>{locked ? "Next question" : "Check answer"}</Button>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Tools

const SCAN: Record<string, { hint: string; found: string; meta: string; action: string }> = {
  barcode: { hint: "Point at a barcode", found: "Greek yogurt, plain", meta: "150 kcal · 15g protein per cup", action: "Add to log" },
  "QR code": { hint: "Point at a QR code", found: "acme.app/menu", meta: "Open the menu for table 12", action: "Open link" },
  document: { hint: "Fit the document inside the frame", found: "Driver license detected", meta: "Front side captured · Hold steady", action: "Use photo" },
  receipt: { hint: "Fit the receipt inside the frame", found: "Blue Bottle Coffee · $14.50", meta: "Sep 23 · Meals and entertainment", action: "Save expense" },
}

function ScannerView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const s = SCAN[str(node.props.target, "barcode")] ?? SCAN.barcode
  const wide = str(node.props.target, "barcode") === "barcode"
  return (
    <section {...attrs} className={cn(attrs.className, "mx-auto flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-lg")}>
      <div className="relative aspect-[3/4]">
        <Placeholder seed="scan" aspect="portrait" iconless className="absolute inset-0 opacity-25" />
        <div className="absolute inset-x-0 top-4 text-center text-sm text-white/80">{s.hint}</div>
        <div className={cn("absolute top-1/2 left-1/2 -translate-1/2", wide ? "h-28 w-60" : "size-56")}>
          {["top-0 left-0 border-t-4 border-l-4 rounded-tl-xl", "top-0 right-0 border-t-4 border-r-4 rounded-tr-xl", "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl", "bottom-0 right-0 border-r-4 border-b-4 rounded-br-xl"].map((c) => <span key={c} className={cn("absolute size-8 border-white", c)} />)}
          <span className="absolute inset-x-3 top-1/2 h-0.5 animate-pulse bg-primary shadow-[0_0_12px_2px] shadow-primary" />
        </div>
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-6">
          <Button variant="secondary" size="icon-lg" className="rounded-full" aria-label="Flash"><Flashlight /></Button>
          <Button variant="secondary" size="icon-lg" className="rounded-full" aria-label="From photos"><ImageIcon /></Button>
        </div>
      </div>
      <div className="flex items-center gap-3 bg-card p-4 text-card-foreground">
        <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><CircleCheck className="size-5" /></div>
        <div className="min-w-0 flex-1"><div className="truncate font-medium">{s.found}</div><div className="truncate text-xs text-muted-foreground">{s.meta}</div></div>
        <Button size="sm">{s.action}</Button>
      </div>
    </section>
  )
}

const GAUGES: Record<string, { value: number; min: number; max: number; unit: string; bands: [string, number, string][]; note: string }> = {
  BMI: { value: 23.4, min: 15, max: 40, unit: "", bands: [["Underweight", 18.5, "bg-sky-400"], ["Healthy", 25, "bg-emerald-500"], ["Overweight", 30, "bg-amber-400"], ["Obese", 40, "bg-rose-500"]], note: "A healthy range for your height is 128 to 172 lb." },
  "heart rate": { value: 148, min: 90, max: 200, unit: "bpm", bands: [["Zone 1", 114, "bg-sky-400"], ["Zone 2", 133, "bg-emerald-500"], ["Zone 3", 152, "bg-amber-400"], ["Zone 4", 171, "bg-orange-500"], ["Zone 5", 200, "bg-rose-500"]], note: "Zone 3, aerobic. Hold this pace for endurance." },
  "credit score": { value: 742, min: 300, max: 850, unit: "", bands: [["Poor", 580, "bg-rose-500"], ["Fair", 670, "bg-orange-500"], ["Good", 740, "bg-amber-400"], ["Very good", 800, "bg-emerald-500"], ["Excellent", 850, "bg-emerald-600"]], note: "Up 12 points since last month. Keep card balances under 30%." },
  "air quality": { value: 42, min: 0, max: 300, unit: "AQI", bands: [["Good", 50, "bg-emerald-500"], ["Moderate", 100, "bg-amber-400"], ["Unhealthy for some", 150, "bg-orange-500"], ["Unhealthy", 300, "bg-rose-500"]], note: "Air quality is good. A great day to be outside." },
  "password strength": { value: 3, min: 0, max: 4, unit: "", bands: [["Weak", 1, "bg-rose-500"], ["Fair", 2, "bg-orange-500"], ["Good", 3, "bg-amber-400"], ["Strong", 4, "bg-emerald-500"]], note: "Add a symbol to make it strong." },
}

function GaugeView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const measure = str(node.props.measure, "BMI")
  const g = GAUGES[measure] ?? GAUGES.BMI
  const pos = ((g.value - g.min) / (g.max - g.min)) * 100
  let prev = g.min
  const band = g.bands.find(([, upto]) => g.value <= upto) ?? g.bands[g.bands.length - 1]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-4 px-5")}>
      <div className="flex items-end justify-between">
        <div><div className="text-sm text-muted-foreground">{measure === "BMI" ? "Your BMI" : measure[0].toUpperCase() + measure.slice(1)}</div><div className="text-4xl font-semibold tracking-tight tabular-nums">{g.value}{g.unit && <span className="ml-1 text-base font-normal text-muted-foreground">{g.unit}</span>}</div></div>
        <Badge className={cn("text-white", band[2])}>{band[0]}</Badge>
      </div>
      <div className="relative pt-3">
        <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full">
          {g.bands.map(([label, upto, color]) => { const w = ((upto - prev) / (g.max - g.min)) * 100; prev = upto; return <div key={label} className={color} style={{ width: `${w}%` }} /> })}
        </div>
        <span className="absolute top-0 size-0 -translate-x-1/2 border-x-[7px] border-t-[9px] border-x-transparent border-t-foreground" style={{ left: `${pos}%` }} />
      </div>
      <div className="flex justify-between text-[11px] text-muted-foreground">{g.bands.map(([l]) => <span key={l}>{l}</span>)}</div>
      <p className="text-sm text-muted-foreground">{g.note}</p>
    </Card>
  )
}

const RATES: Record<string, Record<string, number>> = {
  currency: { USD: 1, EUR: 0.92, GBP: 0.78, JPY: 148.2, MXN: 17.1, CAD: 1.36 },
  length: { meters: 1, feet: 3.28084, inches: 39.3701, centimeters: 100, kilometers: 0.001, miles: 0.000621371 },
  weight: { kilograms: 1, pounds: 2.20462, ounces: 35.274, grams: 1000 },
  cooking: { cups: 1, tablespoons: 16, teaspoons: 48, milliliters: 236.6, "fluid ounces": 8 },
}

function ConverterView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const units = str(node.props.units, "currency")
  const temp = units === "temperature"
  const table = RATES[units] ?? RATES.currency
  const names = temp ? ["Celsius", "Fahrenheit", "Kelvin"] : Object.keys(table)
  const [amount, setAmount] = React.useState(units === "currency" ? "100" : temp ? "21" : "1")
  const [from, setFrom] = React.useState(names[0])
  const [to, setTo] = React.useState(names[1])
  const n = Number(amount) || 0
  const convert = (v: number, a: string, b: string) => {
    if (!temp) return (v / table[a]) * table[b]
    const c = a === "Celsius" ? v : a === "Fahrenheit" ? ((v - 32) * 5) / 9 : v - 273.15
    return b === "Celsius" ? c : b === "Fahrenheit" ? (c * 9) / 5 + 32 : c + 273.15
  }
  const out = convert(n, from, to)
  const fmt = (v: number) => (Math.abs(v) >= 1000 ? v.toLocaleString("en-US", { maximumFractionDigits: 2 }) : +v.toFixed(4) + "")
  const sel = (value: string, set: (v: string) => void, label: string) => (
    <NativeSelect value={value} onChange={(e) => set(e.target.value)} aria-label={label} className="w-36">{names.map((u) => <NativeSelectOption key={u} value={u}>{u}</NativeSelectOption>)}</NativeSelect>
  )
  return (
    <Card {...attrs} className={cn(attrs.className, "mx-auto w-full max-w-md gap-3 px-5")}>
      <div className="font-semibold">{units === "currency" ? "Currency converter" : `${units[0].toUpperCase() + units.slice(1)} converter`}</div>
      <div className="flex gap-2"><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className="h-12 text-xl tabular-nums" aria-label="Amount" />{sel(from, setFrom, "From")}</div>
      <div className="flex justify-center"><Button variant="outline" size="icon" className="rounded-full" aria-label="Swap" onClick={() => { setFrom(to); setTo(from) }}><ArrowUpDown /></Button></div>
      <div className="flex gap-2"><div className="flex h-12 flex-1 items-center rounded-lg bg-muted px-3 text-xl font-semibold tabular-nums">{fmt(out)}</div>{sel(to, setTo, "To")}</div>
      <p className="text-sm text-muted-foreground">1 {from} = {fmt(convert(1, from, to))} {to}{units === "currency" && " · Updated 2 min ago"}</p>
    </Card>
  )
}

const LOG_LINES: Record<string, [string, string, string][]> = {
  deployment: [["info", "build", "Cloning repository at 9f3c1a2"], ["info", "build", "Installing dependencies (bun install)"], ["info", "build", "Compiled successfully in 18.4s"], ["warn", "build", "Large page bundle: /dashboard (412 kB)"], ["info", "deploy", "Uploading 214 static files"], ["info", "deploy", "Assigning domain acme.app"], ["info", "deploy", "Deployment ready in 42s"]],
  application: [["info", "api", "GET /v1/orders 200 in 84ms"], ["info", "api", "POST /v1/payments 201 in 212ms"], ["warn", "db", "Slow query on orders (1.2s)"], ["error", "api", "POST /v1/refunds 500: card_processor_timeout"], ["info", "worker", "Retrying job refunds#8812 (attempt 2)"], ["info", "api", "GET /v1/customers 200 in 61ms"], ["info", "worker", "Job refunds#8812 succeeded"]],
  access: [["info", "edge", "203.0.113.4 GET / 200 12ms"], ["info", "edge", "198.51.100.7 GET /pricing 200 18ms"], ["warn", "edge", "192.0.2.44 GET /admin 403"], ["info", "edge", "203.0.113.9 POST /api/login 200 96ms"], ["error", "edge", "198.51.100.2 GET /api/report 502"], ["info", "edge", "203.0.113.4 GET /docs 200 9ms"]],
  audit: [["info", "auth", "olivia@acme.com signed in from Miami"], ["info", "members", "olivia@acme.com invited lucas@acme.com"], ["warn", "billing", "Plan changed from Team to Pro"], ["info", "api", "API key sk_live_...81 created"], ["error", "auth", "Failed sign-in for admin@acme.com (3 attempts)"], ["info", "settings", "SSO enabled for acme.com"]],
}

function LogsView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const lines = LOG_LINES[str(node.props.source, "application")] ?? LOG_LINES.application
  const [level, setLevel] = React.useState("All")
  const [live, setLive] = React.useState(true)
  const [q, setQ] = React.useState("")
  const shown = lines.filter(([lv, , m]) => (level === "All" || lv === level.toLowerCase()) && (!q || m.toLowerCase().includes(q.toLowerCase())))
  const color = { info: "text-sky-400", warn: "text-amber-400", error: "text-rose-400" } as Record<string, string>
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-0 overflow-hidden px-0 py-0")}>
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <div className="relative min-w-40 flex-1"><Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search logs" className="h-8 pl-8" /></div>
        <Seg options={["All", "Info", "Warn", "Error"]} value={level} onChange={setLevel} />
        <button type="button" onClick={() => setLive((l) => !l)} className="flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs"><span className={cn("size-2 rounded-full", live ? "animate-pulse bg-emerald-500" : "bg-muted-foreground")} />{live ? "Live" : "Paused"}</button>
      </div>
      <div className="max-h-72 overflow-auto bg-zinc-950 p-3 font-mono text-[12px] leading-relaxed text-zinc-300">
        {shown.map(([lv, src, msg], i) => (
          <div key={i} className="flex gap-3 whitespace-nowrap"><span className="text-zinc-500">14:02:{pad(8 + i * 3)}.{(i * 137) % 1000}</span><span className={cn("w-10 uppercase", color[lv])}>{lv}</span><span className="text-zinc-500">[{src}]</span><span className={cn(lv === "error" && "text-rose-300")}>{msg}</span></div>
        ))}
        {live && <div className="flex items-center gap-2 pt-1 text-zinc-500"><Loader className="size-3 animate-spin" />Waiting for new lines...</div>}
      </div>
    </Card>
  )
}

const STAGES = ["Checkout", "Install", "Build", "Test", "Deploy"]
function PipelineView({ node }: { node: UINode }) {
  const { attrs } = useNode(node)
  const runs: [string, string, string, number, string, string][] = [
    ["main", "Add pricing page experiment", "9f3c1a2", 5, "2m 41s", PEOPLE[0]],
    ["feat/search", "Debounce search input", "41be07d", 3, "running", PEOPLE[2]],
    ["main", "Fix checkout tax rounding", "c2d9e44", -4, "1m 58s", PEOPLE[6]],
    ["main", "Upgrade to Next 16.3", "7ab1f30", 5, "3m 12s", PEOPLE[4]],
  ]
  return (
    <Card {...attrs} className={cn(attrs.className, "gap-0 px-0 py-0")}>
      <div className="flex items-center justify-between border-b px-5 py-3"><span className="font-semibold">Pipeline runs</span><Button variant="outline" size="sm"><Play />Run pipeline</Button></div>
      {runs.map(([branch, msg, sha, done, dur, who]) => {
        const failed = done < 0, running = dur === "running"
        return (
          <div key={sha} className="flex flex-wrap items-center gap-3 border-b px-5 py-3.5 last:border-b-0">
            {failed ? <CircleX className="size-5 text-rose-500" /> : running ? <Loader className="size-5 animate-spin text-amber-500" /> : <CircleCheck className="size-5 text-emerald-500" />}
            <div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{msg}</div><div className="text-xs text-muted-foreground"><span className="font-mono">{sha}</span> · {branch} · {who}</div></div>
            <div className="flex gap-1">{STAGES.map((st, i) => <span key={st} title={st} className={cn("h-2 w-7 rounded-full", failed && i === -done - 1 ? "bg-rose-500" : i < Math.abs(done) ? (failed ? "bg-emerald-500/60" : "bg-emerald-500") : running && i === done ? "animate-pulse bg-amber-500" : "bg-muted")} />)}</div>
            <span className="w-16 text-right text-xs text-muted-foreground tabular-nums">{running ? "1m 04s" : dur}</span>
            {failed && <Button variant="outline" size="sm"><RotateCcw />Re-run</Button>}
          </div>
        )
      })}
    </Card>
  )
}

export const PRIMITIVE_VIEWS: Partial<Record<UINode["kind"], View>> = {
  tracker: TrackerView, countdown: CountdownView, timer: TimerView, filters: FiltersView, matrix: MatrixView,
  itinerary: ItineraryView, ticket: TicketView, invite: InviteView, breakdown: BreakdownView, wallet: WalletView,
  stories: StoriesView, people: PeopleView, cart: CartView, editor: EditorView, article: ArticleView, week: WeekView,
  choices: ChoicesView, quiz: QuizView, call: CallView, reader: ReaderView, amenities: AmenitiesView, thread: ThreadView,
  scanner: ScannerView, gauge: GaugeView, days: DaysView, logs: LogsView, pipeline: PipelineView,
  converter: ConverterView, clocks: ClocksView,
}

export type { Rand }
export { pick }
