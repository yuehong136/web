import english from '../en-US/mcp'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './mcp-1'

export const resource = withEnglishFallback(english, { ...part0 })
