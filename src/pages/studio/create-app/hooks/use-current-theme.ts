import { useResolvedAppearance, useThemeScope } from '@/themes'

/** Legacy editor mode delegates to the same appearance owner as the app. */
export const useCurrentTheme = () => {
  const appearance = useResolvedAppearance()
  const scope = useThemeScope()
  return (scope?.appearance ?? appearance).resolvedMode
}
