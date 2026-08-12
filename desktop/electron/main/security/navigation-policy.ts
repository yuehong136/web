import { isTrustedAppUrl } from '../app-protocol/app-url'

export function shouldBlockMainFrameNavigation(
  url: string,
  isMainFrame = true,
): boolean {
  return isMainFrame && !isTrustedAppUrl(url)
}
