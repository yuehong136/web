import english from '../en-US/channel'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './channel-1'

export const resource = withEnglishFallback(english, { ...part0 })
