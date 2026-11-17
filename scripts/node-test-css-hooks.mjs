/**
 * Module hooks for the source node:test lane: components import their own
 * stylesheets (Vite and Vitest handle them), and plain Node cannot load
 * CSS, so a stylesheet import becomes an empty module there.
 */
const STYLESHEET = /\.(?:css|less|scss|sass)(?:\?.*)?$/

export async function load(url, context, nextLoad) {
  if (STYLESHEET.test(url))
    return { format: 'module', source: '', shortCircuit: true }
  return nextLoad(url, context)
}
