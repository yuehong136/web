import { createElement as h } from 'react'
import { z } from 'zod'
import { defineCatalog, applySpecPatch } from '@json-render/core'
import {
  schema,
  Renderer,
  JSONUIProvider,
  defineRegistry,
} from '@json-render/react'
import { buildNodes, labels } from './fixture.mjs'

export async function createAdapter({ session, root, update }) {
  const catalog = defineCatalog(schema, {
    components: {
      Column: { props: z.object({}), slots: ['default'] },
      Text: { props: z.object({ text: z.string(), hidden: z.boolean() }) },
      Button: {
        props: z.object({
          text: z.string(),
          id: z.string(),
          hidden: z.boolean(),
        }),
      },
    },
    actions: {
      filterSources: { params: z.object({ kind: z.literal('policy') }) },
      adoptSource: { params: z.object({ sourceId: z.string() }) },
    },
  })
  const { registry } = defineRegistry(catalog, {
    components: {
      Column: ({ children }) => h('section', {}, children),
      Text: ({ props }) => h('p', { hidden: props.hidden }, props.text),
      Button: ({ props, emit }) =>
        h(
          'button',
          {
            'data-fixture-id': props.id,
            hidden: props.hidden,
            onClick: () => emit('press'),
          },
          props.text,
        ),
    },
    // Actions intentionally use the host receiver; no agent loop is installed.
    actions: {},
  })
  const handlers = Object.fromEntries(
    ['filterSources', 'adoptSource'].map((name) => [
      name,
      (params) => {
        session.dispatch(session.state.scope, name, params)
        update()
      },
    ]),
  )
  let locale = 'en-US'
  let spec
  let pendingPatchedSpec
  function hostValid(candidate) {
    if (!catalog.validate(candidate).success) return false
    return Object.values(candidate.elements).every((element) => {
      if (
        !catalog.data.components[element.type]?.props.safeParse(element.props)
          .success
      )
        return false
      return Object.values(element.on ?? {}).every(
        (binding) =>
          catalog.data.actions[binding.action]?.params.safeParse(binding.params)
            .success,
      )
    })
  }
  function makeSpec() {
    return {
      root: 'root',
      elements: Object.fromEntries(
        buildNodes(session, locale).map((node) => [
          node.id,
          {
            type: node.type,
            props:
              node.type === 'Column'
                ? {}
                : {
                    text: node.text,
                    hidden: node.hidden ?? false,
                    ...(node.type === 'Button' ? { id: node.id } : {}),
                  },
            children: node.children ?? [],
            ...(node.action
              ? { on: { press: { action: node.action, params: node.params } } }
              : {}),
          },
        ]),
      ),
    }
  }
  function render(presentation, unsupported = false) {
    locale = presentation.locale
    spec = pendingPatchedSpec ?? makeSpec()
    pendingPatchedSpec = undefined
    if (unsupported) {
      // Exercise the library's documented unknown-component fallback.
      applySpecPatch(spec, {
        op: 'add',
        path: '/elements/unknown',
        value: {
          type: 'ExecuteArbitraryCode',
          props: {},
        },
      })
      spec.elements.root.children.push('unknown')
    } else if (!hostValid(spec)) {
      throw new Error(
        `json-render rejected the common fixture: ${catalog.validate(spec).error}`,
      )
    }
    root.render(
      h(
        JSONUIProvider,
        { registry, handlers },
        h(Renderer, {
          spec,
          registry,
          fallback: () => h('output', {}, labels(locale).unsupported),
        }),
      ),
    )
  }
  return {
    render,
    schemaRejection() {
      const invalid = makeSpec()
      invalid.elements.title.props.text = { script: 'bad' }
      return {
        native: !catalog.validate(invalid).success,
        host: !hostValid(invalid),
      }
    },
    actionPolicy() {
      const invalid = makeSpec()
      invalid.elements.filter.on.press.action = 'executeCode'
      return { hostRejectsUnknownAction: !hostValid(invalid) }
    },
    fallbackOwner: 'Renderer.fallback',
    patch(message) {
      if (!session.patch(message)) return false
      const next = makeSpec()
      pendingPatchedSpec = applySpecPatch(structuredClone(spec), {
        op: 'replace',
        path: '/elements',
        value: next.elements,
      })
      return true
    },
    dispose: () => session.dispose(),
  }
}
