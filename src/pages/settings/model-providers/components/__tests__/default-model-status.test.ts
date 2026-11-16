import { expect, it } from 'vitest'
import { defaultModelStatus } from '../default-model-status'

const option = (value: string, aliases: string[] = [], disabled = false) => ({
  value,
  label: value,
  aliases,
  disabled,
})

it('separates missing, unavailable, aliased and uncertain defaults', () => {
  const choices = {
    options: [{ options: [option('1', ['gpt@OpenAI'])] }],
    knownOptions: [option('1', ['gpt@OpenAI']), option('2', [], true)],
  }
  expect(defaultModelStatus('', choices)).toBe('missing')
  expect(defaultModelStatus('1', choices)).toBe('set')
  expect(defaultModelStatus('gpt@OpenAI', choices)).toBe('set')
  expect(defaultModelStatus('2', choices)).toBe('unavailable')
  expect(defaultModelStatus('9', choices)).toBe('unavailable')
  expect(defaultModelStatus('9', choices, { uncertain: true })).toBe('unknown')
  expect(defaultModelStatus('', choices, { builtin: true })).toBe('set')
})
