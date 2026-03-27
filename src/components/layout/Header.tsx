import React from 'react'
import { AppTopBar } from './app-top-bar'

interface HeaderProps {
  onToggleSidebar: () => void
  showSidebarToggle?: boolean
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, showSidebarToggle = true }) => {
  return (
    <AppTopBar
      onOpenSidebar={onToggleSidebar}
      showSidebarToggle={showSidebarToggle}
      mobileOnly={false}
    />
  )
}
