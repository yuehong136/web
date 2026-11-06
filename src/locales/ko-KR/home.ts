import english from '../en-US/home'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './home-1'

export const resource = withEnglishFallback(english, { ...part0 })
