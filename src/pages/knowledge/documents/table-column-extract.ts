import Papa from 'papaparse'

function headers(values: unknown[]): string[] {
  const names = values.map((value) => String(value ?? ''))
  const present = names
  if (
    !present.length ||
    present.some((name) => !name.trim()) ||
    new Set(present).size !== present.length
  ) {
    throw new Error('Invalid table headers')
  }
  return present
}

/** Read only CSV's first record. Duplicate names cannot represent distinct roles. */
export function extractCsvColumns(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      preview: 1,
      delimiter: ',',
      complete(result) {
        try {
          if (
            result.errors.some(({ code }) => code !== 'UndetectableDelimiter')
          ) {
            throw new Error('Invalid CSV')
          }
          resolve(headers(result.data[0] ?? []))
        } catch (error) {
          reject(error)
        }
      },
      error: reject,
    })
  })
}

export async function extractTableColumns(file: File): Promise<string[]> {
  if (/\.csv$/i.test(file.name)) return extractCsvColumns(file)
  if (!/\.xlsx?$/i.test(file.name)) return []
  // Reuse the lazy Excel preview package and its workbook transform hook.
  // No second spreadsheet engine or new bundle dependency is needed.
  const { extractExcelColumns } = await import('./excel-column-extract')
  return extractExcelColumns(file)
}
