/**
 * Splits a stylesheet's top-level rules into the ones gated on the app's
 * motion setting (`:where(:not([data-motion='reduced'] *))`, so "Full motion"
 * can override a system that reduces it) and everything else, which is what
 * reduced motion still shows. Pass the CSS with comments removed.
 */
export function splitMotionRules(css: string) {
  const gate = /:where\(\s*:not\(\[data-motion='reduced'\] \*\)\s*\)/
  const rules: string[] = []
  let depth = 0
  let start = 0
  for (let index = 0; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1
    else if (css[index] === '}' && --depth === 0) {
      rules.push(css.slice(start, index + 1).trim())
      start = index + 1
    }
  }
  const gated = (rule: string) => gate.test(rule.slice(0, rule.indexOf('{')))
  if (css.includes('prefers-reduced-motion'))
    throw new Error(
      'Gate motion on [data-motion], not prefers-reduced-motion: the media query ignores the in-app setting.',
    )
  const motionRules = rules.filter(gated).join('\n')
  if (!motionRules) throw new Error('No motion rules gated on data-motion.')
  return {
    motionRules,
    otherRules: rules.filter((rule) => !gated(rule)).join('\n'),
  }
}
