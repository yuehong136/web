import english from '../en-US/datasource'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './datasource-1'

export const resource = withEnglishFallback(english, { ...part0 })
