import { appearanceResource as english } from '../en-US/appearance'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './appearance-1'

export const resource = withEnglishFallback(english, { ...part0 })
