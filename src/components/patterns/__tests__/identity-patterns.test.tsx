import { afterEach, beforeEach, expect, it } from 'vitest'
import { EntityAvatar } from '../entity-avatar'
import { FileKindTile, fileExtension, fileKindOf } from '../file-kind-tile'
import { ProviderLogo } from '../provider-logo'
import { mount } from './collection-test-utils'

let view: ReturnType<typeof mount>
beforeEach(() => {
  view = mount()
})
afterEach(() => view.unmount())

it('maps file names and bare extensions to a file kind', () => {
  expect(fileKindOf('Report v2.PDF')).toBe('pdf')
  expect(fileKindOf('notes.docx')).toBe('doc')
  expect(fileKindOf('xlsx')).toBe('sheet')
  expect(fileKindOf('deck.key')).toBe('slide')
  expect(fileKindOf('page.html')).toBe('web')
  expect(fileKindOf('scan.webp')).toBe('image')
  expect(fileKindOf('call.m4a')).toBe('media')
  expect(fileKindOf('README.md')).toBe('text')
  expect(fileKindOf('archive.tar.zst')).toBe('text')
  expect(fileExtension('a.b.CSV')).toBe('csv')
})

it('labels a file tile with its extension and colors it by kind', async () => {
  await view.render(
    <>
      <FileKindTile name="评测记录.xlsx" />
      <FileKindTile name="dataset.parquet" />
    </>,
  )
  const [sheet, other] = view.container.querySelectorAll(
    '[data-slot="file-kind-tile"]',
  )
  expect(sheet.textContent).toBe('XLSX')
  expect(sheet.getAttribute('data-kind')).toBe('sheet')
  expect(sheet.className).toContain('bg-components-file-sheet-bg')
  expect(sheet.getAttribute('aria-hidden')).toBe('true')
  // Long or unknown extensions fall back to the kind name.
  expect(other.textContent).toBe('TEXT')
})

it('draws the kind glyph instead of a monogram and adds a kind badge', async () => {
  await view.render(
    <>
      <EntityAvatar name="产品知识库" kind="knowledge" tone="kind" size="lg" />
      <EntityAvatar name="小丽" seed="agent-1" badge="agent" size="lg" />
      <EntityAvatar name="Tiny" badge="agent" size="xs" />
    </>,
  )
  const avatars = view.container.querySelectorAll('[data-slot="entity-avatar"]')
  expect(avatars).toHaveLength(3)
  // Kind glyph, kind tone (teal = tone 5).
  expect(avatars[0].querySelector('svg')).not.toBeNull()
  expect(avatars[0].textContent).toBe('')
  expect(avatars[0].innerHTML).toContain('components-avatar-5-bg')
  // Monogram plus a badge outside the clipped avatar.
  expect(avatars[1].textContent).toBe('小')
  const anchors = view.container.querySelectorAll(
    '[data-slot="entity-avatar-badge-anchor"]',
  )
  expect(anchors).toHaveLength(1)
  expect(anchors[0].contains(avatars[1])).toBe(true)
  expect(anchors[0].lastElementChild?.className).toContain(
    'components-avatar-7-bg',
  )
  // Too small for a badge.
  expect(avatars[2].parentElement?.dataset.slot).not.toBe(
    'entity-avatar-badge-anchor',
  )
})

it('seats a provider logo on a tile unless asked not to', async () => {
  await view.render(
    <>
      <ProviderLogo provider="DeepSeek" size="sm" />
      <ProviderLogo provider="DeepSeek" tile={false} />
    </>,
  )
  const [tiled, bare] = view.container.querySelectorAll(
    '[data-slot="provider-logo"]',
  )
  expect(tiled.className).toContain('bg-background-subtle')
  expect(bare.className).not.toContain('bg-background-subtle')
  expect(tiled.firstElementChild).not.toBeNull()
})
