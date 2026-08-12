import { isTrustedAppUrl } from '../app-protocol/app-url'

export interface SenderFrame {
  readonly url: string
  readonly parent: SenderFrame | null
  isDestroyed(): boolean
}

export function isTrustedSenderFrame(
  senderFrame: SenderFrame | null | undefined,
  expectedMainFrame: SenderFrame,
): boolean {
  return (
    senderFrame === expectedMainFrame &&
    senderFrame.parent === null &&
    !senderFrame.isDestroyed() &&
    isTrustedAppUrl(senderFrame.url)
  )
}
