import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Braces } from 'lucide-react'
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { JsonSchemaDataType, TypesWithArray } from '../../constant'
import {
  type CodeOutputContract,
  type CodeOutputMap,
  deserializeCodeOutputContract,
  isValidCodeOutputName,
  serializeCodeOutputContract,
} from '../../utils/code-outputs'
import { SectionHeader } from './section-header'

const codeOutputTypeOptions = [
  JsonSchemaDataType.String,
  JsonSchemaDataType.Number,
  JsonSchemaDataType.Boolean,
  JsonSchemaDataType.Object,
  JsonSchemaDataType.Array,
  TypesWithArray.ArrayString,
  TypesWithArray.ArrayNumber,
  TypesWithArray.ArrayBoolean,
  TypesWithArray.ArrayObject,
]

function useReturnValueDraft(contract: CodeOutputContract) {
  const [draft, setDraft] = useState(contract)

  useEffect(() => {
    setDraft(contract)
  }, [contract])

  return [draft, setDraft] as const
}

interface ReturnValueEditorProps {
  outputs?: CodeOutputMap
  onChange: (outputs: CodeOutputMap) => void
}

export function ReturnValueEditor({
  outputs,
  onChange,
}: ReturnValueEditorProps) {
  const { t } = useTranslation()
  const { contract } = useMemo(
    () => deserializeCodeOutputContract({ outputs }),
    [outputs],
  )
  const [draft, setDraft] = useReturnValueDraft(contract)
  const outputNameId = useId()
  const outputTypeId = useId()
  const isNameValid = isValidCodeOutputName(draft.name)

  const commit = useCallback(
    (nextContract: CodeOutputContract) => {
      if (!isValidCodeOutputName(nextContract.name)) {
        return
      }

      onChange(serializeCodeOutputContract(nextContract))
    },
    [onChange],
  )

  const handleNameChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = {
        ...draft,
        name: event.target.value,
      }

      setDraft(next)
      commit(next)
    },
    [commit, draft, setDraft],
  )

  const handleTypeChange = useCallback(
    (type: string) => {
      const next = {
        ...draft,
        type,
      }

      setDraft(next)
      commit(next)
    },
    [commit, draft, setDraft],
  )

  return (
    <section className="space-y-space-base pt-space-md border-t border-border-subtle">
      <SectionHeader
        icon={<Braces className="size-icon-sm" />}
        title={t('flow.codeReturnValue', 'Return value')}
        description={t(
          'flow.codeReturnValueTip',
          'Expose one business output from main(). System outputs stay available for logs and diagnostics.',
        )}
        badge={
          <Badge variant="blue">
            {t('flow.codeSingleOutputBadge', 'Single output')}
          </Badge>
        }
      />

      <div className="gap-space-base grid sm:grid-cols-[minmax(0,1fr)_11rem]">
        <div className="space-y-space-xs">
          <div className="text-sm text-text-secondary">
            {t('flow.outputName', 'Output name')}
          </div>
          <Input
            id={outputNameId}
            aria-label={t('flow.outputName', 'Output name')}
            value={draft.name}
            inputSize="sm"
            onChange={handleNameChange}
            error={
              isNameValid
                ? undefined
                : t(
                    'flow.codeInvalidOutputName',
                    'Use a non-empty name without dots or reserved system keys.',
                  )
            }
          />
        </div>

        <div className="space-y-space-xs">
          <div className="text-sm text-text-secondary">
            {t('flow.outputType', 'Type')}
          </div>
          <Select value={draft.type} onValueChange={handleTypeChange}>
            <SelectTrigger
              id={outputTypeId}
              aria-label={t('flow.outputType', 'Type')}
              className="h-10"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {codeOutputTypeOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <p className="rounded-radius-md bg-surface-secondary px-space-sm py-space-xs border border-border-subtle text-xs leading-5 text-text-secondary">
        {t(
          'flow.codeReturnTypeContractHint',
          'The value returned by main() must match {{type}}. Use the template selector above to switch both code and output type together.',
          { type: draft.type },
        )}
      </p>
    </section>
  )
}
