import english from '../en-US/knowledge'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './knowledge-1'
import { translations as part1 } from './knowledge-2'

export const resource = withEnglishFallback(english, { ...part0, ...part1 })
