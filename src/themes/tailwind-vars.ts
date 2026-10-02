/**
 * Tailwind CSS 设计令牌变量扩展
 * 基于语义化设计令牌系统
 */

import { cssVariables } from './tokens'

// 生成 Tailwind 兼容的变量映射
export const tailwindColors = {
  // 直接映射所有设计令牌
  ...cssVariables,

  background: 'rgb(var(--twc-background))',
  foreground: 'rgb(var(--twc-foreground))',
  card: 'var(--color-components-card-bg)',
  'card-foreground': 'var(--color-text-primary)',
  popover: 'var(--color-components-dropdown-bg)',
  'popover-foreground': 'var(--color-text-primary)',
  primary: 'rgb(var(--twc-primary))',
  'primary-foreground': 'rgb(var(--twc-primary-foreground))',
  secondary: 'var(--color-components-button-secondary-bg)',
  'secondary-foreground': 'var(--color-components-button-secondary-text)',
  muted: 'var(--color-background-subtle)',
  'muted-foreground': 'var(--color-text-secondary)',
  border: 'rgb(var(--twc-border))',
  input: 'var(--color-components-input-border)',
  ring: 'rgb(var(--twc-ring))',
  accent: 'var(--color-accent)',
  'accent-foreground': 'var(--color-accent-foreground)',
  'card-base': 'var(--color-card)',
  'card-base-foreground': 'var(--color-card-foreground)',
  destructive: 'var(--color-destructive)',
  'destructive-foreground': 'var(--color-destructive-foreground)',
  neutral: 'var(--color-text-primary)',
  'base-100': 'var(--color-background-body)',
  'base-200': 'var(--color-background-default)',
  'base-300': 'var(--color-background-subtle)',
  info: 'var(--color-text-accent)',
  success: 'var(--color-text-success)',
  warning: 'var(--color-text-warning)',
  error: 'var(--color-text-error)',
  'card-hover': 'var(--color-components-card-bg-hover)',
  sidebar: 'var(--color-components-sidebar-bg)',
  nav: 'var(--color-components-nav-bg)',
  dropdown: 'var(--color-components-dropdown-bg)',
  modal: 'var(--color-components-modal-bg)',
  table: 'var(--color-components-table-bg)',
}
