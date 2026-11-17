import english from '../en-US/environment'
import { withEnglishFallback } from './fallback'

export const resource = withEnglishFallback(english, {})
