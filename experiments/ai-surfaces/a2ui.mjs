import { createElement as h } from 'react'
import { z } from 'zod'
import {
  Catalog,
  CommonSchemas,
  MessageProcessor,
  STRICT_VALIDATION,
} from '@a2ui/web_core/v0_9'
import { A2uiSurface, createComponentImplementation } from '@a2ui/react/v0_9'
import { buildNodes, labels } from './fixture.mjs'

export async function createAdapter({ session, root, update }) {
  const components = [
    createComponentImplementation(
      {
        name: 'Column',
        schema: z.object({ children: CommonSchemas.ChildList }),
      },
      ({ props, buildChild }) =>
        h(
          'section',
          {},
          props.children.map((id) => buildChild(id)),
        ),
    ),
    createComponentImplementation(
      {
        name: 'Text',
        schema: z.object({
          text: CommonSchemas.DynamicString,
          hidden: CommonSchemas.DynamicBoolean,
        }),
      },
      ({ props }) => h('p', { hidden: props.hidden }, props.text),
    ),
    createComponentImplementation(
      {
        name: 'Button',
        schema: z.object({
          text: CommonSchemas.DynamicString,
          testId: z.string(),
          action: CommonSchemas.Action,
          hidden: CommonSchemas.DynamicBoolean,
        }),
      },
      ({ props }) =>
        h(
          'button',
          {
            'data-fixture-id': props.testId,
            hidden: props.hidden,
            onClick: props.action,
          },
          props.text,
        ),
    ),
  ]
  const catalog = new Catalog(
    'https://fixture.invalid/catalog/v1',
    'v0.9.1',
    components,
  )
  const processor = new MessageProcessor(
    [catalog],
    (event) => {
      session.dispatch(event.surfaceId, event.name, event.context)
      update()
    },
    {
      version: 'v0.9.1',
      validationConfig: { ...STRICT_VALIDATION, targetVersion: 'v0.9.1' },
    },
  )
  processor.processMessages({
    version: 'v0.9.1',
    createSurface: {
      surfaceId: session.state.scope,
      catalogId: catalog.id,
    },
  })
  let locale = 'en-US'
  function updateComponents(unsupported = false, invalid = false) {
    const nodes = buildNodes(session, locale)
    const definitions = nodes.map((node) => ({
      id: node.id,
      component: node.type,
      ...(node.children ? { children: node.children } : {}),
      ...(node.text
        ? {
            text:
              invalid && node.id === 'title' ? { script: 'bad' } : node.text,
            hidden: node.hidden ?? false,
          }
        : {}),
      ...(node.action
        ? {
            testId: node.id,
            action: {
              event: {
                name: node.action,
                context: node.params,
              },
            },
          }
        : {}),
    }))
    if (unsupported) {
      definitions[0].children.push('unknown')
      definitions.push({ id: 'unknown', component: 'ExecuteArbitraryCode' })
    }
    processor.processMessages({
      version: 'v0.9.1',
      updateComponents: {
        surfaceId: session.state.scope,
        components: definitions,
      },
    })
  }
  return {
    render(presentation, unsupported = false) {
      locale = presentation.locale
      try {
        updateComponents(unsupported)
        root.render(
          h(A2uiSurface, {
            surface: processor.getSurface(session.state.scope),
          }),
        )
      } catch (error) {
        if (!unsupported) throw error
        // Native strict validation rejects an unknown catalog element. The host
        // supplies the product fallback; this is not a library fallback claim.
        root.render(h('output', {}, labels(locale).unsupported))
      }
    },
    schemaRejection() {
      try {
        updateComponents(false, true)
        return { native: false, host: false }
      } catch {
        return { native: true, host: true }
      }
    },
    actionPolicy: () => ({
      hostRejectsUnknownAction: !session.dispatch(
        session.state.scope,
        'executeCode',
        {},
      ),
    }),
    fallbackOwner: 'host fallback after MessageProcessor strict rejection',
    patch(message) {
      if (!session.patch(message)) return false
      updateComponents()
      return true
    },
    dispose() {
      session.dispose()
      processor.processMessages({
        version: 'v0.9.1',
        deleteSurface: {
          surfaceId: session.state.scope,
        },
      })
      processor.dispose()
    },
  }
}
