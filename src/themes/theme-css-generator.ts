import type { DesignTokens } from './tokens'
import { rgbChannels } from './interaction-palette'

/**
 * 生成主题 CSS 文件内容
 */
export function generateThemeCSS(
  tokens: DesignTokens,
  themeName: 'light' | 'dark',
): string {
  // 同时输出 html 级与子树级选择器，便于分享页 / 嵌入场景在子树覆盖主题
  const selector = `html[data-theme="${themeName}"], [data-theme="${themeName}"]`

  let css = `/**\n * ${themeName === 'light' ? '亮色' : '暗色'}主题 CSS 变量定义\n * 基于 Dify 项目的设计令牌系统\n * \n * ⚠️ 注意: 此文件由代码自动生成，请勿手动修改!\n * 如需修改主题，请编辑 theme-generator.ts 文件\n */\n\n${selector} {\n  /* ===== Tailwind 通道变量 (用于 /alpha 透明度支持) ===== */\n  --twc-primary: ${rgbChannels(tokens['components-button-primary-bg'])};\n  --twc-primary-foreground: 255 255 255;\n  --twc-foreground: ${rgbChannels(tokens['text-primary'])};\n  --twc-background: ${rgbChannels(tokens['background-body'])};\n  --twc-ring: ${rgbChannels(tokens['state-focus'])};\n  --twc-border: ${themeName === 'light' ? '226 232 240' : '39 39 42'};\n\n`

  // 按分类组织令牌
  const categories = {
    文本系统: Object.keys(tokens).filter((key) => key.startsWith('text-')),
    背景系统: Object.keys(tokens).filter((key) =>
      key.startsWith('background-'),
    ),
    边框系统: Object.keys(tokens).filter((key) => key.startsWith('border-')),
    按钮组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-button-'),
    ),
    输入框组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-input-'),
    ),
    卡片组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-card-'),
    ),
    侧边栏组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-sidebar-'),
    ),
    导航组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-nav-'),
    ),
    下拉菜单组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-dropdown-'),
    ),
    模型选择器组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-model-selector-'),
    ),
    编辑器组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-editor-'),
    ),
    面板组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-panel-'),
    ),
    聊天系统: Object.keys(tokens).filter((key) => key.startsWith('chat-')),
    模态框组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-modal-'),
    ),
    表格组件: Object.keys(tokens).filter((key) =>
      key.startsWith('components-table-'),
    ),
    交互状态: Object.keys(tokens).filter((key) => key.startsWith('state-')),
    阴影系统: Object.keys(tokens).filter((key) => key.startsWith('shadow-')),
    表单控件: Object.keys(tokens).filter(
      (key) =>
        key.includes('-checkbox-') ||
        key.includes('-radio-') ||
        key.includes('-select-') ||
        key.includes('-switch-'),
    ),
    滚动条系统: Object.keys(tokens).filter((key) =>
      key.startsWith('components-scrollbar-'),
    ),
    对话框和覆盖层: Object.keys(tokens).filter(
      (key) =>
        key.includes('-dialog-') ||
        key.includes('-popover-') ||
        key.includes('-tooltip-'),
    ),
    导航和标签: Object.keys(tokens).filter(
      (key) => key.includes('-tabs-') || key.includes('-breadcrumb-'),
    ),
    状态和通知: Object.keys(tokens).filter((key) => key.includes('-alert-')),
    加载和进度: Object.keys(tokens).filter(
      (key) =>
        key.includes('-skeleton-') ||
        key.includes('-progress-') ||
        key.includes('-spinner-') ||
        key.includes('-loader-'),
    ),
    代码和预格式化文本: Object.keys(tokens).filter(
      (key) => key.includes('-code-') || key.includes('-pre-'),
    ),
    图标按钮: Object.keys(tokens).filter((key) =>
      key.startsWith('components-icon-button-'),
    ),
    应用头像: Object.keys(tokens).filter((key) =>
      key.startsWith('components-app-avatar-'),
    ),
    推荐卡片: Object.keys(tokens).filter((key) =>
      key.startsWith('components-recommend-card-'),
    ),
    统计卡片: Object.keys(tokens).filter((key) =>
      key.startsWith('components-stats-card-'),
    ),
    画布系统: Object.keys(tokens).filter((key) =>
      key.startsWith('components-canvas-'),
    ),
  }

  const categorized = new Set(Object.values(categories).flat())
  const remaining = Object.keys(tokens).filter((key) => !categorized.has(key))
  const emitted = new Set<string>()
  Object.entries({ ...categories, 其他组件: remaining }).forEach(
    ([categoryName, keys]) => {
      if (keys.length > 0) {
        css += `  /* ===== ${categoryName} ===== */\n`
        keys.forEach((key) => {
          if (emitted.has(key)) return
          emitted.add(key)
          css += `  --color-${key}: ${tokens[key as keyof DesignTokens]};\n`
        })
        css += '\n'
      }
    },
  )

  css += '}\n'

  return css
}
