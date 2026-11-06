import { desktopResource as english } from '../en-US/desktop'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './desktop-1'

export const resource = withEnglishFallback(english, { ...part0 })
