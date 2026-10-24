import { createElement as h } from 'react'
import { z } from 'zod'
import { buildNodes, labels } from './fixture.mjs'

export async function createAdapter({ session, root, update }) {
  const schemas = {
    Column: z.object({ children: z.array(z.string()) }),
    Text: z.object({ text: z.string(), hidden: z.boolean().optional() }),
    Button: z.object({
      text: z.string(),
      action: z.enum(['filterSources', 'adoptSource']),
      params: z.record(z.string(), z.string()),
      hidden: z.boolean().optional(),
    }),
  }
  let locale = 'en-US'
  const schemaRejection = () => ({
    native: !schemas.Text.safeParse({ text: { script: 'bad' } }).success,
    host: !schemas.Text.safeParse({ text: { script: 'bad' } }).success,
  })
  function render(presentation, unsupported = false) {
    locale = presentation.locale
    const nodes = buildNodes(session, locale)
    const byId = new Map(nodes.map((node) => [node.id, node]))
    const child = (id) => {
      const node = byId.get(id)
      if (!node || !schemas[node.type])
        return h('output', { key: id }, labels(locale).unsupported)
      const { id: _id, type: _type, ...props } = node
      if (!schemas[node.type].safeParse(props).success)
        throw new Error(`Invalid local component: ${id}`)
      if (node.type === 'Column')
        return h('section', { key: id }, node.children.map(child))
      if (node.type === 'Text')
        return h('p', { key: id, hidden: node.hidden }, node.text)
      return h(
        'button',
        {
          key: id,
          'data-fixture-id': id,
          hidden: node.hidden,
          onClick() {
            session.dispatch(session.state.scope, node.action, node.params)
            update()
          },
        },
        node.text,
      )
    }
    if (unsupported) {
      byId.set('unknown', { id: 'unknown', type: 'ExecuteArbitraryCode' })
      byId.get('root').children.push('unknown')
    }
    root.render(child('root'))
  }
  return {
    render,
    schemaRejection,
    actionPolicy: () => ({
      hostRejectsUnknownAction: !session.dispatch(
        session.state.scope,
        'executeCode',
        {},
      ),
    }),
    fallbackOwner: 'local registry',
    patch: (message) => session.patch(message),
    dispose: () => session.dispose(),
  }
}
