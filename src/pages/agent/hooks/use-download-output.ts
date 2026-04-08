import { useFetchAgent } from './use-fetch-data'
import get from 'lodash/get.js'
import isEmpty from 'lodash/isEmpty.js'
import { useCallback } from 'react'

export interface ITraceData {
  component_id: string
  trace: Array<{ message?: string }>
}

export function downloadJsonFile(data: unknown, filename: string) {
  const jsonStr = JSON.stringify(data, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function findEndOutput(list?: ITraceData[]) {
  if (Array.isArray(list)) {
    const trace = list.find((x) => x.component_id === 'END')?.trace

    const str = get(trace, '0.message') as string | undefined

    try {
      if (!isEmpty(str) && str) {
        const json = JSON.parse(str)
        return json
      }
    } catch (error) {
      console.error('Failed to parse end output:', error)
    }
  }
}

export function isEndOutputEmpty(list?: ITraceData[]) {
  return isEmpty(findEndOutput(list))
}

export function useDownloadOutput(data?: ITraceData[]) {
  const { data: agent } = useFetchAgent()

  const handleDownloadJson = useCallback(() => {
    const output = findEndOutput(data)
    if (!isEndOutputEmpty(data)) {
      downloadJsonFile(output, `${agent?.title || 'output'}.json`)
    }
  }, [agent?.title, data])

  return {
    handleDownloadJson,
  }
}
