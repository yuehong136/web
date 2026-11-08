import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it, vi } from 'vitest'
import { changeLanguage } from '@/locales/i18n'
import { ChannelRow } from '../components/channel-row'
import type { ChatChannel } from '@/api/channel'

it('uses one native action button and respects its busy state', async () => {
  await changeLanguage('en-US')
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  const container = document.createElement('ul')
  document.body.append(container)
  const root = createRoot(container)
  const channel: ChatChannel = {
    id: 'channel',
    name: 'Draft bot',
    channel: 'unknown-provider',
    config: {},
    status: '0',
    generation: 1,
    secret: { configured: true, version: 1 },
    binding: null,
  }
  const callbacks = { onEdit: vi.fn(), onToggle: vi.fn(), onDelete: vi.fn() }
  try {
    await act(async () =>
      root.render(<ChannelRow channel={channel} busy={false} {...callbacks} />),
    )
    expect(container.querySelectorAll('button')).toHaveLength(1)
    expect(container.querySelector('button button')).toBeNull()
    const trigger = container.querySelector('button')!
    trigger.focus()
    expect(document.activeElement).toBe(trigger)
    await act(async () => trigger.click())
    const edit = Array.from(document.querySelectorAll('button')).find(
      (button) => button.textContent?.trim() === 'Edit',
    )!
    expect(edit).toBeTruthy()
    await act(async () => edit.click())
    expect(callbacks.onEdit).toHaveBeenCalledWith(channel)
    await act(async () =>
      root.render(<ChannelRow channel={channel} busy {...callbacks} />),
    )
    expect(container.querySelector('button')?.disabled).toBe(true)
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
