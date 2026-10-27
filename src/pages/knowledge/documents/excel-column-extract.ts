import { readTableHeaderWorkbook } from '@js-preview/excel'

/** The existing preview package exposes its bundled parser via patch-package. */
export async function extractExcelColumns(file: File): Promise<string[]> {
  const workbook = readTableHeaderWorkbook(await file.arrayBuffer())
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error('Missing worksheet')
  const merges = sheet['!merges']
  if (Array.isArray(merges) && merges.some((range) => range?.s?.r <= 1)) {
    throw new Error('Complex spreadsheet headers need parser configuration')
  }
  // Cell addresses sort by column width first (A..Z, AA..AZ), then alphabetically.
  const columns = Object.keys(sheet)
    .filter((address) => /^[A-Z]+1$/.test(address))
    .sort((a, b) => a.length - b.length || a.localeCompare(b))
    .map((address) => {
      const cell = sheet[address]
      return cell && typeof cell === 'object' && 'v' in cell
        ? String(cell.v ?? '').trim()
        : ''
    })
    .filter(Boolean)
  if (!columns.length || new Set(columns).size !== columns.length) {
    throw new Error('Invalid spreadsheet headers')
  }
  return columns
}
