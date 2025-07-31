/**
 * Tailwind CSS 设计令牌变量扩展
 * 基于语义化设计令牌系统
 */

import { cssVariables } from './tokens'

// 生成 Tailwind 兼容的变量映射
const tailwindVars = {
  // 直接映射所有设计令牌
  ...cssVariables,
  
  // Tailwind 默认颜色系统兼容
  'primary': 'var(--color-components-button-primary-bg)',
  'secondary': 'var(--color-text-secondary)',
  'accent': 'var(--color-text-accent)',
  'neutral': 'var(--color-text-primary)',
  'base-100': 'var(--color-background-body)',
  'base-200': 'var(--color-background-default)',
  'base-300': 'var(--color-background-subtle)',
  'info': 'var(--color-text-accent)',
  'success': 'var(--color-text-success)',
  'warning': 'var(--color-text-warning)',
  'error': 'var(--color-text-error)',
  
  // 常用组合变量 - 简化使用
  'card': 'var(--color-components-card-bg)',
  'card-hover': 'var(--color-components-card-bg-hover)',
  'sidebar': 'var(--color-components-sidebar-bg)',
  'nav': 'var(--color-components-nav-bg)',
  'input': 'var(--color-components-input-bg)',
  'dropdown': 'var(--color-components-dropdown-bg)',
  'modal': 'var(--color-components-modal-bg)',
  'table': 'var(--color-components-table-bg)',
}

export default tailwindVars