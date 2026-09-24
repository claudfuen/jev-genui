// Deterministic sample content for the interpreter. Jev decides structure and
// labels; values like numbers, names and dates are not decisions, so they are
// generated from a seed (query + node path) and stay stable while you type.

export function rng(seed: string) {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619)
  let a = h >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type Rand = ReturnType<typeof rng>
export const pick = <T,>(r: Rand, xs: readonly T[]) => xs[Math.floor(r() * xs.length)]
export const between = (r: Rand, lo: number, hi: number) => lo + r() * (hi - lo)

export const PEOPLE = [
  "Olivia Martin", "Jackson Lee", "Isabella Nguyen", "William Kim", "Sofia Davis",
  "Liam Johnson", "Ava Patel", "Noah Garcia", "Mia Chen", "Lucas Brown", "Emma Wilson",
  "Mateo Rossi", "Chloe Dubois", "Arjun Mehta",
]
const ROLES = ["Product designer", "Engineer", "Account manager", "Founder", "Marketing lead", "Support", "Data analyst", "Head of sales"]
const CITIES = ["New York", "Miami", "London", "Berlin", "Tokyo", "Toronto", "Lisbon", "Mexico City", "Sydney"]
const COMPANIES = ["Northwind", "Globex", "Initech", "Vandelay", "Brightline", "Summit Labs", "Bluefin", "Parallel"]
const PRODUCTS = ["Starter kit", "Pro bundle", "Classic", "Signature", "Limited edition", "Everyday", "Deluxe", "Mini"]
const TASKS = ["Review pull request", "Send invoice to client", "Prepare quarterly report", "Update onboarding docs", "Sync with design team", "Fix checkout bug", "Plan team offsite", "Renew SSL certificate"]
const NOTIFS = ["New order received", "Payment succeeded", "Your report is ready", "New comment on your post", "Password changed", "Weekly summary available", "Low stock alert", "New follower"]
const FILES = ["Q3 report.pdf", "Brand guidelines.fig", "Invoice 1042.pdf", "Team photo.jpg", "Roadmap.xlsx", "Contract.docx", "Menu draft.pdf", "Pitch deck.key"]
const MSGS = ["Can we move the call to 3pm?", "Just sent over the files.", "Looks great, ship it!", "Thanks for the quick turnaround.", "Are we still on for Friday?", "I left a few comments on the draft."]
const EVENTS = ["Team standup", "Product launch", "Customer workshop", "Quarterly review", "Tasting night", "Live music", "Sunrise session", "Design critique"]
const MERCHANTS = ["Stripe payout", "AWS", "Figma", "Office rent", "Supplier invoice", "Payroll", "Customer refund", "Google Ads"]
const STATUSES = ["Active", "Pending", "Paused", "Completed", "Failed"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

export const initials = (name: string) => name.split(" ").map((w) => w[0]).join("").slice(0, 2)

// ---------------------------------------------------------------------------
// Metrics

type Fmt = "currency" | "percent" | "count" | "ms" | "temp" | "rating" | "unit"
type MetricSpec = { fmt: Fmt; lo: number; hi: number; unit?: string; lowerIsBetter?: boolean }

const METRIC_SPECS: Record<string, MetricSpec> = {
  "Total revenue": { fmt: "currency", lo: 20000, hi: 480000 },
  Revenue: { fmt: "currency", lo: 8000, hi: 250000 },
  "Average order value": { fmt: "currency", lo: 12, hi: 180 },
  MRR: { fmt: "currency", lo: 8000, hi: 180000 },
  "Net profit": { fmt: "currency", lo: 4000, hi: 90000 },
  Expenses: { fmt: "currency", lo: 3000, hi: 60000, lowerIsBetter: true },
  "Cash balance": { fmt: "currency", lo: 20000, hi: 900000 },
  "Portfolio value": { fmt: "currency", lo: 10000, hi: 600000 },
  "Pipeline value": { fmt: "currency", lo: 50000, hi: 2000000 },
  "Conversion rate": { fmt: "percent", lo: 1.2, hi: 9 },
  "Churn rate": { fmt: "percent", lo: 0.8, hi: 6, lowerIsBetter: true },
  "Bounce rate": { fmt: "percent", lo: 25, hi: 60, lowerIsBetter: true },
  "Open rate": { fmt: "percent", lo: 18, hi: 55 },
  "Click-through rate": { fmt: "percent", lo: 1, hi: 8 },
  Uptime: { fmt: "percent", lo: 99.5, hi: 99.99 },
  "Error rate": { fmt: "percent", lo: 0.05, hi: 2, lowerIsBetter: true },
  Occupancy: { fmt: "percent", lo: 55, hi: 97 },
  "Completion rate": { fmt: "percent", lo: 40, hi: 92 },
  Return: { fmt: "percent", lo: 2, hi: 24 },
  "Win rate": { fmt: "percent", lo: 12, hi: 45 },
  Engagement: { fmt: "percent", lo: 3, hi: 18 },
  Satisfaction: { fmt: "percent", lo: 82, hi: 99 },
  Humidity: { fmt: "percent", lo: 35, hi: 88 },
  Latency: { fmt: "ms", lo: 40, hi: 320, lowerIsBetter: true },
  "Response time": { fmt: "unit", lo: 2, hi: 45, unit: "min", lowerIsBetter: true },
  Temperature: { fmt: "temp", lo: 58, hi: 92 },
  Rating: { fmt: "rating", lo: 4.1, hi: 4.9 },
  "Heart rate": { fmt: "unit", lo: 58, hi: 92, unit: "bpm" },
  "Wind speed": { fmt: "unit", lo: 3, hi: 22, unit: "mph" },
  Distance: { fmt: "unit", lo: 2, hi: 42, unit: "km" },
  "Calories burned": { fmt: "unit", lo: 180, hi: 2400, unit: "kcal" },
  "Hours logged": { fmt: "unit", lo: 12, hi: 160, unit: "h" },
  NPS: { fmt: "count", lo: 24, hi: 72 },
  Sleep: { fmt: "unit", lo: 5, hi: 9, unit: "h" },
  "UV index": { fmt: "count", lo: 2, hi: 11 },
  Donations: { fmt: "currency", lo: 2000, hi: 90000 },
}

export function metricSpec(label: string): MetricSpec {
  return METRIC_SPECS[label] ?? { fmt: "count", lo: 120, hi: 48000 }
}

export function formatMetric(label: string, v: number, compact = false) {
  const s = metricSpec(label)
  switch (s.fmt) {
    case "currency":
      return v >= 10000 && compact
        ? `$${Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)}`
        : `$${Math.round(v).toLocaleString("en-US")}`
    case "percent":
      return `${v.toFixed(v >= 99 ? 2 : 1)}%`
    case "ms":
      return `${Math.round(v)}ms`
    case "temp":
      return `${Math.round(v)}°F`
    case "rating":
      return `${v.toFixed(1)} / 5`
    case "unit":
      return `${Math.round(v).toLocaleString("en-US")} ${s.unit}`
    default:
      return compact && v >= 10000
        ? Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(v)
        : Math.round(v).toLocaleString("en-US")
  }
}

export function metricValue(r: Rand, label: string) {
  const s = metricSpec(label)
  const value = between(r, s.lo, s.hi)
  const delta = between(r, -8, 24)
  return { value, delta, good: s.lowerIsBetter ? delta < 0 : delta >= 0 }
}

// ---------------------------------------------------------------------------
// Charts

export function axisLabels(x: string): string[] {
  switch (x) {
    case "months": {
      const end = 8 // through September
      return MONTHS.slice(end - 6, end + 1)
    }
    case "weeks":
      return ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"]
    case "weekdays":
      return DAY
    case "hours":
      return ["6am", "8am", "10am", "12pm", "2pm", "4pm", "6pm", "8pm"]
    case "regions":
      return ["North America", "Europe", "Asia", "Latin America", "Africa"]
    case "channels":
      return ["Organic", "Paid", "Social", "Email", "Referral"]
    default:
      return ["Core", "Plus", "Pro", "Max", "Lite"]
  }
}

export function series(r: Rand, label: string, n: number) {
  const s = metricSpec(label)
  let v = between(r, s.lo, s.hi) * 0.7
  return Array.from({ length: n }, () => {
    v = Math.max(s.lo * 0.5, v * between(r, 0.9, 1.18))
    return +v.toFixed(s.fmt === "percent" || s.fmt === "rating" ? 2 : 0)
  })
}

// ---------------------------------------------------------------------------
// Tables

export type Cell = { text: string; badge?: "default" | "secondary" | "outline" | "destructive" }

export function cell(r: Rand, col: string, row: number): Cell {
  const person = PEOPLE[(row * 5 + Math.floor(r() * 3)) % PEOPLE.length]
  switch (col) {
    case "Name": case "Customer": case "Client": case "Assignee":
      return { text: person }
    case "Email":
      return { text: `${person.split(" ")[0].toLowerCase()}@example.com` }
    case "Status": {
      const s = pick(r, STATUSES)
      return { text: s, badge: s === "Failed" ? "destructive" : s === "Active" || s === "Completed" ? "default" : "secondary" }
    }
    case "Priority": {
      const p = pick(r, ["Low", "Medium", "High", "Urgent"])
      return { text: p, badge: p === "Urgent" ? "destructive" : p === "High" ? "default" : "outline" }
    }
    case "Role":
      return { text: pick(r, ["Owner", "Admin", "Editor", "Viewer"]), badge: "outline" }
    case "Plan":
      return { text: pick(r, ["Free", "Pro", "Team", "Enterprise"]), badge: "secondary" }
    case "Amount": case "Price": case "Revenue":
      return { text: `$${between(r, 12, col === "Price" ? 240 : 4800).toFixed(2)}` }
    case "Date": case "Due date": case "Last active": {
      const d = new Date(2026, 8, 23 - row * 2 - Math.floor(r() * 2))
      return { text: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) }
    }
    case "Order": case "Invoice":
      return { text: `#${1042 + row * 7}` }
    case "Product":
      return { text: PRODUCTS[(row + Math.floor(r() * 2)) % PRODUCTS.length] }
    case "Quantity": case "Stock":
      return { text: String(Math.round(between(r, 1, col === "Stock" ? 400 : 12))) }
    case "Category":
      return { text: pick(r, ["Hardware", "Software", "Services", "Apparel", "Food"]) }
    case "Location":
      return { text: pick(r, CITIES) }
    case "Progress": case "Score":
      return { text: `${Math.round(between(r, 20, 100))}${col === "Progress" ? "%" : ""}` }
    case "Method":
      return { text: pick(r, ["Visa 4242", "Mastercard 1881", "PayPal", "Apple Pay"]) }
    case "Rank":
      return { text: `#${row + 1}` }
    case "Team":
      return { text: pick(r, ["Design", "Engineering", "Sales", "Marketing", "Support"]) }
    case "Duration":
      return { text: `${Math.round(between(r, 1, 59))}m ${Math.round(between(r, 0, 59))}s` }
    case "Company":
      return { text: pick(r, COMPANIES) }
    case "Rating":
      return { text: `${between(r, 3.8, 5).toFixed(1)}` }
    case "Service":
      return { text: pick(r, ["API", "Web app", "Database", "Auth", "Payments", "Search", "CDN"]) }
    case "Ticket":
      return { text: `#T-${2041 + row * 3}` }
    case "Symbol":
      return { text: ["BTC", "ETH", "SOL", "USDC", "AVAX", "LINK"][row % 6] }
    case "Change": {
      const v = between(r, -6, 9)
      return { text: `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`, badge: v >= 0 ? "secondary" : "destructive" }
    }
    default:
      return { text: "..." }
  }
}

// ---------------------------------------------------------------------------
// Lists

export type ListItem = { title: string; meta: string; avatar?: string; trailing?: string; positive?: boolean; done?: boolean }

export function listItems(r: Rand, kind: string, n = 4): ListItem[] {
  const taskOffset = Math.floor(r() * TASKS.length)
  return Array.from({ length: n }, (_, i) => {
    const person = PEOPLE[(i * 3 + Math.floor(r() * 4)) % PEOPLE.length]
    switch (kind) {
      case "people":
        return { title: person, meta: pick(r, ROLES), avatar: initials(person) }
      case "tasks":
        return { title: TASKS[(i + taskOffset) % TASKS.length], meta: `Due ${pick(r, ["today", "tomorrow", "Friday", "next week"])}`, done: i === 0 }
      case "notifications":
        return { title: NOTIFS[(i * 2 + Math.floor(r() * 2)) % NOTIFS.length], meta: `${i * 7 + 2} min ago` }
      case "files":
        return { title: FILES[(i + Math.floor(r() * 4)) % FILES.length], meta: `${between(r, 0.2, 24).toFixed(1)} MB` }
      case "messages":
        return { title: person, meta: MSGS[(i + Math.floor(r() * 3)) % MSGS.length], avatar: initials(person), trailing: `${i + 1}h` }
      case "products":
        return { title: PRODUCTS[(i * 2 + Math.floor(r() * 2)) % PRODUCTS.length], meta: pick(r, ["In stock", "Low stock", "New"]), trailing: `$${between(r, 8, 180).toFixed(2)}` }
      case "events": {
        const d = new Date(2026, 8, 24 + i * 3)
        return { title: EVENTS[(i + Math.floor(r() * 4)) % EVENTS.length], meta: `${d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at ${pick(r, ["9:00", "11:30", "2:00", "6:30"])}` }
      }
      case "apps": {
        const apps = ["Slack", "Google Calendar", "Stripe", "GitHub", "Notion", "Zapier", "HubSpot", "Figma"]
        const name = apps[(i * 2 + Math.floor(r() * 2)) % apps.length]
        return { title: name, meta: i % 2 ? "Not connected" : "Connected", trailing: i % 2 ? "Connect" : "Manage" }
      }
      case "services": {
        const svcs = ["API", "Web app", "Database", "Auth", "Payments", "Search", "CDN", "Email"]
        const bad = r() < 0.15
        return { title: svcs[(i + Math.floor(r() * 3)) % svcs.length], meta: bad ? "Degraded performance" : `${between(r, 99.9, 100).toFixed(2)}% uptime`, trailing: bad ? "Degraded" : "Operational", positive: !bad }
      }
      case "holdings": {
        const coins = [["Bitcoin", "BTC"], ["Ethereum", "ETH"], ["Solana", "SOL"], ["Apple", "AAPL"], ["Nvidia", "NVDA"], ["USD Coin", "USDC"]]
        const [name, sym] = coins[(i + Math.floor(r() * 2)) % coins.length]
        const ch = between(r, -6, 9)
        return { title: name, meta: `${between(r, 0.1, 40).toFixed(2)} ${sym}`, trailing: `${ch >= 0 ? "+" : ""}${ch.toFixed(1)}%`, positive: ch >= 0 }
      }
      case "tracks": {
        const t = TRACKS.music[i % TRACKS.music.length]
        return { title: t.title, meta: t.by, trailing: t.length }
      }
      case "transactions":
      default: {
        const out = r() < 0.4
        return { title: MERCHANTS[(i * 3 + Math.floor(r() * 3)) % MERCHANTS.length], meta: pick(r, ["Today", "Yesterday", "Sep 20", "Sep 18"]), trailing: `${out ? "-" : "+"}$${between(r, 20, 2400).toFixed(2)}`, positive: !out }
      }
    }
  })
}

export const FAQ_ANSWERS: Record<string, string> = {
  "How does billing work?": "You are billed monthly or yearly, depending on your plan. Invoices are emailed automatically.",
  "Can I cancel anytime?": "Yes. Cancel from your account settings and you keep access until the end of the period.",
  "Is there a free trial?": "Every plan starts with a 14-day free trial. No credit card required.",
  "Do you offer refunds?": "If something is not right, contact us within 30 days for a full refund.",
  "How do I reset my password?": "Use the forgot password link on the sign-in page and follow the email instructions.",
  "Is my data secure?": "Data is encrypted in transit and at rest, and we never sell or share it.",
  "Do you ship internationally?": "We ship to over 40 countries. Rates are calculated at checkout.",
  "How long does delivery take?": "Most orders arrive within 2 to 5 business days.",
  "Can I change my plan later?": "Upgrade or downgrade at any time. Changes are prorated automatically.",
  "Do you offer team discounts?": "Teams of 10 or more get volume pricing. Reach out and we will set it up.",
  "How do I contact support?": "Email us or use the chat in the corner. We reply within one business day.",
  "What payment methods do you accept?": "All major cards, Apple Pay, Google Pay and bank transfer.",
  "Can I book for a large group?": "Yes. For groups larger than 8, send us a message and we will arrange it.",
  "Do you have vegetarian options?": "Plenty. Vegetarian and vegan dishes are marked on the menu.",
  "Where are you located?": "Find us downtown, a short walk from the main station.",
  "What are your opening hours?": "Monday to Friday 7am to 7pm, weekends 8am to 5pm.",
  "Do I need an account?": "You can browse without one. An account lets you save favorites and track orders.",
  "How do I invite my team?": "Open settings, choose Members and send invites by email.",
}

export const FIELD_OPTIONS: Record<string, string[]> = {
  Country: ["United States", "Canada", "Mexico", "United Kingdom", "Germany", "Japan"],
  Language: ["English", "Spanish", "French", "German", "Japanese"],
  Timezone: ["Eastern (ET)", "Central (CT)", "Pacific (PT)", "London (GMT)", "Berlin (CET)"],
  Priority: ["Low", "Medium", "High", "Urgent"],
  Category: ["General", "Billing", "Technical", "Sales"],
  Plan: ["Free", "Pro", "Team", "Enterprise"],
  Role: ["Owner", "Admin", "Editor", "Viewer"],
  Assignee: PEOPLE.slice(0, 5),
  "Number of guests": ["1 guest", "2 guests", "3 guests", "4 guests", "5+ guests"],
  Budget: ["Under $1k", "$1k to $5k", "$5k to $20k", "$20k+"],
}

export const FIELD_PLACEHOLDERS: Record<string, string> = {
  "Full name": "Jane Cooper", "First name": "Jane", "Last name": "Cooper", Email: "jane@example.com",
  "Phone number": "+1 (555) 000-0000", Company: "Acme Inc.", "Job title": "Product manager",
  Website: "https://", Address: "123 Main St", City: "Miami", "Zip code": "33101",
  Username: "janecooper", Subject: "How can we help?", "Card number": "1234 5678 9012 3456",
  "Expiry date": "MM / YY", CVC: "123", "Name on card": "Jane Cooper", "Promo code": "SAVE20",
  Quantity: "1", Title: "What needs doing?", "Project name": "Website redesign", Location: "Miami, FL", Amount: "0.00",
}

// ---------------------------------------------------------------------------
// Section molecules

export const BOARD_CARDS: Record<string, string[]> = {
  "product work": ["Redesign onboarding", "Fix login bug", "Dark mode", "Update pricing page", "API rate limits", "Mobile navigation", "Export to CSV", "Search filters", "Team roles"],
  hiring: PEOPLE.slice(0, 9),
  "sales deals": ["Northwind, 40 seats", "Globex renewal", "Initech pilot", "Vandelay expansion", "Brightline, 12 seats", "Summit Labs", "Bluefin annual", "Parallel trial", "Acme upgrade"],
  "content calendar": ["Launch announcement", "Customer story", "Weekly newsletter", "How-to video", "Case study", "Podcast episode", "Behind the scenes", "Product tips", "Year in review"],
  "support tickets": ["Cannot reset password", "Refund request", "Invoice missing", "App crashes on start", "Change my plan", "Shipping delay", "Add a teammate", "Wrong size", "Double charged"],
  "orders to fulfil": ["#1042, 2 items", "#1043, 1 item", "#1044, 5 items", "#1045, 3 items", "#1046, 1 item", "#1047, 2 items", "#1048, 4 items", "#1049, 1 item", "#1050, 2 items"],
}

export type ChatLine = { me: boolean; text: string }
export const CHAT_SCRIPTS: Record<string, ChatLine[]> = {
  support: [
    { me: false, text: "Hi! My order hasn't arrived and tracking hasn't moved in three days." },
    { me: true, text: "Sorry about that. Could you share your order number?" },
    { me: false, text: "Sure, it's #1042." },
    { me: true, text: "Thanks! It's at the local depot and out for delivery tomorrow morning." },
  ],
  assistant: [
    { me: true, text: "Can you summarize this week for me?" },
    { me: false, text: "Sure. You're up 12% on last week, mostly from weekend traffic. Want a breakdown?" },
    { me: true, text: "Yes, the top three drivers please." },
    { me: false, text: "1. Returning customers  2. The new landing page  3. Email campaign clicks" },
  ],
  team: [
    { me: false, text: "Standup in five, anyone blocked?" },
    { me: true, text: "All good here, shipping the pricing page today." },
    { me: false, text: "Could someone review #482 when they have a minute?" },
    { me: true, text: "On it." },
  ],
  sales: [
    { me: false, text: "Hi, we're a team of 40 looking at your Team plan." },
    { me: true, text: "Great to hear! Want me to set up a 14-day trial for everyone?" },
    { me: false, text: "Yes please, and a quote for annual billing." },
    { me: true, text: "Done. The quote is in your inbox." },
  ],
  friends: [
    { me: false, text: "Dinner Friday?" },
    { me: true, text: "Yes! Where?" },
    { me: false, text: "That new taco place downtown" },
    { me: true, text: "Perfect, 7pm?" },
  ],
  booking: [
    { me: false, text: "Hi, do you have a table for four this Saturday at 8?" },
    { me: true, text: "We do! Indoor or outdoor?" },
    { me: false, text: "Outdoor please." },
    { me: true, text: "You're booked. See you Saturday at 8!" },
  ],
}

export const TRACKS: Record<string, { title: string; by: string; length: string }[]> = {
  music: [
    { title: "Midnight Drive", by: "Neon Coast", length: "3:42" }, { title: "Golden Hour", by: "Luma", length: "4:05" },
    { title: "Paper Planes", by: "The Wavelengths", length: "3:18" }, { title: "Slow Tide", by: "Harbor Lights", length: "5:01" },
  ],
  podcast: [
    { title: "Ep. 42: Building in public", by: "The Founders Show", length: "48:12" }, { title: "Ep. 41: Pricing is a product", by: "The Founders Show", length: "52:40" },
    { title: "Ep. 40: Hiring your first ten", by: "The Founders Show", length: "45:03" }, { title: "Ep. 39: Saying no", by: "The Founders Show", length: "39:27" },
  ],
  audiobook: [
    { title: "Chapter 3: The Harbor", by: "A. Rivers", length: "32:10" }, { title: "Chapter 4: Low Tide", by: "A. Rivers", length: "28:44" },
    { title: "Chapter 5: The Letter", by: "A. Rivers", length: "35:02" }, { title: "Chapter 6: North", by: "A. Rivers", length: "30:19" },
  ],
  video: [
    { title: "Lesson 4: Your first project", by: "Getting started", length: "12:30" }, { title: "Lesson 5: Working with data", by: "Getting started", length: "15:12" },
    { title: "Lesson 6: Sharing your work", by: "Getting started", length: "9:48" }, { title: "Lesson 7: Next steps", by: "Getting started", length: "7:05" },
  ],
}

export function tierPrices(tiers: string[], period: string): string[] {
  const base = [9, 29, 79]
  return tiers.map((t, i) => {
    if (/free|hobby/i.test(t) && i === 0) return "$0"
    if (/enterprise/i.test(t)) return "Custom"
    const v = /drop-in/i.test(t) ? 25 : /10-class/i.test(t) ? 199 : /unlimited/i.test(t) ? 149 : base[i] ?? 99
    return `$${period === "year" ? v * 10 : v}`
  })
}

export const PROFILES: Record<string, { name: string; role: string; location: string; stats: [string, string][] }> = {
  professional: { name: "Olivia Martin", role: "Head of Operations at Northwind", location: "New York", stats: [["Connections", "500+"], ["Projects", "42"], ["Years", "12"]] },
  creator: { name: "Mia Chen", role: "Food and travel creator", location: "Lisbon", stats: [["Followers", "284K"], ["Posts", "1,204"], ["Following", "312"]] },
  developer: { name: "Arjun Mehta", role: "Staff engineer and open source maintainer", location: "Toronto", stats: [["Repos", "86"], ["Stars", "12.4K"], ["Followers", "3.1K"]] },
  designer: { name: "Chloe Dubois", role: "Product designer and illustrator", location: "Berlin", stats: [["Shots", "214"], ["Likes", "48K"], ["Followers", "9.8K"]] },
  photographer: { name: "Noah Garcia", role: "Wedding and portrait photographer", location: "Miami", stats: [["Shoots", "320"], ["Clients", "180"], ["Rating", "4.9"]] },
  athlete: { name: "Mateo Rossi", role: "Marathon runner and coach", location: "Miami", stats: [["Races", "38"], ["Best", "2:41"], ["Athletes", "120"]] },
  musician: { name: "Ava Patel", role: "DJ and producer", location: "London", stats: [["Listeners", "1.2M"], ["Tracks", "64"], ["Shows", "210"]] },
  doctor: { name: "Dr. William Kim", role: "Family physician", location: "Chicago", stats: [["Patients", "2,400"], ["Rating", "4.9"], ["Years", "15"]] },
  teacher: { name: "Sofia Davis", role: "Math tutor", location: "Austin", stats: [["Students", "340"], ["Lessons", "2,100"], ["Rating", "5.0"]] },
  chef: { name: "Lucas Brown", role: "Chef and cookbook author", location: "Mexico City", stats: [["Recipes", "412"], ["Followers", "96K"], ["Rating", "4.8"]] },
  host: { name: "Emma Wilson", role: "Superhost", location: "Lisbon", stats: [["Reviews", "318"], ["Rating", "4.97"], ["Years hosting", "6"]] },
}

const KV_FIXED: Record<string, string> = {
  "Order number": "#1042", "Delivery date": "Sep 28", Carrier: "UPS", "Tracking number": "1Z 999 AA1 0123 4567",
  "Payment method": "Visa ending 4242", Plan: "Pro", "Billing cycle": "Monthly", "Next payment": "Oct 23, 2026",
  "Member since": "March 2024", Email: "olivia@example.com", Phone: "+1 (555) 014-2231", Location: "Miami, FL",
  Status: "Active", Bedrooms: "3", Bathrooms: "2", "Square feet": "1,850", "Year built": "2016", Parking: "2 spaces",
  "Check-in": "Fri, Sep 26 from 3:00 PM", "Check-out": "Mon, Sep 29 by 11:00 AM", Guests: "2 adults", "Room type": "King suite",
  Duration: "6 weeks", Level: "Beginner", Instructor: "Sofia Davis", Language: "English", Certificate: "Included",
  Symbol: "BTC", "Market cap": "$1.2T", Volume: "$38.4B", "52-week high": "$74,210",
}

/** Values for label/value rows, with money rows that add up. */
export function kvValues(r: Rand, keys: string[]): Record<string, string> {
  const subtotal = Math.round(between(r, 60, 480))
  const shipping = r() < 0.3 ? 0 : 8
  const discount = keys.includes("Discount") ? Math.round(subtotal * 0.1) : 0
  const tax = Math.round((subtotal - discount) * 0.08)
  const money = (v: number) => `$${v.toFixed(2)}`
  const out: Record<string, string> = {}
  for (const k of keys) {
    if (k === "Subtotal") out[k] = money(subtotal)
    else if (k === "Shipping") out[k] = shipping ? money(shipping) : "Free"
    else if (k === "Discount") out[k] = `-${money(discount)}`
    else if (k === "Tax") out[k] = money(tax)
    else if (k === "Total") out[k] = money(subtotal + shipping - discount + (keys.includes("Tax") ? tax : 0))
    else out[k] = KV_FIXED[k] ?? "..."
  }
  return out
}

export type Listing = { title: string; meta: string; price?: string; rating?: number; reviews?: number; badge?: string; icon: string }
const LISTINGS: Record<string, { icon: string; titles: string[]; meta: string[]; price?: (r: Rand) => string; rated: boolean; badges: string[] }> = {
  products: { icon: "package", titles: ["Classic sneaker", "Everyday tote", "Wool beanie", "Canvas backpack", "Linen shirt", "Water bottle"], meta: ["Unisex", "3 colors", "Organic cotton", "Free returns"], price: (r) => `$${Math.round(between(r, 18, 160))}`, rated: true, badges: ["New", "Best seller", "Sale"] },
  homes: { icon: "home", titles: ["Sunny loft near the park", "Modern townhouse", "Garden apartment", "Ocean view condo", "Craftsman bungalow", "Corner studio"], meta: ["3 bd · 2 ba · 1,850 sqft", "2 bd · 1 ba · 980 sqft", "4 bd · 3 ba · 2,400 sqft", "1 bd · 1 ba · 720 sqft"], price: (r) => `$${(Math.round(between(r, 320, 1400)) * 1000).toLocaleString("en-US")}`, rated: false, badges: ["New listing", "Open house", "Price drop"] },
  hotels: { icon: "bed", titles: ["The Harbor Hotel", "Casa Luz", "The Palms Resort", "Hotel Nord", "Seaside Inn", "The Grand"], meta: ["Downtown · 0.4 mi from center", "Beachfront", "Old town", "Near the airport"], price: (r) => `$${Math.round(between(r, 89, 420))} / night`, rated: true, badges: ["Free cancellation", "Breakfast included", "Great value"] },
  courses: { icon: "graduation-cap", titles: ["Intro to the basics", "Level up in 30 days", "Masterclass", "Weekend bootcamp", "Advanced techniques", "Foundations"], meta: ["6 lessons · Beginner", "12 lessons · Intermediate", "4 hours · All levels"], price: (r) => `$${Math.round(between(r, 19, 199))}`, rated: true, badges: ["Bestseller", "New", "Certificate"] },
  recipes: { icon: "utensils", titles: ["Lemon herb chicken", "Spicy miso ramen", "Summer salad", "Banana bread", "Veggie tacos", "Overnight oats"], meta: ["35 min · Easy", "20 min · Easy", "1 hr · Medium"], rated: true, badges: ["Vegan", "Quick", "Kid friendly"] },
  events: { icon: "ticket", titles: ["Sunset Jazz Night", "Makers Market", "Rooftop Cinema", "Tech Meetup", "Wine Tasting", "Morning Run Club"], meta: ["Fri, Sep 26 · 8:00 PM", "Sat, Sep 27 · 10:00 AM", "Sun, Sep 28 · 7:30 PM"], price: (r) => (r() < 0.2 ? "Free" : `$${Math.round(between(r, 10, 80))}`), rated: false, badges: ["Selling fast", "Free", "New"] },
  articles: { icon: "file", titles: ["How we doubled bookings", "A guide for beginners", "What we learned this year", "10 tips from the pros", "Behind the scenes", "The complete checklist"], meta: ["5 min read · Sep 18", "8 min read · Sep 11", "3 min read · Sep 4"], rated: false, badges: ["Popular", "New", "Guide"] },
  cars: { icon: "car", titles: ["2022 Model 3 Long Range", "2021 Civic Sport", "2023 RAV4 Hybrid", "2020 Mustang GT", "2022 Ioniq 5", "2019 Wrangler"], meta: ["18k mi · Electric", "32k mi · Gas", "9k mi · Hybrid"], price: (r) => `$${(Math.round(between(r, 18, 58)) * 1000).toLocaleString("en-US")}`, rated: false, badges: ["Certified", "Low miles", "Great deal"] },
  restaurants: { icon: "utensils", titles: ["Casa Verde", "Sakura House", "The Grill Room", "Pasta Bar", "Green Bowl", "Taqueria Sol"], meta: ["Mexican · $$ · 0.8 mi", "Japanese · $$$ · 1.2 mi", "Italian · $$ · 0.5 mi"], rated: true, badges: ["Open now", "Outdoor seating", "Popular"] },
  jobs: { icon: "briefcase", titles: ["Senior Product Designer", "Frontend Engineer", "Marketing Lead", "Customer Success Manager", "Data Analyst", "Head of Sales"], meta: ["Remote · Full-time", "New York · Hybrid", "Miami · On-site"], price: (r) => `$${Math.round(between(r, 90, 180))}k to $${Math.round(between(r, 180, 240))}k`, rated: false, badges: ["New", "Urgent", "Remote"] },
  dishes: { icon: "utensils", titles: ["Margherita", "Spicy salami", "Truffle mushroom", "Four cheese", "Garden veggie", "Burrata special"], meta: ["Tomato, mozzarella, basil", "Salami, chili honey", "Mushrooms, truffle oil", "Four Italian cheeses"], price: (r) => `$${Math.round(between(r, 11, 24))}`, rated: true, badges: ["Popular", "Vegetarian", "Spicy"] },
  services: { icon: "user-plus", titles: ["GreenCut Lawn Care", "Sparkle Cleaning Co.", "Handy Hank", "Blue Wave Pools", "Swift Movers", "Paws and Walks"], meta: ["2.1 mi · Available today", "0.8 mi · Next slot 3:00 PM", "3.4 mi · Available tomorrow"], price: (r) => `from $${Math.round(between(r, 25, 120))}`, rated: true, badges: ["Top pro", "Fast response", "Background checked"] },
  workshops: { icon: "calendar", titles: ["Intro to ceramics", "Sourdough basics", "Portrait photography", "Watercolor weekend", "Knife skills", "Public speaking"], meta: ["Sat, Oct 4 · 10:00 AM · 8 spots left", "Sun, Oct 12 · 2:00 PM · 3 spots left", "Thu, Oct 16 · 6:30 PM · 12 spots left"], price: (r) => `$${Math.round(between(r, 35, 180))}`, rated: true, badges: ["Few spots left", "New", "Beginner friendly"] },
  classes: { icon: "dumbbell", titles: ["Sunrise flow", "Power hour", "Beginner basics", "Evening stretch", "Strength circuit", "Weekend intensive"], meta: ["Mon, Wed · 7:00 AM", "Tue, Thu · 6:00 PM", "Sat · 9:00 AM"], price: (r) => `$${Math.round(between(r, 15, 40))}`, rated: true, badges: ["Beginner", "Popular", "Few spots left"] },
}

export function listings(r: Rand, type: string, n: number): Listing[] {
  const spec = LISTINGS[type] ?? LISTINGS.products
  const start = Math.floor(r() * spec.titles.length)
  return Array.from({ length: n }, (_, i) => ({
    title: spec.titles[(start + i) % spec.titles.length],
    meta: spec.meta[(start + i) % spec.meta.length],
    price: spec.price?.(r),
    rating: spec.rated ? +between(r, 4.1, 4.95).toFixed(1) : undefined,
    reviews: spec.rated ? Math.round(between(r, 24, 2400)) : undefined,
    badge: i === 0 || r() < 0.25 ? pick(r, spec.badges) : undefined,
    icon: spec.icon,
  }))
}

export const TIMELINE_ENTRIES: Record<string, [string, string][]> = {
  "order tracking": [["Out for delivery", "Today, 8:02 AM"], ["Arrived at local depot", "Yesterday, 9:40 PM"], ["Shipped from warehouse", "Sep 21, 4:30 PM"], ["Order placed", "Sep 20, 9:14 AM"]],
  "project activity": [["Olivia merged the pricing page", "2h ago"], ["Jackson commented on Onboarding", "4h ago"], ["Mia moved Dark mode to Done", "Yesterday"], ["Arjun started Sprint 14", "2 days ago"]],
  changelog: [["v2.4: Dark mode and faster search", "Sep 18"], ["v2.3: Team roles and permissions", "Sep 4"], ["v2.2: Export to CSV", "Aug 21"], ["v2.1: A new dashboard", "Aug 7"]],
  itinerary: [["Day 1: Arrive and check in", "Fri, Sep 26"], ["Day 2: Old town walking tour", "Sat, Sep 27"], ["Day 3: Beach and sunset cruise", "Sun, Sep 28"], ["Day 4: Fly home", "Mon, Sep 29"]],
  "account history": [["Upgraded to Pro", "Sep 12"], ["Payment received, $29.00", "Sep 12"], ["Added 3 team members", "Aug 30"], ["Account created", "Aug 2"]],
  "incident log": [["Resolved: all systems normal", "10:42 AM"], ["Monitoring: fix deployed", "10:15 AM"], ["Identified: database failover", "9:58 AM"], ["Investigating: elevated errors", "9:41 AM"]],
}

export const SWIPE_CARDS: Record<string, { title: string; meta: string; tags: string[]; icon: string }[]> = {
  people: [{ title: "Sofia, 29", meta: "Designer · 3 miles away", tags: ["Hiking", "Coffee", "Dogs"], icon: "heart" }],
  pets: [{ title: "Biscuit, 2", meta: "Golden retriever · 1.2 miles away", tags: ["Playful", "Good with kids", "Vaccinated"], icon: "paw" }],
  homes: [{ title: "Bright loft in Wynwood", meta: "$2,300 / month · 1 bd", tags: ["Pet friendly", "Parking", "Gym"], icon: "home" }],
  jobs: [{ title: "Product Designer at Northwind", meta: "Remote · $140k", tags: ["Full-time", "Equity", "Health"], icon: "briefcase" }],
  recipes: [{ title: "Spicy miso ramen", meta: "30 min · 620 kcal", tags: ["Vegan", "Quick", "Spicy"], icon: "utensils" }],
  products: [{ title: "Classic white sneakers", meta: "$89 · Free returns", tags: ["New", "Unisex", "Leather"], icon: "shirt" }],
  restaurants: [{ title: "Casa Verde", meta: "Mexican · $$ · 0.8 mi", tags: ["Open now", "Outdoor", "Tacos"], icon: "utensils" }],
}

export const PRICE_RANGES: Record<string, [number, number]> = { budget: [4, 19], mid: [24, 180], premium: [240, 1800], luxury: [2400, 12000] }

// ---------------------------------------------------------------------------
// Media-rich primitives

export const DETAIL_ITEMS: Record<string, { category: string; facts: [string, string][]; blurb: string; icon: string; price: (r: Rand) => string }> = {
  product: { category: "New arrival", facts: [], blurb: "Made to last, designed to be used every day. Free returns within 30 days.", icon: "package", price: (r) => `$${Math.round(between(r, 49, 390))}` },
  home: { category: "For sale", facts: [["Beds", "3"], ["Baths", "2"], ["Sq ft", "1,850"], ["Built", "2016"]], blurb: "Bright corner home with an open kitchen, a private yard and parking for two.", icon: "home", price: (r) => `$${(Math.round(between(r, 380, 1400)) * 1000).toLocaleString("en-US")}` },
  hotel: { category: "Entire suite", facts: [["Guests", "2"], ["Bedroom", "1"], ["Bath", "1"], ["Wifi", "Fast"]], blurb: "A calm suite steps from the old town, with breakfast and late checkout.", icon: "bed", price: (r) => `$${Math.round(between(r, 120, 420))} / night` },
  car: { category: "Certified pre-owned", facts: [["Miles", "18k"], ["Fuel", "Electric"], ["Range", "358 mi"], ["Seats", "5"]], blurb: "One owner, full service history and a 12-month warranty included.", icon: "car", price: (r) => `$${(Math.round(between(r, 22, 58)) * 1000).toLocaleString("en-US")}` },
  course: { category: "Online course", facts: [["Lessons", "24"], ["Length", "6 h"], ["Level", "Beginner"], ["Certificate", "Yes"]], blurb: "Learn at your own pace with short lessons, real projects and feedback.", icon: "graduation-cap", price: (r) => `$${Math.round(between(r, 29, 199))}` },
  event: { category: "Live event", facts: [["Date", "Oct 4"], ["Time", "8:00 PM"], ["Venue", "The Hall"], ["Ages", "18+"]], blurb: "An evening of live music, local food and good company. Doors open at 7.", icon: "ticket", price: (r) => `$${Math.round(between(r, 18, 95))}` },
  dish: { category: "Chef's special", facts: [["Serves", "1"], ["Calories", "640"], ["Spice", "Mild"], ["Prep", "15 min"]], blurb: "Fresh, seasonal and made to order. Ask us about allergens.", icon: "utensils", price: (r) => `$${Math.round(between(r, 12, 34))}` },
}

export const VIDEO_TITLES: Record<string, [string, string]> = {
  lesson: ["Lesson 4: Your first project", "12:30"], "product demo": ["See it in action in 3 minutes", "3:04"],
  trailer: ["Official trailer", "2:18"], livestream: ["Live now: weekly Q&A", "LIVE"],
  recipe: ["The perfect weeknight pasta", "8:45"], workout: ["20-minute full body session", "20:00"],
}

export type Post = { name: string; handle: string; time: string; text: string; photo: boolean; likes: number; comments: number }
const POST_TEXT: Record<string, string[]> = {
  social: ["Best weekend in a long time. Already planning the next one.", "Tried the new place downtown. 10/10 would go again.", "Morning views like this make it easy to get up."],
  community: ["Just finished my first project with the group. Thanks for all the tips!", "Anyone going to the meetup on Friday?", "Sharing a few photos from last night's session."],
  news: ["We just shipped dark mode. Try it in settings.", "Our new office is open. Come say hi!", "Thank you for 10,000 customers."],
  creators: ["New series drops tomorrow. Here is a sneak peek.", "Behind the scenes from today's shoot.", "Which one should I post next?"],
}
export function posts(r: Rand, kind: string): Post[] {
  const texts = POST_TEXT[kind] ?? POST_TEXT.social
  return texts.map((text, i) => {
    const name = PEOPLE[(i * 4 + Math.floor(r() * 3)) % PEOPLE.length]
    return { name, handle: `@${name.split(" ")[0].toLowerCase()}`, time: ["2m", "1h", "3h"][i], text, photo: i !== 1, likes: Math.round(between(r, 12, 2400)), comments: Math.round(between(r, 1, 180)) }
  })
}

export type Comment = { name: string; time: string; text: string; stars?: number }
const COMMENT_TEXT: Record<string, string[]> = {
  reviews: ["Exactly as described and arrived fast. Would buy again.", "Great quality for the price. The color is even nicer in person.", "Good overall, but it runs a little small."],
  discussion: ["This is really helpful, thanks for sharing.", "Has anyone tried this with a bigger team?", "We did something similar last year and it worked well."],
  questions: ["Does this come in other colors?", "Yes! It comes in three colors, all in stock.", "How long does shipping take to Canada?"],
}
export function comments(r: Rand, kind: string): Comment[] {
  const texts = COMMENT_TEXT[kind] ?? COMMENT_TEXT.discussion
  return texts.map((text, i) => ({
    name: PEOPLE[(i * 5 + Math.floor(r() * 3)) % PEOPLE.length],
    time: ["2 days ago", "1 week ago", "3 weeks ago"][i],
    text,
    stars: kind === "reviews" ? [5, 5, 4][i] : undefined,
  }))
}

export const CODE_SAMPLES: Record<string, [lang: string, code: string]> = {
  "install command": ["bash", "npm install @acme/sdk\n\nnpx acme init --template starter"],
  "API request": ["bash", "curl https://api.acme.dev/v1/orders \\\n  -H \"Authorization: Bearer $API_KEY\" \\\n  -d amount=2500 \\\n  -d currency=usd"],
  "config file": ["json", "{\n  \"name\": \"my-app\",\n  \"region\": \"us-east-1\",\n  \"features\": [\"auth\", \"billing\"],\n  \"retries\": 3\n}"],
  "component usage": ["tsx", "import { Button } from \"@acme/ui\"\n\nexport function Save() {\n  return <Button variant=\"primary\">Save changes</Button>\n}"],
}

export const LEADERBOARD = (r: Rand) =>
  PEOPLE.slice(0, 5).map((name, i) => ({ title: name, meta: `${Math.round(between(r, 12, 40))} day streak`, trailing: `${(2400 - i * 310 - Math.round(r() * 80)).toLocaleString("en-US")} pts`, rank: i + 1 }))
