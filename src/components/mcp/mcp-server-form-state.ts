import type { MCPServer } from '@/types/mcp'
export interface MCPServerFormData {
  name: string
  server_type: string
  url: string
  description: string
  variables: Record<string, unknown>
  headers: Record<string, string>
}
export function mcpServerFormDefaults(server?: MCPServer | null) {
  const formData: MCPServerFormData = {
    name: server?.name || '',
    server_type: server?.server_type || 'streamable-http',
    url: server?.url || '',
    description: server?.description || '',
    variables: server?.variables || {},
    headers: server?.headers || {},
  }
  return {
    formData,
    variableEntries: Object.entries(formData.variables).map(([key, value]) => ({
      key,
      value: typeof value === 'string' ? value : JSON.stringify(value),
    })),
    headerEntries: Object.entries(formData.headers).map(([key, value]) => ({
      key,
      value,
    })),
  }
}
