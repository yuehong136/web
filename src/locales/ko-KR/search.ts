import english from '../en-US/search'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './search-1'

export const resource = withEnglishFallback(english, { ...part0 })
