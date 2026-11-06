import { sourcesResource as english } from '../en-US/sources'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './sources-1'

export const resource = withEnglishFallback(english, { ...part0 })
