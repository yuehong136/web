import React from 'react'
import { useDropzone } from 'react-dropzone'
import { useTranslation } from 'react-i18next'
import { FileText, FileUp, PenLine, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { formatBytes } from '@/lib/utils'

export type UserInputMode = 'manual' | 'file'

export interface UploadedFile {
  id: string
  name: string
  size: number
  content?: string
}

interface UserInputSectionProps {
  userInputMode: UserInputMode
  setUserInputMode: (mode: UserInputMode) => void
  userInput: string
  onUserInputChange: (value: string) => void
  uploadedFiles: UploadedFile[]
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>
}

const TEXT_TYPES = {
  'text/plain': ['.txt'],
  'application/json': ['.json'],
  'text/csv': ['.csv'],
  'text/markdown': ['.md'],
}

/**
 * "Additional information" in the settings dialog: typed text or local text
 * files. Both are sent with the AI fill request; the state stays in
 * DataInput so closing the dialog keeps it.
 */
export const UserInputSection: React.FC<UserInputSectionProps> = ({
  userInputMode,
  setUserInputMode,
  userInput,
  onUserInputChange,
  uploadedFiles,
  setUploadedFiles,
}) => {
  const { t } = useTranslation()
  const inputId = React.useId()
  const { getRootProps, getInputProps, open } = useDropzone({
    accept: TEXT_TYPES,
    multiple: true,
    noClick: true,
    noKeyboard: true,
    onDropAccepted: (files) =>
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (event) =>
          setUploadedFiles((previous) => [
            ...previous,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2)}`,
              name: file.name,
              size: file.size,
              content: event.target?.result as string,
            },
          ])
        reader.readAsText(file)
      }),
  })

  return (
    <div className="flex flex-col gap-space-sm">
      <div className="flex flex-wrap items-center justify-between gap-space-sm">
        <label
          htmlFor={userInputMode === 'manual' ? inputId : undefined}
          className="text-sm font-medium text-text-primary"
        >
          {t('aiTools.autoFill.settings.userInput')}
        </label>
        <SegmentedControl
          size="sm"
          aria-label={t('aiTools.autoFill.settings.inputMode')}
          value={userInputMode}
          onValueChange={setUserInputMode}
          options={[
            {
              value: 'manual',
              label: t('aiTools.autoFill.settings.modes.manual'),
              icon: <PenLine aria-hidden="true" />,
            },
            {
              value: 'file',
              label: t('aiTools.autoFill.settings.modes.file'),
              icon: <FileUp aria-hidden="true" />,
            },
          ]}
        />
      </div>

      {userInputMode === 'manual' ? (
        <Textarea
          id={inputId}
          className="min-h-24 resize-none"
          value={userInput}
          onChange={(event) => onUserInputChange(event.target.value)}
          placeholder={t('aiTools.autoFill.settings.manualPlaceholder')}
        />
      ) : (
        <div className="flex flex-col gap-space-sm">
          <div
            {...getRootProps({
              className:
                'flex flex-col items-center gap-space-sm rounded-radius-lg border border-dashed border-components-upload-border bg-components-upload-bg px-space-base py-space-lg text-center',
            })}
          >
            <input {...getInputProps()} />
            <Button type="button" variant="outline" size="sm" onClick={open}>
              <FileUp aria-hidden="true" />
              {t('aiTools.autoFill.settings.upload')}
            </Button>
            <p className="text-xs text-text-tertiary">
              {t('aiTools.autoFill.settings.uploadHint')}
            </p>
          </div>
          {uploadedFiles.length > 0 ? (
            <div className="flex flex-col gap-space-xs">
              <p className="text-xs text-text-secondary">
                {t('aiTools.autoFill.settings.attached', {
                  count: uploadedFiles.length,
                })}
              </p>
              <ul className="flex max-h-32 flex-col gap-space-2xs overflow-auto">
                {uploadedFiles.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center gap-space-sm rounded-radius-md bg-background-subtle px-space-sm py-space-2xs"
                  >
                    <FileText
                      className="size-icon-sm shrink-0 text-text-tertiary"
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {file.name}
                    </span>
                    <span className="shrink-0 text-xs text-text-tertiary tabular-nums">
                      {formatBytes(file.size, 1)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('aiTools.autoFill.settings.removeFile', {
                        name: file.name,
                      })}
                      onClick={() =>
                        setUploadedFiles((previous) =>
                          previous.filter((item) => item.id !== file.id),
                        )
                      }
                    >
                      <X aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
