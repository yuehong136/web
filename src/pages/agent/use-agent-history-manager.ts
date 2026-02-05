import { useEffect, useRef } from 'react'
import useGraphStore from './store'

type CanvasState = { nodes: any[]; edges: any[] }

// History management class (50 steps)
export class HistoryManager {
  private history: CanvasState[] = []
  private currentIndex = -1
  private readonly maxSize = 50
  private readonly setNodes: (nodes: any[]) => void
  private readonly setEdges: (edges: any[]) => void

  constructor(setNodes: (nodes: any[]) => void, setEdges: (edges: any[]) => void) {
    this.setNodes = setNodes
    this.setEdges = setEdges
  }

  private statesEqual(state1: CanvasState, state2: CanvasState) {
    return JSON.stringify(state1) === JSON.stringify(state2)
  }

  push(nodes: any[], edges: any[]) {
    const currentState: CanvasState = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
    }

    if (
      this.history.length > 0 &&
      this.statesEqual(currentState, this.history[this.currentIndex])
    ) {
      return
    }

    if (this.currentIndex < this.history.length - 1) {
      this.history.splice(this.currentIndex + 1)
    }

    this.history.push(currentState)

    if (this.history.length > this.maxSize) {
      this.history.shift()
      this.currentIndex = this.history.length - 1
    } else {
      this.currentIndex = this.history.length - 1
    }
  }

  undo() {
    if (!this.canUndo()) return false
    this.currentIndex -= 1
    const prevState = this.history[this.currentIndex]
    this.setNodes(JSON.parse(JSON.stringify(prevState.nodes)))
    this.setEdges(JSON.parse(JSON.stringify(prevState.edges)))
    return true
  }

  redo() {
    if (!this.canRedo()) return false
    this.currentIndex += 1
    const nextState = this.history[this.currentIndex]
    this.setNodes(JSON.parse(JSON.stringify(nextState.nodes)))
    this.setEdges(JSON.parse(JSON.stringify(nextState.edges)))
    return true
  }

  canUndo() {
    return this.currentIndex > 0
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1
  }

  reset() {
    this.history = []
    this.currentIndex = -1
  }
}

export const useAgentHistoryManager = () => {
  const nodes = useGraphStore((state) => state.nodes)
  const edges = useGraphStore((state) => state.edges)
  const setNodes = useGraphStore((state) => state.setNodes)
  const setEdges = useGraphStore((state) => state.setEdges)

  const historyManagerRef = useRef<HistoryManager | null>(null)

  if (!historyManagerRef.current) {
    historyManagerRef.current = new HistoryManager(setNodes, setEdges)
  }

  const historyManager = historyManagerRef.current

  useEffect(() => {
    historyManager.push(nodes, edges)
  }, [nodes, edges, historyManager])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement
      const isInputFocused =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement?.hasAttribute('contenteditable')

      if (isInputFocused) return

      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'z' || e.key === 'Z') &&
        !e.shiftKey
      ) {
        e.preventDefault()
        historyManager.undo()
      } else if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'z' || e.key === 'Z') &&
        e.shiftKey
      ) {
        e.preventDefault()
        historyManager.redo()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [historyManager])
}

