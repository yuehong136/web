# 100% 语义化设计令牌系统开发规范

基于 Dify 项目的最佳实践，本项目建立了企业级的 100% 语义化设计令牌系统。本文档为开发团队提供详细的使用指南和开发规范。

## 🎯 核心原则

### 1. 100% 设计令牌化
- **禁止硬编码颜色**：项目中不允许任何硬编码的颜色值
- **统一单一真实来源**：所有颜色通过设计令牌统一管理
- **语义化命名**：使用具有语义含义的令牌名称，而非具体颜色值

### 2. 自动化优先
- **代码生成**：主题文件通过代码自动生成，确保一致性
- **构建集成**：主题生成集成到构建流程中
- **类型安全**：TypeScript 类型定义确保使用安全

## 📚 设计令牌分类

### 基础令牌 (Foundation Tokens)
```typescript
// 文本系统 - 用于所有文本颜色
'text-primary'     // 主要文本 - 标题、重要内容
'text-secondary'   // 次要文本 - 描述、说明文字  
'text-tertiary'    // 三级文本 - 辅助信息
'text-muted'       // 弱化文本 - 占位符、禁用状态提示
'text-disabled'    // 禁用文本 - 不可交互元素
'text-accent'      // 强调文本 - 链接、重要提示
'text-success'     // 成功状态文本
'text-warning'     // 警告状态文本
'text-error'       // 错误状态文本
'text-inverted'    // 反色文本 - 深色背景上的文字

// 背景系统 - 用于所有背景颜色
'background-body'      // 页面主背景 - html/body
'background-default'   // 默认背景 - 容器、面板
'background-subtle'    // 微妙背景 - 输入框、卡片hover
'background-section'   // 区块背景 - 独立区域
'background-overlay'   // 遮罩背景 - 模态框遮罩
'background-surface'   // 表面背景 - 卡片、弹窗
```

### 组件令牌 (Component Tokens)
```typescript
// 按钮组件 - 完整状态覆盖
'components-button-primary-bg'           // 主按钮背景
'components-button-primary-bg-hover'     // 主按钮悬停背景
'components-button-primary-bg-active'    // 主按钮激活背景
'components-button-primary-bg-disabled'  // 主按钮禁用背景
'components-button-primary-text'         // 主按钮文字
'components-button-primary-text-disabled' // 主按钮禁用文字
'components-button-primary-border'       // 主按钮边框
'components-button-primary-border-hover' // 主按钮悬停边框

// 输入框组件 - 完整状态覆盖
'components-input-bg'                 // 输入框背景
'components-input-bg-hover'           // 输入框悬停背景
'components-input-bg-focus'           // 输入框聚焦背景
'components-input-bg-disabled'        // 输入框禁用背景
'components-input-border'             // 输入框边框
'components-input-border-hover'       // 输入框悬停边框
'components-input-border-focus'       // 输入框聚焦边框
'components-input-border-error'       // 输入框错误边框
'components-input-text'               // 输入框文字
'components-input-text-placeholder'   // 输入框占位符
'components-input-text-disabled'      // 输入框禁用文字
```

### 交互状态令牌 (Interaction Tokens)
```typescript
'state-hover'      // 悬停状态 - 通用悬停效果
'state-active'     // 激活状态 - 按钮按下、选中
'state-focus'      // 聚焦状态 - 键盘导航、表单聚焦
'state-disabled'   // 禁用状态 - 不可交互元素
'state-loading'    // 加载状态 - 数据加载中
'state-success'    // 成功状态 - 操作成功反馈
'state-warning'    // 警告状态 - 需要注意的操作
'state-error'      // 错误状态 - 操作失败、验证错误
```

## 🛠️ 使用方法

### 1. CSS 类名使用
```css
/* ✅ 正确做法 - 使用语义化设计令牌 */
.my-component {
  background-color: rgb(var(--color-components-card-bg));
  color: rgb(var(--color-text-primary));
  border: 1px solid rgb(var(--color-border-default));
}

.my-component:hover {
  background-color: rgb(var(--color-components-card-bg-hover));
}

/* ❌ 错误做法 - 硬编码颜色 */
.my-component {
  background-color: #ffffff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}
```

### 2. Tailwind CSS 类名使用（结合 --twc-* 通道变量）
```tsx
{/* ✅ 推荐做法 - 使用语义颜色键与斜杠透明度 */}
<div className="bg-card text-foreground border border-border">
  <button className="
    inline-flex items-center justify-center rounded-md text-sm font-medium px-4 py-2
    bg-primary text-primary-foreground border border-primary
    hover:bg-primary/90
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background
    disabled:opacity-50
  ">
    点击我
  </button>
</div>

{/* ❌ 错误做法 - 使用硬编码 Tailwind 颜色 */}
<div className="bg-white text-gray-900 border border-gray-200">
  <button className="bg-blue-500 hover:bg-blue-600 text-white">
    点击我
  </button>
</div>
```

### 3. React 组件中使用预定义样式类
```tsx
// ✅ 推荐做法 - 使用预定义的组件样式类
import React from 'react'

const MyButton: React.FC = ({ children, ...props }) => {
  return (
    <button 
      className="btn-primary" // 使用预定义的按钮样式
      {...props}
    >
      {children}
    </button>
  )
}

const MyCard: React.FC = ({ children }) => {
  return (
    <div className="card"> {/* 使用预定义的卡片样式 */}
      {children}
    </div>
  )
}
```

## 📋 开发规范

### 1. 禁止事项
```tsx
// ❌ 禁止：硬编码颜色值
<div style={{ backgroundColor: '#ffffff', color: '#000000' }}>

// ❌ 禁止：使用具体颜色的 Tailwind 类名
<div className="bg-white text-black border-gray-200">

// ❌ 禁止：在 CSS 中使用硬编码颜色
.my-class {
  background-color: #ffffff;
  color: #000000;
}

// ❌ 禁止：手动修改生成的主题文件
/* light.css 和 dark.css 文件头部有警告注释，禁止手动修改 */
```

### 2. 推荐做法
```tsx
// ✅ 推荐：使用语义化设计令牌
<div className="bg-background-surface text-text-primary border-border-default">

// ✅ 推荐：使用组件专用令牌
<button className="bg-components-button-primary-bg text-components-button-primary-text">

// ✅ 推荐：完整的状态支持
<input 
  className="
    bg-components-input-bg 
    hover:bg-components-input-bg-hover
    focus:bg-components-input-bg-focus
    disabled:bg-components-input-bg-disabled
    border-components-input-border
    hover:border-components-input-border-hover
    focus:border-components-input-border-focus
    disabled:border-components-input-border-disabled
  "
/>

// ✅ 推荐：使用预定义组件样式类
<button className="btn-primary">主要按钮</button>
<button className="btn-secondary">次要按钮</button>
<button className="btn-ghost">幽灵按钮</button>
<div className="card">卡片容器</div>
<input className="input-field" />
<div className="sidebar-item active">侧边栏项目</div>
```

### 3. 组件开发最佳实践

#### 创建新组件时
```tsx
// 1. 确定组件所需的设计令牌
// 2. 检查是否已有对应的组件令牌
// 3. 如果没有，添加到 theme-generator.ts 中
// 4. 重新生成主题文件
// 5. 使用新的设计令牌

// 示例：创建新的 Badge 组件
const Badge: React.FC<{ variant?: 'default' | 'success' | 'warning' | 'error' }> = ({ 
  children, 
  variant = 'default' 
}) => {
  const variantClasses = {
    default: 'bg-components-badge-bg text-components-badge-text border-components-badge-border',
    success: 'bg-components-badge-success-bg text-components-badge-success-text',
    warning: 'bg-components-badge-warning-bg text-components-badge-warning-text',
    error: 'bg-components-badge-error-bg text-components-badge-error-text',
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${variantClasses[variant]}`}>
      {children}
    </span>
  )
}
```

## 🔧 开发工具链

### 1. 主题文件生成
```bash
# 生成主题文件（每次修改设计令牌后运行）
npm run build:themes

# 输出示例：
# 🎨 开始生成主题文件...
# ✅ 主题文件生成成功!
#    📄 src/themes/light.css
#    📄 src/themes/dark.css
# 📊 统计信息:
#    🌞 亮色主题令牌数量: <N>
#    🌙 暗色主题令牌数量: <N>
#    📦 文件大小: 17.1KB + 18.4KB
#    ✨ 所有设计令牌验证通过
```

### 2. 添加新的设计令牌

**Step 1: 编辑令牌定义**
```typescript
// src/themes/tokens.ts
export interface DesignTokens {
  // 添加新的设计令牌类型定义
  'components-my-new-component-bg': string
  'components-my-new-component-text': string
  // ...
}

// 更新 defaultTokens 对象
export const defaultTokens: DesignTokens = {
  // 添加新的令牌占位符
  'components-my-new-component-bg': '',
  'components-my-new-component-text': '',
  // ...
}
```

**Step 2: 编辑主题生成器**
```typescript
// src/themes/theme-generator.ts
export const lightTokens: DesignTokens = {
  // 为亮色主题添加具体颜色值
  'components-my-new-component-bg': '#ffffff',
  'components-my-new-component-text': '#1f2937',
  // ...
}

export const darkTokens: DesignTokens = {
  // 为暗色主题添加具体颜色值
  'components-my-new-component-bg': '#1e293b',
  'components-my-new-component-text': '#ffffff',
  // ...
}
```

> 说明：生成器会自动在 `light.css`/`dark.css` 的选择器开头输出 `--twc-*` 通道变量（如 `--twc-primary`、`--twc-foreground` 等）。请勿手动编辑生成的 CSS 文件。

**Step 3: 重新生成主题文件**
```bash
npm run build:themes
```

**Step 4: 使用新的设计令牌**
```tsx
// 现在可以在组件中使用新的设计令牌
<div className="bg-components-my-new-component-bg text-components-my-new-component-text">
  我的新组件
</div>
```

### 3. 主题切换功能
```tsx
// 使用主题切换器组件
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

// 不同变体的使用
<ThemeSwitcher variant="toggle" />     // 简单切换按钮
<ThemeSwitcher variant="dropdown" />   // 下拉选择器  
<ThemeSwitcher variant="compact" />    // 紧凑模式
```

### 4. 输入框风格（现代浅色）建议
- 背景：`#fff`，Hover：`#f9fafb`，Focus：`#fff`
- 边框：默认 `#e2e8f0`，Hover `#cbd5e1`，Focus `#1e40af`
- 占位符：`#9ca3af`
- 以上已作为 `components-input-*` 令牌在生成器中配置

## 🚨 注意事项

### 1. 构建流程集成
- 在每次发布前运行 `npm run build:themes` 确保主题文件是最新的
- 考虑将主题生成集成到 CI/CD 流程中
- 在 pre-commit 钩子中验证设计令牌的使用

### 2. 设计令牌命名规范
```typescript
// 遵循命名规范：{类别}-{组件}-{属性}-{状态}
'components-button-primary-bg'        // 组件-按钮-主要-背景
'components-input-border-focus'       // 组件-输入框-边框-聚焦
'text-primary'                        // 文本-主要
'background-surface'                  // 背景-表面
'state-hover'                         // 状态-悬停
```

### 3. 性能考虑
- CSS 变量运行时性能优异，无需担心性能问题
- 避免在 JavaScript 中频繁读取 CSS 变量值
- 主题切换动画优化已内置在系统中

### 4. 浏览器兼容性
- CSS 自定义属性支持现代浏览器
- 如需支持 IE11，需要使用 PostCSS 插件进行转换

## 📚 扩展阅读

### 相关文档
- [设计系统架构文档](./design-system.md)
- [主题生成器源码](./theme-generator.ts)
- [构建脚本源码](./build-themes.ts)

### 最佳实践
- 定期 Review 设计令牌的使用情况
- 建立设计令牌的版本管理流程
- 与设计师建立设计令牌的协作工作流
- 定期清理未使用的设计令牌

---

**🎯 目标：通过严格遵循这套开发规范，确保项目达到 100% 设计令牌覆盖，为项目的长期维护和品牌一致性奠定坚实基础。**

---

**📞 技术支持**
如果在使用过程中遇到问题，请参考：
1. 本文档的常见问题解答
2. 查看 theme-generator.ts 中的验证错误信息
3. 联系前端架构团队获取支持