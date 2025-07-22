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
│   ├── client.ts          # 统一 API 客户端
│   ├── auth.ts            # 身份验证相关 API
│   ├── conversation.ts    # 对话相关 API
│   ├── knowledge.ts       # 知识库相关 API
│   ├── system.ts          # 系统监控相关 API
│   └── index.ts           # 统一导出
├── components/            # 组件层
│   ├── ui/               # 通用 UI 组件
│   │   ├── button.tsx    # 按钮组件
│   │   ├── input.tsx     # 输入组件
│   │   ├── card.tsx      # 卡片组件
│   │   └── index.ts      # 导出文件
│   ├── auth/             # 认证相关组件
│   ├── feature/          # 功能组件
│   └── layout/           # 布局组件
├── pages/                # 页面层
│   ├── auth/             # 认证页面
│   ├── dashboard/        # 仪表板
│   ├── chat/             # 聊天页面
│   ├── knowledge/        # 知识库页面
│   ├── system/           # 系统监控页面
│   └── settings/         # 设置页面
├── stores/               # 状态管理
│   ├── auth.ts           # 认证状态
│   ├── ui.ts             # UI 状态
│   ├── chat.ts           # 聊天状态
│   └── index.ts          # 统一导出
├── hooks/                # 自定义 Hooks
├── lib/                  # 工具库
├── types/                # 类型定义
├── constants/            # 常量定义
└── assets/               # 静态资源
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

## 🔌 API 集成规范

### API 客户端使用

```typescript
// src/api/user.ts
import { apiClient } from './client'
import type { UserInfo, CreateUserRequest, UpdateUserRequest } from '../types/api'

export const userAPI = {
  // 获取用户列表
  async getUsers(params?: { page?: number; limit?: number }): Promise<UserInfo[]> {
    return apiClient.get('/users', { params })
  },

  // 获取单个用户
  async getUser(id: string): Promise<UserInfo> {
    return apiClient.get(`/users/${id}`)
  },

  // 创建用户
  async createUser(data: CreateUserRequest): Promise<UserInfo> {
    return apiClient.post('/users', data)
  },

  // 更新用户
  async updateUser(id: string, data: UpdateUserRequest): Promise<UserInfo> {
    return apiClient.put(`/users/${id}`, data)
  },

  // 删除用户
  async deleteUser(id: string): Promise<void> {
    return apiClient.delete(`/users/${id}`)
  }
}
```

### 自定义 Hook 集成

```typescript
// src/hooks/use-users.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userAPI } from '../api/user'
import { QUERY_KEYS } from '../constants'
import type { CreateUserRequest, UpdateUserRequest } from '../types/api'

export const useUsers = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USERS, params],
    queryFn: () => userAPI.getUsers(params),
    staleTime: 5 * 60 * 1000, // 5 分钟
  })
}

export const useUser = (id: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.USER, id],
    queryFn: () => userAPI.getUser(id),
    enabled: !!id,
  })
}

export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserRequest) => userAPI.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.USERS] })
    },
  })
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

---

遵循以上规范可以确保代码的一致性、可维护性和团队协作效率。如有疑问，请参考具体的实现示例或咨询团队成员。