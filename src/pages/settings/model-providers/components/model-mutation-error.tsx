import { useTranslation } from 'react-i18next'
import { modelDeletionReferences } from '@/api/llm-reference-error'

export function ModelMutationError({ error }: { error: unknown }) {
  const { t } = useTranslation()
  const references = modelDeletionReferences(error)
  return (
    <div
      role="alert"
      className="block space-y-space-sm text-sm text-status-error"
    >
      <span className="block">
        {references
          ? t('settings.models.deletion.blocked', { count: references.length })
          : t('settings.models.instances.failed')}
      </span>
      {references && (
        <>
          <section
            aria-label={t('settings.models.deletion.referenceList')}
            className="block max-h-64 space-y-space-sm overflow-y-auto overscroll-contain"
          >
            <ul className="space-y-space-sm">
              {references.map((reference, index) => (
                <li
                  key={index}
                  className="block rounded-radius-md border border-border-default p-space-sm break-words text-text-primary"
                >
                  <span className="block font-medium">
                    {t(
                      `settings.models.deletion.types.${reference.resource_type}`,
                    )}
                    {reference.is_deleted &&
                      t('settings.models.deletion.deleted')}
                  </span>
                  {reference.resource_name && (
                    <span className="block">{reference.resource_name}</span>
                  )}
                  {reference.resource_id && (
                    <span className="block text-xs text-text-secondary">
                      {t('settings.models.deletion.resourceId', {
                        id: reference.resource_id,
                      })}
                    </span>
                  )}
                  <span className="block text-text-secondary">
                    {t('settings.models.deletion.models', {
                      models: reference.model_names.join(', '),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <span className="block text-text-secondary">
            {t('settings.models.deletion.resolve')}
          </span>
        </>
      )}
    </div>
  )
}
