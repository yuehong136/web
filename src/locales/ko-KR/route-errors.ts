import english from '../en-US/route-errors'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './route-errors-1'

export const resource = withEnglishFallback(english, { ...part0 })
