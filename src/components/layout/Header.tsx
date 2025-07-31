import React from 'react'
import { 
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeSwitcher } from '@/components/ui/theme-switcher'

interface HeaderProps {
  onToggleSidebar: () => void
  showSidebarToggle?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, showSidebarToggle = true }) => {
  return (
    <header className="bg-components-nav-bg border-b border-components-nav-border h-16 flex items-center justify-between px-4 lg:px-6">
      {/* 左侧 */}
      <div className="flex items-center gap-4">
        {/* 移动端侧边栏切换按钮 */}
        {showSidebarToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}

      </div>

      {/* 右侧 - 主题切换器 */}
      <div className="flex items-center gap-2">
        <ThemeSwitcher variant="compact" />
      </div>
    </header>
  )
}