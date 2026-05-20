import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'
import {
  Sun,
  Moon,
  Palette,
  Check,
  Info,
  AlertTriangle,
  XCircle,
  Settings,
} from 'lucide-react'

export const ThemeDemoPage: React.FC = () => {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-background-body">
      <div className="scroll-area min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {/* 页面标题 */}
          <div className="space-y-4 text-center">
            <h1 className="text-4xl font-bold text-text-primary">
              🎨 暗黑模式设计系统演示
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-secondary">
              基于 Dify
              项目的语义化设计令牌系统，实现100%主题覆盖的现代化暗黑模式体验
            </p>

            {/* 主题切换器 */}
            <div className="flex justify-center gap-4">
              <ThemeSwitcher variant="dropdown" />
              <ThemeSwitcher variant="toggle" />
              <ThemeSwitcher variant="compact" />
            </div>
          </div>

          {/* 按钮组件演示 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                按钮组件
              </CardTitle>
              <CardDescription>
                展示不同变体和状态的按钮组件在暗黑模式下的效果
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">
                    Primary
                  </h4>
                  <div className="space-y-2">
                    <Button variant="default" size="sm">
                      Default
                    </Button>
                    <Button variant="default" size="sm" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">
                    Secondary
                  </h4>
                  <div className="space-y-2">
                    <Button variant="secondary" size="sm">
                      Secondary
                    </Button>
                    <Button variant="secondary" size="sm" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">
                    Outline
                  </h4>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm">
                      Outline
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-text-secondary">
                    Ghost
                  </h4>
                  <div className="space-y-2">
                    <Button variant="ghost" size="sm">
                      Ghost
                    </Button>
                    <Button variant="ghost" size="sm" disabled>
                      Disabled
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="success"
                  leftIcon={<Check className="h-4 w-4" />}
                >
                  Success
                </Button>
                <Button
                  variant="warning"
                  leftIcon={<AlertTriangle className="h-4 w-4" />}
                >
                  Warning
                </Button>
                <Button
                  variant="destructive"
                  leftIcon={<XCircle className="h-4 w-4" />}
                >
                  Error
                </Button>
                <Button variant="link" rightIcon={<Info className="h-4 w-4" />}>
                  Link Button
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 卡片组件演示 */}
          <div className="grid gap-6 md:grid-cols-3">
            <Card variant="default">
              <CardHeader>
                <CardTitle>默认卡片</CardTitle>
                <CardDescription>这是一个默认样式的卡片组件</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  卡片内容使用语义化设计令牌，自动适配暗黑模式
                </p>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardHeader>
                <CardTitle>提升卡片</CardTitle>
                <CardDescription>带有阴影效果的卡片</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  阴影效果也会根据主题自动调整透明度和颜色
                </p>
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle>交互卡片</CardTitle>
                <CardDescription>支持hover效果的卡片</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-text-secondary">
                  鼠标悬停时会有背景色和阴影变化
                </p>
              </CardContent>
            </Card>
          </div>

          {/* 颜色系统演示 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                语义化颜色系统
              </CardTitle>
              <CardDescription>
                展示基于语义的颜色令牌在不同主题下的表现
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 文本颜色 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text-secondary">
                  文本颜色
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <div className="rounded border border-border-default p-3">
                    <div className="font-medium text-text-primary">Primary</div>
                    <div className="text-xs text-text-muted">主要文本</div>
                  </div>
                  <div className="rounded border border-border-default p-3">
                    <div className="font-medium text-text-secondary">
                      Secondary
                    </div>
                    <div className="text-xs text-text-muted">次要文本</div>
                  </div>
                  <div className="rounded border border-border-default p-3">
                    <div className="font-medium text-text-tertiary">
                      Tertiary
                    </div>
                    <div className="text-xs text-text-muted">第三级文本</div>
                  </div>
                  <div className="rounded border border-border-default p-3">
                    <div className="font-medium text-text-accent">Accent</div>
                    <div className="text-xs text-text-muted">强调色</div>
                  </div>
                  <div className="rounded border border-border-default p-3">
                    <div className="font-medium text-text-disabled">
                      Disabled
                    </div>
                    <div className="text-xs text-text-muted">禁用状态</div>
                  </div>
                </div>
              </div>

              {/* 状态颜色 */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-text-secondary">
                  状态颜色
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="bg-status-success/10 rounded border border-border-success p-3">
                    <div className="flex items-center gap-2 font-medium text-text-success">
                      <Check className="h-4 w-4" />
                      Success
                    </div>
                    <div className="text-text-success/70 text-xs">成功状态</div>
                  </div>
                  <div className="bg-status-warning/10 rounded border border-border-warning p-3">
                    <div className="flex items-center gap-2 font-medium text-text-warning">
                      <AlertTriangle className="h-4 w-4" />
                      Warning
                    </div>
                    <div className="text-text-warning/70 text-xs">警告状态</div>
                  </div>
                  <div className="bg-status-error/10 rounded border border-border-error p-3">
                    <div className="flex items-center gap-2 font-medium text-text-error">
                      <XCircle className="h-4 w-4" />
                      Error
                    </div>
                    <div className="text-text-error/70 text-xs">错误状态</div>
                  </div>
                  <div className="bg-text-accent/10 rounded border border-border-accent p-3">
                    <div className="flex items-center gap-2 font-medium text-text-accent">
                      <Info className="h-4 w-4" />
                      Info
                    </div>
                    <div className="text-text-accent/70 text-xs">信息状态</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 主题特性说明 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5" />
                <Moon className="h-5 w-5" />
                主题系统特性
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="font-medium text-text-primary">🎯 核心特性</h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li>✅ 100% 语义化设计令牌</li>
                    <li>✅ 组件级粒度控制</li>
                    <li>✅ 自动系统主题检测</li>
                    <li>✅ 无缝主题切换</li>
                    <li>✅ TypeScript 类型安全</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-text-primary">🛠 技术实现</h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li>🔧 基于 CSS 变量的动态主题</li>
                    <li>🔧 Tailwind CSS 令牌扩展</li>
                    <li>🔧 代码生成确保一致性</li>
                    <li>🔧 状态完整覆盖(hover/active/disabled)</li>
                    <li>🔧 第三方组件适配支持</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 页脚 */}
          <div className="border-t border-border-subtle py-8 text-center">
            <p className="text-sm text-text-muted">
              🎨 基于 Dify 项目经验的现代化暗黑模式设计系统 - 2025年最佳实践
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
