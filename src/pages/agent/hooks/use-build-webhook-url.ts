import { useParams } from 'react-router-dom'

export function useBuildWebhookUrl() {
  const { id } = useParams()

  const text = `${location.protocol}//${location.host}/api/v1/webhook/${id}`
  return text
}
