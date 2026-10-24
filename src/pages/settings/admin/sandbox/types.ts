export type SandboxValue = string | number | boolean
export interface SandboxField {
  type: 'string' | 'integer' | 'boolean'
  required?: boolean
  default?: SandboxValue
  label?: string
  description?: string
  secret?: boolean
  multiline?: boolean
  readonly?: boolean
  scope?: 'runtime' | 'deployment'
  min?: number
  max?: number
}
export type SandboxSchema = Record<string, SandboxField>
export interface SandboxProvider {
  id: string
  name: string
  description: string
  available: boolean
  unavailable_reason?: string | null
}
export interface SandboxConfig {
  provider_type: string
  config: Record<string, SandboxValue>
  configured_secrets: string[]
  active_provider_type: string
  effective_provider_type: string
  environment_overrides: string[]
}
export interface SandboxTestResult {
  success: boolean
  message: string
  details: {
    exit_code: number
    execution_time: number
    stdout: string
    stderr: string
  }
}
