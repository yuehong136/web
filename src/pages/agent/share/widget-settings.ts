import { z } from 'zod'
import { normalizeLocale } from '@/locales/locale-registry'

export const widgetSettingsGlobalKey = 'sys.widget_settings'

export const widgetSettingsSchema = z.object({
  embedType: z.enum(['fullscreen', 'widget']).catch('fullscreen'),
  theme: z.enum(['light', 'dark']).catch('light'),
  visibleAvatar: z.boolean().catch(true),
  published: z.boolean().catch(false),
  locale: z.string().catch(''),
  userId: z.string().catch(''),
  enableStreaming: z.boolean().catch(false),
  muteWidget: z.boolean().catch(false),
  widgetTitle: z.string().catch(''),
  widgetSubtitle: z.string().catch(''),
  widgetFooterText: z.string().catch(''),
  widgetFooterLink: z.string().catch(''),
  widgetAccentColor: z.string().catch('#2563eb'),
  widgetBackgroundColor: z.string().catch('#ffffff'),
  widgetTextColor: z.string().catch('#111827'),
  widgetHeaderTextColor: z.string().catch('#ffffff'),
  widgetFooterTextColor: z.string().catch('#111827'),
})

export type WidgetSettings = z.infer<typeof widgetSettingsSchema>
export const defaultWidgetSettings = widgetSettingsSchema.parse({})

export const widgetColorParams = {
  widgetAccentColor: 'widget_accent_color',
  widgetBackgroundColor: 'widget_background_color',
  widgetTextColor: 'widget_text_color',
  widgetHeaderTextColor: 'widget_header_text_color',
  widgetFooterTextColor: 'widget_footer_text_color',
} as const

export const widgetTextParams = {
  widgetTitle: 'widget_title',
  widgetSubtitle: 'widget_subtitle',
  widgetFooterText: 'widget_footer',
  widgetFooterLink: 'widget_footer_link',
} as const

export function normalizeHexColor(value: string, fallback: string) {
  const color = value.trim()
  return /^#([a-f\d]{3}|[a-f\d]{6})$/i.test(color) ? color : fallback
}

export function normalizeWidgetFooterLink(value: string) {
  const trimmed = value.trim()
  if (
    !trimmed ||
    Array.from(trimmed).some(
      (character) =>
        character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    )
  )
    return ''
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/\//, '')}`
  try {
    const url = new URL(candidate)
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : ''
  } catch {
    return ''
  }
}

export function normalizeWidgetSettings(value: unknown): WidgetSettings {
  const settings = widgetSettingsSchema.parse(
    value && typeof value === 'object' && !Array.isArray(value) ? value : {},
  )
  for (const key of Object.keys(widgetColorParams) as Array<
    keyof typeof widgetColorParams
  >) {
    settings[key] = normalizeHexColor(settings[key], defaultWidgetSettings[key])
  }
  settings.locale = normalizeLocale(settings.locale) ?? ''
  settings.widgetFooterLink = normalizeWidgetFooterLink(
    settings.widgetFooterLink,
  )
  return settings
}

export function parseWidgetSettings(params: URLSearchParams) {
  return normalizeWidgetSettings({
    ...Object.fromEntries(
      Object.entries({ ...widgetTextParams, ...widgetColorParams }).map(
        ([key, param]) => [key, params.get(param) ?? undefined],
      ),
    ),
    muteWidget: params.get('muted') === 'true',
    enableStreaming: params.get('streaming') === 'true',
  })
}
