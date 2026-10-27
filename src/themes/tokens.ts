/**
 * 设计令牌定义文件
 * 基于 Dify 项目的语义化设计令牌系统
 *
 * 命名规范：
 * - components-{组件名}-{属性}-{状态}
 * - text-{层级}
 * - background-{用途}
 * - state-{交互状态}
 */

import { emptyAvatarTokens, type AvatarTokens } from './avatar-tokens'
import {
  emptyInteractionTokens,
  type InteractionTokens,
} from './interaction-tokens'
import {
  emptyStatusComponentTokens,
  type StatusComponentTokens,
} from './status-component-tokens'
import { emptyStatusTokens, type StatusTokens } from './status-tokens'
import { emptySurfaceTokens, type SurfaceTokens } from './surface-tokens'

// 设计令牌类型定义
export interface DesignTokens
  extends
    InteractionTokens,
    SurfaceTokens,
    StatusTokens,
    StatusComponentTokens,
    AvatarTokens {
  // ===== 文本系统 =====
  'text-primary': string
  'text-secondary': string
  'text-tertiary': string
  'text-muted': string
  'text-disabled': string
  'text-accent': string
  'text-inverted': string

  // ===== 背景系统 =====
  'background-body': string
  'background-default': string
  'background-subtle': string
  'background-section': string
  'background-overlay': string
  'background-surface': string

  // ===== 边框系统 =====
  'border-default': string
  'border-subtle': string
  'border-strong': string
  'border-accent': string

  // ===== 组件系统 - 按钮 =====
  'components-button-primary-bg': string
  'components-button-primary-bg-hover': string
  'components-button-primary-bg-active': string
  'components-button-primary-bg-disabled': string
  'components-button-primary-text': string
  'components-button-primary-text-disabled': string
  'components-button-primary-border': string
  'components-button-primary-border-hover': string

  'components-button-secondary-bg': string
  'components-button-secondary-bg-hover': string
  'components-button-secondary-text': string
  'components-button-secondary-border': string
  'components-button-secondary-border-hover': string

  'components-button-ghost-bg-hover': string
  'components-button-ghost-text': string
  'components-button-ghost-text-disabled': string

  // ===== 组件系统 - 输入框 =====
  'components-input-bg': string
  'components-input-bg-hover': string
  'components-input-bg-focus': string
  'components-input-border': string
  'components-input-border-hover': string
  'components-input-border-focus': string
  'components-input-text': string
  'components-input-text-placeholder': string
  'components-input-text-disabled': string
  'components-input-bg-disabled': string

  // ===== 组件系统 - 卡片 =====
  'components-card-bg': string
  'components-card-bg-hover': string
  'components-card-border': string

  // ===== 组件系统 - 侧边栏 =====
  'components-sidebar-bg': string
  'components-sidebar-border': string
  'components-sidebar-item-bg': string
  'components-sidebar-item-bg-hover': string
  'components-sidebar-item-bg-active': string
  'components-sidebar-item-text': string
  'components-sidebar-item-text-active': string

  // ===== 组件系统 - 导航 =====
  'components-nav-bg': string
  'components-nav-item-text': string

  // ===== 组件系统 - 下拉菜单 =====
  'components-dropdown-bg': string
  'components-dropdown-border': string
  'components-dropdown-item-bg-hover': string
  'components-dropdown-item-text': string

  // ===== 组件系统 - 表格 =====
  'components-table-bg': string
  'components-table-border': string
  'components-table-row-bg-hover': string

  // ===== 数据可视化分类调色板 (data-viz categorical) =====
  // 用于图表/思维导图/知识图谱等的「分类/层级」着色（非反馈、非交互语义）。
  // 消费者：src/pages/search/detail/mindmap/indented-tree.tsx（用 1-6）、
  // src/pages/knowledge/graph（实体类型分类色，用 1-10）。
  // 统一通过 src/lib/design-tokens/getCategoricalPalette() 消费，不要再硬编码 hex。
  'data-viz-categorical-1': string
  'data-viz-categorical-2': string
  'data-viz-categorical-3': string
  'data-viz-categorical-4': string
  'data-viz-categorical-5': string
  'data-viz-categorical-6': string
  'data-viz-categorical-7': string
  'data-viz-categorical-8': string
  'data-viz-categorical-9': string
  'data-viz-categorical-10': string

  // ===== HTTP方法颜色系统 =====
  'components-method-post-bg': string
  'components-method-post-text': string
  'components-method-post-border': string
  'components-method-patch-bg': string
  'components-method-patch-text': string
  'components-method-patch-border': string

  // ===== 表单控件 =====
  'components-checkbox-bg': string
  'components-checkbox-bg-checked': string
  'components-checkbox-border': string
  'components-checkbox-border-checked': string
  'components-checkbox-icon': string

  'components-radio-bg': string
  'components-radio-bg-checked': string
  'components-radio-border': string
  'components-radio-border-checked': string
  'components-radio-dot': string

  'components-select-bg': string
  'components-select-border': string
  'components-select-border-focus': string
  'components-select-text': string
  'components-select-placeholder': string

  'components-switch-bg': string
  'components-switch-bg-checked': string
  'components-switch-thumb': string

  // ===== 滑块组件 =====
  'components-slider-track': string
  'components-slider-range': string
  'components-slider-thumb': string
  'components-slider-thumb-border': string

  // ===== 滚动条系统 =====
  'components-scrollbar-track': string
  'components-scrollbar-thumb': string
  'components-scrollbar-thumb-hover': string

  // ===== 对话框和覆盖层 =====
  'components-dialog-bg': string
  'components-dialog-border': string
  'components-dialog-overlay': string

  'components-popover-bg': string

  'components-tooltip-bg': string
  'components-tooltip-text': string

  // ===== 导航和标签 =====
  'components-tabs-border': string
  'components-tabs-bg': string
  'components-tabs-active-bg': string
  'components-tabs-active-text': string
  'components-tabs-inactive-text': string

  // ===== 加载和进度 =====
  'components-skeleton-bg': string
  'components-progress-bg': string
  'components-progress-fill': string
  'components-spinner-color': string

  // ===== 代码和预格式化文本 =====
  'components-code-bg': string
  'components-code-text': string
  'components-code-border': string

  'components-pre-bg': string
  'components-pre-text': string
  'components-pre-border': string

  // ===== 工具调用组件 =====
  'components-tool-call-bg': string
  'components-tool-call-border': string
  'components-tool-call-title': string

  // ===== 徽章和标签 =====
  'components-badge-bg': string
  'components-badge-text': string
  'components-badge-border': string
  'components-badge-neutral-bg': string
  'components-badge-neutral-text': string
  'components-badge-blue-bg': string
  'components-badge-blue-text': string
  'components-badge-orange-bg': string
  'components-badge-orange-text': string
  'components-badge-purple-bg': string
  'components-badge-purple-text': string
  'components-badge-green-bg': string
  'components-badge-green-text': string

  // ===== 任务状态指示器 =====
  'components-task-status-idle-bg': string
  'components-task-status-idle-border': string
  'components-task-status-idle-text': string
  'components-task-status-idle-dot': string

  'components-task-status-running-bg': string
  'components-task-status-running-border': string
  'components-task-status-running-text': string
  'components-task-status-running-dot': string
  'components-task-status-running-progress-bg': string
  'components-task-status-running-progress-fill': string
  'components-task-status-running-progress-glow': string

  'components-tag-bg': string
  'components-tag-text': string
  'components-tag-border': string

  // ===== 分页器 =====
  'components-pagination-bg': string
  'components-pagination-text': string
  'components-pagination-border': string
  'components-pagination-item-bg': string
  'components-pagination-item-bg-hover': string
  'components-pagination-item-bg-active': string
  'components-pagination-item-text': string
  'components-pagination-item-text-active': string
  'components-pagination-disabled-text': string

  // ===== 步骤器 =====
  'components-steps-active-bg': string
  'components-steps-active-text': string
  'components-steps-inactive-bg': string
  'components-steps-inactive-text': string
  'components-steps-line': string

  // ===== 加载器和骨架屏 =====
  'components-loader-primary': string

  // ===== 折叠面板 =====
  'components-collapse-header-bg-hover': string

  // ===== 上传组件 =====
  'components-upload-bg': string
  'components-upload-bg-dragover': string
  'components-upload-border': string
  'components-upload-border-hover': string
  'components-upload-border-dragover': string
  'components-upload-text': string
  'components-upload-text-secondary': string
  'components-upload-icon': string

  // ===== 分段控制器 =====
  'components-segmented-bg': string
  'components-segmented-border': string
  'components-segmented-item-bg': string
  'components-segmented-item-bg-hover': string
  'components-segmented-item-bg-active': string
  'components-segmented-item-text': string
  'components-segmented-item-text-active': string

  // ===== 卡片高级变体 =====
  'components-card-meta-title': string
  'components-card-meta-description': string

  // ===== 聊天页面专用布局 =====
  'chat-header-bg': string
  'chat-header-border': string
  'chat-content-bg': string
  'chat-welcome-border': string

  // ===== 聊天气泡和头像 =====
  'chat-bubble-user-bg': string
  'chat-bubble-user-text': string

  // ===== 图标按钮 =====
  'components-icon-button-bg-hover': string

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': string
  'components-glassmorphism-border': string

  // ===== 画布系统 (Agent Canvas) =====
  // 画布背景
  'components-canvas-bg': string
  'components-canvas-grid': string
  'components-canvas-spotlight': string

  // 节点通用
  'components-canvas-node-bg': string
  'components-canvas-node-border': string
  'components-canvas-node-border-selected': string

  // 边线
  'components-canvas-edge-stroke-selected': string
  'components-canvas-edge-marker': string
  'components-canvas-edge-marker-selected': string

  // 连接点
  'components-canvas-handle-bg': string
  'components-canvas-handle-icon': string

  // 节点类型图标颜色（按功能分组）
  'components-canvas-icon-start': string // 开始节点（绿色）
  'components-canvas-icon-retrieval': string // 检索节点（蓝色）
  'components-canvas-icon-message': string // 消息节点（青绿色）
  'components-canvas-icon-tool': string // 工具节点（橙色）
  'components-canvas-icon-file': string // 文件节点（绿色）
  'components-canvas-icon-splitter': string // 分割节点（橙色）
  'components-canvas-icon-tokenizer': string // 分词节点（紫色）

  // 占位符/骨架屏
  'components-canvas-skeleton-bg': string

  // 笔记节点
  'components-canvas-note-bg': string
  'components-canvas-note-border': string
  'components-canvas-note-border-selected': string
  'components-canvas-note-title': string
  'components-canvas-note-text': string

  // ===== 骨架与页面模板 =====
  'components-app-shell-bg': string
  'components-main-workbench-bg': string
  'components-main-workbench-surface': string
  'components-main-workbench-border': string
  'components-page-header-bg': string
  'components-page-header-border': string
  'components-page-header-title': string
  'components-page-header-description': string
  'components-page-toolbar-bg': string
  'components-page-toolbar-border': string
  'components-page-toolbar-text': string
  'components-page-state-icon-bg': string
  'components-page-state-icon': string
  'components-page-state-title': string
  'components-page-state-description': string
  'components-settings-rail-bg': string
  'components-settings-rail-border': string
  'components-settings-rail-title': string
  'components-console-bg': string
  'components-console-surface': string
  'components-console-border': string
  'components-workspace-bg': string
  'components-workspace-surface': string
  'components-workspace-border': string
  'components-studio-bg': string
  'components-studio-surface': string
  'components-studio-border': string
  'components-split-pane-bg': string
  'components-split-pane-border': string

  // ===== 设置页面专用 =====
  'components-settings-content-bg': string
  'components-settings-section-bg': string
  'components-settings-section-border': string
  'components-settings-section-title': string
  'components-settings-section-description': string

  // ===== 系统状态页面专用 =====
  'components-system-accent-bg': string
  'components-system-accent-border': string
  'components-system-accent-text': string
  'components-system-accent-soft': string
  'components-system-page-bg': string
  'components-system-panel-bg': string
  'components-system-panel-border': string
  'components-system-header-title': string
  'components-system-header-description': string
  'components-system-version-tag-bg': string
  'components-system-version-tag-border': string
  'components-system-version-tag-label': string
  'components-system-version-tag-value': string
  'components-system-section-title': string
  'components-system-section-divider': string
  'components-system-empty-bg': string
  'components-system-empty-border': string

  'components-system-status-card-bg': string
  'components-system-status-card-border': string
  'components-system-status-card-border-hover': string

  'components-system-chart-grid': string
  'components-system-chart-axis': string
  'components-system-chart-tooltip-bg': string
  'components-system-chart-tooltip-border': string
  'components-system-chart-tooltip-text': string
  'components-system-chart-tooltip-muted': string
  'components-system-chart-lag': string
  'components-system-chart-info-pill-bg': string
  'components-system-chart-info-pill-text': string
}

// 生成 CSS 变量映射
const generateCSSVars = (
  tokens: Record<string, string>,
): Record<string, string> => {
  const cssVars: Record<string, string> = {}

  Object.keys(tokens).forEach((key) => {
    cssVars[key] = `var(--color-${key})`
  })

  return cssVars
}

// 默认令牌定义（用于类型检查）
export const defaultTokens: DesignTokens = {
  ...emptySurfaceTokens,
  ...emptyStatusTokens,
  ...emptyStatusComponentTokens,
  ...emptyAvatarTokens,
  // 文本系统
  'text-primary': '',
  'text-secondary': '',
  'text-tertiary': '',
  'text-muted': '',
  'text-disabled': '',
  'text-accent': '',
  'text-inverted': '',

  // 背景系统
  'background-body': '',
  'background-default': '',
  'background-subtle': '',
  'background-section': '',
  'background-overlay': '',
  'background-surface': '',

  // 边框系统
  'border-default': '',
  'border-subtle': '',
  'border-strong': '',
  'border-accent': '',

  // 按钮组件
  'components-button-primary-bg': '',
  'components-button-primary-bg-hover': '',
  'components-button-primary-bg-active': '',
  'components-button-primary-bg-disabled': '',
  'components-button-primary-text': '',
  'components-button-primary-text-disabled': '',
  'components-button-primary-border': '',
  'components-button-primary-border-hover': '',

  'components-button-secondary-bg': '',
  'components-button-secondary-bg-hover': '',
  'components-button-secondary-text': '',
  'components-button-secondary-border': '',
  'components-button-secondary-border-hover': '',

  'components-button-ghost-bg-hover': '',
  'components-button-ghost-text': '',
  'components-button-ghost-text-disabled': '',

  // 输入框组件
  'components-input-bg': '',
  'components-input-bg-hover': '',
  'components-input-bg-focus': '',
  'components-input-border': '',
  'components-input-border-hover': '',
  'components-input-border-focus': '',
  'components-input-text': '',
  'components-input-text-placeholder': '',
  'components-input-text-disabled': '',
  'components-input-bg-disabled': '',

  // 卡片组件
  'components-card-bg': '',
  'components-card-bg-hover': '',
  'components-card-border': '',

  // 侧边栏组件
  'components-sidebar-bg': '',
  'components-sidebar-border': '',
  'components-sidebar-item-bg': '',
  'components-sidebar-item-bg-hover': '',
  'components-sidebar-item-bg-active': '',
  'components-sidebar-item-text': '',
  'components-sidebar-item-text-active': '',

  // 导航组件
  'components-nav-bg': '',
  'components-nav-item-text': '',

  // 下拉菜单组件
  'components-dropdown-bg': '',
  'components-dropdown-border': '',
  'components-dropdown-item-bg-hover': '',
  'components-dropdown-item-text': '',

  // 表格组件
  'components-table-bg': '',
  'components-table-border': '',
  'components-table-row-bg-hover': '',

  ...emptyInteractionTokens,

  // 数据可视化分类调色板 (data-viz categorical)
  'data-viz-categorical-1': '',
  'data-viz-categorical-2': '',
  'data-viz-categorical-3': '',
  'data-viz-categorical-4': '',
  'data-viz-categorical-5': '',
  'data-viz-categorical-6': '',
  'data-viz-categorical-7': '',
  'data-viz-categorical-8': '',
  'data-viz-categorical-9': '',
  'data-viz-categorical-10': '',

  // HTTP方法颜色系统
  'components-method-post-bg': '',
  'components-method-post-text': '',
  'components-method-post-border': '',
  'components-method-patch-bg': '',
  'components-method-patch-text': '',
  'components-method-patch-border': '',

  // 表单控件
  'components-checkbox-bg': '',
  'components-checkbox-bg-checked': '',
  'components-checkbox-border': '',
  'components-checkbox-border-checked': '',
  'components-checkbox-icon': '',

  'components-radio-bg': '',
  'components-radio-bg-checked': '',
  'components-radio-border': '',
  'components-radio-border-checked': '',
  'components-radio-dot': '',

  'components-select-bg': '',
  'components-select-border': '',
  'components-select-border-focus': '',
  'components-select-text': '',
  'components-select-placeholder': '',

  'components-switch-bg': '',
  'components-switch-bg-checked': '',
  'components-switch-thumb': '',

  // 滑块组件
  'components-slider-track': '',
  'components-slider-range': '',
  'components-slider-thumb': '',
  'components-slider-thumb-border': '',

  // 滚动条系统
  'components-scrollbar-track': '',
  'components-scrollbar-thumb': '',
  'components-scrollbar-thumb-hover': '',

  // 对话框和覆盖层
  'components-dialog-bg': '',
  'components-dialog-border': '',
  'components-dialog-overlay': '',

  'components-popover-bg': '',

  'components-tooltip-bg': '',
  'components-tooltip-text': '',

  // 导航和标签
  'components-tabs-border': '',
  'components-tabs-bg': '',
  'components-tabs-active-bg': '',
  'components-tabs-active-text': '',
  'components-tabs-inactive-text': '',

  // 加载和进度
  'components-skeleton-bg': '',
  'components-progress-bg': '',
  'components-progress-fill': '',
  'components-spinner-color': '',

  // 代码和预格式化文本
  'components-code-bg': '',
  'components-code-text': '',
  'components-code-border': '',

  'components-pre-bg': '',
  'components-pre-text': '',
  'components-pre-border': '',

  // 工具调用组件
  'components-tool-call-bg': '',
  'components-tool-call-border': '',
  'components-tool-call-title': '',

  // 徽章和标签
  'components-badge-bg': '',
  'components-badge-text': '',
  'components-badge-border': '',
  'components-badge-neutral-bg': '',
  'components-badge-neutral-text': '',
  'components-badge-blue-bg': '',
  'components-badge-blue-text': '',
  'components-badge-orange-bg': '',
  'components-badge-orange-text': '',
  'components-badge-purple-bg': '',
  'components-badge-purple-text': '',
  'components-badge-green-bg': '',
  'components-badge-green-text': '',

  // 统计卡片组件
  // 蓝色卡片
  // 绿色卡片
  // 任务状态指示器
  'components-task-status-idle-bg': '',
  'components-task-status-idle-border': '',
  'components-task-status-idle-text': '',
  'components-task-status-idle-dot': '',

  'components-task-status-running-bg': '',
  'components-task-status-running-border': '',
  'components-task-status-running-text': '',
  'components-task-status-running-dot': '',
  'components-task-status-running-progress-bg': '',
  'components-task-status-running-progress-fill': '',
  'components-task-status-running-progress-glow': '',

  'components-tag-bg': '',
  'components-tag-text': '',
  'components-tag-border': '',

  // 分页器
  'components-pagination-bg': '',
  'components-pagination-text': '',
  'components-pagination-border': '',
  'components-pagination-item-bg': '',
  'components-pagination-item-bg-hover': '',
  'components-pagination-item-bg-active': '',
  'components-pagination-item-text': '',
  'components-pagination-item-text-active': '',
  'components-pagination-disabled-text': '',

  // 步骤器
  'components-steps-active-bg': '',
  'components-steps-active-text': '',
  'components-steps-inactive-bg': '',
  'components-steps-inactive-text': '',
  'components-steps-line': '',

  // 加载器和骨架屏
  'components-loader-primary': '',

  // 折叠面板
  'components-collapse-header-bg-hover': '',

  // 上传组件
  'components-upload-bg': '',
  'components-upload-bg-dragover': '',
  'components-upload-border': '',
  'components-upload-border-hover': '',
  'components-upload-border-dragover': '',
  'components-upload-text': '',
  'components-upload-text-secondary': '',
  'components-upload-icon': '',

  // 分段控制器
  'components-segmented-bg': '',
  'components-segmented-border': '',
  'components-segmented-item-bg': '',
  'components-segmented-item-bg-hover': '',
  'components-segmented-item-bg-active': '',
  'components-segmented-item-text': '',
  'components-segmented-item-text-active': '',

  // 卡片高级变体
  'components-card-meta-title': '',
  'components-card-meta-description': '',

  // 聊天页面专用布局
  'chat-header-bg': '',
  'chat-header-border': '',
  'chat-content-bg': '',
  'chat-welcome-border': '',

  // 聊天气泡和头像
  'chat-bubble-user-bg': '',
  'chat-bubble-user-text': '',

  // 图标按钮
  'components-icon-button-bg-hover': '',

  // 现代化增强组件
  'components-glassmorphism-bg': '',
  'components-glassmorphism-border': '',

  // 画布系统 (Agent Canvas)
  'components-canvas-bg': '',
  'components-canvas-grid': '',
  'components-canvas-spotlight': '',
  'components-canvas-node-bg': '',
  'components-canvas-node-border': '',
  'components-canvas-node-border-selected': '',
  'components-canvas-edge-stroke-selected': '',
  'components-canvas-edge-marker': '',
  'components-canvas-edge-marker-selected': '',
  'components-canvas-handle-bg': '',
  'components-canvas-handle-icon': '',
  'components-canvas-icon-start': '',
  'components-canvas-icon-retrieval': '',
  'components-canvas-icon-message': '',
  'components-canvas-icon-tool': '',
  'components-canvas-icon-file': '',
  'components-canvas-icon-splitter': '',
  'components-canvas-icon-tokenizer': '',
  'components-canvas-skeleton-bg': '',
  'components-canvas-note-bg': '',
  'components-canvas-note-border': '',
  'components-canvas-note-border-selected': '',
  'components-canvas-note-title': '',
  'components-canvas-note-text': '',

  // 骨架与页面模板
  'components-app-shell-bg': '',
  'components-main-workbench-bg': '',
  'components-main-workbench-surface': '',
  'components-main-workbench-border': '',
  'components-page-header-bg': '',
  'components-page-header-border': '',
  'components-page-header-title': '',
  'components-page-header-description': '',
  'components-page-toolbar-bg': '',
  'components-page-toolbar-border': '',
  'components-page-toolbar-text': '',
  'components-page-state-icon-bg': '',
  'components-page-state-icon': '',
  'components-page-state-title': '',
  'components-page-state-description': '',
  'components-settings-rail-bg': '',
  'components-settings-rail-border': '',
  'components-settings-rail-title': '',
  'components-console-bg': '',
  'components-console-surface': '',
  'components-console-border': '',
  'components-workspace-bg': '',
  'components-workspace-surface': '',
  'components-workspace-border': '',
  'components-studio-bg': '',
  'components-studio-surface': '',
  'components-studio-border': '',
  'components-split-pane-bg': '',
  'components-split-pane-border': '',

  // 设置页面专用
  'components-settings-content-bg': '',
  'components-settings-section-bg': '',
  'components-settings-section-border': '',
  'components-settings-section-title': '',
  'components-settings-section-description': '',

  // 系统状态页面专用
  'components-system-accent-bg': '',
  'components-system-accent-border': '',
  'components-system-accent-text': '',
  'components-system-accent-soft': '',
  'components-system-page-bg': '',
  'components-system-panel-bg': '',
  'components-system-panel-border': '',
  'components-system-header-title': '',
  'components-system-header-description': '',
  'components-system-version-tag-bg': '',
  'components-system-version-tag-border': '',
  'components-system-version-tag-label': '',
  'components-system-version-tag-value': '',
  'components-system-section-title': '',
  'components-system-section-divider': '',
  'components-system-empty-bg': '',
  'components-system-empty-border': '',

  'components-system-status-card-bg': '',
  'components-system-status-card-border': '',
  'components-system-status-card-border-hover': '',

  'components-system-chart-grid': '',
  'components-system-chart-axis': '',
  'components-system-chart-tooltip-bg': '',
  'components-system-chart-tooltip-border': '',
  'components-system-chart-tooltip-text': '',
  'components-system-chart-tooltip-muted': '',
  'components-system-chart-lag': '',
  'components-system-chart-info-pill-bg': '',
  'components-system-chart-info-pill-text': '',
}

// 导出 CSS 变量映射用于 Tailwind
export const cssVariables = generateCSSVars(
  defaultTokens as unknown as Record<string, string>,
)
