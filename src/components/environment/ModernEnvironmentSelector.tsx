// src/components/environment/ModernEnvironmentSelector.tsx
import {
  ChevronDown,
  Globe,
  Zap,
  Plus,
  Settings2,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { useFetchEnvironments } from '@/hooks/use-environment-request'
import { cn } from '@/lib/utils'

interface ModernEnvironmentSelectorProps {
  onEnvironmentChange?: (environmentId: string | null) => void
  onManageClick?: () => void
  className?: string
}

export function ModernEnvironmentSelector({
  onEnvironmentChange,
  onManageClick,
  className,
}: ModernEnvironmentSelectorProps) {
  const { selectedEnvironmentId, selectEnvironment } = useEnvironmentStore()
  const { environments, isLoading } = useFetchEnvironments()

  const selectedEnvironment = environments.find(
    (env) => env.id === selectedEnvironmentId,
  )

  const handleEnvironmentSelect = (environmentId: string) => {
    selectEnvironment(environmentId)
    onEnvironmentChange?.(environmentId)
  }

  const getEnvironmentColor = (name: string) => {
    const normalized = name.toLowerCase()
    const colorMap: Record<string, string> = {
      'dxl-193': 'bg-purple-500',
      '1': 'bg-green-500',
      '192-local': 'bg-teal-500',
      production: 'bg-emerald-500',
      prod: 'bg-emerald-500',
      staging: 'bg-amber-500',
      stage: 'bg-amber-500',
      development: 'bg-blue-500',
      dev: 'bg-blue-500',
      test: 'bg-purple-500',
      testing: 'bg-purple-500',
      local: 'bg-text-tertiary',
    }

    return colorMap[normalized] || 'bg-violet-500'
  }

  const getEnvironmentIcon = (name: string) => {
    const firstChar = name.charAt(0).toUpperCase()
    return firstChar || '?'
  }

  if (isLoading) {
    return (
      <Button
        variant="outline"
        className={cn('w-64 gap-2 text-muted-foreground', className)}
        disabled
      >
        <RefreshCw className="h-4 w-4 animate-spin" />
        加载中...
      </Button>
    )
  }

  if (environments.length === 0) {
    return (
      <Button
        variant="outline"
        className={cn(
          'min-w-[160px] max-w-[200px] gap-2 text-muted-foreground',
          className,
        )}
        onClick={onManageClick}
      >
        <Plus className="h-4 w-4" />
        请先创建环境
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'h-10 min-w-[160px] max-w-[200px] justify-between gap-3 px-4',
            'border-border bg-background',
            'hover:border-border/80 hover:bg-background/90 hover:shadow-sm',
            'transition-colors duration-150',
            className,
          )}
        >
          {selectedEnvironment ? (
            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* Environment Icon */}
              <div
                className={cn(
                  'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm',
                  getEnvironmentColor(selectedEnvironment.name),
                )}
              >
                {getEnvironmentIcon(selectedEnvironment.name)}
              </div>

              {/* Environment Name */}
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {selectedEnvironment.name}
                </span>
                {selectedEnvironment.is_default && (
                  <Zap className="h-3 w-3 flex-shrink-0 text-amber-500" />
                )}
                {selectedEnvironment.is_global && (
                  <Globe className="h-3 w-3 flex-shrink-0 text-blue-500" />
                )}
              </div>
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">
              {isLoading
                ? '加载中...'
                : environments.length > 0
                  ? '请选择环境'
                  : '暂无环境'}
            </span>
          )}

          <ChevronDown
            className={cn(
              'h-4 w-4 flex-shrink-0 text-muted-foreground transition-transform duration-200',
            )}
          />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="right"
        className="w-[240px] border border-border bg-background p-1 shadow-xl"
      >
        <div className="py-0.5">
          {environments.map((env, index) => {
            const isSelected = env.id === selectedEnvironmentId
            const bgColor = getEnvironmentColor(env.name)
            const icon = getEnvironmentIcon(env.name)

            return (
              <div key={env.id}>
                <DropdownMenuItem
                  onClick={() => handleEnvironmentSelect(env.id)}
                  className={cn(
                    'mx-1 cursor-pointer rounded-lg border-0 px-3 py-2.5',
                    'hover:bg-accent focus:bg-accent',
                    'transition-colors duration-150',
                    isSelected &&
                      'bg-primary/20 ring-1 ring-primary/30 hover:bg-primary/25 focus:bg-primary/25',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    {/* 第一行：选中指示器 + 图标 + 名称 + 状态标识 + 变量数量 */}
                    <div className="flex items-center gap-3">
                      {/* 选中指示器 - 最左侧 */}
                      <div className="flex w-2 flex-shrink-0 justify-start">
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>

                      {/* Environment Icon */}
                      <div
                        className={cn(
                          'flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm',
                          bgColor,
                        )}
                      >
                        {icon}
                      </div>

                      {/* 名称和状态标识 */}
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {env.name}
                        </span>

                        {/* Status Badges */}
                        {env.is_default && (
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-amber-400"
                            title="默认环境"
                          />
                        )}
                        {env.is_global && (
                          <div
                            className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"
                            title="全局环境"
                          />
                        )}
                      </div>

                      {/* 右侧：变量数量 */}
                      <span className="flex-shrink-0 text-xs text-muted-foreground">
                        {env.variables_count} 变量
                      </span>
                    </div>

                    {/* 第二行：仅描述 */}
                    {env.description && (
                      <div className="ml-11 truncate text-xs text-muted-foreground">
                        {env.description}
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>

                {/* 分隔线 */}
                {index < environments.length - 1 && (
                  <div className="mx-3 my-0.5 h-px bg-border" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mx-3 my-2 h-px bg-border" />

        <div className="px-1 pb-1">
          <DropdownMenuItem
            onClick={() => onManageClick?.()}
            className="mx-1 cursor-pointer rounded-lg border-0 px-3 py-2.5 transition-colors duration-150 hover:bg-primary/10"
          >
            <div className="flex items-center gap-3">
              {/* 占位符保持对齐 */}
              <div className="w-2 flex-shrink-0"></div>

              {/* 管理图标 */}
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Settings2 className="h-4 w-4 text-primary" />
              </div>

              {/* 管理环境文字 */}
              <span className="text-sm font-medium text-primary">管理环境</span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
