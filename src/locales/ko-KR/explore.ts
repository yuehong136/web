import english from '../en-US/explore'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './explore-1'

export const resource = withEnglishFallback(english, { ...part0 })
