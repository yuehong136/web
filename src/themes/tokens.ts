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
}

// 导出 CSS 变量映射用于 Tailwind
export const cssVariables = generateCSSVars(defaultTokens as unknown as Record<string, string>)