import { useTranslation } from 'react-i18next'
import { FormWrapper } from '../../components'

function CodeToolForm() {
  const { t } = useTranslation()

  return (
    <FormWrapper>
      <div className="rounded-radius-md border border-border-default bg-surface-secondary/40 p-space-base text-sm text-text-secondary">
        {t('flow.toolNoConfig', "It doesn't have any config.")}
      </div>
    </FormWrapper>
  )
}

export default CodeToolForm
