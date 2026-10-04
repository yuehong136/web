import assert from 'node:assert/strict'
import test from 'node:test'
import {
  normalizeSkillPath,
  prepareSkillDirectory,
  compareSkillPaths,
} from '../skill-upload-package'

const file = (path: string, content = 'text') => {
  const value = new File([content], path.split('/').pop() || '')
  Object.defineProperty(value, 'webkitRelativePath', { value: path })
  return value
}
test('directory manifest removes selected root once, preserves nested duplicates, hashes and sorts parts', async () => {
  const input = [
    file('root/z/same.txt', 'z'),
    file('root/SKILL.md'),
    file('root/a/same.txt', 'a'),
  ]
  const result = await prepareSkillDirectory(
    input,
    'demo',
    '1.2.3-beta.1',
    true,
  )
  assert.deepEqual(
    result.manifest.files?.map((entry) => entry.path),
    ['SKILL.md', 'a/same.txt', 'z/same.txt'],
  )
  assert.deepEqual(
    await Promise.all(result.files.map((entry) => entry.text())),
    ['text', 'a', 'z'],
  )
  assert.equal(
    result.manifest.files?.[1].sha256,
    'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
  )
  assert.equal(result.manifest.activate, true)
})
test('directory validation rejects unsafe paths, missing root SKILL.md, NFC collisions and mixed roots', async () => {
  for (const value of ['/absolute', 'a/../b', 'a//b', 'a\\b', '.', 'a/\0b'])
    assert.throws(() => normalizeSkillPath(value))
  for (const input of [
    [file('root/nested/SKILL.md')],
    [file('one/SKILL.md'), file('two/a')],
    [file('root/SKILL.md'), file('root/é.txt'), file('root/e\u0301.txt')],
  ])
    await assert.rejects(prepareSkillDirectory(input, 'demo', '1.0.0', false))
})
test('manifest ordering follows UTF-8 bytes, not locale collation', () => {
  assert.deepEqual(['é', 'Z', 'a', '😀'].sort(compareSkillPaths), [
    'Z',
    'a',
    'é',
    '😀',
  ])
})

test('path limits count Unicode characters and reject oversized storage segments', () => {
  assert.throws(() => normalizeSkillPath('a'.repeat(256)))
  assert.equal(normalizeSkillPath('a'.repeat(255)), 'a'.repeat(255))
  const unicode = `${'😀'.repeat(128)}/${'😀'.repeat(128)}`
  assert.equal(normalizeSkillPath(unicode), unicode)
  assert.throws(() =>
    normalizeSkillPath(`${'a'.repeat(255)}/${'b'.repeat(255)}/c`),
  )
})
