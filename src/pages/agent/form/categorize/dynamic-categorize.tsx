import { humanId } from 'human-id'
import trim from 'lodash/trim.js'
import { ChevronsUpDown, Plus, Trash2 } from 'lucide-react'
import {
  type ChangeEventHandler,
  type FocusEventHandler,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  type FieldPath,
  type UseFormReturn,
  useFieldArray,
  useFormContext,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { v4 as uuid } from 'uuid'
import { useUpdateNodeInternals } from '@xyflow/react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input, type InputProps } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import useGraphStore from '../../store'
import { DynamicStringForm } from '../components'
import type { CategorizeFormValues } from './use-form-schema'

interface DynamicCategorizeProps {
  nodeId?: string
}

interface NameInputProps {
  value?: string
  otherNames?: string[]
  onChange?: (value: string) => void
  validate(error?: string): void
}

function getOtherFieldValues(
  form: UseFormReturn<CategorizeFormValues>,
  index: number,
) {
  return (form.getValues('items') || [])
    .map((item) => item?.name)
    .filter((name) => name !== form.getValues(`items.${index}.name`))
    .filter((name): name is string => typeof name === 'string')
}

const InnerNameInput = forwardRef<HTMLInputElement, InputProps & NameInputProps>(
  function InnerNameInput(
    { value, onChange, otherNames, validate, ...props },
    ref,
  ) {
    const { t } = useTranslation()
    const [name, setName] = useState<string | undefined>(value)

    const handleNameChange: ChangeEventHandler<HTMLInputElement> = useCallback(
      (event) => {
        const nextValue = event.target.value
        const trimmedValue = trim(nextValue)
        setName(nextValue)

        if (trimmedValue === '') {
          validate(t('flow.nameRequiredMsg', 'Name is required'))
          return
        }

        if (otherNames?.some((item) => item === trimmedValue)) {
          validate(t('flow.nameRepeatedMsg', 'Name already exists'))
          return
        }

        validate('')
      },
      [otherNames, t, validate],
    )

    const handleNameBlur: FocusEventHandler<HTMLInputElement> = useCallback(
      (event) => {
        const trimmedValue = trim(event.target.value)
        setName(trimmedValue)

        if (
          trimmedValue &&
          otherNames?.every((item) => item !== trimmedValue) !== false
        ) {
          onChange?.(trimmedValue)
        }
      },
      [onChange, otherNames],
    )

    useEffect(() => {
      setName(value)
    }, [value])

    return (
      <Input
        {...props}
        ref={ref}
        value={name ?? ''}
        onChange={handleNameChange}
        onBlur={handleNameBlur}
      />
    )
  },
)

const NameInput = memo(InnerNameInput)

function CategorizeItemFields({ index }: { index: number }) {
  const { t } = useTranslation()
  const form = useFormContext<CategorizeFormValues>()

  const buildFieldName = useCallback(
    <TName extends 'name' | 'description' | 'uuid' | 'examples'>(
      name: TName,
    ) => `items.${index}.${name}` as FieldPath<CategorizeFormValues>,
    [index],
  )

  return (
    <section className="space-y-space-base">
      <FormField
        control={form.control}
        name={buildFieldName('name')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('flow.categoryName', 'Category name')}</FormLabel>
            <FormControl>
              <NameInput
                {...field}
                value={typeof field.value === 'string' ? field.value : ''}
                otherNames={getOtherFieldValues(form, index)}
                validate={(error) => {
                  const fieldName = buildFieldName('name')
                  if (error) {
                    form.setError(fieldName, { message: error })
                  } else {
                    form.clearErrors(fieldName)
                  }
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name={buildFieldName('description')}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{t('common.description', 'Description')}</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                value={typeof field.value === 'string' ? field.value : ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <input type="hidden" {...form.register(buildFieldName('uuid'))} />

      <DynamicStringForm
        name={buildFieldName('examples')}
        label={t('flow.examples', 'Examples')}
      />
    </section>
  )
}

const MemoizedCategorizeItemFields = memo(CategorizeItemFields)

function InnerDynamicCategorize({ nodeId }: DynamicCategorizeProps) {
  const { t } = useTranslation()
  const updateNodeInternals = useUpdateNodeInternals()
  const deleteEdgesBySourceAndSourceHandle = useGraphStore(
    (state) => state.deleteEdgesBySourceAndSourceHandle,
  )
  const form = useFormContext<CategorizeFormValues>()

  const { fields, append, remove } = useFieldArray({
    name: 'items',
    control: form.control,
  })

  const handleAdd = useCallback(() => {
    append({
      name: humanId(),
      description: '',
      examples: [{ value: '' }],
      uuid: uuid(),
    })

    if (nodeId) {
      updateNodeInternals(nodeId)
    }
  }, [append, nodeId, updateNodeInternals])

  const handleRemove = useCallback(
    (index: number) => () => {
      const handleId = fields[index]?.uuid || `cat-${index}`

      remove(index)

      if (nodeId) {
        deleteEdgesBySourceAndSourceHandle(nodeId, handleId)
        updateNodeInternals(nodeId)
      }
    },
    [deleteEdgesBySourceAndSourceHandle, fields, nodeId, remove, updateNodeInternals],
  )

  return (
    <section className="space-y-space-base">
      {fields.map((field, index) => (
        <div key={field.id}>
          <Collapsible defaultOpen>
            <div className="flex items-center justify-between gap-space-sm pb-space-sm">
              <span className="text-sm font-medium text-text-primary">
                {form.watch(`items.${index}.name`) ||
                  `${t('flow.categoryName', 'Category')} ${index + 1}`}
              </span>
              <div className="flex items-center gap-space-xs">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemove(index)}
                >
                  <Trash2 className="size-4" />
                </Button>
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="icon">
                    <ChevronsUpDown className="size-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            <CollapsibleContent>
              <MemoizedCategorizeItemFields index={index} />
            </CollapsibleContent>
          </Collapsible>
          <Separator className="mt-space-base" />
        </div>
      ))}

      <Button type="button" onClick={handleAdd}>
        <Plus className="size-4" />
        {t('flow.addCategory', 'Add Category')}
      </Button>
    </section>
  )
}

export const DynamicCategorize = memo(InnerDynamicCategorize)
