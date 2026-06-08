#!/usr/bin/env node

import { execFileSync } from 'node:child_process'

const scanPaths = [
  'src/components/layout',
  'src/pages/agent',
  'src/pages/agents',
]

const ignoredFilePatterns = [
  /\/__tests__\//,
  // 离线开发脚本（如样例报告生成器）：产出物非 UI，内容是中文样例数据而非界面文案，
  // 与 __tests__ 同属不随产品发布的开发目录，故同样豁免硬编码中文检查。
  /\/__dev__\//,
  /\.test\.[jt]sx?$/,
  /src\/locales\//,
]

const chinesePattern = /[\u4e00-\u9fff]/
const tCallPattern = /\b(?:t|i18n\.t)\s*\(/
const allowedInlinePatterns = [
  /zh-CN/,
  /简体中文/,
  /Beta Token/,
  /RAGFlow/,
  /shared_id/,
]

const allowedFileLinePatterns = [
  {
    file: /src\/pages\/agent\/canvas\/node\/node-display\.ts$/,
    line: /DEFAULT_NAME_ALIASES|^\s+\[Operator\./,
  },
  {
    // 算子描述元数据：整文件为中文常量映射，不走 i18n（节点配置面板头部展示），
    // 与全部既有条目一致；仅放行该文件的 `key: '...'` 描述行。
    file: /src\/pages\/agent\/operators\/descriptions\.ts$/,
    line: /^\s+\w+:\s*'/,
  },
]

function collectDiff(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8' })
  } catch (error) {
    process.stderr.write(error.stdout || '')
    process.stderr.write(error.stderr || '')
    process.exit(error.status || 1)
  }
}

function parseDiff(diffText) {
  const findings = []
  let file = ''
  let newLine = 0
  let translationDepth = 0

  for (const rawLine of diffText.split('\n')) {
    if (rawLine.startsWith('+++ b/')) {
      file = rawLine.slice('+++ b/'.length)
      translationDepth = 0
      continue
    }

    const hunk = rawLine.match(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      newLine = Number(hunk[1])
      translationDepth = 0
      continue
    }

    if (!file || ignoredFilePatterns.some((pattern) => pattern.test(file))) {
      continue
    }

    if (rawLine.startsWith('+') && !rawLine.startsWith('+++')) {
      const line = rawLine.slice(1)
      const trimmed = line.trim()

      const startsTranslationCall = tCallPattern.test(line)
      const inTranslationCall = translationDepth > 0 || startsTranslationCall

      const isComment =
        trimmed.startsWith('//') ||
        trimmed.startsWith('/*') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('{/*') ||
        trimmed.endsWith('*/}')
      const allowed =
        inTranslationCall ||
        isComment ||
        allowedFileLinePatterns.some(
          (pattern) => pattern.file.test(file) && pattern.line.test(line),
        ) ||
        allowedInlinePatterns.some((pattern) => pattern.test(line))

      if (chinesePattern.test(line) && !allowed) {
        findings.push({ file, line: newLine, text: trimmed })
      }

      if (inTranslationCall) {
        const opens = (line.match(/\(/g) || []).length
        const closes = (line.match(/\)/g) || []).length
        translationDepth += opens - closes
        if (translationDepth <= 0) {
          translationDepth = 0
        }
      }

      newLine += 1
      continue
    }

    if (rawLine.startsWith('-') && !rawLine.startsWith('---')) {
      continue
    }

    if (rawLine && !rawLine.startsWith('\\')) {
      newLine += 1
    }
  }

  return findings
}

const diffs = [
  collectDiff(['diff', '--unified=0', '--', ...scanPaths]),
  collectDiff(['diff', '--cached', '--unified=0', '--', ...scanPaths]),
]

const findings = diffs.flatMap(parseDiff)
const uniqueFindings = Array.from(
  new Map(
    findings.map((finding) => [
      `${finding.file}:${finding.line}:${finding.text}`,
      finding,
    ]),
  ).values(),
)

if (uniqueFindings.length) {
  console.error('Hardcoded Chinese UI text was added in Agent/Layout scope:')
  for (const finding of uniqueFindings) {
    console.error(`- ${finding.file}:${finding.line} ${finding.text}`)
  }
  console.error('Move user-visible text into locale files and call t(...) from the component.')
  process.exit(1)
}

console.log('No added hardcoded Chinese UI text found in Agent/Layout scope.')
