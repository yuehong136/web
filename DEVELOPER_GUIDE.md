# Multi-RAG Frontend 开发者指南

本文档为 Multi-RAG Frontend 项目的开发规范指南，旨在确保代码质量、维护性和团队协作效率。

## 📋 目录

- [项目架构](#项目架构)
- [编码规范](#编码规范)
- [组件开发规范](#组件开发规范)
- [API 集成规范](#api-集成规范)
- [状态管理规范](#状态管理规范)
- [路由规范](#路由规范)
- [测试规范](#测试规范)
- [性能优化](#性能优化)
- [最佳实践](#最佳实践)

## 🏗️ 项目架构

### 目录结构规范

```
src/
├── api/                    # API 层
│   ├── client.ts          # 统一 API 客户端 (认证、错误处理、拦截器)
│   ├── auth.ts            # 身份验证相关 API
│   ├── conversation.ts    # 对话相关 API
│   ├── knowledge.ts       # 知识库相关 API
│   ├── llm.ts             # LLM 提供商 API
│   ├── system.ts          # 系统监控相关 API
│   └── index.ts           # 统一导出
├── components/            # 组件层
│   ├── ui/               # 通用 UI 组件 (40+ 组件)
│   │   ├── button.tsx    # 按钮组件 (支持多种变体)
│   │   ├── input.tsx     # 输入组件
│   │   ├── card.tsx      # 卡片组件
│   │   ├── modal.tsx     # 模态框组件
│   │   ├── table.tsx     # 表格组件
│   │   ├── file-icon.tsx # 文件图标组件 (40+ 文件类型)
│   │   ├── avatar.tsx    # 头像组件
│   │   ├── badge.tsx     # 徽章组件
│   │   ├── checkbox.tsx  # 复选框组件
│   │   ├── dropdown.tsx  # 下拉菜单组件
│   │   ├── tooltip.tsx   # 工具提示组件
│   │   ├── custom-select.tsx # 自定义选择器
│   │   ├── loading.tsx   # 加载组件
│   │   ├── status-card.tsx # 状态卡片
│   │   ├── task-executor-chart.tsx # 任务执行器图表
│   │   └── index.ts      # 导出文件
│   ├── auth/             # 认证相关组件
│   │   ├── AuthGuard.tsx # 路由保护组件
│   │   └── index.ts      # 导出文件
│   ├── knowledge/        # 知识库组件
│   │   ├── EmbeddingModelSelector.tsx # 嵌入模型选择器
│   │   ├── QuickEditModal.tsx # 快速编辑模态框
│   │   └── index.ts      # 导出文件
│   ├── forms/            # 表单组件
│   ├── feature/          # 功能组件
│   └── layout/           # 布局组件
│       ├── Layout.tsx    # 主布局组件
│       ├── Header.tsx    # 头部组件
│       ├── Sidebar.tsx   # 侧边栏组件
│       └── index.ts      # 导出文件
├── pages/                # 页面层
│   ├── auth/             # 认证页面
│   │   ├── LoginPage.tsx # 登录页面
│   │   ├── RegisterPage.tsx # 注册页面
│   │   └── index.ts      # 导出文件
│   ├── dashboard/        # 仪表板
│   │   ├── DashboardPage.tsx # 仪表板页面
│   │   └── index.ts      # 导出文件
│   ├── chat/             # 聊天页面
│   │   ├── ChatPage.tsx  # 聊天页面
│   │   └── index.ts      # 导出文件
│   ├── knowledge/        # 知识库页面
│   │   ├── KnowledgeListPage.tsx # 知识库列表
│   │   ├── KnowledgeCreatePage.tsx # 创建知识库
│   │   ├── KnowledgeImportPage.tsx # 导入文档
│   │   ├── KnowledgeDetailLayout.tsx # 知识库详情布局
│   │   ├── KnowledgeDocumentsPage.tsx # 文档管理
│   │   ├── KnowledgeSearchPage.tsx # 搜索页面
│   │   ├── KnowledgeSettingsPage.tsx # 知识库设置
│   │   └── index.ts      # 导出文件
│   ├── system/           # 系统监控页面
│   │   ├── SystemPage.tsx # 系统监控页面
│   │   └── index.ts      # 导出文件
│   ├── settings/         # 设置页面
│   │   ├── SettingsLayout.tsx # 设置布局
│   │   ├── ProfilePage.tsx # 个人资料页面
│   │   ├── ModelProvidersPage.tsx # 模型提供商页面
│   │   └── index.ts      # 导出文件
│   ├── documents/        # 文档管理 (占位符)
│   ├── ai-tools/         # AI 工具 (占位符)
│   ├── workflow/         # 工作流 (占位符)
│   └── mcp-servers/      # MCP 服务器 (占位符)
├── stores/               # 状态管理
│   ├── auth.ts           # 认证状态 (用户、令牌、租户)
│   ├── ui.ts             # UI 状态 (侧边栏、主题、通知)
│   ├── chat.ts           # 聊天状态
│   ├── conversation.ts   # 对话管理 (历史、设置、流式)
│   ├── knowledge.ts      # 知识库状态
│   ├── model.ts          # 模型配置
│   └── index.ts          # 统一导出和初始化
├── hooks/                # 自定义 Hooks
│   ├── use-auth.ts       # 认证相关 Hook
│   ├── use-conversations.ts # 对话相关 Hook
│   ├── use-system-status.ts # 系统状态 Hook
│   └── index.ts          # Hook 导出
├── lib/                  # 工具库
│   ├── router.tsx        # 路由配置
│   ├── query-client.ts   # TanStack Query 配置
│   ├── utils.ts          # 工具函数
│   └── toast.ts          # 通知工具
├── types/                # 类型定义
│   ├── api.ts            # API 类型定义 (950+ 行)
│   └── index.ts          # 类型导出
├── constants/            # 常量定义
│   └── index.ts          # 路由、API URL 等常量
├── assets/               # 静态资源
│   ├── react.svg         # React 图标
│   └── svg/              # SVG 图标
│       └── file-icon/    # 文件类型图标 (40+ 种)
└── utils/                # 额外工具函数
```

## 📝 编码规范

### TypeScript 规范

#### 1. 类型定义

```typescript
// ✅ 正确：使用接口定义对象类型
interface UserInfo {
  id: string
  name: string
  email: string
  avatar?: string
}

// ✅ 正确：使用联合类型定义枚举
type Status = 'loading' | 'success' | 'error'

// ❌ 错误：使用 any 类型
const userData: any = fetchUser()

// ✅ 正确：使用具体类型
const userData: UserInfo = fetchUser()
```

#### 2. 函数类型注解

```typescript
// ✅ 正确：明确的参数和返回值类型
const fetchUserData = async (userId: string): Promise<UserInfo> => {
  const response = await apiClient.get(`/users/${userId}`)
  return response.data
}

// ✅ 正确：可选参数处理
const createUser = (userData: Omit<UserInfo, 'id'>, options?: CreateOptions): Promise<UserInfo> => {
  // 实现
}
```

#### 3. 导入导出规范

```typescript
// ✅ 正确：使用命名导出
export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  // 组件实现
}

// ✅ 正确：类型导入使用 type 前缀
import type { UserInfo } from '../types/api'
import { Button } from '../components/ui'

// ❌ 错误：默认导出组件
export default UserProfile
```

### 文件命名规范

```
# 组件文件
UserProfile.tsx       # 组件名使用 PascalCase
user-profile.tsx      # 或使用 kebab-case（保持一致）

# Hook 文件
useAuth.ts           # Hook 使用 camelCase
use-auth.ts          # 或使用 kebab-case

# 工具文件
formatUtils.ts       # 工具函数使用 camelCase
api-client.ts        # API 相关使用 kebab-case

# 类型文件
api.ts               # 简洁的类型文件名
userTypes.ts         # 或带前缀的类型文件
```

## 🧩 组件开发规范

### React 组件结构

```typescript
import React from 'react'
import { cn } from '../../lib/utils'
import type { UserInfo } from '../../types/api'

// 1. Props 接口定义（组件名 + Props）
interface UserProfileProps {
  user: UserInfo
  onEdit?: (user: UserInfo) => void
  className?: string
}

// 2. 组件实现
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
  className
}) => {
  // 3. 状态和副作用
  const [isEditing, setIsEditing] = React.useState(false)
  
  // 4. 事件处理函数
  const handleEdit = () => {
    setIsEditing(true)
    onEdit?.(user)
  }
  
  // 5. 渲染逻辑
  return (
    <div className={cn('p-4 border rounded-lg', className)}>
      <div className="flex items-center space-x-3">
        {user.avatar && (
          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
        )}
        <div>
          <h3 className="font-medium text-gray-900">{user.name}</h3>
          <p className="text-gray-600">{user.email}</p>
        </div>
      </div>
      
      {onEdit && (
        <button
          onClick={handleEdit}
          className="mt-3 px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          编辑
        </button>
      )}
    </div>
  )
}
```

### UI 组件规范

#### 1. 基础组件结构

```typescript
// src/components/ui/button.tsx
import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

// 使用 CVA 定义变体
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

#### 2. 文件图标组件

```typescript
// src/components/ui/file-icon.tsx
import React from 'react'
import { cn } from '../../lib/utils'

// 支持的文件类型 (40+ 种)
const FILE_TYPES = {
  // 文档类型
  pdf: () => import('../../assets/svg/file-icon/pdf.svg'),
  doc: () => import('../../assets/svg/file-icon/doc.svg'),
  docx: () => import('../../assets/svg/file-icon/docx.svg'),
  txt: () => import('../../assets/svg/file-icon/txt.svg'),
  md: () => import('../../assets/svg/file-icon/md.svg'),

  // 图片类型
  jpg: () => import('../../assets/svg/file-icon/jpg.svg'),
  jpeg: () => import('../../assets/svg/file-icon/jpeg.svg'),
  png: () => import('../../assets/svg/file-icon/png.svg'),
  gif: () => import('../../assets/svg/file-icon/gif.svg'),
  svg: () => import('../../assets/svg/file-icon/svg.svg'),

  // 视频类型
  mp4: () => import('../../assets/svg/file-icon/mp4.svg'),
  avi: () => import('../../assets/svg/file-icon/avi.svg'),
  mkv: () => import('../../assets/svg/file-icon/mkv.svg'),

  // 音频类型
  mp3: () => import('../../assets/svg/file-icon/mp3.svg'),
  wav: () => import('../../assets/svg/file-icon/wav.svg'),

  // 代码类型
  js: () => import('../../assets/svg/file-icon/js.svg'),
  html: () => import('../../assets/svg/file-icon/html.svg'),
  css: () => import('../../assets/svg/file-icon/css.svg'),
  json: () => import('../../assets/svg/file-icon/json.svg'),

  // 其他类型
  folder: () => import('../../assets/svg/file-icon/folder.svg'),
  // ... 更多文件类型
} as const

interface FileIconProps {
  type: keyof typeof FILE_TYPES | string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const FileIcon: React.FC<FileIconProps> = ({
  type,
  size = 'md',
  className
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  // 动态加载图标
  const [IconComponent, setIconComponent] = React.useState<React.ComponentType | null>(null)

  React.useEffect(() => {
    const loadIcon = async () => {
      try {
        const iconLoader = FILE_TYPES[type as keyof typeof FILE_TYPES]
        if (iconLoader) {
          const iconModule = await iconLoader()
          setIconComponent(() => iconModule.default)
        }
      } catch (error) {
        console.warn(`Failed to load icon for type: ${type}`)
      }
    }

    loadIcon()
  }, [type])

  if (!IconComponent) {
    return (
      <div className={cn(sizeClasses[size], 'bg-gray-200 rounded', className)} />
    )
  }

  return (
    <IconComponent className={cn(sizeClasses[size], className)} />
  )
}
```

#### 3. 组件导出规范

```typescript
// src/components/ui/index.ts
export { Button, buttonVariants } from './button'
export { Input } from './input'
export { Card, CardHeader, CardContent, CardFooter } from './card'
export { Modal } from './modal'
export { Table, TableHeader, TableBody, TableRow, TableCell } from './table'
export { FileIcon } from './file-icon'
export { Avatar } from './avatar'
export { Badge } from './badge'
export { Checkbox } from './checkbox'
export { Dropdown } from './dropdown'
export { Tooltip } from './tooltip'
export { Loading } from './loading'
export { StatusCard } from './status-card'
export { TaskExecutorChart } from './task-executor-chart'
// ... 更多组件导出
```

## 🔌 API 集成规范

### API 客户端使用

#### 1. 知识库 API 示例

```typescript
// src/api/knowledge.ts
import { apiClient } from './client'
import type {
  KnowledgeBase,
  CreateKnowledgeBaseRequest,
  Document,
  PaginatedData,
  PaginationRequest
} from '../types/api'

export const knowledgeAPI = {
  // 获取知识库列表
  async getKnowledgeBases(params?: PaginationRequest & {
    keywords?: string
    status?: string
  }): Promise<PaginatedData<KnowledgeBase>> {
    return apiClient.get('/v1/knowledge/list', { params })
  },

  // 获取知识库详情
  async getKnowledgeBase(id: string): Promise<KnowledgeBase> {
    return apiClient.get(`/v1/knowledge/${id}`)
  },

  // 创建知识库
  async createKnowledgeBase(data: CreateKnowledgeBaseRequest): Promise<KnowledgeBase> {
    return apiClient.post('/v1/knowledge/create', data)
  },

  // 更新知识库
  async updateKnowledgeBase(id: string, data: Partial<CreateKnowledgeBaseRequest>): Promise<KnowledgeBase> {
    return apiClient.post(`/v1/knowledge/${id}/update`, data)
  },

  // 删除知识库
  async deleteKnowledgeBase(id: string): Promise<void> {
    return apiClient.delete(`/v1/knowledge/${id}`)
  },

  // 获取文档列表
  async getDocuments(knowledgeBaseId: string, params?: PaginationRequest): Promise<PaginatedData<Document>> {
    return apiClient.get(`/v1/knowledge/${knowledgeBaseId}/documents`, { params })
  },

  // 上传文档
  async uploadDocument(knowledgeBaseId: string, file: File): Promise<Document> {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post(`/v1/knowledge/${knowledgeBaseId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // 搜索文档
  async searchDocuments(knowledgeBaseId: string, query: string): Promise<Document[]> {
    return apiClient.post(`/v1/knowledge/${knowledgeBaseId}/search`, { query })
  }
}
```

#### 2. LLM 提供商 API 示例

```typescript
// src/api/llm.ts
import { apiClient } from './client'
import type { LLMProvider, ModelInfo } from '../types/api'

export const llmAPI = {
  // 获取支持的 LLM 提供商
  async getProviders(): Promise<LLMProvider[]> {
    return apiClient.get('/v1/llm/providers')
  },

  // 获取模型列表
  async getModels(provider: string): Promise<ModelInfo[]> {
    return apiClient.get(`/v1/llm/providers/${provider}/models`)
  },

  // 测试 API 连接
  async testConnection(provider: string, apiKey: string): Promise<{ success: boolean; message: string }> {
    return apiClient.post(`/v1/llm/providers/${provider}/test`, { api_key: apiKey })
  }
}
```

### 自定义 Hook 集成

#### 1. 知识库相关 Hook

```typescript
// src/hooks/use-knowledge.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeAPI } from '../api/knowledge'
import { QUERY_KEYS } from '../constants'
import type { CreateKnowledgeBaseRequest, PaginationRequest } from '../types/api'

export const useKnowledgeBases = (params?: PaginationRequest & { keywords?: string }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.KNOWLEDGE_BASES, params],
    queryFn: () => knowledgeAPI.getKnowledgeBases(params),
    staleTime: 5 * 60 * 1000, // 5 分钟
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.KNOWLEDGE_BASE, id],
    queryFn: () => knowledgeAPI.getKnowledgeBase(id),
    enabled: !!id,
  })
}

export const useCreateKnowledgeBase = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateKnowledgeBaseRequest) => knowledgeAPI.createKnowledgeBase(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.KNOWLEDGE_BASES] })
    },
  })
}

export const useDocuments = (knowledgeBaseId: string, params?: PaginationRequest) => {
  return useQuery({
    queryKey: [QUERY_KEYS.DOCUMENTS, knowledgeBaseId, params],
    queryFn: () => knowledgeAPI.getDocuments(knowledgeBaseId, params),
    enabled: !!knowledgeBaseId,
  })
}

export const useUploadDocument = (knowledgeBaseId: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => knowledgeAPI.uploadDocument(knowledgeBaseId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.DOCUMENTS, knowledgeBaseId]
      })
    },
  })
}
```

#### 2. 系统状态 Hook

```typescript
// src/hooks/use-system-status.ts
import { useQuery } from '@tanstack/react-query'
import { systemAPI } from '../api/system'
import { QUERY_KEYS } from '../constants'

export const useSystemStatus = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.SYSTEM_STATUS],
    queryFn: () => systemAPI.getStatus(),
    refetchInterval: 30 * 1000, // 每 30 秒刷新
    staleTime: 10 * 1000, // 10 秒内认为数据是新鲜的
  })
}

// 提取特定组件状态的 Hook
export const useDatabaseStatus = () => {
  const { data } = useSystemStatus()
  return data?.database
}

export const useRedisStatus = () => {
  const { data } = useSystemStatus()
  return data?.redis
}

export const useTaskExecutorHeartbeats = () => {
  const { data } = useSystemStatus()
  return data?.task_executor_heartbeats || {}
}
```

## 🗄️ 状态管理规范

### Zustand Store 结构

```typescript
// src/stores/user.ts
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { UserInfo } from '../types/api'

interface UserState {
  // 状态
  users: UserInfo[]
  selectedUser: UserInfo | null
  isLoading: boolean
  error: string | null

  // 动作
  setUsers: (users: UserInfo[]) => void
  setSelectedUser: (user: UserInfo | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // 异步动作
  addUser: (user: UserInfo) => void
  updateUser: (id: string, updates: Partial<UserInfo>) => void
  removeUser: (id: string) => void
  
  // 重置
  reset: () => void
}

const initialState = {
  users: [],
  selectedUser: null,
  isLoading: false,
  error: null,
}

export const useUserStore = create<UserState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setUsers: (users) => set({ users }),
      setSelectedUser: (user) => set({ selectedUser: user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      addUser: (user) => set((state) => ({
        users: [...state.users, user]
      })),

      updateUser: (id, updates) => set((state) => ({
        users: state.users.map(user => 
          user.id === id ? { ...user, ...updates } : user
        )
      })),

      removeUser: (id) => set((state) => ({
        users: state.users.filter(user => user.id !== id),
        selectedUser: state.selectedUser?.id === id ? null : state.selectedUser
      })),

      reset: () => set(initialState),
    }),
    { name: 'user-store' }
  )
)
```

## 🛣️ 路由规范

### 页面组件结构

```typescript
// src/pages/users/UsersPage.tsx
import React from 'react'
import { useUsers, useCreateUser } from '../../hooks/use-users'
import { UserList } from '../../components/feature/UserList'
import { CreateUserModal } from '../../components/feature/CreateUserModal'
import { Button } from '../../components/ui/button'
import { Plus } from 'lucide-react'

export const UsersPage: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false)
  
  const { data: users, isLoading, error } = useUsers()
  const createUser = useCreateUser()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        加载失败：{error.message}
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          添加用户
        </Button>
      </div>

      <UserList users={users || []} />

      <CreateUserModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={(data) => {
          createUser.mutate(data, {
            onSuccess: () => setIsCreateModalOpen(false)
          })
        }}
      />
    </div>
  )
}
```

## 🧪 测试规范

### 组件测试

```typescript
// src/components/ui/__tests__/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '../Button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('handles click events', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies variant styles', () => {
    render(<Button variant="destructive">Delete</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

### Hook 测试

```typescript
// src/hooks/__tests__/use-users.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useUsers } from '../use-users'
import { userAPI } from '../../api/user'

jest.mock('../../api/user')

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useUsers', () => {
  it('fetches users successfully', async () => {
    const mockUsers = [{ id: '1', name: 'John', email: 'john@example.com' }]
    ;(userAPI.getUsers as jest.Mock).mockResolvedValue(mockUsers)

    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper()
    })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toEqual(mockUsers)
  })
})
```

## ⚡ 性能优化

### 组件优化

```typescript
// 使用 React.memo 优化组件渲染
export const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  return (
    <div className="p-4 border rounded">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {onEdit && (
        <button onClick={() => onEdit(user)}>编辑</button>
      )}
    </div>
  )
})

// 使用 useCallback 优化事件处理
const UserList: React.FC<UserListProps> = ({ users, onUserEdit }) => {
  const handleUserEdit = React.useCallback((user: UserInfo) => {
    onUserEdit?.(user)
  }, [onUserEdit])

  return (
    <div>
      {users.map(user => (
        <UserCard 
          key={user.id} 
          user={user} 
          onEdit={handleUserEdit} 
        />
      ))}
    </div>
  )
}
```

### 懒加载

```typescript
// 页面懒加载
const UsersPage = React.lazy(() => import('../pages/users/UsersPage'))
const SettingsPage = React.lazy(() => import('../pages/settings/SettingsPage'))

// 在路由中使用
<Route 
  path="/users" 
  element={
    <Suspense fallback={<div>Loading...</div>}>
      <UsersPage />
    </Suspense>
  } 
/>
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
// 全局错误边界
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
    // 上报错误
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">出错了</h2>
          <p className="text-gray-600">页面遇到了一些问题，请刷新重试。</p>
        </div>
      )
    }

    return this.props.children
  }
}
```

### 2. 表单处理

```typescript
// 使用 react-hook-form + zod
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('邮箱格式不正确'),
  age: z.number().min(18, '年龄必须大于18岁')
})

type UserFormData = z.infer<typeof userSchema>

const UserForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema)
  })

  const onSubmit = async (data: UserFormData) => {
    try {
      await userAPI.createUser(data)
      // 成功处理
    } catch (error) {
      // 错误处理
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name')}
          placeholder="姓名"
          className="border rounded px-3 py-2"
        />
        {errors.name && (
          <p className="text-red-600 text-sm">{errors.name.message}</p>
        )}
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {isSubmitting ? '提交中...' : '提交'}
      </button>
    </form>
  )
}
```

### 3. 代码注释规范

```typescript
/**
 * 用户资料组件
 * 
 * @param user - 用户信息
 * @param onEdit - 编辑回调函数
 * @param className - 额外的 CSS 类名
 * 
 * @example
 * <UserProfile 
 *   user={userData} 
 *   onEdit={handleEdit}
 *   className="mb-4" 
 * />
 */
export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  onEdit,
  className
}) => {
  // TODO: 添加用户头像上传功能
  // FIXME: 修复用户名过长时的样式问题
  
  return (
    // 组件实现
  )
}
```

### 4. Git 提交规范

```bash
# 格式：<type>(<scope>): <subject>

# 示例
feat(auth): 添加用户登录功能
fix(ui): 修复按钮样式问题
docs(readme): 更新安装说明
style(button): 调整按钮间距
refactor(api): 重构 API 客户端
test(user): 添加用户组件测试
chore(deps): 升级依赖版本
```

## 📋 当前实现状态

### ✅ 已完成功能

#### 核心基础设施
- [x] **项目架构**: React 19 + TypeScript + Vite 7 完整配置
- [x] **状态管理**: Zustand + TanStack Query 集成
- [x] **路由系统**: React Router DOM 7.7 配置
- [x] **API 客户端**: 统一 API 客户端，支持认证、错误处理、拦截器
- [x] **类型系统**: 完整的 TypeScript 类型定义 (950+ 行)

#### UI 组件系统
- [x] **基础组件**: 40+ UI 组件 (Button, Input, Card, Modal, Table 等)
- [x] **文件图标**: 支持 40+ 文件类型的图标系统
- [x] **现代化布局系统**: Header, Sidebar (新浮动卡片设计), Layout 响应式布局
- [x] **表单组件**: React Hook Form + Zod 验证集成
- [x] **图表组件**: Recharts 集成的任务执行器图表
- [x] **增强 UI 体验**: 改进的侧边栏视觉设计和交互体验

#### 认证系统
- [x] **用户认证**: 登录、注册、JWT 令牌管理
- [x] **路由保护**: AuthGuard 组件保护私有路由
- [x] **状态持久化**: 认证状态自动持久化
- [x] **租户管理**: 多租户支持

#### 知识库管理
- [x] **知识库 CRUD**: 创建、查看、编辑、删除知识库
- [x] **高级文档管理**: 
  - 文档上传、列表、搜索功能
  - 批量文档操作：上传、下载、重命名、删除
  - 文档处理状态监控和解析控制
  - 支持多种文件格式上传和处理
- [x] **修复的嵌入模型选择**: 
  - 解决了下拉框回显问题
  - 修复了动态 SVG 图标加载
  - 改善了模型提供商图标显示
- [x] **快速编辑**: 知识库设置的就地编辑
- [x] **增强文档操作**: 支持批量选择、重命名、下载等高级操作

#### 系统监控
- [x] **系统状态**: 数据库、Redis、存储、文档引擎状态监控
- [x] **任务执行器**: 实时任务执行器心跳监控
- [x] **图表展示**: 任务执行器性能图表

#### 设置管理
- [x] **用户资料**: 个人信息管理
- [x] **模型提供商**: LLM 提供商配置和管理
- [x] **设置布局**: 统一的设置页面布局

### 🚧 开发中功能

#### 聊天系统
- [x] **基础聊天**: ChatPage 组件已创建
- [ ] **消息流式**: 实时流式消息显示
- [ ] **对话历史**: 对话历史管理和搜索
- [ ] **多模态**: 图片、文件等多媒体消息支持

#### 已修复问题
- [x] **向量模型下拉框**: 修复了知识库创建时的回显问题
- [x] **动态图标加载**: 解决了模型提供商 SVG 图标的动态加载问题
- [x] **侧边栏设计**: 完成现代化浮动卡片设计改造

#### 高级功能
- [ ] **文档管理**: 独立的文档管理模块
- [ ] **AI 工具箱**: AI 工具集合
- [ ] **工作流**: 自动化工作流创建和执行
- [ ] **MCP 服务器**: Model Context Protocol 服务器管理

#### 设置功能
- [ ] **安全设置**: 密码修改、两步验证
- [ ] **通知设置**: 通知偏好和配置
- [ ] **界面设置**: 主题、语言、界面自定义
- [ ] **API 密钥**: API 密钥管理界面

### 🎯 开发优先级

#### 高优先级 (当前 Sprint)
1. **聊天系统完善**: 流式消息、对话管理
2. **知识库功能**: 进一步优化搜索和批量操作性能
3. **文档处理优化**: 优化文档解析控制和状态显示

#### 中优先级 (下个 Sprint)
1. **AI 工具箱**: 基础 AI 工具实现
2. **工作流系统**: 简单工作流创建
3. **设置功能**: 安全设置、通知设置

#### 低优先级 (后续版本)
1. **MCP 服务器**: MCP 协议集成
2. **高级分析**: 使用统计和分析
3. **插件系统**: 第三方插件支持

## 🔧 开发环境配置

### 必需工具
```bash
# Node.js 版本要求
node --version  # >= 18.0.0

# 包管理器
npm --version   # >= 9.0.0

# 开发工具
git --version   # >= 2.30.0
```

### 开发流程
```bash
# 1. 克隆项目
git clone <repository-url>
cd web

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev

# 4. 代码检查
npm run lint

# 5. 类型检查
npx tsc --noEmit

# 6. 构建生产版本
npm run build
```

### 环境变量配置
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_VERSION=0.6.1
```

---

## 📋 最新更新记录 (v0.6.1)

### 🔧 修复内容
1. **知识库向量模型选择器**: 
   - 修复了创建知识库时向量模型下拉框的回显问题
   - 解决了模型提供商 SVG 图标的动态加载问题
   - 改善了下拉框的用户体验

2. **文档管理增强**:
   - 实现了高级批量操作功能
   - 添加了文档上传/下载/重命名功能
   - 集成了文档解析控制机制

3. **侧边栏现代化设计**:
   - 采用新的浮动卡片设计
   - 改善了视觉层次和导航体验
   - 提升了整体界面的现代感

### 🛠️ 技术改进
- 优化了组件的状态管理和数据流
- 改进了 API 调用的错误处理机制
- 增强了用户界面的响应性和交互体验

---

遵循以上规范和开发流程可以确保代码的一致性、可维护性和团队协作效率。如有疑问，请参考具体的实现示例或咨询团队成员。