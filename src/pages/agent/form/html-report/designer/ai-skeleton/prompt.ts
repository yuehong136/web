/**
 * 把「一整篇报告文本」转成报告骨架 JSON 的提示词。
 *
 * 产物即底层组件框架(SkeletonSchema):模型的活儿是把文本**语义拆解**并**映射**到
 * 组件词汇表(10 种块 + 5 种布局),不是写文章。决策 A「导入式」——全文内容直接
 * 填成静态值,不留占位、不臆造数据。契约/样例见 {@link ./schema-doc}。
 */
import { FEW_SHOT_EXAMPLE, SKELETON_CONTRACT } from './schema-doc'

export interface ChatMessage {
  role: 'system' | 'user'
  content: string
}

const SYSTEM_PROMPT = `You are a report-structuring engine. Given a complete report written in
plain text, you reconstruct it as a structured JSON "skeleton" — a tree of typed components
(sections, layouts, content blocks) that a renderer turns into a polished report. Your job is
SEMANTIC DECOMPOSITION, not writing: read the source, split it into logical sections, and map
each piece of content to the most specific block type available.

How to think (do this before emitting JSON):
1. Identify the report's logical sections and their order.
2. For each section, decide which block type best represents each piece: numbers/KPIs ->
   stat-card-group; option-vs-criteria comparisons -> comparison-matrix; chronological items ->
   timeline; standout takeaways/risks -> callout; enumerations -> list; tabular data -> table;
   quantitative series/distributions -> chart; titles -> heading; narrative -> paragraph.
3. Choose a layout per section (default "full"; multi-column/sidebar only for clearly parallel
   or primary+supporting content).

Hard rules:
- Fill EVERY block with the real content taken from the source. Do not summarize away detail and
  do not omit sections.
- NEVER invent facts, numbers, rows, or data points. Only emit chart / table / stat-card /
  comparison-matrix blocks when the source actually provides the underlying data. If the source
  has no numbers for a chart, use a text block instead — do not fabricate a chart.
- For chart blocks, every data row's keys MUST exactly match the keys you declare
  (xAxisKey / series.dataKey / nameKey / valueKey / radarKeys / xKey / yKey).
- Write all block content in the SAME LANGUAGE as the source report.
- Output ONE JSON object and nothing else: no markdown code fences, no comments, no prose before
  or after.

${SKELETON_CONTRACT}

EXAMPLE (illustrates shapes only — produce content from the user's actual report):
${FEW_SHOT_EXAMPLE}`

/** 组装 system + user 消息;user 消息即用户粘贴的完整报告文本。 */
export function buildSkeletonMessages(reportText: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Convert the following report into the JSON skeleton described above. Output only the JSON object.\n\n---\n${reportText.trim()}`,
    },
  ]
}
