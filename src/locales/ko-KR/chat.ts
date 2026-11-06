import english from '../en-US/chat'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './chat-1'

export const resource = withEnglishFallback(english, { ...part0 })
