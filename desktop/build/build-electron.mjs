import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { rolldown } from 'rolldown'

import { electronBuildConfigs } from './rolldown.config.mjs'

async function assertRegularInput(buildName, inputPath) {
  let stats
  try {
    stats = await fs.lstat(inputPath)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw new Error(`${buildName} input does not exist: ${inputPath}`)
    }
    throw error
  }

  if (!stats.isFile() || stats.isSymbolicLink()) {
    throw new Error(`${buildName} input must be a regular file: ${inputPath}`)
  }
}

function assertSingleJavaScriptEntry(buildName, expectedEntry, output) {
  const emittedJavaScript = output.filter(
    (item) => item.type === 'chunk' && !item.fileName.endsWith('.map'),
  )

  if (
    emittedJavaScript.length !== 1 ||
    emittedJavaScript[0].fileName !== expectedEntry
  ) {
    const emittedNames = emittedJavaScript
      .map(({ fileName }) => fileName)
      .sort()
    throw new Error(
      `${buildName} must emit only ${expectedEntry}; emitted: ${emittedNames.join(', ')}`,
    )
  }
}

export async function buildElectronBundles(configs = electronBuildConfigs) {
  const results = []

  for (const config of configs) {
    await assertRegularInput(config.name, config.input.input)

    const bundle = await rolldown(config.input)
    try {
      const result = await bundle.write(config.output)
      assertSingleJavaScriptEntry(
        config.name,
        config.expectedEntry,
        result.output,
      )
      results.push({
        name: config.name,
        outputDirectory: path.resolve(config.output.dir),
        files: result.output.map(({ fileName }) => fileName).sort(),
      })
    } finally {
      await bundle.close()
    }
  }

  return results
}

function isDirectExecution() {
  const executable = process.argv[1]
  return (
    executable &&
    import.meta.url === pathToFileURL(path.resolve(executable)).href
  )
}

if (isDirectExecution()) {
  const results = await buildElectronBundles()
  for (const result of results) {
    process.stdout.write(
      `${result.name}: ${result.files.join(', ')} -> ${result.outputDirectory}\n`,
    )
  }
}
