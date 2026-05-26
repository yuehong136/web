/**
 * 填值调用的静态契约文案(类比 ai-skeleton 的 schema-doc.ts),从 prompt-builder 拆出控行数。
 * 面向模型,故用英文——不是产品 UI 文案,也避免 Agent 范围的硬编码中文扫描误报。
 */

/** 按节填空的 system 提示:只补空槽、不改框架、严格回 JSON。 */
export const FILL_SYSTEM = `You fill in the blanks of ONE section of a report TEMPLATE, using the
source text provided. The template's structure — titles, table headers, chart axes/series, stat
labels, list/section layout — is FIXED. You do NOT change it; you only produce values for the
listed blank slots.

Rules:
- Return ONE JSON object whose keys are EXACTLY the slot keys listed, nothing more, nothing less.
- Each value MUST match the given schema type: a string; a string[][] (table rows); an array of
  row objects (chart data) using EXACTLY the given field keys; or one of the allowed enum values.
- For table rows, every row must have exactly the stated number of cells. For comparison criteria,
  "values" must have exactly the stated number of entries (column order preserved).
- Write in the SAME LANGUAGE as the source text. Be concise and faithful to the source; never invent
  facts. If the source lacks a value, give the closest faithful summary rather than fabricating.
- Output ONLY the JSON object: no markdown code fences, no comments, no prose before or after.`
