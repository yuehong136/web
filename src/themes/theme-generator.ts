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
  'components-button-primary-bg': '#1e40af',
  'components-button-primary-bg-hover': '#1d4ed8',
  'components-button-primary-bg-active': '#1e3a8a',
  'components-button-primary-bg-disabled': '#ececf0',
  'components-button-primary-text': '#ffffff',
  'components-button-primary-text-disabled': '#9ca3af',
  'components-button-primary-border': '#1e40af',
  'components-button-primary-border-hover': '#1d4ed8',
  
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
  
  // ===== 输入框组件 =====
  'components-input-bg': '#e9ecef',
  'components-input-bg-hover': '#dee2e6',
  'components-input-bg-focus': '#e9ecef',
  'components-input-bg-disabled': '#f3f3f5',
  'components-input-border': 'rgba(0, 0, 0, 0.25)',
  'components-input-border-hover': '#495057',
  'components-input-border-focus': '#1e40af',
  'components-input-border-error': '#ef4444',
  'components-input-text': '#1a1a1a',
  'components-input-text-placeholder': '#9e9e9e',
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
  'components-sidebar-item-text-active': '#2563eb',
  
  // ===== 导航组件 =====
  'components-nav-bg': '#ffffff',
  'components-nav-border': '#e5e7eb',
  'components-nav-item-text': '#6b7280',
  'components-nav-item-text-hover': '#374151',
  'components-nav-item-text-active': '#1e40af',
  
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
  'components-model-selector-item-text-selected': '#3b82f6',
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
  'state-focus': '#1e40af',
  'state-disabled': '#e5e7eb',
  'state-success': '#10b981',
  'state-warning': '#f59e0b',
  'state-error': '#ef4444',
  
  // ===== 阴影系统 =====
  'shadow-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  'shadow-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  'shadow-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  'shadow-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  
  // ===== 表单控件 =====
  'components-checkbox-bg': '#ffffff',
  'components-checkbox-bg-checked': '#1e40af',
  'components-checkbox-border': '#d1d5db',
  'components-checkbox-border-checked': '#1e40af',
  'components-checkbox-icon': '#ffffff',
  
  'components-radio-bg': '#ffffff',
  'components-radio-bg-checked': '#ffffff',
  'components-radio-border': '#d1d5db',
  'components-radio-border-checked': '#1e40af',
  'components-radio-dot': '#1e40af',
  
  'components-select-bg': '#ffffff',
  'components-select-border': '#d1d5db',
  'components-select-border-focus': '#1e40af',
  'components-select-text': '#111827',
  'components-select-placeholder': '#9ca3af',
  
  'components-switch-bg': '#e5e7eb',
  'components-switch-bg-checked': '#1e40af',
  'components-switch-thumb': '#ffffff',
  'components-switch-thumb-checked': '#ffffff',
  
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
  'components-alert-info-border': '#1e40af',
  'components-alert-info-text': '#1e40af',
  
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
  'components-progress-fill': '#1e40af',
  'components-spinner-color': '#1e40af',
  
  // ===== 代码和预格式化文本 =====
  'components-code-bg': '#f3f4f6',
  'components-code-text': '#dc2626',
  'components-code-border': '#e5e7eb',
  
  'components-pre-bg': '#1f2937',
  'components-pre-text': '#f9fafb',
  'components-pre-border': '#374151',
  
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
  'components-badge-info-text': '#1e40af',
  
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
  'components-pagination-item-bg-active': '#1e40af',
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
  'components-loader-primary': '#1e40af',
  'components-loader-secondary': '#d1d5db',
  'components-skeleton-base': '#f3f4f6',
  'components-skeleton-shimmer': '#ffffff',
  'components-skeleton-text': '#e5e7eb',
  
  'components-divider-bg': '#e5e7eb',
  'components-divider-text': '#9ca3af',
  
  'components-timeline-line': '#e5e7eb',
  'components-timeline-dot': '#d1d5db',
  'components-timeline-dot-active': '#1e40af',
  'components-timeline-content-bg': '#ffffff',
  'components-timeline-content-border': '#e5e7eb',
  
  'components-calendar-bg': '#ffffff',
  'components-calendar-border': '#e5e7eb',
  'components-calendar-header-bg': '#f9fafb',
  'components-calendar-header-text': '#374151',
  'components-calendar-cell-bg': '#ffffff',
  'components-calendar-cell-text': '#374151',
  'components-calendar-cell-bg-hover': '#f3f4f6',
  'components-calendar-cell-bg-selected': '#1e40af',
  'components-calendar-cell-text-selected': '#ffffff',
  'components-calendar-cell-bg-today': '#eff6ff',
  'components-calendar-cell-text-today': '#2563eb',
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
  'components-tree-node-text-selected': '#2563eb',
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
  'components-transfer-item-text-selected': '#2563eb',
  
  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': 'rgba(3, 2, 19, 0.05)',
  'components-upload-border': 'rgba(113, 113, 130, 0.25)',
  'components-upload-border-hover': 'rgba(113, 113, 130, 0.5)',
  'components-upload-border-dragover': '#030213',
  'components-upload-text': '#374151',
  'components-upload-text-secondary': '#9ca3af',
  'components-upload-icon': '#d1d5db',
  'components-upload-progress-bg': '#e5e7eb',
  'components-upload-progress-fill': '#1e40af',
  
  'components-statistic-title': '#9ca3af',
  'components-statistic-value': '#1f2937',
  'components-statistic-suffix': '#6b7280',
  'components-statistic-prefix': '#6b7280',
  
  'components-result-bg': '#ffffff',
  'components-result-icon-success': '#10b981',
  'components-result-icon-error': '#ef4444',
  'components-result-icon-warning': '#f59e0b',
  'components-result-icon-info': '#1e40af',
  'components-result-title': '#1f2937',
  'components-result-subtitle': '#6b7280',
  
  'components-rate-star': '#d1d5db',
  'components-rate-star-active': '#fbbf24',
  'components-rate-star-hover': '#f59e0b',
  
  'components-anchor-bg': '#ffffff',
  'components-anchor-border': '#e5e7eb',
  'components-anchor-link': '#6b7280',
  'components-anchor-link-active': '#1e40af',
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
  'chat-input-area-bg': 'rgba(255, 255, 255, 0.9)',
  'chat-input-area-border': 'rgba(0, 0, 0, 0.08)',
  'chat-input-area-shadow': '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
  'chat-input-area-backdrop': 'blur(20px)',
  
  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': 'blur(12px)',
  
  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': '#f0f8ff',
  'chat-bubble-assistant-avatar-text': '#1890ff',
  'chat-bubble-user-avatar-bg': '#87d068',
  'chat-bubble-user-avatar-text': '#ffffff',
  'chat-bubble-user-bg': '#f3f4f6',
  'chat-bubble-user-text': '#374151',
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
  'background-body': '#0f172a',
  'background-default': '#1e293b',
  'background-subtle': '#334155',
  'background-section': '#1e293b',
  'background-overlay': 'rgba(0, 0, 0, 0.75)',
  'background-surface': '#1e293b',
  
  // ===== 边框系统 =====
  'border-default': 'rgba(255, 255, 255, 0.08)',
  'border-subtle': 'rgba(255, 255, 255, 0.05)',
  'border-strong': 'rgba(255, 255, 255, 0.12)',
  'border-accent': 'rgba(255, 255, 255, 0.1)',
  'border-success': '#10b981',
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
  'components-card-bg': '#1e293b',
  'components-card-bg-hover': '#334155',
  'components-card-border': 'rgba(255, 255, 255, 0.08)',
  'components-card-shadow': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  
  // ===== 侧边栏组件 =====
  'components-sidebar-bg': 'rgba(15, 23, 42, 0.98)',
  'components-sidebar-border': 'rgba(255, 255, 255, 0.08)',
  'components-sidebar-item-bg': 'transparent',
  'components-sidebar-item-bg-hover': 'rgba(255, 255, 255, 0.08)',
  'components-sidebar-item-bg-active': 'rgba(59, 130, 246, 0.15)',
  'components-sidebar-item-text': '#cbd5e1',
  'components-sidebar-item-text-active': '#60a5fa',
  
  // ===== 导航组件 =====
  'components-nav-bg': '#1e293b',
  'components-nav-border': '#475569',
  'components-nav-item-text': '#cbd5e1',
  'components-nav-item-text-hover': '#ffffff',
  'components-nav-item-text-active': '#60a5fa',
  
  // ===== 下拉菜单组件 =====
  'components-dropdown-bg': '#1e293b',
  'components-dropdown-border': '#475569',
  'components-dropdown-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  'components-dropdown-item-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-dropdown-item-text': '#ffffff',
  
  // ===== 模型选择器组件 =====
  'components-model-selector-dropdown-bg': '#1e293b',
  'components-model-selector-dropdown-border': '#475569',
  'components-model-selector-dropdown-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
  'components-model-selector-search-bg': 'rgba(255, 255, 255, 0.05)',
  'components-model-selector-search-border': '#4b5563',
  'components-model-selector-search-text': '#f9fafb',
  'components-model-selector-provider-header-bg': 'rgba(255, 255, 255, 0.05)',
  'components-model-selector-provider-header-border': '#475569',
  'components-model-selector-provider-header-text': '#ffffff',
  'components-model-selector-item-bg': '#1e293b',
  'components-model-selector-item-border': '#475569',
  'components-model-selector-item-text': '#ffffff',
  'components-model-selector-item-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-model-selector-item-bg-selected': 'rgba(59, 130, 246, 0.15)',
  'components-model-selector-item-text-selected': '#3b82f6',
  'components-model-selector-overlay-bg': 'rgba(0, 0, 0, 0.6)',
  
  // ===== 模态框组件 =====
  'components-modal-bg': '#1e293b',
  'components-modal-overlay': 'rgba(0, 0, 0, 0.75)',
  'components-modal-border': '#475569',
  'components-modal-shadow': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
  
  // ===== 表格组件 =====
  'components-table-bg': '#1e293b',
  'components-table-border': '#475569',
  'components-table-header-bg': '#0f172a',
  'components-table-row-bg-hover': 'rgba(255, 255, 255, 0.03)',
  'components-table-row-bg-selected': 'rgba(59, 130, 246, 0.15)',
  
  // ===== 交互状态 =====
  'state-hover': 'rgba(255, 255, 255, 0.05)',
  'state-active': 'rgba(255, 255, 255, 0.1)',
  'state-focus': '#3b82f6',
  'state-disabled': 'rgba(255, 255, 255, 0.05)',
  'state-success': '#10b981',
  'state-warning': '#f59e0b',
  'state-error': '#ef4444',
  
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
  'components-code-bg': 'rgba(255, 255, 255, 0.1)',
  'components-code-text': '#f87171',
  'components-code-border': '#475569',
  
  'components-pre-bg': '#0f172a',
  'components-pre-text': '#ffffff',
  'components-pre-border': '#475569',
  
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
  
  'components-tag-bg': 'rgba(255, 255, 255, 0.1)',
  'components-tag-text': '#ffffff',
  'components-tag-border': '#475569',
  'components-tag-bg-hover': 'rgba(255, 255, 255, 0.15)',
  'components-tag-close-hover': '#ef4444',
  
  // 分页器
  'components-pagination-bg': '#1e293b',
  'components-pagination-text': '#cbd5e1',
  'components-pagination-border': '#475569',
  'components-pagination-item-bg': 'rgba(255, 255, 255, 0.05)',
  'components-pagination-item-bg-hover': 'rgba(255, 255, 255, 0.1)',
  'components-pagination-item-bg-active': '#3b82f6',
  'components-pagination-item-text': '#ffffff',
  'components-pagination-item-text-active': '#ffffff',
  'components-pagination-disabled-bg': 'rgba(255, 255, 255, 0.03)',
  'components-pagination-disabled-text': '#64748b',
  
  // 步骤器
  'components-steps-bg': '#1e293b',
  'components-steps-border': '#475569',
  'components-steps-completed-bg': '#10b981',
  'components-steps-completed-text': '#ffffff',
  'components-steps-active-bg': '#3b82f6',
  'components-steps-active-text': '#ffffff',
  'components-steps-inactive-bg': 'rgba(255, 255, 255, 0.05)',
  'components-steps-inactive-text': '#94a3b8',
  'components-steps-line': '#475569',
  'components-steps-line-completed': '#10b981',
  
  // 其余组件令牌暗色适配
  'components-loader-primary': '#3b82f6',
  'components-loader-secondary': '#64748b',
  'components-skeleton-base': 'rgba(255, 255, 255, 0.1)',
  'components-skeleton-shimmer': 'rgba(255, 255, 255, 0.2)',
  'components-skeleton-text': 'rgba(255, 255, 255, 0.05)',
  
  'components-divider-bg': '#475569',
  'components-divider-text': '#94a3b8',
  
  'components-timeline-line': '#475569',
  'components-timeline-dot': '#64748b',
  'components-timeline-dot-active': '#3b82f6',
  'components-timeline-content-bg': '#1e293b',
  'components-timeline-content-border': '#475569',
  
  'components-calendar-bg': '#1e293b',
  'components-calendar-border': '#475569',
  'components-calendar-header-bg': '#0f172a',
  'components-calendar-header-text': '#ffffff',
  'components-calendar-cell-bg': 'rgba(255, 255, 255, 0.03)',
  'components-calendar-cell-text': '#ffffff',
  'components-calendar-cell-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-calendar-cell-bg-selected': '#3b82f6',
  'components-calendar-cell-text-selected': '#ffffff',
  'components-calendar-cell-bg-today': 'rgba(59, 130, 246, 0.15)',
  'components-calendar-cell-text-today': '#60a5fa',
  'components-calendar-cell-bg-disabled': 'rgba(255, 255, 255, 0.02)',
  'components-calendar-cell-text-disabled': '#64748b',
  
  'components-drawer-bg': '#1e293b',
  'components-drawer-overlay': 'rgba(0, 0, 0, 0.75)',
  'components-drawer-border': '#475569',
  'components-drawer-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
  'components-drawer-header-bg': '#0f172a',
  'components-drawer-header-border': '#475569',
  
  'components-collapse-bg': '#1e293b',
  'components-collapse-border': '#475569',
  'components-collapse-header-bg': 'rgba(255, 255, 255, 0.03)',
  'components-collapse-header-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-collapse-header-text': '#ffffff',
  'components-collapse-content-bg': '#1e293b',
  'components-collapse-content-border': '#475569',
  
  'components-tree-bg': '#1e293b',
  'components-tree-border': '#475569',
  'components-tree-node-bg': 'transparent',
  'components-tree-node-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-tree-node-bg-selected': 'rgba(59, 130, 246, 0.15)',
  'components-tree-node-text': '#ffffff',
  'components-tree-node-text-selected': '#60a5fa',
  'components-tree-indent-line': '#475569',
  'components-tree-expand-icon': '#94a3b8',
  
  'components-transfer-bg': '#1e293b',
  'components-transfer-border': '#475569',
  'components-transfer-header-bg': '#0f172a',
  'components-transfer-header-text': '#ffffff',
  'components-transfer-item-bg': 'rgba(255, 255, 255, 0.03)',
  'components-transfer-item-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-transfer-item-bg-selected': 'rgba(59, 130, 246, 0.15)',
  'components-transfer-item-text': '#ffffff',
  'components-transfer-item-text-selected': '#60a5fa',
  
  'components-upload-bg': 'transparent',
  'components-upload-bg-dragover': 'rgba(59, 130, 246, 0.05)',
  'components-upload-border': 'rgba(229, 231, 235, 0.25)',
  'components-upload-border-hover': 'rgba(229, 231, 235, 0.5)',
  'components-upload-border-dragover': '#3b82f6',
  'components-upload-text': '#ffffff',
  'components-upload-text-secondary': '#94a3b8',
  'components-upload-icon': '#64748b',
  'components-upload-progress-bg': 'rgba(255, 255, 255, 0.1)',
  'components-upload-progress-fill': '#3b82f6',
  
  'components-statistic-title': '#94a3b8',
  'components-statistic-value': '#ffffff',
  'components-statistic-suffix': '#cbd5e1',
  'components-statistic-prefix': '#cbd5e1',
  
  'components-result-bg': '#1e293b',
  'components-result-icon-success': '#4ade80',
  'components-result-icon-error': '#f87171',
  'components-result-icon-warning': '#fbbf24',
  'components-result-icon-info': '#60a5fa',
  'components-result-title': '#ffffff',
  'components-result-subtitle': '#cbd5e1',
  
  'components-rate-star': '#64748b',
  'components-rate-star-active': '#fbbf24',
  'components-rate-star-hover': '#f59e0b',
  
  'components-anchor-bg': '#1e293b',
  'components-anchor-border': '#475569',
  'components-anchor-link': '#cbd5e1',
  'components-anchor-link-active': '#60a5fa',
  'components-anchor-link-hover': '#ffffff',
  
  'components-backtop-bg': '#1e293b',
  'components-backtop-text': '#cbd5e1',
  'components-backtop-border': '#475569',
  'components-backtop-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  'components-backtop-bg-hover': 'rgba(255, 255, 255, 0.05)',
  
  'components-image-placeholder-bg': 'rgba(255, 255, 255, 0.05)',
  'components-image-placeholder-text': '#94a3b8',
  'components-image-preview-bg': '#000000',
  'components-image-preview-overlay': 'rgba(0, 0, 0, 0.9)',
  'components-image-preview-toolbar-bg': 'rgba(0, 0, 0, 0.8)',
  'components-image-preview-toolbar-text': '#ffffff',
  
  'components-empty-bg': '#1e293b',
  'components-empty-text': '#94a3b8',
  'components-empty-text-secondary': '#64748b',
  'components-empty-icon': '#64748b',
  
  'components-watermark-text': 'rgba(255, 255, 255, 0.05)',
  
  'components-float-button-bg': '#1e293b',
  'components-float-button-text': '#cbd5e1',
  'components-float-button-border': '#475569',
  'components-float-button-shadow': '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  'components-float-button-bg-hover': 'rgba(255, 255, 255, 0.05)',
  
  'components-segmented-bg': 'rgba(255, 255, 255, 0.05)',
  'components-segmented-border': '#475569',
  'components-segmented-item-bg': 'transparent',
  'components-segmented-item-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-segmented-item-bg-active': 'rgba(255, 255, 255, 0.1)',
  'components-segmented-item-text': '#cbd5e1',
  'components-segmented-item-text-active': '#ffffff',
  
  'components-mentions-bg': 'rgba(255, 255, 255, 0.05)',
  'components-mentions-border': '#64748b',
  'components-mentions-dropdown-bg': '#1e293b',
  'components-mentions-dropdown-border': '#475569',
  'components-mentions-dropdown-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
  'components-mentions-item-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-mentions-item-text': '#ffffff',
  
  'components-colorpicker-bg': '#1e293b',
  'components-colorpicker-border': '#475569',
  'components-colorpicker-panel-bg': '#1e293b',
  'components-colorpicker-panel-border': '#475569',
  'components-colorpicker-panel-shadow': '0 20px 25px -5px rgba(0, 0, 0, 0.4)',
  'components-colorpicker-slider-bg': 'rgba(255, 255, 255, 0.05)',
  'components-colorpicker-handle': '#ffffff',
  'components-colorpicker-input-bg': 'rgba(255, 255, 255, 0.05)',
  'components-colorpicker-input-border': '#64748b',
  
  'components-layout-header-bg': '#1e293b',
  'components-layout-header-border': '#475569',
  'components-layout-sider-bg': '#1e293b',
  'components-layout-sider-border': '#475569',
  'components-layout-content-bg': '#0f172a',
  'components-layout-footer-bg': '#1e293b',
  'components-layout-footer-border': '#475569',
  
  'components-grid-gutter': '#1e293b',
  
  'components-card-meta-title': '#ffffff',
  'components-card-meta-description': '#cbd5e1',
  'components-card-actions-bg': '#0f172a',
  'components-card-actions-border': '#475569',
  'components-card-cover-bg': 'rgba(255, 255, 255, 0.05)',
  
  'components-list-bg': '#1e293b',
  'components-list-border': '#475569',
  'components-list-item-bg': 'rgba(255, 255, 255, 0.03)',
  'components-list-item-bg-hover': 'rgba(255, 255, 255, 0.05)',
  'components-list-item-border': '#475569',
  'components-list-item-meta-title': '#ffffff',
  'components-list-item-meta-description': '#cbd5e1',
  'components-list-item-actions': '#94a3b8',
  
  'components-descriptions-bg': '#1e293b',
  'components-descriptions-border': '#475569',
  'components-descriptions-title': '#ffffff',
  'components-descriptions-content': '#ffffff',
  'components-descriptions-label': '#cbd5e1',
  'components-descriptions-item-border': 'rgba(255, 255, 255, 0.05)',
  
  // ===== 聊天页面专用布局 =====
  'chat-header-bg': 'rgba(15, 23, 42, 0.95)',
  'chat-header-border': 'rgba(255, 255, 255, 0.08)',
  'chat-header-backdrop': 'blur(12px)',
  'chat-main-bg': '#0f172a',
  'chat-content-bg': '#1e293b',
  'chat-content-border': 'rgba(255, 255, 255, 0.06)',
  'chat-input-area-bg': 'rgba(15, 23, 42, 0.98)',
  'chat-input-area-border': 'rgba(255, 255, 255, 0.08)',
  'chat-input-area-shadow': '0 -1px 3px rgba(0, 0, 0, 0.3)',
  'chat-gradient-primary': 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(147, 197, 253, 0.12) 50%, rgba(30, 64, 175, 0.06) 100%)',
  'chat-gradient-secondary': 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(110, 231, 183, 0.12) 100%)',
  'chat-welcome-border': 'rgba(59, 130, 246, 0.2)',
  'chat-welcome-shadow': '0 4px 20px rgba(59, 130, 246, 0.15)',
  'chat-input-area-bg': 'rgba(30, 41, 59, 0.9)',
  'chat-input-area-border': 'rgba(255, 255, 255, 0.1)',
  'chat-input-area-shadow': '0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)',
  'chat-input-area-backdrop': 'blur(20px)',
  
  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': 'blur(12px)',
  
  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': 'rgba(59, 130, 246, 0.15)',
  'chat-bubble-assistant-avatar-text': '#60a5fa',
  'chat-bubble-user-avatar-bg': '#4ade80',
  'chat-bubble-user-avatar-text': '#ffffff',
  'chat-bubble-user-bg': '#334155',
  'chat-bubble-user-text': '#ffffff',
}

/**
 * 生成主题 CSS 文件内容
 */
export function generateThemeCSS(tokens: DesignTokens, themeName: 'light' | 'dark'): string {
  const selector = themeName === 'light' ? 'html[data-theme="light"], :root' : 'html[data-theme="dark"]'
  
  let css = `/**\n * ${themeName === 'light' ? '亮色' : '暗色'}主题 CSS 变量定义\n * 基于 Dify 项目的设计令牌系统\n * \n * ⚠️ 注意: 此文件由代码自动生成，请勿手动修改!\n * 如需修改主题，请编辑 theme-generator.ts 文件\n */\n\n${selector} {\n`
  
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
  
  // 检查颜色值格式（跳过阴影类令牌）
  tokenKeys.forEach(key => {
    const value = tokens[key]
    if (!value) return
    const keyStr = String(key)
    if (keyStr.includes('shadow')) return
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