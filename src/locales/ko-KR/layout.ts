import english from '../en-US/layout'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './layout-1'

export const resource = withEnglishFallback(english, { ...part0 })
