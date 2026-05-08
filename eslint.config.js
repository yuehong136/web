import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
    },
    rules: {
      // 项目累计的 any 类型是独立的类型收敛议题，lint 不阻塞
      '@typescript-eslint/no-explicit-any': 'off',
      // 同文件混合导出组件/常量/hooks 与 CLAUDE.md 模块组织规范一致
      'react-refresh/only-export-components': 'off',
      // shadcn 风格 UI 组件的 "interface Foo extends X {}" 是合理模式
      '@typescript-eslint/no-empty-object-type': 'off',
      // 流式 UI / AbortController / SSE 订阅漏 dep 直接导致内存泄漏与流堆叠，按 error 处理
      'react-hooks/exhaustive-deps': 'error',
      // 允许 _ 前缀形参/变量作为"故意未使用"的信号；caught errors 与 ragflow 默认一致允许忽略
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
          destructuredArrayIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
])
