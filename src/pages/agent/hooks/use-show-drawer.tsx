import get from 'lodash/get'
import React, { useCallback, useEffect, useState } from 'react'
import { Operator } from '../constant'
import useGraphStore from '../store'

function useSetModalState() {
  const [visible, setVisible] = useState(false)

  const showModal = useCallback(() => setVisible(true), [])
  const hideModal = useCallback(() => setVisible(false), [])

  return { visible, showModal, hideModal }
}

const useShowFormDrawer = () => {
  const {
    clickedNodeId: clickNodeId,
    setClickedNodeId,
    getNode,
    setClickedToolId,
    getOperatorTypeFromId,
  } = useGraphStore((state) => state)
  const {
    visible: formDrawerVisible,
    hideModal: hideFormDrawer,
    showModal: showFormDrawer,
  } = useSetModalState()

  const handleShow = useCallback(
    (e: React.MouseEvent<Element>, nodeId: string) => {
      const target = e.target as HTMLElement
      const toolId =
        target.dataset.toolId || target.parentElement?.dataset.toolId
      const tool = target.dataset.tool || target.parentElement?.dataset.tool

      const operatorType = getOperatorTypeFromId(nodeId)
      if (
        (operatorType === Operator.Tool && !tool) ||
        operatorType === Operator.LoopStart ||
        operatorType === Operator.ExitLoop
      ) {
        return
      }
      setClickedNodeId(nodeId)
      setClickedToolId(toolId || tool)
      showFormDrawer()
    },
    [getOperatorTypeFromId, setClickedNodeId, setClickedToolId, showFormDrawer],
  )

  return {
    formDrawerVisible,
    hideFormDrawer,
    showFormDrawer: handleShow,
    clickedNode: getNode(clickNodeId),
  }
}

const ExcludedNodes = [Operator.Note, Operator.Placeholder, Operator.File]

export function useShowDrawer({
  onOpenSingleDebug,
}: {
  onOpenSingleDebug?: (nodeId: string) => void
}) {
  const { formDrawerVisible, hideFormDrawer, showFormDrawer, clickedNode } =
    useShowFormDrawer()

  const onPaneClick = useCallback(() => {
    hideFormDrawer()
  }, [hideFormDrawer])

  const onNodeClick = useCallback(
    (
      e: React.MouseEvent<Element>,
      node: { id: string; data?: { label?: string } },
    ) => {
      if (
        get(e.target, 'dataset.play') === 'true' ||
        get(e.target, 'parentNode.dataset.play') === 'true'
      ) {
        onOpenSingleDebug?.(node.id)
        return
      }

      if (!ExcludedNodes.some((x) => x === node.data?.label)) {
        showFormDrawer(e, node.id)
      }
    },
    [onOpenSingleDebug, showFormDrawer],
  )

  return {
    onPaneClick,
    formDrawerVisible,
    showFormDrawer,
    clickedNode,
    onNodeClick,
    hideFormDrawer,
  }
}

export function useHideFormSheetOnNodeDeletion({
  hideFormDrawer,
}: {
  hideFormDrawer: () => void
}) {
  const { nodes, clickedNodeId } = useGraphStore((state) => state)

  useEffect(() => {
    if (!nodes.some((x) => x.id === clickedNodeId)) {
      hideFormDrawer()
    }
  }, [clickedNodeId, hideFormDrawer, nodes])
}
