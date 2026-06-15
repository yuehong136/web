import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'
import containerQueries from '@tailwindcss/container-queries'
import scrollbar from 'tailwind-scrollbar'
import type { Config } from 'tailwindcss'
import tailwindVars from './src/themes/tailwind-vars'

const config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    extend: {
      colors: {
        // 集成语义化设计令牌
        ...tailwindVars,
        // Tailwind 友好的通道变量映射（支持 /alpha 透明度）
        background: 'rgb(var(--twc-background) / <alpha-value>)',
        foreground: 'rgb(var(--twc-foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'var(--color-components-card-bg)',
          foreground: 'var(--color-text-primary)',
        },
        popover: {
          DEFAULT: 'var(--color-components-dropdown-bg)',
          foreground: 'var(--color-text-primary)',
        },
        primary: {
          DEFAULT: 'rgb(var(--twc-primary) / <alpha-value>)',
          foreground: 'rgb(var(--twc-primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'var(--color-components-button-secondary-bg)',
          foreground: 'var(--color-components-button-secondary-text)',
        },
        muted: {
          DEFAULT: 'var(--color-background-subtle)',
          foreground: 'var(--color-text-secondary)',
        },
        border: 'rgb(var(--twc-border) / <alpha-value>)',
        input: 'var(--color-components-input-border)',
        ring: 'rgb(var(--twc-ring) / <alpha-value>)',
        // gray/success/warning/error 数字色阶已统一删除。
        // 状态色走 status-* 语义 token；中性色走 background-*/text-*/border-* token。
        // 不要在 tailwind 配置层重新引入硬编码调色盘。
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'icon-xs': '0.75rem',
        'icon-sm': '1rem',
        'icon-md': '1.25rem',
        'icon-lg': '1.5rem',
        'icon-xl': '2rem',
        'icon-2xl': '2.5rem',
      },
      // boxShadow.soft/medium/large 已删除：项目统一使用 elevation-low/medium/high token。
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(12px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
      },
    },
  },
  plugins: [
    forms,
    typography,
    scrollbar({ nocompatible: true }),
    containerQueries,
  ],
} satisfies Config

export default config
