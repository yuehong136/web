import type { GatewayCatalog } from '@/api/model-gateway'
import { isCallable } from './catalog'

/**
 * Connection snippets for OpenAI-compatible clients. Values are inserted as
 * JSON strings so names with quotes or backslashes stay valid code.
 */
export interface SampleInput {
  baseUrl: string
  apiKey: string
  /** A call name the key can use; chat samples need one. */
  model: string
  prompt: string
}

const json = (value: string) => JSON.stringify(value)

export const pythonSample = ({ baseUrl, apiKey, model, prompt }: SampleInput) =>
  [
    'from openai import OpenAI',
    '',
    `client = OpenAI(base_url=${json(baseUrl)}, api_key=${json(apiKey)})`,
    'reply = client.chat.completions.create(',
    `    model=${json(model)},`,
    `    messages=[{"role": "user", "content": ${json(prompt)}}],`,
    ')',
  ].join('\n')

export const nodeSample = ({ baseUrl, apiKey, model, prompt }: SampleInput) =>
  [
    "import OpenAI from 'openai'",
    '',
    `const client = new OpenAI({ baseURL: ${json(baseUrl)}, apiKey: ${json(apiKey)} })`,
    'const reply = await client.chat.completions.create({',
    `  model: ${json(model)},`,
    `  messages: [{ role: 'user', content: ${json(prompt)} }],`,
    '})',
  ].join('\n')

/** Single-quoted for the shell; a quote inside is closed, escaped, reopened. */
const shell = (value: string) => `'${value.replace(/'/g, `'\\''`)}'`

export const curlSample = ({ baseUrl, apiKey, model, prompt }: SampleInput) => {
  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: prompt }],
  })
  return [
    `curl ${shell(`${baseUrl}/chat/completions`)} \\`,
    `  -H ${shell(`Authorization: Bearer ${apiKey}`)} \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -d ${shell(body)}`,
  ].join('\n')
}

/** Lists the models a key can call; needs no model name. */
export const curlModelsSample = ({
  baseUrl,
  apiKey,
}: Pick<SampleInput, 'baseUrl' | 'apiKey'>) =>
  [
    `curl ${shell(`${baseUrl}/models`)} \\`,
    `  -H ${shell(`Authorization: Bearer ${apiKey}`)}`,
  ].join('\n')

/** The two variables OpenAI-compatible SDKs read. */
export const envSample = ({
  baseUrl,
  apiKey,
}: Pick<SampleInput, 'baseUrl' | 'apiKey'>) =>
  `OPENAI_BASE_URL=${baseUrl}\nOPENAI_API_KEY=${apiKey}\n`

/** A model name for the samples: the first callable chat model if any. */
export function sampleModel(catalog: Pick<GatewayCatalog, 'models'>): string {
  const callable = catalog.models.filter(isCallable)
  const model =
    callable.find((item) => item.servable_types.includes('chat')) ??
    callable[0] ??
    catalog.models[0]
  return model?.call_name ?? 'model'
}
