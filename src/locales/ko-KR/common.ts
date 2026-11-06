import english from '../en-US/common'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './common-1'

export const resource = withEnglishFallback(english, { ...part0 })
