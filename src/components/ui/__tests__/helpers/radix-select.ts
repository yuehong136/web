import { act } from 'react'

type PointerCaptureElement = Element & {
  hasPointerCapture?: (pointerId: number) => boolean
  releasePointerCapture?: (pointerId: number) => void
}

/**
 * jsdom lacks the layout and pointer-capture APIs Radix Select calls once its
 * list opens. Install before rendering; the returned function restores jsdom.
 */
export function installRadixSelectDom() {
  const proto = Element.prototype as PointerCaptureElement
  const patches = {
    scrollIntoView: () => {},
    hasPointerCapture: () => false,
    releasePointerCapture: () => {},
  }
  const saved = Object.fromEntries(
    Object.keys(patches).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(proto, key),
    ]),
  )
  Object.assign(proto, patches)

  return () => {
    for (const [key, descriptor] of Object.entries(saved)) {
      if (descriptor) Object.defineProperty(proto, key, descriptor)
      else delete (proto as unknown as Record<string, unknown>)[key]
    }
  }
}

/** The option with this visible text in the open list, if any. */
export function findOption(text: string) {
  return Array.from(
    document.querySelectorAll<HTMLElement>('[role="option"]'),
  ).find((option) => option.textContent?.trim() === text)
}

/** Open the list from its trigger and pick an option the way a tap does. */
export async function chooseOption(trigger: HTMLElement, text: string) {
  await act(async () => trigger.click())
  const option = findOption(text)
  if (!option) throw new Error(`Missing option ${text}`)
  await act(async () => option.click())
}
