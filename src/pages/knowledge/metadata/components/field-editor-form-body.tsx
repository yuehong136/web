import React from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  TooltipRoot as Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { UseFieldEditorFormReturn } from '../hooks/use-field-editor-form'
import { ValueInputItem } from './value-input-item'

interface FieldEditorFormBodyProps {
  form: UseFieldEditorFormReturn
  isNew: boolean
  isSettingMode: boolean
  loading?: boolean
}

export const FieldEditorFormBody: React.FC<FieldEditorFormBodyProps> = ({
  form,
  isNew,
  isSettingMode,
  loading = false,
}) => {
  const { t } = useTranslation()
  const { formData, tempValues, errors, handlers } = form
  const showValuesList = !isSettingMode || formData.restrictDefinedValues

  return (
    <div className="max-h-[50vh] space-y-5 overflow-y-auto px-6 py-4">
      {!isNew && !isSettingMode && (
        <div className="bg-surface-secondary rounded-lg border border-border-default p-4">
          <span className="text-base font-medium text-text-primary">
            {formData.field}
          </span>
        </div>
      )}

      {(isNew || isSettingMode) && (
        <div className="space-y-2">
          <Label className="text-sm font-medium text-text-primary">
            {t('knowledge.metadata.editor.fieldName')}
          </Label>
          <Input
            value={formData.field}
            onChange={(e) => handlers.fieldChange(e.target.value)}
            placeholder={t('knowledge.metadata.editor.fieldNamePlaceholder')}
            disabled={loading}
          />
          {errors.field && (
            <p className="text-status-error text-xs">{errors.field}</p>
          )}
        </div>
      )}

      {isSettingMode && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium text-text-primary">
              {t('knowledge.metadata.editor.description')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 cursor-help text-text-tertiary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">
                    {t('knowledge.metadata.editor.descriptionTooltip')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Textarea
            value={formData.description}
            onChange={(e) => handlers.descriptionChange(e.target.value)}
            placeholder={t('knowledge.metadata.editor.descriptionPlaceholder')}
            rows={2}
            disabled={loading}
          />
        </div>
      )}

      {isSettingMode && (
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5">
            <Label className="text-sm font-medium text-text-primary">
              {t('knowledge.metadata.editor.restrictDefinedValues')}
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 cursor-help text-text-tertiary" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-[200px] text-xs">
                    {t(
                      'knowledge.metadata.editor.restrictDefinedValuesTooltip',
                    )}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            checked={formData.restrictDefinedValues}
            onCheckedChange={handlers.restrictChange}
            disabled={loading}
          />
        </div>
      )}

      {showValuesList && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-text-primary">
              {isSettingMode
                ? t('knowledge.metadata.editor.optionalValues')
                : t('knowledge.metadata.editor.values')}
            </Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handlers.addValue}
              disabled={loading}
              className="h-7 px-2 text-text-secondary hover:text-text-primary"
            >
              <Plus className="mr-1 h-4 w-4" />
              {t('knowledge.metadata.editor.add')}
            </Button>
          </div>

          <div className="space-y-2">
            {tempValues.length === 0 ? (
              <div className="py-4 text-center text-sm text-text-tertiary">
                {t('knowledge.metadata.editor.emptyValues')}
              </div>
            ) : (
              tempValues.map((value, index) => (
                <ValueInputItem
                  key={index}
                  value={value}
                  index={index}
                  placeholder={t('knowledge.metadata.editor.valuePlaceholder')}
                  disabled={loading}
                  onChange={handlers.valueChange}
                  onDelete={handlers.deleteValue}
                  onBlur={handlers.valueBlur}
                />
              ))
            )}
          </div>

          {errors.values && (
            <p className="text-status-error text-xs">{errors.values}</p>
          )}
        </div>
      )}
    </div>
  )
}
