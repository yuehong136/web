/** Synthetic data only. These callbacks never call a product API or agent. */
export const fixtureSources = [
  { id: 'design', title: 'Workspace design notes', kind: 'research' },
  { id: 'policy', title: 'Data retention policy', kind: 'policy' },
]

const copy = {
  'en-US': {
    title: 'Fixture: inspect and adopt a source',
    filter: 'Show policies',
    adopt: 'Adopt source',
    unsupported: 'Unsupported component',
  },
  'zh-CN': {
    title: '实验样本：筛选并采用来源',
    filter: '仅看制度',
    adopt: '采用来源',
    unsupported: '暂不支持此组件',
  },
}
export const labels = (locale) => copy[locale]

export function createFixtureSession() {
  const state = {
    scope: 'fixture-turn-1',
    sources: structuredClone(fixtureSources),
    filter: null,
    adopted: [],
    receipts: [],
    revision: 0,
    disposed: false,
  }
  return {
    state,
    /** Host authorization boundary, shared by all three candidates. */
    dispatch(scope, name, params) {
      if (state.disposed || scope !== state.scope) return false
      if (name === 'filterSources') {
        if (params?.kind !== 'policy' || Object.keys(params).length !== 1)
          return false
        state.filter = params.kind
      } else if (name === 'adoptSource') {
        if (
          typeof params?.sourceId !== 'string' ||
          Object.keys(params).length !== 1 ||
          !state.sources.some((source) => source.id === params.sourceId)
        )
          return false
        state.adopted.push(params.sourceId)
      } else return false
      state.receipts.push({ name, params: structuredClone(params), scope })
      return true
    },
    patch({ scope, revision, source }) {
      if (
        state.disposed ||
        scope !== state.scope ||
        !Number.isInteger(revision) ||
        revision <= state.revision ||
        !source ||
        typeof source.id !== 'string' ||
        typeof source.title !== 'string' ||
        !['research', 'policy'].includes(source.kind) ||
        state.sources.some((item) => item.id === source.id)
      )
        return false
      state.sources.push(structuredClone(source))
      state.revision = revision
      return true
    },
    dispose() {
      state.disposed = true
    },
  }
}

/** The same three real primitive roles are rendered by each candidate. */
export function buildNodes(session, locale) {
  const text = labels(locale)
  const nodes = [
    { id: 'title', type: 'Text', text: text.title },
    {
      id: 'filter',
      type: 'Button',
      text: text.filter,
      action: 'filterSources',
      params: { kind: 'policy' },
    },
  ]
  for (const source of session.state.sources) {
    const hidden = Boolean(
      session.state.filter && source.kind !== session.state.filter,
    )
    nodes.push({
      id: `text-${source.id}`,
      type: 'Text',
      text: source.title,
      hidden,
    })
    nodes.push({
      id: `adopt-${source.id}`,
      type: 'Button',
      text: text.adopt,
      action: 'adoptSource',
      params: { sourceId: source.id },
      hidden,
    })
  }
  return [
    { id: 'root', type: 'Column', children: nodes.map((node) => node.id) },
    ...nodes,
  ]
}
