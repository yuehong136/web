import assert from 'node:assert/strict'
import test from 'node:test'
import enUS from '@/locales/en-US/chat'
import zhCN from '@/locales/zh-CN/chat'
import {
  KNOWLEDGE_PLACEHOLDER,
  hasRetrievalSource,
  stripKnowledgePlaceholder,
  withKnowledgeRetrieval,
  type KnowledgePrompt,
  type PromptParameter,
} from '../knowledge-prompt'

const zhBlock = zhCN.chat.knowledgePrompt.block
const enBlock = enUS.chat.knowledgePrompt.block
const knowledgeParameter = { key: 'knowledge', optional: false }
const dataset = { datasetIds: ['kb-1'] }

const prompt = (
  systemPrompt: string,
  parameters: PromptParameter[] = [],
): KnowledgePrompt => ({ systemPrompt, parameters })

test('both locale blocks carry exactly one knowledge placeholder', () => {
  for (const block of [zhBlock, enBlock]) {
    assert.equal(block.split(KNOWLEDGE_PLACEHOLDER).length, 2)
  }
})

test('a dataset gets the knowledge block and a required parameter once', () => {
  const next = withKnowledgeRetrieval(
    prompt('Be brief.\n', [{ key: 'user', optional: true }]),
    dataset,
    zhBlock,
  )

  assert.equal(next.systemPrompt, `Be brief.\n\n${zhBlock}`)
  assert.deepEqual(next.parameters, [
    { key: 'user', optional: true },
    knowledgeParameter,
  ])
  assert.equal(withKnowledgeRetrieval(next, dataset, zhBlock), next)
  assert.equal(
    withKnowledgeRetrieval(prompt(''), dataset, enBlock).systemPrompt,
    enBlock,
  )
})

test('a Tavily key alone is a retrieval source, a blank one is not', () => {
  const tavily = { datasetIds: [], tavilyApiKey: 'tvly-key' }
  const next = withKnowledgeRetrieval(prompt('Be brief.'), tavily, enBlock)

  assert.ok(next.systemPrompt.endsWith(enBlock))
  assert.deepEqual(next.parameters, [knowledgeParameter])
  assert.equal(hasRetrievalSource({ datasetIds: [], tavilyApiKey: ' ' }), false)
})

test('an existing placeholder or knowledge parameter is kept as written', () => {
  const written = prompt('Answer only from {knowledge}.', [
    { key: 'knowledge', optional: true },
  ])
  assert.equal(withKnowledgeRetrieval(written, dataset, zhBlock), written)

  const parameterOnly = withKnowledgeRetrieval(
    prompt('Answer only from {knowledge}.'),
    dataset,
    zhBlock,
  )
  assert.equal(parameterOnly.systemPrompt, 'Answer only from {knowledge}.')
  assert.deepEqual(parameterOnly.parameters, [knowledgeParameter])
})

test('prompts without retrieval sources are left untouched', () => {
  const plain = prompt('Be brief.')
  assert.equal(
    withKnowledgeRetrieval(plain, { datasetIds: [] }, zhBlock),
    plain,
  )
})

test('stripping removes inserted blocks in either language and stray placeholders', () => {
  const systemPrompt = '你是一个智能助手，请提供有帮助的回答。'
  assert.equal(
    stripKnowledgePlaceholder(`${systemPrompt}\n\n${zhBlock}`),
    systemPrompt,
  )
  assert.match(
    stripKnowledgePlaceholder(`Be brief.\n\n${enBlock}\n\nCite sources.`),
    /^Be brief\.\s+Cite sources\.$/,
  )
  assert.equal(
    stripKnowledgePlaceholder('Use {knowledge} here').includes('{'),
    false,
  )
  assert.equal(stripKnowledgePlaceholder(zhBlock), '')
})
