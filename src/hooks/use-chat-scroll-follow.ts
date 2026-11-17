import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Distance from the end of the content, in px, that still counts as "at the latest". */
const LATEST_THRESHOLD_PX = 48
/** Room left above an anchored question. */
const ANCHOR_OFFSET_PX = 16
/** Content after a question taller than this means it already has an answer. */
const ANSWERED_PX = 48
/** Longest a smooth scroll of ours is waited for when `scrollend` never comes. */
const SMOOTH_SCROLL_MAX_MS = 1000

/** Marks each question in a thread; the last match is the newest one. */
export const CHAT_ANCHOR_SELECTOR = '[data-turn-id]'
/**
 * Space kept below the newest turn so its question can sit at the top while
 * the answer is still short. Set on the scroll container; render it with
 * `height: var(--chat-anchor-space, 0px)` after the content.
 */
export const CHAT_ANCHOR_SPACE_VAR = '--chat-anchor-space'

/**
 * - `anchor`: the newest question sits near the top and the answer grows
 *   below it; streaming never moves the view.
 * - `follow`: stays at the latest content (history just loaded, or the reader
 *   jumped back to the latest).
 * - `read`: the reader scrolled up from `follow`; nothing moves until they
 *   come back to the latest or press the jump button.
 */
type ScrollMode = 'anchor' | 'follow' | 'read'

export interface ChatScrollFollowOptions {
  /**
   * Changes when the newest question changes. While a reply is pending (or
   * the question has no answer yet) it is anchored to the top; otherwise —
   * e.g. a conversation loaded from history — the view jumps to the latest.
   */
  anchorKey?: string | number | null
  /** A reply is being prepared or streamed. */
  pending?: boolean
  anchorSelector?: string
}

export interface ChatScrollFollow {
  /** Callback refs: the scroll container and the element holding the messages. */
  containerRef: (element: HTMLElement | null) => void
  contentRef: (element: HTMLElement | null) => void
  container: HTMLElement | null
  /** The end of the content is in view (the jump button is hidden). */
  isFollowing: boolean
  /** Content arrived below the view since the reader left the latest. */
  hasNewContent: boolean
  scrollToLatest: (behavior?: ScrollBehavior) => void
}

const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Single scroll owner for a chat log, in the way current chat products work:
 * a new question is anchored near the top and its answer streams in below
 * without dragging the view; loaded history opens at the latest message; a
 * reader who scrolls up is never disturbed; a button returns to the latest,
 * after which the view follows. Size changes are observed (streamed text,
 * images, tables, a resized viewport) instead of re-scrolling on render, and
 * nothing moves while the reader is selecting text.
 */
export function useChatScrollFollow({
  anchorKey,
  pending = false,
  anchorSelector = CHAT_ANCHOR_SELECTOR,
}: ChatScrollFollowOptions = {}): ChatScrollFollow {
  const [container, setContainer] = useState<HTMLElement | null>(null)
  const [content, setContent] = useState<HTMLElement | null>(null)
  const containerElement = useRef<HTMLElement | null>(null)
  const contentElement = useRef<HTMLElement | null>(null)
  const mode = useRef<ScrollMode>('follow')
  const anchor = useRef<HTMLElement | null>(null)
  const space = useRef(0)
  const lastScrollTop = useRef(0)
  const contentEnd = useRef(0)
  const pointerDown = useRef(false)
  /** When our own smooth scroll started; its in-between positions are not the reader's. */
  const smoothSince = useRef<number | null>(null)
  const pendingRef = useRef(pending)
  const attachedKey = useRef<{
    key: ChatScrollFollowOptions['anchorKey']
  } | null>(null)
  const [isFollowing, setIsFollowing] = useState(true)
  const [hasNewContent, setHasNewContent] = useState(false)

  const containerRef = useCallback((element: HTMLElement | null) => {
    containerElement.current = element
    setContainer(element)
  }, [])
  const contentRef = useCallback((element: HTMLElement | null) => {
    contentElement.current = element
    setContent(element)
  }, [])

  const setSpace = useCallback((value: number) => {
    const next = Math.max(0, Math.ceil(value))
    if (next === space.current) return
    space.current = next
    containerElement.current?.style.setProperty(
      CHAT_ANCHOR_SPACE_VAR,
      `${next}px`,
    )
  }, [])

  /**
   * Bottom of the real content in scroll coordinates, anchor space excluded.
   * Measured on the content element: `scrollHeight` never drops below the
   * viewport, so it can't tell how short a short thread is.
   */
  const endOf = useCallback((element: HTMLElement) => {
    const body = contentElement.current
    if (!body?.isConnected) return element.scrollHeight - space.current
    const padding =
      Number.parseFloat(getComputedStyle(element).paddingBottom) || 0
    return (
      body.getBoundingClientRect().bottom -
      element.getBoundingClientRect().top +
      element.scrollTop +
      padding
    )
  }, [])
  const latestTop = useCallback(
    (element: HTMLElement) =>
      Math.max(0, endOf(element) - element.clientHeight),
    [endOf],
  )

  const syncLatest = useCallback(
    (element: HTMLElement) => {
      const gap = endOf(element) - (element.scrollTop + element.clientHeight)
      const atLatest = gap <= LATEST_THRESHOLD_PX
      setIsFollowing(atLatest)
      if (atLatest) setHasNewContent(false)
      return atLatest
    },
    [endOf],
  )

  const scrollTo = useCallback(
    (element: HTMLElement, top: number, behavior: ScrollBehavior) => {
      const resolved = prefersReducedMotion() ? 'auto' : behavior
      smoothSince.current = resolved === 'smooth' ? performance.now() : null
      if (typeof element.scrollTo === 'function')
        element.scrollTo({ top, behavior: resolved })
      else element.scrollTop = top
      if (resolved === 'auto') lastScrollTop.current = element.scrollTop
    },
    [],
  )

  /** Keeps enough space below the anchored question; returns its target. */
  const layoutAnchor = useCallback(
    (element: HTMLElement) => {
      const question = anchor.current
      if (!question?.isConnected) return null
      const target = Math.max(
        0,
        question.getBoundingClientRect().top -
          element.getBoundingClientRect().top +
          element.scrollTop -
          ANCHOR_OFFSET_PX,
      )
      setSpace(target + element.clientHeight - endOf(element))
      return target
    },
    [endOf, setSpace],
  )

  const scrollToLatest = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      const element = containerElement.current
      mode.current = 'follow'
      anchor.current = null
      setHasNewContent(false)
      setIsFollowing(true)
      if (element) scrollTo(element, latestTop(element), behavior)
    },
    [latestTop, scrollTo],
  )

  /**
   * Places the newest question: anchored near the top while its reply is
   * pending (or it has none yet), otherwise the view opens at the latest.
   */
  const settle = useCallback(
    (element: HTMLElement, behavior: ScrollBehavior) => {
      const questions = element.querySelectorAll<HTMLElement>(anchorSelector)
      const question = questions[questions.length - 1]
      const answered =
        !question ||
        endOf(element) -
          (question.getBoundingClientRect().bottom -
            element.getBoundingClientRect().top +
            element.scrollTop) >
          ANSWERED_PX
      if (question && (pendingRef.current || !answered)) {
        mode.current = 'anchor'
        anchor.current = question
        // The view is heading to the new question, which is the latest.
        setHasNewContent(false)
        setIsFollowing(true)
        const target = layoutAnchor(element)
        if (target !== null) scrollTo(element, target, behavior)
        return
      }
      setSpace(0)
      scrollToLatest()
    },
    [anchorSelector, endOf, layoutAnchor, scrollTo, scrollToLatest, setSpace],
  )

  const isSelecting = useCallback(() => {
    if (pointerDown.current) return true
    const selection = document.getSelection()
    return Boolean(
      selection &&
      !selection.isCollapsed &&
      containerElement.current?.contains(selection.anchorNode),
    )
  }, [])

  useLayoutEffect(() => {
    pendingRef.current = pending
  }, [pending])

  // Observers and listeners. The first attach settles before paint: a
  // conversation opens at the latest message, a just-sent first question is
  // anchored.
  useLayoutEffect(() => {
    if (!container) return
    if (!attachedKey.current) {
      attachedKey.current = { key: anchorKey }
      settle(container, 'auto')
    }
    const smoothScrolling = () =>
      smoothSince.current !== null &&
      performance.now() - smoothSince.current < SMOOTH_SCROLL_MAX_MS
    const onResize = () => {
      const end = endOf(container)
      const grew = end > contentEnd.current + 1
      contentEnd.current = end
      if (mode.current === 'anchor') layoutAnchor(container)
      else if (mode.current === 'follow' && !isSelecting())
        scrollTo(container, latestTop(container), 'auto')
      if (smoothScrolling()) return
      const atLatest = syncLatest(container)
      if (!atLatest && grew && mode.current !== 'follow') setHasNewContent(true)
    }
    const onScroll = () => {
      const top = container.scrollTop
      // Mid-way through our own smooth scroll: wait for where it lands, so
      // the jump button doesn't flicker on the way.
      if (smoothScrolling()) {
        lastScrollTop.current = top
        return
      }
      const movedUp = top < lastScrollTop.current
      lastScrollTop.current = top
      const atLatest = syncLatest(container)
      // Scrolling up, or the browser clamping after content shrank (e.g. a
      // collapsing reasoning panel), stops following; coming back resumes it.
      if (mode.current === 'follow' && movedUp && !atLatest)
        mode.current = 'read'
      else if (mode.current === 'read' && atLatest && !movedUp)
        mode.current = 'follow'
    }
    const onScrollEnd = () => {
      if (smoothSince.current === null) return
      smoothSince.current = null
      lastScrollTop.current = container.scrollTop
      syncLatest(container)
    }
    // The reader taking over ends our smooth scroll.
    const onTakeOver = () => {
      smoothSince.current = null
    }
    const onPointerDown = () => {
      pointerDown.current = true
      onTakeOver()
    }
    const onPointerUp = () => {
      pointerDown.current = false
    }
    container.addEventListener('scroll', onScroll, { passive: true })
    container.addEventListener('scrollend', onScrollEnd)
    container.addEventListener('wheel', onTakeOver, { passive: true })
    container.addEventListener('touchstart', onTakeOver, { passive: true })
    container.addEventListener('keydown', onTakeOver)
    container.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    let observer: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(onResize)
      observer.observe(container)
      if (content) observer.observe(content)
    }
    return () => {
      container.removeEventListener('scroll', onScroll)
      container.removeEventListener('scrollend', onScrollEnd)
      container.removeEventListener('wheel', onTakeOver)
      container.removeEventListener('touchstart', onTakeOver)
      container.removeEventListener('keydown', onTakeOver)
      container.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
      observer?.disconnect()
    }
    // anchorKey is read once, on the first attach.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    container,
    content,
    endOf,
    isSelecting,
    latestTop,
    layoutAnchor,
    scrollTo,
    settle,
    syncLatest,
  ])

  // A new question: anchor it while its reply is pending, else jump to latest.
  useLayoutEffect(() => {
    const element = containerElement.current
    if (!element || !attachedKey.current) return
    if (attachedKey.current.key === anchorKey) return
    attachedKey.current = { key: anchorKey }
    settle(element, 'smooth')
  }, [anchorKey, settle])

  return {
    containerRef,
    contentRef,
    container,
    isFollowing,
    hasNewContent,
    scrollToLatest,
  }
}
