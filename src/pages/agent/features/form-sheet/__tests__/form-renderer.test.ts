import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const registryUrl = new URL(
  '../components/form-renderer-registry.ts',
  import.meta.url,
)
const registrySource = readFileSync(registryUrl, 'utf8')

function extractRendererEntries(registryName: string) {
  const registryMatch = registrySource.match(
    new RegExp(
      `export const ${registryName}:[\\s\\S]*?= \\{([\\s\\S]*?)\\n\\}`,
    ),
  )
  assert.ok(registryMatch, `${registryName} must remain a literal registry`)

  return [...registryMatch[1].matchAll(/\[Operator\.(\w+)\]: (\w+),/g)].map(
    ([, operator, renderer]) => ({ operator, renderer }),
  )
}

function resolveFormModule(modulePath: string) {
  const formRoot = fileURLToPath(new URL('../../../form/', import.meta.url))
  const candidates = [
    `${formRoot}${modulePath}.ts`,
    `${formRoot}${modulePath}.tsx`,
    `${formRoot}${modulePath}/index.ts`,
    `${formRoot}${modulePath}/index.tsx`,
  ]

  return candidates.find((candidate) => existsSync(candidate))
}

test('every form renderer entry references an imported, existing module', () => {
  const formImports = new Map(
    [
      ...registrySource.matchAll(
        /import \{ (\w+) \} from '\.\.\/\.\.\/\.\.\/form\/([^']+)'/g,
      ),
    ].map(([, renderer, modulePath]) => [renderer, modulePath]),
  )
  const entries = [
    ...extractRendererEntries('migratedFormRenderers'),
    ...extractRendererEntries('legacyFormRenderers'),
  ]

  assert.ok(entries.length >= 50, 'renderer inventory unexpectedly shrank')
  assert.equal(
    new Set(entries.map(({ operator }) => operator)).size,
    entries.length,
  )

  for (const { operator, renderer } of entries) {
    if (renderer === 'EmptyForm') {
      continue
    }

    const modulePath = formImports.get(renderer)
    assert.ok(
      modulePath,
      `Operator.${operator} must reference an imported form`,
    )
    assert.ok(
      resolveFormModule(modulePath),
      `Operator.${operator} must reference an existing form module`,
    )
  }
})

test('critical migrated and compatibility mappings remain explicit', () => {
  const migrated = Object.fromEntries(
    extractRendererEntries('migratedFormRenderers').map(
      ({ operator, renderer }) => [operator, renderer],
    ),
  )
  const legacy = Object.fromEntries(
    extractRendererEntries('legacyFormRenderers').map(
      ({ operator, renderer }) => [operator, renderer],
    ),
  )

  assert.equal(migrated.Begin, 'BeginForm')
  assert.equal(migrated.A2UI, 'A2UIForm')
  assert.equal(migrated.Agent, 'AgentForm')
  assert.equal(migrated.Bing, 'BingForm')
  assert.equal(migrated.Email, 'EmailForm')
  assert.equal(legacy.Code, 'CodeForm')
  assert.equal(legacy.WaitingDialogue, 'CodeForm')
  assert.equal(legacy.ExcelProcessor, 'ToolForm')
  assert.equal(legacy.ExitLoop, 'EmptyForm')
})

test('resolver checks migrated, then legacy renderers, and otherwise returns null', () => {
  assert.match(
    registrySource,
    /migratedFormRenderers\[rendererKey\][\s\S]*legacyFormRenderers\[rendererKey\][\s\S]*null/,
  )
  assert.match(registrySource, /if \(!rendererKey\) \{\s+return null/)
})
