import assert from 'node:assert/strict'
import { test } from 'node:test'
import { hasCitationMarkers, withoutPartialCitation } from '../reference-utils'

test('drops only an unfinished citation marker at the end of streaming text', () => {
  for (const tail of ['[', '[I', '[ID', '[ID:', '[ID:1', '[ID:12'])
    assert.equal(withoutPartialCitation(`Claim ${tail}`), 'Claim ')
  // Complete markers and brackets earlier in the text stay.
  assert.equal(
    withoutPartialCitation('Claim [ID:1] and [link](x)'),
    'Claim [ID:1] and [link](x)',
  )
  assert.equal(withoutPartialCitation('A [ID:1] b'), 'A [ID:1] b')
})

test('recognises complete citation markers only', () => {
  assert.equal(hasCitationMarkers('Claim [ID:0].'), true)
  assert.equal(hasCitationMarkers('Claim [ID:'), false)
  assert.equal(hasCitationMarkers('No citations'), false)
})
