import assert from 'node:assert/strict'
import test from 'node:test'
import { validateDesktopContracts } from '../../build/contracts.mjs'

const validContracts = Object.freeze({
  rendererBridgeVersion: 2,
  runClientProtocolVersion: null,
})

test('desktop contract validator accepts only the current exact contract', () => {
  assert.equal(validateDesktopContracts(validContracts), validContracts)

  for (const contracts of [
    null,
    [],
    {},
    { rendererBridgeVersion: 2 },
    { ...validContracts, unexpected: true },
  ]) {
    assert.throws(() => validateDesktopContracts(contracts), /contracts/)
  }
  assert.throws(
    () =>
      validateDesktopContracts({
        ...validContracts,
        rendererBridgeVersion: 1,
      }),
    /renderer bridge version must be 2/,
  )
  assert.throws(
    () =>
      validateDesktopContracts({
        ...validContracts,
        runClientProtocolVersion: 1,
      }),
    /run client protocol version/,
  )
})
