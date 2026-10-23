import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  addedLinesFromDiff,
  hardcodedFindings,
  runCheck,
} from '../check-agent-i18n-hardcoded.mjs'
import { checkCatalogPair, readCatalog } from '../i18n-catalog-quality.mjs'

const scan = (source, file = 'src/pages/example.tsx') =>
  hardcodedFindings(
    file,
    source,
    new Set(source.split('\n').map((_, index) => index + 1)),
  )

test('AST source scanner covers JSX, accessible names, tooltips and toast strings in both languages', () => {
  const source = `const view = <button aria-label="Open details" title={'打开'}><span>Save changes</span>{'取消'}</button>\ntoast.error('Could not save')\nconst title = t('common.title', '中文fallback')\n`
  assert.deepEqual(
    scan(source).map((item) => item.text),
    ['Open details', '打开', 'Save changes', '取消', 'Could not save'],
  )
})

test('scanner exempts translated defaults, protocol fields, comments, user content and explicit reasoned exceptions', () => {
  const source = `// English comments and 中文\nconst view = <div aria-label={t('common.open', '打开')}>{userContent}</div>\nconst protocol = { type: 'run-completed' }\n// i18n-ignore: third-party brand label\nconst brand = <span>Acme</span>\n`
  assert.deepEqual(scan(source), [])
  assert.deepEqual(
    scan('<div>Fixture copy</div>', 'src/pages/__tests__/fixture.test.tsx'),
    [],
  )
})

test('scanner checks only added lines and catches multiline JSX strings', () => {
  const source =
    '<div>Old text</div>\nconst view = <button aria-label={\n  "New accessible name"\n}>\n New text\n</button>'
  const findings = hardcodedFindings('src/new.tsx', source, new Set([3, 5]))
  assert.deepEqual(
    findings.map((item) => item.text),
    ['New accessible name', 'New text'],
  )
  assert.deepEqual(
    [
      ...addedLinesFromDiff(
        '+++ b/src/new.tsx\n@@ -1 +1,2 @@\n-old\n+first\n+second',
      ).get('src/new.tsx'),
    ],
    [1, 2],
  )
})

test('catalog evaluator reads default/named imports and spreads without executing code', () => {
  const files = new Map([
    [
      'catalog/index.ts',
      "import a from './common'; import { b } from './other'; export default {...a, ...b}",
    ],
    ['catalog/common.ts', "export default {common:{save:'Save {{name}}'}}"],
    [
      'catalog/other.ts',
      "throw new Error('must not run'); export const b = {other:{value:'Other'}} as const",
    ],
  ])
  assert.deepEqual(
    readCatalog((file) => files.get(file), 'catalog/index.ts'),
    { common: { save: 'Save {{name}}' }, other: { value: 'Other' } },
  )
})

test('catalog quality validates key parity, placeholders, plural categories and nonempty strings', () => {
  assert.deepEqual(
    checkCatalogPair(
      { total_one: '{{count}} item', total_other: '{{count}} items' },
      { total_other: '{{count}} 项' },
    ),
    [],
  )
  assert.deepEqual(
    checkCatalogPair(
      {
        total: 'Items',
        total_one: '{{count}} item',
        total_other: '{{count}} items',
      },
      { total: '项', total_other: '{{count}} 项' },
    ),
    [],
  )
  assert.deepEqual(
    checkCatalogPair(
      {
        total_zero: 'No items',
        total_one: '{{count}} item',
        total_other: '{{count}} items',
      },
      { total_zero: '无项目', total_other: '{{count}} 项' },
    ),
    [],
  )
  const issues = checkCatalogPair(
    {
      missing: 'Only English',
      value: '{{name}}',
      blank: ' ',
      total_one: '{{count}} item',
    },
    { value: '{{other}}', blank: '值', total_other: '{{count}} 项' },
  )
  assert.ok(
    issues.some(
      (item) => item.rule === 'missing-key' && item.key === 'missing',
    ),
  )
  assert.ok(
    issues.some(
      (item) => item.rule === 'interpolation' && item.key === 'value',
    ),
  )
  assert.ok(issues.some((item) => item.rule === 'empty-value'))
  assert.ok(
    issues.some(
      (item) => item.rule === 'missing-plural' && item.detail === 'en-US:other',
    ),
  )
})

test('committed base/head CI diffs do not silently inspect an empty working tree', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'web-i18n-quality-'))
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  const write = (name, source) => {
    mkdirSync(path.dirname(path.join(root, name)), { recursive: true })
    writeFileSync(path.join(root, name), source)
  }
  try {
    git(['init', '-q'])
    git(['config', 'user.name', 'Test'])
    git(['config', 'user.email', 'test@example.invalid'])
    write(
      'src/locales/en-US/index.ts',
      "export default {old:'Existing legacy'}",
    )
    write('src/locales/zh-CN/index.ts', 'export default {}')
    write('src/page.tsx', 'const view = <div />')
    git(['add', '.'])
    git(['commit', '-qm', 'baseline'])
    const base = git(['rev-parse', 'HEAD'])
    write(
      'src/page.tsx',
      'const view = <div title="New UI">New English text</div>',
    )
    write(
      'src/locales/en-US/index.ts',
      "export default {old:'Existing legacy', added:'{{name}}'}",
    )
    write(
      'src/locales/zh-CN/index.ts',
      "export default {added:'{{different}}'}",
    )
    git(['add', '.'])
    git(['commit', '-qm', 'candidate'])
    const result = runCheck(['--base', base, '--head', 'HEAD'], root)
    assert.equal(result.sourceFindings.length, 2)
    assert.ok(
      result.catalogIssues.some((item) => item.rule === 'interpolation'),
    )
    assert.ok(!result.catalogIssues.some((item) => item.key === 'old'))
    assert.equal(
      runCheck(
        [
          '--base',
          '0000000000000000000000000000000000000000',
          '--head',
          'HEAD',
        ],
        root,
      ).sourceFindings.length,
      2,
    )
    assert.equal(
      runCheck(['--base', base, '--head', 'HEAD', '--catalogs-only'], root)
        .sourceFindings.length,
      0,
    )
    assert.ok(
      runCheck(['--all', '--catalogs-only'], root).catalogIssues.some(
        (item) => item.key === 'old',
      ),
    )
    assert.throws(
      () => runCheck(['--base', 'missing-revision'], root),
      /failed/u,
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

function withRepository(run) {
  const root = mkdtempSync(path.join(os.tmpdir(), 'web-i18n-diff-'))
  const git = (args) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  const write = (file, source) => {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true })
    writeFileSync(path.join(root, file), source)
  }
  try {
    git(['init', '-q'])
    git(['config', 'user.name', 'Test'])
    git(['config', 'user.email', 'test@example.invalid'])
    write('src/locales/en-US/index.ts', "export default {common:{save:'Save'}}")
    write('src/locales/zh-CN/index.ts', "export default {common:{save:'保存'}}")
    write('src/view.tsx', 'export const view = <div />')
    write('src/theme.generated.tsx', 'export const generated = <div />')
    write('src/styles.css', '.old {}')
    git(['add', '.'])
    git(['commit', '-qm', 'baseline'])
    run({ root, git, write, base: git(['rev-parse', 'HEAD']) })
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

test('large CSS and generated diffs do not hide real tracked or untracked UI additions', () => {
  withRepository(({ root, git, write, base }) => {
    write('src/styles.css', `/* ${'css'.repeat(500_000)} */`)
    write(
      'src/theme.generated.tsx',
      `export const generated = <button>Generated UI</button>\n//${'generated'.repeat(150_000)}`,
    )
    write('src/view.tsx', 'export const view = <button>Changed UI</button>')
    write(
      'src/new-view.jsx',
      'export const view = <button>Untracked JSX</button>',
    )
    write('src/__tests__/fixture.tsx', '<button>Fixture UI</button>')
    write(
      'src/generated/fixture.tsx',
      '<button>Generated directory UI</button>',
    )
    const expected = ['Changed UI', 'Untracked JSX']
    const working = runCheck(['--base', base], root)
    assert.deepEqual(
      working.sourceFindings.map((finding) => finding.text).sort(),
      expected.sort(),
    )
    git(['add', '.'])
    git(['commit', '-qm', 'large styles and source candidate'])
    const committed = runCheck(['--base', base, '--head', 'HEAD'], root)
    assert.deepEqual(
      committed.sourceFindings.map((finding) => finding.text).sort(),
      expected.sort(),
    )
    assert.deepEqual(committed.catalogIssues, [])
  })
})

test('catalog-only skips diff and untracked index reads while still validating revisions', () => {
  withRepository(({ root, write, base }) => {
    write('src/styles.css', `/* ${'css'.repeat(500_000)} */`)
    write('src/untracked.tsx', '<button>Untracked UI</button>')
    writeFileSync(path.join(root, '.git/index'), 'invalid index fixture')
    assert.throws(() => runCheck(['--base', base], root), /git diff failed:/u)
    for (const extra of [[], ['--head', 'HEAD'], ['--all']]) {
      const result = runCheck(
        ['--base', base, '--catalogs-only', ...extra],
        root,
      )
      assert.deepEqual(result.sourceFindings, [])
      assert.deepEqual(result.catalogIssues, [])
    }
    assert.throws(
      () => runCheck(['--base', 'missing-revision', '--catalogs-only'], root),
      /git rev-parse failed:\s*\S/u,
    )
    assert.throws(
      () => runCheck(['--head', 'missing-revision', '--catalogs-only'], root),
      /git rev-parse failed:\s*\S/u,
    )
  })
})

test('an oversized eligible source diff reports the process error even with empty stderr', () => {
  withRepository(({ root, write, base }) => {
    write(
      'src/view.tsx',
      `export const text = '${'x'.repeat(17 * 1024 * 1024)}'`,
    )
    assert.throws(
      () => runCheck(['--base', base], root),
      /git diff failed:[\s\S]*(?:ENOBUFS|maxBuffer)/u,
    )
    const catalogs = runCheck(['--base', base, '--catalogs-only'], root)
    assert.deepEqual(catalogs.catalogIssues, [])
    assert.deepEqual(catalogs.sourceFindings, [])
  })
})
