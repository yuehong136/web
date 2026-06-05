/**
 * Designer 草稿态:本地 useReducer + 撤销/重做。
 *
 * 草稿是模态、临时的——开 Sheet 时由节点表单的 skeleton 播种,取消即弃,保存时
 * 一次性写回(见 designer/index.tsx)。不进全局 store,避免跨节点泄漏。
 */
import { useReducer } from 'react'
import { setDirective, setFieldValue, makeId } from '../skeleton-utils'
import type {
  BlockRole,
  FieldDirective,
  HeaderLayout,
  LayoutType,
  SkeletonBlock,
  SkeletonSchema,
  SkeletonSection,
} from '../types'

export type Selection =
  | { kind: 'none' }
  | { kind: 'theme' }
  | { kind: 'section'; sectionId: string }
  | { kind: 'block'; sectionId: string; blockId: string }

export interface DraftState {
  present: SkeletonSchema
  past: SkeletonSchema[]
  future: SkeletonSchema[]
  selection: Selection
}

export type DraftAction =
  | { type: 'addSection'; layout: LayoutType; id?: string }
  | { type: 'removeSection'; sectionId: string }
  | { type: 'reorderSection'; from: number; to: number }
  | { type: 'setSectionLayout'; sectionId: string; layout: LayoutType }
  | {
      type: 'setSectionField'
      sectionId: string
      key: 'title' | 'subtitle' | 'annotation'
      value: string
    }
  | {
      type: 'setSectionTitleDirective'
      sectionId: string
      directive: FieldDirective | null
    }
  | {
      type: 'addBlock'
      sectionId: string
      block: SkeletonBlock
      index?: number
    }
  | { type: 'removeBlock'; sectionId: string; blockId: string }
  | {
      type: 'moveBlock'
      from: { sectionId: string; index: number }
      to: { sectionId: string; index: number; role?: BlockRole }
    }
  | {
      type: 'setBlockRole'
      sectionId: string
      blockId: string
      role: BlockRole
    }
  | {
      type: 'setBlockAnnotation'
      sectionId: string
      blockId: string
      value: string
    }
  | {
      type: 'replaceBlock'
      sectionId: string
      blockId: string
      block: SkeletonBlock
    }
  | {
      type: 'setFieldValue'
      sectionId: string
      blockId: string
      path: string
      value: unknown
    }
  | {
      type: 'setFieldDirective'
      sectionId: string
      blockId: string
      path: string
      directive: FieldDirective | null
    }
  | {
      type: 'setReportField'
      key: 'title' | 'eyebrow' | 'subtitle' | 'headerArt'
      value: string
    }
  | { type: 'setHeaderLayout'; layout: HeaderLayout }
  | { type: 'setTitleDirective'; directive: FieldDirective | null }
  | { type: 'select'; selection: Selection }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'reset'; skeleton: SkeletonSchema }

const HISTORY_LIMIT = 50

function mapSections(
  skeleton: SkeletonSchema,
  fn: (section: SkeletonSection) => SkeletonSection,
): SkeletonSchema {
  return { ...skeleton, sections: skeleton.sections.map(fn) }
}

function updateSection(
  skeleton: SkeletonSchema,
  sectionId: string,
  fn: (section: SkeletonSection) => SkeletonSection,
): SkeletonSchema {
  return mapSections(skeleton, (s) => (s.id === sectionId ? fn(s) : s))
}

function updateBlock(
  skeleton: SkeletonSchema,
  sectionId: string,
  blockId: string,
  fn: (block: SkeletonBlock) => SkeletonBlock,
): SkeletonSchema {
  return updateSection(skeleton, sectionId, (section) => ({
    ...section,
    blocks: section.blocks.map((b) => (b.id === blockId ? fn(b) : b)),
  }))
}

function arrayMove<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

/** 在 selection 指向的对象被删除时回落到 none */
function pruneSelection(
  selection: Selection,
  skeleton: SkeletonSchema,
): Selection {
  if (selection.kind === 'section') {
    return skeleton.sections.some((s) => s.id === selection.sectionId)
      ? selection
      : { kind: 'none' }
  }
  if (selection.kind === 'block') {
    const section = skeleton.sections.find((s) => s.id === selection.sectionId)
    const exists = section?.blocks.some((b) => b.id === selection.blockId)
    return exists ? selection : { kind: 'none' }
  }
  return selection
}

/** 计算下一份 present(纯函数);返回 null 表示本 action 不改内容 */
function nextPresent(
  state: DraftState,
  action: DraftAction,
): SkeletonSchema | null {
  const skeleton = state.present
  switch (action.type) {
    case 'addSection':
      return {
        ...skeleton,
        sections: [
          ...skeleton.sections,
          { id: action.id ?? makeId('sec'), layout: action.layout, blocks: [] },
        ],
      }
    case 'removeSection':
      return {
        ...skeleton,
        sections: skeleton.sections.filter((s) => s.id !== action.sectionId),
      }
    case 'reorderSection':
      return {
        ...skeleton,
        sections: arrayMove(skeleton.sections, action.from, action.to),
      }
    case 'setSectionLayout':
      return updateSection(skeleton, action.sectionId, (s) => ({
        ...s,
        layout: action.layout,
      }))
    case 'setSectionField':
      return updateSection(skeleton, action.sectionId, (s) => ({
        ...s,
        [action.key]: action.value,
      }))
    case 'setSectionTitleDirective':
      return updateSection(skeleton, action.sectionId, (s) => {
        const next = { ...s }
        if (action.directive) next.titleDirective = action.directive
        else delete next.titleDirective
        return next
      })
    case 'addBlock':
      return updateSection(skeleton, action.sectionId, (s) => {
        const blocks = [...s.blocks]
        const at = action.index ?? blocks.length
        blocks.splice(Math.max(0, Math.min(at, blocks.length)), 0, action.block)
        return { ...s, blocks }
      })
    case 'removeBlock':
      return updateSection(skeleton, action.sectionId, (s) => ({
        ...s,
        blocks: s.blocks.filter((b) => b.id !== action.blockId),
      }))
    case 'moveBlock': {
      const source = skeleton.sections.find(
        (s) => s.id === action.from.sectionId,
      )
      const moved = source?.blocks[action.from.index]
      if (!moved) return null
      const withRole = action.to.role
        ? { ...moved, role: action.to.role }
        : moved
      // 先从源删除,再插入目标(同段移动时目标下标按删除后的数组计)
      let result = updateSection(skeleton, action.from.sectionId, (s) => ({
        ...s,
        blocks: s.blocks.filter((_, i) => i !== action.from.index),
      }))
      result = updateSection(result, action.to.sectionId, (s) => {
        const blocks = [...s.blocks]
        blocks.splice(
          Math.max(0, Math.min(action.to.index, blocks.length)),
          0,
          withRole,
        )
        return { ...s, blocks }
      })
      return result
    }
    case 'setBlockRole':
      return updateBlock(skeleton, action.sectionId, action.blockId, (b) => ({
        ...b,
        role: action.role,
      }))
    case 'setBlockAnnotation':
      return updateBlock(skeleton, action.sectionId, action.blockId, (b) => ({
        ...b,
        annotation: action.value,
      }))
    case 'replaceBlock':
      return updateBlock(
        skeleton,
        action.sectionId,
        action.blockId,
        () => action.block,
      )
    case 'setFieldValue':
      return updateBlock(skeleton, action.sectionId, action.blockId, (b) => ({
        ...b,
        fields: setFieldValue(b.fields ?? {}, action.path, action.value),
      }))
    case 'setFieldDirective':
      return updateBlock(skeleton, action.sectionId, action.blockId, (b) =>
        setDirective(b, action.path, action.directive),
      )
    case 'setReportField':
      return { ...skeleton, [action.key]: action.value }
    case 'setHeaderLayout':
      return { ...skeleton, headerLayout: action.layout }
    case 'setTitleDirective': {
      const next = { ...skeleton }
      if (action.directive) next.titleDirective = action.directive
      else delete next.titleDirective
      return next
    }
    default:
      return null
  }
}

function reducer(state: DraftState, action: DraftAction): DraftState {
  switch (action.type) {
    case 'select':
      return { ...state, selection: action.selection }
    case 'undo': {
      if (state.past.length === 0) return state
      const previous = state.past[state.past.length - 1]
      return {
        present: previous,
        past: state.past.slice(0, -1),
        future: [state.present, ...state.future],
        selection: pruneSelection(state.selection, previous),
      }
    }
    case 'redo': {
      if (state.future.length === 0) return state
      const next = state.future[0]
      return {
        present: next,
        past: [...state.past, state.present],
        future: state.future.slice(1),
        selection: pruneSelection(state.selection, next),
      }
    }
    case 'reset':
      return {
        present: action.skeleton,
        past: [],
        future: [],
        selection: { kind: 'none' },
      }
    default: {
      const present = nextPresent(state, action)
      if (!present) return state
      // 新增 section/block 时自动选中,便于接着编辑
      let selection = pruneSelection(state.selection, present)
      if (action.type === 'addSection') {
        selection = {
          kind: 'section',
          sectionId: present.sections[present.sections.length - 1].id,
        }
      } else if (action.type === 'addBlock') {
        selection = {
          kind: 'block',
          sectionId: action.sectionId,
          blockId: action.block.id,
        }
      }
      return {
        present,
        past: [...state.past, state.present].slice(-HISTORY_LIMIT),
        future: [],
        selection,
      }
    }
  }
}

export function useSkeletonDraft(initial: SkeletonSchema) {
  const [state, dispatch] = useReducer(reducer, {
    present: initial,
    past: [],
    future: [],
    selection: { kind: 'none' },
  })
  return {
    state,
    dispatch,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
