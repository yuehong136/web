import english from '../en-US/agents'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './agents-1'

export const resource = withEnglishFallback(english, { ...part0 })
