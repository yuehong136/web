import { extendTailwindMerge } from 'tailwind-merge'

/**
 * tailwind-merge only knows Tailwind's default scales, so token utilities
 * such as `rounded-radius-full`, `p-space-md`, `size-icon-sm` or
 * `shadow-elevation-low` were not recognised and a caller's override lost to
 * the component default (e.g. a round send button kept `rounded-radius-md`).
 * Teach it the theme scales from `src/themes/tailwind.css`.
 */
export const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: [
        'radius-sm',
        'radius-md',
        'radius-lg',
        'radius-xl',
        'radius-full',
      ],
      spacing: [
        'space-2xs',
        'space-xs',
        'space-sm',
        'space-base',
        'space-md',
        'space-lg',
        'space-xl',
        'space-2xl',
        'icon-xs',
        'icon-sm',
        'icon-md',
        'icon-lg',
        'icon-xl',
        'icon-2xl',
      ],
      shadow: ['elevation-low', 'elevation-medium', 'elevation-high'],
    },
  },
})
