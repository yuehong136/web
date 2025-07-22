# Multi-RAG 前端技术栈开发规范

## 技术栈选型
- **框架**：React 19 + TypeScript 严格模式  
- **构建工具**：Vite 7 (快速构建和热重载)
- **样式**：Tailwind CSS 3.4+ 
- **状态管理**：Zustand 5.0 + TanStack Query 5.8
- **路由**：React Router DOM 7.7
- **包管理**：npm (项目现状)
- **运行环境**：Node.js 18+
- **实时通信**：EventSource (SSE) + WebSocket  
- **文件上传**：react-dropzone 14.3
- **图表可视化**：recharts 3.1
- **表单处理**：React Hook Form 7.6 + Zod 4.0
- **图标库**：Lucide React 0.525

## 项目架构
```
src/
├── api/                    # API 客户端和类型定义
│   ├── client.ts          # 基础 API 客户端
│   ├── auth.ts            # 身份验证 API
│   ├── conversation.ts    # 对话相关 API
│   ├── knowledge.ts       # 知识库 API
│   ├── system.ts          # 系统监控 API
│   └── index.ts           # API 统一导出
├── components/            # 可复用UI组件
│   ├── ui/               # 基础组件(Button, Input, Card等)
│   ├── auth/             # 身份验证组件
│   ├── feature/          # 功能组件(Chat, Workflow等)
│   └── layout/           # 布局组件(Header, Sidebar等)
├── pages/                # 页面组件
│   ├── auth/             # 认证页面(Login, Register)
│   ├── dashboard/        # 仪表板页面
│   ├── chat/             # 智能对话页面
│   ├── knowledge/        # 知识库管理页面
│   ├── system/           # 系统监控页面
│   └── settings/         # 设置页面
├── stores/               # Zustand 状态管理
│   ├── auth.ts           # 身份验证状态
│   ├── ui.ts             # UI 状态
│   ├── chat.ts           # 对话状态
│   └── index.ts          # 状态统一导出
├── hooks/                # 自定义 React Hooks
├── lib/                  # 工具函数和配置
│   ├── router.tsx        # 路由配置
│   ├── query-client.ts   # TanStack Query 配置
│   └── utils.ts          # 工具函数
├── types/                # TypeScript类型定义
├── constants/            # 常量定义
├── assets/               # 静态资源和图标
└── public/               # 公共静态文件
```

## 开发命令
```bash
# 依赖安装
npm install

# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint

# 类型检查
npx tsc --noEmit
```

## 核心依赖配置
```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "@tanstack/react-query": "^5.83.0",
    "zustand": "^5.0.6",
    "react-router-dom": "^7.7.0",
    "tailwindcss": "^3.4.17",
    "react-dropzone": "^14.3.8",
    "react-hook-form": "^7.60.0",
    "recharts": "^3.1.0",
    "lucide-react": "^0.525.0",
    "zod": "^4.0.5",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.3.1"
  },
  "devDependencies": {
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.6.0",
    "typescript": "~5.8.3",
    "eslint": "^9.30.1",
    "vite": "^7.0.4"
  }
}
```

## 代码风格规范

### React组件规范
- **函数组件**：使用函数组件 + TypeScript
- **组件命名**：PascalCase (`AIChat`, `WorkflowEditor`)
- **文件命名**：PascalCase (`AIChat.tsx`, `WorkflowEditor.tsx`)
- **导出方式**：优先使用命名导出
- **Props接口**：`组件名 + Props` (`AIChatProps`)

**示例组件结构**：
```typescript
interface AIChatProps {
  conversationId: string;
  onMessageSent: (message: string) => void;
}

export const AIChat: React.FC<AIChatProps> = ({ 
  conversationId, 
  onMessageSent 
}) => {
  // 组件逻辑
  return (
    <div className="flex flex-col h-full bg-white rounded-lg">
      {/* 组件内容 */}
    </div>
  );
};
```

### Tailwind CSS 使用规范
- **类名顺序**：布局 → 尺寸 → 间距 → 颜色 → 状态
- **响应式设计**：`sm:` `md:` `lg:` `xl:` `2xl:`
- **状态变体**：`hover:` `focus:` `active:` `disabled:`
- **禁用自定义CSS**：只使用Tailwind工具类

**示例**：
```typescript
<button className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
  发送消息
</button>
```

### TypeScript 严格规范
- **类型注解**：所有函数参数和返回值必须有类型
- **接口定义**：优先使用`interface`而非`type`
- **严格模式**：禁用`any`类型，使用`unknown`替代
- **API类型**：基于OpenAPI生成类型定义

**API类型示例**：
```typescript
interface AITranslateRequest {
  zh_text: string;
  llm_name: string;
}

interface AITranslateResponse {
  status: 'success' | 'error';
  data: {
    original_text: string;
    translated_text: string;
  };
}
```

### React Router 路由规范
- **页面组件**：每个页面一个主组件文件
- **布局组件**：`Layout.tsx` 作为整体布局
- **路由保护**：使用 `AuthGuard` 组件保护需要认证的路由
- **懒加载**：大型页面组件使用 `React.lazy()` 懒加载

**页面组织示例**：
```
pages/
├── auth/
│   ├── LoginPage.tsx         # 登录页面
│   ├── RegisterPage.tsx      # 注册页面
│   └── index.ts              # 导出文件
├── dashboard/
│   ├── DashboardPage.tsx     # 仪表板页面
│   └── index.ts
├── chat/
│   ├── ChatPage.tsx          # 聊天页面
│   └── index.ts
├── knowledge/
│   ├── KnowledgeListPage.tsx # 知识库列表页面
│   └── index.ts
└── system/
    ├── SystemPage.tsx        # 系统监控页面
    └── index.ts
```

### 状态管理规范
**Zustand Store结构**：
```typescript
interface ChatStore {
  // 状态
  conversations: Conversation[];
  currentConversationId: string | null;
  isLoading: boolean;
  
  // 动作
  setConversations: (conversations: Conversation[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  createConversation: () => Promise<string>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  
  setConversations: (conversations) => set({ conversations }),
  addMessage: (conversationId, message) => set((state) => ({
    conversations: state.conversations.map(conv => 
      conv.id === conversationId 
        ? { ...conv, messages: [...conv.messages, message] }
        : conv
    )
  })),
  createConversation: async () => {
    // 创建对话逻辑
    return 'new-conversation-id';
  }
}));
```

### SSE (Server-Sent Events) 处理
```typescript
export const useSSEConnection = (eventId: string) => {
  const [data, setData] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    const eventSource = new EventSource(`/api/events/${eventId}`);
    
    eventSource.onopen = () => setIsConnected(true);
    eventSource.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      setData(parsedData);
    };
    eventSource.onerror = () => setIsConnected(false);
    
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [eventId]);
  
  return { data, isConnected };
};
```

### 文件命名约定
- **组件文件**：`ChatInterface.tsx`
- **页面路由**：`chat-interface/page.tsx`
- **工具函数**：`formatMessage.ts`
- **类型定义**：`ChatTypes.ts`
- **Store文件**：`useChatStore.ts`
- **Hook文件**：`useSSEConnection.ts`

### API客户端规范
```typescript
// src/api/client.ts - 统一API客户端
export class APIClient {
  private baseURL: string;
  private defaultTimeout: number = 30000;
  
  constructor(baseURL?: string) {
    this.baseURL = baseURL || import.meta.env.VITE_API_BASE_URL;
  }
  
  // 基础请求方法
  async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    // 请求拦截、错误处理、超时控制等
  }
  
  // HTTP方法
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }
  
  async post<T>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
}

// 具体API模块示例
// src/api/system.ts
export const systemAPI = {
  async getStatus(): Promise<SystemStatusResponse> {
    return apiClient.get<SystemStatusResponse>('/system/status');
  },
};
```

## 测试规范
- **测试文件**：`ComponentName.test.tsx`
- **测试位置**：`__tests__/` 目录或组件同级
- **测试库**：Jest + React Testing Library
- **覆盖率要求**：组件测试覆盖率 > 80%

## 性能优化规范
- **代码分割**：使用动态导入 `dynamic()` 
- **图片优化**：使用Next.js `Image`组件
- **字体优化**：使用Next.js `Font`优化
- **缓存策略**：合理使用SWR/React Query缓存
- **Bundle分析**：定期运行 `pnpm analyze`

## 安全规范
- **输入验证**：所有用户输入必须验证
- **XSS防护**：使用DOMPurify清理HTML内容
- **CSRF防护**：API请求包含CSRF token
- **敏感信息**：使用环境变量存储API密钥

## 国际化规范
- **国际化库**：next-intl
- **语言文件**：JSON格式存储在 `locales/` 目录
- **支持语言**：中文、英文(可扩展)
- **URL策略**：子路径模式 (`/zh/`, `/en/`)

## Git工作流规范
- **分支命名**：`feature/ai-chat-interface` | `fix/translation-error`
- **提交格式**：Conventional Commits
  - `feat: 新增AI对话功能`
  - `fix: 修复翻译接口错误`
  - `docs: 更新API文档`
- **提交检查**：pre-commit hooks运行lint和类型检查
- **PR要求**：必须通过所有CI检查

## 部署配置
- **环境变量**：使用 `.env.local` 配置
- **构建优化**：Vite 生产模式构建优化
- **CDN部署**：静态资源使用CDN加速
- **监控配置**：集成错误监控和性能监控

## 重要提醒
1. **组件优化**：合理使用 React.memo 和 useCallback 优化渲染性能
2. **状态管理**：优先使用 Zustand 进行全局状态管理，TanStack Query 处理服务器状态
3. **SSE连接管理**：合理处理连接建立和断开
4. **错误边界**：为每个功能模块设置错误边界
5. **类型安全**：严格的TypeScript类型检查，避免使用 any
6. **性能监控**：定期分析Bundle大小和页面性能
7. **用户体验**：优雅的加载状态和错误处理
8. **响应式设计**：使用 Tailwind CSS 实现移动优先的响应式布局
9. **代码分割**：使用 React.lazy 和动态导入进行代码分割
10. **API集成**：统一使用 API 客户端，确保错误处理和类型安全