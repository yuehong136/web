import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '../api/client'
import { generateId } from '../lib/utils'
import type { 
  KnowledgeBaseInfo, 
  KnowledgeBaseCreateRequest,
  KnowledgeBaseUpdateRequest,
  DocumentInfo
} from '../types/api'

interface KnowledgeState {
  // 状态
  knowledgeBases: KnowledgeBaseInfo[]
  currentKnowledgeBase: KnowledgeBaseInfo | null
  documents: DocumentInfo[]
  isLoading: boolean
  searchQuery: string
  
  // 知识库管理
  loadKnowledgeBases: () => Promise<void>
  createKnowledgeBase: (data: KnowledgeBaseCreateRequest) => Promise<KnowledgeBaseInfo>
  updateKnowledgeBase: (id: string, data: KnowledgeBaseUpdateRequest) => Promise<void>
  deleteKnowledgeBase: (id: string) => Promise<void>
  getKnowledgeBase: (id: string) => Promise<KnowledgeBaseInfo | null>
  
  // 文档管理
  loadDocuments: (knowledgeBaseId: string) => Promise<void>
  uploadDocument: (knowledgeBaseId: string, file: File, metadata?: any) => Promise<DocumentInfo>
  deleteDocument: (documentId: string) => Promise<void>
  
  // 搜索和筛选
  setSearchQuery: (query: string) => void
  searchDocuments: (knowledgeBaseId: string, query: string) => Promise<DocumentInfo[]>
  
  // 工具方法
  setLoading: (loading: boolean) => void
  setCurrentKnowledgeBase: (kb: KnowledgeBaseInfo | null) => void
  clearDocuments: () => void
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set, get) => ({
      // 初始状态
      knowledgeBases: [],
      currentKnowledgeBase: null,
      documents: [],
      isLoading: false,
      searchQuery: '',

      // 加载知识库列表
      loadKnowledgeBases: async () => {
        try {
          set({ isLoading: true })
          const response = await apiClient.get<{
            knowledge_bases: KnowledgeBaseInfo[]
          }>('/knowledge-bases')
          
          set({ 
            knowledgeBases: response.data.knowledge_bases,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load knowledge bases:', error)
          set({ isLoading: false })
          
          // 创建一些模拟数据用于演示
          const mockKnowledgeBases: KnowledgeBaseInfo[] = [
            {
              id: '1',
              name: '产品文档',
              description: '产品相关的技术文档和用户手册',
              documentCount: 25,
              vectorDimension: 1536,
              embeddingModel: 'text-embedding-ada-002',
              chunkSize: 1000,
              chunkOverlap: 200,
              status: 'ready',
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '2',
              name: '客服知识库',
              description: '客户服务常见问题和解决方案',
              documentCount: 15,
              vectorDimension: 1536,
              embeddingModel: 'text-embedding-ada-002',
              chunkSize: 800,
              chunkOverlap: 150,
              status: 'processing',
              createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
            },
            {
              id: '3',
              name: '研发文档',
              description: '技术研发相关的设计文档和API文档',
              documentCount: 42,
              vectorDimension: 1536,
              embeddingModel: 'text-embedding-ada-002',
              chunkSize: 1200,
              chunkOverlap: 300,
              status: 'ready',
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
            }
          ]
          
          set({ 
            knowledgeBases: mockKnowledgeBases,
            isLoading: false 
          })
        }
      },

      // 创建知识库
      createKnowledgeBase: async (data: KnowledgeBaseCreateRequest) => {
        try {
          const response = await apiClient.post<{
            knowledge_base: KnowledgeBaseInfo
          }>('/knowledge-bases', data)

          const newKB = response.data.knowledge_base
          
          set(state => ({
            knowledgeBases: [newKB, ...state.knowledgeBases]
          }))

          return newKB
        } catch (error) {
          console.error('Failed to create knowledge base:', error)
          
          // 创建模拟知识库
          const mockKB: KnowledgeBaseInfo = {
            id: generateId(),
            name: data.name,
            description: data.description,
            documentCount: 0,
            vectorDimension: data.vectorDimension || 1536,
            embeddingModel: data.embeddingModel || 'text-embedding-ada-002',
            chunkSize: data.chunkSize || 1000,
            chunkOverlap: data.chunkOverlap || 200,
            status: 'ready',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          set(state => ({
            knowledgeBases: [mockKB, ...state.knowledgeBases]
          }))

          return mockKB
        }
      },

      // 更新知识库
      updateKnowledgeBase: async (id: string, data: KnowledgeBaseUpdateRequest) => {
        try {
          const response = await apiClient.put<{
            knowledge_base: KnowledgeBaseInfo
          }>(`/knowledge-bases/${id}`, data)

          const updatedKB = response.data.knowledge_base

          set(state => ({
            knowledgeBases: state.knowledgeBases.map(kb =>
              kb.id === id ? updatedKB : kb
            ),
            currentKnowledgeBase: state.currentKnowledgeBase?.id === id
              ? updatedKB
              : state.currentKnowledgeBase
          }))
        } catch (error) {
          console.error('Failed to update knowledge base:', error)
          
          // 本地更新
          set(state => ({
            knowledgeBases: state.knowledgeBases.map(kb =>
              kb.id === id 
                ? { ...kb, ...data, updatedAt: new Date().toISOString() }
                : kb
            ),
            currentKnowledgeBase: state.currentKnowledgeBase?.id === id
              ? { ...state.currentKnowledgeBase, ...data, updatedAt: new Date().toISOString() }
              : state.currentKnowledgeBase
          }))
        }
      },

      // 删除知识库
      deleteKnowledgeBase: async (id: string) => {
        try {
          await apiClient.delete(`/knowledge-bases/${id}`)
        } catch (error) {
          console.error('Failed to delete knowledge base:', error)
        }

        set(state => ({
          knowledgeBases: state.knowledgeBases.filter(kb => kb.id !== id),
          currentKnowledgeBase: state.currentKnowledgeBase?.id === id
            ? null
            : state.currentKnowledgeBase
        }))
      },

      // 获取单个知识库
      getKnowledgeBase: async (id: string) => {
        try {
          const response = await apiClient.get<{
            knowledge_base: KnowledgeBaseInfo
          }>(`/knowledge-bases/${id}`)

          const kb = response.data.knowledge_base
          
          set({ currentKnowledgeBase: kb })
          return kb
        } catch (error) {
          console.error('Failed to get knowledge base:', error)
          
          // 从本地状态中查找
          const kb = get().knowledgeBases.find(kb => kb.id === id) || null
          set({ currentKnowledgeBase: kb })
          return kb
        }
      },

      // 加载文档列表
      loadDocuments: async (knowledgeBaseId: string) => {
        try {
          set({ isLoading: true })
          const response = await apiClient.get<{
            documents: DocumentInfo[]
          }>(`/knowledge-bases/${knowledgeBaseId}/documents`)
          
          set({ 
            documents: response.data.documents,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load documents:', error)
          set({ 
            documents: [],
            isLoading: false 
          })
        }
      },

      // 上传文档
      uploadDocument: async (knowledgeBaseId: string, file: File, metadata = {}) => {
        try {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('metadata', JSON.stringify(metadata))

          const response = await apiClient.upload<{
            document: DocumentInfo
          }>(`/knowledge-bases/${knowledgeBaseId}/documents`, formData)

          const newDoc = response.data.document
          
          set(state => ({
            documents: [newDoc, ...state.documents]
          }))

          return newDoc
        } catch (error) {
          console.error('Failed to upload document:', error)
          throw error
        }
      },

      // 删除文档
      deleteDocument: async (documentId: string) => {
        try {
          await apiClient.delete(`/documents/${documentId}`)
          
          set(state => ({
            documents: state.documents.filter(doc => doc.id !== documentId)
          }))
        } catch (error) {
          console.error('Failed to delete document:', error)
          throw error
        }
      },

      // 设置搜索查询
      setSearchQuery: (query: string) => {
        set({ searchQuery: query })
      },

      // 搜索文档
      searchDocuments: async (knowledgeBaseId: string, query: string) => {
        try {
          const response = await apiClient.post<{
            documents: DocumentInfo[]
          }>(`/knowledge-bases/${knowledgeBaseId}/search`, {
            query,
            limit: 20
          })

          return response.data.documents
        } catch (error) {
          console.error('Failed to search documents:', error)
          return []
        }
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 设置当前知识库
      setCurrentKnowledgeBase: (kb: KnowledgeBaseInfo | null) => {
        set({ currentKnowledgeBase: kb })
      },

      // 清空文档列表
      clearDocuments: () => {
        set({ documents: [] })
      },
    }),
    {
      name: 'knowledge-storage',
      // 只持久化知识库列表
      partialize: (state) => ({
        knowledgeBases: state.knowledgeBases,
      }),
    }
  )
)