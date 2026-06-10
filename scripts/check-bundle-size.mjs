#!/usr/bin/env node

/**
 * Bundle 体积预算门禁（零依赖）。在 `npm run build` 之后运行。
 *
 * 三道闸（预算在 bundle-size-budget.json，基于实测值 +5% 余量，只许下调不许上调）：
 *  - totalJsBytes      dist/js 全部 .js（不含 sourcemap）原始字节总量
 *  - entryGzipBytes    入口 chunk（dist/js/index-*.js）gzip 后字节数 —— 首屏成本
 *  - maxChunkGzipBytes 最大单 chunk gzip 后字节数 —— 防止懒加载边界塌掉
 *
 * 优化产物后请手动下调预算并在 docs/engineering-modernization-roadmap.md（ENG-4）记录。
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'

const DIST_JS = path.join('dist', 'js')
const BUDGET_PATH = path.join('scripts', 'bundle-size-budget.json')

if (!existsSync(DIST_JS)) {
  console.error(`找不到 ${DIST_JS}，请先运行 npm run build。`)
  process.exit(1)
}

const budget = JSON.parse(readFileSync(BUDGET_PATH, 'utf8'))

function walkJsFiles(dir) {
  const files = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) files.push(...walkJsFiles(full))
    else if (entry.endsWith('.js') && !entry.endsWith('.map')) files.push(full)
  }
  return files
}

const files = walkJsFiles(DIST_JS)
let totalJsBytes = 0
let entry = null
let maxChunk = { file: null, gzip: 0 }

for (const file of files) {
  const content = readFileSync(file)
  totalJsBytes += content.length
  const gzip = gzipSync(content).length
  if (gzip > maxChunk.gzip) maxChunk = { file, gzip }
  if (/(^|\/)index-[\w-]+\.js$/.test(file) && path.dirname(file) === DIST_JS) {
    entry = { file, gzip }
  }
}

if (!entry) {
  console.error(
    `在 ${DIST_JS} 下找不到入口 chunk（index-*.js），构建产物结构可能变了，请同步更新本脚本。`,
  )
  process.exit(1)
}

const mb = (n) => `${(n / 1048576).toFixed(2)} MB`
const kb = (n) => `${(n / 1024).toFixed(0)} KB`

const checks = [
  {
    name: 'JS 总量（raw）',
    actual: totalJsBytes,
    limit: budget.totalJsBytes,
    fmt: mb,
    detail: `${files.length} 个 chunk`,
  },
  {
    name: '入口 gzip',
    actual: entry.gzip,
    limit: budget.entryGzipBytes,
    fmt: kb,
    detail: entry.file,
  },
  {
    name: '最大 chunk gzip',
    actual: maxChunk.gzip,
    limit: budget.maxChunkGzipBytes,
    fmt: kb,
    detail: maxChunk.file,
  },
]

let failed = false
for (const c of checks) {
  const over = c.actual > c.limit
  if (over) failed = true
  const pct = ((c.actual / c.limit) * 100).toFixed(1)
  console.log(
    `${over ? '❌' : '✅'} ${c.name}: ${c.fmt(c.actual)} / 预算 ${c.fmt(c.limit)}（${pct}%）  ${c.detail}`,
  )
}

if (failed) {
  console.error(
    '\n❌ Bundle 超出预算。先确认是否能懒加载/拆包/换轻依赖；确属合理增长再上调 scripts/bundle-size-budget.json，并在 docs/engineering-modernization-roadmap.md（ENG-4）记录理由。',
  )
  process.exit(1)
}
console.log('\n✅ Bundle 体积预算通过。')
