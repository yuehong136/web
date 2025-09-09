// src/api/environment.ts
import { apiClient } from './client'
import type {
  Environment,
  EnvironmentCreate,
  EnvironmentUpdate,
  EnvironmentSummary,
  EnvironmentVariable,
  EnvironmentVariableCreate,
  EnvironmentVariableUpdate,
  GlobalEnvironment,
  APIResponse
} from '@/types/api'

class EnvironmentAPI {
  // 环境管理
  async getEnvironments(params?: EnvironmentQueryParams): Promise<EnvironmentSummary[]> {
    const queryParams = new URLSearchParams()
    queryParams.append('page', (params?.page || 1).toString())
    queryParams.append('page_size', (params?.page_size || 20).toString())
    if (params?.search) queryParams.append('search', params.search)
    if (params?.is_default !== undefined) queryParams.append('is_default', params.is_default.toString())

    const url = `/v1/api_environment/environments?${queryParams.toString()}`
    
    try {
      const paginatedResponse = await apiClient.get<PaginatedEnvironmentResponse>(url)
      
      if (paginatedResponse?.items && Array.isArray(paginatedResponse.items)) {
        // 简化处理，直接返回后端数据，添加兼容性
        const environments = paginatedResponse.items.map(item => ({
          ...item,
          description: item.description || '',
          variables_count: item.variables_count || 0
        }))
        return environments
      }
      return []
    } catch (error) {
      console.error('Failed to fetch environments:', error)
      return []
    }
  }

  async getEnvironment(id: string): Promise<Environment> {
    const response = await apiClient.get<Environment>(`/v1/api_environment/environments/${id}`)
    return this.adaptEnvironmentData(response)
  }

  async createEnvironment(data: EnvironmentCreate): Promise<Environment> {
    const response = await apiClient.post<Environment>('/v1/api_environment/environments', data)
    return this.adaptEnvironmentData(response)
  }

  async updateEnvironment(id: string, data: EnvironmentUpdate): Promise<Environment> {
    const response = await apiClient.put<Environment>(`/v1/api_environment/environments/${id}`, data)
    return this.adaptEnvironmentData(response)
  }

  async deleteEnvironment(id: string): Promise<void> {
    await apiClient.delete<boolean>(`/v1/api_environment/environments/${id}`)
    // apiClient已处理错误检查，成功则无异常抛出
  }

  async duplicateEnvironment(id: string, newName: string): Promise<Environment> {
    // 使用后端提供的复制接口
    const response = await apiClient.post<Environment>(
      `/v1/api_environment/environments/${id}/duplicate`, 
      { new_name: newName }
    )
    return this.adaptEnvironmentData(response)
  }

  async setDefaultEnvironment(id: string): Promise<Environment> {
    const response = await apiClient.post<Environment>(`/v1/api_environment/environments/${id}/set-default`)
    return this.adaptEnvironmentData(response)
  }

  // 环境变量管理
  async createVariable(environmentId: string, data: EnvironmentVariableCreate): Promise<EnvironmentVariable> {
    const response = await apiClient.post<EnvironmentVariable>(
      `/v1/api_environment/environments/${environmentId}/variables`,
      data
    )
    // 添加兼容性字段
    return {
      ...response,
      key: response.key_name,
      value: response.key_value
    }
  }

  async updateVariable(
    environmentId: string,
    variableId: string,
    data: EnvironmentVariableUpdate
  ): Promise<EnvironmentVariable> {
    const response = await apiClient.put<EnvironmentVariable>(
      `/v1/api_environment/environments/${environmentId}/variables/${variableId}`,
      data
    )
    // 添加兼容性字段
    return {
      ...response,
      key: response.key_name,
      value: response.key_value
    }
  }

  async deleteVariable(environmentId: string, variableId: string): Promise<void> {
    await apiClient.delete<boolean>(`/v1/api_environment/environments/${environmentId}/variables/${variableId}`)
    // apiClient已处理错误检查，成功则无异常抛出
  }

  async batchUpdateVariables(
    environmentId: string,
    variables: EnvironmentVariableCreate[]
  ): Promise<EnvironmentVariable[]> {
    const response = await apiClient.put<EnvironmentVariable[]>(
      `/v1/api_environment/environments/${environmentId}/variables/batch`, 
      { variables }
    )
    // 添加兼容性字段
    return response.map(variable => ({
      ...variable,
      key: variable.key_name,
      value: variable.key_value
    }))
  }

  // 全局预设环境
  async getGlobalEnvironments(): Promise<GlobalEnvironment[]> {
    const response = await apiClient.get<GlobalEnvironment[]>('/v1/api_environment/environments/global')
    return response || []
  }

  // 变量解析预览（服务器端）
  async resolveVariablesOnServer(environmentId: string, text: string): Promise<VariableResolveResponse> {
    try {
      const response = await apiClient.post<VariableResolveResponse>(
        `/v1/api_environment/environments/${environmentId}/resolve`,
        { text }
      )
      return response
    } catch (error) {
      // 如果解析失败，返回原始文本
      return {
        resolved_text: text,
        variables_used: [],
        missing_variables: []
      }
    }
  }

  // 环境变量解析
  resolveVariables(text: string, variables: Record<string, string>): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = variables[key]
      return value !== undefined ? value : match
    })
  }

  // 获取环境变量映射 - 适配后端字段
  getVariableMap(environment: Environment): Record<string, string> {
    const map: Record<string, string> = {}
    environment.variables.forEach(variable => {
      // 支持新旧字段格式
      const key = variable.key_name || variable.key
      const value = variable.key_value || variable.value
      map[key] = value
    })
    return map
  }

  // 验证变量引用
  validateVariableReferences(text: string, availableVariables: string[]): { isValid: boolean; missingVariables: string[] } {
    const matches = text.match(/\{\{(\w+)\}\}/g) || []
    const referencedVars = matches.map(match => match.slice(2, -2))
    const missingVariables = referencedVars.filter(varName => !availableVariables.includes(varName))
    
    return {
      isValid: missingVariables.length === 0,
      missingVariables
    }
  }

  // 数据适配器：将后端数据转换为前端兼容格式
  adaptEnvironmentData(backendEnv: any): Environment {
    return {
      ...backendEnv,
      variables: backendEnv.variables?.map((variable: any) => ({
        ...variable,
        // 兼容性字段
        key: variable.key_name,
        value: variable.key_value
      })) || []
    }
  }

  adaptEnvironmentSummaryData(backendSummary: any): EnvironmentSummary {
    return {
      id: backendSummary.id,
      tenant_id: backendSummary.tenant_id,
      name: backendSummary.name,
      description: backendSummary.description,
      is_default: backendSummary.is_default,
      is_global: backendSummary.is_global,
      status: backendSummary.status,
      variables_count: backendSummary.variables_count,
      create_time: backendSummary.create_time,
      update_time: backendSummary.update_time,
      create_date: backendSummary.create_date,
      update_date: backendSummary.update_date
    }
  }

  // 从OpenAPI规范提取服务器环境
  extractServersFromOpenAPI(openApiSpec: any): GlobalEnvironment[] {
    if (!openApiSpec.servers || !Array.isArray(openApiSpec.servers)) {
      return []
    }

    return openApiSpec.servers.map((server: any, index: number) => ({
      id: -index - 1, // 负数ID表示临时环境
      name: server.description || `Server ${index + 1}`,
      description: server.description,
      server_url: server.url,
      variables: server.variables || {},
      is_active: true
    }))
  }
}

export const environmentAPI = new EnvironmentAPI()