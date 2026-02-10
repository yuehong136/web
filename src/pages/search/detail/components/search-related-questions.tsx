import React, { memo } from 'react'
import { MessageCircleQuestion } from 'lucide-react'

interface SearchRelatedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

const SearchRelatedQuestions: React.FC<SearchRelatedQuestionsProps> = ({ questions, onSelect }) => {
  if (!questions.length) return null

  return (
    <div>
      <div className="flex items-center gap-2 mb-space-xs">
        <MessageCircleQuestion className="h-4 w-4 text-text-tertiary" />
        <span className="text-sm font-medium text-text-primary">相关问题</span>
      </div>
      <div className="flex flex-wrap gap-space-xs">
        {questions.map((question) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className="rounded-radius-full border border-border-default px-3 py-1.5 text-xs text-text-secondary hover:bg-surface-secondary"
          >
            {question}
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(SearchRelatedQuestions)
