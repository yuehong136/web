import { toast } from '@/lib/toast'
import { copyToClipboard } from '@/lib/utils'

export async function copyToClipboardWithFeedback(
  text: string,
  successMessage: string | undefined,
  failureMessage: string,
): Promise<boolean> {
  try {
    await copyToClipboard(text)
    if (successMessage) toast.success(successMessage)
    return true
  } catch {
    toast.error(failureMessage)
    return false
  }
}
