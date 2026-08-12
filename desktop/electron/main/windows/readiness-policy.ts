import { APP_ENTRY_URL } from '../app-protocol/constants'

export function isExpectedRendererDocument(url: string): boolean {
  return url === APP_ENTRY_URL
}
