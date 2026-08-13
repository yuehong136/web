import {
  RENDERER_BRIDGE_VERSION,
  RUN_CLIENT_PROTOCOL_VERSION,
} from './constants.mjs'

const expectedContractKeys = Object.freeze([
  'rendererBridgeVersion',
  'runClientProtocolVersion',
])

export function validateDesktopContracts(contracts) {
  if (!contracts || typeof contracts !== 'object' || Array.isArray(contracts)) {
    throw new Error('desktop contracts must be an object')
  }

  const actualKeys = Object.keys(contracts).sort()
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedContractKeys)) {
    throw new Error('desktop contracts must contain only supported fields')
  }
  if (contracts.rendererBridgeVersion !== RENDERER_BRIDGE_VERSION) {
    throw new Error(
      `renderer bridge version must be ${RENDERER_BRIDGE_VERSION}`,
    )
  }
  if (contracts.runClientProtocolVersion !== RUN_CLIENT_PROTOCOL_VERSION) {
    throw new Error('run client protocol version does not match this build')
  }

  return contracts
}
