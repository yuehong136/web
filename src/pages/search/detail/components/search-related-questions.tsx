import React, { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { CornerDownRight } from 'lucide-react'

interface SearchRelatedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

const SearchRelatedQuestions: React.FC<SearchRelatedQuestionsProps> = ({
  questions,
  onSelect,
}) => {
  const { t } = useTranslation()
  if (!questions.length) return null

  return (
    <div className="pt-space-xs">
      <h4 className="text-base font-semibold text-text-primary">
        {t('searchPage.workspace.related')}
      </h4>
      <div className="mt-space-xs border-t border-border-default">
        {questions.map((question, index) => (
          <button
            key={question}
            type="button"
            onClick={() => onSelect(question)}
            className={`flex w-full items-center gap-space-sm px-space-xs py-space-sm text-left transition-colors hover:bg-surface-secondary ${
              index === questions.length - 1
                ? ''
                : 'border-b border-border-default'
            }`}
          >
            <CornerDownRight className="h-4 w-4 shrink-0 text-text-tertiary" />
            <span className="text-lg leading-7 font-medium text-text-primary">
              {question}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default memo(SearchRelatedQuestions)
