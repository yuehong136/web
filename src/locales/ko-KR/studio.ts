import english from '../en-US/studio'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './studio-1'

export const resource = withEnglishFallback(english, { ...part0 })
