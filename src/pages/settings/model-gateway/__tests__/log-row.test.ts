import { expect, it } from 'vitest'
import { rowTime } from '../components/logs/log-row'

const at = (day: number, hour: number) => new Date(2026, 10, day, hour, 5, 9)

it("shows only the time of day for today's calls", () => {
  expect(rowTime(at(24, 8).toISOString(), at(24, 20))).toMatch(/^08:05:09$/)
})

it('leads with the date for calls of an earlier day', () => {
  const text = rowTime(at(23, 8).toISOString(), at(24, 7))
  expect(text).toContain('23')
  expect(text).toContain('08:05:09')
  expect(text).not.toBe('08:05:09')
})

it('shows a dash without a start time', () => {
  expect(rowTime(null)).toBe('-')
})
