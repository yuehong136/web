/**
 * 喂给 LLM 的「报告骨架」JSON 契约文本(英文,因为是给模型的结构指令;
 * 报告内容的语言由 prompt 要求跟随源文)。
 *
 * 这里描述的是**扁平 block 形状**(字段直接在 block 顶层,与 `../../types`
 * 的运行时 Block 一致),让模型最自然地产出;`parse.ts` 再把已知字段收进
 * `SkeletonBlock.fields`。形状/字段名与 `renderer/echarts-option.ts` 实际消费
 * 的键严格对齐,否则图表渲染空白。
 *
 * 单独成文以免 `prompt.ts` 超 300 行。
 */

/** 完整 JSON 契约 + 块选型指南。 */
export const SKELETON_CONTRACT = `OUTPUT SHAPE — a single JSON object:
{
  "title": string,                 // report title (required)
  "subtitle"?: string,
  "sections": Section[]            // ordered top-level sections (required, non-empty)
}

Section:
{
  "title"?: string,
  "subtitle"?: string,
  "layout": "full" | "two-column" | "three-column" | "sidebar-left" | "sidebar-right",
  "blocks": Block[]                // ordered content blocks in this section
}
Do NOT emit "id" fields — they are generated downstream.
Layout guidance: default to "full". Use "two-column"/"three-column" only when blocks are
clearly parallel (e.g. two comparable stat groups). Use "sidebar-left"/"sidebar-right" only
when one block is primary and another is supporting; in that case set each block's
"role": "main" | "side". Otherwise omit "role".

BLOCK TYPES — pick the MOST SPECIFIC type for each piece of content. Never dump everything
as paragraphs.

1. heading — a title/subtitle inside the content flow.
   { "type":"heading", "level":1|2|3, "content":string }

2. paragraph — narrative prose. Supports inline markdown: **bold**, *italic*, \`code\`.
   { "type":"paragraph", "content":string }

3. callout — a key takeaway / risk / tip / highlight that should stand out.
   { "type":"callout", "variant":"info"|"success"|"warning"|"insight", "title"?:string, "content":string }

4. list — a bulleted or numbered enumeration.
   { "type":"list", "ordered":boolean, "title"?:string, "items":string[] }

5. stat-card — ONE key metric / KPI. Prefer stat-card-group for several.
   { "type":"stat-card", "label":string, "value":string, "change"?:string, "trend"?:"up"|"down"|"neutral", "description"?:string }

6. stat-card-group — a row of KPIs.
   { "type":"stat-card-group", "items":[{ "label":string, "value":string, "change"?:string, "trend"?:"up"|"down"|"neutral", "description"?:string }] }

7. table — tabular data. Every row's length MUST equal headers' length.
   { "type":"table", "title"?:string, "headers":string[], "rows":string[][] }

8. comparison-matrix — compare options across dimensions. "items" are the compared
   objects (columns); each criterion's "values" align 1:1 with "items".
   { "type":"comparison-matrix", "title"?:string, "items":string[], "criteria":[{ "name":string, "values":string[] }] }

9. timeline — chronological events / phases.
   { "type":"timeline", "title"?:string, "items":[{ "date":string, "title":string, "description"?:string }] }

10. chart — a data visualization. "chartType" decides the required shape keys. Each row in
    "data" is an object; its keys MUST match the keys you declare. "data" values are numbers.
    chartType "bar" | "line" | "area" (cartesian):
      { "type":"chart","chartType":"bar","title"?:string,"xAxisKey":string,"yAxisLabel"?:string,
        "series":[{ "dataKey":string,"name"?:string }],
        "data":[{ [xAxisKey]:string, [series.dataKey]:number, ... }] }
    chartType "pie" | "donut" | "funnel" (proportion):
      { "type":"chart","chartType":"pie","nameKey":string,"valueKey":string,
        "data":[{ [nameKey]:string, [valueKey]:number }] }
    chartType "radar": one data row per dimension; radarKeys[0] is the field naming the dimension:
      { "type":"chart","chartType":"radar","radarKeys":[string],
        "series":[{ "dataKey":string,"name"?:string }],
        "data":[{ [radarKeys[0]]:string, [series.dataKey]:number, ... }] }
    chartType "scatter": each series reads xKey/yKey from the same data rows:
      { "type":"chart","chartType":"scatter",
        "series":[{ "dataKey":string,"xKey":string,"yKey":string,"name"?:string }],
        "data":[{ [xKey]:number, [yKey]:number }] }`

/** 一份紧凑的「文本 → 骨架」few-shot 样例(依从性的最大杠杆)。 */
export const FEW_SHOT_EXAMPLE = `{
  "title": "2024 Annual Performance Review",
  "subtitle": "Revenue, growth and outlook",
  "sections": [
    {
      "layout": "full",
      "blocks": [
        { "type": "heading", "level": 2, "content": "Executive Summary" },
        { "type": "paragraph", "content": "Revenue grew steadily through 2024, driven by the **enterprise** segment." },
        { "type": "stat-card-group", "items": [
          { "label": "Total Revenue", "value": "$12.4M", "change": "+18%", "trend": "up" },
          { "label": "Active Customers", "value": "3,210", "change": "+9%", "trend": "up" },
          { "label": "Churn", "value": "2.1%", "change": "-0.4%", "trend": "down" }
        ] },
        { "type": "callout", "variant": "insight", "title": "Key insight",
          "content": "Enterprise deals now account for 62% of revenue." }
      ]
    },
    {
      "layout": "full",
      "blocks": [
        { "type": "heading", "level": 2, "content": "Quarterly Revenue" },
        { "type": "chart", "chartType": "bar", "title": "Revenue by quarter",
          "xAxisKey": "quarter", "series": [{ "dataKey": "revenue", "name": "Revenue ($M)" }],
          "data": [
            { "quarter": "Q1", "revenue": 2.6 },
            { "quarter": "Q2", "revenue": 3.0 },
            { "quarter": "Q3", "revenue": 3.2 },
            { "quarter": "Q4", "revenue": 3.6 }
          ] }
      ]
    }
  ]
}`
