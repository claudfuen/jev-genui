import type { CSSProperties } from "react"

// Accent Jev picks for the page, expressed as CSS variables the preview scopes
// onto shadcn's --primary / --chart-* tokens (see .genui-preview in globals.css).
const HUES: Record<string, [hue: number, chroma: number]> = {
  blue: [262, 0.2],
  indigo: [277, 0.21],
  violet: [293, 0.22],
  rose: [16, 0.2],
  orange: [45, 0.18],
  amber: [68, 0.16],
  emerald: [163, 0.14],
  teal: [184, 0.11],
}

export function accentStyle(accent: unknown): CSSProperties {
  const hc = typeof accent === "string" ? HUES[accent] : undefined
  if (!hc) {
    return {
      "--gp-l": "oklch(0.205 0 0)",
      "--gp-d": "oklch(0.922 0 0)",
      "--gp-fg-l": "oklch(0.985 0 0)",
      "--gp-fg-d": "oklch(0.205 0 0)",
      "--gp-c1": "oklch(0.35 0 0)",
      "--gp-c2": "oklch(0.55 0 0)",
      "--gp-c3": "oklch(0.7 0 0)",
      "--gp-c4": "oklch(0.45 0 0)",
      "--gp-c5": "oklch(0.82 0 0)",
    } as CSSProperties
  }
  const [h, c] = hc
  const tone = (l: number, k = 1) => `oklch(${l} ${(c * k).toFixed(3)} ${h})`
  return {
    "--gp-l": tone(0.56),
    "--gp-d": tone(0.7),
    "--gp-fg-l": "oklch(0.985 0 0)",
    "--gp-fg-d": "oklch(0.18 0.02 0)",
    "--gp-c1": tone(0.6),
    "--gp-c2": tone(0.76, 0.7),
    "--gp-c3": tone(0.46, 0.8),
    "--gp-c4": tone(0.84, 0.5),
    "--gp-c5": tone(0.36, 0.6),
  } as CSSProperties
}
