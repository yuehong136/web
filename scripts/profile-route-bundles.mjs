import { readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

/** Static imports only. A lazy preview is an incremental cost, not cold start. */
export function collectStaticAssets(
  manifest,
  roots,
  { includeReferencedAssets = false } = {},
) {
  const visited = new Set()
  const assets = new Set()
  const visit = (key) => {
    if (visited.has(key)) return
    const chunk = manifest[key]
    if (!chunk) throw new Error(`Missing manifest chunk: ${key}`)
    visited.add(key)
    assets.add(chunk.file)
    for (const asset of [
      ...(chunk.css ?? []),
      ...(includeReferencedAssets ? (chunk.assets ?? []) : []),
    ])
      assets.add(asset)
    for (const dependency of chunk.imports ?? []) visit(dependency)
  }
  for (const root of roots) visit(root)
  return [...assets].sort()
}

export function profileRouteBundles(dist = 'dist') {
  const manifest = JSON.parse(
    readFileSync(path.join(dist, '.vite/manifest.json'), 'utf8'),
  )
  const entry = Object.keys(manifest).find(
    (key) => manifest[key].isEntry && /index\.html$/.test(key),
  )
  if (!entry) throw new Error('The Web entry is missing from the manifest')
  const summarize = (assets) => ({
    files: assets.length,
    rawBytes: assets.reduce(
      (total, file) => total + statSync(path.join(dist, file)).size,
      0,
    ),
    gzipBytes: assets.reduce(
      (total, file) =>
        total + gzipSync(readFileSync(path.join(dist, file))).length,
      0,
    ),
    assets,
  })
  const routes = {}
  for (const [name, pattern] of Object.entries({
    Home: /pages\/home\/HomePage\.tsx$/,
    Search: /pages\/search\/detail\/SearchDetailPage\.tsx$/,
    Agent: /pages\/agent\/index\.tsx$/,
  })) {
    const key = Object.keys(manifest).find((candidate) =>
      pattern.test(candidate),
    )
    // Home is currently statically imported by the router and belongs to the
    // entry closure. Search/Agent must retain their explicit lazy entry.
    if (!key && name !== 'Home') throw new Error(`Missing route entry: ${name}`)
    const roots = key ? [entry, key] : [entry]
    const staticAssets = collectStaticAssets(manifest, roots)
    const referenced = collectStaticAssets(manifest, roots, {
      includeReferencedAssets: true,
    }).filter((asset) => !staticAssets.includes(asset))
    routes[name] = {
      routeEntry: key ?? entry,
      entryBound: !key,
      ...summarize(staticAssets),
      referencedAssets: summarize(referenced),
    }
  }
  return {
    description:
      'Entry + route static JavaScript/CSS closure; gzip is the sum per file, not measured HTTP transfer. Referenced images/fonts are listed separately because importing a URL does not download it. Dynamic previews, workers and runtime URLs require network measurement.',
    entry: summarize(collectStaticAssets(manifest, [entry])),
    routes,
    lazyResources: Object.entries(manifest)
      .filter(([key]) =>
        /artifact-workspace|document-preview|mindmap-drawer/.test(key),
      )
      .map(([key]) => ({
        entry: key,
        ...summarize(collectStaticAssets(manifest, [key])),
      })),
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const report = profileRouteBundles()
  const output = 'output/playwright/round2/route-bundles.json'
  mkdirSync(path.dirname(output), { recursive: true })
  writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`)
  console.log(
    JSON.stringify(
      {
        output,
        routes: Object.fromEntries(
          Object.entries(report.routes).map(
            ([name, { files, rawBytes, gzipBytes }]) => [
              name,
              { files, rawBytes, gzipBytes },
            ],
          ),
        ),
      },
      null,
      2,
    ),
  )
}
