/** The text of a rendered table, row by row, header first. */
export type TableRows = string[][]

/** Reads the visible text of every cell; whitespace runs become one space. */
export function readTableRows(table: HTMLTableElement): TableRows {
  return Array.from(table.rows, (row) =>
    Array.from(row.cells, (cell) =>
      (cell.textContent ?? '').replace(/\s+/g, ' ').trim(),
    ),
  )
}

/** Tab-separated text: pastes into spreadsheets and plain editors alike. */
export function tableToTsv(rows: TableRows): string {
  return rows.map((row) => row.join('\t')).join('\n')
}

const FORMULA_START = /^[=+\-@]/
const PLAIN_NUMBER = /^[+-]?\d+(?:[.,]\d+)*%?$/

/**
 * Model output is untrusted: a cell a spreadsheet would run as a formula is
 * written as text. Signed numbers stay numbers.
 */
function csvCell(value: string): string {
  const text =
    FORMULA_START.test(value) && !PLAIN_NUMBER.test(value) ? `'${value}` : value
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

export function tableToCsv(rows: TableRows): string {
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

/** A bare table for the clipboard, so documents and sheets paste real cells. */
export function tableToHtml(rows: TableRows): string {
  const [head = [], ...body] = rows
  const line = (cells: string[], tag: 'th' | 'td') =>
    `<tr>${cells.map((cell) => `<${tag}>${escapeHtml(cell)}</${tag}>`).join('')}</tr>`
  return `<table><thead>${line(head, 'th')}</thead><tbody>${body
    .map((row) => line(row, 'td'))
    .join('')}</tbody></table>`
}

/** Copies the table as rich cells with a tab-separated fallback. */
export async function copyTableRows(
  rows: TableRows,
  copyText: (text: string) => Promise<void>,
): Promise<void> {
  const text = tableToTsv(rows)
  if (
    typeof ClipboardItem !== 'undefined' &&
    navigator.clipboard?.write &&
    window.isSecureContext
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([tableToHtml(rows)], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      return
    } catch {
      // Rich copy refused (permissions, unsupported type): copy the text.
    }
  }
  await copyText(text)
}
