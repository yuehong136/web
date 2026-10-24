#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { catalogFindings } from './i18n-catalog-quality.mjs'

const visibleProps = new Set([
  'title',
  'description',
  'label',
  'placeholder',
  'alt',
  'aria-label',
  'aria-description',
  'tooltip',
  'tooltipContent',
  'emptyText',
  'loadingText',
  'retryLabel',
])
const chinese = /[\u4e00-\u9fff]/u
const visibleText = /[\p{L}]/u
const ignoredFile =
  /(?:\/(?:__(?:tests|dev|generated)__|generated)\/|\.(?:test|spec|generated)\.[jt]sx?$|^src\/locales\/)/u
const sourcePathspecs = [
  ...['ts', 'tsx', 'js', 'jsx'].map(
    (extension) => `:(glob)src/**/*.${extension}`,
  ),
  ...['__tests__', '__dev__', '__generated__', 'generated'].map(
    (directory) => `:(glob,exclude)src/**/${directory}/**`,
  ),
  ...['test', 'spec', 'generated'].map(
    (suffix) => `:(glob,exclude)src/**/*.${suffix}.*`,
  ),
  ':(glob,exclude)src/locales/**',
]
const legacyScope = /^src\/(?:components\/layout|pages\/agents?)(?:\/|$)/u
const ignoredLegacy = (file, line) =>
  /src\/pages\/agent\/operators\/descriptions\.ts$/u.test(file) ||
  (/src\/pages\/agent\/canvas\/node\/node-display\.ts$/u.test(file) &&
    /DEFAULT_NAME_ALIASES|\[Operator\./u.test(line))

export function addedLinesFromDiff(diff) {
  const files = new Map()
  let file
  let line = 0
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ b/')) {
      file = raw.slice(6)
      if (!files.has(file)) files.set(file, new Set())
    } else if (raw.startsWith('@@'))
      line = Number(raw.match(/\+(\d+)/u)?.[1] ?? 0)
    else if (raw.startsWith('+') && file) {
      files.get(file).add(line)
      line += 1
    } else if (!raw.startsWith('-') && !raw.startsWith('\\')) line += 1
  }
  return files
}

function translationCall(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (
      ts.isCallExpression(parent) &&
      /(?:^|\.)t$/u.test(parent.expression.getText())
    )
      return true
    if (ts.isStatement(parent) || ts.isJsxAttribute(parent)) return false
  }
  return false
}

function toastArgument(node) {
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (ts.isCallExpression(parent))
      return /^(?:toast(?:\.(?:error|success|warning|info|message))?|message\.(?:error|success|warning|info))$/u.test(
        parent.expression.getText(),
      )
    if (ts.isStatement(parent)) break
  }
  return false
}

/** AST contexts avoid multiline/comment loopholes and cover English UI as well. */
export function hardcodedFindings(file, source, addedLines) {
  if (ignoredFile.test(file) || !/\.[jt]sx?$/u.test(file)) return []
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )
  const lines = source.split('\n')
  const findings = []
  function visit(node) {
    const literal = ts.isStringLiteralLike(node) || ts.isJsxText(node)
    if (literal) {
      const value = node.text.trim()
      const start =
        tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1
      const end = tree.getLineAndCharacterOfPosition(node.getEnd()).line + 1
      const changed = [...addedLines].some(
        (line) => line >= start && line <= end,
      )
      const inlineExemption = lines
        .slice(Math.max(0, start - 2), end)
        .some((line) => /i18n-ignore:\s*\S+/u.test(line))
      const property = ts.isJsxAttribute(node.parent)
        ? node.parent
        : ts.isJsxExpression(node.parent) &&
            ts.isJsxAttribute(node.parent.parent)
          ? node.parent.parent
          : undefined
      const visible =
        ts.isJsxText(node) ||
        (ts.isJsxExpression(node.parent) &&
          (ts.isJsxElement(node.parent.parent) ||
            ts.isJsxFragment(node.parent.parent))) ||
        (property && visibleProps.has(property.name.getText(tree))) ||
        toastArgument(node)
      const legacyChinese =
        legacyScope.test(file) &&
        chinese.test(value) &&
        !ignoredLegacy(file, lines[start - 1])
      if (
        changed &&
        value &&
        visibleText.test(value) &&
        !inlineExemption &&
        !translationCall(node) &&
        (visible || legacyChinese)
      )
        findings.push({
          file,
          line: start,
          text: value.replaceAll('\n', ' ').slice(0, 180),
        })
    }
    ts.forEachChild(node, visit)
  }
  visit(tree)
  return findings
}

function git(args, cwd, optional = false) {
  try {
    return execFileSync('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      maxBuffer: 16 * 1024 * 1024,
    })
  } catch (error) {
    if (optional) return undefined
    const details = [error.stderr, error.message]
      .map((value) => String(value ?? '').trim())
      .filter(Boolean)
    throw new Error(
      `git ${args[0]} failed: ${[...new Set(details)].join('\n')}`,
    )
  }
}

export function runCheck(args = process.argv.slice(2), cwd = process.cwd()) {
  const options = {
    base: 'HEAD',
    head: undefined,
    all: false,
    catalogsOnly: false,
  }
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--base' || arg === '--head') {
      const value = args[++index]
      if (!value || value.startsWith('--'))
        throw new Error(`${arg} requires a Git revision`)
      options[arg.slice(2)] = value
    } else if (arg === '--all') options.all = true
    else if (arg === '--catalogs-only') options.catalogsOnly = true
    else throw new Error(`Unknown argument: ${arg}`)
  }
  const head = options.head
    ? git(['rev-parse', '--verify', `${options.head}^{commit}`], cwd).trim()
    : undefined
  const base = /^0+$/u.test(options.base)
    ? git(['rev-parse', '--verify', `${head ?? 'HEAD'}^`], cwd, true)?.trim()
    : git(['rev-parse', '--verify', `${options.base}^{commit}`], cwd).trim()
  const emptyTree = '4b825dc642cb6eb9a060e54bf8d69288fbee4904'
  const baseRef = base ?? emptyTree
  const readRevision = (revision) => (file) =>
    git(['show', `${revision}:${file}`], cwd, true)
  const readCurrent = head
    ? readRevision(head)
    : (file) =>
        existsSync(path.join(cwd, file))
          ? readFileSync(path.join(cwd, file), 'utf8')
          : undefined
  let sourceFindings = []
  if (!options.catalogsOnly) {
    const diff = git(
      [
        'diff',
        '--no-ext-diff',
        '--no-renames',
        '--unified=0',
        baseRef,
        ...(head ? [head] : []),
        '--',
        ...sourcePathspecs,
      ],
      cwd,
    )
    const changed = addedLinesFromDiff(diff)
    if (!head) {
      const untracked = git(
        [
          'ls-files',
          '--others',
          '--exclude-standard',
          '-z',
          '--',
          ...sourcePathspecs,
        ],
        cwd,
      )
        .split('\0')
        .filter(Boolean)
      for (const file of untracked)
        changed.set(
          file,
          new Set(
            (readCurrent(file) ?? '').split('\n').map((_, index) => index + 1),
          ),
        )
    }
    sourceFindings = [...changed].flatMap(([file, lines]) =>
      hardcodedFindings(file, readCurrent(file) ?? '', lines),
    )
  }
  const previousCatalogFindings = options.all
    ? new Set()
    : new Set(
        catalogFindings(readRevision(baseRef)).map(
          (finding) => finding.fingerprint,
        ),
      )
  const catalogIssues = catalogFindings(readCurrent).filter(
    (finding) => !previousCatalogFindings.has(finding.fingerprint),
  )
  return {
    sourceFindings,
    catalogIssues,
    legacyCatalogIssues: previousCatalogFindings.size,
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = runCheck()
    for (const finding of result.sourceFindings)
      console.error(
        `Hardcoded UI: ${finding.file}:${finding.line} ${finding.text}`,
      )
    for (const finding of result.catalogIssues)
      console.error(
        `Locale ${finding.rule}: ${finding.key} (${finding.detail})`,
      )
    const count = result.sourceFindings.length + result.catalogIssues.length
    console.log(
      `i18n quality: ${count} new issue(s); ${result.legacyCatalogIssues} baseline catalog issue(s).`,
    )
    if (count) process.exitCode = 1
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
