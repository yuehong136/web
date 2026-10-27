import type { TFunction } from 'i18next'
import type { TranslationContracts } from './translation-contracts.generated'

export type TranslationScope = keyof TranslationContracts
export type TranslationKey<Scope extends TranslationScope> = Extract<
  keyof TranslationContracts[Scope],
  string
>
type TranslationArguments<Values> = Values extends undefined
  ? []
  : [values: Values]

/** Only string leaves and their declared interpolation values are exposed. */
export type TypedTranslate<Scope extends TranslationScope> = <
  Key extends TranslationKey<Scope>,
>(
  key: Key,
  ...args: TranslationArguments<TranslationContracts[Scope][Key]>
) => string

/** Bind the caller's instance so isolated widgets retain their own locale. */
export function createTypedTranslator<Scope extends TranslationScope>(
  scope: Scope,
  translate: TFunction,
): TypedTranslate<Scope> {
  return ((key: string, values?: Record<string, string | number>) =>
    translate(`${scope}.${key}`, values ?? {})) as TypedTranslate<Scope>
}
