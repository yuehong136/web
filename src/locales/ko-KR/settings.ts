import english from '../en-US/settings'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './settings-1'

export const resource = withEnglishFallback(english, { ...part0 })
