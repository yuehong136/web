import * as React from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'
import { useActivePortalTheme, usePortalContainer } from './portal-theme'

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

export interface DialogContentProps {
  className?: string
  children: React.ReactNode
  /** 覆盖 Portal 根节点主题，供 ScopedTheme 子树内弹窗使用 */
  theme?: string | null
  /** 弹窗尺寸 */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full'
  /** 是否显示关闭按钮 */
  showCloseButton?: boolean
  /** 点击遮罩层关闭 */
  closeOnOverlayClick?: boolean
  /** 使用原生模态焦点管理；旧调用保持原有行为。 */
  modal?: boolean
  /** 弹窗入口来自临时浮层时，指定关闭后的焦点目标。 */
  returnFocusRef?: React.RefObject<HTMLElement | null>
}

export interface DialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}
export interface DialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {}
export interface DialogTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

/** DreamJira overlay: a flat scrim, no blur. */
export const dialogOverlayClass =
  'animate-in fade-in-0 fixed inset-0 bg-scrim duration-200 motion-reduce:animate-none'

/** The 32px ghost close button shared by Dialog, Sheet and ConfirmDialog. */
export const dialogCloseClass =
  'absolute top-space-md right-space-md z-10 inline-flex size-[var(--control-height)] items-center justify-center rounded-radius-md text-fg-muted transition-colors duration-150 outline-hidden hover:bg-fill-hover hover:text-fg focus-visible:ring-2 focus-visible:ring-line-focus motion-reduce:transition-none'

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  '2xl': 'max-w-6xl',
  '3xl': 'max-w-7xl',
  full: 'max-w-[calc(100vw-2rem)]',
}

const DialogContext = React.createContext<
  | {
      open: boolean
      onOpenChange: (open: boolean) => void
    }
  | undefined
>(undefined)

type DialogLabels = {
  title: HTMLHeadingElement | null
  description: HTMLParagraphElement | null
}
const DialogAccessibilityContext = React.createContext<
  | {
      titleId: string
      descriptionId: string
      registerTitle: (node: HTMLHeadingElement | null) => void
      registerDescription: (node: HTMLParagraphElement | null) => void
    }
  | undefined
>(undefined)
const syncDialogLabels = (
  dialog: HTMLDialogElement | null,
  labels: DialogLabels,
) => {
  if (!dialog) return
  for (const [kind, attribute] of [
    ['title', 'aria-labelledby'],
    ['description', 'aria-describedby'],
  ] as const) {
    const id = labels[kind]?.id
    if (id) dialog.setAttribute(attribute, id)
    else dialog.removeAttribute(attribute)
  }
}

/** Open dialogs, outermost first; only the last one answers Escape. */
const openDialogStack: symbol[] = []

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  children,
}) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}

export const DialogTrigger: React.FC<DialogTriggerProps> = ({
  children,
  onClick,
  asChild = false,
  ...props
}) => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogTrigger must be used within Dialog')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(true)
    onClick?.(e)
  }

  const Comp = asChild ? Slot : 'button'

  return (
    <Comp {...props} onClick={handleClick}>
      {children}
    </Comp>
  )
}

export const DialogClose: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, onClick, ...props }) => {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogClose must be used within Dialog')
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    context.onOpenChange(false)
    onClick?.(e)
  }

  return (
    <button onClick={handleClick} {...props}>
      {children}
    </button>
  )
}

/**
 * Dialog 内容容器
 *
 * 现代化设计：
 * - 毛玻璃遮罩
 * - 圆角卡片
 * - 流畅动画
 * - 灵活的内容布局
 */
export const DialogContent: React.FC<DialogContentProps> = ({
  className,
  children,
  theme,
  size = 'lg',
  showCloseButton = true,
  closeOnOverlayClick = true,
  modal = false,
  returnFocusRef,
}) => {
  const { t } = useTranslation()
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error('DialogContent must be used within Dialog')
  }

  const { open, onOpenChange } = context
  const portalContainer = usePortalContainer()
  const scopedTheme = useActivePortalTheme(open, theme)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const labels = React.useRef<DialogLabels>({ title: null, description: null })
  const id = React.useId()
  const registerLabel = React.useCallback(
    (
      kind: keyof DialogLabels,
      node: HTMLHeadingElement | HTMLParagraphElement | null,
    ) => {
      labels.current[kind] = node
      syncDialogLabels(dialogRef.current, labels.current)
    },
    [],
  )
  const accessibility = React.useMemo(
    () => ({
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      registerTitle: (node: HTMLHeadingElement | null) =>
        registerLabel('title', node),
      registerDescription: (node: HTMLParagraphElement | null) =>
        registerLabel('description', node),
    }),
    [id, registerLabel],
  )

  // Child refs register before this layout effect, so the native modal is named
  // before it opens, including when a caller supplies a custom title id.
  React.useLayoutEffect(() => {
    syncDialogLabels(dialogRef.current, labels.current)
  })

  React.useLayoutEffect(() => {
    const element = dialogRef.current
    const returnFocus =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null)
    if (!open || !modal || !element) return
    element.showModal()
    // showModal owns initial focus and Tab isolation in browsers. Only fill a
    // missing initial target; do not replace an autofocus target chosen by it.
    if (!element.contains(document.activeElement)) {
      const candidates = [
        ...(contentRef.current?.querySelectorAll<HTMLElement>(
          'button, input, textarea, select, a[href], summary, [tabindex]',
        ) ?? []),
      ].filter(
        (node) =>
          node.tabIndex >= 0 &&
          !node.matches(':disabled, [type="hidden"]') &&
          !node.closest('[hidden], [inert], [aria-hidden="true"]'),
      )
      const target =
        candidates.find((node) => node.hasAttribute('autofocus')) ??
        candidates[0]
      ;(target ?? contentRef.current)?.focus()
    }
    return () => {
      element.close()
      if (returnFocus)
        requestAnimationFrame(() => {
          if (returnFocus.isConnected) returnFocus.focus()
        })
    }
  }, [open, modal, returnFocusRef])

  // Handle escape key: only the topmost open dialog closes. Every open dialog
  // listens on document and the outer one registered first, so without the
  // stack Escape in a nested dialog would close its parent instead.
  React.useEffect(() => {
    if (!open) return
    const token = Symbol('dialog')
    openDialogStack.push(token)
    const handleEscape = (event: KeyboardEvent) => {
      if (openDialogStack.at(-1) !== token) return
      // Nested Radix layers (menus, alert dialogs) mark Escape they consumed.
      if (event.key === 'Escape' && !event.defaultPrevented) {
        // Avoid a second native cancel after closing this controlled modal.
        if (modal) event.preventDefault()
        onOpenChange(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      openDialogStack.splice(openDialogStack.indexOf(token), 1)
      // The page scrolls again only once the last dialog has closed.
      if (!openDialogStack.length) document.body.style.overflow = 'unset'
    }
  }, [open, modal, onOpenChange])

  // Handle overlay click
  if (!open) return null
  const content = (
    <dialog
      ref={dialogRef}
      open={modal ? undefined : true}
      onCancel={(event) => {
        event.preventDefault()
        onOpenChange(false)
      }}
      data-theme={scopedTheme}
      className="fixed inset-0 z-50 m-0 flex h-screen max-h-none w-screen max-w-none items-center justify-center border-0 bg-transparent p-4"
      aria-modal="true"
    >
      {/* Overlay */}
      {closeOnOverlayClick ? (
        <button
          type="button"
          tabIndex={modal ? -1 : undefined}
          aria-label={t('common.closeDialog')}
          className={dialogOverlayClass}
          onClick={() => onOpenChange(false)}
        />
      ) : (
        <div className={dialogOverlayClass} />
      )}

      {/* Dialog Container */}
      <div
        ref={contentRef}
        tabIndex={modal ? -1 : undefined}
        className={cn(
          'relative z-10 w-full rounded-radius-xl border border-line shadow-elevation-high',
          // Native <dialog> defaults to black text; inherit the theme instead.
          'bg-overlay text-fg',
          'animate-in fade-in-0 zoom-in-95 duration-200 motion-reduce:animate-none',
          'flex max-h-[calc(100vh-2rem)] flex-col',
          sizeClasses[size],
          className,
        )}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className={dialogCloseClass}
          >
            <X className="size-icon-sm" aria-hidden="true" />
            <span className="sr-only">{t('common.close')}</span>
          </button>
        )}

        <DialogAccessibilityContext.Provider value={accessibility}>
          {children}
        </DialogAccessibilityContext.Provider>
      </div>
    </dialog>
  )

  return createPortal(content, portalContainer ?? document.body)
}

/**
 * Dialog 头部
 */
export const DialogHeader: React.FC<DialogHeaderProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn('shrink-0 px-space-lg pt-space-lg pb-space-md', className)}
    {...props}
  />
)

/**
 * Dialog 标题
 */
export const DialogTitle: React.FC<DialogTitleProps> = ({
  className,
  children,
  id,
  ...props
}) => {
  const accessibility = React.useContext(DialogAccessibilityContext)
  return (
    <h2
      ref={(node) => accessibility?.registerTitle(node)}
      id={id ?? accessibility?.titleId}
      className={cn(
        'pr-space-2xl text-lg leading-7 font-semibold text-fg',
        className,
      )}
      {...props}
    >
      {children}
    </h2>
  )
}

/**
 * Dialog 描述文本
 */
export const DialogDescription: React.FC<DialogDescriptionProps> = ({
  className,
  id,
  ...props
}) => {
  const accessibility = React.useContext(DialogAccessibilityContext)
  return (
    <p
      ref={(node) => accessibility?.registerDescription(node)}
      id={id ?? accessibility?.descriptionId}
      className={cn('mt-space-xs text-sm text-fg-muted', className)}
      {...props}
    />
  )
}

/**
 * Dialog 主体：头部与底栏之间的滚动区域，长内容滚动时底栏保持可见。
 */
export const DialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'min-h-0 flex-1 overflow-y-auto px-space-lg pb-space-lg',
      className,
    )}
    {...props}
  />
)

/**
 * Dialog 底部
 */
export const DialogFooter: React.FC<DialogFooterProps> = ({
  className,
  ...props
}) => (
  <div
    className={cn(
      'flex shrink-0 items-center justify-end gap-space-sm border-t border-line px-space-lg py-space-base',
      className,
    )}
    {...props}
  />
)
