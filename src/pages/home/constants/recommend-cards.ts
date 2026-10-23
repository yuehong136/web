import type { RecommendCard } from '../types'

/** Prefill prompts; nothing runs until the user submits their draft. */
export const recommendCards: RecommendCard[] = [
  {
    id: 1,
    title: '请根据我的资料提炼核心结论，并逐条列出引用来源。',
    titleKey: 'home.starters.summarizePrompt',
    tag: '总结资料',
    tagKey: 'home.starters.summarize',
    bgColor: 'bg-components-card-bg',
  },
  {
    id: 2,
    title: '请比较这些方案的差异、依据和待确认的问题。',
    titleKey: 'home.starters.comparePrompt',
    tag: '对比方案',
    tagKey: 'home.starters.compare',
    bgColor: 'bg-components-card-bg',
  },
  {
    id: 3,
    title: '请根据背景资料起草一份简明的行动方案，列出下一步。',
    titleKey: 'home.starters.draftPrompt',
    tag: '形成下一步',
    tagKey: 'home.starters.draft',
    bgColor: 'bg-components-card-bg',
  },
]
