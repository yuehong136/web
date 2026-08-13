import React from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ROUTES } from '@/constants'
import { PlatformKind, useApplicationComposition } from '@/platform'
import { useHomeStore } from '@/stores/home'
import { useUIStore } from '@/stores/ui'
import { CommandPalette } from './command-palette'
import { getKeyboardCommand, isEditableKeyboardTarget } from './keyboard'
import { getDesktopActivityForPath } from './navigation'
import { CommandRegistry } from './registry'
import {
  CommandCategory,
  CommandScope,
  isProductCommandId,
  ProductCommandId,
  type ProductCommand,
} from './types'

interface CommandContextValue {
  commands: ProductCommand[]
  execute: (id: ProductCommandId) => Promise<boolean>
}

const CommandContext = React.createContext<CommandContextValue | undefined>(
  undefined,
)

export const ApplicationCommandProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { commandSource, platform } = useApplicationComposition()
  const useRendererShortcuts =
    platform.kind === PlatformKind.WEB || !platform.capabilities().nativeMenu
  const registry = React.useRef(new CommandRegistry()).current
  const [paletteOpen, setPaletteOpen] = React.useState(false)
  const paletteOpenRef = React.useRef(false)
  const [revision, setRevision] = React.useState(0)
  const previousFocus = React.useRef<HTMLElement | null>(null)

  const setCommandPaletteOpen = React.useCallback((open: boolean) => {
    if (open) {
      if (paletteOpenRef.current) return
      paletteOpenRef.current = true
      previousFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      setPaletteOpen(true)
      return
    }

    if (!paletteOpenRef.current) return
    paletteOpenRef.current = false
    setPaletteOpen(false)
    window.requestAnimationFrame(() => {
      previousFocus.current?.focus()
      previousFocus.current = null
    })
  }, [])

  React.useEffect(() => {
    if (platform.kind !== PlatformKind.DESKTOP) return
    const activity = getDesktopActivityForPath(location.pathname)
    if (activity) useUIStore.getState().setDesktopActivity(activity)
  }, [location.pathname, platform.kind])

  React.useEffect(() => {
    const commands: ProductCommand[] = [
      {
        id: ProductCommandId.OPEN_PALETTE,
        titleKey: 'desktop.commands.openPalette',
        fallbackTitle: 'Open command palette',
        category: CommandCategory.APPLICATION,
        scope: CommandScope.GLOBAL,
        shortcut: '⌘/Ctrl K',
        run: () => setCommandPaletteOpen(true),
      },
      {
        id: ProductCommandId.NEW_CONVERSATION,
        titleKey: 'desktop.commands.newConversation',
        fallbackTitle: 'New conversation',
        category: CommandCategory.CONVERSATION,
        scope: CommandScope.GLOBAL,
        shortcut: '⌘/Ctrl N',
        run: () => {
          useHomeStore.getState().startNewConversation()
          navigate(ROUTES.HOME)
        },
      },
      {
        id: ProductCommandId.TOGGLE_SIDEBAR,
        titleKey: 'desktop.commands.toggleSidebar',
        fallbackTitle: 'Toggle context panel',
        category: CommandCategory.VIEW,
        scope: CommandScope.GLOBAL,
        shortcut: '⌘/Ctrl B',
        run: () => {
          const state = useUIStore.getState()
          if (platform.kind === PlatformKind.DESKTOP) {
            state.toggleDesktopSidebar()
          } else {
            state.toggleSidebar()
          }
        },
      },
      {
        id: ProductCommandId.NAVIGATE_HOME,
        titleKey: 'desktop.commands.goHome',
        fallbackTitle: 'Go home',
        category: CommandCategory.NAVIGATION,
        scope: CommandScope.GLOBAL,
        run: () => navigate(ROUTES.HOME),
      },
      {
        id: ProductCommandId.NAVIGATE_SEARCH,
        titleKey: 'desktop.commands.goSearch',
        fallbackTitle: 'Go to search',
        category: CommandCategory.NAVIGATION,
        scope: CommandScope.GLOBAL,
        run: () => navigate(ROUTES.SEARCH),
      },
      {
        id: ProductCommandId.NAVIGATE_SETTINGS,
        titleKey: 'desktop.commands.goSettings',
        fallbackTitle: 'Open settings',
        category: CommandCategory.NAVIGATION,
        scope: CommandScope.GLOBAL,
        shortcut: '⌘/Ctrl ,',
        run: () => navigate(ROUTES.SETTINGS),
      },
      {
        id: ProductCommandId.NAVIGATE_BACK,
        titleKey: 'desktop.commands.back',
        fallbackTitle: 'Go back',
        category: CommandCategory.NAVIGATION,
        scope: CommandScope.GLOBAL,
        run: () => navigate(-1),
      },
      {
        id: ProductCommandId.NAVIGATE_FORWARD,
        titleKey: 'desktop.commands.forward',
        fallbackTitle: 'Go forward',
        category: CommandCategory.NAVIGATION,
        scope: CommandScope.GLOBAL,
        run: () => navigate(1),
      },
    ]

    const disposers = commands.map((command) => registry.register(command))
    setRevision((value) => value + 1)
    return () => disposers.reverse().forEach((dispose) => dispose())
  }, [navigate, platform.kind, registry, setCommandPaletteOpen])

  const execute = React.useCallback(
    async (id: ProductCommandId) => {
      const executed = await registry.execute(id, {
        closePalette: () => setCommandPaletteOpen(false),
      })
      if (id !== ProductCommandId.OPEN_PALETTE && executed) {
        setCommandPaletteOpen(false)
      }
      return executed
    },
    [registry, setCommandPaletteOpen],
  )

  React.useEffect(
    () =>
      commandSource.subscribe((id) => {
        if (isProductCommandId(id)) void execute(id)
      }),
    [commandSource, execute],
  )

  React.useEffect(() => {
    if (!useRendererShortcuts) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing || event.keyCode === 229) return
      if (isEditableKeyboardTarget(event.target)) return

      const id = getKeyboardCommand(event)
      if (!id) return

      event.preventDefault()
      void execute(id)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [execute, useRendererShortcuts])

  const commands = React.useMemo(() => {
    void revision
    return registry.list()
  }, [registry, revision])
  const value = React.useMemo(
    () => ({ commands, execute }),
    [commands, execute],
  )

  return (
    <CommandContext.Provider value={value}>
      {children}
      <CommandPalette
        commands={commands}
        open={paletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onExecute={(command) => void execute(command.id)}
      />
    </CommandContext.Provider>
  )
}

export const useApplicationCommands = () => {
  const context = React.useContext(CommandContext)
  if (!context) {
    throw new Error(
      'useApplicationCommands must be used within ApplicationCommandProvider',
    )
  }
  return context
}
