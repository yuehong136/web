import { expect, it } from 'vitest'
import { cn } from '@/lib/utils'

it('lets token utilities override component defaults', () => {
  expect(cn('rounded-radius-md', 'rounded-radius-full')).toBe(
    'rounded-radius-full',
  )
  expect(cn('p-space-sm', 'p-space-md')).toBe('p-space-md')
  expect(cn('px-space-sm gap-space-xs', 'px-space-lg')).toBe(
    'gap-space-xs px-space-lg',
  )
  expect(cn('size-icon-sm', 'size-icon-md')).toBe('size-icon-md')
  expect(cn('shadow-elevation-low', 'shadow-elevation-medium')).toBe(
    'shadow-elevation-medium',
  )
  // Colour tokens still sit beside font sizes.
  expect(cn('text-sm text-text-primary', 'text-text-secondary')).toBe(
    'text-sm text-text-secondary',
  )
})
