import {
  FileText,
  GitCompareArrows,
  Lightbulb,
  NotebookPen,
} from 'lucide-react'
import type { RecommendCard } from '../types'

/** Prefill prompts; nothing runs until the user submits their draft. */
export const recommendCards: RecommendCard[] = [
  {
    id: 1,
    title: '请根据我的资料提炼核心结论，并逐条列出引用来源。',
    titleKey: 'home.starters.summarizePrompt',
    tag: '总结资料',
    tagKey: 'home.starters.summarize',
    descriptionKey: 'home.starters.summarizeHint',
    icon: FileText,
    tone: 'bg-components-avatar-6-bg text-components-avatar-6-text',
  },
  {
    id: 2,
    title: '请比较这些方案的差异、依据和待确认的问题。',
    titleKey: 'home.starters.comparePrompt',
    tag: '对比方案',
    tagKey: 'home.starters.compare',
    descriptionKey: 'home.starters.compareHint',
    icon: GitCompareArrows,
    tone: 'bg-components-avatar-7-bg text-components-avatar-7-text',
  },
  {
    id: 3,
    title: '请根据背景资料起草一份简明的行动方案，列出下一步。',
    titleKey: 'home.starters.draftPrompt',
    tag: '形成下一步',
    tagKey: 'home.starters.draft',
    descriptionKey: 'home.starters.draftHint',
    icon: NotebookPen,
    tone: 'bg-components-avatar-2-bg text-components-avatar-2-text',
  },
  {
    id: 4,
    title: '请用通俗的语言解释这个概念，并举一个例子：',
    titleKey: 'home.starters.explainPrompt',
    tag: '解释概念',
    tagKey: 'home.starters.explain',
    descriptionKey: 'home.starters.explainHint',
    icon: Lightbulb,
    tone: 'bg-components-avatar-5-bg text-components-avatar-5-text',
  },
]
