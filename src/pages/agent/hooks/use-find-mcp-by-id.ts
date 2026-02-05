import { useFetchMCPServers } from '@/hooks/use-mcp-request'

export function useFindMcpById() {
  const { data } = useFetchMCPServers({ page_size: 200 })

  const findMcpById = (id: string) =>
    data?.mcp_servers?.find((item) => item.id === id)

  return { findMcpById }
}
