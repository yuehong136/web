import english from '../en-US/reference'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './reference-1'

export const resource = withEnglishFallback(english, { ...part0 })
