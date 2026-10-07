/**
 * 自动化主题生成工具
 * 基于 Dify 项目的设计令牌系统
 * 自动生成 light.css 和 dark.css 文件，确保一致性
 */

import type { DesignTokens } from './tokens'
import { interactionPalette as palette } from './interaction-palette'
import { surfacePalette as surfaces } from './surface-palette'
import { buildSurfaceTokens } from './surface-tokens'
import { generateThemeCSS } from './theme-css-generator'
export { generateThemeCSS } from './theme-css-generator'
export const lightTokens: DesignTokens = {
  ...buildSurfaceTokens(surfaces.light, palette.light),
  // ===== 文本系统 =====
  'text-primary': surfaces.light.text,
  'text-secondary': surfaces.light.secondary,
  'text-tertiary': surfaces.light.tertiary,
  'text-muted': surfaces.light.muted,
  'text-disabled': surfaces.light.disabled,
  'text-accent': '#1a1a1a',
  'text-success': '#037152',
  'text-warning': '#a64a00',
  'text-error': '#b91c1c',
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
  'border-success': '#10b981',
  'border-warning': '#f59e0b',
  'border-error': '#ef4444',

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
  'components-button-secondary-bg-active': '#ececf0',
  'components-button-secondary-bg-disabled': '#f3f3f5',
  'components-button-secondary-text': '#030213',
  'components-button-secondary-text-disabled': '#9ca3af',
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
  'components-input-bg-disabled': '#f5f5f5',
  'components-input-border': surfaces.light.inputBorder,
  'components-input-border-hover': surfaces.light.inputBorderHover,
  'components-input-border-focus': palette.light.focus,
  'components-input-border-error': '#ef4444',
  'components-input-text': surfaces.light.text,
  'components-input-text-placeholder': surfaces.light.tertiary,
  'components-input-text-disabled': surfaces.light.disabled,

  // ===== 卡片组件 =====
  'components-card-bg': surfaces.light.surface,
  'components-card-bg-hover': '#fafafa',
  'components-card-border': 'rgba(0, 0, 0, 0.08)',
  'components-card-shadow':
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',

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
  'components-nav-border': '#e5e7eb',
  'components-nav-item-text': surfaces.light.secondary,
  'components-nav-item-text-hover': surfaces.light.secondary,
  'components-nav-item-text-active': palette.light.selectionText,

  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': surfaces.light.elevated,
  'components-dropdown-border': '#e5e7eb',
  'components-dropdown-shadow':
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'components-dropdown-item-bg-hover': '#f3f4f6',
  'components-dropdown-item-text': surfaces.light.secondary,

  // ===== 模型选择器组件 =====
  'components-model-selector-dropdown-bg': surfaces.light.elevated,
  'components-model-selector-dropdown-border': '#e5e7eb',
  'components-model-selector-dropdown-shadow':
    '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'components-model-selector-search-bg': '#f9fafb',
  'components-model-selector-search-border': '#d1d5db',
  'components-model-selector-search-text': surfaces.light.text,
  'components-model-selector-provider-header-bg': '#f3f4f6',
  'components-model-selector-provider-header-border': '#e5e7eb',
  'components-model-selector-provider-header-text': surfaces.light.secondary,
  'components-model-selector-item-bg': '#ffffff',
  'components-model-selector-item-border': '#e5e7eb',
  'components-model-selector-item-text': surfaces.light.secondary,
  'components-model-selector-item-bg-hover': '#f3f4f6',
  'components-model-selector-item-bg-selected': palette.light.selectionTint,
  'components-model-selector-item-text-selected': palette.light.selectionText,
  'components-model-selector-overlay-bg': 'rgba(0, 0, 0, 0.3)',

  // ===== 模态框组件 =====
  'components-modal-bg': surfaces.light.surface,
  'components-modal-overlay': 'rgba(0, 0, 0, 0.5)',
  'components-modal-border': '#e5e7eb',
  'components-modal-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',

  // ===== 表格组件 =====
  'components-table-bg': surfaces.light.surface,
  'components-table-border': '#e5e7eb',
  'components-table-header-bg': surfaces.light.canvas,
  'components-table-row-bg-hover': '#f9fafb',
  'components-table-row-bg-selected': palette.light.selectionTint,

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

  // ===== 反馈状态 status-* (canonical feedback palette) =====
  'status-success': '#10b981',
  'status-warning': '#f59e0b',
  'status-error': '#ef4444',
  'status-info': '#0ea5e9',
  'status-success-10': 'rgba(16, 185, 129, 0.1)',
  'status-warning-10': 'rgba(245, 158, 11, 0.1)',
  'status-error-10': 'rgba(239, 68, 68, 0.1)',
  'status-info-10': 'rgba(14, 165, 233, 0.1)',
  'status-success-subtle': 'rgba(16, 185, 129, 0.1)',
  'status-warning-subtle': 'rgba(245, 158, 11, 0.1)',
  'status-error-subtle': 'rgba(239, 68, 68, 0.1)',
  'status-info-subtle': 'rgba(14, 165, 233, 0.1)',

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
  'components-method-get-bg': 'rgba(34, 197, 94, 0.1)',
  'components-method-get-text': '#166534',
  'components-method-get-border': '#22c55e',
  'components-method-post-bg': 'rgba(59, 130, 246, 0.1)',
  'components-method-post-text': '#026f6a',
  'components-method-post-border': '#33D4CB',
  'components-method-put-bg': 'rgba(245, 158, 11, 0.1)',
  'components-method-put-text': '#a64a00',
  'components-method-put-border': '#f59e0b',
  'components-method-delete-bg': 'rgba(239, 68, 68, 0.1)',
  'components-method-delete-text': '#b91c1c',
  'components-method-delete-border': '#ef4444',
  'components-method-patch-bg': 'rgba(168, 85, 247, 0.1)',
  'components-method-patch-text': '#7c3aed',
  'components-method-patch-border': '#a855f7',

  // ===== 环境状态指示器 =====
  'components-env-prod-bg': '#047857',
  'components-env-prod-text': '#ffffff',
  'components-env-staging-bg': '#b45309',
  'components-env-staging-text': '#ffffff',
  'components-env-dev-bg': '#007670',
  'components-env-dev-text': '#ffffff',

  // ===== 阴影系统 =====
  'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'shadow-md':
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'shadow-lg':
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'shadow-xl':
    '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',

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
  'components-switch-thumb-checked': '#ffffff',

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
  'components-dialog-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'components-dialog-overlay': 'rgba(0, 0, 0, 0.5)',

  'components-popover-bg': surfaces.light.elevated,
  'components-popover-border': '#e5e7eb',
  'components-popover-shadow':
    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',

  'components-tooltip-bg': '#1f2937',
  'components-tooltip-text': '#ffffff',
  'components-tooltip-shadow':
    '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

  // ===== 导航和标签 =====
  'components-tabs-border': '#e5e7eb',
  'components-tabs-bg': '#f5f5f5',
  'components-tabs-active-bg': palette.light.selectionTint,
  'components-tabs-active-text': palette.light.selectionText,
  'components-tabs-inactive-text': surfaces.light.tertiary,

  'components-breadcrumb-text': surfaces.light.secondary,
  'components-breadcrumb-text-current': surfaces.light.text,
  'components-breadcrumb-separator': '#9ca3af',

  // ===== 状态和通知 =====
  'components-alert-info-bg': '#eff6ff',
  'components-alert-info-border': '#00BEB4',
  'components-alert-info-text': '#007670',

  'components-alert-success-bg': '#f0fdf4',
  'components-alert-success-border': '#22c55e',
  'components-alert-success-text': '#15803d',

  'components-alert-warning-bg': '#fffbeb',
  'components-alert-warning-border': '#f59e0b',
  'components-alert-warning-text': '#b45309',

  'components-alert-error-bg': '#fef2f2',
  'components-alert-error-border': '#ef4444',
  'components-alert-error-text': '#b91c1c',

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
  'components-tool-call-content-bg': '#1e293b', // 深色内容区背景
  'components-tool-call-content-text': '#e2e8f0', // 浅色内容文字

  // ===== 新增组件令牌（使用基础颜色映射） =====
  // 徽章和标签
  'components-badge-bg': '#f5f5f5',
  'components-badge-text': surfaces.light.tertiary,
  'components-badge-border': '#eaeaea',
  'components-badge-success-bg': '#dcfce7',
  'components-badge-success-text': '#166534',
  'components-badge-warning-bg': '#fef3c7',
  'components-badge-warning-text': '#92400e',
  'components-badge-error-bg': '#fee2e2',
  'components-badge-error-text': '#991b1b',
  'components-badge-info-bg': '#dbeafe',
  'components-badge-info-text': '#1e40af',
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

  // ===== 统计卡片组件 - 亮色主题 =====
  // 蓝色卡片 - 信息/总量
  'components-stats-card-blue-bg':
    'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(14, 165, 233, 0.08))',
  'components-stats-card-blue-icon-bg':
    'linear-gradient(135deg, #dbeafe, #e0f2fe)',
  'components-stats-card-blue-icon-text': '#2563eb',
  'components-stats-card-blue-shadow':
    '0 8px 24px -4px rgba(59, 130, 246, 0.25), 0 4px 8px -2px rgba(59, 130, 246, 0.1)',
  'components-stats-card-blue-border-hover': 'rgba(59, 130, 246, 0.4)',
  // 绿色卡片 - 成功/活跃
  'components-stats-card-green-bg':
    'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.08))',
  'components-stats-card-green-icon-bg':
    'linear-gradient(135deg, #dcfce7, #d1fae5)',
  'components-stats-card-green-icon-text': '#16a34a',
  'components-stats-card-green-shadow':
    '0 8px 24px -4px rgba(34, 197, 94, 0.25), 0 4px 8px -2px rgba(34, 197, 94, 0.1)',
  'components-stats-card-green-border-hover': 'rgba(34, 197, 94, 0.4)',
  // 紫色卡片 - 特殊/高级
  'components-stats-card-purple-bg':
    'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(168, 85, 247, 0.08))',
  'components-stats-card-purple-icon-bg':
    'linear-gradient(135deg, #ede9fe, #f3e8ff)',
  'components-stats-card-purple-icon-text': '#7c3aed',
  'components-stats-card-purple-shadow':
    '0 8px 24px -4px rgba(139, 92, 246, 0.25), 0 4px 8px -2px rgba(139, 92, 246, 0.1)',
  'components-stats-card-purple-border-hover': 'rgba(139, 92, 246, 0.4)',
  // 橙色卡片 - 警告/待处理
  'components-stats-card-orange-bg':
    'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(245, 158, 11, 0.08))',
  'components-stats-card-orange-icon-bg':
    'linear-gradient(135deg, #ffedd5, #fef3c7)',
  'components-stats-card-orange-icon-text': '#ea580c',
  'components-stats-card-orange-shadow':
    '0 8px 24px -4px rgba(249, 115, 22, 0.25), 0 4px 8px -2px rgba(249, 115, 22, 0.1)',
  'components-stats-card-orange-border-hover': 'rgba(249, 115, 22, 0.4)',

  // ===== 头像渐变系统 - 亮色主题 =====
  // 参考现代 AI 项目（Notion、Linear、Dify）的柔和配色，降低饱和度
  'components-avatar-gradient-purple-from': '#A78BFA', // violet-400，柔和紫
  'components-avatar-gradient-purple-to': '#C4B5FD', // violet-300，浅紫
  'components-avatar-gradient-blue-from': '#60A5FA', // blue-400，柔和蓝
  'components-avatar-gradient-blue-to': '#93C5FD', // blue-300，浅蓝
  'components-avatar-gradient-green-from': '#4ADE80', // green-400，柔和绿
  'components-avatar-gradient-green-to': '#86EFAC', // green-300，浅绿
  'components-avatar-gradient-orange-from': '#FB923C', // orange-400，柔和橙
  'components-avatar-gradient-orange-to': '#FDBA74', // orange-300，浅橙
  'components-avatar-gradient-indigo-from': '#818CF8', // indigo-400，柔和靛蓝
  'components-avatar-gradient-indigo-to': '#A5B4FC', // indigo-300，浅靛蓝
  'components-avatar-gradient-rose-from': '#FB7185', // rose-400，柔和玫红
  'components-avatar-gradient-rose-to': '#FDA4AF', // rose-300，浅玫红
  'components-avatar-gradient-teal-from': '#2DD4BF', // teal-400，柔和青绿
  'components-avatar-gradient-teal-to': '#5EEAD4', // teal-300，浅青绿
  'components-avatar-gradient-amber-from': '#FBBF24', // amber-400，柔和琥珀
  'components-avatar-gradient-amber-to': '#FCD34D', // amber-300，浅琥珀

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

  'components-task-status-cancelled-bg': 'rgba(245, 158, 11, 0.1)',
  'components-task-status-cancelled-border': 'rgba(245, 158, 11, 0.2)',
  'components-task-status-cancelled-text': '#a64a00',
  'components-task-status-cancelled-dot': '#f59e0b',

  'components-task-status-completed-bg': 'rgba(16, 185, 129, 0.1)',
  'components-task-status-completed-border': 'rgba(16, 185, 129, 0.2)',
  'components-task-status-completed-text': '#037152',
  'components-task-status-completed-dot': '#10b981',

  'components-task-status-failed-bg': 'rgba(239, 68, 68, 0.1)',
  'components-task-status-failed-border': 'rgba(239, 68, 68, 0.2)',
  'components-task-status-failed-text': '#b91c1c',
  'components-task-status-failed-dot': '#ef4444',

  'components-tag-bg': '#f3f4f6',
  'components-tag-text': surfaces.light.secondary,
  'components-tag-border': surfaces.light.border,
  'components-tag-bg-hover': surfaces.light.subtle,
  'components-tag-close-hover': '#dc2626',

  // 分页器
  'components-pagination-bg': '#ffffff',
  'components-pagination-text': surfaces.light.secondary,
  'components-pagination-border': '#e5e7eb',
  'components-pagination-item-bg': '#ffffff',
  'components-pagination-item-bg-hover': '#f9fafb',
  'components-pagination-item-bg-active': palette.light.action,
  'components-pagination-item-text': surfaces.light.secondary,
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-bg': '#f9fafb',
  'components-pagination-disabled-text': '#d1d5db',

  // 步骤器
  'components-steps-bg': '#ffffff',
  'components-steps-border': '#e5e7eb',
  'components-steps-completed-bg': '#047857',
  'components-steps-completed-text': '#ffffff',
  'components-steps-active-bg': palette.light.action,
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': '#f3f3f5',
  'components-steps-inactive-text': surfaces.light.secondary,
  'components-steps-line': '#e5e7eb',
  'components-steps-line-completed': '#10b981',

  // 其余新增组件令牌使用合适的基础颜色
  'components-loader-primary': palette.light.selection,
  'components-loader-secondary': '#d1d5db',
  'components-skeleton-base': '#f3f4f6',
  'components-skeleton-shimmer': '#ffffff',
  'components-skeleton-text': surfaces.light.tertiary,

  'components-divider-bg': '#e5e7eb',
  'components-divider-text': surfaces.light.tertiary,

  'components-timeline-line': '#e5e7eb',
  'components-timeline-dot': '#d1d5db',
  'components-timeline-dot-active': palette.light.selection,
  'components-timeline-content-bg': '#ffffff',
  'components-timeline-content-border': '#e5e7eb',

  'components-calendar-bg': '#ffffff',
  'components-calendar-border': '#e5e7eb',
  'components-calendar-header-bg': '#f9fafb',
  'components-calendar-header-text': surfaces.light.secondary,
  'components-calendar-cell-bg': '#ffffff',
  'components-calendar-cell-text': surfaces.light.secondary,
  'components-calendar-cell-bg-hover': '#f3f4f6',
  'components-calendar-cell-bg-selected': palette.light.selection,
  'components-calendar-cell-text-selected': '#ffffff',
  'components-calendar-cell-bg-today': palette.light.selectionTint,
  'components-calendar-cell-text-today': palette.light.selectionText,
  'components-calendar-cell-bg-disabled': '#f9fafb',
  'components-calendar-cell-text-disabled': '#d1d5db',

  'components-drawer-bg': '#ffffff',
  'components-drawer-overlay': 'rgba(0, 0, 0, 0.5)',
  'components-drawer-border': '#e5e7eb',
  'components-drawer-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  'components-drawer-header-bg': '#f9fafb',
  'components-drawer-header-border': '#e5e7eb',

  'components-collapse-bg': '#ffffff',
  'components-collapse-border': '#e5e7eb',
  'components-collapse-header-bg': '#f9fafb',
  'components-collapse-header-bg-hover': '#f3f4f6',
  'components-collapse-header-text': surfaces.light.secondary,
  'components-collapse-content-bg': '#ffffff',
  'components-collapse-content-border': '#e5e7eb',

  'components-tree-bg': '#ffffff',
  'components-tree-border': '#e5e7eb',
  'components-tree-node-bg': 'transparent',
  'components-tree-node-bg-hover': '#f3f4f6',
  'components-tree-node-bg-selected': palette.light.selectionTint,
  'components-tree-node-text': surfaces.light.secondary,
  'components-tree-node-text-selected': palette.light.selectionText,
  'components-tree-indent-line': '#e5e7eb',
  'components-tree-expand-icon': '#9ca3af',

  'components-transfer-bg': '#ffffff',
  'components-transfer-border': '#e5e7eb',
  'components-transfer-header-bg': '#f9fafb',
  'components-transfer-header-text': surfaces.light.secondary,
  'components-transfer-item-bg': '#ffffff',
  'components-transfer-item-bg-hover': '#f3f4f6',
  'components-transfer-item-bg-selected': palette.light.selectionTint,
  'components-transfer-item-text': surfaces.light.secondary,
  'components-transfer-item-text-selected': palette.light.selectionText,

  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': palette.light.selectionTint,
  'components-upload-border': 'rgba(113, 113, 130, 0.25)',
  'components-upload-border-hover': 'rgba(113, 113, 130, 0.5)',
  'components-upload-border-dragover': palette.light.focus,
  'components-upload-text': surfaces.light.secondary,
  'components-upload-text-secondary': surfaces.light.tertiary,
  'components-upload-icon': '#d1d5db',
  'components-upload-progress-bg': '#e5e7eb',
  'components-upload-progress-fill': palette.light.selection,

  'components-statistic-title': surfaces.light.tertiary,
  'components-statistic-value': '#1f2937',
  'components-statistic-suffix': surfaces.light.secondary,
  'components-statistic-prefix': surfaces.light.secondary,

  'components-result-bg': '#ffffff',
  'components-result-icon-success': '#059669',
  'components-result-icon-error': '#ef4444',
  'components-result-icon-warning': '#b45309',
  'components-result-icon-info': '#007670',
  'components-result-title': surfaces.light.text,
  'components-result-subtitle': surfaces.light.secondary,

  'components-rate-star': '#d1d5db',
  'components-rate-star-active': '#fbbf24',
  'components-rate-star-hover': '#f59e0b',

  'components-anchor-bg': '#ffffff',
  'components-anchor-border': '#e5e7eb',
  'components-anchor-link': '#6b7280',
  'components-anchor-link-active': palette.light.selectionText,
  'components-anchor-link-hover': '#374151',

  'components-backtop-bg': '#ffffff',
  'components-backtop-text': surfaces.light.secondary,
  'components-backtop-border': '#e5e7eb',
  'components-backtop-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  'components-backtop-bg-hover': '#f9fafb',

  'components-image-placeholder-bg': '#f3f4f6',
  'components-image-placeholder-text': surfaces.light.tertiary,
  'components-image-preview-bg': '#000000',
  'components-image-preview-overlay': 'rgba(0, 0, 0, 0.8)',
  'components-image-preview-toolbar-bg': 'rgba(0, 0, 0, 0.7)',
  'components-image-preview-toolbar-text': '#ffffff',

  'components-empty-bg': '#ffffff',
  'components-empty-text': surfaces.light.tertiary,
  'components-empty-text-secondary': surfaces.light.tertiary,
  'components-empty-icon': '#e5e7eb',

  'components-watermark-text': 'rgba(0, 0, 0, 0.15)',

  'components-float-button-bg': '#ffffff',
  'components-float-button-text': '#6b7280',
  'components-float-button-border': '#e5e7eb',
  'components-float-button-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  'components-float-button-bg-hover': '#f9fafb',

  'components-segmented-bg': '#f5f5f5',
  'components-segmented-border': '#eaeaea',
  'components-segmented-item-bg': 'transparent',
  'components-segmented-item-bg-hover': '#eaeaea',
  'components-segmented-item-bg-active': palette.light.selectionTint,
  'components-segmented-item-text': surfaces.light.secondary,
  'components-segmented-item-text-active': palette.light.selectionText,

  'components-mentions-bg': '#ffffff',
  'components-mentions-border': '#d1d5db',
  'components-mentions-dropdown-bg': '#ffffff',
  'components-mentions-dropdown-border': '#e5e7eb',
  'components-mentions-dropdown-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  'components-mentions-item-bg-hover': '#f3f4f6',
  'components-mentions-item-text': surfaces.light.secondary,

  'components-colorpicker-bg': '#ffffff',
  'components-colorpicker-border': '#e5e7eb',
  'components-colorpicker-panel-bg': '#ffffff',
  'components-colorpicker-panel-border': '#e5e7eb',
  'components-colorpicker-panel-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  'components-colorpicker-slider-bg': '#f3f4f6',
  'components-colorpicker-handle': '#ffffff',
  'components-colorpicker-input-bg': '#ffffff',
  'components-colorpicker-input-border': '#d1d5db',

  'components-layout-header-bg': '#ffffff',
  'components-layout-header-border': '#e5e7eb',
  'components-layout-sider-bg': '#ffffff',
  'components-layout-sider-border': '#e5e7eb',
  'components-layout-content-bg': '#f9fafb',
  'components-layout-footer-bg': '#ffffff',
  'components-layout-footer-border': '#e5e7eb',

  'components-grid-gutter': '#ffffff',

  'components-card-meta-title': surfaces.light.text,
  'components-card-meta-description': surfaces.light.secondary,
  'components-card-actions-bg': '#f9fafb',
  'components-card-actions-border': '#e5e7eb',
  'components-card-cover-bg': '#f3f4f6',

  'components-list-bg': '#ffffff',
  'components-list-border': '#e5e7eb',
  'components-list-item-bg': '#ffffff',
  'components-list-item-bg-hover': '#f9fafb',
  'components-list-item-border': '#e5e7eb',
  'components-list-item-meta-title': surfaces.light.text,
  'components-list-item-meta-description': surfaces.light.secondary,
  'components-list-item-actions': '#9ca3af',

  'components-descriptions-bg': '#ffffff',
  'components-descriptions-border': surfaces.light.border,
  'components-descriptions-title': surfaces.light.secondary,
  'components-descriptions-content': surfaces.light.text,
  'components-descriptions-label': surfaces.light.secondary,
  'components-descriptions-item-border': '#f3f4f6',

  // ===== 聊天页面专用布局 =====
  'chat-header-bg': surfaces.light.surface,
  'chat-header-border': surfaces.light.borderSubtle,
  'chat-header-backdrop': 'blur(12px)',
  'chat-main-bg': surfaces.light.canvas,
  'chat-content-bg': surfaces.light.surface,
  'chat-content-border': surfaces.light.borderSubtle,
  'chat-input-area-bg': surfaces.light.surface,
  'chat-input-area-border': surfaces.light.borderSubtle,
  'chat-input-area-shadow': '0 -1px 3px rgba(0, 0, 0, 0.05)',
  'chat-gradient-primary':
    'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.08) 50%, rgba(219, 234, 254, 0.05) 100%)',
  'chat-gradient-secondary':
    'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(110, 231, 183, 0.08) 100%)',
  'chat-welcome-border': palette.light.selectionTint,
  'chat-welcome-shadow': '0 4px 20px rgba(59, 130, 246, 0.08)',
  'chat-input-area-backdrop': 'blur(20px)',

  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': 'blur(12px)',

  // ===== 编辑器组件 =====
  'components-editor-bg': '#ffffff',
  'components-editor-toolbar-bg': '#f9fafb',
  'components-editor-text': surfaces.light.secondary,
  'components-editor-border': '#e5e7eb',

  // ===== 面板组件 =====
  'components-panel-header-bg': '#f9fafb',
  'components-panel-header-text': surfaces.light.secondary,
  'components-panel-content-bg': '#ffffff',

  // ===== 图标按钮 =====
  'components-icon-button-text': '#6b7280',
  'components-icon-button-text-hover': '#374151',
  'components-icon-button-bg-hover': '#f3f4f6',

  // ===== 聊天预览增强 =====
  'chat-bubble-ai-bg': surfaces.light.subtle,
  'chat-bubble-ai-text': surfaces.light.text,
  'chat-input-container-bg': surfaces.light.surface,
  'chat-preview-debug-bg': surfaces.light.canvas,
  'chat-preview-debug-text': surfaces.light.secondary,
  'chat-think-bg': surfaces.light.subtle,
  'chat-think-border': surfaces.light.border,
  'chat-think-text': surfaces.light.secondary,

  // ===== 应用头像 =====
  'components-app-avatar-bg':
    'linear-gradient(135deg, #8b5cf6 0%, #33D4CB 100%)',
  'components-app-avatar-border': 'rgba(139, 92, 246, 0.2)',

  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': '#f0f8ff',
  'chat-bubble-assistant-avatar-text': '#1890ff',
  'chat-bubble-user-avatar-bg': '#3a800e',
  'chat-bubble-user-avatar-text': '#ffffff',
  'chat-bubble-user-bg': surfaces.light.subtle,
  'chat-bubble-user-text': surfaces.light.text,

  // ===== API 密钥管理 =====
  'components-api-key-card-bg': '#ffffff',
  'components-api-key-card-bg-hover': '#fafbfc',
  'components-api-key-card-border': 'rgba(0, 0, 0, 0.06)',
  'components-api-key-card-shadow':
    '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'components-api-key-header-bg': '#f8fafc',
  'components-api-key-header-text': surfaces.light.secondary,
  'components-api-key-value-bg': '#f1f5f9',
  'components-api-key-value-text': '#1e293b',
  'components-api-key-value-masked': '#94a3b8',
  'components-api-key-actions-bg': '#ffffff',
  'components-api-key-actions-border': '#e2e8f0',

  // ===== API 状态指示器 =====
  'components-api-status-online-bg': '#f0fdf4',
  'components-api-status-online-text': '#15803d',
  'components-api-status-online-dot': '#22c55e',
  'components-api-status-offline-bg': '#f9fafb',
  'components-api-status-offline-text': '#6b7280',
  'components-api-status-offline-dot': '#9ca3af',
  'components-api-status-error-bg': '#fef2f2',
  'components-api-status-error-text': '#b91c1c',
  'components-api-status-error-dot': '#ef4444',

  // ===== HTTP 方法颜色系统 =====
  'components-http-method-get-bg': '#f0fdf4',
  'components-http-method-get-text': '#15803d',
  'components-http-method-get-border': '#bbf7d0',
  'components-http-method-post-bg': '#eff6ff',
  'components-http-method-post-text': '#026f6a',
  'components-http-method-post-border': '#bfdbfe',
  'components-http-method-put-bg': '#fffbeb',
  'components-http-method-put-text': '#a64a00',
  'components-http-method-put-border': '#fde68a',
  'components-http-method-delete-bg': '#fef2f2',
  'components-http-method-delete-text': '#b91c1c',
  'components-http-method-delete-border': '#fecaca',
  'components-http-method-patch-bg': '#fdf4ff',
  'components-http-method-patch-text': '#7c3aed',
  'components-http-method-patch-border': '#e9d5ff',

  // ===== API 文档风格组件 =====
  'components-api-docs-bg': '#ffffff',
  'components-api-docs-border': '#e5e7eb',
  'components-api-docs-header-bg':
    'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.08) 100%)',
  'components-api-docs-header-border': 'rgba(0, 0, 0, 0.08)',
  'components-api-docs-sidebar-bg': 'rgba(255, 255, 255, 0.8)',
  'components-api-docs-sidebar-border': 'rgba(0, 0, 0, 0.06)',
  'components-api-docs-content-bg': '#ffffff',
  'components-api-docs-search-bg': '#ffffff',
  'components-api-docs-search-border': '#d1d5db',
  'components-api-docs-search-focus-border': palette.light.focus,

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': 'rgba(255, 255, 255, 0.75)',
  'components-glassmorphism-border': 'rgba(255, 255, 255, 0.2)',
  'components-glassmorphism-shadow': '0 8px 32px rgba(31, 38, 135, 0.15)',
  'components-gradient-primary':
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'components-gradient-secondary':
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'components-gradient-accent':
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'components-modern-card-bg': 'rgba(255, 255, 255, 0.9)',
  'components-modern-card-border': 'rgba(255, 255, 255, 0.2)',
  'components-modern-card-shadow':
    '0 8px 24px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',

  // ===== 首页推荐卡片系统 =====
  'components-recommend-card-bg-1': surfaces.light.surface,
  'components-recommend-card-bg-2': surfaces.light.surface,
  'components-recommend-card-bg-3': surfaces.light.surface,
  'components-recommend-card-bg-4': surfaces.light.surface,
  'components-recommend-card-text': surfaces.light.text,
  'components-recommend-card-tag': surfaces.light.secondary,

  // ===== 画布系统 (Agent Canvas) - 亮色主题 =====
  // 画布背景
  'components-canvas-bg': 'rgb(246, 246, 247)',
  'components-canvas-grid': 'rgba(0, 0, 0, 0.15)',
  'components-canvas-spotlight': '#c2ddf3',

  // 节点通用
  'components-canvas-node-bg': '#ffffff',
  'components-canvas-node-border': 'rgba(0, 0, 0, 0.1)',
  'components-canvas-node-border-hover': 'rgba(0, 0, 0, 0.15)',
  'components-canvas-node-border-selected': palette.light.selection,
  'components-canvas-node-shadow': '0 2px 8px rgba(0, 0, 0, 0.08)',

  // 节点运行态
  'components-canvas-node-status-running-border': '#0ea5e9', // sky-500
  'components-canvas-node-status-running-halo': 'rgba(14, 165, 233, 0.18)',
  'components-canvas-node-status-running-icon': '#0284c7',
  'components-canvas-node-status-success-border': '#10b981', // emerald-500
  'components-canvas-node-status-success-bg': 'rgba(16, 185, 129, 0.12)',
  'components-canvas-node-status-success-text': '#047857', // emerald-700
  'components-canvas-node-status-error-border': '#ef4444', // red-500
  'components-canvas-node-status-error-bg': 'rgba(239, 68, 68, 0.12)',
  'components-canvas-node-status-error-text': '#b91c1c', // red-700

  // 边线
  'components-canvas-edge-stroke': 'rgb(156, 163, 175)',
  'components-canvas-edge-stroke-hover': 'rgb(107, 114, 128)',
  'components-canvas-edge-stroke-selected': palette.light.selection,
  'components-canvas-edge-stroke-flowing': '#0ea5e9', // sky-500
  'components-canvas-edge-marker': 'rgb(156, 163, 175)',
  'components-canvas-edge-marker-selected': palette.light.selection,

  // 连接点
  'components-canvas-handle-bg': palette.light.selection,
  'components-canvas-handle-border': '#ffffff',
  'components-canvas-handle-icon': '#ffffff',

  // 工具栏
  'components-canvas-toolbar-bg': '#ffffff',
  'components-canvas-toolbar-border': 'rgba(0, 0, 0, 0.08)',
  'components-canvas-toolbar-shadow': '0 2px 8px rgba(0, 0, 0, 0.1)',

  // 节点类型图标颜色（亮色主题）
  'components-canvas-icon-start': '#16a34a', // green-600
  'components-canvas-icon-retrieval': '#2563eb', // blue-600
  'components-canvas-icon-generate': '#9333ea', // purple-600
  'components-canvas-icon-message': '#0d9488', // teal-600
  'components-canvas-icon-tool': '#ea580c', // orange-600
  'components-canvas-icon-file': '#16a34a', // green-600
  'components-canvas-icon-parser': '#2563eb', // blue-600
  'components-canvas-icon-splitter': '#ea580c', // orange-600
  'components-canvas-icon-tokenizer': '#9333ea', // purple-600
  'components-canvas-icon-extractor': '#4f46e5', // indigo-600
  'components-canvas-icon-switch': '#ca8a04', // yellow-600
  'components-canvas-icon-categorize': '#db2777', // pink-600
  'components-canvas-icon-agent': '#7c3aed', // violet-600
  'components-canvas-icon-code': '#4b5563', // gray-600
  'components-canvas-icon-default': '#6b7280', // gray-500

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
  'components-app-shell-surface': surfaces.light.surface,
  'components-app-shell-border': surfaces.light.border,
  'components-app-shell-shadow': '0 16px 32px -24px rgba(15, 23, 42, 0.25)',
  'components-main-workbench-bg': surfaces.light.canvas,
  'components-main-workbench-surface': surfaces.light.surface,
  'components-main-workbench-border': surfaces.light.border,
  'components-main-workbench-shadow':
    '0 18px 36px -24px rgba(15, 23, 42, 0.28)',
  'components-page-header-bg': surfaces.light.surface,
  'components-page-header-border': surfaces.light.borderSubtle,
  'components-page-header-title': surfaces.light.text,
  'components-page-header-description': surfaces.light.secondary,
  'components-page-toolbar-bg': surfaces.light.surface,
  'components-page-toolbar-border': surfaces.light.borderSubtle,
  'components-page-toolbar-text': surfaces.light.secondary,
  'components-page-state-bg': surfaces.light.surface,
  'components-page-state-border': surfaces.light.borderSubtle,
  'components-page-state-icon-bg': 'rgba(0, 0, 0, 0.04)',
  'components-page-state-icon': palette.light.selection,
  'components-page-state-title': surfaces.light.text,
  'components-page-state-description': surfaces.light.secondary,
  'components-settings-rail-bg': surfaces.light.surface,
  'components-settings-rail-border': surfaces.light.borderSubtle,
  'components-settings-rail-title': surfaces.light.text,
  'components-settings-rail-description': surfaces.light.secondary,
  'components-settings-rail-section-text': surfaces.light.secondary,
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
  'components-split-pane-surface': surfaces.light.surface,
  'components-split-pane-border': surfaces.light.border,

  // ===== 设置页面专用 =====
  'components-settings-sidebar-section-text': surfaces.light.secondary,
  'components-settings-content-bg': surfaces.light.canvas,
  'components-settings-section-bg': surfaces.light.surface,
  'components-settings-section-border': surfaces.light.borderSubtle,
  'components-settings-section-title': surfaces.light.text,
  'components-settings-section-description': surfaces.light.secondary,
  'components-settings-user-role-bg': palette.light.selectionTint,

  // ===== 系统状态页面专用 =====
  'components-system-accent-bg': palette.light.selectionTint,
  'components-system-accent-border': palette.light.selection,
  'components-system-accent-text': palette.light.selectionText,
  'components-system-accent-soft': palette.light.selectionSoft,
  'components-system-page-bg': surfaces.light.canvas,
  'components-system-panel-bg': surfaces.light.surface,
  'components-system-panel-border': '#e5e7eb',
  'components-system-panel-shadow':
    '0 10px 25px -15px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.06)',
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

  'components-system-health-ok-bg': 'rgba(16, 185, 129, 0.1)',
  'components-system-health-ok-border': '#22c55e',
  'components-system-health-ok-text': '#15803d',
  'components-system-health-warning-bg': 'rgba(245, 158, 11, 0.1)',
  'components-system-health-warning-border': '#f59e0b',
  'components-system-health-warning-text': '#a64a00',
  'components-system-health-error-bg': 'rgba(239, 68, 68, 0.1)',
  'components-system-health-error-border': '#ef4444',
  'components-system-health-error-text': '#b91c1c',

  'components-system-status-card-bg': surfaces.light.surface,
  'components-system-status-card-border': '#e5e7eb',
  'components-system-status-card-border-hover': '#b7becb',
  'components-system-status-card-shadow':
    '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  'components-system-status-ok-bg': 'rgba(16, 185, 129, 0.1)',
  'components-system-status-ok-border': '#22c55e',
  'components-system-status-ok-text': '#15803d',
  'components-system-status-warning-bg': 'rgba(245, 158, 11, 0.1)',
  'components-system-status-warning-border': '#f59e0b',
  'components-system-status-warning-text': '#a64a00',
  'components-system-status-error-bg': 'rgba(239, 68, 68, 0.1)',
  'components-system-status-error-border': '#ef4444',
  'components-system-status-error-text': '#b91c1c',

  'components-system-chart-grid': '#e5e7eb',
  'components-system-chart-axis': surfaces.light.secondary,
  'components-system-chart-tooltip-bg': '#ffffff',
  'components-system-chart-tooltip-border': '#e5e7eb',
  'components-system-chart-tooltip-text': surfaces.light.text,
  'components-system-chart-tooltip-muted': '#6b7280',
  'components-system-chart-done': '#10b981',
  'components-system-chart-done-soft': 'rgba(16, 185, 129, 0.1)',
  'components-system-chart-failed': '#ef4444',
  'components-system-chart-failed-soft': 'rgba(239, 68, 68, 0.1)',
  'components-system-chart-pending': '#f59e0b',
  'components-system-chart-pending-soft': 'rgba(245, 158, 11, 0.1)',
  'components-system-chart-lag': '#9ca3af',
  'components-system-chart-info-pill-bg': '#f3f4f6',
  'components-system-chart-info-pill-text': surfaces.light.secondary,
}

// 暗色主题令牌值定义
export const darkTokens: DesignTokens = {
  ...buildSurfaceTokens(surfaces.dark, palette.dark),
  // ===== 文本系统 =====
  'text-primary': surfaces.dark.text,
  'text-secondary': surfaces.dark.secondary,
  'text-tertiary': surfaces.dark.tertiary,
  'text-muted': surfaces.dark.muted,
  'text-disabled': surfaces.dark.disabled,
  'text-accent': '#60a5fa',
  'text-success': '#4ade80',
  'text-warning': '#fbbf24',
  'text-error': '#fca5a5',
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
  'border-success': '#22c55e',
  'border-warning': '#f59e0b',
  'border-error': '#ef4444',

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
  'components-button-secondary-bg-active': 'rgba(255, 255, 255, 0.14)',
  'components-button-secondary-bg-disabled': 'rgba(255, 255, 255, 0.04)',
  'components-button-secondary-text': '#ffffff',
  'components-button-secondary-text-disabled': 'rgba(255, 255, 255, 0.4)',
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
  'components-input-bg-disabled': 'rgba(255, 255, 255, 0.04)',
  'components-input-border': surfaces.dark.inputBorder,
  'components-input-border-hover': surfaces.dark.inputBorderHover,
  'components-input-border-focus': palette.dark.focus,
  'components-input-border-error': '#ef4444',
  'components-input-text': surfaces.dark.text,
  'components-input-text-placeholder': surfaces.dark.tertiary,
  'components-input-text-disabled': surfaces.dark.disabled,

  // ===== 卡片组件 =====
  'components-card-bg': surfaces.dark.surface,
  'components-card-bg-hover': '#292c32',
  'components-card-border': 'rgba(255, 255, 255, 0.12)',
  'components-card-shadow':
    '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.15)',

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
  'components-nav-border': 'rgba(255, 255, 255, 0.12)',
  'components-nav-item-text': surfaces.dark.tertiary,
  'components-nav-item-text-hover': surfaces.dark.text,
  'components-nav-item-text-active': palette.dark.selectionText,

  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': surfaces.dark.elevated,
  'components-dropdown-border': 'rgba(255, 255, 255, 0.14)',
  'components-dropdown-shadow':
    '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
  'components-dropdown-item-bg-hover': 'rgba(255, 255, 255, 0.07)',
  'components-dropdown-item-text': surfaces.dark.text,

  // ===== 模型选择器组件 =====
  'components-model-selector-dropdown-bg': surfaces.dark.elevated,
  'components-model-selector-dropdown-border': 'rgba(255, 255, 255, 0.14)',
  'components-model-selector-dropdown-shadow':
    '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
  'components-model-selector-search-bg': 'rgba(255, 255, 255, 0.07)',
  'components-model-selector-search-border': 'rgba(255, 255, 255, 0.14)',
  'components-model-selector-search-text': '#f9fafb',
  'components-model-selector-provider-header-bg': 'rgba(255, 255, 255, 0.05)',
  'components-model-selector-provider-header-border':
    'rgba(255, 255, 255, 0.12)',
  'components-model-selector-provider-header-text': surfaces.dark.text,
  'components-model-selector-item-bg': '#202025',
  'components-model-selector-item-border': 'rgba(255, 255, 255, 0.12)',
  'components-model-selector-item-text': surfaces.dark.text,
  'components-model-selector-item-bg-hover': 'rgba(255, 255, 255, 0.07)',
  'components-model-selector-item-bg-selected': palette.dark.selectionTint,
  'components-model-selector-item-text-selected': palette.dark.selectionText,
  'components-model-selector-overlay-bg': 'rgba(0, 0, 0, 0.6)',

  // ===== 模态框组件 =====
  'components-modal-bg': surfaces.dark.surface,
  'components-modal-overlay': 'rgba(0, 0, 0, 0.75)',
  'components-modal-border': 'rgba(255, 255, 255, 0.14)',
  'components-modal-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',

  // ===== 表格组件 =====
  'components-table-bg': surfaces.dark.surface,
  'components-table-border': 'rgba(255, 255, 255, 0.12)',
  'components-table-header-bg': surfaces.dark.canvas,
  'components-table-row-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-table-row-bg-selected': palette.dark.selectionTint,

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

  // ===== 反馈状态 status-* (canonical feedback palette) =====
  'status-success': '#22c55e',
  'status-warning': '#f59e0b',
  'status-error': '#ef4444',
  'status-info': '#38bdf8',
  'status-success-10': 'rgba(34, 197, 94, 0.12)',
  'status-warning-10': 'rgba(245, 158, 11, 0.12)',
  'status-error-10': 'rgba(239, 68, 68, 0.12)',
  'status-info-10': 'rgba(56, 189, 248, 0.12)',
  'status-success-subtle': 'rgba(34, 197, 94, 0.12)',
  'status-warning-subtle': 'rgba(245, 158, 11, 0.12)',
  'status-error-subtle': 'rgba(239, 68, 68, 0.12)',
  'status-info-subtle': 'rgba(56, 189, 248, 0.12)',

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
  'components-method-get-bg': 'rgba(34, 197, 94, 0.2)',
  'components-method-get-text': '#4ade80',
  'components-method-get-border': '#22c55e',
  'components-method-post-bg': 'rgba(59, 130, 246, 0.2)',
  'components-method-post-text': '#60a5fa',
  'components-method-post-border': '#3b82f6',
  'components-method-put-bg': 'rgba(245, 158, 11, 0.2)',
  'components-method-put-text': '#fbbf24',
  'components-method-put-border': '#f59e0b',
  'components-method-delete-bg': 'rgba(239, 68, 68, 0.2)',
  'components-method-delete-text': '#f87171',
  'components-method-delete-border': '#ef4444',
  'components-method-patch-bg': 'rgba(168, 85, 247, 0.2)',
  'components-method-patch-text': '#c084fc',
  'components-method-patch-border': '#a855f7',

  // ===== 环境状态指示器 =====
  'components-env-prod-bg': '#047857',
  'components-env-prod-text': '#ffffff',
  'components-env-staging-bg': '#b45309',
  'components-env-staging-text': '#ffffff',
  'components-env-dev-bg': '#2563eb',
  'components-env-dev-text': '#ffffff',

  // ===== 阴影系统 =====
  'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  'shadow-md':
    '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  'shadow-lg':
    '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  'shadow-xl':
    '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',

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
  'components-switch-thumb-checked': '#ffffff',

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
  'components-dialog-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  'components-dialog-overlay': 'rgba(0, 0, 0, 0.75)',

  'components-popover-bg': surfaces.dark.elevated,
  'components-popover-border': 'rgba(255, 255, 255, 0.14)',
  'components-popover-shadow':
    '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',

  'components-tooltip-bg': '#0f172a',
  'components-tooltip-text': surfaces.dark.text,
  'components-tooltip-shadow':
    '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',

  // ===== 导航和标签 =====
  'components-tabs-border': '#475569',
  'components-tabs-bg': 'rgba(255, 255, 255, 0.06)',
  'components-tabs-active-bg': palette.dark.selectionTint,
  'components-tabs-active-text': palette.dark.selectionText,
  'components-tabs-inactive-text': surfaces.dark.secondary,

  'components-breadcrumb-text': surfaces.dark.secondary,
  'components-breadcrumb-text-current': surfaces.dark.text,
  'components-breadcrumb-separator': '#94a3b8',

  // ===== 状态和通知 =====
  'components-alert-info-bg': 'rgba(59, 130, 246, 0.1)',
  'components-alert-info-border': '#3b82f6',
  'components-alert-info-text': '#93c5fd',

  'components-alert-success-bg': 'rgba(34, 197, 94, 0.1)',
  'components-alert-success-border': '#22c55e',
  'components-alert-success-text': '#86efac',

  'components-alert-warning-bg': 'rgba(245, 158, 11, 0.1)',
  'components-alert-warning-border': '#f59e0b',
  'components-alert-warning-text': '#fbbf24',

  'components-alert-error-bg': 'rgba(239, 68, 68, 0.1)',
  'components-alert-error-border': '#ef4444',
  'components-alert-error-text': '#f87171',

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
  'components-tool-call-content-bg': '#0f172a', // 深色内容区背景
  'components-tool-call-content-text': '#e2e8f0', // 浅色内容文字

  // ===== 新增组件令牌的暗色版本 =====
  // 徽章和标签
  'components-badge-bg': 'rgba(255, 255, 255, 0.1)',
  'components-badge-text': '#e5e7eb',
  'components-badge-border': '#475569',
  'components-badge-success-bg': 'rgba(34, 197, 94, 0.15)',
  'components-badge-success-text': '#86efac',
  'components-badge-warning-bg': 'rgba(245, 158, 11, 0.15)',
  'components-badge-warning-text': '#fbbf24',
  'components-badge-error-bg': 'rgba(239, 68, 68, 0.15)',
  'components-badge-error-text': '#f87171',
  'components-badge-info-bg': 'rgba(59, 130, 246, 0.15)',
  'components-badge-info-text': '#93c5fd',
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

  // ===== 统计卡片组件 - 暗色主题 =====
  // 蓝色卡片 - 信息/总量
  'components-stats-card-blue-bg':
    'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(14, 165, 233, 0.1))',
  'components-stats-card-blue-icon-bg':
    'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(14, 165, 233, 0.2))',
  'components-stats-card-blue-icon-text': '#93c5fd',
  'components-stats-card-blue-shadow':
    '0 8px 24px -4px rgba(59, 130, 246, 0.35), 0 4px 8px -2px rgba(59, 130, 246, 0.15)',
  'components-stats-card-blue-border-hover': 'rgba(59, 130, 246, 0.5)',
  // 绿色卡片 - 成功/活跃
  'components-stats-card-green-bg':
    'linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(16, 185, 129, 0.1))',
  'components-stats-card-green-icon-bg':
    'linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(16, 185, 129, 0.2))',
  'components-stats-card-green-icon-text': '#86efac',
  'components-stats-card-green-shadow':
    '0 8px 24px -4px rgba(34, 197, 94, 0.35), 0 4px 8px -2px rgba(34, 197, 94, 0.15)',
  'components-stats-card-green-border-hover': 'rgba(34, 197, 94, 0.5)',
  // 紫色卡片 - 特殊/高级
  'components-stats-card-purple-bg':
    'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(168, 85, 247, 0.1))',
  'components-stats-card-purple-icon-bg':
    'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(168, 85, 247, 0.2))',
  'components-stats-card-purple-icon-text': '#c4b5fd',
  'components-stats-card-purple-shadow':
    '0 8px 24px -4px rgba(139, 92, 246, 0.35), 0 4px 8px -2px rgba(139, 92, 246, 0.15)',
  'components-stats-card-purple-border-hover': 'rgba(139, 92, 246, 0.5)',
  // 橙色卡片 - 警告/待处理
  'components-stats-card-orange-bg':
    'linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(245, 158, 11, 0.1))',
  'components-stats-card-orange-icon-bg':
    'linear-gradient(135deg, rgba(249, 115, 22, 0.3), rgba(245, 158, 11, 0.2))',
  'components-stats-card-orange-icon-text': '#fdba74',
  'components-stats-card-orange-shadow':
    '0 8px 24px -4px rgba(249, 115, 22, 0.35), 0 4px 8px -2px rgba(249, 115, 22, 0.15)',
  'components-stats-card-orange-border-hover': 'rgba(249, 115, 22, 0.5)',

  // ===== 头像渐变系统 - 暗色主题 =====
  // 与亮色主题保持一致的柔和配色
  'components-avatar-gradient-purple-from': '#A78BFA', // violet-400，柔和紫
  'components-avatar-gradient-purple-to': '#C4B5FD', // violet-300，浅紫
  'components-avatar-gradient-blue-from': '#60A5FA', // blue-400，柔和蓝
  'components-avatar-gradient-blue-to': '#93C5FD', // blue-300，浅蓝
  'components-avatar-gradient-green-from': '#4ADE80', // green-400，柔和绿
  'components-avatar-gradient-green-to': '#86EFAC', // green-300，浅绿
  'components-avatar-gradient-orange-from': '#FB923C', // orange-400，柔和橙
  'components-avatar-gradient-orange-to': '#FDBA74', // orange-300，浅橙
  'components-avatar-gradient-indigo-from': '#818CF8', // indigo-400，柔和靛蓝
  'components-avatar-gradient-indigo-to': '#A5B4FC', // indigo-300，浅靛蓝
  'components-avatar-gradient-rose-from': '#E11D48', // rose-600，深玫红
  'components-avatar-gradient-rose-to': '#FB7185', // rose-400，柔和玫红
  'components-avatar-gradient-teal-from': '#0D9488', // teal-600，深青绿
  'components-avatar-gradient-teal-to': '#2DD4BF', // teal-400，柔和青绿
  'components-avatar-gradient-amber-from': '#D97706', // amber-600，深琥珀
  'components-avatar-gradient-amber-to': '#FBBF24', // amber-400，柔和琥珀

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

  'components-task-status-cancelled-bg': 'rgba(245, 158, 11, 0.10)',
  'components-task-status-cancelled-border': 'rgba(245, 158, 11, 0.20)',
  'components-task-status-cancelled-text': '#fcd34d',
  'components-task-status-cancelled-dot': '#fbbf24',

  'components-task-status-completed-bg': 'rgba(34, 197, 94, 0.10)',
  'components-task-status-completed-border': 'rgba(34, 197, 94, 0.20)',
  'components-task-status-completed-text': '#86efac',
  'components-task-status-completed-dot': '#22c55e',

  'components-task-status-failed-bg': 'rgba(239, 68, 68, 0.10)',
  'components-task-status-failed-border': 'rgba(239, 68, 68, 0.20)',
  'components-task-status-failed-text': '#fca5a5',
  'components-task-status-failed-dot': '#f87171',

  'components-tag-bg': 'rgba(255, 255, 255, 0.08)',
  'components-tag-text': '#e4e4e7',
  'components-tag-border': 'rgba(255, 255, 255, 0.12)',
  'components-tag-bg-hover': 'rgba(255, 255, 255, 0.12)',
  'components-tag-close-hover': '#ef4444',

  // 分页器
  'components-pagination-bg': '#1a1a1a',
  'components-pagination-text': surfaces.dark.tertiary,
  'components-pagination-border': 'rgba(255, 255, 255, 0.10)',
  'components-pagination-item-bg': 'rgba(255, 255, 255, 0.05)',
  'components-pagination-item-bg-hover': 'rgba(255, 255, 255, 0.08)',
  'components-pagination-item-bg-active': palette.dark.action,
  'components-pagination-item-text': surfaces.dark.text,
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-bg': 'rgba(255, 255, 255, 0.03)',
  'components-pagination-disabled-text': '#52525b',

  // 步骤器
  'components-steps-bg': '#1a1a1a',
  'components-steps-border': 'rgba(255, 255, 255, 0.10)',
  'components-steps-completed-bg': '#047857',
  'components-steps-completed-text': surfaces.dark.text,
  'components-steps-active-bg': palette.dark.action,
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': 'rgba(255, 255, 255, 0.05)',
  'components-steps-inactive-text': surfaces.dark.tertiary,
  'components-steps-line': 'rgba(255, 255, 255, 0.10)',
  'components-steps-line-completed': '#22c55e',

  // 其余组件令牌暗色适配
  'components-loader-primary': palette.dark.selection,
  'components-loader-secondary': '#52525b',
  'components-skeleton-base': 'rgba(255, 255, 255, 0.08)',
  'components-skeleton-shimmer': 'rgba(255, 255, 255, 0.15)',
  'components-skeleton-text': 'rgba(255, 255, 255, 0.05)',

  'components-divider-bg': 'rgba(255, 255, 255, 0.10)',
  'components-divider-text': surfaces.dark.tertiary,

  'components-timeline-line': 'rgba(255, 255, 255, 0.10)',
  'components-timeline-dot': '#52525b',
  'components-timeline-dot-active': palette.dark.selection,
  'components-timeline-content-bg': '#1e1e1e',
  'components-timeline-content-border': 'rgba(255, 255, 255, 0.10)',

  'components-calendar-bg': '#1a1a1a',
  'components-calendar-border': 'rgba(255, 255, 255, 0.10)',
  'components-calendar-header-bg': '#141414',
  'components-calendar-header-text': surfaces.dark.text,
  'components-calendar-cell-bg': 'rgba(255, 255, 255, 0.03)',
  'components-calendar-cell-text': surfaces.dark.text,
  'components-calendar-cell-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-calendar-cell-bg-selected': palette.dark.selection,
  'components-calendar-cell-text-selected': '#ffffff',
  'components-calendar-cell-bg-today': palette.dark.selectionTint,
  'components-calendar-cell-text-today': palette.dark.selectionText,
  'components-calendar-cell-bg-disabled': 'rgba(255, 255, 255, 0.02)',
  'components-calendar-cell-text-disabled': '#52525b',

  'components-drawer-bg': '#1e1e1e',
  'components-drawer-overlay': 'rgba(0, 0, 0, 0.75)',
  'components-drawer-border': 'rgba(255, 255, 255, 0.10)',
  'components-drawer-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  'components-drawer-header-bg': '#141414',
  'components-drawer-header-border': 'rgba(255, 255, 255, 0.10)',

  'components-collapse-bg': '#1e1e1e',
  'components-collapse-border': 'rgba(255, 255, 255, 0.10)',
  'components-collapse-header-bg': 'rgba(255, 255, 255, 0.03)',
  'components-collapse-header-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-collapse-header-text': surfaces.dark.text,
  'components-collapse-content-bg': '#1e1e1e',
  'components-collapse-content-border': 'rgba(255, 255, 255, 0.10)',

  'components-tree-bg': '#1a1a1a',
  'components-tree-border': 'rgba(255, 255, 255, 0.10)',
  'components-tree-node-bg': 'transparent',
  'components-tree-node-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-tree-node-bg-selected': palette.dark.selectionTint,
  'components-tree-node-text': surfaces.dark.text,
  'components-tree-node-text-selected': palette.dark.selectionText,
  'components-tree-indent-line': 'rgba(255, 255, 255, 0.10)',
  'components-tree-expand-icon': '#71717a',

  'components-transfer-bg': '#1a1a1a',
  'components-transfer-border': 'rgba(255, 255, 255, 0.10)',
  'components-transfer-header-bg': '#141414',
  'components-transfer-header-text': surfaces.dark.text,
  'components-transfer-item-bg': 'rgba(255, 255, 255, 0.03)',
  'components-transfer-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-transfer-item-bg-selected': palette.dark.selectionTint,
  'components-transfer-item-text': surfaces.dark.text,
  'components-transfer-item-text-selected': palette.dark.selectionText,

  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': palette.dark.selectionTint,
  'components-upload-border': 'rgba(255, 255, 255, 0.15)',
  'components-upload-border-hover': 'rgba(255, 255, 255, 0.25)',
  'components-upload-border-dragover': palette.dark.focus,
  'components-upload-text': surfaces.dark.text,
  'components-upload-text-secondary': surfaces.dark.tertiary,
  'components-upload-icon': '#52525b',
  'components-upload-progress-bg': 'rgba(255, 255, 255, 0.08)',
  'components-upload-progress-fill': palette.dark.selection,

  'components-statistic-title': surfaces.dark.tertiary,
  'components-statistic-value': '#ffffff',
  'components-statistic-suffix': surfaces.dark.tertiary,
  'components-statistic-prefix': surfaces.dark.tertiary,

  'components-result-bg': '#1e1e1e',
  'components-result-icon-success': '#86efac',
  'components-result-icon-error': '#fca5a5',
  'components-result-icon-warning': '#fcd34d',
  'components-result-icon-info': '#a5b4fc',
  'components-result-title': surfaces.dark.text,
  'components-result-subtitle': surfaces.dark.tertiary,

  'components-rate-star': '#52525b',
  'components-rate-star-active': '#fbbf24',
  'components-rate-star-hover': '#f59e0b',

  'components-anchor-bg': '#1a1a1a',
  'components-anchor-border': 'rgba(255, 255, 255, 0.10)',
  'components-anchor-link': '#a1a1aa',
  'components-anchor-link-active': palette.dark.selectionText,
  'components-anchor-link-hover': '#ffffff',

  'components-backtop-bg': '#1e1e1e',
  'components-backtop-text': surfaces.dark.tertiary,
  'components-backtop-border': 'rgba(255, 255, 255, 0.10)',
  'components-backtop-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  'components-backtop-bg-hover': 'rgba(255, 255, 255, 0.06)',

  'components-image-placeholder-bg': 'rgba(255, 255, 255, 0.05)',
  'components-image-placeholder-text': surfaces.dark.tertiary,
  'components-image-preview-bg': '#000000',
  'components-image-preview-overlay': 'rgba(0, 0, 0, 0.9)',
  'components-image-preview-toolbar-bg': 'rgba(0, 0, 0, 0.85)',
  'components-image-preview-toolbar-text': surfaces.dark.text,

  'components-empty-bg': '#1e1e1e',
  'components-empty-text': surfaces.dark.tertiary,
  'components-empty-text-secondary': '#52525b',
  'components-empty-icon': '#52525b',

  'components-watermark-text': 'rgba(255, 255, 255, 0.04)',

  'components-float-button-bg': '#1e1e1e',
  'components-float-button-text': '#a1a1aa',
  'components-float-button-border': 'rgba(255, 255, 255, 0.10)',
  'components-float-button-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  'components-float-button-bg-hover': 'rgba(255, 255, 255, 0.06)',

  'components-segmented-bg': 'rgba(255, 255, 255, 0.05)',
  'components-segmented-border': 'rgba(255, 255, 255, 0.10)',
  'components-segmented-item-bg': 'transparent',
  'components-segmented-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-segmented-item-bg-active': palette.dark.selectionTint,
  'components-segmented-item-text': surfaces.dark.tertiary,
  'components-segmented-item-text-active': palette.dark.selectionText,

  'components-mentions-bg': 'rgba(255, 255, 255, 0.05)',
  'components-mentions-border': 'rgba(255, 255, 255, 0.12)',
  'components-mentions-dropdown-bg': '#1e1e1e',
  'components-mentions-dropdown-border': 'rgba(255, 255, 255, 0.12)',
  'components-mentions-dropdown-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  'components-mentions-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-mentions-item-text': surfaces.dark.text,

  'components-colorpicker-bg': '#1e1e1e',
  'components-colorpicker-border': 'rgba(255, 255, 255, 0.10)',
  'components-colorpicker-panel-bg': '#1e1e1e',
  'components-colorpicker-panel-border': 'rgba(255, 255, 255, 0.10)',
  'components-colorpicker-panel-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  'components-colorpicker-slider-bg': 'rgba(255, 255, 255, 0.06)',
  'components-colorpicker-handle': '#ffffff',
  'components-colorpicker-input-bg': 'rgba(255, 255, 255, 0.05)',
  'components-colorpicker-input-border': 'rgba(255, 255, 255, 0.12)',

  'components-layout-header-bg': '#1a1a1a',
  'components-layout-header-border': 'rgba(255, 255, 255, 0.10)',
  'components-layout-sider-bg': '#1a1a1a',
  'components-layout-sider-border': 'rgba(255, 255, 255, 0.10)',
  'components-layout-content-bg': '#121212',
  'components-layout-footer-bg': '#1a1a1a',
  'components-layout-footer-border': 'rgba(255, 255, 255, 0.10)',

  'components-grid-gutter': '#1a1a1a',

  'components-card-meta-title': surfaces.dark.text,
  'components-card-meta-description': surfaces.dark.tertiary,
  'components-card-actions-bg': '#141414',
  'components-card-actions-border': 'rgba(255, 255, 255, 0.10)',
  'components-card-cover-bg': 'rgba(255, 255, 255, 0.05)',

  'components-list-bg': '#1a1a1a',
  'components-list-border': 'rgba(255, 255, 255, 0.10)',
  'components-list-item-bg': 'rgba(255, 255, 255, 0.03)',
  'components-list-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-list-item-border': 'rgba(255, 255, 255, 0.10)',
  'components-list-item-meta-title': surfaces.dark.text,
  'components-list-item-meta-description': surfaces.dark.tertiary,
  'components-list-item-actions': '#71717a',

  'components-descriptions-bg': '#1a1a1a',
  'components-descriptions-border': 'rgba(255, 255, 255, 0.10)',
  'components-descriptions-title': surfaces.dark.text,
  'components-descriptions-content': surfaces.dark.text,
  'components-descriptions-label': surfaces.dark.tertiary,
  'components-descriptions-item-border': 'rgba(255, 255, 255, 0.06)',

  // ===== 聊天页面专用布局 =====
  'chat-header-bg': surfaces.dark.surface,
  'chat-header-border': surfaces.dark.borderSubtle,
  'chat-header-backdrop': 'blur(12px)',
  'chat-main-bg': surfaces.dark.canvas,
  'chat-content-bg': surfaces.dark.surface,
  'chat-content-border': surfaces.dark.borderSubtle,
  'chat-input-area-bg': surfaces.dark.surface,
  'chat-input-area-border': surfaces.dark.borderSubtle,
  'chat-input-area-shadow': '0 -1px 3px rgba(0, 0, 0, 0.4)',
  'chat-gradient-primary':
    'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(165, 180, 252, 0.12) 50%, rgba(79, 70, 229, 0.06) 100%)',
  'chat-gradient-secondary':
    'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(134, 239, 172, 0.12) 100%)',
  'chat-welcome-border': palette.dark.selectionTint,
  'chat-welcome-shadow': '0 4px 20px rgba(99, 102, 241, 0.15)',
  'chat-input-area-backdrop': 'blur(20px)',

  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': 'blur(12px)',

  // ===== 编辑器组件 =====
  'components-editor-bg': '#1e1e1e',
  'components-editor-toolbar-bg': '#141414',
  'components-editor-text': surfaces.dark.text,
  'components-editor-border': 'rgba(255, 255, 255, 0.10)',

  // ===== 面板组件 =====
  'components-panel-header-bg': '#141414',
  'components-panel-header-text': surfaces.dark.text,
  'components-panel-content-bg': '#1e1e1e',

  // ===== 图标按钮 =====
  'components-icon-button-text': '#a1a1aa',
  'components-icon-button-text-hover': '#ffffff',
  'components-icon-button-bg-hover': 'rgba(255, 255, 255, 0.06)',

  // ===== 聊天预览增强 =====
  'chat-bubble-ai-bg': surfaces.dark.subtle,
  'chat-bubble-ai-text': surfaces.dark.text,
  'chat-input-container-bg': surfaces.dark.surface,
  'chat-preview-debug-bg': surfaces.dark.canvas,
  'chat-preview-debug-text': surfaces.dark.secondary,
  'chat-think-bg': surfaces.dark.subtle,
  'chat-think-border': surfaces.dark.border,
  'chat-think-text': surfaces.dark.secondary,

  // ===== 应用头像 =====
  'components-app-avatar-bg':
    'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
  'components-app-avatar-border': 'rgba(167, 139, 250, 0.3)',

  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': 'rgba(99, 102, 241, 0.15)',
  'chat-bubble-assistant-avatar-text': '#a5b4fc',
  'chat-bubble-user-avatar-bg': '#86efac',
  'chat-bubble-user-avatar-text': '#052e16',
  'chat-bubble-user-bg': surfaces.dark.subtle,
  'chat-bubble-user-text': surfaces.dark.text,

  // ===== API 密钥管理 =====
  'components-api-key-card-bg': '#1e1e1e',
  'components-api-key-card-bg-hover': '#2a2a2a',
  'components-api-key-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-api-key-card-shadow':
    '0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25)',
  'components-api-key-header-bg': '#141414',
  'components-api-key-header-text': '#e4e4e7',
  'components-api-key-value-bg': 'rgba(255, 255, 255, 0.05)',
  'components-api-key-value-text': '#f4f4f5',
  'components-api-key-value-masked': '#52525b',
  'components-api-key-actions-bg': '#1e1e1e',
  'components-api-key-actions-border': 'rgba(255, 255, 255, 0.10)',

  // ===== API 状态指示器 =====
  'components-api-status-online-bg': 'rgba(34, 197, 94, 0.12)',
  'components-api-status-online-text': '#86efac',
  'components-api-status-online-dot': '#22c55e',
  'components-api-status-offline-bg': 'rgba(113, 113, 122, 0.12)',
  'components-api-status-offline-text': '#a1a1aa',
  'components-api-status-offline-dot': '#71717a',
  'components-api-status-error-bg': 'rgba(239, 68, 68, 0.12)',
  'components-api-status-error-text': '#fca5a5',
  'components-api-status-error-dot': '#ef4444',

  // ===== HTTP 方法颜色系统 =====
  'components-http-method-get-bg': 'rgba(34, 197, 94, 0.12)',
  'components-http-method-get-text': '#86efac',
  'components-http-method-get-border': 'rgba(34, 197, 94, 0.25)',
  'components-http-method-post-bg': 'rgba(99, 102, 241, 0.12)',
  'components-http-method-post-text': '#a5b4fc',
  'components-http-method-post-border': 'rgba(99, 102, 241, 0.25)',
  'components-http-method-put-bg': 'rgba(245, 158, 11, 0.12)',
  'components-http-method-put-text': '#fcd34d',
  'components-http-method-put-border': 'rgba(245, 158, 11, 0.25)',
  'components-http-method-delete-bg': 'rgba(239, 68, 68, 0.12)',
  'components-http-method-delete-text': '#fca5a5',
  'components-http-method-delete-border': 'rgba(239, 68, 68, 0.25)',
  'components-http-method-patch-bg': 'rgba(168, 85, 247, 0.12)',
  'components-http-method-patch-text': '#d8b4fe',
  'components-http-method-patch-border': 'rgba(168, 85, 247, 0.25)',

  // ===== API 文档风格组件 =====
  'components-api-docs-bg': '#1a1a1a',
  'components-api-docs-border': 'rgba(255, 255, 255, 0.10)',
  'components-api-docs-header-bg':
    'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(165, 180, 252, 0.12) 100%)',
  'components-api-docs-header-border': 'rgba(255, 255, 255, 0.08)',
  'components-api-docs-sidebar-bg': 'rgba(18, 18, 18, 0.85)',
  'components-api-docs-sidebar-border': 'rgba(255, 255, 255, 0.08)',
  'components-api-docs-content-bg': '#1e1e1e',
  'components-api-docs-search-bg': 'rgba(255, 255, 255, 0.05)',
  'components-api-docs-search-border': 'rgba(255, 255, 255, 0.12)',
  'components-api-docs-search-focus-border': palette.dark.focus,

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': 'rgba(26, 26, 26, 0.80)',
  'components-glassmorphism-border': 'rgba(255, 255, 255, 0.10)',
  'components-glassmorphism-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
  'components-gradient-primary':
    'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
  'components-gradient-secondary':
    'linear-gradient(135deg, #f0abfc 0%, #f472b6 100%)',
  'components-gradient-accent':
    'linear-gradient(135deg, #67e8f9 0%, #22d3ee 100%)',
  'components-modern-card-bg': 'rgba(30, 30, 30, 0.95)',
  'components-modern-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-modern-card-shadow':
    '0 8px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25)',

  // ===== 首页推荐卡片系统 =====
  // 推荐卡片共享中性内容面板，选中和焦点由交互令牌表达
  'components-recommend-card-bg-1': surfaces.dark.surface,
  'components-recommend-card-bg-2': surfaces.dark.surface,
  'components-recommend-card-bg-3': surfaces.dark.surface,
  'components-recommend-card-bg-4': surfaces.dark.surface,
  'components-recommend-card-text': surfaces.dark.text,
  'components-recommend-card-tag': surfaces.dark.secondary,

  // ===== 画布系统 (Agent Canvas) - 暗色主题 =====
  // 画布背景
  'components-canvas-bg': 'rgb(18, 18, 18)',
  'components-canvas-grid': 'rgba(255, 255, 255, 0.12)',
  'components-canvas-spotlight': '#ffffff',

  // 节点通用
  'components-canvas-node-bg': '#202025',
  'components-canvas-node-border': 'rgba(255, 255, 255, 0.1)',
  'components-canvas-node-border-hover': 'rgba(255, 255, 255, 0.15)',
  'components-canvas-node-border-selected': palette.dark.selection,
  'components-canvas-node-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)',

  // 节点运行态
  'components-canvas-node-status-running-border': '#38bdf8', // sky-400
  'components-canvas-node-status-running-halo': 'rgba(56, 189, 248, 0.22)',
  'components-canvas-node-status-running-icon': '#7dd3fc', // sky-300
  'components-canvas-node-status-success-border': '#22c55e', // green-500
  'components-canvas-node-status-success-bg': 'rgba(34, 197, 94, 0.18)',
  'components-canvas-node-status-success-text': '#86efac', // green-300
  'components-canvas-node-status-error-border': '#f87171', // red-400
  'components-canvas-node-status-error-bg': 'rgba(248, 113, 113, 0.18)',
  'components-canvas-node-status-error-text': '#fca5a5', // red-300

  // 边线
  'components-canvas-edge-stroke': 'rgb(113, 113, 122)',
  'components-canvas-edge-stroke-hover': 'rgb(161, 161, 170)',
  'components-canvas-edge-stroke-selected': palette.dark.selection,
  'components-canvas-edge-stroke-flowing': '#38bdf8', // sky-400
  'components-canvas-edge-marker': 'rgb(113, 113, 122)',
  'components-canvas-edge-marker-selected': palette.dark.selection,

  // 连接点
  'components-canvas-handle-bg': palette.dark.selection,
  'components-canvas-handle-border': '#202025',
  'components-canvas-handle-icon': '#ffffff',

  // 工具栏
  'components-canvas-toolbar-bg': '#202025',
  'components-canvas-toolbar-border': 'rgba(255, 255, 255, 0.1)',
  'components-canvas-toolbar-shadow': '0 2px 8px rgba(0, 0, 0, 0.3)',

  // 节点类型图标颜色（暗色主题 - 适当调亮）
  'components-canvas-icon-start': '#4ade80', // green-400
  'components-canvas-icon-retrieval': '#60a5fa', // blue-400
  'components-canvas-icon-generate': '#c084fc', // purple-400
  'components-canvas-icon-message': '#2dd4bf', // teal-400
  'components-canvas-icon-tool': '#fb923c', // orange-400
  'components-canvas-icon-file': '#4ade80', // green-400
  'components-canvas-icon-parser': '#60a5fa', // blue-400
  'components-canvas-icon-splitter': '#fb923c', // orange-400
  'components-canvas-icon-tokenizer': '#c084fc', // purple-400
  'components-canvas-icon-extractor': '#818cf8', // indigo-400
  'components-canvas-icon-switch': '#facc15', // yellow-400
  'components-canvas-icon-categorize': '#f472b6', // pink-400
  'components-canvas-icon-agent': '#a78bfa', // violet-400
  'components-canvas-icon-code': '#9ca3af', // gray-400
  'components-canvas-icon-default': '#a1a1aa', // zinc-400

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
  'components-app-shell-surface': surfaces.dark.surface,
  'components-app-shell-border': surfaces.dark.border,
  'components-app-shell-shadow': '0 24px 48px -24px rgba(0, 0, 0, 0.6)',
  'components-main-workbench-bg': surfaces.dark.canvas,
  'components-main-workbench-surface': surfaces.dark.surface,
  'components-main-workbench-border': surfaces.dark.border,
  'components-main-workbench-shadow': '0 24px 48px -24px rgba(0, 0, 0, 0.65)',
  'components-page-header-bg': surfaces.dark.surface,
  'components-page-header-border': surfaces.dark.borderSubtle,
  'components-page-header-title': surfaces.dark.text,
  'components-page-header-description': surfaces.dark.secondary,
  'components-page-toolbar-bg': surfaces.dark.surface,
  'components-page-toolbar-border': surfaces.dark.borderSubtle,
  'components-page-toolbar-text': surfaces.dark.secondary,
  'components-page-state-bg': surfaces.dark.surface,
  'components-page-state-border': surfaces.dark.borderSubtle,
  'components-page-state-icon-bg': 'rgba(255, 255, 255, 0.07)',
  'components-page-state-icon': palette.dark.selection,
  'components-page-state-title': surfaces.dark.text,
  'components-page-state-description': surfaces.dark.secondary,
  'components-settings-rail-bg': surfaces.dark.surface,
  'components-settings-rail-border': surfaces.dark.borderSubtle,
  'components-settings-rail-title': surfaces.dark.text,
  'components-settings-rail-description': surfaces.dark.secondary,
  'components-settings-rail-section-text': surfaces.dark.secondary,
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
  'components-split-pane-surface': surfaces.dark.surface,
  'components-split-pane-border': surfaces.dark.border,

  // ===== 设置页面专用 =====
  'components-settings-sidebar-section-text': surfaces.dark.secondary,
  'components-settings-content-bg': surfaces.dark.canvas,
  'components-settings-section-bg': surfaces.dark.surface,
  'components-settings-section-border': surfaces.dark.borderSubtle,
  'components-settings-section-title': surfaces.dark.text,
  'components-settings-section-description': surfaces.dark.secondary,
  'components-settings-user-role-bg': palette.dark.selectionTint,

  // ===== 系统状态页面专用 =====
  'components-system-accent-bg': palette.dark.selectionTint,
  'components-system-accent-border': palette.dark.selection,
  'components-system-accent-text': palette.dark.selectionText,
  'components-system-accent-soft': palette.dark.selectionSoft,
  'components-system-page-bg': surfaces.dark.canvas,
  'components-system-panel-bg': surfaces.dark.surface,
  'components-system-panel-border': 'rgba(255, 255, 255, 0.10)',
  'components-system-panel-shadow':
    '0 20px 25px -12px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.35)',
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

  'components-system-health-ok-bg': 'rgba(34, 197, 94, 0.12)',
  'components-system-health-ok-border': '#22c55e',
  'components-system-health-ok-text': '#4ade80',
  'components-system-health-warning-bg': 'rgba(245, 158, 11, 0.12)',
  'components-system-health-warning-border': '#f59e0b',
  'components-system-health-warning-text': '#fbbf24',
  'components-system-health-error-bg': 'rgba(239, 68, 68, 0.12)',
  'components-system-health-error-border': '#ef4444',
  'components-system-health-error-text': '#f87171',

  'components-system-status-card-bg': surfaces.dark.surface,
  'components-system-status-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-system-status-card-border-hover': 'rgba(255, 255, 255, 0.2)',
  'components-system-status-card-shadow':
    '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.15)',
  'components-system-status-ok-bg': 'rgba(34, 197, 94, 0.12)',
  'components-system-status-ok-border': 'rgba(34, 197, 94, 0.35)',
  'components-system-status-ok-text': '#4ade80',
  'components-system-status-warning-bg': 'rgba(245, 158, 11, 0.12)',
  'components-system-status-warning-border': 'rgba(245, 158, 11, 0.35)',
  'components-system-status-warning-text': '#fbbf24',
  'components-system-status-error-bg': 'rgba(239, 68, 68, 0.12)',
  'components-system-status-error-border': 'rgba(239, 68, 68, 0.35)',
  'components-system-status-error-text': '#f87171',

  'components-system-chart-grid': 'rgba(255, 255, 255, 0.10)',
  'components-system-chart-axis': surfaces.dark.secondary,
  'components-system-chart-tooltip-bg': '#1e1e1e',
  'components-system-chart-tooltip-border': 'rgba(255, 255, 255, 0.12)',
  'components-system-chart-tooltip-text': surfaces.dark.text,
  'components-system-chart-tooltip-muted': '#a1a1aa',
  'components-system-chart-done': '#4ade80',
  'components-system-chart-done-soft': 'rgba(74, 222, 128, 0.12)',
  'components-system-chart-failed': '#f87171',
  'components-system-chart-failed-soft': 'rgba(248, 113, 113, 0.12)',
  'components-system-chart-pending': '#fbbf24',
  'components-system-chart-pending-soft': 'rgba(251, 191, 36, 0.12)',
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

/**
 * 序列化一套令牌为稳定排序（按 key 升序）的 TS 对象字面量正文。
 * 确定性输出，避免无意义 diff；用 JSON.stringify 处理 key/value 的转义。
 */
function serializeTokenValues(tokens: DesignTokens): string {
  const keys = (Object.keys(tokens) as (keyof DesignTokens)[]).sort((a, b) =>
    String(a).localeCompare(String(b)),
  )
  return keys
    .map(
      (key) =>
        `  ${JSON.stringify(String(key))}: ${JSON.stringify(tokens[key])},`,
    )
    .join('\n')
}

/**
 * 生成 typed JS token target（与 generateThemeCSS 并列的第二个构建目标）。
 *
 * 同一份单一来源（lightTokens/darkTokens）除产出 CSS 变量外，再产出 typed、
 * Object.freeze 的 JS 值，供 canvas / G6 等非 Tailwind 渲染器在编译期类型安全地
 * 按主题 import，取代运行期 getComputedStyle 读回 CSS 变量的次优路径。
 */
export function generateTokenValuesModule(): string {
  return `// AUTO-GENERATED by src/themes/build-themes.ts — DO NOT EDIT BY HAND.
// 运行 \`npm run build:themes\` 重新生成。源:src/themes/theme-generator.ts
import type { DesignTokens } from './tokens'

export const lightTokenValues: Readonly<DesignTokens> = Object.freeze({
${serializeTokenValues(lightTokens)}
})

export const darkTokenValues: Readonly<DesignTokens> = Object.freeze({
${serializeTokenValues(darkTokens)}
})
`
}

/**
 * 生成主题文件（主要入口函数）
 */
export function generateThemeFiles(): {
  light: string
  dark: string
  tokenValues: string
  errors: string[]
} {
  // 验证令牌
  const lightErrors = validateTokens(lightTokens)
  const darkErrors = validateTokens(darkTokens)
  const allErrors = [...lightErrors, ...darkErrors]

  if (allErrors.length > 0) {
    console.warn('设计令牌验证警告:', allErrors)
  }

  // 生成CSS文件内容
  const lightCSS = generateThemeCSS(lightTokens, 'light')
  const darkCSS = generateThemeCSS(darkTokens, 'dark')

  // 生成 typed JS token target（同一来源的第二个产物）
  const tokenValues = generateTokenValuesModule()

  return {
    light: lightCSS,
    dark: darkCSS,
    tokenValues,
    errors: allErrors,
  }
}
