import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidOrigin, parseEmbedAccess } from '../use-embed-access'

function params(input: Record<string, string>): URLSearchParams {
  return new URLSearchParams(input)
}

test('isValidOrigin accepts well-formed origins', () => {
  assert.equal(isValidOrigin('https://example.com'), true)
  assert.equal(isValidOrigin('https://embedder.example.com'), true)
  assert.equal(isValidOrigin('http://localhost:5173'), true)
  assert.equal(isValidOrigin('https://a.b.c:8443'), true)
})

test('isValidOrigin rejects malformed input', () => {
  assert.equal(isValidOrigin(''), false)
  assert.equal(isValidOrigin('example.com'), false)
  assert.equal(isValidOrigin('ftp://example.com'), false)
  assert.equal(isValidOrigin('https://example.com/'), false)
  assert.equal(isValidOrigin('https://example.com/path'), false)
  assert.equal(isValidOrigin('https://example.com?x=1'), false)
  assert.equal(isValidOrigin('https://example.com#h'), false)
  assert.equal(isValidOrigin('javascript:alert(1)'), false)
})

test('parseEmbedAccess rejects missing parent_origin', () => {
  const result = parseEmbedAccess(params({}))
  assert.equal(result.access, null)
  assert.ok(result.error)
  assert.match(result.error, /parent_origin/)
})

test('parseEmbedAccess rejects malformed parent_origin', () => {
  const result = parseEmbedAccess(
    params({ parent_origin: 'https://example.com/path' }),
  )
  assert.equal(result.access, null)
  assert.ok(result.error)
})

test('parseEmbedAccess applies defaults when minimal', () => {
  const result = parseEmbedAccess(
    params({ parent_origin: 'https://embedder.example.com' }),
  )
  assert.ok(result.access)
  assert.equal(result.access?.parentOrigin, 'https://embedder.example.com')
  assert.equal(result.access?.theme, undefined)
  assert.equal(result.access?.locale, undefined)
  assert.equal(result.access?.hideRail, false)
  // default show is just `save`
  assert.deepEqual(Array.from(result.access?.show ?? []), ['save'])
})

test('parseEmbedAccess parses show CSV and always keeps save', () => {
  const result = parseEmbedAccess(
    params({
      parent_origin: 'https://embedder.example.com',
      show: 'run,nav,publish',
    }),
  )
  assert.ok(result.access)
  const show = result.access?.show
  assert.equal(show?.has('save'), true)
  assert.equal(show?.has('run'), true)
  assert.equal(show?.has('nav'), true)
  assert.equal(show?.has('publish'), true)
})

test('parseEmbedAccess silently drops unknown show keys', () => {
  const result = parseEmbedAccess(
    params({
      parent_origin: 'https://embedder.example.com',
      show: 'save,share,random,run',
    }),
  )
  // share must NOT appear even if requested
  assert.equal(result.access?.show.has('share' as never), false)
  assert.equal(result.access?.show.has('run'), true)
  assert.equal(result.access?.show.has('save'), true)
})

test('parseEmbedAccess parses theme + locale', () => {
  const result = parseEmbedAccess(
    params({
      parent_origin: 'https://embedder.example.com',
      theme: 'dark',
      locale: 'en-US',
    }),
  )
  assert.equal(result.access?.theme, 'dark')
  assert.equal(result.access?.locale, 'en-US')
})

test('parseEmbedAccess ignores unsupported theme/locale values', () => {
  const result = parseEmbedAccess(
    params({
      parent_origin: 'https://embedder.example.com',
      theme: 'midnight',
      locale: 'fr-FR',
    }),
  )
  assert.equal(result.access?.theme, undefined)
  assert.equal(result.access?.locale, undefined)
})

test('parseEmbedAccess hide_rail accepts truthy variants', () => {
  for (const flag of ['1', 'true', 'yes', 'TRUE']) {
    const result = parseEmbedAccess(
      params({
        parent_origin: 'https://embedder.example.com',
        hide_rail: flag,
      }),
    )
    assert.equal(result.access?.hideRail, true, `flag=${flag}`)
  }
})

test('parseEmbedAccess hide_rail false / missing defaults to false', () => {
  for (const flag of ['', '0', 'off', 'false']) {
    const result = parseEmbedAccess(
      params({
        parent_origin: 'https://embedder.example.com',
        hide_rail: flag,
      }),
    )
    assert.equal(result.access?.hideRail, false, `flag=${flag}`)
  }
})
