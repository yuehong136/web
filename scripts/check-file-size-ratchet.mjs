#!/usr/bin/env node

/**
 * 文件体积棘轮（ratchet）门禁 —— CLAUDE.md「文件大小」规则的 enforcement。
 *
 * 规则（与 CLAUDE.md / AGENTS.md 一致，>600 行禁止）：
 *  - 超过 LIMIT 行的源文件必须出现在基线 file-size-baseline.json 中，且行数不得超过记录值；
 *  - 新文件不得超过 LIMIT 行；
 *  - 基线只许收紧不许放宽：偿还债务（行数下降）后跑 `npm run lint:file-size:update` 更新基线。
 *
 * 排除项（与规范的适用范围一致）：locale 资源、生成物、测试与 __dev__ 离线脚本。
 *
 * 用法：
 *  node scripts/check-file-size-ratchet.mjs            # 校验（CI 用）
 *  node scripts/check-file-size-ratchet.mjs --update   # 用当前状态重写基线（只在偿还债务后使用）
 *
 * 背景见 docs/engineering-modernization-roadmap.md 的 ENG-1。
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const LIMIT = 600
const BASELINE_PATH = path.join('scripts', 'file-size-baseline.json')
const UPDATE = process.argv.includes('--update')

const EXCLUDED = [
  /^src\/locales\//,
  /\.generated\.ts$/,
  /\/__tests__\//,
  /\.test\.[jt]sx?$/,
  /\/__dev__\//,
]

function listSourceFiles() {
  // -c 已跟踪 + -o 未跟踪（遵守 .gitignore），保证本地新增文件也被检查
  const out = execFileSync(
    'git',
    [
      'ls-files',
      '-co',
      '--exclude-standard',
      '--',
      'src/**/*.ts',
      'src/**/*.tsx',
    ],
    { encoding: 'utf8' },
  )
  return out
    .split('\n')
    .filter(Boolean)
    .filter((file) => !EXCLUDED.some((pattern) => pattern.test(file)))
    .filter((file) => existsSync(file))
}

function countLines(file) {
  const content = readFileSync(file, 'utf8')
  if (content === '') return 0
  return content.split('\n').length - (content.endsWith('\n') ? 1 : 0)
}

const current = new Map()
for (const file of listSourceFiles()) {
  const lines = countLines(file)
  if (lines > LIMIT) current.set(file, lines)
}

if (UPDATE) {
  const sorted = Object.fromEntries(
    [...current.entries()].sort((a, b) => b[1] - a[1]),
  )
  writeFileSync(BASELINE_PATH, JSON.stringify(sorted, null, 2) + '\n')
  console.log(
    `基线已更新：${current.size} 个超 ${LIMIT} 行的文件写入 ${BASELINE_PATH}`,
  )
  process.exit(0)
}

if (!existsSync(BASELINE_PATH)) {
  console.error(
    `缺少基线文件 ${BASELINE_PATH}，先运行 npm run lint:file-size:update 生成。`,
  )
  process.exit(1)
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf8'))
const errors = []
const shrunk = []

for (const [file, lines] of current) {
  const allowed = baseline[file]
  if (allowed === undefined) {
    errors.push(
      `新超标文件：${file}（${lines} 行 > ${LIMIT}）。新文件禁止超过 ${LIMIT} 行，请拆分（参考 CLAUDE.md「模块形态」与 pages/studio/create-app/ 的拆分模式）。`,
    )
  } else if (lines > allowed) {
    errors.push(
      `债务文件继续膨胀：${file}（${allowed} → ${lines} 行，+${lines - allowed}）。该文件只许减不许增，请把新增逻辑放到拆分模块中。`,
    )
  } else if (lines < allowed) {
    shrunk.push(`${file}（${allowed} → ${lines} 行）`)
  }
}

for (const file of Object.keys(baseline)) {
  if (!current.has(file)) {
    shrunk.push(`${file}（已低于 ${LIMIT} 行或已删除，可从基线移除）`)
  }
}

if (shrunk.length > 0) {
  console.log(
    '✅ 检测到债务偿还，请运行 npm run lint:file-size:update 收紧基线：',
  )
  for (const item of shrunk) console.log(`   ${item}`)
}

if (errors.length > 0) {
  console.error(`\n❌ 文件体积棘轮检查失败（上限 ${LIMIT} 行）：\n`)
  for (const err of errors) console.error(`  - ${err}`)
  console.error(
    '\n背景与规则见 docs/engineering-modernization-roadmap.md（ENG-1）与 CLAUDE.md「File Organization」。',
  )
  process.exit(1)
}

console.log(
  `✅ 文件体积棘轮通过：${current.size} 个在册债务文件均未膨胀（上限 ${LIMIT} 行）。`,
)
