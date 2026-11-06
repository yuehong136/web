import english from '../en-US/agent'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './agent-1'

export const resource = withEnglishFallback(english, { ...part0 })
