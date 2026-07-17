import { ProgrammingLanguage } from '../../constant'
import { CodeTemplateId } from '../../utils/code-templates'

export type CodeTemplateIdValue =
  (typeof CodeTemplateId)[keyof typeof CodeTemplateId]

export type ProgrammingLanguageValue =
  (typeof ProgrammingLanguage)[keyof typeof ProgrammingLanguage]
