// What a person actually reads on a composed page: server-render the tree with
// the real interpreter and strip it to visible text. The eval judge grades this,
// so sample content (names, rows, messages) counts, not just Jev's props.
import * as React from "react"
import { renderToStaticMarkup } from "react-dom/server"

import { Interpreter } from "../components/genui/interpreter"
import type { UINode } from "../lib/genui/types"

export function visibleText(tree: UINode, seed: string, max = 2400): string {
  const html = renderToStaticMarkup(<Interpreter tree={tree} seed={seed} highlight={null} />)
  const text = html
    .replace(/<(script|style|svg)[\s\S]*?<\/\1>/g, " ")
    .replace(/<(br|\/p|\/li|\/h[1-6]|\/div|\/tr|\/button|\/label|\/span)[^>]*>/g, "$& | ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ")
    .replace(/\s*\|\s*(\|\s*)+/g, " | ")
    .replace(/\s+/g, " ")
    .trim()
  return text.length > max ? text.slice(0, max) + " ..." : text
}

if ((import.meta as { main?: boolean }).main) {
  const { readFileSync } = await import("node:fs")
  const [label = "v12", q = "todo list with photos"] = process.argv.slice(2)
  const runs = JSON.parse(readFileSync(`evals/${label}.json`, "utf8")) as { q: string; tree: UINode }[]
  const run = runs.find((r) => r.q === q)!
  console.log(visibleText(run.tree, q.toLowerCase()))
}
