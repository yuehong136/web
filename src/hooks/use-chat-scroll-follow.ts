import { useCallback, useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** Distance from the bottom, in px, that still counts as following the latest content. */
const FOLLOW_THRESHOLD_PX = 48

export interface ChatScrollFollow {
  containerRef: RefObject<HTMLDivElement | null>
  contentRef: RefObject<HTMLDivElement | null>
  isFollowing: boolean
  hasNewContent: boolean
  handleScroll: () => void
  scrollToLatest: (behavior?: ScrollBehavior) => void
}

/**
 * Single scroll owner for a chat log. It follows new content until the reader
 * scrolls up, then keeps the reading position and only reports that content
 * arrived below. Size changes (streamed text, images, tables, a resized
 * viewport) are observed instead of re-scrolling on every render.
 */
export function useChatScrollFollow(): ChatScrollFollow {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const followingRef = useRef(true)
  const lastScrollTopRef = useRef(0)
  const contentHeightRef = useRef(0)
  const [isFollowing, setIsFollowing] = useState(true)
  const [hasNewContent, setHasNewContent] = useState(false)

  const setFollowing = useCallback((following: boolean) => {
    followingRef.current = following
    setIsFollowing(following)
    if (following) setHasNewContent(false)
  }, [])

  const scrollToLatest = useCallback(
    (behavior: ScrollBehavior = 'auto') => {
      setFollowing(true)
      const container = containerRef.current
      container?.scrollTo({ top: container.scrollHeight, behavior })
    },
    [setFollowing],
  )

  const handleScroll = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const { scrollTop, scrollHeight, clientHeight } = container
    const nearBottom =
      scrollHeight - scrollTop - clientHeight <= FOLLOW_THRESHOLD_PX
    const movedUp = scrollTop < lastScrollTopRef.current
    lastScrollTopRef.current = scrollTop
    if (movedUp) {
      // Scrolling up, or the browser clamping after content shrank (e.g. a
      // collapsing reasoning panel), never resumes following.
      if (followingRef.current && !nearBottom) setFollowing(false)
    } else if (nearBottom && !followingRef.current) {
      setFollowing(true)
    }
  }, [setFollowing])

  useEffect(() => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content || typeof ResizeObserver === 'undefined') {
      return
    }

    const observer = new ResizeObserver(() => {
      const height = content.scrollHeight
      const grew = height > contentHeightRef.current
      contentHeightRef.current = height
      if (followingRef.current) {
        container.scrollTop = container.scrollHeight
        lastScrollTopRef.current = container.scrollTop
      } else if (grew) {
        setHasNewContent(true)
      }
    })
    observer.observe(content)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  return {
    containerRef,
    contentRef,
    isFollowing,
    hasNewContent,
    handleScroll,
    scrollToLatest,
  }
}
