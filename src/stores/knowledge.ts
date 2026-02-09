import { create } from 'zustand'
import { knowledgeAPI } from '@/api/knowledge'
import { generateId } from '@/lib/utils'
import type { 
  KnowledgeBase, 
  CreateKBRequest,
  UpdateKBRequest,
  Document
} from '../types/api'

interface KnowledgeState {
  // 状态
  knowledgeBases: KnowledgeBase[]
  currentKnowledgeBase: KnowledgeBase | null
  documents: Document[]
  isLoading: boolean
  searchQuery: string
  total: number
  
  // 知识库管理
  loadKnowledgeBases: (params?: {
    page?: number
    page_size?: number
    orderby?: string
    desc?: boolean
    keywords?: string
    owner_ids?: string[]
    filter_params?: {
      permissions?: string[]
      languages?: string[]
      parser_ids?: string[]
      embd_ids?: string[]
      doc_num_range?: [number, number]
      time_range?: string
    }
  }) => Promise<void>
  createKnowledgeBase: (data: CreateKBRequest) => Promise<KnowledgeBase>
  updateKnowledgeBase: (data: UpdateKBRequest) => Promise<void>
  deleteKnowledgeBase: (id: string) => Promise<void>
  getKnowledgeBase: (id: string) => Promise<KnowledgeBase | null>
  
  // 文档管理
  loadDocuments: (knowledgeBaseId: string) => Promise<void>
  uploadDocument: (knowledgeBaseId: string, file: File, metadata?: any) => Promise<Document>
  deleteDocument: (documentId: string) => Promise<void>
  
  // 搜索和筛选
  setSearchQuery: (query: string) => void
  searchDocuments: (knowledgeBaseId: string, query: string) => Promise<Document[]>
  
  // 工具方法
  setLoading: (loading: boolean) => void
  setCurrentKnowledgeBase: (kb: KnowledgeBase | null) => void
  clearDocuments: () => void
}

export const useKnowledgeStore = create<KnowledgeState>()(
  (set, get) => ({
      // 初始状态
      knowledgeBases: [],
      currentKnowledgeBase: null,
      documents: [],
      isLoading: false,
      searchQuery: '',
      total: 0,
      
      // 上传文档
      uploadDocument: async (knowledgeBaseId: string, file: File, metadata?: any): Promise<Document> => {
        try {
          const uploadedDocs = await knowledgeAPI.document.upload(knowledgeBaseId, [file], metadata)
          
          // 确保返回的文档符合 Document 类型，只更新 documents 为实际上传的文档
          set(state => ({
            documents: [...uploadedDocs as unknown as Document[], ...state.documents]
          }))

          return uploadedDocs[0] as unknown as Document
        } catch (error) {
          console.error('Failed to upload document:', error)
          throw error
        }
      },

      // 加载知识库列表
      loadKnowledgeBases: async (params) => {
        try {
          set({ isLoading: true })
          console.log('Store: calling API with params:', params)
          const response = await knowledgeAPI.knowledgeBase.list(params)
          console.log('Store: API response:', response)

          // 后端在 page_size 很大时可能返回空列表，这里兜底重试一次第一页全量
          if (response.kbs.length === 0 && response.total > 0) {
            const fallbackPageSize = Math.max(response.total, params?.page_size ?? 12)
            const retry = await knowledgeAPI.knowledgeBase.list({
              ...params,
              page: 1,
              page_size: fallbackPageSize,
            })
            set({
              knowledgeBases: retry.kbs,
              total: retry.total,
              isLoading: false,
            })
            return
          }

          set({ 
            knowledgeBases: response.kbs,
            total: response.total,
            isLoading: false 
          })
        } catch (error) {
          console.error('Failed to load knowledge bases:', error)
          set({ isLoading: false })
          
          // 创建更多模拟数据用于演示分页功能
          const allMockKnowledgeBases: KnowledgeBase[] = [
            {
              id: '1',
              avatar: null,
              name: '产品文档',
              language: 'Chinese',
              description: '产品相关的技术文档和用户手册',
              tenant_id: 'tenant1',
              permission: 'me',
              doc_num: 25,
              token_num: 50000,
              chunk_num: 300,
              parser_id: 'naive',
              embd_id: 'text-embedding-ada-002',
              nickname: 'admin',
              tenant_avatar: null,
              update_time: Date.now() - 1 * 24 * 60 * 60 * 1000
            },
            {
              id: '2',
              avatar: null,
              name: '客服知识库',
              language: 'Chinese',
              description: '客户服务常见问题和解决方案',
              tenant_id: 'tenant1',
              permission: 'me',
              doc_num: 15,
              token_num: 30000,
              chunk_num: 150,
              parser_id: 'naive',
              embd_id: 'text-embedding-ada-002',
              nickname: 'admin',
              tenant_avatar: null,
              update_time: Date.now() - 2 * 60 * 60 * 1000
            },
            {
              id: '3',
              avatar: null,
              name: '研发文档',
              language: 'English',
              description: '技术研发相关的设计文档和API文档',
              tenant_id: 'tenant1',
              permission: 'me',
              doc_num: 42,
              token_num: 80000,
              chunk_num: 400,
              parser_id: 'naive',
              embd_id: 'text-embedding-ada-002',
              nickname: 'admin',
              tenant_avatar: null,
              update_time: Date.now() - 6 * 60 * 60 * 1000
            },
            // 添加更多模拟数据以展示分页
            ...Array.from({ length: 20 }, (_, i) => ({
              id: `mock-${i + 4}`,
              avatar: null,
              name: `知识库 ${i + 4}`,
              language: 'Chinese' as const,
              description: `这是第 ${i + 4} 个模拟知识库，用于测试分页功能`,
              tenant_id: 'tenant1',
              permission: 'me' as const,
              doc_num: Math.floor(Math.random() * 50),
              token_num: Math.floor(Math.random() * 100000),
              chunk_num: Math.floor(Math.random() * 500),
              parser_id: 'naive',
              embd_id: 'text-embedding-ada-002',
              nickname: 'admin',
              tenant_avatar: null,
              update_time: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
            }))
          ]

          // 模拟分页逻辑
          // 与真实接口保持一致：UI 使用 1 基页码，这里转为 0 基索引
          const page = Math.max((params?.page ?? 1) - 1, 0)
          const pageSize = params?.page_size || 12
          const keywords = params?.keywords || ''
          const filterParams = params?.filter_params
          
          // 模拟搜索过滤
          let filteredData = allMockKnowledgeBases
          if (keywords) {
            filteredData = allMockKnowledgeBases.filter(kb =>
              kb.name.toLowerCase().includes(keywords.toLowerCase()) ||
              kb.description?.toLowerCase().includes(keywords.toLowerCase())
            )
          }

          // 模拟后端 filter_params 过滤
          if (filterParams?.permissions?.length) {
            filteredData = filteredData.filter((kb) =>
              filterParams.permissions?.includes(kb.permission)
            )
          }
          if (filterParams?.languages?.length) {
            filteredData = filteredData.filter((kb) =>
              kb.language && filterParams.languages?.includes(kb.language)
            )
          }
          if (filterParams?.parser_ids?.length) {
            filteredData = filteredData.filter((kb) =>
              filterParams.parser_ids?.includes(kb.parser_id)
            )
          }
          if (filterParams?.embd_ids?.length) {
            filteredData = filteredData.filter((kb) =>
              filterParams.embd_ids?.includes(kb.embd_id)
            )
          }
          
          // 模拟分页
          const startIndex = page * pageSize
          const endIndex = startIndex + pageSize
          const paginatedData = filteredData.slice(startIndex, endIndex)
          
          set({ 
            knowledgeBases: paginatedData,
            total: filteredData.length,
            isLoading: false 
          })
        }
      },

      // 创建知识库
      createKnowledgeBase: async (data: CreateKBRequest) => {
        try {
          console.log('调用创建知识库API:', data)
          const response = await knowledgeAPI.knowledgeBase.create(data)
          console.log('创建知识库API响应:', response)
          
          // 重新加载知识库列表
          await get().loadKnowledgeBases()
          
          // 返回新创建的知识库
          const newKB = get().knowledgeBases.find(kb => kb.id === response.kb_id)
          return newKB as KnowledgeBase
        } catch (error) {
          console.error('Failed to create knowledge base:', error)
          
          // 创建模拟知识库（匹配实际API格式）
          const mockKB: KnowledgeBase = {
            id: generateId(),
            avatar: null,
            name: data.name,
            language: data.language || 'Chinese',
            description: data.description,
            tenant_id: 'tenant1',
            permission: data.permission || 'me',
            doc_num: 0,
            token_num: 0,
            chunk_num: 0,
            parser_id: data.parser_id || 'naive',
            embd_id: data.embd_id || 'text-embedding-ada-002',
            nickname: 'admin',
            tenant_avatar: null,
            update_time: Date.now()
          }
          
          set(state => ({
            knowledgeBases: [mockKB, ...state.knowledgeBases],
            total: state.total + 1
          }))

          return mockKB
        }
      },

      // 更新知识库
      updateKnowledgeBase: async (data: UpdateKBRequest) => {
        try {
          await knowledgeAPI.knowledgeBase.update(data)

          // 过滤掉 null 值，只更新有效字段
          const updates = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
          )

          set(state => ({
            knowledgeBases: state.knowledgeBases.map(kb =>
              kb.id === data.kb_id 
                ? { ...kb, ...updates, update_time: Date.now() } as KnowledgeBase
                : kb
            ),
            currentKnowledgeBase: state.currentKnowledgeBase?.id === data.kb_id
              ? { ...state.currentKnowledgeBase, ...updates, update_time: Date.now() } as KnowledgeBase
              : state.currentKnowledgeBase
          }))
        } catch (error) {
          console.error('Failed to update knowledge base:', error)
          
          // 本地更新
          const updates = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
          )

          set(state => ({
            knowledgeBases: state.knowledgeBases.map(kb =>
              kb.id === data.kb_id 
                ? { ...kb, ...updates, update_time: Date.now() } as KnowledgeBase
                : kb
            ),
            currentKnowledgeBase: state.currentKnowledgeBase?.id === data.kb_id
              ? { ...state.currentKnowledgeBase, ...updates, update_time: Date.now() } as KnowledgeBase
              : state.currentKnowledgeBase
          }))
        }
      },

      // 删除知识库
      deleteKnowledgeBase: async (id: string) => {
        try {
          await knowledgeAPI.knowledgeBase.delete(id)
        } catch (error) {
          console.error('Failed to delete knowledge base:', error)
        }

        set(state => ({
          knowledgeBases: state.knowledgeBases.filter(kb => kb.id !== id),
          total: state.total - 1,
          currentKnowledgeBase: state.currentKnowledgeBase?.id === id
            ? null
            : state.currentKnowledgeBase
        }))
      },

      // 获取单个知识库
      getKnowledgeBase: async (id: string) => {
        try {
          const kb = await knowledgeAPI.knowledgeBase.get(id)
          
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
          const response = await knowledgeAPI.document.list({
            kb_id: knowledgeBaseId,
            page: 1,
            page_size: 100,
            filter_params: {}
          })
          
          set({ 
            documents: response.docs,
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

      // 删除文档
      deleteDocument: async (documentId: string | string[]) => {
        try {
          const docIds = Array.isArray(documentId) ? documentId : [documentId]
          await knowledgeAPI.document.delete(docIds)
          
          set(state => ({
            documents: state.documents.filter(doc => !docIds.includes(doc.id))
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
          const response = await knowledgeAPI.document.list({
            kb_id: knowledgeBaseId,
            keywords: query,
            page: 1,
            page_size: 20,
            filter_params: {}
          })

          return response.docs
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
      setCurrentKnowledgeBase: (kb: KnowledgeBase | null) => {
        set({ currentKnowledgeBase: kb })
      },

      // 清空文档列表
      clearDocuments: () => {
        set({ documents: [] })
      },
    })
)
