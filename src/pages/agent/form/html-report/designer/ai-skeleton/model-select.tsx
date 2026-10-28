import {
  ModelSelect as SharedModelSelect,
  type ModelSelectProps,
} from '@/components/models/model-select'
import type { ModelOption } from '@/components/models/model-select-options'
import { ScopedTheme } from '@/themes/scoped-theme'

/** Keep the dropdown inside Designer's modal subtree for pointer and scroll access. */
export function ModelSelect(
  props: Omit<ModelSelectProps, 'options'> & { options: ModelOption[] },
) {
  return (
    <ScopedTheme>
      <SharedModelSelect {...props} />
    </ScopedTheme>
  )
}
