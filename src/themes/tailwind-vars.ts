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
}
