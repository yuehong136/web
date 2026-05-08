// src/components/environment/ModernEnvironmentSelector.tsx
import { useEffect } from 'react'
import { ChevronDown, Globe, Zap, Plus, Settings2, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useEnvironmentStore } from '@/stores/environmentStore'
import { cn } from '@/lib/utils'

interface ModernEnvironmentSelectorProps {
  onEnvironmentChange?: (environmentId: string | null) => void
  onManageClick?: () => void
  className?: string
}

export function ModernEnvironmentSelector({ 
  onEnvironmentChange, 
  onManageClick,
  className 
}: ModernEnvironmentSelectorProps) {
  const {
    environments,
    selectedEnvironmentId,
    selectEnvironment,
    loadEnvironments,
    isLoading
  } = useEnvironmentStore()


  useEffect(() => {
    loadEnvironments()
  }, [loadEnvironments])

  const selectedEnvironment = environments.find(env => env.id === selectedEnvironmentId)

  const handleEnvironmentSelect = async (environmentId: string) => {
    await selectEnvironment(environmentId)
    onEnvironmentChange?.(environmentId)
  }

  const getEnvironmentColor = (name: string) => {
    const normalized = name.toLowerCase()
    const colorMap: Record<string, string> = {
      'dxl-193': 'bg-purple-500',
      '1': 'bg-green-500',
      '192-local': 'bg-teal-500',
      'production': 'bg-emerald-500',
      'prod': 'bg-emerald-500',
      'staging': 'bg-amber-500',
      'stage': 'bg-amber-500',
      'development': 'bg-blue-500',
      'dev': 'bg-blue-500',
      'test': 'bg-purple-500',
      'testing': 'bg-purple-500',
      'local': 'bg-text-tertiary'
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
        className={cn("w-64 gap-2 text-muted-foreground", className)}
        disabled
      >
        <RefreshCw className="w-4 h-4 animate-spin" />
        加载中...
      </Button>
    )
  }

  if (environments.length === 0) {
    return (
      <Button 
        variant="outline" 
        className={cn("min-w-[160px] max-w-[200px] gap-2 text-muted-foreground", className)}
        onClick={onManageClick}
      >
        <Plus className="w-4 h-4" />
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
            "gap-3 justify-between min-w-[160px] max-w-[200px] h-10 px-4",
            "bg-background border-border",
            "hover:bg-background/90 hover:border-border/80 hover:shadow-sm",
            "transition-colors duration-150",
            className
          )}
        >
          {selectedEnvironment ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {/* Environment Icon */}
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0",
                getEnvironmentColor(selectedEnvironment.name)
              )}>
                {getEnvironmentIcon(selectedEnvironment.name)}
              </div>
              
              {/* Environment Name */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium text-sm truncate text-foreground">
                  {selectedEnvironment.name}
                </span>
                {selectedEnvironment.is_default && (
                  <Zap className="w-3 h-3 text-amber-500 flex-shrink-0" />
                )}
                {selectedEnvironment.is_global && (
                  <Globe className="w-3 h-3 text-blue-500 flex-shrink-0" />
                )}
              </div>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">
              {isLoading ? "加载中..." : environments.length > 0 ? "请选择环境" : "暂无环境"}
            </span>
          )}
          
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-200 flex-shrink-0"
          )} />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="right" 
        className="w-[240px] p-1 shadow-xl border border-border bg-background"
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
                    "px-3 py-2.5 mx-1 rounded-lg cursor-pointer border-0",
                    "hover:bg-accent focus:bg-accent",
                    "transition-colors duration-150",
                    isSelected && "bg-primary/20 hover:bg-primary/25 focus:bg-primary/25 ring-1 ring-primary/30"
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    {/* 第一行：选中指示器 + 图标 + 名称 + 状态标识 + 变量数量 */}
                    <div className="flex items-center gap-3">
                      {/* 选中指示器 - 最左侧 */}
                      <div className="w-2 flex justify-start flex-shrink-0">
                        {isSelected && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      
                      {/* Environment Icon */}
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0",
                        bgColor
                      )}>
                        {icon}
                      </div>
                      
                      {/* 名称和状态标识 */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-sm text-foreground truncate">
                          {env.name}
                        </span>
                        
                        {/* Status Badges */}
                        {env.is_default && (
                          <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0" title="默认环境" />
                        )}
                        {env.is_global && (
                          <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" title="全局环境" />
                        )}
                      </div>
                      
                      {/* 右侧：变量数量 */}
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {env.variables_count} 变量
                      </span>
                    </div>
                    
                    {/* 第二行：仅描述 */}
                    {env.description && (
                      <div className="text-xs text-muted-foreground truncate ml-11">
                        {env.description}
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
                
                {/* 分隔线 */}
                {index < environments.length - 1 && (
                  <div className="h-px bg-border mx-3 my-0.5" />
                )}
              </div>
            )
          })}
        </div>
        
        
        <div className="h-px bg-border mx-3 my-2" />
        
        <div className="px-1 pb-1">
          <DropdownMenuItem
            onClick={() => onManageClick?.()}
            className="px-3 py-2.5 mx-1 rounded-lg cursor-pointer border-0 hover:bg-primary/10 transition-colors duration-150"
          >
            <div className="flex items-center gap-3">
              {/* 占位符保持对齐 */}
              <div className="w-2 flex-shrink-0"></div>
              
              {/* 管理图标 */}
              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Settings2 className="w-4 h-4 text-primary" />
              </div>
              
              {/* 管理环境文字 */}
              <span className="font-medium text-sm text-primary">
                管理环境
              </span>
            </div>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}