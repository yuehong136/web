import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { gzipSync, gunzipSync } from 'node:zlib'

// The published implementation is unchanged; npm must see the extended peer
// range before dependency resolution, so a postinstall patch is insufficient.
const url =
  'https://registry.npmjs.org/eslint-plugin-jsx-a11y/-/eslint-plugin-jsx-a11y-6.10.2.tgz'
const integrity =
  'sha512-scB3nz4WmG75pV8+3eRUQOHZlNSUhFNq37xnpgRkCCELU3XMvXAxLk1eqWWyE22Ki4Q01Fnsw9BA3cJHDPgn2Q=='
const upstream = process.argv[2]
  ? await readFile(process.argv[2])
  : Buffer.from(await (await fetch(url)).arrayBuffer())
if (
  `sha512-${createHash('sha512').update(upstream).digest('base64')}` !==
  integrity
) {
  throw new Error('Upstream jsx-a11y archive failed its pinned integrity check')
}

const archive = gunzipSync(upstream)
const blocks = []
const sourceHashes = {}
let changed = false
for (let offset = 0; offset < archive.length; ) {
  const header = archive.subarray(offset, offset + 512)
  if (header.every((byte) => byte === 0)) break
  const name = header.subarray(0, 100).toString().replace(/\0.*$/, '')
  const size = Number.parseInt(header.subarray(124, 136).toString(), 8) || 0
  const content = archive.subarray(offset + 512, offset + 512 + size)
  const paddedSize = Math.ceil(size / 512) * 512
  if (name === 'package/package.json') {
    const metadata = JSON.parse(content)
    if (
      metadata.name !== 'eslint-plugin-jsx-a11y' ||
      metadata.version !== '6.10.2'
    ) {
      throw new Error('Unexpected upstream package identity')
    }
    metadata.version = '6.10.2-web.1'
    metadata.peerDependencies.eslint += ' || ^10'
    const nextContent = Buffer.from(`${JSON.stringify(metadata, null, 2)}\n`)
    const nextHeader = Buffer.from(header)
    nextHeader.write(
      `${nextContent.length.toString(8).padStart(11, '0')}\0`,
      124,
      12,
      'ascii',
    )
    nextHeader.fill(32, 148, 156)
    const checksum = nextHeader.reduce((sum, byte) => sum + byte, 0)
    nextHeader.write(
      `${checksum.toString(8).padStart(6, '0')}\0 `,
      148,
      8,
      'ascii',
    )
    blocks.push(
      nextHeader,
      nextContent,
      Buffer.alloc(
        Math.ceil(nextContent.length / 512) * 512 - nextContent.length,
      ),
    )
    changed = true
  } else {
    blocks.push(archive.subarray(offset, offset + 512 + paddedSize))
    sourceHashes[name] = createHash('sha256').update(content).digest('hex')
  }
  offset += 512 + paddedSize
}
if (!changed) throw new Error('Upstream package.json was not found')
blocks.push(Buffer.alloc(1024))
await mkdir('vendor', { recursive: true })
await writeFile(
  'vendor/eslint-plugin-jsx-a11y-6.10.2-web.1.tgz',
  gzipSync(Buffer.concat(blocks), { level: 9 }),
)
await writeFile(
  'vendor/jsx-a11y-provenance.json',
  `${JSON.stringify(
    {
      url,
      integrity,
      changes: { version: '6.10.2-web.1', addedEslintPeer: '^10' },
      unchangedFiles: sourceHashes,
    },
    null,
    2,
  )}\n`,
)
console.log(
  `Repacked jsx-a11y: ${Object.keys(sourceHashes).length} files unchanged`,
)
