import { describe, expect, it } from 'vitest'
import { nicknameSchema } from '../nickname'

describe('nickname contract', () => {
  it.each([
    'John Doe',
    '张三',
    '한국어',
    "O'Brien",
    'name_1-2.3',
    '𐐀'.repeat(100),
    '\uFEFF 张三 \uFEFF',
  ])('accepts and trims %s', (value) => {
    expect(nicknameSchema.parse(value)).toBe(value.trim())
  })
  it.each([
    undefined,
    null,
    123,
    '',
    ' ',
    '𐐀'.repeat(101),
    'a'.repeat(101),
    'John\tDoe',
    'John\nDoe',
    'Jose\u0301',
    '😀',
    '\u0085张三\u0085',
    '\u001C张三',
    'bad@name',
  ])('rejects invalid input %#', (value) => {
    expect(nicknameSchema.safeParse(value).success).toBe(false)
  })
  it('counts code points after trim, not UTF-16 units', () => {
    const value = '𐐀'.repeat(100)
    expect(value.length).toBe(200)
    expect(nicknameSchema.parse(` ${value} `)).toBe(value)
  })
})
