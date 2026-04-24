// src/utils/variableResolver.ts
import type { Environment } from '@/types/api'

export class VariableResolver {
  private variables: Map<string, string> = new Map()
  
  constructor(environment?: Environment) {
    if (environment) {
      this.setEnvironment(environment)
    }
  }

  setEnvironment(environment: Environment) {
    this.variables.clear()
    environment.variables.forEach(variable => {
      this.variables.set(variable.key, variable.value)
    })
  }

  setVariables(variables: Record<string, string>) {
    this.variables.clear()
    Object.entries(variables).forEach(([key, value]) => {
      this.variables.set(key, value)
    })
  }

  addVariable(key: string, value: string) {
    this.variables.set(key, value)
  }

  /**
   * 解析文本中的变量引用
   * 支持格式：{{variableName}}
   */
  resolve(text: string): string {
    if (!text || typeof text !== 'string') {
      return text
    }

    // 匹配 {{variableName}} 格式
    return text.replace(/\{\{(\w+)\}\}/g, (match, variableName) => {
      const value = this.variables.get(variableName)
      if (value !== undefined) {
        return value
      }
      
      // 如果变量不存在，保持原样
      console.warn(`Variable "${variableName}" not found in environment`)
      return match
    })
  }

  /**
   * 解析URL中的变量
   */
  resolveUrl(url: string): string {
    return this.resolve(url)
  }

  /**
   * 解析请求头中的变量
   */
  resolveHeaders(headers: Record<string, string>): Record<string, string> {
    const resolved: Record<string, string> = {}
    
    Object.entries(headers).forEach(([key, value]) => {
      resolved[key] = this.resolve(value)
    })
    
    return resolved
  }

  /**
   * 解析请求体中的变量（支持JSON）
   */
  resolveBody(body: any): any {
    if (typeof body === 'string') {
      return this.resolve(body)
    }
    
    if (typeof body === 'object' && body !== null) {
      if (Array.isArray(body)) {
        return body.map(item => this.resolveBody(item))
      } else {
        const resolved: any = {}
        Object.entries(body).forEach(([key, value]) => {
          resolved[key] = this.resolveBody(value)
        })
        return resolved
      }
    }
    
    return body
  }

  /**
   * 验证文本中的变量引用是否都存在
   */
  validate(text: string): ValidationResult {
    const matches = this.extractVariables(text)
    const missingVariables: string[] = []
    
    matches.forEach(variableName => {
      if (!this.variables.has(variableName)) {
        missingVariables.push(variableName)
      }
    })
    
    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      availableVariables: Array.from(this.variables.keys())
    }
  }

  /**
   * 从文本中提取所有变量引用
   */
  extractVariables(text: string): string[] {
    if (!text || typeof text !== 'string') {
      return []
    }

    const matches = text.match(/\{\{(\w+)\}\}/g)
    if (!matches) {
      return []
    }

    return matches.map(match => match.slice(2, -2)) // 移除 {{ 和 }}
  }

  /**
   * 获取所有可用的变量
   */
  getAvailableVariables(): Record<string, string> {
    return Object.fromEntries(this.variables)
  }

  /**
   * 获取变量数量
   */
  getVariableCount(): number {
    return this.variables.size
  }

  /**
   * 检查变量是否存在
   */
  hasVariable(key: string): boolean {
    return this.variables.has(key)
  }

  /**
   * 获取变量值
   */
  getVariable(key: string): string | undefined {
    return this.variables.get(key)
  }

  /**
   * 清空所有变量
   */
  clear() {
    this.variables.clear()
  }
}

export interface ValidationResult {
  isValid: boolean
  missingVariables: string[]
  availableVariables: string[]
}

// 创建全局实例（可选）
export const globalVariableResolver = new VariableResolver()

// 工具函数
export function resolveText(text: string, variables: Record<string, string>): string {
  const resolver = new VariableResolver()
  resolver.setVariables(variables)
  return resolver.resolve(text)
}

export function validateText(text: string, variables: Record<string, string>): ValidationResult {
  const resolver = new VariableResolver()
  resolver.setVariables(variables)
  return resolver.validate(text)
}

export function extractVariables(text: string): string[] {
  const resolver = new VariableResolver()
  return resolver.extractVariables(text)
}