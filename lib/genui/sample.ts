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
    case "Name": case "Customer": case "Assignee":
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
    default:
      return { text: "..." }
  }
}

// ---------------------------------------------------------------------------
// Lists

export type ListItem = { title: string; meta: string; avatar?: string; trailing?: string; positive?: boolean; done?: boolean }

export function listItems(r: Rand, kind: string, n = 4): ListItem[] {
  return Array.from({ length: n }, (_, i) => {
    const person = PEOPLE[(i * 3 + Math.floor(r() * 4)) % PEOPLE.length]
    switch (kind) {
      case "people":
        return { title: person, meta: pick(r, ROLES), avatar: initials(person) }
      case "tasks":
        return { title: TASKS[(i + Math.floor(r() * 3)) % TASKS.length], meta: `Due ${pick(r, ["today", "tomorrow", "Friday", "next week"])}`, done: i === 0 }
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
  Quantity: "1", "Project name": "Website redesign", Location: "Miami, FL", Amount: "0.00",
}
