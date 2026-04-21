import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Operator } from '@/pages/agent/constant'
import useGraphStore from '@/pages/agent/store'
import { type PropsWithChildren, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { OperatorItemList } from './operator-item-list'

function OperatorAccordionTrigger({ children }: PropsWithChildren) {
  return (
    <AccordionTrigger className="text-xs text-text-secondary hover:no-underline items-center">
      <span className="h-4 translate-y-1"> {children}</span>
    </AccordionTrigger>
  )
}

export function AccordionOperators({
  isCustomDropdown = false,
  mousePosition,
  nodeId,
}: {
  isCustomDropdown?: boolean
  mousePosition?: { x: number; y: number }
  nodeId?: string
}) {
  const { t } = useTranslation()
  const { getOperatorTypeFromId, getParentIdById } = useGraphStore(
    (state) => state,
  )

  const exitLoopList = useMemo(() => {
    if (getOperatorTypeFromId(getParentIdById(nodeId)) === Operator.Loop) {
      return [Operator.ExitLoop]
    }
    return []
  }, [getOperatorTypeFromId, getParentIdById, nodeId])

  return (
    <Accordion
      type="multiple"
      className="max-h-[45vh] overflow-auto px-space-sm text-text-primary"
      defaultValue={['item-1', 'item-2', 'item-3', 'item-4', 'item-5']}
    >
      <AccordionItem value="item-1">
        <OperatorAccordionTrigger>
          {t('flow.foundation', '基础')}
        </OperatorAccordionTrigger>
        <AccordionContent className="flex flex-col gap-space-base text-text-primary">
          <OperatorItemList
            operators={[Operator.Agent, Operator.Retrieval]}
            isCustomDropdown={isCustomDropdown}
            mousePosition={mousePosition}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <OperatorAccordionTrigger>
          {t('flow.dialog', '对话')}
        </OperatorAccordionTrigger>
        <AccordionContent className="flex flex-col gap-space-base text-text-primary">
          <OperatorItemList
            operators={[Operator.Message, Operator.UserFillUp]}
            isCustomDropdown={isCustomDropdown}
            mousePosition={mousePosition}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <OperatorAccordionTrigger>
          {t('flow.flow', '流程控制')}
        </OperatorAccordionTrigger>
        <AccordionContent className="flex flex-col gap-space-base text-text-primary">
          <OperatorItemList
            operators={[
              Operator.Switch,
              Operator.Iteration,
              Operator.Loop,
              ...exitLoopList,
              Operator.Categorize,
            ]}
            isCustomDropdown={isCustomDropdown}
            mousePosition={mousePosition}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <OperatorAccordionTrigger>
          {t('flow.dataManipulation', '数据操作')}
        </OperatorAccordionTrigger>
        <AccordionContent className="flex flex-col gap-space-base text-text-primary">
          <OperatorItemList
            operators={[
              Operator.Code,
              Operator.StringTransform,
              Operator.DataOperations,
              Operator.VariableAssigner,
              Operator.ListOperations,
              Operator.VariableAggregator,
            ]}
            isCustomDropdown={isCustomDropdown}
            mousePosition={mousePosition}
          />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <OperatorAccordionTrigger>
          {t('flow.tools', '工具')}
        </OperatorAccordionTrigger>
        <AccordionContent className="flex flex-col gap-space-base text-text-primary">
          <OperatorItemList
            operators={[
              Operator.TavilySearch,
              Operator.TavilyExtract,
              Operator.ExeSQL,
              Operator.Google,
              Operator.YahooFinance,
              Operator.Email,
              Operator.DuckDuckGo,
              Operator.Wikipedia,
              Operator.GoogleScholar,
              Operator.ArXiv,
              Operator.PubMed,
              Operator.GitHub,
              Operator.Invoke,
              Operator.WenCai,
              Operator.SearXNG,
              Operator.PDFGenerator,
            ]}
            isCustomDropdown={isCustomDropdown}
            mousePosition={mousePosition}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

// 限制画布上某种操作符类型的数量只能为一个
function useRestrictSingleOperatorOnCanvas() {
  const { findNodeByName } = useGraphStore((state) => state)

  const restrictSingleOperatorOnCanvas = useCallback(
    (singleOperators: Operator[]) => {
      const list: Operator[] = []
      singleOperators.forEach((operator) => {
        if (!findNodeByName(operator)) {
          list.push(operator)
        }
      })
      return list
    },
    [findNodeByName],
  )

  return restrictSingleOperatorOnCanvas
}

export function PipelineAccordionOperators({
  isCustomDropdown = false,
  mousePosition,
  nodeId,
}: {
  isCustomDropdown?: boolean
  mousePosition?: { x: number; y: number }
  nodeId?: string
}) {
  const restrictSingleOperatorOnCanvas = useRestrictSingleOperatorOnCanvas()
  const { getOperatorTypeFromId } = useGraphStore((state) => state)
  const { t } = useTranslation()

  const operators = useMemo(() => {
    const list = [
      ...restrictSingleOperatorOnCanvas([Operator.Parser, Operator.Tokenizer]),
    ]
    list.push(Operator.Extractor)
    return list
  }, [restrictSingleOperatorOnCanvas])

  const chunkerOperators = useMemo(() => {
    return [
      ...restrictSingleOperatorOnCanvas([
        Operator.Splitter,
        Operator.HierarchicalMerger,
      ]),
    ]
  }, [restrictSingleOperatorOnCanvas])

  const showChunker = useMemo(() => {
    return (
      getOperatorTypeFromId(nodeId) !== Operator.Extractor &&
      chunkerOperators.length > 0
    )
  }, [chunkerOperators.length, getOperatorTypeFromId, nodeId])

  return (
    <>
      <OperatorItemList
        operators={operators}
        isCustomDropdown={isCustomDropdown}
        mousePosition={mousePosition}
      />
      {showChunker && (
        <Accordion
          type="single"
          collapsible
          className="w-full px-space-base"
          defaultValue="item-1"
        >
          <AccordionItem value="item-1">
            <AccordionTrigger className="translate-y-2 hover:no-underline text-text-primary font-normal">
              {t('flow.chunker', 'Chunker')}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-space-base">
              <OperatorItemList
                operators={chunkerOperators}
                isCustomDropdown={isCustomDropdown}
                mousePosition={mousePosition}
              />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  )
}
