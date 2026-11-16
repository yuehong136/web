import english from '../en-US/ai-tools'
import { withEnglishFallback } from './fallback'

export const resource = withEnglishFallback(english, {})
