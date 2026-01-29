/**
 * 自动化主题生成工具
 * 基于 Dify 项目的设计令牌系统
 * 自动生成 light.css 和 dark.css 文件，确保一致性
 */

import type { DesignTokens } from './tokens'

// 亮色主题令牌值定义
export const lightTokens: DesignTokens = {
  // ===== 文本系统 =====
  'text-primary': '#0f172a',
  'text-secondary': '#717182',
  'text-tertiary': '#a3a3a3',
  'text-muted': '#d4d4d4',
  'text-disabled': '#e5e7eb',
  'text-accent': '#1a1a1a',
  'text-success': '#059669',
  'text-warning': '#d97706',
  'text-error': '#dc2626',
  'text-inverted': '#ffffff',
  
  // ===== 背景系统 =====
  'background-body': '#ffffff',
  'background-default': '#f5f5f5',
  'background-subtle': '#f0f0f0',
  'background-section': '#ffffff',
  'background-overlay': 'rgba(0, 0, 0, 0.5)',
  'background-surface': '#ffffff',
  
  // ===== 边框系统 =====
  'border-default': 'rgba(0, 0, 0, 0.08)',
  'border-subtle': 'rgba(0, 0, 0, 0.05)',
  'border-strong': 'rgba(0, 0, 0, 0.12)',
  'border-accent': 'rgba(0, 0, 0, 0.1)',
  'border-success': '#10b981',
  'border-warning': '#f59e0b',
  'border-error': '#ef4444',
  
  // ===== 按钮组件 - Primary =====
  'components-button-primary-bg': '#18181b',
  'components-button-primary-bg-hover': '#27272a',
  'components-button-primary-bg-active': '#09090b',
  'components-button-primary-bg-disabled': '#ececf0',
  'components-button-primary-text': '#ffffff',
  'components-button-primary-text-disabled': '#9ca3af',
  'components-button-primary-border': '#18181b',
  'components-button-primary-border-hover': '#27272a',
  
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
  'components-input-border': '#e2e8f0',
  'components-input-border-hover': '#cbd5e1',
  'components-input-border-focus': '#00BEB4',
  'components-input-border-error': '#ef4444',
  'components-input-text': '#111827',
  'components-input-text-placeholder': '#9ca3af',
  'components-input-text-disabled': '#9ca3af',
  
  // ===== 卡片组件 =====
  'components-card-bg': '#ffffff',
  'components-card-bg-hover': '#fafafa',
  'components-card-border': 'rgba(0, 0, 0, 0.08)',
  'components-card-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  
  // ===== 侧边栏组件 =====
  'components-sidebar-bg': 'rgba(255, 255, 255, 0.98)',
  'components-sidebar-border': 'rgba(0, 0, 0, 0.06)',
  'components-sidebar-item-bg': 'transparent',
  'components-sidebar-item-bg-hover': 'rgba(0, 0, 0, 0.04)',
  'components-sidebar-item-bg-active': 'rgba(59, 130, 246, 0.08)',
  'components-sidebar-item-text': '#6b7280',
  'components-sidebar-item-text-active': '#00D4C8',
  
  // ===== 导航组件 =====
  'components-nav-bg': '#ffffff',
  'components-nav-border': '#e5e7eb',
  'components-nav-item-text': '#6b7280',
  'components-nav-item-text-hover': '#374151',
  'components-nav-item-text-active': '#00BEB4',
  
  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': '#ffffff',
  'components-dropdown-border': '#e5e7eb',
  'components-dropdown-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'components-dropdown-item-bg-hover': '#f3f4f6',
  'components-dropdown-item-text': '#374151',
  
  // ===== 模型选择器组件 =====
  'components-model-selector-dropdown-bg': '#ffffff',
  'components-model-selector-dropdown-border': '#e5e7eb',
  'components-model-selector-dropdown-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'components-model-selector-search-bg': '#f9fafb',
  'components-model-selector-search-border': '#d1d5db',
  'components-model-selector-search-text': '#111827',
  'components-model-selector-provider-header-bg': '#f3f4f6',
  'components-model-selector-provider-header-border': '#e5e7eb',
  'components-model-selector-provider-header-text': '#374151',
  'components-model-selector-item-bg': '#ffffff',
  'components-model-selector-item-border': '#e5e7eb',
  'components-model-selector-item-text': '#374151',
  'components-model-selector-item-bg-hover': '#f3f4f6',
  'components-model-selector-item-bg-selected': 'rgba(59, 130, 246, 0.1)',
  'components-model-selector-item-text-selected': '#33D4CB',
  'components-model-selector-overlay-bg': 'rgba(0, 0, 0, 0.3)',
  
  // ===== 模态框组件 =====
  'components-modal-bg': '#ffffff',
  'components-modal-overlay': 'rgba(0, 0, 0, 0.5)',
  'components-modal-border': '#e5e7eb',
  'components-modal-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // ===== 表格组件 =====
  'components-table-bg': '#ffffff',
  'components-table-border': '#e5e7eb',
  'components-table-header-bg': '#f9fafb',
  'components-table-row-bg-hover': '#f9fafb',
  'components-table-row-bg-selected': 'rgba(30, 64, 175, 0.1)',
  
  // ===== 交互状态 =====
  'state-hover': '#f3f4f6',
  'state-active': '#e5e7eb',
  'state-focus': '#00BEB4',
  'state-disabled': '#e5e7eb',
  'state-success': '#10b981',
  'state-warning': '#f59e0b',
  'state-error': '#ef4444',
  
  // ===== 状态透明度变体 (10% opacity) =====
  'state-focus-10': 'rgba(30, 64, 175, 0.1)',
  'state-success-10': 'rgba(16, 185, 129, 0.1)',
  'state-warning-10': 'rgba(245, 158, 11, 0.1)',
  'state-error-10': 'rgba(239, 68, 68, 0.1)',
  'state-neutral-10': 'rgba(107, 114, 128, 0.1)',
  
  // ===== HTTP方法颜色系统 =====
  'components-method-get-bg': 'rgba(34, 197, 94, 0.1)',
  'components-method-get-text': '#166534',
  'components-method-get-border': '#22c55e',
  'components-method-post-bg': 'rgba(59, 130, 246, 0.1)',
  'components-method-post-text': '#00BEB4',
  'components-method-post-border': '#33D4CB',
  'components-method-put-bg': 'rgba(245, 158, 11, 0.1)',
  'components-method-put-text': '#d97706',
  'components-method-put-border': '#f59e0b',
  'components-method-delete-bg': 'rgba(239, 68, 68, 0.1)',
  'components-method-delete-text': '#dc2626',
  'components-method-delete-border': '#ef4444',
  'components-method-patch-bg': 'rgba(168, 85, 247, 0.1)',
  'components-method-patch-text': '#7c3aed',
  'components-method-patch-border': '#a855f7',
  
  // ===== 环境状态指示器 =====
  'components-env-prod-bg': '#10b981',
  'components-env-prod-text': '#ffffff',
  'components-env-staging-bg': '#f59e0b',
  'components-env-staging-text': '#ffffff',
  'components-env-dev-bg': '#33D4CB',
  'components-env-dev-text': '#ffffff',
  
  // ===== 阴影系统 =====
  'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // ===== 表单控件 =====
  'components-checkbox-bg': '#ffffff',
  'components-checkbox-bg-checked': '#00BEB4',
  'components-checkbox-border': '#d1d5db',
  'components-checkbox-border-checked': '#00BEB4',
  'components-checkbox-icon': '#ffffff',
  
  'components-radio-bg': '#ffffff',
  'components-radio-bg-checked': '#ffffff',
  'components-radio-border': '#d1d5db',
  'components-radio-border-checked': '#00BEB4',
  'components-radio-dot': '#00BEB4',
  
  'components-select-bg': '#ffffff',
  'components-select-border': '#d1d5db',
  'components-select-border-focus': '#00BEB4',
  'components-select-text': '#111827',
  'components-select-placeholder': '#9ca3af',
  
  'components-switch-bg': '#e5e7eb',
  'components-switch-bg-checked': '#00BEB4',
  'components-switch-thumb': '#ffffff',
  'components-switch-thumb-checked': '#ffffff',
  
  // ===== 滑块组件 =====
  'components-slider-track': '#e5e7eb',
  'components-slider-range': '#00BEB4',
  'components-slider-thumb': '#ffffff',
  'components-slider-thumb-border': '#00BEB4',
  
  // ===== 滚动条系统 =====
  'components-scrollbar-track': '#f3f4f6',
  'components-scrollbar-thumb': '#d1d5db',
  'components-scrollbar-thumb-hover': '#9ca3af',
  
  // ===== 对话框和覆盖层 =====
  'components-dialog-bg': '#ffffff',
  'components-dialog-border': '#e5e7eb',
  'components-dialog-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  'components-dialog-overlay': 'rgba(0, 0, 0, 0.5)',
  
  'components-popover-bg': '#ffffff',
  'components-popover-border': '#e5e7eb',
  'components-popover-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  
  'components-tooltip-bg': '#1f2937',
  'components-tooltip-text': '#ffffff',
  'components-tooltip-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  
  // ===== 导航和标签 =====
  'components-tabs-border': '#e5e7eb',
  'components-tabs-bg': '#f5f5f5',
  'components-tabs-active-bg': '#ffffff',
  'components-tabs-active-text': '#1a1a1a',
  'components-tabs-inactive-text': '#737373',
  
  'components-breadcrumb-text': '#6b7280',
  'components-breadcrumb-text-current': '#1f2937',
  'components-breadcrumb-separator': '#9ca3af',
  
  // ===== 状态和通知 =====
  'components-alert-info-bg': '#eff6ff',
  'components-alert-info-border': '#00BEB4',
  'components-alert-info-text': '#00BEB4',
  
  'components-alert-success-bg': '#f0fdf4',
  'components-alert-success-border': '#22c55e',
  'components-alert-success-text': '#15803d',
  
  'components-alert-warning-bg': '#fffbeb',
  'components-alert-warning-border': '#f59e0b',
  'components-alert-warning-text': '#d97706',
  
  'components-alert-error-bg': '#fef2f2',
  'components-alert-error-border': '#ef4444',
  'components-alert-error-text': '#dc2626',
  
  // ===== 加载和进度 =====
  'components-skeleton-bg': '#f3f4f6',
  'components-progress-bg': '#e5e7eb',
  'components-progress-fill': '#00BEB4',
  'components-spinner-color': '#00BEB4',
  
  // ===== 代码和预格式化文本 =====
  'components-code-bg': '#f6f8fa',
  'components-code-text': '#e1352b',
  'components-code-border': '#d1d5db',
  
  'components-pre-bg': '#f6f8fa',
  'components-pre-text': '#24292e',
  'components-pre-border': '#e1e4e8',
  
  // ===== 新增组件令牌（使用基础颜色映射） =====
  // 徽章和标签
  'components-badge-bg': '#f5f5f5',
  'components-badge-text': '#737373',
  'components-badge-border': '#eaeaea',
  'components-badge-success-bg': '#dcfce7',
  'components-badge-success-text': '#166534',
  'components-badge-warning-bg': '#fef3c7',
  'components-badge-warning-text': '#92400e',
  'components-badge-error-bg': '#fee2e2',
  'components-badge-error-text': '#991b1b',
  'components-badge-info-bg': '#dbeafe',
  'components-badge-info-text': '#00BEB4',
  'components-badge-neutral-bg': '#f3f4f6',
  'components-badge-neutral-text': '#6b7280',
  'components-badge-blue-bg': '#dbeafe',
  'components-badge-blue-text': '#1d4ed8',
  'components-badge-orange-bg': '#ffedd5',
  'components-badge-orange-text': '#c2410c',

  // 任务状态指示器 - 亮色主题
  'components-task-status-idle-bg': 'rgba(107, 114, 128, 0.1)',
  'components-task-status-idle-border': 'rgba(107, 114, 128, 0.2)',
  'components-task-status-idle-text': '#4b5563',
  'components-task-status-idle-dot': '#9ca3af',

  'components-task-status-running-bg': 'linear-gradient(to right, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1))',
  'components-task-status-running-border': 'rgba(59, 130, 246, 0.2)',
  'components-task-status-running-text': '#00D4C8',
  'components-task-status-running-dot': '#33D4CB',
  'components-task-status-running-progress-bg': 'rgba(107, 114, 128, 0.2)',
  'components-task-status-running-progress-fill': 'linear-gradient(to right, #33D4CB, #8b5cf6)',
  'components-task-status-running-progress-glow': 'linear-gradient(to right, rgba(59, 130, 246, 0.5), rgba(139, 92, 246, 0.5))',

  'components-task-status-cancelled-bg': 'rgba(245, 158, 11, 0.1)',
  'components-task-status-cancelled-border': 'rgba(245, 158, 11, 0.2)',
  'components-task-status-cancelled-text': '#d97706',

  'components-task-status-completed-bg': 'rgba(16, 185, 129, 0.1)',
  'components-task-status-completed-border': 'rgba(16, 185, 129, 0.2)',
  'components-task-status-completed-text': '#059669',

  'components-task-status-failed-bg': 'rgba(239, 68, 68, 0.1)',
  'components-task-status-failed-border': 'rgba(239, 68, 68, 0.2)',
  'components-task-status-failed-text': '#dc2626',

  'components-tag-bg': '#f3f4f6',
  'components-tag-text': '#374151',
  'components-tag-border': '#e5e7eb',
  'components-tag-bg-hover': '#e5e7eb',
  'components-tag-close-hover': '#dc2626',
  
  // 分页器
  'components-pagination-bg': '#ffffff',
  'components-pagination-text': '#6b7280',
  'components-pagination-border': '#e5e7eb',
  'components-pagination-item-bg': '#ffffff',
  'components-pagination-item-bg-hover': '#f9fafb',
  'components-pagination-item-bg-active': '#18181b',
  'components-pagination-item-text': '#374151',
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-bg': '#f9fafb',
  'components-pagination-disabled-text': '#d1d5db',
  
  // 步骤器
  'components-steps-bg': '#ffffff',
  'components-steps-border': '#e5e7eb',
  'components-steps-completed-bg': '#10b981',
  'components-steps-completed-text': '#ffffff',
  'components-steps-active-bg': '#030213',
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': '#f3f3f5',
  'components-steps-inactive-text': '#717182',
  'components-steps-line': '#e5e7eb',
  'components-steps-line-completed': '#10b981',
  
  // 其余新增组件令牌使用合适的基础颜色
  'components-loader-primary': '#00BEB4',
  'components-loader-secondary': '#d1d5db',
  'components-skeleton-base': '#f3f4f6',
  'components-skeleton-shimmer': '#ffffff',
  'components-skeleton-text': '#e5e7eb',
  
  'components-divider-bg': '#e5e7eb',
  'components-divider-text': '#9ca3af',
  
  'components-timeline-line': '#e5e7eb',
  'components-timeline-dot': '#d1d5db',
  'components-timeline-dot-active': '#00BEB4',
  'components-timeline-content-bg': '#ffffff',
  'components-timeline-content-border': '#e5e7eb',
  
  'components-calendar-bg': '#ffffff',
  'components-calendar-border': '#e5e7eb',
  'components-calendar-header-bg': '#f9fafb',
  'components-calendar-header-text': '#374151',
  'components-calendar-cell-bg': '#ffffff',
  'components-calendar-cell-text': '#374151',
  'components-calendar-cell-bg-hover': '#f3f4f6',
  'components-calendar-cell-bg-selected': '#00BEB4',
  'components-calendar-cell-text-selected': '#ffffff',
  'components-calendar-cell-bg-today': '#eff6ff',
  'components-calendar-cell-text-today': '#00D4C8',
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
  'components-collapse-header-text': '#374151',
  'components-collapse-content-bg': '#ffffff',
  'components-collapse-content-border': '#e5e7eb',
  
  'components-tree-bg': '#ffffff',
  'components-tree-border': '#e5e7eb',
  'components-tree-node-bg': 'transparent',
  'components-tree-node-bg-hover': '#f3f4f6',
  'components-tree-node-bg-selected': '#eff6ff',
  'components-tree-node-text': '#374151',
  'components-tree-node-text-selected': '#00D4C8',
  'components-tree-indent-line': '#e5e7eb',
  'components-tree-expand-icon': '#9ca3af',
  
  'components-transfer-bg': '#ffffff',
  'components-transfer-border': '#e5e7eb',
  'components-transfer-header-bg': '#f9fafb',
  'components-transfer-header-text': '#374151',
  'components-transfer-item-bg': '#ffffff',
  'components-transfer-item-bg-hover': '#f3f4f6',
  'components-transfer-item-bg-selected': '#eff6ff',
  'components-transfer-item-text': '#374151',
  'components-transfer-item-text-selected': '#00D4C8',
  
  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': 'rgba(3, 2, 19, 0.05)',
  'components-upload-border': 'rgba(113, 113, 130, 0.25)',
  'components-upload-border-hover': 'rgba(113, 113, 130, 0.5)',
  'components-upload-border-dragover': '#030213',
  'components-upload-text': '#374151',
  'components-upload-text-secondary': '#9ca3af',
  'components-upload-icon': '#d1d5db',
  'components-upload-progress-bg': '#e5e7eb',
  'components-upload-progress-fill': '#00BEB4',
  
  'components-statistic-title': '#9ca3af',
  'components-statistic-value': '#1f2937',
  'components-statistic-suffix': '#6b7280',
  'components-statistic-prefix': '#6b7280',
  
  'components-result-bg': '#ffffff',
  'components-result-icon-success': '#10b981',
  'components-result-icon-error': '#ef4444',
  'components-result-icon-warning': '#f59e0b',
  'components-result-icon-info': '#00BEB4',
  'components-result-title': '#1f2937',
  'components-result-subtitle': '#6b7280',
  
  'components-rate-star': '#d1d5db',
  'components-rate-star-active': '#fbbf24',
  'components-rate-star-hover': '#f59e0b',
  
  'components-anchor-bg': '#ffffff',
  'components-anchor-border': '#e5e7eb',
  'components-anchor-link': '#6b7280',
  'components-anchor-link-active': '#00BEB4',
  'components-anchor-link-hover': '#374151',
  
  'components-backtop-bg': '#ffffff',
  'components-backtop-text': '#6b7280',
  'components-backtop-border': '#e5e7eb',
  'components-backtop-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  'components-backtop-bg-hover': '#f9fafb',
  
  'components-image-placeholder-bg': '#f3f4f6',
  'components-image-placeholder-text': '#9ca3af',
  'components-image-preview-bg': '#000000',
  'components-image-preview-overlay': 'rgba(0, 0, 0, 0.8)',
  'components-image-preview-toolbar-bg': 'rgba(0, 0, 0, 0.7)',
  'components-image-preview-toolbar-text': '#ffffff',
  
  'components-empty-bg': '#ffffff',
  'components-empty-text': '#9ca3af',
  'components-empty-text-secondary': '#d1d5db',
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
  'components-segmented-item-bg-active': '#ffffff',
  'components-segmented-item-text': '#737373',
  'components-segmented-item-text-active': '#1a1a1a',
  
  'components-mentions-bg': '#ffffff',
  'components-mentions-border': '#d1d5db',
  'components-mentions-dropdown-bg': '#ffffff',
  'components-mentions-dropdown-border': '#e5e7eb',
  'components-mentions-dropdown-shadow': '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  'components-mentions-item-bg-hover': '#f3f4f6',
  'components-mentions-item-text': '#374151',
  
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
  
  'components-card-meta-title': '#1f2937',
  'components-card-meta-description': '#6b7280',
  'components-card-actions-bg': '#f9fafb',
  'components-card-actions-border': '#e5e7eb',
  'components-card-cover-bg': '#f3f4f6',
  
  'components-list-bg': '#ffffff',
  'components-list-border': '#e5e7eb',
  'components-list-item-bg': '#ffffff',
  'components-list-item-bg-hover': '#f9fafb',
  'components-list-item-border': '#e5e7eb',
  'components-list-item-meta-title': '#1f2937',
  'components-list-item-meta-description': '#6b7280',
  'components-list-item-actions': '#9ca3af',
  
  'components-descriptions-bg': '#ffffff',
  'components-descriptions-border': '#e5e7eb',
  'components-descriptions-title': '#374151',
  'components-descriptions-content': '#1f2937',
  'components-descriptions-label': '#6b7280',
  'components-descriptions-item-border': '#f3f4f6',
  
  // ===== 聊天页面专用布局 =====
  'chat-header-bg': 'rgba(255, 255, 255, 0.95)',
  'chat-header-border': 'rgba(0, 0, 0, 0.06)',
  'chat-header-backdrop': 'blur(12px)',
  'chat-main-bg': '#fafafa',
  'chat-content-bg': '#ffffff',
  'chat-content-border': 'rgba(0, 0, 0, 0.04)',
  'chat-input-area-bg': 'rgba(255, 255, 255, 0.98)',
  'chat-input-area-border': 'rgba(0, 0, 0, 0.06)',
  'chat-input-area-shadow': '0 -1px 3px rgba(0, 0, 0, 0.05)',
  'chat-gradient-primary': 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.08) 50%, rgba(219, 234, 254, 0.05) 100%)',
  'chat-gradient-secondary': 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(110, 231, 183, 0.08) 100%)',
  'chat-welcome-border': 'rgba(59, 130, 246, 0.1)',
  'chat-welcome-shadow': '0 4px 20px rgba(59, 130, 246, 0.08)',
  'chat-input-area-backdrop': 'blur(20px)',
  
  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': 'blur(12px)',
  
  // ===== 编辑器组件 =====
  'components-editor-bg': '#ffffff',
  'components-editor-toolbar-bg': '#f9fafb',
  'components-editor-text': '#374151',
  'components-editor-border': '#e5e7eb',

  // ===== 面板组件 =====
  'components-panel-header-bg': '#f9fafb',
  'components-panel-header-text': '#374151',
  'components-panel-content-bg': '#ffffff',

  // ===== 图标按钮 =====
  'components-icon-button-text': '#6b7280',
  'components-icon-button-text-hover': '#374151',
  'components-icon-button-bg-hover': '#f3f4f6',

  // ===== 聊天预览增强 =====
  'chat-bubble-ai-bg': '#f8fafc',
  'chat-bubble-ai-text': '#1f2937',
  'chat-input-container-bg': '#f8fafc',
  'chat-preview-debug-bg': '#f9fafb',
  'chat-preview-debug-text': '#374151',
  'chat-think-bg': '#f3f4f6',
  'chat-think-border': '#e5e7eb',
  'chat-think-text': '#6b7280',

  // ===== 应用头像 =====
  'components-app-avatar-bg': 'linear-gradient(135deg, #8b5cf6 0%, #33D4CB 100%)',
  'components-app-avatar-border': 'rgba(139, 92, 246, 0.2)',
  
  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': '#f0f8ff',
  'chat-bubble-assistant-avatar-text': '#1890ff',
  'chat-bubble-user-avatar-bg': '#87d068',
  'chat-bubble-user-avatar-text': '#ffffff',
  'chat-bubble-user-bg': '#f3f4f6',
  'chat-bubble-user-text': '#374151',

  // ===== API 密钥管理 =====
  'components-api-key-card-bg': '#ffffff',
  'components-api-key-card-bg-hover': '#fafbfc',
  'components-api-key-card-border': 'rgba(0, 0, 0, 0.06)',
  'components-api-key-card-shadow': '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  'components-api-key-header-bg': '#f8fafc',
  'components-api-key-header-text': '#374151',
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
  'components-api-status-error-text': '#dc2626',
  'components-api-status-error-dot': '#ef4444',

  // ===== HTTP 方法颜色系统 =====
  'components-http-method-get-bg': '#f0fdf4',
  'components-http-method-get-text': '#15803d',
  'components-http-method-get-border': '#bbf7d0',
  'components-http-method-post-bg': '#eff6ff',
  'components-http-method-post-text': '#00BEB4',
  'components-http-method-post-border': '#bfdbfe',
  'components-http-method-put-bg': '#fffbeb',
  'components-http-method-put-text': '#d97706',
  'components-http-method-put-border': '#fde68a',
  'components-http-method-delete-bg': '#fef2f2',
  'components-http-method-delete-text': '#dc2626',
  'components-http-method-delete-border': '#fecaca',
  'components-http-method-patch-bg': '#fdf4ff',
  'components-http-method-patch-text': '#a855f7',
  'components-http-method-patch-border': '#e9d5ff',

  // ===== API 文档风格组件 =====
  'components-api-docs-bg': '#ffffff',
  'components-api-docs-border': '#e5e7eb',
  'components-api-docs-header-bg': 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 197, 253, 0.08) 100%)',
  'components-api-docs-header-border': 'rgba(0, 0, 0, 0.08)',
  'components-api-docs-sidebar-bg': 'rgba(255, 255, 255, 0.8)',
  'components-api-docs-sidebar-border': 'rgba(0, 0, 0, 0.06)',
  'components-api-docs-content-bg': '#ffffff',
  'components-api-docs-search-bg': '#ffffff',
  'components-api-docs-search-border': '#d1d5db',
  'components-api-docs-search-focus-border': '#33D4CB',

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': 'rgba(255, 255, 255, 0.75)',
  'components-glassmorphism-border': 'rgba(255, 255, 255, 0.2)',
  'components-glassmorphism-shadow': '0 8px 32px rgba(31, 38, 135, 0.15)',
  'components-gradient-primary': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'components-gradient-secondary': 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'components-gradient-accent': 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'components-modern-card-bg': 'rgba(255, 255, 255, 0.9)',
  'components-modern-card-border': 'rgba(255, 255, 255, 0.2)',
  'components-modern-card-shadow': '0 8px 24px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
}

// 暗色主题令牌值定义
export const darkTokens: DesignTokens = {
  // ===== 文本系统 =====
  'text-primary': '#ffffff',
  'text-secondary': '#e5e7eb',
  'text-tertiary': '#d1d5db',
  'text-muted': '#9ca3af',
  'text-disabled': '#6b7280',
  'text-accent': '#60a5fa',
  'text-success': '#4ade80',
  'text-warning': '#fbbf24',
  'text-error': '#f87171',
  'text-inverted': '#111827',
  
  // ===== 背景系统 =====
  'background-body': '#121212',
  'background-default': '#1a1a1a',
  'background-subtle': '#262626',
  'background-section': '#1e1e1e',
  'background-overlay': 'rgba(0, 0, 0, 0.75)',
  'background-surface': '#1e1e1e',
  
  // ===== 边框系统 =====
  'border-default': 'rgba(255, 255, 255, 0.10)',
  'border-subtle': 'rgba(255, 255, 255, 0.06)',
  'border-strong': 'rgba(255, 255, 255, 0.15)',
  'border-accent': 'rgba(255, 255, 255, 0.12)',
  'border-success': '#22c55e',
  'border-warning': '#f59e0b',
  'border-error': '#ef4444',
  
  // ===== 按钮组件 - Primary =====
  'components-button-primary-bg': '#3b82f6',
  'components-button-primary-bg-hover': '#2563eb',
  'components-button-primary-bg-active': '#1d4ed8',
  'components-button-primary-bg-disabled': 'rgba(59, 130, 246, 0.1)',
  'components-button-primary-text': '#ffffff',
  'components-button-primary-text-disabled': 'rgba(255, 255, 255, 0.4)',
  'components-button-primary-border': '#3b82f6',
  'components-button-primary-border-hover': '#2563eb',
  
  // ===== 按钮组件 - Secondary =====
  'components-button-secondary-bg': 'rgba(255, 255, 255, 0.05)',
  'components-button-secondary-bg-hover': 'rgba(255, 255, 255, 0.1)',
  'components-button-secondary-bg-active': 'rgba(255, 255, 255, 0.15)',
  'components-button-secondary-bg-disabled': 'rgba(255, 255, 255, 0.03)',
  'components-button-secondary-text': '#ffffff',
  'components-button-secondary-text-disabled': 'rgba(255, 255, 255, 0.4)',
  'components-button-secondary-border': 'rgba(255, 255, 255, 0.1)',
  'components-button-secondary-border-hover': 'rgba(255, 255, 255, 0.2)',
  
  // ===== 按钮组件 - Ghost =====
  'components-button-ghost-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-button-ghost-text': '#ffffff',
  'components-button-ghost-text-disabled': 'rgba(255, 255, 255, 0.4)',
  
  // ===== 输入框组件 =====
  'components-input-bg': 'rgba(255, 255, 255, 0.05)',
  'components-input-bg-hover': 'rgba(255, 255, 255, 0.08)',
  'components-input-bg-focus': 'rgba(255, 255, 255, 0.1)',
  'components-input-bg-disabled': 'rgba(255, 255, 255, 0.03)',
  'components-input-border': '#64748b',
  'components-input-border-hover': '#94a3b8',
  'components-input-border-focus': '#3b82f6',
  'components-input-border-error': '#ef4444',
  'components-input-text': '#ffffff',
  'components-input-text-placeholder': '#94a3b8',
  'components-input-text-disabled': '#64748b',
  
  // ===== 卡片组件 =====
  'components-card-bg': '#1e1e1e',
  'components-card-bg-hover': '#2a2a2a',
  'components-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-card-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.15)',
  
  // ===== 侧边栏组件 =====
  'components-sidebar-bg': 'rgba(18, 18, 18, 0.98)',
  'components-sidebar-border': 'rgba(255, 255, 255, 0.08)',
  'components-sidebar-item-bg': 'transparent',
  'components-sidebar-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-sidebar-item-bg-active': 'rgba(99, 102, 241, 0.15)',
  'components-sidebar-item-text': '#a1a1aa',
  'components-sidebar-item-text-active': '#818cf8',
  
  // ===== 导航组件 =====
  'components-nav-bg': '#1a1a1a',
  'components-nav-border': 'rgba(255, 255, 255, 0.10)',
  'components-nav-item-text': '#a1a1aa',
  'components-nav-item-text-hover': '#ffffff',
  'components-nav-item-text-active': '#818cf8',
  
  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': '#1e1e1e',
  'components-dropdown-border': 'rgba(255, 255, 255, 0.12)',
  'components-dropdown-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
  'components-dropdown-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-dropdown-item-text': '#ffffff',
  
  // ===== 模型选择器组件 =====
  'components-model-selector-dropdown-bg': '#1e1e1e',
  'components-model-selector-dropdown-border': 'rgba(255, 255, 255, 0.12)',
  'components-model-selector-dropdown-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
  'components-model-selector-search-bg': 'rgba(255, 255, 255, 0.06)',
  'components-model-selector-search-border': 'rgba(255, 255, 255, 0.12)',
  'components-model-selector-search-text': '#f9fafb',
  'components-model-selector-provider-header-bg': 'rgba(255, 255, 255, 0.04)',
  'components-model-selector-provider-header-border': 'rgba(255, 255, 255, 0.10)',
  'components-model-selector-provider-header-text': '#ffffff',
  'components-model-selector-item-bg': '#1e1e1e',
  'components-model-selector-item-border': 'rgba(255, 255, 255, 0.10)',
  'components-model-selector-item-text': '#ffffff',
  'components-model-selector-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-model-selector-item-bg-selected': 'rgba(99, 102, 241, 0.15)',
  'components-model-selector-item-text-selected': '#818cf8',
  'components-model-selector-overlay-bg': 'rgba(0, 0, 0, 0.6)',
  
  // ===== 模态框组件 =====
  'components-modal-bg': '#1e1e1e',
  'components-modal-overlay': 'rgba(0, 0, 0, 0.75)',
  'components-modal-border': 'rgba(255, 255, 255, 0.12)',
  'components-modal-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
  
  // ===== 表格组件 =====
  'components-table-bg': '#1a1a1a',
  'components-table-border': 'rgba(255, 255, 255, 0.10)',
  'components-table-header-bg': '#141414',
  'components-table-row-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-table-row-bg-selected': 'rgba(99, 102, 241, 0.15)',
  
  // ===== 交互状态 =====
  'state-hover': 'rgba(255, 255, 255, 0.06)',
  'state-active': 'rgba(255, 255, 255, 0.12)',
  'state-focus': '#818cf8',
  'state-disabled': 'rgba(255, 255, 255, 0.05)',
  'state-success': '#22c55e',
  'state-warning': '#f59e0b',
  'state-error': '#ef4444',
  
  // ===== 状态透明度变体 (10% opacity) =====
  'state-focus-10': 'rgba(129, 140, 248, 0.15)',
  'state-success-10': 'rgba(34, 197, 94, 0.12)',
  'state-warning-10': 'rgba(245, 158, 11, 0.12)',
  'state-error-10': 'rgba(239, 68, 68, 0.12)',
  'state-neutral-10': 'rgba(161, 161, 170, 0.12)',
  
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
  'components-env-prod-bg': '#10b981',
  'components-env-prod-text': '#ffffff',
  'components-env-staging-bg': '#f59e0b',
  'components-env-staging-text': '#ffffff',
  'components-env-dev-bg': '#3b82f6',
  'components-env-dev-text': '#ffffff',
  
  // ===== 阴影系统 =====
  'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
  'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  
  // ===== 表单控件 =====
  'components-checkbox-bg': 'rgba(255, 255, 255, 0.05)',
  'components-checkbox-bg-checked': '#3b82f6',
  'components-checkbox-border': '#4b5563',
  'components-checkbox-border-checked': '#3b82f6',
  'components-checkbox-icon': '#ffffff',
  
  'components-radio-bg': 'rgba(255, 255, 255, 0.05)',
  'components-radio-bg-checked': 'rgba(255, 255, 255, 0.05)',
  'components-radio-border': '#4b5563',
  'components-radio-border-checked': '#3b82f6',
  'components-radio-dot': '#3b82f6',
  
  'components-select-bg': 'rgba(255, 255, 255, 0.05)',
  'components-select-border': '#4b5563',
  'components-select-border-focus': '#3b82f6',
  'components-select-text': '#f9fafb',
  'components-select-placeholder': '#9ca3af',
  
  'components-switch-bg': 'rgba(255, 255, 255, 0.1)',
  'components-switch-bg-checked': '#3b82f6',
  'components-switch-thumb': '#ffffff',
  'components-switch-thumb-checked': '#ffffff',
  
  // ===== 滑块组件 =====
  'components-slider-track': 'rgba(255, 255, 255, 0.25)',
  'components-slider-range': '#3b82f6',
  'components-slider-thumb': '#ffffff',
  'components-slider-thumb-border': '#3b82f6',
  
  // ===== 滚动条系统 =====
  'components-scrollbar-track': 'rgba(255, 255, 255, 0.05)',
  'components-scrollbar-thumb': 'rgba(255, 255, 255, 0.2)',
  'components-scrollbar-thumb-hover': 'rgba(255, 255, 255, 0.3)',
  
  // ===== 对话框和覆盖层 =====
  'components-dialog-bg': '#1e293b',
  'components-dialog-border': '#475569',
  'components-dialog-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  'components-dialog-overlay': 'rgba(0, 0, 0, 0.75)',
  
  'components-popover-bg': '#1e293b',
  'components-popover-border': '#475569',
  'components-popover-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  
  'components-tooltip-bg': '#0f172a',
  'components-tooltip-text': '#ffffff',
  'components-tooltip-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
  
  // ===== 导航和标签 =====
  'components-tabs-border': '#475569',
  'components-tabs-bg': 'rgba(255, 255, 255, 0.05)',
  'components-tabs-active-bg': 'rgba(255, 255, 255, 0.1)',
  'components-tabs-active-text': '#60a5fa',
  'components-tabs-inactive-text': '#cbd5e1',
  
  'components-breadcrumb-text': '#cbd5e1',
  'components-breadcrumb-text-current': '#ffffff',
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
  'components-progress-fill': '#3b82f6',
  'components-spinner-color': '#3b82f6',
  
  // ===== 代码和预格式化文本 =====
  'components-code-bg': 'rgba(110, 118, 129, 0.15)',
  'components-code-text': '#79c0ff',
  'components-code-border': 'rgba(110, 118, 129, 0.2)',
  
  'components-pre-bg': '#161b22',
  'components-pre-text': '#e6edf3',
  'components-pre-border': '#30363d',
  
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

  // 任务状态指示器 - 暗色主题
  'components-task-status-idle-bg': 'rgba(161, 161, 170, 0.08)',
  'components-task-status-idle-border': 'rgba(161, 161, 170, 0.15)',
  'components-task-status-idle-text': '#a1a1aa',
  'components-task-status-idle-dot': '#71717a',

  'components-task-status-running-bg': 'linear-gradient(to right, rgba(99, 102, 241, 0.12), rgba(139, 92, 246, 0.12))',
  'components-task-status-running-border': 'rgba(99, 102, 241, 0.25)',
  'components-task-status-running-text': '#a5b4fc',
  'components-task-status-running-dot': '#818cf8',
  'components-task-status-running-progress-bg': 'rgba(161, 161, 170, 0.15)',
  'components-task-status-running-progress-fill': 'linear-gradient(to right, #818cf8, #a78bfa)',
  'components-task-status-running-progress-glow': 'linear-gradient(to right, rgba(99, 102, 241, 0.4), rgba(139, 92, 246, 0.4))',

  'components-task-status-cancelled-bg': 'rgba(245, 158, 11, 0.10)',
  'components-task-status-cancelled-border': 'rgba(245, 158, 11, 0.20)',
  'components-task-status-cancelled-text': '#fcd34d',

  'components-task-status-completed-bg': 'rgba(34, 197, 94, 0.10)',
  'components-task-status-completed-border': 'rgba(34, 197, 94, 0.20)',
  'components-task-status-completed-text': '#86efac',

  'components-task-status-failed-bg': 'rgba(239, 68, 68, 0.10)',
  'components-task-status-failed-border': 'rgba(239, 68, 68, 0.20)',
  'components-task-status-failed-text': '#fca5a5',

  'components-tag-bg': 'rgba(255, 255, 255, 0.08)',
  'components-tag-text': '#e4e4e7',
  'components-tag-border': 'rgba(255, 255, 255, 0.12)',
  'components-tag-bg-hover': 'rgba(255, 255, 255, 0.12)',
  'components-tag-close-hover': '#ef4444',
  
  // 分页器
  'components-pagination-bg': '#1a1a1a',
  'components-pagination-text': '#a1a1aa',
  'components-pagination-border': 'rgba(255, 255, 255, 0.10)',
  'components-pagination-item-bg': 'rgba(255, 255, 255, 0.05)',
  'components-pagination-item-bg-hover': 'rgba(255, 255, 255, 0.08)',
  'components-pagination-item-bg-active': '#818cf8',
  'components-pagination-item-text': '#ffffff',
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-bg': 'rgba(255, 255, 255, 0.03)',
  'components-pagination-disabled-text': '#52525b',
  
  // 步骤器
  'components-steps-bg': '#1a1a1a',
  'components-steps-border': 'rgba(255, 255, 255, 0.10)',
  'components-steps-completed-bg': '#22c55e',
  'components-steps-completed-text': '#ffffff',
  'components-steps-active-bg': '#818cf8',
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': 'rgba(255, 255, 255, 0.05)',
  'components-steps-inactive-text': '#71717a',
  'components-steps-line': 'rgba(255, 255, 255, 0.10)',
  'components-steps-line-completed': '#22c55e',
  
  // 其余组件令牌暗色适配
  'components-loader-primary': '#818cf8',
  'components-loader-secondary': '#52525b',
  'components-skeleton-base': 'rgba(255, 255, 255, 0.08)',
  'components-skeleton-shimmer': 'rgba(255, 255, 255, 0.15)',
  'components-skeleton-text': 'rgba(255, 255, 255, 0.05)',
  
  'components-divider-bg': 'rgba(255, 255, 255, 0.10)',
  'components-divider-text': '#71717a',
  
  'components-timeline-line': 'rgba(255, 255, 255, 0.10)',
  'components-timeline-dot': '#52525b',
  'components-timeline-dot-active': '#818cf8',
  'components-timeline-content-bg': '#1e1e1e',
  'components-timeline-content-border': 'rgba(255, 255, 255, 0.10)',
  
  'components-calendar-bg': '#1a1a1a',
  'components-calendar-border': 'rgba(255, 255, 255, 0.10)',
  'components-calendar-header-bg': '#141414',
  'components-calendar-header-text': '#ffffff',
  'components-calendar-cell-bg': 'rgba(255, 255, 255, 0.03)',
  'components-calendar-cell-text': '#ffffff',
  'components-calendar-cell-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-calendar-cell-bg-selected': '#818cf8',
  'components-calendar-cell-text-selected': '#ffffff',
  'components-calendar-cell-bg-today': 'rgba(129, 140, 248, 0.15)',
  'components-calendar-cell-text-today': '#a5b4fc',
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
  'components-collapse-header-text': '#ffffff',
  'components-collapse-content-bg': '#1e1e1e',
  'components-collapse-content-border': 'rgba(255, 255, 255, 0.10)',
  
  'components-tree-bg': '#1a1a1a',
  'components-tree-border': 'rgba(255, 255, 255, 0.10)',
  'components-tree-node-bg': 'transparent',
  'components-tree-node-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-tree-node-bg-selected': 'rgba(99, 102, 241, 0.15)',
  'components-tree-node-text': '#ffffff',
  'components-tree-node-text-selected': '#a5b4fc',
  'components-tree-indent-line': 'rgba(255, 255, 255, 0.10)',
  'components-tree-expand-icon': '#71717a',
  
  'components-transfer-bg': '#1a1a1a',
  'components-transfer-border': 'rgba(255, 255, 255, 0.10)',
  'components-transfer-header-bg': '#141414',
  'components-transfer-header-text': '#ffffff',
  'components-transfer-item-bg': 'rgba(255, 255, 255, 0.03)',
  'components-transfer-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-transfer-item-bg-selected': 'rgba(99, 102, 241, 0.15)',
  'components-transfer-item-text': '#ffffff',
  'components-transfer-item-text-selected': '#a5b4fc',
  
  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': 'rgba(99, 102, 241, 0.08)',
  'components-upload-border': 'rgba(255, 255, 255, 0.15)',
  'components-upload-border-hover': 'rgba(255, 255, 255, 0.25)',
  'components-upload-border-dragover': '#818cf8',
  'components-upload-text': '#ffffff',
  'components-upload-text-secondary': '#71717a',
  'components-upload-icon': '#52525b',
  'components-upload-progress-bg': 'rgba(255, 255, 255, 0.08)',
  'components-upload-progress-fill': '#818cf8',
  
  'components-statistic-title': '#71717a',
  'components-statistic-value': '#ffffff',
  'components-statistic-suffix': '#a1a1aa',
  'components-statistic-prefix': '#a1a1aa',
  
  'components-result-bg': '#1e1e1e',
  'components-result-icon-success': '#86efac',
  'components-result-icon-error': '#fca5a5',
  'components-result-icon-warning': '#fcd34d',
  'components-result-icon-info': '#a5b4fc',
  'components-result-title': '#ffffff',
  'components-result-subtitle': '#a1a1aa',
  
  'components-rate-star': '#52525b',
  'components-rate-star-active': '#fbbf24',
  'components-rate-star-hover': '#f59e0b',
  
  'components-anchor-bg': '#1a1a1a',
  'components-anchor-border': 'rgba(255, 255, 255, 0.10)',
  'components-anchor-link': '#a1a1aa',
  'components-anchor-link-active': '#a5b4fc',
  'components-anchor-link-hover': '#ffffff',
  
  'components-backtop-bg': '#1e1e1e',
  'components-backtop-text': '#a1a1aa',
  'components-backtop-border': 'rgba(255, 255, 255, 0.10)',
  'components-backtop-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  'components-backtop-bg-hover': 'rgba(255, 255, 255, 0.06)',
  
  'components-image-placeholder-bg': 'rgba(255, 255, 255, 0.05)',
  'components-image-placeholder-text': '#71717a',
  'components-image-preview-bg': '#000000',
  'components-image-preview-overlay': 'rgba(0, 0, 0, 0.9)',
  'components-image-preview-toolbar-bg': 'rgba(0, 0, 0, 0.85)',
  'components-image-preview-toolbar-text': '#ffffff',
  
  'components-empty-bg': '#1e1e1e',
  'components-empty-text': '#71717a',
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
  'components-segmented-item-bg-active': 'rgba(255, 255, 255, 0.12)',
  'components-segmented-item-text': '#a1a1aa',
  'components-segmented-item-text-active': '#ffffff',
  
  'components-mentions-bg': 'rgba(255, 255, 255, 0.05)',
  'components-mentions-border': 'rgba(255, 255, 255, 0.12)',
  'components-mentions-dropdown-bg': '#1e1e1e',
  'components-mentions-dropdown-border': 'rgba(255, 255, 255, 0.12)',
  'components-mentions-dropdown-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
  'components-mentions-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-mentions-item-text': '#ffffff',
  
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
  
  'components-card-meta-title': '#ffffff',
  'components-card-meta-description': '#a1a1aa',
  'components-card-actions-bg': '#141414',
  'components-card-actions-border': 'rgba(255, 255, 255, 0.10)',
  'components-card-cover-bg': 'rgba(255, 255, 255, 0.05)',
  
  'components-list-bg': '#1a1a1a',
  'components-list-border': 'rgba(255, 255, 255, 0.10)',
  'components-list-item-bg': 'rgba(255, 255, 255, 0.03)',
  'components-list-item-bg-hover': 'rgba(255, 255, 255, 0.06)',
  'components-list-item-border': 'rgba(255, 255, 255, 0.10)',
  'components-list-item-meta-title': '#ffffff',
  'components-list-item-meta-description': '#a1a1aa',
  'components-list-item-actions': '#71717a',
  
  'components-descriptions-bg': '#1a1a1a',
  'components-descriptions-border': 'rgba(255, 255, 255, 0.10)',
  'components-descriptions-title': '#ffffff',
  'components-descriptions-content': '#ffffff',
  'components-descriptions-label': '#a1a1aa',
  'components-descriptions-item-border': 'rgba(255, 255, 255, 0.06)',
  
  // ===== 聊天页面专用布局 =====
  'chat-header-bg': 'rgba(18, 18, 18, 0.95)',
  'chat-header-border': 'rgba(255, 255, 255, 0.08)',
  'chat-header-backdrop': 'blur(12px)',
  'chat-main-bg': '#121212',
  'chat-content-bg': '#1e1e1e',
  'chat-content-border': 'rgba(255, 255, 255, 0.06)',
  'chat-input-area-bg': 'rgba(18, 18, 18, 0.98)',
  'chat-input-area-border': 'rgba(255, 255, 255, 0.08)',
  'chat-input-area-shadow': '0 -1px 3px rgba(0, 0, 0, 0.4)',
  'chat-gradient-primary': 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(165, 180, 252, 0.12) 50%, rgba(79, 70, 229, 0.06) 100%)',
  'chat-gradient-secondary': 'linear-gradient(135deg, rgba(34, 197, 94, 0.08) 0%, rgba(134, 239, 172, 0.12) 100%)',
  'chat-welcome-border': 'rgba(99, 102, 241, 0.2)',
  'chat-welcome-shadow': '0 4px 20px rgba(99, 102, 241, 0.15)',
  'chat-input-area-backdrop': 'blur(20px)',
  
  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': 'blur(12px)',
  
  // ===== 编辑器组件 =====
  'components-editor-bg': '#1e1e1e',
  'components-editor-toolbar-bg': '#141414',
  'components-editor-text': '#ffffff',
  'components-editor-border': 'rgba(255, 255, 255, 0.10)',

  // ===== 面板组件 =====
  'components-panel-header-bg': '#141414',
  'components-panel-header-text': '#ffffff',
  'components-panel-content-bg': '#1e1e1e',

  // ===== 图标按钮 =====
  'components-icon-button-text': '#a1a1aa',
  'components-icon-button-text-hover': '#ffffff',
  'components-icon-button-bg-hover': 'rgba(255, 255, 255, 0.06)',

  // ===== 聊天预览增强 =====
  'chat-bubble-ai-bg': '#262626',
  'chat-bubble-ai-text': '#ffffff',
  'chat-input-container-bg': '#262626',
  'chat-preview-debug-bg': '#141414',
  'chat-preview-debug-text': '#ffffff',
  'chat-think-bg': '#1a1a1a',
  'chat-think-border': 'rgba(255, 255, 255, 0.15)',
  'chat-think-text': '#a3a3a3',

  // ===== 应用头像 =====
  'components-app-avatar-bg': 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
  'components-app-avatar-border': 'rgba(167, 139, 250, 0.3)',
  
  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': 'rgba(99, 102, 241, 0.15)',
  'chat-bubble-assistant-avatar-text': '#a5b4fc',
  'chat-bubble-user-avatar-bg': '#86efac',
  'chat-bubble-user-avatar-text': '#052e16',
  'chat-bubble-user-bg': '#262626',
  'chat-bubble-user-text': '#ffffff',

  // ===== API 密钥管理 =====
  'components-api-key-card-bg': '#1e1e1e',
  'components-api-key-card-bg-hover': '#2a2a2a',
  'components-api-key-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-api-key-card-shadow': '0 4px 12px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25)',
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
  'components-api-docs-header-bg': 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(165, 180, 252, 0.12) 100%)',
  'components-api-docs-header-border': 'rgba(255, 255, 255, 0.08)',
  'components-api-docs-sidebar-bg': 'rgba(18, 18, 18, 0.85)',
  'components-api-docs-sidebar-border': 'rgba(255, 255, 255, 0.08)',
  'components-api-docs-content-bg': '#1e1e1e',
  'components-api-docs-search-bg': 'rgba(255, 255, 255, 0.05)',
  'components-api-docs-search-border': 'rgba(255, 255, 255, 0.12)',
  'components-api-docs-search-focus-border': '#818cf8',

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': 'rgba(26, 26, 26, 0.80)',
  'components-glassmorphism-border': 'rgba(255, 255, 255, 0.10)',
  'components-glassmorphism-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
  'components-gradient-primary': 'linear-gradient(135deg, #818cf8 0%, #a78bfa 100%)',
  'components-gradient-secondary': 'linear-gradient(135deg, #f0abfc 0%, #f472b6 100%)',
  'components-gradient-accent': 'linear-gradient(135deg, #67e8f9 0%, #22d3ee 100%)',
  'components-modern-card-bg': 'rgba(30, 30, 30, 0.95)',
  'components-modern-card-border': 'rgba(255, 255, 255, 0.10)',
  'components-modern-card-shadow': '0 8px 24px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.25)',
}

/**
 * 生成主题 CSS 文件内容
 */
export function generateThemeCSS(tokens: DesignTokens, themeName: 'light' | 'dark'): string {
  const selector = themeName === 'light' ? 'html[data-theme="light"], :root' : 'html[data-theme="dark"]'
  
  let css = `/**\n * ${themeName === 'light' ? '亮色' : '暗色'}主题 CSS 变量定义\n * 基于 Dify 项目的设计令牌系统\n * \n * ⚠️ 注意: 此文件由代码自动生成，请勿手动修改!\n * 如需修改主题，请编辑 theme-generator.ts 文件\n */\n\n${selector} {\n  /* ===== Tailwind 通道变量 (用于 /alpha 透明度支持) ===== */\n  --twc-primary: ${themeName === 'light' ? '30 64 175' : '129 140 248'};\n  --twc-primary-foreground: 255 255 255;\n  --twc-foreground: ${themeName === 'light' ? '15 23 42' : '255 255 255'};\n  --twc-background: ${themeName === 'light' ? '255 255 255' : '18 18 18'};\n  --twc-ring: ${themeName === 'light' ? '59 130 246' : '129 140 248'};\n  --twc-border: ${themeName === 'light' ? '226 232 240' : '39 39 42'};\n\n`
  
  // 按分类组织令牌
  const categories = {
    '文本系统': Object.keys(tokens).filter(key => key.startsWith('text-')),
    '背景系统': Object.keys(tokens).filter(key => key.startsWith('background-')),
    '边框系统': Object.keys(tokens).filter(key => key.startsWith('border-')),
    '按钮组件': Object.keys(tokens).filter(key => key.startsWith('components-button-')),
    '输入框组件': Object.keys(tokens).filter(key => key.startsWith('components-input-')),
    '卡片组件': Object.keys(tokens).filter(key => key.startsWith('components-card-')),
    '侧边栏组件': Object.keys(tokens).filter(key => key.startsWith('components-sidebar-')),
    '导航组件': Object.keys(tokens).filter(key => key.startsWith('components-nav-')),
    '下拉菜单组件': Object.keys(tokens).filter(key => key.startsWith('components-dropdown-')),
    '模型选择器组件': Object.keys(tokens).filter(key => key.startsWith('components-model-selector-')),
    '编辑器组件': Object.keys(tokens).filter(key => key.startsWith('components-editor-')),
    '面板组件': Object.keys(tokens).filter(key => key.startsWith('components-panel-')),
    '聊天系统': Object.keys(tokens).filter(key => key.startsWith('chat-')),
    '模态框组件': Object.keys(tokens).filter(key => key.startsWith('components-modal-')),
    '表格组件': Object.keys(tokens).filter(key => key.startsWith('components-table-')),
    '交互状态': Object.keys(tokens).filter(key => key.startsWith('state-')),
    '阴影系统': Object.keys(tokens).filter(key => key.startsWith('shadow-')),
    '表单控件': Object.keys(tokens).filter(key => key.includes('-checkbox-') || key.includes('-radio-') || key.includes('-select-') || key.includes('-switch-')),
    '滚动条系统': Object.keys(tokens).filter(key => key.startsWith('components-scrollbar-')),
    '对话框和覆盖层': Object.keys(tokens).filter(key => key.includes('-dialog-') || key.includes('-popover-') || key.includes('-tooltip-')),
    '导航和标签': Object.keys(tokens).filter(key => key.includes('-tabs-') || key.includes('-breadcrumb-')),
    '状态和通知': Object.keys(tokens).filter(key => key.includes('-alert-')),
    '加载和进度': Object.keys(tokens).filter(key => key.includes('-skeleton-') || key.includes('-progress-') || key.includes('-spinner-') || key.includes('-loader-')),
    '代码和预格式化文本': Object.keys(tokens).filter(key => key.includes('-code-') || key.includes('-pre-')),
    '图标按钮': Object.keys(tokens).filter(key => key.startsWith('components-icon-button-')),
    '应用头像': Object.keys(tokens).filter(key => key.startsWith('components-app-avatar-')),
    '其他组件': Object.keys(tokens).filter(key => 
      !key.startsWith('text-') && 
      !key.startsWith('background-') && 
      !key.startsWith('border-') && 
      !key.startsWith('state-') && 
      !key.startsWith('shadow-') &&
      !key.startsWith('chat-') &&
      !key.includes('-button-') &&
      !key.includes('-input-') &&
      !key.includes('-card-') &&
      !key.includes('-sidebar-') &&
      !key.includes('-nav-') &&
      !key.includes('-dropdown-') &&
      !key.includes('-model-selector-') &&
      !key.includes('-editor-') &&
      !key.includes('-panel-') &&
      !key.includes('-icon-button-') &&
      !key.includes('-app-avatar-') &&
      !key.includes('-modal-') &&
      !key.includes('-table-') &&
      !key.includes('-checkbox-') &&
      !key.includes('-radio-') &&
      !key.includes('-select-') &&
      !key.includes('-switch-') &&
      !key.includes('-scrollbar-') &&
      !key.includes('-dialog-') &&
      !key.includes('-popover-') &&
      !key.includes('-tooltip-') &&
      !key.includes('-tabs-') &&
      !key.includes('-breadcrumb-') &&
      !key.includes('-alert-') &&
      !key.includes('-skeleton-') &&
      !key.includes('-progress-') &&
      !key.includes('-spinner-') &&
      !key.includes('-loader-') &&
      !key.includes('-code-') &&
      !key.includes('-pre-')
    )
  }
  
  Object.entries(categories).forEach(([categoryName, keys]) => {
    if (keys.length > 0) {
      css += `  /* ===== ${categoryName} ===== */\n`
      keys.forEach(key => {
        css += `  --color-${key}: ${tokens[key as keyof DesignTokens]};\n`
      })
      css += '\n'
    }
  })
  
  css += '}\n'
  
  return css
}

/**
 * 验证设计令牌完整性
 */
export function validateTokens(tokens: DesignTokens): string[] {
  const errors: string[] = []
  const tokenKeys = Object.keys(tokens) as (keyof DesignTokens)[]
  
  // 检查空值
  tokenKeys.forEach(key => {
    if (!tokens[key] || tokens[key].trim() === '') {
      errors.push(`设计令牌 "${key}" 值不能为空`)
    }
  })
  
  // 检查颜色值格式（跳过阴影、渐变、滤镜等非颜色类令牌）
  tokenKeys.forEach(key => {
    const value = tokens[key]
    if (!value) return
    const keyStr = String(key)
    
    // 跳过不需要颜色验证的特殊令牌
    if (keyStr.includes('shadow') || 
        keyStr.includes('gradient') || 
        keyStr.includes('backdrop') || 
        value.startsWith('blur(') || 
        value.startsWith('linear-gradient(') || 
        value.startsWith('radial-gradient(')) {
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
  const colorRegex = /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|var\([^)]+\)|transparent|inherit|currentColor|[a-zA-Z]+)$/
  return colorRegex.test(color.trim())
}

/**
 * 生成主题文件（主要入口函数）
 */
export function generateThemeFiles(): { light: string; dark: string; errors: string[] } {
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
  
  return {
    light: lightCSS,
    dark: darkCSS,
    errors: allErrors
  }
}