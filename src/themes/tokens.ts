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

// 设计令牌类型定义
export interface DesignTokens {
  // ===== 文本系统 =====
  'text-primary': string
  'text-secondary': string
  'text-tertiary': string
  'text-muted': string
  'text-disabled': string
  'text-accent': string
  'text-success': string
  'text-warning': string
  'text-error': string
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
  'border-success': string
  'border-warning': string
  'border-error': string
  
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
  'components-button-secondary-bg-active': string
  'components-button-secondary-bg-disabled': string
  'components-button-secondary-text': string
  'components-button-secondary-text-disabled': string
  'components-button-secondary-border': string
  'components-button-secondary-border-hover': string
  
  'components-button-ghost-bg-hover': string
  'components-button-ghost-text': string
  'components-button-ghost-text-disabled': string
  
  // ===== 组件系统 - 输入框 =====
  'components-input-bg': string
  'components-input-bg-hover': string
  'components-input-bg-focus': string
  'components-input-bg-disabled': string
  'components-input-border': string
  'components-input-border-hover': string
  'components-input-border-focus': string
  'components-input-border-error': string
  'components-input-text': string
  'components-input-text-placeholder': string
  'components-input-text-disabled': string
  
  // ===== 组件系统 - 卡片 =====
  'components-card-bg': string
  'components-card-bg-hover': string
  'components-card-border': string
  'components-card-shadow': string
  
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
  'components-nav-border': string
  'components-nav-item-text': string
  'components-nav-item-text-hover': string
  'components-nav-item-text-active': string
  
  // ===== 组件系统 - 下拉菜单 =====
  'components-dropdown-bg': string
  'components-dropdown-border': string
  'components-dropdown-shadow': string
  'components-dropdown-item-bg-hover': string
  'components-dropdown-item-text': string
  
  // ===== 组件系统 - 模型选择器 =====
  'components-model-selector-dropdown-bg': string
  'components-model-selector-dropdown-border': string
  'components-model-selector-dropdown-shadow': string
  'components-model-selector-search-bg': string
  'components-model-selector-search-border': string
  'components-model-selector-search-text': string
  'components-model-selector-provider-header-bg': string
  'components-model-selector-provider-header-border': string
  'components-model-selector-provider-header-text': string
  'components-model-selector-item-bg': string
  'components-model-selector-item-border': string
  'components-model-selector-item-text': string
  'components-model-selector-item-bg-hover': string
  'components-model-selector-item-bg-selected': string
  'components-model-selector-item-text-selected': string
  'components-model-selector-overlay-bg': string
  
  // ===== 组件系统 - 模态框 =====
  'components-modal-bg': string
  'components-modal-overlay': string
  'components-modal-border': string
  'components-modal-shadow': string
  
  // ===== 组件系统 - 表格 =====
  'components-table-bg': string
  'components-table-border': string
  'components-table-header-bg': string
  'components-table-row-bg-hover': string
  'components-table-row-bg-selected': string
  
  // ===== 交互状态 =====
  'state-hover': string
  'state-active': string
  'state-focus': string
  'state-disabled': string
  'state-success': string
  'state-warning': string
  'state-error': string
  'state-info': string
  
  // ===== 状态透明度变体 (10% opacity) =====
  'state-focus-10': string
  'state-success-10': string
  'state-warning-10': string
  'state-error-10': string
  'state-neutral-10': string
  'state-info-10': string
  // 语义化别名（subtle = 10% opacity）
  'state-focus-subtle': string
  'state-success-subtle': string
  'state-warning-subtle': string
  'state-error-subtle': string
  'state-info-subtle': string
  
  // ===== HTTP方法颜色系统 =====
  'components-method-get-bg': string
  'components-method-get-text': string
  'components-method-get-border': string
  'components-method-post-bg': string
  'components-method-post-text': string
  'components-method-post-border': string
  'components-method-put-bg': string
  'components-method-put-text': string
  'components-method-put-border': string
  'components-method-delete-bg': string
  'components-method-delete-text': string
  'components-method-delete-border': string
  'components-method-patch-bg': string
  'components-method-patch-text': string
  'components-method-patch-border': string
  
  // ===== 环境状态指示器 =====
  'components-env-prod-bg': string
  'components-env-prod-text': string
  'components-env-staging-bg': string
  'components-env-staging-text': string
  'components-env-dev-bg': string
  'components-env-dev-text': string
  
  
  
  
  // ===== 阴影系统 =====
  'shadow-sm': string
  'shadow-md': string
  'shadow-lg': string
  'shadow-xl': string
  
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
  'components-switch-thumb-checked': string
  
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
  'components-dialog-shadow': string
  'components-dialog-overlay': string
  
  'components-popover-bg': string
  'components-popover-border': string
  'components-popover-shadow': string
  
  'components-tooltip-bg': string
  'components-tooltip-text': string
  'components-tooltip-shadow': string
  
  // ===== 导航和标签 =====
  'components-tabs-border': string
  'components-tabs-bg': string
  'components-tabs-active-bg': string
  'components-tabs-active-text': string
  'components-tabs-inactive-text': string
  
  'components-breadcrumb-text': string
  'components-breadcrumb-text-current': string
  'components-breadcrumb-separator': string
  
  // ===== 状态和通知 =====
  'components-alert-info-bg': string
  'components-alert-info-border': string
  'components-alert-info-text': string
  
  'components-alert-success-bg': string
  'components-alert-success-border': string
  'components-alert-success-text': string
  
  'components-alert-warning-bg': string
  'components-alert-warning-border': string
  'components-alert-warning-text': string
  
  'components-alert-error-bg': string
  'components-alert-error-border': string
  'components-alert-error-text': string
  
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
  'components-tool-call-content-bg': string
  'components-tool-call-content-text': string
  
  // ===== 徽章和标签 =====
  'components-badge-bg': string
  'components-badge-text': string
  'components-badge-border': string
  'components-badge-success-bg': string
  'components-badge-success-text': string
  'components-badge-warning-bg': string
  'components-badge-warning-text': string
  'components-badge-error-bg': string
  'components-badge-error-text': string
  'components-badge-info-bg': string
  'components-badge-info-text': string
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

  // ===== 统计卡片组件 =====
  // 蓝色卡片
  'components-stats-card-blue-bg': string
  'components-stats-card-blue-icon-bg': string
  'components-stats-card-blue-icon-text': string
  'components-stats-card-blue-shadow': string
  'components-stats-card-blue-border-hover': string
  // 绿色卡片
  'components-stats-card-green-bg': string
  'components-stats-card-green-icon-bg': string
  'components-stats-card-green-icon-text': string
  'components-stats-card-green-shadow': string
  'components-stats-card-green-border-hover': string
  // 紫色卡片
  'components-stats-card-purple-bg': string
  'components-stats-card-purple-icon-bg': string
  'components-stats-card-purple-icon-text': string
  'components-stats-card-purple-shadow': string
  'components-stats-card-purple-border-hover': string
  // 橙色卡片
  'components-stats-card-orange-bg': string
  'components-stats-card-orange-icon-bg': string
  'components-stats-card-orange-icon-text': string
  'components-stats-card-orange-shadow': string
  'components-stats-card-orange-border-hover': string

  // ===== 头像渐变系统 =====
  'components-avatar-gradient-purple-from': string
  'components-avatar-gradient-purple-to': string
  'components-avatar-gradient-blue-from': string
  'components-avatar-gradient-blue-to': string
  'components-avatar-gradient-green-from': string
  'components-avatar-gradient-green-to': string
  'components-avatar-gradient-orange-from': string
  'components-avatar-gradient-orange-to': string
  'components-avatar-gradient-indigo-from': string
  'components-avatar-gradient-indigo-to': string

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

  'components-task-status-cancelled-bg': string
  'components-task-status-cancelled-border': string
  'components-task-status-cancelled-text': string
  'components-task-status-cancelled-dot': string

  'components-task-status-completed-bg': string
  'components-task-status-completed-border': string
  'components-task-status-completed-text': string
  'components-task-status-completed-dot': string

  'components-task-status-failed-bg': string
  'components-task-status-failed-border': string
  'components-task-status-failed-text': string
  'components-task-status-failed-dot': string

  'components-tag-bg': string
  'components-tag-text': string
  'components-tag-border': string
  'components-tag-bg-hover': string
  'components-tag-close-hover': string
  
  // ===== 分页器 =====
  'components-pagination-bg': string
  'components-pagination-text': string
  'components-pagination-border': string
  'components-pagination-item-bg': string
  'components-pagination-item-bg-hover': string
  'components-pagination-item-bg-active': string
  'components-pagination-item-text': string
  'components-pagination-item-text-active': string
  'components-pagination-disabled-bg': string
  'components-pagination-disabled-text': string
  
  // ===== 步骤器 =====
  'components-steps-bg': string
  'components-steps-border': string
  'components-steps-completed-bg': string
  'components-steps-completed-text': string
  'components-steps-active-bg': string
  'components-steps-active-text': string
  'components-steps-inactive-bg': string
  'components-steps-inactive-text': string
  'components-steps-line': string
  'components-steps-line-completed': string
  
  // ===== 加载器和骨架屏 =====
  'components-loader-primary': string
  'components-loader-secondary': string
  'components-skeleton-base': string
  'components-skeleton-shimmer': string
  'components-skeleton-text': string
  
  // ===== 分割线 =====
  'components-divider-bg': string
  'components-divider-text': string
  
  // ===== 时间轴 =====
  'components-timeline-line': string
  'components-timeline-dot': string
  'components-timeline-dot-active': string
  'components-timeline-content-bg': string
  'components-timeline-content-border': string
  
  // ===== 日历和日期选择器 =====
  'components-calendar-bg': string
  'components-calendar-border': string
  'components-calendar-header-bg': string
  'components-calendar-header-text': string
  'components-calendar-cell-bg': string
  'components-calendar-cell-text': string
  'components-calendar-cell-bg-hover': string
  'components-calendar-cell-bg-selected': string
  'components-calendar-cell-text-selected': string
  'components-calendar-cell-bg-today': string
  'components-calendar-cell-text-today': string
  'components-calendar-cell-bg-disabled': string
  'components-calendar-cell-text-disabled': string
  
  // ===== 抽屉 =====
  'components-drawer-bg': string
  'components-drawer-overlay': string
  'components-drawer-border': string
  'components-drawer-shadow': string
  'components-drawer-header-bg': string
  'components-drawer-header-border': string
  
  // ===== 折叠面板 =====
  'components-collapse-bg': string
  'components-collapse-border': string
  'components-collapse-header-bg': string
  'components-collapse-header-bg-hover': string
  'components-collapse-header-text': string
  'components-collapse-content-bg': string
  'components-collapse-content-border': string
  
  // ===== 树形控件 =====
  'components-tree-bg': string
  'components-tree-border': string
  'components-tree-node-bg': string
  'components-tree-node-bg-hover': string
  'components-tree-node-bg-selected': string
  'components-tree-node-text': string
  'components-tree-node-text-selected': string
  'components-tree-indent-line': string
  'components-tree-expand-icon': string
  
  // ===== 转移框 =====
  'components-transfer-bg': string
  'components-transfer-border': string
  'components-transfer-header-bg': string
  'components-transfer-header-text': string
  'components-transfer-item-bg': string
  'components-transfer-item-bg-hover': string
  'components-transfer-item-bg-selected': string
  'components-transfer-item-text': string
  'components-transfer-item-text-selected': string
  
  // ===== 上传组件 =====
  'components-upload-bg': string
  'components-upload-bg-dragover': string
  'components-upload-border': string
  'components-upload-border-hover': string
  'components-upload-border-dragover': string
  'components-upload-text': string
  'components-upload-text-secondary': string
  'components-upload-icon': string
  'components-upload-progress-bg': string
  'components-upload-progress-fill': string
  
  // ===== 统计数值 =====
  'components-statistic-title': string
  'components-statistic-value': string
  'components-statistic-suffix': string
  'components-statistic-prefix': string
  
  // ===== 结果页 =====
  'components-result-bg': string
  'components-result-icon-success': string
  'components-result-icon-error': string
  'components-result-icon-warning': string
  'components-result-icon-info': string
  'components-result-title': string
  'components-result-subtitle': string
  
  // ===== 评分组件 =====
  'components-rate-star': string
  'components-rate-star-active': string
  'components-rate-star-hover': string
  
  // ===== 锚点导航 =====
  'components-anchor-bg': string
  'components-anchor-border': string
  'components-anchor-link': string
  'components-anchor-link-active': string
  'components-anchor-link-hover': string
  
  // ===== 回到顶部 =====
  'components-backtop-bg': string
  'components-backtop-text': string
  'components-backtop-border': string
  'components-backtop-shadow': string
  'components-backtop-bg-hover': string
  
  // ===== 图片组件 =====
  'components-image-placeholder-bg': string
  'components-image-placeholder-text': string
  'components-image-preview-bg': string
  'components-image-preview-overlay': string
  'components-image-preview-toolbar-bg': string
  'components-image-preview-toolbar-text': string
  
  // ===== 空状态 =====
  'components-empty-bg': string
  'components-empty-text': string
  'components-empty-text-secondary': string
  'components-empty-icon': string
  
  // ===== 水印 =====
  'components-watermark-text': string
  
  // ===== 浮动按钮 =====
  'components-float-button-bg': string
  'components-float-button-text': string
  'components-float-button-border': string
  'components-float-button-shadow': string
  'components-float-button-bg-hover': string
  
  // ===== 分段控制器 =====
  'components-segmented-bg': string
  'components-segmented-border': string
  'components-segmented-item-bg': string
  'components-segmented-item-bg-hover': string
  'components-segmented-item-bg-active': string
  'components-segmented-item-text': string
  'components-segmented-item-text-active': string
  
  // ===== 提及组件 =====
  'components-mentions-bg': string
  'components-mentions-border': string
  'components-mentions-dropdown-bg': string
  'components-mentions-dropdown-border': string
  'components-mentions-dropdown-shadow': string
  'components-mentions-item-bg-hover': string
  'components-mentions-item-text': string
  
  // ===== 色彩选择器 =====
  'components-colorpicker-bg': string
  'components-colorpicker-border': string
  'components-colorpicker-panel-bg': string
  'components-colorpicker-panel-border': string
  'components-colorpicker-panel-shadow': string
  'components-colorpicker-slider-bg': string
  'components-colorpicker-handle': string
  'components-colorpicker-input-bg': string
  'components-colorpicker-input-border': string
  
  // ===== 布局组件 =====
  'components-layout-header-bg': string
  'components-layout-header-border': string
  'components-layout-sider-bg': string
  'components-layout-sider-border': string
  'components-layout-content-bg': string
  'components-layout-footer-bg': string
  'components-layout-footer-border': string
  
  // ===== 栅格系统 =====
  'components-grid-gutter': string
  
  // ===== 卡片高级变体 =====
  'components-card-meta-title': string
  'components-card-meta-description': string
  'components-card-actions-bg': string
  'components-card-actions-border': string
  'components-card-cover-bg': string
  
  // ===== 列表高级变体 =====
  'components-list-bg': string
  'components-list-border': string
  'components-list-item-bg': string
  'components-list-item-bg-hover': string
  'components-list-item-border': string
  'components-list-item-meta-title': string
  'components-list-item-meta-description': string
  'components-list-item-actions': string
  
  // ===== 描述列表 =====
  'components-descriptions-bg': string
  'components-descriptions-border': string
  'components-descriptions-title': string
  'components-descriptions-content': string
  'components-descriptions-label': string
  'components-descriptions-item-border': string
  
  // ===== 聊天页面专用布局 =====
  'chat-header-bg': string
  'chat-header-border': string
  'chat-header-backdrop': string
  'chat-main-bg': string
  'chat-content-bg': string
  'chat-content-border': string
  'chat-input-area-bg': string
  'chat-input-area-border': string
  'chat-input-area-shadow': string
  'chat-gradient-primary': string
  'chat-gradient-secondary': string
  'chat-welcome-border': string
  'chat-welcome-shadow': string
  'chat-input-area-backdrop': string
  
  // ===== 聊天气泡和头像 =====
  'chat-bubble-assistant-avatar-bg': string
  'chat-bubble-assistant-avatar-text': string
  'chat-bubble-user-avatar-bg': string
  'chat-bubble-user-avatar-text': string
  'chat-bubble-user-bg': string
  'chat-bubble-user-text': string
  
  // ===== 侧边栏现代化升级 =====
  'components-sidebar-backdrop': string

  // ===== 编辑器组件 =====
  'components-editor-bg': string
  'components-editor-toolbar-bg': string
  'components-editor-text': string
  'components-editor-border': string

  // ===== 面板组件 =====
  'components-panel-header-bg': string
  'components-panel-header-text': string
  'components-panel-content-bg': string

  // ===== 图标按钮 =====
  'components-icon-button-text': string
  'components-icon-button-text-hover': string
  'components-icon-button-bg-hover': string

  // ===== 聊天预览增强 =====
  'chat-bubble-ai-bg': string
  'chat-bubble-ai-text': string
  'chat-input-container-bg': string
  'chat-preview-debug-bg': string
  'chat-preview-debug-text': string
  'chat-think-bg': string
  'chat-think-border': string
  'chat-think-text': string

  // ===== 应用头像 =====
  'components-app-avatar-bg': string
  'components-app-avatar-border': string

  // ===== API 密钥管理 =====
  'components-api-key-card-bg': string
  'components-api-key-card-bg-hover': string
  'components-api-key-card-border': string
  'components-api-key-card-shadow': string
  'components-api-key-header-bg': string
  'components-api-key-header-text': string
  'components-api-key-value-bg': string
  'components-api-key-value-text': string
  'components-api-key-value-masked': string
  'components-api-key-actions-bg': string
  'components-api-key-actions-border': string

  // ===== API 状态指示器 =====
  'components-api-status-online-bg': string
  'components-api-status-online-text': string
  'components-api-status-online-dot': string
  'components-api-status-offline-bg': string
  'components-api-status-offline-text': string
  'components-api-status-offline-dot': string
  'components-api-status-error-bg': string
  'components-api-status-error-text': string
  'components-api-status-error-dot': string

  // ===== HTTP 方法颜色系统 =====
  'components-http-method-get-bg': string
  'components-http-method-get-text': string
  'components-http-method-get-border': string
  'components-http-method-post-bg': string
  'components-http-method-post-text': string
  'components-http-method-post-border': string
  'components-http-method-put-bg': string
  'components-http-method-put-text': string
  'components-http-method-put-border': string
  'components-http-method-delete-bg': string
  'components-http-method-delete-text': string
  'components-http-method-delete-border': string
  'components-http-method-patch-bg': string
  'components-http-method-patch-text': string
  'components-http-method-patch-border': string

  // ===== API 文档风格组件 =====
  'components-api-docs-bg': string
  'components-api-docs-border': string
  'components-api-docs-header-bg': string
  'components-api-docs-header-border': string
  'components-api-docs-sidebar-bg': string
  'components-api-docs-sidebar-border': string
  'components-api-docs-content-bg': string
  'components-api-docs-search-bg': string
  'components-api-docs-search-border': string
  'components-api-docs-search-focus-border': string

  // ===== 现代化增强组件 =====
  'components-glassmorphism-bg': string
  'components-glassmorphism-border': string
  'components-glassmorphism-shadow': string
  'components-gradient-primary': string
  'components-gradient-secondary': string
  'components-gradient-accent': string
  'components-modern-card-bg': string
  'components-modern-card-border': string
  'components-modern-card-shadow': string

  // ===== 首页推荐卡片系统 =====
  'components-recommend-card-bg-1': string
  'components-recommend-card-bg-2': string
  'components-recommend-card-bg-3': string
  'components-recommend-card-bg-4': string
  'components-recommend-card-text': string
  'components-recommend-card-tag': string

  // ===== 画布系统 (Agent Canvas) =====
  // 画布背景
  'components-canvas-bg': string
  'components-canvas-grid': string

  // 节点通用
  'components-canvas-node-bg': string
  'components-canvas-node-border': string
  'components-canvas-node-border-hover': string
  'components-canvas-node-border-selected': string
  'components-canvas-node-shadow': string

  // 边线
  'components-canvas-edge-stroke': string
  'components-canvas-edge-stroke-hover': string
  'components-canvas-edge-stroke-selected': string
  'components-canvas-edge-marker': string
  'components-canvas-edge-marker-selected': string

  // 连接点
  'components-canvas-handle-bg': string
  'components-canvas-handle-border': string
  'components-canvas-handle-icon': string

  // 工具栏
  'components-canvas-toolbar-bg': string
  'components-canvas-toolbar-border': string
  'components-canvas-toolbar-shadow': string

  // 节点类型图标颜色（按功能分组）
  'components-canvas-icon-start': string       // 开始节点（绿色）
  'components-canvas-icon-retrieval': string   // 检索节点（蓝色）
  'components-canvas-icon-generate': string    // 生成节点（紫色）
  'components-canvas-icon-message': string     // 消息节点（青绿色）
  'components-canvas-icon-tool': string        // 工具节点（橙色）
  'components-canvas-icon-file': string        // 文件节点（绿色）
  'components-canvas-icon-parser': string      // 解析节点（蓝色）
  'components-canvas-icon-splitter': string    // 分割节点（橙色）
  'components-canvas-icon-tokenizer': string   // 分词节点（紫色）
  'components-canvas-icon-extractor': string   // 提取节点（靛蓝色）
  'components-canvas-icon-switch': string      // 条件节点（黄色）
  'components-canvas-icon-categorize': string  // 分类节点（粉色）
  'components-canvas-icon-agent': string       // Agent节点（紫色）
  'components-canvas-icon-code': string        // 代码节点（灰色）
  'components-canvas-icon-default': string     // 默认图标色（灰色）

  // 占位符/骨架屏
  'components-canvas-skeleton-bg': string

  // 笔记节点
  'components-canvas-note-bg': string
  'components-canvas-note-border': string
  'components-canvas-note-border-selected': string
  'components-canvas-note-title': string
  'components-canvas-note-text': string
}

// 生成 CSS 变量映射
const generateCSSVars = (tokens: Record<string, string>): Record<string, string> => {
  const cssVars: Record<string, string> = {}
  
  Object.keys(tokens).forEach(key => {
    cssVars[key] = `var(--color-${key})`
  })
  
  return cssVars
}

// 默认令牌定义（用于类型检查）
export const defaultTokens: DesignTokens = {
  // 文本系统
  'text-primary': '',
  'text-secondary': '',
  'text-tertiary': '',
  'text-muted': '',
  'text-disabled': '',
  'text-accent': '',
  'text-success': '',
  'text-warning': '',
  'text-error': '',
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
  'border-success': '',
  'border-warning': '',
  'border-error': '',
  
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
  'components-button-secondary-bg-active': '',
  'components-button-secondary-bg-disabled': '',
  'components-button-secondary-text': '',
  'components-button-secondary-text-disabled': '',
  'components-button-secondary-border': '',
  'components-button-secondary-border-hover': '',
  
  'components-button-ghost-bg-hover': '',
  'components-button-ghost-text': '',
  'components-button-ghost-text-disabled': '',
  
  // 输入框组件
  'components-input-bg': '',
  'components-input-bg-hover': '',
  'components-input-bg-focus': '',
  'components-input-bg-disabled': '',
  'components-input-border': '',
  'components-input-border-hover': '',
  'components-input-border-focus': '',
  'components-input-border-error': '',
  'components-input-text': '',
  'components-input-text-placeholder': '',
  'components-input-text-disabled': '',
  
  // 卡片组件
  'components-card-bg': '',
  'components-card-bg-hover': '',
  'components-card-border': '',
  'components-card-shadow': '',
  
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
  'components-nav-border': '',
  'components-nav-item-text': '',
  'components-nav-item-text-hover': '',
  'components-nav-item-text-active': '',
  
  // 下拉菜单组件
  'components-dropdown-bg': '',
  'components-dropdown-border': '',
  'components-dropdown-shadow': '',
  'components-dropdown-item-bg-hover': '',
  'components-dropdown-item-text': '',

  // 模型选择器组件
  'components-model-selector-dropdown-bg': '',
  'components-model-selector-dropdown-border': '',
  'components-model-selector-dropdown-shadow': '',
  'components-model-selector-search-bg': '',
  'components-model-selector-search-border': '',
  'components-model-selector-search-text': '',
  'components-model-selector-provider-header-bg': '',
  'components-model-selector-provider-header-border': '',
  'components-model-selector-provider-header-text': '',
  'components-model-selector-item-bg': '',
  'components-model-selector-item-border': '',
  'components-model-selector-item-text': '',
  'components-model-selector-item-bg-hover': '',
  'components-model-selector-item-bg-selected': '',
  'components-model-selector-item-text-selected': '',
  'components-model-selector-overlay-bg': '',
  
  // 模态框组件
  'components-modal-bg': '',
  'components-modal-overlay': '',
  'components-modal-border': '',
  'components-modal-shadow': '',
  
  // 表格组件
  'components-table-bg': '',
  'components-table-border': '',
  'components-table-header-bg': '',
  'components-table-row-bg-hover': '',
  'components-table-row-bg-selected': '',
  
  // 交互状态
  'state-hover': '',
  'state-active': '',
  'state-focus': '',
  'state-disabled': '',
  'state-success': '',
  'state-warning': '',
  'state-error': '',
  'state-info': '',
  
  // 状态透明度变体 (10% opacity)
  'state-focus-10': '',
  'state-success-10': '',
  'state-warning-10': '',
  'state-error-10': '',
  'state-neutral-10': '',
  'state-info-10': '',
  // 语义化别名（subtle = 10% opacity）
  'state-focus-subtle': '',
  'state-success-subtle': '',
  'state-warning-subtle': '',
  'state-error-subtle': '',
  'state-info-subtle': '',
  
  // HTTP方法颜色系统
  'components-method-get-bg': '',
  'components-method-get-text': '',
  'components-method-get-border': '',
  'components-method-post-bg': '',
  'components-method-post-text': '',
  'components-method-post-border': '',
  'components-method-put-bg': '',
  'components-method-put-text': '',
  'components-method-put-border': '',
  'components-method-delete-bg': '',
  'components-method-delete-text': '',
  'components-method-delete-border': '',
  'components-method-patch-bg': '',
  'components-method-patch-text': '',
  'components-method-patch-border': '',
  
  // 环境状态指示器
  'components-env-prod-bg': '',
  'components-env-prod-text': '',
  'components-env-staging-bg': '',
  'components-env-staging-text': '',
  'components-env-dev-bg': '',
  'components-env-dev-text': '',
  
  
  // API 文档风格组件
  'components-api-docs-bg': '',
  'components-api-docs-border': '',
  'components-api-docs-header-bg': '',
  'components-api-docs-header-border': '',
  'components-api-docs-sidebar-bg': '',
  'components-api-docs-sidebar-border': '',
  'components-api-docs-content-bg': '',
  'components-api-docs-search-bg': '',
  'components-api-docs-search-border': '',
  'components-api-docs-search-focus-border': '',
  
  // 阴影系统
  'shadow-sm': '',
  'shadow-md': '',
  'shadow-lg': '',
  'shadow-xl': '',
  
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
  'components-switch-thumb-checked': '',
  
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
  'components-dialog-shadow': '',
  'components-dialog-overlay': '',
  
  'components-popover-bg': '',
  'components-popover-border': '',
  'components-popover-shadow': '',
  
  'components-tooltip-bg': '',
  'components-tooltip-text': '',
  'components-tooltip-shadow': '',
  
  // 导航和标签
  'components-tabs-border': '',
  'components-tabs-bg': '',
  'components-tabs-active-bg': '',
  'components-tabs-active-text': '',
  'components-tabs-inactive-text': '',
  
  'components-breadcrumb-text': '',
  'components-breadcrumb-text-current': '',
  'components-breadcrumb-separator': '',
  
  // 状态和通知
  'components-alert-info-bg': '',
  'components-alert-info-border': '',
  'components-alert-info-text': '',
  
  'components-alert-success-bg': '',
  'components-alert-success-border': '',
  'components-alert-success-text': '',
  
  'components-alert-warning-bg': '',
  'components-alert-warning-border': '',
  'components-alert-warning-text': '',
  
  'components-alert-error-bg': '',
  'components-alert-error-border': '',
  'components-alert-error-text': '',
  
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
  'components-tool-call-content-bg': '',
  'components-tool-call-content-text': '',
  
  // 徽章和标签
  'components-badge-bg': '',
  'components-badge-text': '',
  'components-badge-border': '',
  'components-badge-success-bg': '',
  'components-badge-success-text': '',
  'components-badge-warning-bg': '',
  'components-badge-warning-text': '',
  'components-badge-error-bg': '',
  'components-badge-error-text': '',
  'components-badge-info-bg': '',
  'components-badge-info-text': '',
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
  'components-stats-card-blue-bg': '',
  'components-stats-card-blue-icon-bg': '',
  'components-stats-card-blue-icon-text': '',
  'components-stats-card-blue-shadow': '',
  'components-stats-card-blue-border-hover': '',
  // 绿色卡片
  'components-stats-card-green-bg': '',
  'components-stats-card-green-icon-bg': '',
  'components-stats-card-green-icon-text': '',
  'components-stats-card-green-shadow': '',
  'components-stats-card-green-border-hover': '',
  // 紫色卡片
  'components-stats-card-purple-bg': '',
  'components-stats-card-purple-icon-bg': '',
  'components-stats-card-purple-icon-text': '',
  'components-stats-card-purple-shadow': '',
  'components-stats-card-purple-border-hover': '',
  // 橙色卡片
  'components-stats-card-orange-bg': '',
  'components-stats-card-orange-icon-bg': '',
  'components-stats-card-orange-icon-text': '',
  'components-stats-card-orange-shadow': '',
  'components-stats-card-orange-border-hover': '',

  // 头像渐变系统
  'components-avatar-gradient-purple-from': '',
  'components-avatar-gradient-purple-to': '',
  'components-avatar-gradient-blue-from': '',
  'components-avatar-gradient-blue-to': '',
  'components-avatar-gradient-green-from': '',
  'components-avatar-gradient-green-to': '',
  'components-avatar-gradient-orange-from': '',
  'components-avatar-gradient-orange-to': '',
  'components-avatar-gradient-indigo-from': '',
  'components-avatar-gradient-indigo-to': '',

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

  'components-task-status-cancelled-bg': '',
  'components-task-status-cancelled-border': '',
  'components-task-status-cancelled-text': '',
  'components-task-status-cancelled-dot': '',

  'components-task-status-completed-bg': '',
  'components-task-status-completed-border': '',
  'components-task-status-completed-text': '',
  'components-task-status-completed-dot': '',

  'components-task-status-failed-bg': '',
  'components-task-status-failed-border': '',
  'components-task-status-failed-text': '',
  'components-task-status-failed-dot': '',

  'components-tag-bg': '',
  'components-tag-text': '',
  'components-tag-border': '',
  'components-tag-bg-hover': '',
  'components-tag-close-hover': '',
  
  // 分页器
  'components-pagination-bg': '',
  'components-pagination-text': '',
  'components-pagination-border': '',
  'components-pagination-item-bg': '',
  'components-pagination-item-bg-hover': '',
  'components-pagination-item-bg-active': '',
  'components-pagination-item-text': '',
  'components-pagination-item-text-active': '',
  'components-pagination-disabled-bg': '',
  'components-pagination-disabled-text': '',
  
  // 步骤器
  'components-steps-bg': '',
  'components-steps-border': '',
  'components-steps-completed-bg': '',
  'components-steps-completed-text': '',
  'components-steps-active-bg': '',
  'components-steps-active-text': '',
  'components-steps-inactive-bg': '',
  'components-steps-inactive-text': '',
  'components-steps-line': '',
  'components-steps-line-completed': '',
  
  // 加载器和骨架屏
  'components-loader-primary': '',
  'components-loader-secondary': '',
  'components-skeleton-base': '',
  'components-skeleton-shimmer': '',
  'components-skeleton-text': '',
  
  // 分割线
  'components-divider-bg': '',
  'components-divider-text': '',
  
  // 时间轴
  'components-timeline-line': '',
  'components-timeline-dot': '',
  'components-timeline-dot-active': '',
  'components-timeline-content-bg': '',
  'components-timeline-content-border': '',
  
  // 日历和日期选择器
  'components-calendar-bg': '',
  'components-calendar-border': '',
  'components-calendar-header-bg': '',
  'components-calendar-header-text': '',
  'components-calendar-cell-bg': '',
  'components-calendar-cell-text': '',
  'components-calendar-cell-bg-hover': '',
  'components-calendar-cell-bg-selected': '',
  'components-calendar-cell-text-selected': '',
  'components-calendar-cell-bg-today': '',
  'components-calendar-cell-text-today': '',
  'components-calendar-cell-bg-disabled': '',
  'components-calendar-cell-text-disabled': '',
  
  // 抽屉
  'components-drawer-bg': '',
  'components-drawer-overlay': '',
  'components-drawer-border': '',
  'components-drawer-shadow': '',
  'components-drawer-header-bg': '',
  'components-drawer-header-border': '',
  
  // 折叠面板
  'components-collapse-bg': '',
  'components-collapse-border': '',
  'components-collapse-header-bg': '',
  'components-collapse-header-bg-hover': '',
  'components-collapse-header-text': '',
  'components-collapse-content-bg': '',
  'components-collapse-content-border': '',
  
  // 树形控件
  'components-tree-bg': '',
  'components-tree-border': '',
  'components-tree-node-bg': '',
  'components-tree-node-bg-hover': '',
  'components-tree-node-bg-selected': '',
  'components-tree-node-text': '',
  'components-tree-node-text-selected': '',
  'components-tree-indent-line': '',
  'components-tree-expand-icon': '',
  
  // 转移框
  'components-transfer-bg': '',
  'components-transfer-border': '',
  'components-transfer-header-bg': '',
  'components-transfer-header-text': '',
  'components-transfer-item-bg': '',
  'components-transfer-item-bg-hover': '',
  'components-transfer-item-bg-selected': '',
  'components-transfer-item-text': '',
  'components-transfer-item-text-selected': '',
  
  // 上传组件
  'components-upload-bg': '',
  'components-upload-bg-dragover': '',
  'components-upload-border': '',
  'components-upload-border-hover': '',
  'components-upload-border-dragover': '',
  'components-upload-text': '',
  'components-upload-text-secondary': '',
  'components-upload-icon': '',
  'components-upload-progress-bg': '',
  'components-upload-progress-fill': '',
  
  // 统计数值
  'components-statistic-title': '',
  'components-statistic-value': '',
  'components-statistic-suffix': '',
  'components-statistic-prefix': '',
  
  // 结果页
  'components-result-bg': '',
  'components-result-icon-success': '',
  'components-result-icon-error': '',
  'components-result-icon-warning': '',
  'components-result-icon-info': '',
  'components-result-title': '',
  'components-result-subtitle': '',
  
  // 评分组件
  'components-rate-star': '',
  'components-rate-star-active': '',
  'components-rate-star-hover': '',
  
  // 锚点导航
  'components-anchor-bg': '',
  'components-anchor-border': '',
  'components-anchor-link': '',
  'components-anchor-link-active': '',
  'components-anchor-link-hover': '',
  
  // 回到顶部
  'components-backtop-bg': '',
  'components-backtop-text': '',
  'components-backtop-border': '',
  'components-backtop-shadow': '',
  'components-backtop-bg-hover': '',
  
  // 图片组件
  'components-image-placeholder-bg': '',
  'components-image-placeholder-text': '',
  'components-image-preview-bg': '',
  'components-image-preview-overlay': '',
  'components-image-preview-toolbar-bg': '',
  'components-image-preview-toolbar-text': '',
  
  // 空状态
  'components-empty-bg': '',
  'components-empty-text': '',
  'components-empty-text-secondary': '',
  'components-empty-icon': '',
  
  // 水印
  'components-watermark-text': '',
  
  // 浮动按钮
  'components-float-button-bg': '',
  'components-float-button-text': '',
  'components-float-button-border': '',
  'components-float-button-shadow': '',
  'components-float-button-bg-hover': '',
  
  // 分段控制器
  'components-segmented-bg': '',
  'components-segmented-border': '',
  'components-segmented-item-bg': '',
  'components-segmented-item-bg-hover': '',
  'components-segmented-item-bg-active': '',
  'components-segmented-item-text': '',
  'components-segmented-item-text-active': '',
  
  // 提及组件
  'components-mentions-bg': '',
  'components-mentions-border': '',
  'components-mentions-dropdown-bg': '',
  'components-mentions-dropdown-border': '',
  'components-mentions-dropdown-shadow': '',
  'components-mentions-item-bg-hover': '',
  'components-mentions-item-text': '',
  
  // 色彩选择器
  'components-colorpicker-bg': '',
  'components-colorpicker-border': '',
  'components-colorpicker-panel-bg': '',
  'components-colorpicker-panel-border': '',
  'components-colorpicker-panel-shadow': '',
  'components-colorpicker-slider-bg': '',
  'components-colorpicker-handle': '',
  'components-colorpicker-input-bg': '',
  'components-colorpicker-input-border': '',
  
  // 布局组件
  'components-layout-header-bg': '',
  'components-layout-header-border': '',
  'components-layout-sider-bg': '',
  'components-layout-sider-border': '',
  'components-layout-content-bg': '',
  'components-layout-footer-bg': '',
  'components-layout-footer-border': '',
  
  // 栅格系统
  'components-grid-gutter': '',
  
  // 卡片高级变体
  'components-card-meta-title': '',
  'components-card-meta-description': '',
  'components-card-actions-bg': '',
  'components-card-actions-border': '',
  'components-card-cover-bg': '',
  
  // 列表高级变体
  'components-list-bg': '',
  'components-list-border': '',
  'components-list-item-bg': '',
  'components-list-item-bg-hover': '',
  'components-list-item-border': '',
  'components-list-item-meta-title': '',
  'components-list-item-meta-description': '',
  'components-list-item-actions': '',
  
  // 描述列表
  'components-descriptions-bg': '',
  'components-descriptions-border': '',
  'components-descriptions-title': '',
  'components-descriptions-content': '',
  'components-descriptions-label': '',
  'components-descriptions-item-border': '',
  
  // 聊天页面专用布局
  'chat-header-bg': '',
  'chat-header-border': '',
  'chat-header-backdrop': '',
  'chat-main-bg': '',
  'chat-content-bg': '',
  'chat-content-border': '',
  'chat-input-area-bg': '',
  'chat-input-area-border': '',
  'chat-input-area-shadow': '',
  'chat-gradient-primary': '',
  'chat-gradient-secondary': '',
  'chat-welcome-border': '',
  'chat-welcome-shadow': '',
  'chat-input-area-backdrop': '',
  
  // 聊天气泡和头像
  'chat-bubble-assistant-avatar-bg': '',
  'chat-bubble-assistant-avatar-text': '',
  'chat-bubble-user-avatar-bg': '',
  'chat-bubble-user-avatar-text': '',
  'chat-bubble-user-bg': '',
  'chat-bubble-user-text': '',
  
  // 侧边栏现代化升级
  'components-sidebar-backdrop': '',

  // 编辑器组件
  'components-editor-bg': '',
  'components-editor-toolbar-bg': '',
  'components-editor-text': '',
  'components-editor-border': '',

  // 面板组件
  'components-panel-header-bg': '',
  'components-panel-header-text': '',
  'components-panel-content-bg': '',

  // 图标按钮
  'components-icon-button-text': '',
  'components-icon-button-text-hover': '',
  'components-icon-button-bg-hover': '',

  // 聊天预览增强
  'chat-bubble-ai-bg': '',
  'chat-bubble-ai-text': '',
  'chat-input-container-bg': '',
  'chat-preview-debug-bg': '',
  'chat-preview-debug-text': '',
  'chat-think-bg': '',
  'chat-think-border': '',
  'chat-think-text': '',

  // 应用头像
  'components-app-avatar-bg': '',
  'components-app-avatar-border': '',

  // API 密钥管理
  'components-api-key-card-bg': '',
  'components-api-key-card-bg-hover': '',
  'components-api-key-card-border': '',
  'components-api-key-card-shadow': '',
  'components-api-key-header-bg': '',
  'components-api-key-header-text': '',
  'components-api-key-value-bg': '',
  'components-api-key-value-text': '',
  'components-api-key-value-masked': '',
  'components-api-key-actions-bg': '',
  'components-api-key-actions-border': '',

  // API 状态指示器
  'components-api-status-online-bg': '',
  'components-api-status-online-text': '',
  'components-api-status-online-dot': '',
  'components-api-status-offline-bg': '',
  'components-api-status-offline-text': '',
  'components-api-status-offline-dot': '',
  'components-api-status-error-bg': '',
  'components-api-status-error-text': '',
  'components-api-status-error-dot': '',

  // HTTP 方法颜色系统
  'components-http-method-get-bg': '',
  'components-http-method-get-text': '',
  'components-http-method-get-border': '',
  'components-http-method-post-bg': '',
  'components-http-method-post-text': '',
  'components-http-method-post-border': '',
  'components-http-method-put-bg': '',
  'components-http-method-put-text': '',
  'components-http-method-put-border': '',
  'components-http-method-delete-bg': '',
  'components-http-method-delete-text': '',
  'components-http-method-delete-border': '',
  'components-http-method-patch-bg': '',
  'components-http-method-patch-text': '',
  'components-http-method-patch-border': '',

  // 现代化增强组件
  'components-glassmorphism-bg': '',
  'components-glassmorphism-border': '',
  'components-glassmorphism-shadow': '',
  'components-gradient-primary': '',
  'components-gradient-secondary': '',
  'components-gradient-accent': '',
  'components-modern-card-bg': '',
  'components-modern-card-border': '',
  'components-modern-card-shadow': '',

  // 首页推荐卡片系统
  'components-recommend-card-bg-1': '',
  'components-recommend-card-bg-2': '',
  'components-recommend-card-bg-3': '',
  'components-recommend-card-bg-4': '',
  'components-recommend-card-text': '',
  'components-recommend-card-tag': '',

  // 画布系统 (Agent Canvas)
  'components-canvas-bg': '',
  'components-canvas-grid': '',
  'components-canvas-node-bg': '',
  'components-canvas-node-border': '',
  'components-canvas-node-border-hover': '',
  'components-canvas-node-border-selected': '',
  'components-canvas-node-shadow': '',
  'components-canvas-edge-stroke': '',
  'components-canvas-edge-stroke-hover': '',
  'components-canvas-edge-stroke-selected': '',
  'components-canvas-edge-marker': '',
  'components-canvas-edge-marker-selected': '',
  'components-canvas-handle-bg': '',
  'components-canvas-handle-border': '',
  'components-canvas-handle-icon': '',
  'components-canvas-toolbar-bg': '',
  'components-canvas-toolbar-border': '',
  'components-canvas-toolbar-shadow': '',
  'components-canvas-icon-start': '',
  'components-canvas-icon-retrieval': '',
  'components-canvas-icon-generate': '',
  'components-canvas-icon-message': '',
  'components-canvas-icon-tool': '',
  'components-canvas-icon-file': '',
  'components-canvas-icon-parser': '',
  'components-canvas-icon-splitter': '',
  'components-canvas-icon-tokenizer': '',
  'components-canvas-icon-extractor': '',
  'components-canvas-icon-switch': '',
  'components-canvas-icon-categorize': '',
  'components-canvas-icon-agent': '',
  'components-canvas-icon-code': '',
  'components-canvas-icon-default': '',
  'components-canvas-skeleton-bg': '',
  'components-canvas-note-bg': '',
  'components-canvas-note-border': '',
  'components-canvas-note-border-selected': '',
  'components-canvas-note-title': '',
  'components-canvas-note-text': '',
}

// 导出 CSS 变量映射用于 Tailwind
export const cssVariables = generateCSSVars(defaultTokens as unknown as Record<string, string>)