/**
 * 自动化主题生成工具
 * 基于 Dify 项目的设计令牌系统
 * 自动生成 light.css 和 dark.css 文件，确保一致性
 */

import type { DesignTokens } from './tokens'
import { interactionPalette as palette } from './interaction-palette'
import { surfacePalette as surfaces } from './surface-palette'
import { buildSurfaceTokens } from './surface-tokens'
import { statusPalette } from './status-palette'
import { buildStatusTokens } from './status-tokens'
import { buildStatusComponentTokens } from './status-component-tokens'
import { avatarPalette } from './avatar-palette'
import { buildAvatarTokens } from './avatar-tokens'
import {
  createPresetTokenSets,
  generatePresetCSS,
  generatePresetValuesModule,
} from './theme-artifact-generator'
export { generateThemeCSS } from './theme-css-generator'
export const lightTokens: DesignTokens = {
  ...buildSurfaceTokens(surfaces.light, palette.light),
  ...buildStatusTokens(statusPalette.light),
  ...buildStatusComponentTokens(statusPalette.light),
  ...buildAvatarTokens(avatarPalette.light),
  // ===== 文本系统 =====
  'text-primary': surfaces.light.text,
  'text-secondary': surfaces.light.secondary,
  'text-tertiary': surfaces.light.tertiary,
  'text-muted': surfaces.light.muted,
  'text-disabled': surfaces.light.disabled,
  'text-accent': '#1a1a1a',
  'text-inverted': '#ffffff',

  // ===== 背景系统 =====
  'background-body': surfaces.light.body,
  'background-default': surfaces.light.canvas,
  'background-subtle': surfaces.light.subtle,
  'background-section': surfaces.light.canvas,
  'background-overlay': 'rgba(0, 0, 0, 0.5)',
  'background-surface': surfaces.light.surface,

  // ===== 边框系统 =====
  'border-default': surfaces.light.border,
  'border-subtle': surfaces.light.borderSubtle,
  'border-strong': surfaces.light.borderStrong,
  'border-accent': palette.light.focus,

  // ===== 按钮组件 - Primary =====
  'components-button-primary-bg': palette.light.action,
  'components-button-primary-bg-hover': palette.light.actionHover,
  'components-button-primary-bg-active': palette.light.actionActive,
  'components-button-primary-bg-disabled': '#ececf0',
  'components-button-primary-text': '#ffffff',
  'components-button-primary-text-disabled': '#9ca3af',
  'components-button-primary-border': palette.light.action,
  'components-button-primary-border-hover': palette.light.actionHover,

  // ===== 按钮组件 - Secondary =====
  'components-button-secondary-bg': '#f3f3f5',
  'components-button-secondary-bg-hover': '#e9ebef',
  'components-button-secondary-text': '#030213',
  'components-button-secondary-border': 'rgba(0, 0, 0, 0.1)',
  'components-button-secondary-border-hover': '#b7becb',

  // ===== 按钮组件 - Ghost =====
  'components-button-ghost-bg-hover': '#f3f4f6',
  'components-button-ghost-text': '#374151',
  'components-button-ghost-text-disabled': '#9ca3af',

  // ===== 输入框组件（现代浅色风格） =====
  'components-input-bg': '#ffffff',
  'components-input-bg-hover': '#f9fafb',
  'components-input-bg-focus': '#ffffff',
  'components-input-border': surfaces.light.inputBorder,
  'components-input-border-hover': surfaces.light.inputBorderHover,
  'components-input-border-focus': palette.light.focus,
  'components-input-text': surfaces.light.text,
  'components-input-text-placeholder': surfaces.light.tertiary,
  'components-input-text-disabled': surfaces.light.disabled,
  'components-input-bg-disabled': '#f5f5f5',

  // ===== 卡片组件 =====
  'components-card-bg': surfaces.light.surface,
  'components-card-bg-hover': '#fafafa',
  'components-card-border': 'rgba(0, 0, 0, 0.08)',

  // ===== 侧边栏组件 =====
  'components-sidebar-bg': surfaces.light.canvas,
  'components-sidebar-border': 'rgba(0, 0, 0, 0.06)',
  'components-sidebar-item-bg': 'transparent',
  'components-sidebar-item-bg-hover': 'rgba(0, 0, 0, 0.04)',
  'components-sidebar-item-bg-active': 'rgba(0, 0, 0, 0.06)',
  'components-sidebar-item-text': surfaces.light.secondary,
  'components-sidebar-item-text-active': surfaces.light.text,

  // ===== 导航组件 =====
  'components-nav-bg': surfaces.light.canvas,
  'components-nav-item-text': surfaces.light.secondary,

  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': surfaces.light.elevated,
  'components-dropdown-border': '#e5e7eb',
  'components-dropdown-item-bg-hover': '#f3f4f6',
  'components-dropdown-item-text': surfaces.light.secondary,

  // ===== 表格组件 =====
  'components-table-bg': surfaces.light.surface,
  'components-table-border': '#e5e7eb',
  'components-table-row-bg-hover': '#f9fafb',

  // ===== 交互状态 =====
  'state-hover': '#f3f4f6',
  'state-active': '#e5e7eb',
  'state-focus': palette.light.focus,
  'state-selected': palette.light.selection,
  'state-selected-text': palette.light.selectionText,
  'state-selected-bg': palette.light.selectionTint,
  'state-disabled': '#e5e7eb',

  // ===== 状态透明度变体 (10% opacity) =====
  'state-focus-10': palette.light.selectionTint,
  'state-neutral-10': 'rgba(107, 114, 128, 0.1)',
  // 语义化别名（subtle = 10% opacity）
  'state-focus-subtle': palette.light.selectionTint,

  // ===== 数据可视化分类调色板 (data-viz categorical) =====
  // 思维导图/图表/知识图谱的分类层级着色（非反馈、非交互）。10 个彼此区分、可读的色相：
  // sky / emerald / teal / amber / red / violet / pink / orange / blue / lime。
  // 1-5 沿用历史 mindmap 配色；6 取分类紫（与 indented-tree NODE_COLORS 兜底意图一致），
  // 替换历史误继承的近黑 text-accent。7-10 复用知识图谱旧 palette 成熟色相并补一档 lime
  // 拉开与 red/pink/orange 的距离。mindmap 用 1-6，知识图谱实体类型色用 1-10。
  // 色盲安全 / 感知均匀的 OKLCH 生成 scale（light，L≈0.60 C≈0.142，hue 环 36° 均匀）。
  // 各档对白底画布 ≥3:1，相邻档在 protan/deutan/tritan 下仍可区分。
  // provenance: scripts/gen-categorical-oklch.mjs（hues=[20,200,92,272,164,344,56,236,128,308]）。
  'data-viz-categorical-1': '#c7585c',
  'data-viz-categorical-2': '#009298',
  'data-viz-categorical-3': '#9a7d03',
  'data-viz-categorical-4': '#6378d4',
  'data-viz-categorical-5': '#0a976c',
  'data-viz-categorical-6': '#b95995',
  'data-viz-categorical-7': '#be650f',
  'data-viz-categorical-8': '#058ac2',
  'data-viz-categorical-9': '#678f21',
  'data-viz-categorical-10': '#9866c1',

  // ===== HTTP方法颜色系统 =====
  'components-method-post-bg': 'rgba(59, 130, 246, 0.1)',
  'components-method-post-text': '#026f6a',
  'components-method-post-border': '#33D4CB',
  'components-method-patch-bg': 'rgba(168, 85, 247, 0.1)',
  'components-method-patch-text': '#7c3aed',
  'components-method-patch-border': '#a855f7',

  // ===== 表单控件：品牌选中态 =====
  'components-checkbox-bg': '#ffffff',
  'components-checkbox-bg-checked': palette.light.selection,
  'components-checkbox-border': '#d1d5db',
  'components-checkbox-border-checked': palette.light.selection,
  'components-checkbox-icon': '#ffffff',

  'components-radio-bg': '#ffffff',
  'components-radio-bg-checked': '#ffffff',
  'components-radio-border': '#d1d5db',
  'components-radio-border-checked': palette.light.selection,
  'components-radio-dot': palette.light.selection,

  'components-select-bg': '#ffffff',
  'components-select-border': '#d1d5db',
  'components-select-border-focus': palette.light.focus,
  'components-select-text': surfaces.light.text,
  'components-select-placeholder': surfaces.light.tertiary,

  'components-switch-bg': '#e5e7eb',
  'components-switch-bg-checked': palette.light.selection,
  'components-switch-thumb': '#ffffff',

  // ===== 滑块组件 =====
  'components-slider-track': '#e5e7eb',
  'components-slider-range': palette.light.selection,
  'components-slider-thumb': '#ffffff',
  'components-slider-thumb-border': palette.light.selection,

  // ===== 滚动条系统 =====
  'components-scrollbar-track': '#f3f4f6',
  'components-scrollbar-thumb': '#d1d5db',
  'components-scrollbar-thumb-hover': '#9ca3af',

  // ===== 对话框和覆盖层 =====
  'components-dialog-bg': surfaces.light.surface,
  'components-dialog-border': '#e5e7eb',
  'components-dialog-overlay': 'rgba(0, 0, 0, 0.5)',

  'components-popover-bg': surfaces.light.elevated,

  'components-tooltip-bg': '#1f2937',
  'components-tooltip-text': '#ffffff',

  // ===== 导航和标签 =====
  'components-tabs-border': '#e5e7eb',
  'components-tabs-bg': '#f5f5f5',
  'components-tabs-active-bg': palette.light.selectionTint,
  'components-tabs-active-text': palette.light.selectionText,
  'components-tabs-inactive-text': surfaces.light.tertiary,

  // ===== 加载和进度 =====
  'components-skeleton-bg': '#f3f4f6',
  'components-progress-bg': '#e5e7eb',
  'components-progress-fill': palette.light.selection,
  'components-spinner-color': palette.light.selection,

  // ===== 代码和预格式化文本 =====
  'components-code-bg': '#f6f8fa',
  'components-code-text': '#d4251e',
  'components-code-border': '#d1d5db',

  'components-pre-bg': '#f6f8fa',
  'components-pre-text': '#24292e',
  'components-pre-border': '#e1e4e8',

  // ===== 工具调用组件 =====
  'components-tool-call-bg': '#eff6ff', // 蓝色淡背景
  'components-tool-call-border': '#bfdbfe', // 蓝色边框
  'components-tool-call-title': '#1e40af', // 蓝色标题文字

  // ===== 新增组件令牌（使用基础颜色映射） =====
  // 徽章和标签
  'components-badge-bg': '#f5f5f5',
  'components-badge-text': surfaces.light.tertiary,
  'components-badge-border': '#eaeaea',
  'components-badge-neutral-bg': '#f3f4f6',
  'components-badge-neutral-text': surfaces.light.tertiary,
  'components-badge-blue-bg': '#dbeafe',
  'components-badge-blue-text': '#1d4ed8',
  'components-badge-orange-bg': '#ffedd5',
  'components-badge-orange-text': '#c2410c',
  'components-badge-purple-bg': '#f3e8ff',
  'components-badge-purple-text': '#7c3aed',
  'components-badge-green-bg': '#dcfce7',
  'components-badge-green-text': '#15803d',

  // ===== 头像渐变系统 - 亮色主题 =====
  // 任务状态指示器 - 亮色主题
  'components-task-status-idle-bg': 'rgba(107, 114, 128, 0.1)',
  'components-task-status-idle-border': 'rgba(107, 114, 128, 0.2)',
  'components-task-status-idle-text': '#4b5563',
  'components-task-status-idle-dot': '#9ca3af',

  'components-task-status-running-bg': palette.light.selectionTint,
  'components-task-status-running-border': palette.light.selectionTint,
  'components-task-status-running-text': palette.light.selectionText,
  'components-task-status-running-dot': palette.light.selection,
  'components-task-status-running-progress-bg': 'rgba(107, 114, 128, 0.2)',
  'components-task-status-running-progress-fill': palette.light.selection,
  'components-task-status-running-progress-glow': palette.light.selectionSoft,

  'components-tag-bg': '#f3f4f6',
  'components-tag-text': surfaces.light.secondary,
  'components-tag-border': surfaces.light.border,

  // 分页器
  'components-pagination-bg': '#ffffff',
  'components-pagination-text': surfaces.light.secondary,
  'components-pagination-border': '#e5e7eb',
  'components-pagination-item-bg': '#ffffff',
  'components-pagination-item-bg-hover': '#f9fafb',
  'components-pagination-item-bg-active': palette.light.action,
  'components-pagination-item-text': surfaces.light.secondary,
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-text': '#d1d5db',

  // 步骤器
  'components-steps-active-bg': palette.light.action,
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': '#f3f3f5',
  'components-steps-inactive-text': surfaces.light.secondary,
  'components-steps-line': '#e5e7eb',

  // 其余新增组件令牌使用合适的基础颜色
  'components-loader-primary': palette.light.selection,

  'components-collapse-header-bg-hover': '#f3f4f6',

  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': palette.light.selectionTint,
  'components-upload-border': 'rgba(113, 113, 130, 0.25)',
  'components-upload-border-hover': 'rgba(113, 113, 130, 0.5)',
  'components-upload-border-dragover': palette.light.focus,
  'components-upload-text': surfaces.light.secondary,
  'components-upload-text-secondary': surfaces.light.tertiary,
  'components-upload-icon': '#d1d5db',

  'components-segmented-bg': '#f5f5f5',
  'components-segmented-border': '#eaeaea',
  'components-segmented-item-bg': 'transparent',
  'components-segmented-item-bg-hover': '#eaeaea',
  'components-segmented-item-bg-active': palette.light.selectionTint,
  'components-segmented-item-text': surfaces.light.secondary,
  'components-segmented-item-text-active': palette.light.selectionText,

  'components-card-meta-title': surfaces.light.text,
  'components-card-meta-description': surfaces.light.secondary,

  // ===== 聊天页面专用布局 =====
  'chat-header-bg': surfaces.light.surface,
  'chat-header-border': surfaces.light.borderSubtle,
  'chat-content-bg': surfaces.light.surface,
  'chat-welcome-border': palette.light.selectionTint,

  // ===== 图标按钮 =====
  'components-icon-button-bg-hover': '#f3f4f6',

  // ===== 聊天气泡和头像 =====
  'chat-bubble-user-bg': surfaces.light.subtle,
  'chat-bubble-user-text': surfaces.light.text,

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': 'rgba(255, 255, 255, 0.75)',
  'components-glassmorphism-border': 'rgba(255, 255, 255, 0.2)',

  // ===== 画布系统 (Agent Canvas) - 亮色主题 =====
  // 画布背景
  'components-canvas-bg': 'rgb(246, 246, 247)',
  'components-canvas-grid': 'rgba(0, 0, 0, 0.15)',
  'components-canvas-spotlight': '#c2ddf3',

  // 节点通用
  'components-canvas-node-bg': '#ffffff',
  'components-canvas-node-border': 'rgba(0, 0, 0, 0.1)',
  'components-canvas-node-border-selected': palette.light.selection,

  // 边线
  'components-canvas-edge-stroke-selected': palette.light.selection,
  'components-canvas-edge-marker': 'rgb(156, 163, 175)',
  'components-canvas-edge-marker-selected': palette.light.selection,

  // 连接点
  'components-canvas-handle-bg': palette.light.selection,
  'components-canvas-handle-icon': '#ffffff',

  // 节点类型图标颜色（亮色主题）
  'components-canvas-icon-start': '#16a34a', // green-600
  'components-canvas-icon-retrieval': '#2563eb', // blue-600
  'components-canvas-icon-message': '#0d9488', // teal-600
  'components-canvas-icon-tool': '#ea580c', // orange-600
  'components-canvas-icon-file': '#16a34a', // green-600
  'components-canvas-icon-splitter': '#ea580c', // orange-600
  'components-canvas-icon-tokenizer': '#9333ea', // purple-600

  // 占位符/骨架屏
  'components-canvas-skeleton-bg': '#e5e7eb',

  // 笔记节点
  'components-canvas-note-bg': '#fef9c3', // yellow-100
  'components-canvas-note-border': '#fde047', // yellow-300
  'components-canvas-note-border-selected': '#eab308', // yellow-500
  'components-canvas-note-title': '#a16207', // yellow-700
  'components-canvas-note-text': '#854d0e', // yellow-800

  // ===== 骨架与页面模板 =====
  'components-app-shell-bg': surfaces.light.canvas,
  'components-main-workbench-bg': surfaces.light.canvas,
  'components-main-workbench-surface': surfaces.light.surface,
  'components-main-workbench-border': surfaces.light.border,
  'components-page-header-bg': surfaces.light.surface,
  'components-page-header-border': surfaces.light.borderSubtle,
  'components-page-header-title': surfaces.light.text,
  'components-page-header-description': surfaces.light.secondary,
  'components-page-toolbar-bg': surfaces.light.surface,
  'components-page-toolbar-border': surfaces.light.borderSubtle,
  'components-page-toolbar-text': surfaces.light.secondary,
  'components-page-state-icon-bg': 'rgba(0, 0, 0, 0.04)',
  'components-page-state-icon': palette.light.selection,
  'components-page-state-title': surfaces.light.text,
  'components-page-state-description': surfaces.light.secondary,
  'components-settings-rail-bg': surfaces.light.surface,
  'components-settings-rail-border': surfaces.light.borderSubtle,
  'components-settings-rail-title': surfaces.light.text,
  'components-console-bg': surfaces.light.canvas,
  'components-console-surface': surfaces.light.surface,
  'components-console-border': surfaces.light.border,
  'components-workspace-bg': surfaces.light.canvas,
  'components-workspace-surface': surfaces.light.surface,
  'components-workspace-border': surfaces.light.border,
  'components-studio-bg': surfaces.light.canvas,
  'components-studio-surface': surfaces.light.surface,
  'components-studio-border': surfaces.light.border,
  'components-split-pane-bg': surfaces.light.canvas,
  'components-split-pane-border': surfaces.light.border,

  // ===== 设置页面专用 =====
  'components-settings-content-bg': surfaces.light.canvas,
  'components-settings-section-bg': surfaces.light.surface,
  'components-settings-section-border': surfaces.light.borderSubtle,
  'components-settings-section-title': surfaces.light.text,
  'components-settings-section-description': surfaces.light.secondary,

  // ===== 系统状态页面专用 =====
  'components-system-accent-bg': palette.light.selectionTint,
  'components-system-accent-border': palette.light.selection,
  'components-system-accent-text': palette.light.selectionText,
  'components-system-accent-soft': palette.light.selectionSoft,
  'components-system-page-bg': surfaces.light.canvas,
  'components-system-panel-bg': surfaces.light.surface,
  'components-system-panel-border': '#e5e7eb',
  'components-system-header-title': surfaces.light.text,
  'components-system-header-description': surfaces.light.secondary,
  'components-system-version-tag-bg': '#f3f4f6',
  'components-system-version-tag-border': surfaces.light.border,
  'components-system-version-tag-label': surfaces.light.secondary,
  'components-system-version-tag-value': surfaces.light.secondary,
  'components-system-section-title': surfaces.light.secondary,
  'components-system-section-divider': '#e5e7eb',
  'components-system-empty-bg': surfaces.light.canvas,
  'components-system-empty-border': '#e5e7eb',

  'components-system-status-card-bg': surfaces.light.surface,
  'components-system-status-card-border': '#e5e7eb',
  'components-system-status-card-border-hover': '#b7becb',

  'components-system-chart-grid': '#e5e7eb',
  'components-system-chart-axis': surfaces.light.secondary,
  'components-system-chart-tooltip-bg': '#ffffff',
  'components-system-chart-tooltip-border': '#e5e7eb',
  'components-system-chart-tooltip-text': surfaces.light.text,
  'components-system-chart-tooltip-muted': '#6b7280',
  'components-system-chart-lag': '#9ca3af',
  'components-system-chart-info-pill-bg': '#f3f4f6',
  'components-system-chart-info-pill-text': surfaces.light.secondary,
}

// 暗色主题令牌值定义
export const darkTokens: DesignTokens = {
  ...buildSurfaceTokens(surfaces.dark, palette.dark),
  ...buildStatusTokens(statusPalette.dark),
  ...buildStatusComponentTokens(statusPalette.dark),
  ...buildAvatarTokens(avatarPalette.dark),
  // ===== 文本系统 =====
  'text-primary': surfaces.dark.text,
  'text-secondary': surfaces.dark.secondary,
  'text-tertiary': surfaces.dark.tertiary,
  'text-muted': surfaces.dark.muted,
  'text-disabled': surfaces.dark.disabled,
  'text-accent': '#60a5fa',
  'text-inverted': '#111827',

  // ===== 背景系统 =====
  'background-body': surfaces.dark.body,
  'background-default': surfaces.dark.canvas,
  'background-subtle': surfaces.dark.subtle,
  'background-section': surfaces.dark.canvas,
  'background-overlay': 'rgba(0, 0, 0, 0.75)',
  'background-surface': surfaces.dark.surface,

  // ===== 边框系统 =====
  'border-default': surfaces.dark.border,
  'border-subtle': surfaces.dark.borderSubtle,
  'border-strong': surfaces.dark.borderStrong,
  'border-accent': palette.dark.focus,

  // ===== 按钮组件 - Primary =====
  'components-button-primary-bg': palette.dark.action,
  'components-button-primary-bg-hover': palette.dark.actionHover,
  'components-button-primary-bg-active': palette.dark.actionActive,
  'components-button-primary-bg-disabled': 'rgba(37, 99, 235, 0.16)',
  'components-button-primary-text': '#ffffff',
  'components-button-primary-text-disabled': 'rgba(255, 255, 255, 0.4)',
  'components-button-primary-border': palette.dark.action,
  'components-button-primary-border-hover': palette.dark.actionHover,

  // ===== 按钮组件 - Secondary =====
  'components-button-secondary-bg': 'rgba(255, 255, 255, 0.06)',
  'components-button-secondary-bg-hover': 'rgba(255, 255, 255, 0.1)',
  'components-button-secondary-text': '#ffffff',
  'components-button-secondary-border': 'rgba(255, 255, 255, 0.1)',
  'components-button-secondary-border-hover': 'rgba(255, 255, 255, 0.2)',

  // ===== 按钮组件 - Ghost =====
  'components-button-ghost-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-button-ghost-text': '#ffffff',
  'components-button-ghost-text-disabled': 'rgba(255, 255, 255, 0.4)',

  // ===== 输入框组件 =====
  'components-input-bg': 'rgba(255, 255, 255, 0.06)',
  'components-input-bg-hover': 'rgba(255, 255, 255, 0.09)',
  'components-input-bg-focus': 'rgba(255, 255, 255, 0.12)',
  'components-input-border': surfaces.dark.inputBorder,
  'components-input-border-hover': surfaces.dark.inputBorderHover,
  'components-input-border-focus': palette.dark.focus,
  'components-input-text': surfaces.dark.text,
  'components-input-text-placeholder': surfaces.dark.tertiary,
  'components-input-text-disabled': surfaces.dark.disabled,
  'components-input-bg-disabled': 'rgba(255, 255, 255, 0.04)',

  // ===== 卡片组件 =====
  'components-card-bg': surfaces.dark.surface,
  'components-card-bg-hover': '#292c32',
  'components-card-border': 'rgba(255, 255, 255, 0.12)',

  // ===== 侧边栏组件 =====
  'components-sidebar-bg': surfaces.dark.canvas,
  'components-sidebar-border': 'rgba(255, 255, 255, 0.10)',
  'components-sidebar-item-bg': 'transparent',
  'components-sidebar-item-bg-hover': 'rgba(255, 255, 255, 0.07)',
  'components-sidebar-item-bg-active': 'rgba(255, 255, 255, 0.10)',
  'components-sidebar-item-text': surfaces.dark.tertiary,
  'components-sidebar-item-text-active': surfaces.dark.text,

  // ===== 导航组件 =====
  'components-nav-bg': surfaces.dark.canvas,
  'components-nav-item-text': surfaces.dark.tertiary,

  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': surfaces.dark.elevated,
  'components-dropdown-border': 'rgba(255, 255, 255, 0.14)',
  'components-dropdown-item-bg-hover': 'rgba(255, 255, 255, 0.07)',
  'components-dropdown-item-text': surfaces.dark.text,

  // ===== 表格组件 =====
  'components-table-bg': surfaces.dark.surface,
  'components-table-border': 'rgba(255, 255, 255, 0.12)',
  'components-table-row-bg-hover': 'rgba(255, 255, 255, 0.06)',

  // ===== 交互状态 =====
  'state-hover': 'rgba(255, 255, 255, 0.07)',
  'state-active': 'rgba(255, 255, 255, 0.14)',
  'state-focus': palette.dark.focus,
  'state-selected': palette.dark.selection,
  'state-selected-text': palette.dark.selectionText,
  'state-selected-bg': palette.dark.selectionTint,
  'state-disabled': 'rgba(255, 255, 255, 0.06)',

  // ===== 状态透明度变体 (10% opacity) =====
  'state-focus-10': palette.dark.selectionTint,
  'state-neutral-10': 'rgba(161, 161, 170, 0.12)',
  // 语义化别名（subtle = 10% opacity）
  'state-focus-subtle': palette.dark.selectionTint,

  // ===== 数据可视化分类调色板 (data-viz categorical) =====
  // 思维导图/图表/知识图谱的分类层级着色（非反馈、非交互）。10 个彼此区分、可读的色相：
  // sky / emerald / indigo / amber / red / violet / pink / orange / blue / lime。
  // 1-5 沿用历史 mindmap 配色；6 取分类紫（与 NODE_COLORS 兜底意图一致），避免与 slot-1 蓝撞色，
  // 替换历史误继承的 text-accent 蓝。7-10 取知识图谱旧 dark palette 成熟色相并补一档 lime。
  // mindmap 用 1-6，知识图谱实体类型色用 1-10。
  // 色盲安全 / 感知均匀的 OKLCH 生成 scale（dark，L≈0.74 C≈0.123，hue 环与 light 同）。
  // 各档对暗底画布(#202025) ≥3:1，相邻档在 protan/deutan/tritan 下仍可区分。
  // provenance: scripts/gen-categorical-oklch.mjs。
  'data-viz-categorical-1': '#ee8a8a',
  'data-viz-categorical-2': '#17c2c9',
  'data-viz-categorical-3': '#c7a844',
  'data-viz-categorical-4': '#90a5f8',
  'data-viz-categorical-5': '#52c396',
  'data-viz-categorical-6': '#e18abe',
  'data-viz-categorical-7': '#e6955a',
  'data-viz-categorical-8': '#51b6ee',
  'data-viz-categorical-9': '#94b962',
  'data-viz-categorical-10': '#c095e7',

  // ===== HTTP方法颜色系统 =====
  'components-method-post-bg': 'rgba(59, 130, 246, 0.2)',
  'components-method-post-text': '#60a5fa',
  'components-method-post-border': '#3b82f6',
  'components-method-patch-bg': 'rgba(168, 85, 247, 0.2)',
  'components-method-patch-text': '#c084fc',
  'components-method-patch-border': '#a855f7',

  // ===== 表单控件：品牌选中态 =====
  'components-checkbox-bg': 'rgba(255, 255, 255, 0.06)',
  'components-checkbox-bg-checked': palette.dark.selection,
  'components-checkbox-border': '#4b5563',
  'components-checkbox-border-checked': palette.dark.selection,
  'components-checkbox-icon': '#ffffff',

  'components-radio-bg': 'rgba(255, 255, 255, 0.06)',
  'components-radio-bg-checked': 'rgba(255, 255, 255, 0.06)',
  'components-radio-border': '#4b5563',
  'components-radio-border-checked': palette.dark.selection,
  'components-radio-dot': palette.dark.selection,

  'components-select-bg': 'rgba(255, 255, 255, 0.06)',
  'components-select-border': '#4b5563',
  'components-select-border-focus': palette.dark.focus,
  'components-select-text': surfaces.dark.text,
  'components-select-placeholder': surfaces.dark.tertiary,

  'components-switch-bg': 'rgba(255, 255, 255, 0.1)',
  'components-switch-bg-checked': palette.dark.selection,
  'components-switch-thumb': '#ffffff',

  // ===== 滑块组件 =====
  'components-slider-track': 'rgba(255, 255, 255, 0.25)',
  'components-slider-range': palette.dark.selection,
  'components-slider-thumb': '#ffffff',
  'components-slider-thumb-border': palette.dark.selection,

  // ===== 滚动条系统 =====
  'components-scrollbar-track': 'rgba(255, 255, 255, 0.06)',
  'components-scrollbar-thumb': 'rgba(255, 255, 255, 0.24)',
  'components-scrollbar-thumb-hover': 'rgba(255, 255, 255, 0.34)',

  // ===== 对话框和覆盖层 =====
  'components-dialog-bg': surfaces.dark.surface,
  'components-dialog-border': 'rgba(255, 255, 255, 0.14)',
  'components-dialog-overlay': 'rgba(0, 0, 0, 0.75)',

  'components-popover-bg': surfaces.dark.elevated,

  'components-tooltip-bg': '#0f172a',
  'components-tooltip-text': surfaces.dark.text,

  // ===== 导航和标签 =====
  'components-tabs-border': '#475569',
  'components-tabs-bg': 'rgba(255, 255, 255, 0.06)',
  'components-tabs-active-bg': palette.dark.selectionTint,
  'components-tabs-active-text': palette.dark.selectionText,
  'components-tabs-inactive-text': surfaces.dark.secondary,

  // ===== 加载和进度 =====
  'components-skeleton-bg': 'rgba(255, 255, 255, 0.1)',
  'components-progress-bg': 'rgba(255, 255, 255, 0.1)',
  'components-progress-fill': palette.dark.selection,
  'components-spinner-color': palette.dark.selection,

  // ===== 代码和预格式化文本 =====
  'components-code-bg': 'rgba(110, 118, 129, 0.15)',
  'components-code-text': '#79c0ff',
  'components-code-border': 'rgba(110, 118, 129, 0.2)',

  'components-pre-bg': '#161b22',
  'components-pre-text': '#e6edf3',
  'components-pre-border': '#30363d',

  // ===== 工具调用组件 =====
  'components-tool-call-bg': 'rgba(59, 130, 246, 0.1)', // 蓝色半透明背景
  'components-tool-call-border': 'rgba(59, 130, 246, 0.3)', // 蓝色半透明边框
  'components-tool-call-title': '#93c5fd', // 浅蓝色标题文字

  // ===== 新增组件令牌的暗色版本 =====
  // 徽章和标签
  'components-badge-bg': 'rgba(255, 255, 255, 0.1)',
  'components-badge-text': '#e5e7eb',
  'components-badge-border': '#475569',
  'components-badge-neutral-bg': 'rgba(156, 163, 175, 0.15)',
  'components-badge-neutral-text': '#9ca3af',
  'components-badge-blue-bg': 'rgba(59, 130, 246, 0.2)',
  'components-badge-blue-text': '#93c5fd',
  'components-badge-orange-bg': 'rgba(249, 115, 22, 0.2)',
  'components-badge-orange-text': '#fdba74',
  'components-badge-purple-bg': 'rgba(168, 85, 247, 0.2)',
  'components-badge-purple-text': '#c4b5fd',
  'components-badge-green-bg': 'rgba(34, 197, 94, 0.2)',
  'components-badge-green-text': '#86efac',

  // ===== 头像渐变系统 - 暗色主题 =====
  // 任务状态指示器 - 暗色主题
  'components-task-status-idle-bg': 'rgba(161, 161, 170, 0.08)',
  'components-task-status-idle-border': 'rgba(161, 161, 170, 0.15)',
  'components-task-status-idle-text': '#a1a1aa',
  'components-task-status-idle-dot': '#71717a',

  'components-task-status-running-bg': palette.dark.selectionTint,
  'components-task-status-running-border': palette.dark.selectionTint,
  'components-task-status-running-text': palette.dark.selectionText,
  'components-task-status-running-dot': palette.dark.selection,
  'components-task-status-running-progress-bg': 'rgba(161, 161, 170, 0.15)',
  'components-task-status-running-progress-fill': palette.dark.selection,
  'components-task-status-running-progress-glow': palette.dark.selectionSoft,

  'components-tag-bg': 'rgba(255, 255, 255, 0.08)',
  'components-tag-text': '#e4e4e7',
  'components-tag-border': 'rgba(255, 255, 255, 0.12)',

  // 分页器
  'components-pagination-bg': '#1a1a1a',
  'components-pagination-text': surfaces.dark.tertiary,
  'components-pagination-border': 'rgba(255, 255, 255, 0.10)',
  'components-pagination-item-bg': 'rgba(255, 255, 255, 0.05)',
  'components-pagination-item-bg-hover': 'rgba(255, 255, 255, 0.08)',
  'components-pagination-item-bg-active': palette.dark.action,
  'components-pagination-item-text': surfaces.dark.text,
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-text': '#52525b',

  // 步骤器
  'components-steps-active-bg': palette.dark.action,
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': 'rgba(255, 255, 255, 0.05)',
  'components-steps-inactive-text': surfaces.dark.tertiary,
  'components-steps-line': 'rgba(255, 255, 255, 0.10)',

  // 其余组件令牌暗色适配
  'components-loader-primary': palette.dark.selection,

  'components-collapse-header-bg-hover': 'rgba(255, 255, 255, 0.06)',

  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': palette.dark.selectionTint,
  'components-upload-border': 'rgba(255, 255, 255, 0.15)',
  'components-upload-border-hover': 'rgba(255, 255, 255, 0.25)',
  'components-upload-border-dragover': palette.dark.focus,
  'components-upload-text': surfaces.dark.text,
  'components-upload-text-secondary': surfaces.dark.tertiary,
  'components-upload-icon': '#52525b',

  'components-segmented-bg': 'rgba(255, 255, 255, 0.05)',
  'components-segmented-border': 'rgba(255, 255, 255, 0.10)',
  'components-segmented-item-bg': 'transparent',
  'components-segmented-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-segmented-item-bg-active': palette.dark.selectionTint,
  'components-segmented-item-text': surfaces.dark.tertiary,
  'components-segmented-item-text-active': palette.dark.selectionText,

  'components-card-meta-title': surfaces.dark.text,
  'components-card-meta-description': surfaces.dark.tertiary,

  // ===== 聊天页面专用布局 =====
  'chat-header-bg': surfaces.dark.surface,
  'chat-header-border': surfaces.dark.borderSubtle,
  'chat-content-bg': surfaces.dark.surface,
  'chat-welcome-border': palette.dark.selectionTint,

  // ===== 图标按钮 =====
  'components-icon-button-bg-hover': 'rgba(255, 255, 255, 0.06)',

  // ===== 聊天气泡和头像 =====
  'chat-bubble-user-bg': surfaces.dark.subtle,
  'chat-bubble-user-text': surfaces.dark.text,

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': 'rgba(26, 26, 26, 0.80)',
  'components-glassmorphism-border': 'rgba(255, 255, 255, 0.10)',

  // ===== 画布系统 (Agent Canvas) - 暗色主题 =====
  // 画布背景
  'components-canvas-bg': 'rgb(18, 18, 18)',
  'components-canvas-grid': 'rgba(255, 255, 255, 0.12)',
  'components-canvas-spotlight': '#ffffff',

  // 节点通用
  'components-canvas-node-bg': '#202025',
  'components-canvas-node-border': 'rgba(255, 255, 255, 0.1)',
  'components-canvas-node-border-selected': palette.dark.selection,

  // 边线
  'components-canvas-edge-stroke-selected': palette.dark.selection,
  'components-canvas-edge-marker': 'rgb(113, 113, 122)',
  'components-canvas-edge-marker-selected': palette.dark.selection,

  // 连接点
  'components-canvas-handle-bg': palette.dark.selection,
  'components-canvas-handle-icon': '#ffffff',

  // 节点类型图标颜色（暗色主题 - 适当调亮）
  'components-canvas-icon-start': '#4ade80', // green-400
  'components-canvas-icon-retrieval': '#60a5fa', // blue-400
  'components-canvas-icon-message': '#2dd4bf', // teal-400
  'components-canvas-icon-tool': '#fb923c', // orange-400
  'components-canvas-icon-file': '#4ade80', // green-400
  'components-canvas-icon-splitter': '#fb923c', // orange-400
  'components-canvas-icon-tokenizer': '#c084fc', // purple-400

  // 占位符/骨架屏
  'components-canvas-skeleton-bg': 'rgba(255, 255, 255, 0.1)',

  // 笔记节点
  'components-canvas-note-bg': 'rgba(234, 179, 8, 0.15)', // yellow with opacity
  'components-canvas-note-border': 'rgba(250, 204, 21, 0.4)', // yellow-400 with opacity
  'components-canvas-note-border-selected': '#facc15', // yellow-400
  'components-canvas-note-title': '#fde047', // yellow-300
  'components-canvas-note-text': '#fef08a', // yellow-200

  // ===== 骨架与页面模板 =====
  'components-app-shell-bg': surfaces.dark.canvas,
  'components-main-workbench-bg': surfaces.dark.canvas,
  'components-main-workbench-surface': surfaces.dark.surface,
  'components-main-workbench-border': surfaces.dark.border,
  'components-page-header-bg': surfaces.dark.surface,
  'components-page-header-border': surfaces.dark.borderSubtle,
  'components-page-header-title': surfaces.dark.text,
  'components-page-header-description': surfaces.dark.secondary,
  'components-page-toolbar-bg': surfaces.dark.surface,
  'components-page-toolbar-border': surfaces.dark.borderSubtle,
  'components-page-toolbar-text': surfaces.dark.secondary,
  'components-page-state-icon-bg': 'rgba(255, 255, 255, 0.07)',
  'components-page-state-icon': palette.dark.selection,
  'components-page-state-title': surfaces.dark.text,
  'components-page-state-description': surfaces.dark.secondary,
  'components-settings-rail-bg': surfaces.dark.surface,
  'components-settings-rail-border': surfaces.dark.borderSubtle,
  'components-settings-rail-title': surfaces.dark.text,
  'components-console-bg': surfaces.dark.canvas,
  'components-console-surface': surfaces.dark.surface,
  'components-console-border': surfaces.dark.border,
  'components-workspace-bg': surfaces.dark.canvas,
  'components-workspace-surface': surfaces.dark.surface,
  'components-workspace-border': surfaces.dark.border,
  'components-studio-bg': surfaces.dark.canvas,
  'components-studio-surface': surfaces.dark.surface,
  'components-studio-border': surfaces.dark.border,
  'components-split-pane-bg': surfaces.dark.canvas,
  'components-split-pane-border': surfaces.dark.border,

  // ===== 设置页面专用 =====
  'components-settings-content-bg': surfaces.dark.canvas,
  'components-settings-section-bg': surfaces.dark.surface,
  'components-settings-section-border': surfaces.dark.borderSubtle,
  'components-settings-section-title': surfaces.dark.text,
  'components-settings-section-description': surfaces.dark.secondary,

  // ===== 系统状态页面专用 =====
  'components-system-accent-bg': palette.dark.selectionTint,
  'components-system-accent-border': palette.dark.selection,
  'components-system-accent-text': palette.dark.selectionText,
  'components-system-accent-soft': palette.dark.selectionSoft,
  'components-system-page-bg': surfaces.dark.canvas,
  'components-system-panel-bg': surfaces.dark.surface,
  'components-system-panel-border': 'rgba(255, 255, 255, 0.10)',
  'components-system-header-title': surfaces.dark.text,
  'components-system-header-description': surfaces.dark.secondary,
  'components-system-version-tag-bg': 'rgba(255, 255, 255, 0.05)',
  'components-system-version-tag-border': 'rgba(255, 255, 255, 0.10)',
  'components-system-version-tag-label': surfaces.dark.secondary,
  'components-system-version-tag-value': surfaces.dark.text,
  'components-system-section-title': surfaces.dark.secondary,
  'components-system-section-divider': 'rgba(255, 255, 255, 0.10)',
  'components-system-empty-bg': surfaces.dark.canvas,
  'components-system-empty-border': 'rgba(255, 255, 255, 0.10)',

  'components-system-status-card-bg': surfaces.dark.surface,
  'components-system-status-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-system-status-card-border-hover': 'rgba(255, 255, 255, 0.2)',

  'components-system-chart-grid': 'rgba(255, 255, 255, 0.10)',
  'components-system-chart-axis': surfaces.dark.secondary,
  'components-system-chart-tooltip-bg': '#1e1e1e',
  'components-system-chart-tooltip-border': 'rgba(255, 255, 255, 0.12)',
  'components-system-chart-tooltip-text': surfaces.dark.text,
  'components-system-chart-tooltip-muted': '#a1a1aa',
  'components-system-chart-lag': '#94a3b8',
  'components-system-chart-info-pill-bg': 'rgba(255, 255, 255, 0.05)',
  'components-system-chart-info-pill-text': surfaces.dark.tertiary,
}

/**
 * 验证设计令牌完整性
 */
export function validateTokens(tokens: DesignTokens): string[] {
  const errors: string[] = []
  const tokenKeys = Object.keys(tokens) as (keyof DesignTokens)[]

  // 检查空值
  tokenKeys.forEach((key) => {
    if (!tokens[key] || tokens[key].trim() === '') {
      errors.push(`设计令牌 "${key}" 值不能为空`)
    }
  })

  // 检查颜色值格式（跳过阴影、渐变、滤镜等非颜色类令牌）
  tokenKeys.forEach((key) => {
    const value = tokens[key]
    if (!value) return
    const keyStr = String(key)

    // 跳过不需要颜色验证的特殊令牌
    if (
      keyStr.includes('shadow') ||
      keyStr.includes('gradient') ||
      keyStr.includes('backdrop') ||
      value.startsWith('blur(') ||
      value.startsWith('linear-gradient(') ||
      value.startsWith('radial-gradient(')
    ) {
      return
    }

    if (!isValidColor(value)) {
      errors.push(`设计令牌 "${key}" 的值 "${value}" 不是有效的颜色格式`)
    }
  })

  return errors
}

/**
 * 验证颜色格式是否有效
 */
function isValidColor(color: string): boolean {
  // 支持的颜色格式：
  // #hex, rgba(), rgb(), hsl(), hsla(), 命名颜色, CSS变量
  const colorRegex =
    /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\([^)]+\)|transparent|inherit|currentColor|[a-zA-Z]+)$/
  return colorRegex.test(color.trim())
}

/** Typed JavaScript values and CSS share the same preset role mapping. */
export function generateTokenValuesModule(): string {
  return generatePresetValuesModule({ light: lightTokens, dark: darkTokens })
}

export function generateThemeFiles(): {
  light: string
  dark: string
  tokenValues: string
  errors: string[]
} {
  const base = { light: lightTokens, dark: darkTokens }
  const errors = Object.entries(createPresetTokenSets(base)).flatMap(
    ([preset, modes]) =>
      Object.entries(modes).flatMap(([mode, tokens]) =>
        validateTokens(tokens).map((error) => `${preset}/${mode}: ${error}`),
      ),
  )
  return {
    light: generatePresetCSS(base, 'light'),
    dark: generatePresetCSS(base, 'dark'),
    tokenValues: generatePresetValuesModule(base),
    errors,
  }
}
