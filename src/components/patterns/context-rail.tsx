import * as React from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronDown,
  PanelLeft,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { NavigationTooltip } from '@/components/ui/navigation-tooltip'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export interface ContextRailItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  matcher?: (pathname: string) => boolean
}

export interface ContextRailGroup {
  label?: string
  items: ContextRailItem[]
}

interface ContextRailProps extends React.HTMLAttributes<HTMLElement> {
  title: string
  groups: ContextRailGroup[]
  currentPath: string
  navAriaLabel: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  labels: { expand: string; collapse: string; open: string; close: string }
  footer?: React.ReactNode | ((collapsed: boolean) => React.ReactNode)
  backLink?: { href: string; label: string }
}

interface RailLinksProps {
  groups: ContextRailGroup[]
  currentPath: string
  collapsed: boolean
  touch?: boolean
  label: string
  onNavigate?: () => void
}

const RailLinks = ({
  groups,
  currentPath,
  collapsed,
  touch,
  label,
  onNavigate,
}: RailLinksProps) => (
  <nav
    aria-label={label}
    className="min-h-0 flex-1 overflow-y-auto px-space-sm py-space-sm"
  >
    {groups.map((group, index) => (
      <ul
        key={group.label ?? index}
        aria-label={group.label}
        className={cn(
          'flex flex-col gap-space-xs',
          index > 0 &&
            'mt-space-sm border-t border-components-settings-rail-border pt-space-sm',
        )}
      >
        {group.items.map((item) => {
          const Icon = item.icon
          const active = item.matcher
            ? item.matcher(currentPath)
            : currentPath === item.href
          return (
            <li key={item.href}>
              <NavigationTooltip content={item.title} enabled={collapsed}>
                <Link
                  to={item.href}
                  onClick={onNavigate}
                  aria-label={collapsed ? item.title : undefined}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex min-h-8 items-center gap-space-sm rounded-radius-md px-space-sm py-space-xs text-sm transition-colors focus-visible:ring-2 focus-visible:ring-state-focus focus-visible:outline-hidden focus-visible:ring-inset motion-reduce:transition-none',
                    touch && 'min-h-[44px]',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-components-sidebar-item-bg-active font-medium text-components-sidebar-item-text-active'
                      : 'text-components-sidebar-item-text hover:bg-components-sidebar-item-bg-hover hover:text-text-primary',
                  )}
                >
                  {Icon ? (
                    <Icon className="size-icon-sm shrink-0" />
                  ) : collapsed ? (
                    <span aria-hidden>{item.title.charAt(0)}</span>
                  ) : null}
                  <span className={collapsed ? 'sr-only' : 'truncate'}>
                    {item.title}
                  </span>
                </Link>
              </NavigationTooltip>
            </li>
          )
        })}
      </ul>
    ))}
  </nav>
)

/** Page navigation: a controlled desktop rail and an on-demand mobile drawer. */
export const ContextRail = ({
  title,
  groups,
  currentPath,
  navAriaLabel,
  collapsed,
  onCollapsedChange,
  labels,
  footer,
  backLink,
  className,
  ...props
}: ContextRailProps) => {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const desktopId = React.useId()

  React.useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)')
    const closeOnDesktop = () => {
      if (query.matches) setMobileOpen(false)
    }
    query.addEventListener('change', closeOnDesktop)
    return () => query.removeEventListener('change', closeOnDesktop)
  }, [])

  const renderFooter = (compact: boolean) =>
    footer ? (
      <div className="shrink-0 border-t border-components-settings-rail-border p-space-sm">
        {typeof footer === 'function' ? footer(compact) : footer}
      </div>
    ) : null

  return (
    <>
      <aside
        {...props}
        id={desktopId}
        data-collapsed={collapsed}
        className={cn(
          'hidden h-full min-h-0 shrink-0 flex-col border-r border-components-settings-rail-border bg-components-sidebar-bg md:flex',
          collapsed ? 'w-[56px]' : 'w-[208px]',
          className,
        )}
      >
        {backLink && (
          <div className="px-space-sm pt-space-sm">
            <NavigationTooltip content={backLink.label} enabled={collapsed}>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn(
                  'w-full justify-start px-space-sm text-text-secondary',
                  collapsed && 'justify-center px-0',
                )}
              >
                <Link to={backLink.href} aria-label={backLink.label}>
                  <ArrowLeft className="size-icon-sm" />
                  {!collapsed && (
                    <span className="truncate">{backLink.label}</span>
                  )}
                </Link>
              </Button>
            </NavigationTooltip>
          </div>
        )}
        <div
          className={cn(
            'flex h-12 shrink-0 items-center gap-space-xs px-space-sm',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <span
            className={
              collapsed
                ? 'sr-only'
                : 'min-w-0 truncate pl-space-sm text-sm font-medium text-components-settings-rail-title'
            }
          >
            {title}
          </span>
          <NavigationTooltip
            content={collapsed ? labels.expand : labels.collapse}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={collapsed ? labels.expand : labels.collapse}
              aria-expanded={!collapsed}
              aria-controls={desktopId}
              onClick={() => onCollapsedChange(!collapsed)}
            >
              {collapsed ? (
                <PanelLeftOpen className="size-icon-sm" />
              ) : (
                <PanelLeftClose className="size-icon-sm" />
              )}
            </Button>
          </NavigationTooltip>
        </div>
        <RailLinks
          groups={groups}
          currentPath={currentPath}
          collapsed={collapsed}
          label={navAriaLabel}
        />
        {renderFooter(collapsed)}
      </aside>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <div className="flex shrink-0 items-center border-b border-components-settings-rail-border bg-components-sidebar-bg px-space-sm py-space-xs md:hidden">
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              aria-label={labels.open}
              className="max-w-full justify-start"
            >
              <PanelLeft className="size-icon-sm" />
              <span className="truncate">{title}</span>
              <ChevronDown className="size-icon-sm" />
            </Button>
          </SheetTrigger>
        </div>
        <SheetContent
          side="left"
          showCloseButton={false}
          aria-describedby={undefined}
          className="flex w-[256px] flex-col gap-0 bg-components-sidebar-bg p-0 motion-reduce:animate-none sm:max-w-none"
        >
          <div className="flex h-12 shrink-0 items-center justify-between gap-space-sm border-b border-components-settings-rail-border px-space-base">
            <SheetTitle className="truncate text-sm font-medium text-components-settings-rail-title">
              {title}
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon-sm" aria-label={labels.close}>
                <X className="size-icon-sm" />
              </Button>
            </SheetClose>
          </div>
          {backLink && (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="m-space-sm justify-start text-text-secondary"
            >
              <Link to={backLink.href} onClick={() => setMobileOpen(false)}>
                <ArrowLeft className="size-icon-sm" />
                {backLink.label}
              </Link>
            </Button>
          )}
          <RailLinks
            groups={groups}
            currentPath={currentPath}
            collapsed={false}
            touch
            label={navAriaLabel}
            onNavigate={() => setMobileOpen(false)}
          />
          {renderFooter(false)}
        </SheetContent>
      </Sheet>
    </>
  )
}
