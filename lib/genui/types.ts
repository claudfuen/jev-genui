export type Kind =
  | "page"
  // containers
  | "grid"
  | "split"
  | "tabs"
  | "card"
  | "row"
  // section molecules
  | "hero"
  | "stats"
  | "form"
  | "chart"
  | "table"
  | "list"
  | "board"
  | "chat"
  | "player"
  | "pricing"
  | "profile"
  | "details"
  | "listings"
  | "search"
  | "settings"
  | "features"
  | "steps"
  | "testimonial"
  | "cta"
  | "timeline"
  | "accordion"
  | "alert"
  | "calendar"
  | "empty"
  | "swipe"
  | "keypad"
  | "forecast"
  | "detail"
  | "gallery"
  | "carousel"
  | "video"
  | "map"
  | "logos"
  | "feed"
  | "comments"
  | "timeslots"
  | "footer"
  | "banner"
  | "heatmap"
  | "code"
  | "tracker"
  | "countdown"
  | "timer"
  | "filters"
  | "matrix"
  | "itinerary"
  | "ticket"
  | "invite"
  | "breakdown"
  | "wallet"
  | "stories"
  | "people"
  | "cart"
  | "editor"
  | "article"
  | "week"
  | "choices"
  | "quiz"
  | "call"
  | "reader"
  | "amenities"
  | "thread"
  | "scanner"
  | "gauge"
  | "days"
  | "logs"
  | "pipeline"
  | "converter"
  | "clocks"
  // tiles
  | "media"
  | "feature"
  | "person"
  // atoms
  | "heading"
  | "stat"
  | "text"
  | "progress"
  | "field"
  | "toggle"
  | "slider"
  | "radio"
  | "button"
  | "badges"
  | "avatars"
  | "image"
  | "separator"
  | "price"
  | "rating"
  | "status"
  | "segmented"
  | "searchbox"
  | "otp"
  | "quantity"
  | "ring"
  | "swatches"
  | "upload"
  | "pagination"
  | "breadcrumb"
  | "checklist"

export type PropValue = string | number | boolean | string[]

/** One Jev answer, kept so the sandbox can show why the UI looks the way it does. */
export type Decision = {
  prop: string
  choice: string
  probability: number | null
  alternatives: { option: string; p: number }[]
  /** Set when the raw top pick was replaced (sibling dedupe, minimum counts, a user swap). */
  note?: string
  /** For set questions: every candidate Jev rated, highest first. */
  set?: { item: string; p: number; picked: boolean }[]
}

export type UINode = {
  id: string
  /** Human-readable position, "1.2" = second child of the first section. */
  path: string
  kind: Kind
  depth: number
  props: Record<string, PropValue>
  children: UINode[]
  /** Props not decided yet: the interpreter renders a skeleton of this kind. */
  pending: boolean
  /** Child slots still being decided: rendered as placeholder blocks. */
  pendingSlots: number
  decisions: Decision[]
}

export type RoundStat = { round: number; ms: number; questions: number; calls: number }

/** User swaps, keyed `${path}|${prop}` (prop "kind" replaces the component itself). */
export type Overrides = Record<string, string>

export type ComposeEvent =
  | { type: "round"; tree: UINode; stat: RoundStat }
  | {
      type: "done"
      tree: UINode
      rounds: RoundStat[]
      totalMs: number
      cached: boolean
    }
  | { type: "error"; message: string }
