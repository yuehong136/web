import type { Environment } from '@/types/api'
export interface EnvironmentFormData {
  name: string
  description: string
  base_url: string
  is_default: boolean
}
export function environmentFormDefaults(
  environment?: Environment | null,
): EnvironmentFormData {
  return {
    name: environment?.name || '',
    description: environment?.description || '',
    base_url: environment?.base_url || '',
    is_default: environment?.is_default || false,
  }
}
