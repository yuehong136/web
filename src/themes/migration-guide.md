# 组件迁移指南：100% 设计令牌化

本文档展示如何将现有组件完全迁移到新的100%语义化设计令牌系统。

## 🎯 迁移目标

将所有硬编码颜色替换为语义化设计令牌，实现：
- ✅ 100% 设计令牌覆盖
- ✅ 完整的主题切换支持
- ✅ 统一的视觉体验
- ✅ 更好的维护性

## 📋 迁移清单

### Phase 1: 识别硬编码颜色
- [ ] 扫描所有组件文件中的硬编码颜色值
- [ ] 识别使用具体颜色名称的 Tailwind 类名
- [ ] 记录需要新增的设计令牌

### Phase 2: 扩展设计令牌
- [ ] 在 `tokens.ts` 中添加缺失的令牌定义
- [ ] 在 `theme-generator.ts` 中添加具体颜色值
- [ ] 重新生成主题文件

### Phase 3: 更新组件代码
- [ ] 替换硬编码颜色为设计令牌
- [ ] 测试主题切换功能
- [ ] 验证视觉效果一致性

## 📝 迁移示例

### 示例 1: Button 组件迁移

**现有代码分析：**
```tsx
// src/components/ui/button.tsx - 当前状态
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ✅ 已使用设计令牌
        default: "bg-components-button-primary-bg text-components-button-primary-text hover:bg-components-button-primary-bg-hover",
        
        // ❌ 仍有硬编码颜色
        destructive: "bg-error-500 text-white hover:bg-error-600 active:bg-error-700",
        success: "bg-success-500 text-white hover:bg-success-600 active:bg-success-700",
        warning: "bg-warning-500 text-white hover:bg-warning-600 active:bg-warning-700",
      }
    }
  }
)
```

**迁移后代码：**
```tsx
// 完全迁移到设计令牌
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        // 主要按钮
        default: "bg-components-button-primary-bg text-components-button-primary-text hover:bg-components-button-primary-bg-hover active:bg-components-button-primary-bg-active border-components-button-primary-border hover:border-components-button-primary-border-hover disabled:bg-components-button-primary-bg-disabled disabled:text-components-button-primary-text-disabled",
        
        // 危险按钮 - 使用新的设计令牌
        destructive: "bg-components-button-error-bg text-components-button-error-text hover:bg-components-button-error-bg-hover active:bg-components-button-error-bg-active border-components-button-error-border disabled:bg-components-button-error-bg-disabled disabled:text-components-button-error-text-disabled",
        
        // 次要按钮
        outline: "border bg-components-button-secondary-bg text-components-button-secondary-text hover:bg-components-button-secondary-bg-hover active:bg-components-button-secondary-bg-active border-components-button-secondary-border hover:border-components-button-secondary-border-hover disabled:bg-components-button-secondary-bg-disabled disabled:text-components-button-secondary-text-disabled",
        
        secondary: "bg-components-button-secondary-bg text-components-button-secondary-text hover:bg-components-button-secondary-bg-hover active:bg-components-button-secondary-bg-active disabled:bg-components-button-secondary-bg-disabled disabled:text-components-button-secondary-text-disabled",
        
        // 幽灵按钮
        ghost: "hover:bg-components-button-ghost-bg-hover text-components-button-ghost-text disabled:text-components-button-ghost-text-disabled",
        
        // 链接按钮
        link: "text-text-accent underline-offset-4 hover:underline disabled:text-text-disabled",
        
        // 成功按钮 - 使用新的设计令牌
        success: "bg-components-button-success-bg text-components-button-success-text hover:bg-components-button-success-bg-hover active:bg-components-button-success-bg-active border-components-button-success-border disabled:bg-components-button-success-bg-disabled disabled:text-components-button-success-text-disabled",
        
        // 警告按钮 - 使用新的设计令牌
        warning: "bg-components-button-warning-bg text-components-button-warning-text hover:bg-components-button-warning-bg-hover active:bg-components-button-warning-bg-active border-components-button-warning-border disabled:bg-components-button-warning-bg-disabled disabled:text-components-button-warning-text-disabled",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

**需要添加的设计令牌：**
```typescript
// src/themes/tokens.ts - 添加缺失的按钮令牌
export interface DesignTokens {
  // ... 现有令牌

  // 错误/危险按钮
  'components-button-error-bg': string
  'components-button-error-bg-hover': string
  'components-button-error-bg-active': string
  'components-button-error-bg-disabled': string
  'components-button-error-text': string
  'components-button-error-text-disabled': string
  'components-button-error-border': string

  // 成功按钮
  'components-button-success-bg': string
  'components-button-success-bg-hover': string
  'components-button-success-bg-active': string
  'components-button-success-bg-disabled': string
  'components-button-success-text': string
  'components-button-success-text-disabled': string
  'components-button-success-border': string

  // 警告按钮
  'components-button-warning-bg': string
  'components-button-warning-bg-hover': string
  'components-button-warning-bg-active': string
  'components-button-warning-bg-disabled': string
  'components-button-warning-text': string
  'components-button-warning-text-disabled': string
  'components-button-warning-border': string
}
```

**添加到主题生成器：**
```typescript
// src/themes/theme-generator.ts
export const lightTokens: DesignTokens = {
  // ... 现有令牌

  // 错误/危险按钮
  'components-button-error-bg': '#ef4444',
  'components-button-error-bg-hover': '#dc2626',
  'components-button-error-bg-active': '#b91c1c',
  'components-button-error-bg-disabled': '#fee2e2',
  'components-button-error-text': '#ffffff',
  'components-button-error-text-disabled': '#9ca3af',
  'components-button-error-border': '#ef4444',

  // 成功按钮
  'components-button-success-bg': '#22c55e',
  'components-button-success-bg-hover': '#16a34a',
  'components-button-success-bg-active': '#15803d',
  'components-button-success-bg-disabled': '#dcfce7',
  'components-button-success-text': '#ffffff',
  'components-button-success-text-disabled': '#9ca3af',
  'components-button-success-border': '#22c55e',

  // 警告按钮
  'components-button-warning-bg': '#f59e0b',
  'components-button-warning-bg-hover': '#d97706',
  'components-button-warning-bg-active': '#b45309',
  'components-button-warning-bg-disabled': '#fef3c7',
  'components-button-warning-text': '#ffffff',
  'components-button-warning-text-disabled': '#9ca3af',
  'components-button-warning-border': '#f59e0b',
}

export const darkTokens: DesignTokens = {
  // ... 现有令牌

  // 错误/危险按钮 (暗色主题)
  'components-button-error-bg': '#ef4444',
  'components-button-error-bg-hover': '#dc2626',
  'components-button-error-bg-active': '#b91c1c',
  'components-button-error-bg-disabled': 'rgba(239, 68, 68, 0.1)',
  'components-button-error-text': '#ffffff',
  'components-button-error-text-disabled': 'rgba(255, 255, 255, 0.4)',
  'components-button-error-border': '#ef4444',

  // 成功按钮 (暗色主题)
  'components-button-success-bg': '#22c55e',
  'components-button-success-bg-hover': '#16a34a',
  'components-button-success-bg-active': '#15803d',
  'components-button-success-bg-disabled': 'rgba(34, 197, 94, 0.1)',
  'components-button-success-text': '#ffffff',
  'components-button-success-text-disabled': 'rgba(255, 255, 255, 0.4)',
  'components-button-success-border': '#22c55e',

  // 警告按钮 (暗色主题)
  'components-button-warning-bg': '#f59e0b',
  'components-button-warning-bg-hover': '#d97706',
  'components-button-warning-bg-active': '#b45309',
  'components-button-warning-bg-disabled': 'rgba(245, 158, 11, 0.1)',
  'components-button-warning-text': '#ffffff',
  'components-button-warning-text-disabled': 'rgba(255, 255, 255, 0.4)',
  'components-button-warning-border': '#f59e0b',
}
```

### 示例 2: Card 组件迁移

**迁移前：**
```tsx
// 使用硬编码 Tailwind 类名
<div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md">
  <div className="p-4">
    <h3 className="text-gray-900 font-semibold">标题</h3>
    <p className="text-gray-600 mt-2">描述文本</p>
  </div>
</div>
```

**迁移后：**
```tsx
// 使用设计令牌
<div className="bg-components-card-bg border-components-card-border rounded-lg shadow-components-card-shadow hover:bg-components-card-bg-hover">
  <div className="p-4">
    <h3 className="text-text-primary font-semibold">标题</h3>
    <p className="text-text-secondary mt-2">描述文本</p>
  </div>
</div>

// 或者使用预定义的样式类
<div className="card">
  <div className="p-4">
    <h3 className="text-text-primary font-semibold">标题</h3>
    <p className="text-text-secondary mt-2">描述文本</p>
  </div>
</div>
```

### 示例 3: Input 组件迁移

**迁移前：**
```tsx
<input 
  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400"
  placeholder="请输入内容"
/>
```

**迁移后：**
```tsx
// 使用设计令牌
<input 
  className="w-full px-3 py-2 bg-components-input-bg border-components-input-border rounded-md text-components-input-text placeholder:text-components-input-text-placeholder hover:bg-components-input-bg-hover hover:border-components-input-border-hover focus:bg-components-input-bg-focus focus:border-components-input-border-focus focus:outline-none focus:ring-1 focus:ring-state-focus disabled:bg-components-input-bg-disabled disabled:text-components-input-text-disabled"
  placeholder="请输入内容"
/>

// 或者使用预定义的样式类
<input 
  className="input-field w-full"
  placeholder="请输入内容"
/>
```

## 🔧 迁移工具

### 1. 自动化扫描脚本
```bash
# 创建一个脚本来扫描硬编码颜色
# scripts/scan-hardcoded-colors.js

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 扫描所有 .tsx, .ts, .css 文件中的硬编码颜色
const hardcodedColorPatterns = [
  /bg-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900)/g,
  /text-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900)/g,
  /border-(red|green|blue|yellow|purple|pink|indigo|gray|slate|zinc|neutral|stone|orange|amber|lime|emerald|teal|cyan|sky|violet|fuchsia|rose)-(50|100|200|300|400|500|600|700|800|900)/g,
  /#[0-9a-fA-F]{3,8}/g, // 十六进制颜色
  /rgba?\([^)]+\)/g,    // rgba/rgb 颜色
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  hardcodedColorPatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push(...matches);
    }
  });
  
  return issues;
}

// 扫描所有相关文件
const files = glob.sync('src/**/*.{ts,tsx,css}');
const results = {};

files.forEach(file => {
  const issues = scanFile(file);
  if (issues.length > 0) {
    results[file] = issues;
  }
});

console.log('发现的硬编码颜色:', JSON.stringify(results, null, 2));
```

### 2. 迁移检查清单

**组件迁移检查清单：**
```markdown
## 组件名称: _____________

### 迁移前检查
- [ ] 识别所有硬编码颜色
- [ ] 确定需要的设计令牌
- [ ] 检查是否有特殊状态（hover, active, disabled）

### 设计令牌准备
- [ ] 在 tokens.ts 中添加类型定义
- [ ] 在 theme-generator.ts 中添加亮色主题值
- [ ] 在 theme-generator.ts 中添加暗色主题值
- [ ] 运行 `npm run build:themes` 生成新文件

### 代码迁移
- [ ] 替换所有硬编码颜色为设计令牌
- [ ] 确保所有交互状态都有对应令牌
- [ ] 更新组件文档和示例

### 测试验证
- [ ] 在亮色主题下测试组件
- [ ] 在暗色主题下测试组件
- [ ] 测试所有交互状态
- [ ] 验证无障碍性对比度
- [ ] 检查不同尺寸设备的显示效果

### 完成确认
- [ ] 代码 Review 通过
- [ ] 设计师确认视觉效果
- [ ] 更新组件文档
- [ ] 添加到 Storybook（如有）
```

## 📊 迁移进度跟踪

### 组件迁移状态表
```markdown
| 组件名称 | 迁移状态 | 硬编码颜色数量 | 负责人 | 完成日期 |
|---------|---------|-------------|-------|---------|
| Button  | ✅ 已完成 | 0 | 张三 | 2024-01-15 |
| Input   | 🔄 进行中 | 3 | 李四 | - |
| Card    | ❌ 未开始 | 8 | - | - |
| Modal   | ❌ 未开始 | 5 | - | - |
| Table   | ❌ 未开始 | 12 | - | - |
```

## 🚀 迁移后的好处

### 1. 主题切换完美支持
```tsx
// 迁移前：在暗色主题下可能显示异常
<button className="bg-white text-black border-gray-300">
  按钮
</button>

// 迁移后：完美支持主题切换
<button className="bg-components-button-secondary-bg text-components-button-secondary-text border-components-button-secondary-border">
  按钮
</button>
```

### 2. 统一的品牌体验
- 所有组件使用统一的颜色系统
- 设计变更只需修改一处
- 确保不同页面间的视觉一致性

### 3. 更好的维护性
- 减少样式冗余
- 更容易进行全局样式调整
- 降低样式冲突的可能性

### 4. 增强的可访问性
- 确保颜色对比度符合标准
- 支持高对比度模式
- 更好的屏幕阅读器支持

## ⚠️ 迁移注意事项

### 1. 渐进式迁移
- 不要一次性迁移所有组件
- 按优先级和使用频率确定迁移顺序
- 确保每个组件迁移完成后都经过充分测试

### 2. 向后兼容性
- 在迁移过程中保持向后兼容性
- 逐步废弃旧的样式类
- 提供迁移指南给其他开发者

### 3. 设计师协作
- 与设计师确认颜色映射的正确性
- 在迁移前后进行视觉对比
- 确保没有视觉回退

### 4. 性能考虑
- CSS 变量的性能影响微乎其微
- 确保生成的 CSS 文件大小合理
- 考虑是否需要按需加载主题文件

---

**🎯 迁移目标：通过系统性的组件迁移，实现 100% 设计令牌覆盖，为项目的长期发展提供坚实的技术基础。**