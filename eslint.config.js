import js from '@eslint/js'
import globals from 'globals'
import importX from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tailwindcss from 'eslint-plugin-tailwindcss'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

const typedLint = process.env.ESLINT_TYPED === 'true'
const jsxA11yWarningRules = Object.fromEntries(
  Object.keys(jsxA11y.rules).map((ruleName) => [
    `jsx-a11y/${ruleName}`,
    'warn',
  ]),
)

export default tseslint.config([
  globalIgnores(['dist', 'coverage', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      ...(typedLint ? [tseslint.configs.recommendedTypeChecked] : []),
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
      jsxA11y.flatConfigs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      parserOptions: typedLint
        ? {
            projectService: true,
            tsconfigRootDir: import.meta.dirname,
          }
        : {},
    },
    settings: {
      tailwindcss: {
        config: 'tailwind.config.ts',
      },
      'import-x/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
    plugins: {
      tailwindcss,
    },
    rules: {
      // 项目累计的 any 类型是独立的类型收敛议题，lint 不阻塞
      '@typescript-eslint/no-explicit-any': 'warn',
      ...(typedLint
        ? {
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
            '@typescript-eslint/no-unsafe-enum-comparison': 'warn',
            '@typescript-eslint/no-unsafe-return': 'warn',
          }
        : {}),
      // 同文件混合导出组件/常量/hooks 与 CLAUDE.md 模块组织规范一致
      'react-refresh/only-export-components': 'off',
      // shadcn 风格 UI 组件的 "interface Foo extends X {}" 是合理模式
      '@typescript-eslint/no-empty-object-type': 'off',
      ...jsxA11yWarningRules,
      'import-x/default': 'warn',
      'import-x/export': 'warn',
      'import-x/namespace': 'warn',
      'import-x/no-cycle': 'warn',
      'import-x/no-unresolved': 'warn',
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
  {
    files: ['vite.config.ts', 'tailwind.config.ts', 'vitest.config.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['src/pages/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            'JSXAttribute[name.name="className"] Literal[value=/\\b(?:bg-white|text-gray-[0-9]{2,3}|border-gray-[0-9]{2,3})\\b/]',
          message:
            '页面层视觉语义必须使用设计 token，避免 bg-white/text-gray-*/border-gray-*。',
        },
        {
          selector: 'JSXOpeningElement[name.name=/^(input|textarea)$/]',
          message:
            '页面层请优先使用 @/components/ui/input 或 textarea，例外需写明 UI 层缺口。',
        },
      ],
    },
  },
])
