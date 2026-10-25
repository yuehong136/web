import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { extractTableColumns } from '../table-column-extract'

describe('table header extraction', () => {
  it.each(['xls', 'xlsx'])(
    'reuses the patched pure parser for real %s bytes without creating a preview',
    async (extension) => {
      const bytes = Uint8Array.from(
        readFileSync(
          `src/pages/knowledge/documents/__tests__/fixtures/headers.${extension}`,
        ),
      )
      const file = new File([bytes], `headers.${extension}`)
      Object.defineProperty(file, 'arrayBuffer', {
        value: async () => bytes.buffer,
      })
      expect(await extractTableColumns(file)).toEqual(['shared', 'a.b', '区域'])
      expect(document.querySelector('.vue-office-excel')).toBeNull()
    },
  )
  it('preserves quoted and dotted column names and reads only the header', async () => {
    expect(
      await extractTableColumns(
        new File(['"full,name",a.b,区域\nprivate,2,3'], 'table.csv'),
      ),
    ).toEqual(['full,name', 'a.b', '区域'])
  })
  it('rejects ambiguous duplicate names instead of silently assigning different columns one role', async () => {
    await expect(
      extractTableColumns(new File(['a,a\n1,2'], 'table.csv')),
    ).rejects.toThrow()
    await expect(
      extractTableColumns(new File(['\n'], 'empty.csv')),
    ).rejects.toThrow()
  })
})
