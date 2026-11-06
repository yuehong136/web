import { sandboxResource as english } from '../en-US/sandbox'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './sandbox-1'

export const resource = withEnglishFallback(english, { ...part0 })
