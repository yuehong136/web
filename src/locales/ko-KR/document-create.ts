import english from '../en-US/document-create'
import { withEnglishFallback } from './fallback'

export const resource = withEnglishFallback(english, {})
