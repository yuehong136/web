/**
 * 把「一整篇报告文本」转成可复用报告模板的提示词,分两步:
 * - {@link buildOutlineMessages}  整篇 → 分节大纲(只规划,不出块)。
 * - {@link buildSectionMessages}  整篇 + 指定某节 → 该节的块(柔性组件 + 候选写进 hint)。
 * 另保留 {@link buildSkeletonMessages}:大纲失败时「单次整篇生成」的回退。
 *
 * 结构性字段填实、变量内容用 hint/annotation 描述,运行时再回填;不写死内容、不滥用冷门组件。
 * 契约/样例见 {@link ./schema-doc}。
 */
import {
  FEW_SHOT_EXAMPLE,
  FEW_SHOT_SECTION,
  OUTLINE_CONTRACT,
  SKELETON_CONTRACT,
} from './schema-doc'

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

// ============================================================
// ① 大纲:整篇 → 分节(只规划,不出块)
// ============================================================
const OUTLINE_SYSTEM = `You are a report-outlining engine. Read a complete report and produce ONLY a
high-level outline of its sections — no content blocks. Identify the report's logical top-level
sections in order; for each give a short title (from the report), a layout, and a one-line "intent"
describing what that section covers. Keep to the report's real structure; do not invent sections.

${OUTLINE_CONTRACT}

Output ONE JSON object and nothing else: no markdown code fences, no comments, no prose.`

export function buildOutlineMessages(reportText: string): ChatMessage[] {
  return [
    { role: 'system', content: OUTLINE_SYSTEM },
    {
      role: 'user',
      content: `Outline the following report.\n\n---\n${reportText.trim()}`,
    },
  ]
}

// ============================================================
// ② 逐节:整篇 + 指定某节 → 该节的块
// ============================================================
const SECTION_SYSTEM = `You are a report-TEMPLATE engine working ONE SECTION AT A TIME. You are given a
full report and told which single section to build. Produce THAT section's content blocks as a
reusable template: keep the structure solid but DO NOT hard-commit component types — pick a sensible
COMMON default and note the alternatives in each block's "hint".

Principles:
- Map content to fitting blocks, but prefer common, flexible components (paragraph, list, table,
  bar/line chart, stat-card-group). Avoid niche types unless the source clearly calls for it.
- FRAMEWORK fields are real (titles, table headers, chart axis/series field names, stat labels,
  list/section structure). CONTENT is NOT written out — describe it in "hint".
- Each "hint" says TWO things (source language): (1) which part of the report this area covers /
  visualizes, (2) which components could be used here.
- Build ONLY the requested section. Output ONE JSON object {"blocks":[...]} and nothing else.

${SKELETON_CONTRACT}

EXAMPLE section (illustration only — produce blocks from the user's actual report):
${FEW_SHOT_SECTION}`

export function buildSectionMessages(
  reportText: string,
  section: { title?: string; intent?: string },
): ChatMessage[] {
  const focus = section.title
    ? `the section titled "${section.title}"`
    : 'the next section'
  const about = section.intent ? ` (about: ${section.intent})` : ''
  return [
    { role: 'system', content: SECTION_SYSTEM },
    {
      role: 'user',
      content: `From the report below, build ONLY ${focus}${about}. Output {"blocks":[...]} only.\n\n---\n${reportText.trim()}`,
    },
  ]
}

// ============================================================
// 回退:大纲失败时,单次整篇生成
// ============================================================
const SYSTEM_PROMPT = `You are a report-TEMPLATE engine. Given one complete report written in plain
text, you reverse-engineer a REUSABLE template for that KIND of report — a tree of typed components
(sections, layouts, content blocks) whose STRUCTURE is fixed but whose CONTENT is filled in later
from fresh data. You are NOT copying this report's content; you are extracting its skeleton.

How to think (do this before emitting JSON):
1. Identify the report's logical sections and their order.
2. For each section, map each piece to the most fitting block type: numbers/KPIs ->
   stat-card-group; option-vs-criteria comparisons -> comparison-matrix; chronological items ->
   timeline; standout takeaways/risks -> callout; enumerations -> list; tabular data -> table;
   quantitative series/distributions -> chart; titles -> heading; narrative -> paragraph.
3. Choose a layout per section (default "full"; multi-column/sidebar only for clearly parallel
   or primary+supporting content).
4. For each block, fill the FRAMEWORK fields with real values from the source, and describe the
   variable CONTENT with a one-line "hint" instead of writing it out.

Hard rules:
- FRAMEWORK (recurs in every report of this kind) is real: section/heading titles, table headers,
  comparison column items, chart type + axis/series field names, stat-card labels, callout variant,
  list ordered flag, heading level. CONTENT (changes each time) is described by "hint", never
  written out: narrative prose, metric values, table rows, chart data, the wording of list items,
  timeline events.
- Do NOT fabricate framework the source does not support. Keep titles/labels/headers faithful.
- For chart blocks the shape keys NAME the data fields; never emit a "data" array.
- Write all framework text and hints in the SAME LANGUAGE as the source report.
- Output ONE JSON object and nothing else: no markdown code fences, no comments, no prose before
  or after.

${SKELETON_CONTRACT}

EXAMPLE (illustrates the template shape only — produce structure from the user's actual report):
${FEW_SHOT_EXAMPLE}`

export function buildSkeletonMessages(reportText: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Build a reusable report template from the following report, following the JSON contract above. Output only the JSON object.\n\n---\n${reportText.trim()}`,
    },
  ]
}
