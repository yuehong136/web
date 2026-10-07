import assert from 'node:assert/strict'
import test from 'node:test'
import zhCN from '@/locales/zh-CN/chat'
import { DEFAULT_SYSTEM_PROMPT, createInitialConfig } from '../constants'
import {
  hasAppRetrievalSource,
  withAppKnowledgeRetrieval,
} from '../knowledge-prompt'

const knowledgeBlock = zhCN.chat.knowledgePrompt.block

test('a dataset on the default prompt gets the knowledge block and parameter once', () => {
  const initial = { ...createInitialConfig({}), kb_ids: ['kb-1'] }
  const config = withAppKnowledgeRetrieval(initial, knowledgeBlock)

  assert.equal(
    config.systemPrompt,
    `${DEFAULT_SYSTEM_PROMPT}\n\n${knowledgeBlock}`,
  )
  assert.deepEqual(config.prompt_config, {
    ...initial.prompt_config,
    parameters: [{ key: 'knowledge', optional: false }],
  })
  assert.equal(withAppKnowledgeRetrieval(config, knowledgeBlock), config)
})

test('the Tavily key in prompt_config is a retrieval source', () => {
  const initial = createInitialConfig({})

  assert.equal(hasAppRetrievalSource(initial), false)
  assert.equal(
    hasAppRetrievalSource({
      ...initial,
      prompt_config: { ...initial.prompt_config, tavily_api_key: 'tvly-key' },
    }),
    true,
  )
})

test('apps without retrieval sources are left untouched', () => {
  const config = createInitialConfig({})

  assert.equal(withAppKnowledgeRetrieval(config, knowledgeBlock), config)
})
