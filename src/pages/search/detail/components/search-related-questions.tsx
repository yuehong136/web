import React, { memo, useId } from 'react'
import { useTranslation } from 'react-i18next'
import { CornerDownRight, Plus } from 'lucide-react'

interface SearchRelatedQuestionsProps {
  questions: string[]
  onSelect: (question: string) => void
}

/** Follow-up questions as hairline rows; choosing one asks it as a new round. */
const SearchRelatedQuestions: React.FC<SearchRelatedQuestionsProps> = ({
  questions,
  onSelect,
}) => {
  const { t } = useTranslation()
  const headingId = useId()
  if (!questions.length) return null

  return (
    <section aria-labelledby={headingId} className="pt-space-xs">
      <h4
        id={headingId}
        className="flex items-center gap-space-xs text-sm font-semibold text-fg"
      >
        <CornerDownRight
          className="size-icon-sm text-fg-subtle"
          aria-hidden="true"
        />
        {t('searchPage.workspace.related')}
      </h4>
      <ul className="mt-space-xs divide-y divide-line-subtle border-y border-line-subtle">
        {questions.map((question) => (
          <li key={question}>
            <button
              type="button"
              onClick={() => onSelect(question)}
              className="group flex w-full items-center gap-space-sm rounded-radius-md px-space-xs py-space-sm text-left text-sm leading-relaxed text-fg outline-hidden transition-colors hover:bg-fill-hover focus-visible:ring-2 focus-visible:ring-line-focus motion-reduce:transition-none"
            >
              <span className="min-w-0 flex-1">{question}</span>
              <Plus
                className="size-icon-sm shrink-0 text-fg-subtle group-hover:text-accent-fg"
                aria-hidden="true"
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default memo(SearchRelatedQuestions)
