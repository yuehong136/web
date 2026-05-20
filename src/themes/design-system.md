# 100% 语义化设计令牌系统规范

基于 Dify 项目的最佳实践，建立企业级前端主题管理系统。

## 🎯 核心理念

### 1. 设计令牌驱动 (Design Token-Driven)

- 所有颜色通过 CSS 自定义属性 (`--color-*`) 定义
- 超过 500+ 设计令牌覆盖组件、文本、背景、状态等所有场景
- 语义化命名：`components-button-primary-bg`、`text-secondary`、`state-destructive-hover`

### 2. 自动化代码生成

- 所有主题文件通过代码生成，确保一致性
- 防止手动修改导致的不一致问题
- 支持主题文件热更新和验证

### 3. 分层架构设计

```
设计令牌定义 (tokens.ts)
       ↓
主题生成器 (theme-generator.ts)
       ↓
生成主题变量 (light.css / dark.css):
  - --color-* 语义变量
  - --twc-* 通道变量 (RGB 三通道，供 Tailwind /alpha 使用)
       ↓
Tailwind 集成 (tailwind.config.js):
  - colors.primary = rgb(var(--twc-primary) / <alpha-value>)
  - foreground/background/ring/border 同理
       ↓
组件应用 (React / Tailwind 工具类)
```

## 📚 令牌分类系统

### 基础令牌 (Foundation Tokens)

```typescript
// 文本系统
'text-primary' // 主要文本
'text-secondary' // 次要文本
'text-tertiary' // 三级文本
'text-muted' // 弱化文本
'text-disabled' // 禁用文本
'text-accent' // 强调文本
'text-success' // 成功状态文本
'text-warning' // 警告状态文本
'text-error' // 错误状态文本
'text-inverted' // 反色文本

// 背景系统
'background-body' // 页面主背景
'background-default' // 默认背景
'background-subtle' // 微妙背景
'background-section' // 区块背景
'background-overlay' // 遮罩背景
'background-surface' // 表面背景

// 边框系统
'border-default' // 默认边框
'border-subtle' // 微妙边框
'border-strong' // 强调边框
'border-accent' // 强调色边框
'border-success' // 成功状态边框
'border-warning' // 警告状态边框
'border-error' // 错误状态边框
```

### 组件令牌 (Component Tokens)

```typescript
// 按钮组件完整状态覆盖
'components-button-primary-bg'
'components-button-primary-bg-hover'
'components-button-primary-bg-active'
'components-button-primary-bg-disabled'
'components-button-primary-text'
'components-button-primary-text-disabled'
'components-button-primary-border'
'components-button-primary-border-hover'

// 输入框组件完整状态覆盖
'components-input-bg'
'components-input-bg-hover'
'components-input-bg-focus'
'components-input-bg-disabled'
'components-input-border'
'components-input-border-hover'
'components-input-border-focus'
'components-input-border-error'
'components-input-text'
'components-input-text-placeholder'
'components-input-text-disabled'
```

### 状态令牌：两条语义轴 (State Tokens — Two Semantic Axes)

主流现代化设计系统（Radix / shadcn、Ant Design、Material 3 等）都把「**交互状态**」与「**反馈/意图色**」当作两条独立语义轴。本项目同样拆成两个前缀，**禁止混用**：

| 语义轴                          | 前缀           | 含义                          | 取值                                                                                |
| ------------------------------- | -------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| 交互状态 (Interaction state)    | **`state-*`**  | 元素与指针/键盘交互时的瞬时态 | `state-hover` / `state-active` / `state-focus` / `state-disabled` / `state-loading` |
| 反馈/意图色 (Feedback / intent) | **`status-*`** | 表达操作结果或语义意图        | `status-success` / `status-warning` / `status-error` / `status-info`                |

#### 1) 交互状态令牌 (Interaction Tokens) → `state-*`

```typescript
'state-hover' // 悬停状态 - 通用悬停效果
'state-active' // 激活状态 - 按钮按下、选中
'state-focus' // 聚焦状态 - 键盘导航、表单聚焦（含 state-focus-10 / state-focus-subtle）
'state-disabled' // 禁用状态 - 不可交互元素
'state-loading' // 加载状态 - 数据加载中
```

#### 2) 反馈/意图色令牌 (Feedback Tokens) → `status-*`（canonical）

```typescript
// 实色（图标、文字、描边、实心点）
'status-success' // 成功 - 操作成功反馈
'status-warning' // 警告 - 需要注意的操作
'status-error' // 错误 - 操作失败、校验错误
'status-info' // 信息 - 中性提示、说明

// 10% 透明度（弱底色、徽标底）
'status-success-10' / 'status-warning-10' / 'status-error-10' / 'status-info-10'

// 语义化别名（subtle = 10% 透明度，用于卡片/提示条底色）
'status-success-subtle' /
  'status-warning-subtle' /
  'status-error-subtle' /
  'status-info-subtle'
```

使用约定：

- 文字/图标/描边用实色：`text-status-error`、`border-status-warning`；
- 弱底色用 `-10` 或 `-subtle`：`bg-status-info-10`、`bg-status-success-subtle`；
- 也可用 Tailwind 斜杠透明度叠加：`bg-status-success/10`、`hover:bg-status-error/10`。

#### 3) Legacy alias：`state-{success,warning,error,info}`（强制）

历史上反馈色曾写作 `state-success/warning/error/info`（含 `-10`/`-subtle`）。现已确立 `status-*` 为反馈态 canonical，`state-*` 反馈 token **保留为等值 legacy alias**，仅用于在全仓迁移完成前兼容存量代码：

- ✅ 新代码反馈态**只写 `status-*`**；
- ❌ **不要新写**反馈态 `state-success/warning/error/info`；
- ❌ 全仓迁移完成前**不要删除**这些 alias（使用面大，删除会大范围回归）；
- ✅ 交互态 `state-hover/active/focus/disabled/loading` 不受影响，继续使用。

知识库模块已完成迁移作为参考实现，见 `docs/knowledge-refactor/2026-05-20-knowledge-status-token-audit-summary.md`；其余模块的反馈态 `state-*` → `status-*` 全仓迁移作为后续 “Design Token semantic migration” 任务推进。

> 注：基础令牌里的 `text-success/warning/error`、`border-success/warning/error` 是「文本/边框」专用语义键，与反馈意图色独立，不在本次 `state-*`→`status-*` 迁移范围内。

## 🏗️ 实施架构

### 第一层：设计令牌定义 (tokens.ts)

- 完整的 TypeScript 类型定义
- 500+ 设计令牌覆盖所有使用场景
- 语义化命名规范

### 第二层：CSS 变量映射 (generated)

- 自动生成 `light.css` 和 `dark.css`
- 通过代码生成确保一致性
- 支持注释标记防止手动修改

### 第三层：Tailwind 集成 (tailwind-vars.ts)

- 无缝集成到 Tailwind CSS
- 支持所有设计令牌作为 Tailwind 类名
- 向后兼容现有样式
- 通过 `--twc-*` 通道变量获得 Tailwind 原生的斜杠透明度能力：
  - 示例：`bg-primary/10`、`hover:bg-primary/90`、`ring-ring/50`、`border-border/30`
- 暗黑模式：`darkMode: ['class', '[data-theme="dark"]']`，配合 `html[data-theme="dark"]` 即可切换

#### 通道变量规范

- `--twc-primary`: 主色 RGB（不含透明度）
- `--twc-primary-foreground`: 主色文字 RGB
- `--twc-foreground` / `--twc-background` / `--twc-ring` / `--twc-border`
- 以上变量由生成器自动写入 `light.css` / `dark.css`，禁止手改

### 第四层：组件应用

- React 组件使用标准化的设计令牌
- 统一的组件样式类 (.btn-primary, .card, .input-field)
- 完整的主题响应能力

示例（推荐的 Tailwind 写法，搭配语义颜色键）：

```tsx
<button className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50">
  提交
</button>
```

## 🚀 自动化工具链

### 1. 主题生成器 (theme-generator.ts)

```typescript
// 自动生成主题 CSS 文件
generateThemeCSS(lightTokens, 'light.css')
generateThemeCSS(darkTokens, 'dark.css')
```

### 2. 令牌验证器 (token-validator.ts)

```typescript
// 验证设计令牌完整性
validateTokenCompleteness()
validateTokenNaming()
validateColorContrast()
```

### 3. 类型生成器 (type-generator.ts)

```typescript
// 自动生成 TypeScript 类型
generateDesignTokenTypes()
generateTailwindTypes()
```

## 📋 开发规范

### 1. 禁止硬编码颜色

```tsx
// ❌ 错误做法
<div className="bg-blue-500 text-white">

// ✅ 正确做法
<div className="bg-components-button-primary-bg text-components-button-primary-text">
```

### 2. 使用语义化令牌

```tsx
// ❌ 错误做法
<div className="text-gray-600">

// ✅ 正确做法
<div className="text-text-secondary">
```

### 3. 组件状态令牌

```tsx
// ✅ 完整的状态支持
<button className="
  bg-components-button-primary-bg
  hover:bg-components-button-primary-bg-hover
  active:bg-components-button-primary-bg-active
  disabled:bg-components-button-primary-bg-disabled
">
```

## 🎨 扩展能力

### 1. 多品牌主题

- 支持不同品牌色系
- 独立的令牌配置文件
- 运行时主题切换

### 2. 自定义组件令牌

- 业务组件专用令牌
- 复杂交互状态支持
- 动画和过渡效果令牌

### 3. 响应式设计令牌

- 不同屏幕尺寸的令牌变体
- 移动端优化令牌
- 打印样式令牌

## 📊 性能优化

### 1. CSS 变量优化

- 使用 `rgb()` 函数支持透明度
- 避免重复计算
- 最小化 CSS 文件体积

### 2. 构建时优化

- 未使用令牌的自动清理
- CSS 压缩和合并
- 关键路径 CSS 内联

### 3. 运行时优化

- 主题切换动画优化
- 避免 FOUC (Flash of Unstyled Content)
- 主题预加载机制

## 🔄 迁移策略

### Phase 1: 基础架构建立

1. 完善设计令牌定义
2. 实现自动化生成工具
3. 建立开发规范

### Phase 2: 组件系统升级

1. 核心组件令牌化改造
2. 页面级主题应用
3. 兼容性测试

### Phase 3: 高级特性实现

1. 多品牌主题支持
2. 动态主题能力
3. 性能优化完善

---

**目标：实现像 Dify 一样的企业级主题系统，确保 100% 设计令牌覆盖，为项目的长期发展奠定坚实基础。**
