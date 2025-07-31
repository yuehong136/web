# 🌙 100%暗黑模式设计系统实现

基于 **Dify 项目**的语义化设计令牌系统，实现专业级100%暗黑模式支持。

## 🎯 核心特性

- ✅ **100% 语义化设计令牌** - 所有颜色都有明确的语义含义
- ✅ **组件级粒度控制** - 每个UI组件都有独立的设计令牌
- ✅ **状态完整覆盖** - hover/active/disabled等所有状态
- ✅ **TypeScript 类型安全** - 完整的类型定义和检查
- ✅ **无缝主题切换** - 毫秒级切换，无闪烁体验
- ✅ **自动系统主题检测** - 支持跟随系统偏好

## 🏗️ 架构设计

### 三层架构体系
```
设计令牌定义 → CSS变量映射 → Tailwind扩展
```

### 文件结构
```
src/themes/
├── tokens.ts              # 设计令牌类型定义
├── light.css             # 亮色主题变量
├── dark.css              # 暗色主题变量
├── tailwind-vars.ts      # Tailwind扩展映射
└── index.ts              # 主题工具函数
```

## 🎨 设计令牌系统

### 语义化命名规范
```css
--color-{category}-{element}-{property}-{state}

/* 示例 */
--color-components-button-primary-bg-hover
--color-text-primary
--color-background-body
--color-state-destructive-hover
```

### 令牌分类

#### 1. 文本系统
- `text-primary` - 主要文本
- `text-secondary` - 次要文本  
- `text-tertiary` - 第三级文本
- `text-accent` - 强调色文本
- `text-success/warning/error` - 状态文本

#### 2. 背景系统
- `background-body` - 页面背景
- `background-default` - 默认背景
- `background-section` - 区块背景
- `background-overlay` - 遮罩背景

#### 3. 组件系统
```css
/* 按钮组件 */
--color-components-button-primary-bg
--color-components-button-primary-bg-hover
--color-components-button-primary-text
--color-components-button-secondary-bg

/* 输入框组件 */
--color-components-input-bg
--color-components-input-border
--color-components-input-border-focus

/* 卡片组件 */
--color-components-card-bg
--color-components-card-border
--color-components-card-shadow
```

## 🔧 技术实现

### 1. 主题切换机制
```typescript
// CSS 选择器策略
html[data-theme="dark"] {
  --color-text-primary: #f9fafb;
}

html[data-theme="light"] {
  --color-text-primary: #1f2937;
}
```

### 2. React 集成
```typescript
import { Theme, setTheme, getTheme } from '@/themes'

// 设置主题
setTheme(Theme.DARK)

// 获取当前主题
const currentTheme = getTheme()
```

### 3. 组件使用
```typescript
// 使用语义化类名
<div className="bg-components-card-bg text-text-primary border-components-card-border">
  <button className="bg-components-button-primary-bg hover:bg-components-button-primary-bg-hover">
    Button
  </button>
</div>
```

## 🎛️ 主题切换器组件

提供3种变体的主题切换器：

```typescript
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

// 下拉菜单样式
<ThemeSwitcher variant="dropdown" />

// 简单切换按钮
<ThemeSwitcher variant="toggle" />

// 紧凑图标样式  
<ThemeSwitcher variant="compact" />
```

## 🚀 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问演示页面
```
http://localhost:5175/theme-demo
```

## 📋 迁移指南

### 将现有组件迁移到设计令牌系统

#### 步骤1: 替换硬编码颜色
```typescript
// 旧的硬编码方式
<div className="bg-white text-gray-900 border-gray-200">

// 新的语义化方式  
<div className="bg-components-card-bg text-text-primary border-components-card-border">
```

#### 步骤2: 更新状态样式
```typescript
// 旧方式
<button className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300">

// 新方式
<button className="bg-components-button-primary-bg hover:bg-components-button-primary-bg-hover disabled:bg-components-button-primary-bg-disabled">
```

### 第三方组件适配

使用CSS变量桥接模式：

```css
/* 适配 Ant Design */
.ant-btn-primary {
  background-color: var(--color-components-button-primary-bg) !important;
  border-color: var(--color-components-button-primary-border) !important;
}

.ant-btn-primary:hover {
  background-color: var(--color-components-button-primary-bg-hover) !important;
}
```

## 🎨 自定义主题

### 添加新的设计令牌

1. 在 `tokens.ts` 中添加类型定义：
```typescript
export interface DesignTokens {
  // 添加新令牌
  'components-my-component-bg': string
  'components-my-component-text': string
}
```

2. 在 `light.css` 和 `dark.css` 中定义值：
```css
/* light.css */
--color-components-my-component-bg: #ffffff;
--color-components-my-component-text: #1f2937;

/* dark.css */  
--color-components-my-component-bg: #1f2937;
--color-components-my-component-text: #f9fafb;
```

3. 在组件中使用：
```typescript
<div className="bg-components-my-component-bg text-components-my-component-text">
  My Component
</div>
```

## 🔍 最佳实践

### 1. 语义化优先
- 使用语义化的令牌名称而不是具体颜色值
- 例：`text-primary` 而不是 `text-gray-900`

### 2. 组件级组织
- 按组件组织设计令牌
- 例：`components-button-*` 用于按钮相关样式

### 3. 状态完整性
- 为所有交互状态提供令牌
- 包括：normal, hover, active, focus, disabled

### 4. 一致性检查
- 使用 TypeScript 确保类型安全
- 定期检查令牌使用的一致性

## 📈 性能优化

- **CSS变量缓存** - 浏览器原生缓存CSS变量值
- **按需加载** - 只在需要时加载主题CSS
- **无重排重绘** - 只改变颜色值，不影响布局
- **毫秒级切换** - 基于CSS变量的即时主题切换

## 🛠️ 开发工具

### Tailwind 配置
```javascript
// tailwind.config.js
import tailwindVars from './src/themes/tailwind-vars'

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        ...tailwindVars,
      },
    },
  },
}
```

## 📚 参考资料

- [Dify 项目设计系统](https://github.com/langgenius/dify)
- [Tailwind CSS 暗黑模式](https://tailwindcss.com/docs/dark-mode)
- [CSS 自定义属性](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

---

🎨 **现在你的项目已拥有媲美 Dify 的专业级暗黑模式体验！**

访问 `/theme-demo` 页面查看完整的设计系统演示。