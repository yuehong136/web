import type {
  Connection,
  Edge,
  HandleType,
  OnConnectEnd,
  OnConnectStart,
  ReactFlowInstance,
} from '@xyflow/react'
import { useCallback, useRef } from 'react'
import { useDropdownManager } from '../canvas/context'
import { Operator, PREVENT_CLOSE_DELAY } from '../constant'
import { useIsPipeline } from './use-is-pipeline'
import type { RAGFlowNodeType } from '../types'
import {
  canStartConnectionDrag,
  getConnectionStartPosition,
  hasValidHandleDirection,
  violatesPipelineSingleConnection,
} from '../utils/connection-handles'
import useGraphStore from '../store'
import { useAddNode } from './use-add-node'

interface ConnectionStartParams {
  nodeId: string
  handleId: string
  handleType: HandleType
}

/**
 * Connection drag management Hook
 * Responsible for handling connection drag start and end logic
 */
export const useConnectionDrag = (
  onConnect: (connection: Connection) => void,
  showModal: () => void,
  hideModal: () => void,
  setDropdownPosition: (position: { x: number; y: number }) => void,
  setCreatedPlaceholderRef: (nodeId: string | null) => void,
  calculateDropdownPosition: (
    clientX: number,
    clientY: number,
  ) => { x: number; y: number },
  removePlaceholderNode: () => void,
  clearActiveDropdown: () => void,
  checkAndRemoveExistingPlaceholder: () => void,
  reactFlowInstance?: ReactFlowInstance<RAGFlowNodeType, Edge>,
) => {
  // Reference for whether connection is established
  const isConnectedRef = useRef(false)
  // Reference for connection start parameters
  const connectionStartRef = useRef<ConnectionStartParams | null>(null)
  // Reference to prevent immediate close
  const preventCloseRef = useRef(false)
  // Reference to track mouse position for click detection
  const mouseStartPosRef = useRef<{ x: number; y: number } | null>(null)

  const { addCanvasNode } = useAddNode(reactFlowInstance)
  const { setActiveDropdown } = useDropdownManager()
  const isPipeline = useIsPipeline()
  const { hasDownstreamNode, hasUpstreamNode } = useGraphStore((state) => state)

  /**
   * Connection start handler function
   */
  const onConnectStart: OnConnectStart = useCallback((event, params) => {
    isConnectedRef.current = false

    // Record mouse start position to detect click vs drag
    if ('clientX' in event && 'clientY' in event) {
      mouseStartPosRef.current = { x: event.clientX, y: event.clientY }
    }

    if (
      params &&
      params.nodeId &&
      params.handleId &&
      params.handleType &&
      canStartConnectionDrag(params.handleType)
    ) {
      connectionStartRef.current = {
        nodeId: params.nodeId,
        handleId: params.handleId,
        handleType: params.handleType,
      }
    } else {
      connectionStartRef.current = null
    }
  }, [])

  /**
   * Connection end handler function
   */
  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      if ('clientX' in event && 'clientY' in event) {
        const { clientX, clientY } = event

        if (!isConnectedRef.current && connectionStartRef.current) {
          // Check mouse movement distance to distinguish click from drag
          let isHandleClick = false
          if (mouseStartPosRef.current) {
            const movementDistance = Math.sqrt(
              Math.pow(clientX - mouseStartPosRef.current.x, 2) +
                Math.pow(clientY - mouseStartPosRef.current.y, 2),
            )
            isHandleClick = movementDistance < 5 // Consider clicks within 5px as handle clicks
          }

          if (isHandleClick) {
            removePlaceholderNode()
            hideModal()
            clearActiveDropdown()
            connectionStartRef.current = null
            mouseStartPosRef.current = null
            return
          }

          // Check and remove existing placeholder-node before creating new one
          checkAndRemoveExistingPlaceholder()

          // Create placeholder node and establish connection
          const mockEvent = { clientX, clientY }
          const contextData = {
            nodeId: connectionStartRef.current.nodeId,
            id: connectionStartRef.current.handleId,
            type: 'source' as const,
            position: getConnectionStartPosition(
              connectionStartRef.current.handleId,
            ),
            isFromConnectionDrag: true,
          }

          // Use Placeholder operator to create node
          const newNodeId = addCanvasNode(
            Operator.Placeholder,
            contextData,
          )(mockEvent)

          if (newNodeId) {
            setCreatedPlaceholderRef(newNodeId)
          }

          // Calculate placeholder node position and display dropdown menu
          if (newNodeId && reactFlowInstance) {
            const dropdownScreenPosition = calculateDropdownPosition(
              clientX,
              clientY,
            )

            setDropdownPosition({
              x: dropdownScreenPosition.x,
              y: dropdownScreenPosition.y,
            })

            setActiveDropdown('drag')
            showModal()
            preventCloseRef.current = true
            setTimeout(() => {
              preventCloseRef.current = false
            }, PREVENT_CLOSE_DELAY)
          }

          // Reset connection state
          connectionStartRef.current = null
          mouseStartPosRef.current = null
        }
      }
    },
    [
      checkAndRemoveExistingPlaceholder,
      addCanvasNode,
      reactFlowInstance,
      removePlaceholderNode,
      hideModal,
      clearActiveDropdown,
      setCreatedPlaceholderRef,
      calculateDropdownPosition,
      setDropdownPosition,
      setActiveDropdown,
      showModal,
    ],
  )

  /**
   * Connection establishment handler function
   */
  const handleConnect = useCallback(
    (connection: Connection) => {
      if (!hasValidHandleDirection(connection)) {
        isConnectedRef.current = false
        return
      }

      if (
        violatesPipelineSingleConnection({
          isPipeline,
          sourceHasDownstreamConnection: hasDownstreamNode(connection.source),
          targetHasUpstreamConnection: hasUpstreamNode(connection.target),
        })
      ) {
        isConnectedRef.current = false
        return
      }

      onConnect(connection)
      isConnectedRef.current = true
    },
    [hasDownstreamNode, hasUpstreamNode, isPipeline, onConnect],
  )

  /**
   * Get connection start context data
   */
  const getConnectionStartContext = useCallback(() => {
    if (!connectionStartRef.current) {
      return null
    }

    return {
      nodeId: connectionStartRef.current.nodeId,
      id: connectionStartRef.current.handleId,
      type: 'source' as const,
      position: getConnectionStartPosition(connectionStartRef.current.handleId),
      isFromConnectionDrag: true,
    }
  }, [])

  /**
   * Check if close should be prevented
   */
  const shouldPreventClose = useCallback(() => {
    return preventCloseRef.current
  }, [])

  /**
   * Handle canvas move/zoom events
   * Hide dropdown and remove placeholder when user scrolls or moves canvas
   */
  const onMove = useCallback(() => {
    // Clean up placeholder and dropdown when canvas moves/zooms
    removePlaceholderNode()
    hideModal()
    clearActiveDropdown()
  }, [removePlaceholderNode, hideModal, clearActiveDropdown])

  return {
    nodeId: connectionStartRef.current?.nodeId,
    onConnectStart,
    onConnectEnd,
    handleConnect,
    getConnectionStartContext,
    shouldPreventClose,
    onMove,
  }
}
