import { skillsResource as english } from '../en-US/skills'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './skills-1'

export const resource = withEnglishFallback(english, { ...part0 })
