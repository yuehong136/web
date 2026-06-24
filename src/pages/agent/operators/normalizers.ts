import { Operator, type Operator as OperatorType } from '../constant'
import {
  normalizeExtractorFormForStore,
  serializeExtractorFormForDsl,
} from '../form/extractor/utils'
import {
  normalizeInvokeFormForStore,
  serializeInvokeFormForDsl,
} from '../form/invoke/utils'
import {
  normalizeIterationOutputItems,
  buildIterationOutputs,
} from '../form/iteration/utils'
import {
  normalizeParserFormForStore,
  serializeParserFormForDsl,
} from '../form/parser/utils'
import {
  normalizeRetrievalFormForStore,
  serializeRetrievalFormForDsl,
} from '../form/retrieval/utils'
import {
  normalizeTitleChunkerFormForStore,
  serializeTitleChunkerFormForDsl,
} from '../form/title-chunker/utils'
import {
  normalizeTokenChunkerFormForStore,
  serializeTokenChunkerFormForDsl,
} from '../form/token-chunker/utils'
import {
  buildVariableAggregatorOutputs,
  normalizeVariableAggregatorGroups,
} from '../form/variable-aggregator/utils'
import { normalizeVariableReference } from '../form/components/query-variable-utils'
import type { QueryVariableOptionGroup } from '../form/components/query-variable-utils'

type FormRecord = Record<string, unknown>

function normalizeIterationFormForStore(form: FormRecord = {}) {
  return {
    ...form,
    items_ref: normalizeVariableReference(form.items_ref as string | undefined),
    output_items: normalizeIterationOutputItems(
      form.output_items || form.outputs,
    ),
    outputs:
      form.outputs && typeof form.outputs === 'object' ? form.outputs : {},
  }
}

function serializeIterationFormForDsl(form: FormRecord = {}) {
  const outputItems = normalizeIterationOutputItems(
    form.output_items || form.outputs,
  )
  const rest = { ...form }
  delete rest.output_items

  return {
    ...rest,
    items_ref: normalizeVariableReference(form.items_ref as string | undefined),
    outputs: buildIterationOutputs(outputItems),
  }
}

function normalizeVariableAggregatorFormForStore(form: FormRecord = {}) {
  return {
    ...form,
    groups: normalizeVariableAggregatorGroups(form.groups),
  }
}

function serializeVariableAggregatorFormForDsl(form: FormRecord = {}) {
  return {
    ...form,
    groups: normalizeVariableAggregatorGroups(form.groups),
  }
}

function normalizeSwitchFormForStore(form: FormRecord = {}) {
  const conditions = Array.isArray(form.conditions)
    ? form.conditions.map((condition) => {
        if (!condition || typeof condition !== 'object') {
          return condition
        }

        return {
          ...condition,
          items: Array.isArray((condition as { items?: unknown[] }).items)
            ? (condition as { items: unknown[] }).items.map((item) => {
                if (!item || typeof item !== 'object') {
                  return item
                }

                return {
                  ...item,
                  cpn_id: normalizeVariableReference(
                    (item as { cpn_id?: string }).cpn_id,
                  ),
                }
              })
            : [],
        }
      })
    : []

  return {
    ...form,
    conditions,
  }
}

function normalizeStringTransformFormForStore(form: FormRecord = {}) {
  return {
    ...form,
    split_ref: normalizeVariableReference(form.split_ref as string | undefined),
  }
}

function normalizeListOperationsFormForStore(form: FormRecord = {}) {
  return {
    ...form,
    query: normalizeVariableReference(form.query as string | undefined),
  }
}

const storeNormalizers: Partial<
  Record<OperatorType, (form?: FormRecord) => FormRecord>
> = {
  [Operator.Retrieval]: normalizeRetrievalFormForStore,
  [Operator.Iteration]: normalizeIterationFormForStore,
  [Operator.Invoke]: normalizeInvokeFormForStore,
  [Operator.VariableAggregator]: normalizeVariableAggregatorFormForStore,
  [Operator.Parser]: normalizeParserFormForStore,
  [Operator.TokenChunker]: normalizeTokenChunkerFormForStore,
  [Operator.TitleChunker]: normalizeTitleChunkerFormForStore,
  [Operator.Extractor]: normalizeExtractorFormForStore,
  [Operator.Switch]: normalizeSwitchFormForStore,
  [Operator.StringTransform]: normalizeStringTransformFormForStore,
  [Operator.ListOperations]: normalizeListOperationsFormForStore,
}

const dslNormalizers: Partial<
  Record<OperatorType, (form?: FormRecord) => FormRecord>
> = {
  [Operator.Retrieval]: serializeRetrievalFormForDsl,
  [Operator.Iteration]: serializeIterationFormForDsl,
  [Operator.Invoke]: serializeInvokeFormForDsl,
  [Operator.VariableAggregator]: serializeVariableAggregatorFormForDsl,
  [Operator.Parser]: serializeParserFormForDsl,
  [Operator.TokenChunker]: serializeTokenChunkerFormForDsl,
  [Operator.TitleChunker]: serializeTitleChunkerFormForDsl,
  [Operator.Extractor]: serializeExtractorFormForDsl,
}

export function normalizeOperatorFormForStore(
  operator: OperatorType,
  form?: FormRecord,
) {
  return (storeNormalizers[operator] || ((value?: FormRecord) => value || {}))(
    form,
  )
}

export function normalizeOperatorFormForDsl(
  operator: OperatorType,
  form?: FormRecord,
) {
  return (dslNormalizers[operator] || ((value?: FormRecord) => value || {}))(
    form,
  )
}

export function buildVariableAggregatorOutputsForStore(
  form: FormRecord,
  optionGroups: QueryVariableOptionGroup[],
) {
  return buildVariableAggregatorOutputs(
    normalizeVariableAggregatorGroups(form.groups),
    optionGroups,
  )
}
