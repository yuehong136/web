import { describe, expect, it } from 'vitest'
import { environmentDotClass } from '../environment-color'
import {
  isValidBaseUrl,
  isValueOfType,
  maskSecret,
  resolveLocally,
  variableDraftProblem,
} from '../environment-variables'

describe('environmentDotClass', () => {
  it('gives well-known environments their status colour', () => {
    expect(environmentDotClass('Production', 4)).toBe('bg-danger-fg')
    expect(environmentDotClass('prod-eu', 4)).toBe('bg-danger-fg')
    expect(environmentDotClass('生产环境', 4)).toBe('bg-danger-fg')
    expect(environmentDotClass('staging', 4)).toBe('bg-warning-fg')
    expect(environmentDotClass('pre-prod', 4)).toBe('bg-warning-fg')
    expect(environmentDotClass('预发', 4)).toBe('bg-warning-fg')
    expect(environmentDotClass('local', 4)).toBe('bg-success-fg')
    expect(environmentDotClass('本地调试', 4)).toBe('bg-success-fg')
  })

  it('colours every other environment by its list position', () => {
    expect(environmentDotClass('dxl-193', 0)).toBe('bg-viz-1')
    expect(environmentDotClass('product-api', 2)).toBe('bg-viz-3')
    expect(environmentDotClass('team', 9)).toBe('bg-viz-10')
    expect(environmentDotClass('team', 10)).toBe('bg-viz-1')
    expect(environmentDotClass('team', -1)).toBe('bg-viz-1')
  })
})

describe('environment variable helpers', () => {
  it('reports the first problem that blocks saving a variable', () => {
    const draft = {
      key_name: 'token',
      key_value: 'x',
      variable_type: 'string' as const,
    }
    expect(variableDraftProblem(draft, [])).toBeNull()
    expect(variableDraftProblem({ ...draft, key_name: ' ' }, [])).toBe(
      'nameRequired',
    )
    expect(variableDraftProblem({ ...draft, key_name: '1abc' }, [])).toBe(
      'nameInvalid',
    )
    expect(variableDraftProblem(draft, ['other', 'token'])).toBe('nameExists')
    expect(
      variableDraftProblem({ ...draft, variable_type: 'number' }, []),
    ).toBe('typeMismatch')
  })

  it('checks values against their type', () => {
    expect(isValueOfType('42', 'number')).toBe(true)
    expect(isValueOfType(' ', 'number')).toBe(false)
    expect(isValueOfType('TRUE', 'boolean')).toBe(true)
    expect(isValueOfType('yes', 'boolean')).toBe(false)
    expect(isValueOfType('', 'string')).toBe(true)
  })

  it('resolves references against unsaved variables', () => {
    expect(
      resolveLocally('https://{{host}}:{{port}}/{{host}}/{{missing}}', [
        { key_name: 'host', key_value: 'example.test' },
        { key_name: 'port', key_value: '8080' },
        { key_name: 'unused', key_value: 'x' },
      ]),
    ).toEqual({
      resolved_text: 'https://example.test:8080/example.test/{{missing}}',
      variables_used: ['host', 'port'],
      missing_variables: ['missing'],
    })
  })

  it('accepts empty or http(s) base URLs and masks secrets', () => {
    expect(isValidBaseUrl('')).toBe(true)
    expect(isValidBaseUrl('https://api.test')).toBe(true)
    expect(isValidBaseUrl('ftp://api.test')).toBe(false)
    expect(isValidBaseUrl('api.test')).toBe(false)
    expect(maskSecret('abc')).toBe('•••')
    expect(maskSecret('a-very-long-secret')).toBe('••••••••')
  })
})
