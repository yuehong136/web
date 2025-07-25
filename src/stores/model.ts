import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { apiClient } from '@/api/client'

// 根据您提供的数据结构定义类型
export interface MyLLMModel {
  type: 'chat' | 'embedding' | 'rerank' | 'image2text' | 'tts' | 'speech2text'
  name: string
  used_token: number
}

export interface MyLLMProvider {
  [providerName: string]: {
    tags: string
    llm: MyLLMModel[]
  }
}

export const LLMFactory = {
  TongYiQianWen: 'Tongyi-Qianwen',
  Moonshot: 'Moonshot',
  OpenAI: 'OpenAI',
  ZhipuAI: 'ZHIPU-AI',
  WenXinYiYan: '文心一言',
  Ollama: 'Ollama',
  Xinference: 'Xinference',
  ModelScope: 'ModelScope',
  DeepSeek: 'DeepSeek',
  VolcEngine: 'VolcEngine',
  BaiChuan: 'BaiChuan',
  Jina: 'Jina',
  MiniMax: 'MiniMax',
  Mistral: 'Mistral',
  AzureOpenAI: 'Azure-OpenAI',
  Bedrock: 'Bedrock',
  Gemini: 'Gemini',
  Groq: 'Groq',
  OpenRouter: 'OpenRouter',
  LocalAI: 'LocalAI',
  StepFun: 'StepFun',
  NVIDIA: 'NVIDIA',
  LMStudio: 'LM-Studio',
  OpenAiAPICompatible: 'OpenAI-API-Compatible',
  Cohere: 'Cohere',
  LeptonAI: 'LeptonAI',
  TogetherAI: 'TogetherAI',
  PerfXCloud: 'PerfXCloud',
  Upstage: 'Upstage',
  NovitaAI: 'NovitaAI',
  SILICONFLOW: 'SILICONFLOW',
  PPIO: 'PPIO',
  ZeroOneAI: '01.AI',
  Replicate: 'Replicate',
  TencentHunYuan: 'Tencent Hunyuan',
  XunFeiSpark: 'XunFei Spark',
  BaiduYiYan: 'BaiduYiyan',
  FishAudio: 'Fish Audio',
  TencentCloud: 'Tencent Cloud',
  Anthropic: 'Anthropic',
  VoyageAI: 'Voyage AI',
  GoogleCloud: 'Google Cloud',
  HuggingFace: 'HuggingFace',
  YouDao: 'Youdao',
  BAAI: 'BAAI',
  NomicAI: 'nomic-ai',
  JinaAI: 'jinaai',
  SentenceTransformers: 'sentence-transformers',
  GPUStack: 'GPUStack',
  VLLM: 'VLLM',
  GiteeAI: 'GiteeAI',
} as const

export const IconMap = {
  [LLMFactory.TongYiQianWen]: 'tongyi',
  [LLMFactory.Moonshot]: 'moonshot',
  [LLMFactory.OpenAI]: 'openai',
  [LLMFactory.ZhipuAI]: 'zhipu',
  [LLMFactory.WenXinYiYan]: 'wenxin',
  [LLMFactory.Ollama]: 'ollama',
  [LLMFactory.Xinference]: 'xinference',
  [LLMFactory.ModelScope]: 'modelscope',
  [LLMFactory.DeepSeek]: 'deepseek',
  [LLMFactory.VolcEngine]: 'volc_engine',
  [LLMFactory.BaiChuan]: 'baichuan',
  [LLMFactory.Jina]: 'jina',
  [LLMFactory.MiniMax]: 'chat-minimax',
  [LLMFactory.Mistral]: 'mistral',
  [LLMFactory.AzureOpenAI]: 'azure',
  [LLMFactory.Bedrock]: 'bedrock',
  [LLMFactory.Gemini]: 'gemini',
  [LLMFactory.Groq]: 'groq-next',
  [LLMFactory.OpenRouter]: 'open-router',
  [LLMFactory.LocalAI]: 'local-ai',
  [LLMFactory.StepFun]: 'stepfun',
  [LLMFactory.NVIDIA]: 'nvidia',
  [LLMFactory.LMStudio]: 'lm-studio',
  [LLMFactory.OpenAiAPICompatible]: 'openai-api',
  [LLMFactory.Cohere]: 'cohere',
  [LLMFactory.LeptonAI]: 'lepton-ai',
  [LLMFactory.TogetherAI]: 'together-ai',
  [LLMFactory.PerfXCloud]: 'perfx-cloud',
  [LLMFactory.Upstage]: 'upstage',
  [LLMFactory.NovitaAI]: 'novita-ai',
  [LLMFactory.SILICONFLOW]: 'siliconflow',
  [LLMFactory.PPIO]: 'ppio',
  [LLMFactory.ZeroOneAI]: 'yi',
  [LLMFactory.Replicate]: 'replicate',
  [LLMFactory.TencentHunYuan]: 'hunyuan',
  [LLMFactory.XunFeiSpark]: 'spark',
  [LLMFactory.BaiduYiYan]: 'yiyan',
  [LLMFactory.FishAudio]: 'fish-audio',
  [LLMFactory.TencentCloud]: 'tencent-cloud',
  [LLMFactory.Anthropic]: 'anthropic',
  [LLMFactory.VoyageAI]: 'voyage',
  [LLMFactory.GoogleCloud]: 'google-cloud',
  [LLMFactory.HuggingFace]: 'huggingface',
  [LLMFactory.YouDao]: 'youdao',
  [LLMFactory.BAAI]: 'baai',
  [LLMFactory.NomicAI]: 'nomic-ai',
  [LLMFactory.JinaAI]: 'jina',
  [LLMFactory.SentenceTransformers]: 'sentence-transformers',
  [LLMFactory.GPUStack]: 'gpustack',
  [LLMFactory.VLLM]: 'vllm',
  [LLMFactory.GiteeAI]: 'gitee-ai',
};

export interface LLMFactoryInterface {
  name: string
  logo: string
  tags: string
  status: string
  id: string
  create_date: string
  update_date: string
  create_time: number
  update_time: number
  model_types: string[]
}

interface ModelState {
  // 状态
  myLLMs: MyLLMProvider
  factories: LLMFactoryInterface[]
  isLoading: boolean
  selectedProvider: string | null
  
  // 动作
  loadMyLLMs: () => Promise<void>
  loadFactories: () => Promise<void>
  addProvider: (providerId: string) => Promise<void>
  removeProvider: (providerName: string) => Promise<void>
  updateProviderConfig: (providerId: string, config: any) => Promise<void>
  setApiKey: (llmFactory: string, apiKey: string, baseUrl?: string) => Promise<void>
  
  // 工具方法
  setLoading: (loading: boolean) => void
  setSelectedProvider: (provider: string | null) => void
  getProviderByName: (name: string) => MyLLMProvider[string] | null
  getTotalModels: () => number
  getTotalTokens: () => number
}

export const useModelStore = create<ModelState>()(
  persist(
    (set, get) => ({
      // 初始状态
      myLLMs: {},
      factories: [],
      isLoading: false,
      selectedProvider: null,

      // 加载我的模型供应商
      loadMyLLMs: async () => {
        try {
          set({ isLoading: true })
          const response = await apiClient.get('/llm/my_llms')
          
          console.log('loadMyLLMs API response:', response)
          
          // apiClient已经处理了错误情况，这里直接使用返回的数据
          set({ 
            myLLMs: response || {},
            isLoading: false 
          })
        } catch (error: any) {
          console.error('Failed to load my LLMs:', error)
          set({ isLoading: false })
          
          // 处理认证错误
          if (error?.status === 401) {
            const { useAuthStore } = await import('./auth')
            const authStore = useAuthStore.getState()
            await authStore.logout()
            window.location.href = '/auth/login'
            return
          }
          
          // 创建模拟数据用于开发测试
          const mockMyLLMs: MyLLMProvider = {
            "BAAI": {
              "tags": "TEXT EMBEDDING, TEXT RE-RANK",
              "llm": [
                {
                  "type": "rerank",
                  "name": "BAAI/bge-reranker-v2-m3",
                  "used_token": 0
                },
                {
                  "type": "embedding",
                  "name": "BAAI/bge-large-zh-v1.5",
                  "used_token": 0
                }
              ]
            },
            "Tencent Hunyuan": {
              "tags": "LLM,IMAGE2TEXT",
              "llm": [
                {
                  "type": "chat",
                  "name": "hunyuan-turbos-latest",
                  "used_token": 341
                },
                {
                  "type": "chat",
                  "name": "hunyuan-turbos-longtext-128k-20250325",
                  "used_token": 231
                },
                {
                  "type": "chat",
                  "name": "hunyuan-standard",
                  "used_token": 553
                },
                {
                  "type": "chat",
                  "name": "hunyuan-lite",
                  "used_token": 0
                },
                {
                  "type": "chat",
                  "name": "hunyuan-large",
                  "used_token": 0
                },
                {
                  "type": "image2text",
                  "name": "hunyuan-vision",
                  "used_token": 0
                },
                {
                  "type": "chat",
                  "name": "hunyuan-t1-latest",
                  "used_token": 1351
                }
              ]
            }
          }
          
          set({ 
            myLLMs: mockMyLLMs,
            isLoading: false 
          })
        }
      },

      // 加载可用的模型工厂
      loadFactories: async () => {
        try {
          set({ isLoading: true })
          const response = await apiClient.get('/llm/factories')
          
          console.log('loadFactories API response:', response)
          
          // apiClient已经处理了错误情况，这里直接使用返回的数据
          set({ 
            factories: response || [],
            isLoading: false 
          })
        } catch (error: any) {
          console.error('Failed to load factories:', error)
          set({ isLoading: false })
          
          // 处理认证错误
          if (error?.status === 401) {
            const { useAuthStore } = await import('./auth')
            const authStore = useAuthStore.getState()
            await authStore.logout()
            window.location.href = '/auth/login'
            return
          }
          
          // 创建模拟数据用于开发测试
          const mockFactories: LLMFactoryInterface[] = [
            {
              "name": "OpenAI",
              "logo": "",
              "tags": "LLM,TEXT EMBEDDING,TTS,TEXT RE-RANK,SPEECH2TEXT,MODERATION",
              "status": "1",
              "id": "1f0c51a2-fd08-4497-a3a0-2d24cfc6a9fc",
              "create_date": "2024-12-12T18:38:09.456643",
              "update_date": "2024-12-12T18:38:09.456687",
              "create_time": 1733999892492,
              "update_time": 1733999892492,
              "model_types": [
                "speech2text",
                "embedding",
                "tts",
                "chat"
              ]
            },
            {
              "name": "Tongyi-Qianwen",
              "logo": "",
              "tags": "LLM,TEXT EMBEDDING,TEXT RE-RANK,TTS,SPEECH2TEXT,MODERATION",
              "status": "1",
              "id": "2492d0c3-9715-4f0d-acc0-8d9db04ccb54",
              "create_date": "2024-12-12T18:38:09.456643",
              "update_date": "2024-12-12T18:38:09.456687",
              "create_time": 1733999892505,
              "update_time": 1733999892505,
              "model_types": [
                "image2text",
                "tts",
                "rerank",
                "embedding",
                "chat"
              ]
            }
          ]
          
          set({ 
            factories: mockFactories,
            isLoading: false 
          })
        }
      },

      // 添加供应商
      addProvider: async (providerId: string) => {
        try {
          await apiClient.post(`/llm/factories/${providerId}/add`, {})
          
          // apiClient已经处理了错误情况，请求成功后重新加载模型列表
          await get().loadMyLLMs()
        } catch (error) {
          console.error('Failed to add provider:', error)
          throw error
        }
      },

      // 移除供应商
      removeProvider: async (providerName: string) => {
        try {
          await apiClient.delete(`/llm/providers/${encodeURIComponent(providerName)}`)
          
          // apiClient已经处理了错误情况，请求成功后从本地状态中移除
          const newMyLLMs = { ...get().myLLMs }
          delete newMyLLMs[providerName]
          set({ myLLMs: newMyLLMs })
        } catch (error) {
          console.error('Failed to remove provider:', error)
          throw error
        }
      },

      // 更新供应商配置
      updateProviderConfig: async (providerId: string, config: any) => {
        try {
          await apiClient.put(`/llm/providers/${providerId}/config`, config)
          
          // apiClient已经处理了错误情况，请求成功后重新加载模型列表
          await get().loadMyLLMs()
        } catch (error) {
          console.error('Failed to update provider config:', error)
          throw error
        }
      },

      // 设置API Key
      setApiKey: async (llmFactory: string, apiKey: string, baseUrl?: string) => {
        try {
          const requestData: any = {
            llm_factory: llmFactory,
            api_key: apiKey
          }
          
          if (baseUrl) {
            requestData.base_url = baseUrl
          }
          
          await apiClient.post('/llm/set_api_key', requestData)
          
          // apiClient已经处理了错误情况，请求成功后重新加载模型列表
          await get().loadMyLLMs()
        } catch (error) {
          console.error('Failed to set API key:', error)
          throw error
        }
      },

      // 设置加载状态
      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      // 设置选中的供应商
      setSelectedProvider: (provider: string | null) => {
        set({ selectedProvider: provider })
      },

      // 根据名称获取供应商
      getProviderByName: (name: string) => {
        return get().myLLMs[name] || null
      },

      // 获取模型总数
      getTotalModels: () => {
        const myLLMs = get().myLLMs
        return Object.values(myLLMs).reduce((total, provider) => {
          return total + provider.llm.length
        }, 0)
      },

      // 获取总token使用量
      getTotalTokens: () => {
        const myLLMs = get().myLLMs
        return Object.values(myLLMs).reduce((total, provider) => {
          return total + provider.llm.reduce((providerTotal, model) => {
            return providerTotal + model.used_token
          }, 0)
        }, 0)
      },
    }),
    {
      name: 'model-storage',
      // 只持久化必要的数据
      partialize: (state) => ({
        myLLMs: state.myLLMs,
        selectedProvider: state.selectedProvider,
      }),
    }
  )
)