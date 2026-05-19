import type { TFunction } from 'i18next'
import { MetadataManageType } from '@/types/api'

export interface DeleteTextConfig {
  fieldTitle: string
  fieldWarn: string
  valueTitle: string
  valueWarn: string
}

export function getDeleteTextConfig(
  mode: MetadataManageType,
  t: TFunction,
): DeleteTextConfig {
  const isGlobalMode =
    mode === MetadataManageType.MANAGE || mode === MetadataManageType.SETTING

  if (isGlobalMode) {
    return {
      fieldTitle: t('knowledge.metadata.delete.fieldTitle'),
      fieldWarn: t('knowledge.metadata.delete.globalFieldWarn'),
      valueTitle: t('knowledge.metadata.delete.valueTitle'),
      valueWarn: t('knowledge.metadata.delete.globalValueWarn'),
    }
  }

  return {
    fieldTitle: t('knowledge.metadata.delete.fieldTitle'),
    fieldWarn: t('knowledge.metadata.delete.singleFieldWarn'),
    valueTitle: t('knowledge.metadata.delete.valueTitle'),
    valueWarn: t('knowledge.metadata.delete.singleValueWarn'),
  }
}

export interface ModalCopy {
  title: string
  subtitle: string
}

export function getModalConfig(
  mode: MetadataManageType,
  t: TFunction,
): ModalCopy {
  switch (mode) {
    case MetadataManageType.MANAGE:
      return {
        title: t('knowledge.metadata.modal.manageTitle'),
        subtitle: t('knowledge.metadata.modal.manageSubtitle'),
      }
    case MetadataManageType.SETTING:
      return {
        title: t('knowledge.metadata.modal.settingTitle'),
        subtitle: t('knowledge.metadata.modal.settingSubtitle'),
      }
    case MetadataManageType.SINGLE_FILE_SETTING:
      return {
        title: t('knowledge.metadata.modal.singleFileSettingTitle'),
        subtitle: t('knowledge.metadata.modal.singleFileSettingSubtitle'),
      }
    case MetadataManageType.UPDATE_SINGLE:
      return {
        title: t('knowledge.metadata.modal.updateSingleTitle'),
        subtitle: t('knowledge.metadata.modal.updateSingleSubtitle'),
      }
    default:
      return {
        title: t('knowledge.metadata.modal.fallbackTitle'),
        subtitle: '',
      }
  }
}

export interface EditorCopy {
  title: string
  description: string
}

export function getEditorCopy(options: {
  isNew: boolean
  isSettingMode: boolean
  t: TFunction
}): EditorCopy {
  const { isNew, isSettingMode, t } = options
  const title = isNew
    ? isSettingMode
      ? t('knowledge.metadata.editor.addField')
      : t('knowledge.metadata.editor.addMetadata')
    : isSettingMode
      ? t('knowledge.metadata.editor.editField')
      : t('knowledge.metadata.editor.editMetadata')

  const description = isSettingMode
    ? t('knowledge.metadata.editor.settingDescription')
    : t('knowledge.metadata.editor.valueDescription')

  return { title, description }
}

export function isSettingMode(mode: MetadataManageType): boolean {
  return (
    mode === MetadataManageType.SETTING ||
    mode === MetadataManageType.SINGLE_FILE_SETTING
  )
}

export function isGlobalManageMode(mode: MetadataManageType): boolean {
  return mode === MetadataManageType.MANAGE
}

export function isSingleFileSettingMode(mode: MetadataManageType): boolean {
  return mode === MetadataManageType.SINGLE_FILE_SETTING
}
