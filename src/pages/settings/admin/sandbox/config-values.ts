import type { SandboxSchema, SandboxValue } from './types'

export type SshAuthMode = 'password' | 'private_key'

/** Empty secret fields preserve stored values; explicit clears are separate actions. */
export function sandboxSubmitConfig(
  values: Record<string, SandboxValue>,
  schema: SandboxSchema,
  provider: string,
  authMode: SshAuthMode,
  clearedSecrets: string[],
): Record<string, SandboxValue> {
  const config = Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) =>
        schema[key] &&
        !schema[key].readonly &&
        !(schema[key].secret && value === ''),
    ),
  )
  for (const key of clearedSecrets) config[key] = ''
  if (provider === 'ssh') {
    if (authMode === 'password') {
      config.private_key = ''
      config.passphrase = ''
    } else config.password = ''
  }
  return config
}
