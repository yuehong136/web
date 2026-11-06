import { authResource as english } from '../en-US/auth'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './auth-1'

export const resource = withEnglishFallback(english, { ...part0 })
