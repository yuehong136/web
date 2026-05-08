/** @type {import('tailwindcss').Config} */
import tailwindVars from './src/themes/tailwind-vars'

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: ['class', '[data-theme="dark"]'],
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
        // ⚠️ DEPRECATED: 项目规范禁用 gray-*；这里保留只是为了让 16 处遗留 usage
        // 在被逐一替换为语义 token 之前不破坏构建。新代码必须使用
        // surface-*/text-*/border-* 等语义 token。详见 AGENTS.md / CLAUDE.md。
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // success/warning/error 数字色阶已删除：项目统一使用 status-* 语义 token。
        // 如需要旧色阶请走 tokens.ts，不要在 tailwind 配置层重新引入。
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
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
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwind-scrollbar')({ nocompatible: true }),
    require('@tailwindcss/container-queries'),
  ],
}