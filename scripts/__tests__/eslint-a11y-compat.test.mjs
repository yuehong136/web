import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gunzipSync } from 'node:zlib'
import { test } from 'node:test'
import { Linter } from 'eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'

function check(code, rules) {
  return new Linter().verify(code, {
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'jsx-a11y': jsxA11y },
    rules,
  })
}

test('every published a11y rule executes on ESLint 10 without a fatal error', () => {
  const rules = Object.fromEntries(
    Object.keys(jsxA11y.rules).map((name) => [`jsx-a11y/${name}`, 'warn']),
  )
  const messages = check(
    '<div><img src="/figure.png" alt="A chart" /><button type="button">Run</button></div>',
    rules,
  )
  assert.equal(
    messages.some((message) => message.fatal),
    false,
  )
  assert.equal(messages.length, 0)
  assert.ok(Object.keys(rules).length >= 30)
})

test('accessibility violations still produce their original rule diagnostics', () => {
  for (const [rule, code] of [
    ['alt-text', '<img src="/figure.png" />'],
    ['anchor-is-valid', '<a href="#">Open</a>'],
    ['aria-props', '<div aria-unknown="true" />'],
    ['click-events-have-key-events', '<div onClick={() => {}} />'],
    ['label-has-associated-control', '<label>Name</label>'],
    ['no-autofocus', '<input autoFocus />'],
  ]) {
    const id = `jsx-a11y/${rule}`
    const messages = check(code, { [id]: 'warn' })
    assert.ok(
      messages.some((message) => message.ruleId === id),
      `${id} did not execute`,
    )
    assert.equal(
      messages.some((message) => message.fatal),
      false,
    )
  }
})

test('the vendored implementation and license match all pinned upstream file hashes', () => {
  const provenance = JSON.parse(
    readFileSync(
      new URL('../../vendor/jsx-a11y-provenance.json', import.meta.url),
    ),
  )
  const archive = gunzipSync(
    readFileSync(
      new URL(
        '../../vendor/eslint-plugin-jsx-a11y-6.10.2-web.1.tgz',
        import.meta.url,
      ),
    ),
  )
  const names = []
  for (let offset = 0; offset < archive.length; ) {
    const header = archive.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break
    const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
    const size = Number.parseInt(header.subarray(124, 136).toString(), 8) || 0
    const content = archive.subarray(offset + 512, offset + 512 + size)
    if (name === 'package/package.json') {
      const metadata = JSON.parse(content)
      assert.equal(metadata.version, '6.10.2-web.1')
      assert.equal(
        metadata.peerDependencies.eslint,
        '^3 || ^4 || ^5 || ^6 || ^7 || ^8 || ^9 || ^10',
      )
    } else {
      assert.equal(
        createHash('sha256').update(content).digest('hex'),
        provenance.unchangedFiles[name],
        name,
      )
      names.push(name)
    }
    offset += 512 + Math.ceil(size / 512) * 512
  }
  assert.equal(names.length, Object.keys(provenance.unchangedFiles).length)
  assert.ok(names.includes('package/LICENSE.md'))
  assert.ok(names.some((name) => name.startsWith('package/lib/rules/')))
})
