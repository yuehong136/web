import assert from 'node:assert/strict'
import test from 'node:test'
import { extractThinkContent } from '../think-utils'
import {
  consumeStreamingAnswerChunk,
  createInitialStreamingAnswerState,
  finalizeStreamingAnswerState,
} from '../../lib/streaming/answer-reducer'

const text =
  '<retrieving>lookup<br/>sources</retrieving><think>reason\n\nmore reasoning</think>Answer [ID:0]'

test('live delta/cumulative chunks at every boundary replay exactly like history', () => {
  for (let split = 1; split < text.length; split++) {
    for (const cumulative of [false, true]) {
      let state = createInitialStreamingAnswerState()
      state = consumeStreamingAnswerChunk(state, {
        data: { answer: text.slice(0, split) },
      }).nextState
      state = consumeStreamingAnswerChunk(state, {
        data: { answer: cumulative ? text : text.slice(split) },
      }).nextState
      state = consumeStreamingAnswerChunk(state, {
        data: { answer: text, final: true },
      }).nextState
      state = finalizeStreamingAnswerState(
        consumeStreamingAnswerChunk(state, { data: true }).nextState,
      )
      const history = extractThinkContent(text)
      const live = extractThinkContent(state.content)
      assert.equal(live.retrievalContent, history.retrievalContent)
      assert.equal(state.thinking, history.thinkContent)
      assert.equal(live.mainContent, history.mainContent)
      assert.equal(state.phase, 'completed')
      assert.equal(live.retrievalStatus, 'complete')
    }
  }
})

test('retrieval and reasoning remain separate when a decorated final omits process blocks', () => {
  let state = consumeStreamingAnswerChunk(createInitialStreamingAnswerState(), {
    data: { answer: text },
  }).nextState
  state = consumeStreamingAnswerChunk(state, {
    data: { answer: 'Answer [ID:1]', final: true },
  }).nextState
  assert.equal(state.thinking, 'reason\n\nmore reasoning')
  assert.equal(
    extractThinkContent(state.content).retrievalContent,
    'lookup<br/>sources',
  )
  assert.equal(extractThinkContent(state.content).mainContent, 'Answer [ID:1]')
  assert.equal(state.fullAnswer.match(/<retrieving>/g)?.length, 1)
})

test('unfinished blocks never leak later paragraphs on EOF, cancellation or terminal frame', () => {
  for (const tag of ['think', 'thinking', 'retrieving']) {
    const raw = `prefix<${tag}>first\n\nsecond`
    const state = consumeStreamingAnswerChunk(
      createInitialStreamingAnswerState(),
      { data: { answer: raw } },
    ).nextState
    for (const terminal of [{ data: true }, { retcode: 500 }, null]) {
      const settled = finalizeStreamingAnswerState(
        terminal
          ? consumeStreamingAnswerChunk(state, terminal).nextState
          : state,
      )
      const parsed = extractThinkContent(settled.content)
      assert.equal(parsed.mainContent, 'prefix')
      assert.equal(
        tag === 'retrieving' ? parsed.retrievalContent : settled.thinking,
        'first\n\nsecond',
      )
    }
  }
})

test('all process blocks are extracted without dropping text before or between them', () => {
  const parsed = extractThinkContent(
    'before<think>a</think>middle<retrieving>r</retrieving><thinking>b</thinking>after',
  )
  assert.equal(parsed.mainContent, 'beforemiddleafter')
  assert.equal(parsed.thinkContent, 'a\nb')
  assert.equal(parsed.retrievalContent, 'r')
})

test('control-looking text inside code, HTML attributes/blocks, escaped text and math stays literal', () => {
  const literals = [
    '`<think>literal</think>`',
    '```html\n<retrieving>literal</retrieving>\n```',
    '~~~~\n<think>literal\n~~~~',
    '    <think>literal</think>\n',
    '<div title="<think>literal</think>">body</div>',
    '<!-- <retrieving>literal</retrieving> -->',
    '\\<think>escaped\\</think>',
    '&lt;retrieving&gt;literal&lt;/retrieving&gt;',
    '$<think>literal</think>$',
    '$$<retrieving>literal</retrieving>$$',
    String.raw`\(<think>literal</think>\)`,
    String.raw`\\[<retrieving>literal</retrieving>\\]`,
  ]
  for (const raw of literals) {
    const parsed = extractThinkContent(raw)
    assert.equal(parsed.mainContent, raw.replace(/^\n+|\n+$/g, ''), raw)
    assert.equal(parsed.status, 'none', raw)
    assert.equal(parsed.retrievalStatus, 'none', raw)
  }
})

test('partial tags are buffered and mismatched nested channels cannot promote content', () => {
  for (const raw of ['<ret', '<retrieving>lookup</retriev', '<thi']) {
    const parsed = extractThinkContent(raw)
    assert.equal(parsed.mainContent, '')
    assert.ok(!parsed.retrievalContent.includes('</retriev'))
  }
  const nested = extractThinkContent(
    '<retrieving>lookup<think>untrusted</think>still lookup</retrieving>answer',
  )
  assert.equal(nested.thinkContent, '')
  assert.equal(
    nested.retrievalContent,
    'lookup<think>untrusted</think>still lookup',
  )
  assert.equal(nested.mainContent, 'answer')
})

test('stream marker flags ignore literal code tags and close the active thinking alias', () => {
  let state = consumeStreamingAnswerChunk(createInitialStreamingAnswerState(), {
    data: { answer: '`<think>`' },
  }).nextState
  state = consumeStreamingAnswerChunk(state, {
    data: { start_to_think: true, answer: 'reason' },
  }).nextState
  state = consumeStreamingAnswerChunk(state, {
    data: { end_to_think: true, answer: 'answer' },
  }).nextState
  assert.equal(state.thinking, 'reason')
  assert.equal(state.content, '`<think>`answer')
  state = consumeStreamingAnswerChunk(createInitialStreamingAnswerState(), {
    data: { answer: '<thinking>reason' },
  }).nextState
  state = consumeStreamingAnswerChunk(state, {
    data: { end_to_think: true, answer: 'answer' },
  }).nextState
  assert.equal(state.thinking, 'reason')
  assert.equal(state.content, 'answer')
})

test('ordinary prices and autolinks do not consume later process boundaries', () => {
  const parsed = extractThinkContent(
    '<https://example.com><retrieving>budget $5</retrieving><think>reason</think>answer',
  )
  assert.equal(parsed.mainContent, '<https://example.com>answer')
  assert.equal(parsed.retrievalContent, 'budget $5')
  assert.equal(parsed.thinkContent, 'reason')
})
