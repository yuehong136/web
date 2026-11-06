import english from '../en-US/memory'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './memory-1'

export const resource = withEnglishFallback(english, { ...part0 })
