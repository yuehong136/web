import { apiClient } from './client'

export interface ProcessDocxResponse {
  placeholders: Record<string, string>
  file: string
}

export const documentAPI = {
  processDocx: async (file: File, mapping?: Record<string, any>): Promise<ProcessDocxResponse> => {
    const data = mapping ? JSON.stringify(mapping) : undefined
    return apiClient.upload<ProcessDocxResponse>('/custom/process_docx', file, data ? { data } : undefined)
  },

  fillDocx: async (file: File, fillData: Record<string, any>): Promise<{ file: string }> => {
    return apiClient.upload('/custom/fill_docx', file, { data: JSON.stringify(fillData) })
  },
}

