import english from '../en-US/flow'
import { withEnglishFallback } from './fallback'
import { translations as part0 } from './flow-1'
import { translations as part1 } from './flow-2'
import { translations as part2 } from './flow-3'
import { translations as part3 } from './flow-4'

export const resource = withEnglishFallback(english, {
  ...part0,
  ...part1,
  ...part2,
  ...part3,
})
