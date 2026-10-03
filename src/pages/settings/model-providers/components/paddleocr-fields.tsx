import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { isPaddleOCRJobUrl, PADDLEOCR_ALGORITHMS } from './paddleocr-config'

interface PaddleOCRFieldsProps {
  modelName: string
  apiUrl: string
  accessToken: string
  algorithm: string
  onModelNameChange: (value: string) => void
  onApiUrlChange: (value: string) => void
  onAccessTokenChange: (value: string) => void
  onAlgorithmChange: (value: string) => void
}

export function PaddleOCRFields(props: PaddleOCRFieldsProps) {
  const { t } = useTranslation()
  const id = useId()
  const key = 'settings.models.paddleOCR'
  const endpoint = props.algorithm === 'PP-OCRv5' ? '/ocr' : '/layout-parsing'
  const isJob = isPaddleOCRJobUrl(props.apiUrl)
  return (
    <>
      <div className="space-y-space-sm">
        <Label htmlFor={`${id}-type`}>{t(`${key}.modelType`)}</Label>
        <Input id={`${id}-type`} value="OCR" disabled />
      </div>
      <div className="space-y-space-sm">
        <Label htmlFor={`${id}-name`}>{t(`${key}.modelName`)}</Label>
        <Input
          id={`${id}-name`}
          required
          value={props.modelName}
          onChange={(event) => props.onModelNameChange(event.target.value)}
          placeholder="paddleocr-from-env-1"
        />
      </div>
      <div className="space-y-space-sm">
        <Label htmlFor={`${id}-algorithm`}>{t(`${key}.algorithm`)}</Label>
        <Select value={props.algorithm} onValueChange={props.onAlgorithmChange}>
          <SelectTrigger
            id={`${id}-algorithm`}
            aria-describedby={`${id}-deployment`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PADDLEOCR_ALGORITHMS.map((algorithm) => (
              <SelectItem key={algorithm} value={algorithm}>
                {algorithm}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p id={`${id}-deployment`} className="text-xs text-text-tertiary">
          {t(`${key}.deploymentHint`)}
        </p>
      </div>
      <div className="space-y-space-sm">
        <Label htmlFor={`${id}-url`}>{t(`${key}.apiUrl`)}</Label>
        <Input
          id={`${id}-url`}
          type="url"
          required
          value={props.apiUrl}
          onChange={(event) => props.onApiUrlChange(event.target.value)}
          placeholder={`https://paddleocr-server.example${endpoint}`}
          aria-describedby={`${id}-url-hint`}
        />
        <p id={`${id}-url-hint`} className="text-xs text-text-tertiary">
          {t(`${key}.apiUrlHint`, { endpoint })}
        </p>
      </div>
      <div className="space-y-space-sm">
        <Label htmlFor={`${id}-token`}>
          {t(`${key}.${isJob ? 'accessTokenJob' : 'accessToken'}`)}
        </Label>
        <Input
          id={`${id}-token`}
          type="password"
          autoComplete="off"
          aria-required={isJob}
          value={props.accessToken}
          onChange={(event) => props.onAccessTokenChange(event.target.value)}
          placeholder={t(`${key}.tokenPlaceholder`)}
        />
      </div>
      <p className="text-xs text-text-tertiary">{t(`${key}.validationHint`)}</p>
    </>
  )
}
