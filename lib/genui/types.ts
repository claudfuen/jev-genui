export type Kind =
  | "page"
  | "hero"
  | "card"
  | "grid"
  | "split"
  | "tabs"
  | "form"
  | "chart"
  | "table"
  | "list"
  | "accordion"
  | "alert"
  | "calendar"
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

export type PropValue = string | number | boolean | string[]

/** One Jev answer, kept so the sandbox can show why the UI looks the way it does. */
export type Decision = {
  prop: string
  choice: string
  probability: number | null
  alternatives: { option: string; p: number }[]
  /** Set when the raw top pick was replaced (sibling dedupe, minimum counts). */
  note?: string
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
