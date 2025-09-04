# Multi-RAG Frontend

A comprehensive React-based frontend application for Multi-RAG system, providing intelligent conversation, knowledge base management, AI tools, MCP integration, system monitoring, and more.

## 🆕 Latest Updates

### API Management & Documentation
- **🔑 API Key Management**: Comprehensive API key CRUD operations with secure token handling
- **📚 OpenAPI Integration**: Interactive API documentation with Monaco editor and real-time testing
- **🛡️ Enhanced Security**: Portal-based dropdowns, secure token regeneration, and access controls

### Design System & Performance
- **🎨 Advanced Design Token System**: Complete CSS variable theming with automated theme generation
- **⚡ Performance Optimizations**: Removed backdrop-blur for better performance, optimized Tailwind configuration
- **🌗 Enhanced Dark Mode**: Improved color consistency and visual hierarchy across all components

### AI & MCP Integration  
- **🤖 MCP Chat Enhancement**: Structured output support with unified tool parsing and improved streaming
- **🔧 MCP Server Management**: Comprehensive MCP server configuration, testing, and batch operations
- **📝 AI Tools Expansion**: Auto-fill workbench, document processing, and AI-powered utilities

### Knowledge Base Features
- **📚 Advanced Document Management**: Multi-format support with specialized parsers (PDF, DOCX, presentations, legal docs, etc.)
- **🔍 Enhanced Search & Exploration**: Improved search interface with document chunk visualization
- **📊 Parser Configuration**: Visual parser settings with real-time preview for different document types

### Developer Experience
- **🏗️ React 19 + Vite 7**: Latest framework versions with improved TypeScript integration
- **🎯 Component Architecture**: 50+ UI components with comprehensive design system
- **📱 Responsive Design**: Mobile-first approach with enhanced accessibility

## 🚀 Core Features

### 💬 Intelligent Conversation
- **AI-Powered Chat**: Real-time streaming conversations with multiple LLM providers
- **MCP Chat Integration**: Enhanced chat with Model Context Protocol tools and structured outputs
- **Conversation Management**: History, settings, and context management

### 📚 Knowledge Base System
- **Multi-Format Document Support**: PDF, DOCX, TXT, MD, presentations, legal documents, audio, images
- **Advanced Document Parsing**: Specialized parsers for different content types with visual configuration
- **Intelligent Search & Retrieval**: Vector-based search with chunk visualization and relevance scoring
- **Batch Operations**: Upload, download, rename, and organize documents efficiently

### 🤖 AI Tools & Automation
- **Auto-Fill Workbench**: AI-powered data processing and form filling
- **Document Processing**: Automated content extraction and analysis
- **Workflow Automation**: Custom AI-driven workflows (in development)

### 🔧 MCP Integration
- **Server Management**: Configure, test, and monitor MCP servers
- **Tool Discovery**: Browse and utilize MCP tools across different servers  
- **Batch Operations**: Manage multiple MCP connections efficiently

### 🏢 Studio & Development
- **App Creation Studio**: Build and deploy AI applications
- **Dialog Management**: Create and manage conversational flows
- **Prompt Engineering**: Advanced prompt editor with templates

### 📊 System Monitoring
- **Real-Time Dashboards**: System health, performance metrics, and resource usage
- **Task Execution Monitoring**: Background job tracking with detailed charts
- **Component Health Checks**: Database, Redis, storage, and processing engine status

## 📋 Tech Stack

- **Framework**: React 19.1 + TypeScript 5.8
- **Build Tool**: Vite 7.0
- **Styling**: Tailwind CSS 3.4 + Tailwind Forms + Tailwind Typography
- **State Management**: Zustand 5.0 + TanStack Query 5.8
- **Routing**: React Router DOM 7.7
- **Charts**: Recharts 3.1
- **Forms**: React Hook Form 7.6 + Zod 4.0 + Hookform Resolvers
- **Icons**: Lucide React 0.525
- **UI Components**: Class Variance Authority + Tailwind Merge + CLSX
- **File Handling**: React Dropzone 14.3
- **HTTP Client**: Custom API client with fetch
- **Code Editor**: Monaco Editor for syntax highlighting and code formatting
- **Development**: ESLint 9.30 + TypeScript ESLint 8.35

## 🏗️ Project Structure

```
src/
├── api/                    # API clients and types
│   ├── client.ts          # Base API client with auth & error handling
│   ├── auth.ts            # Authentication APIs
│   ├── conversation.ts    # Chat/conversation APIs
│   ├── knowledge.ts       # Knowledge base APIs
│   ├── llm.ts             # LLM provider APIs
│   ├── system.ts          # System monitoring APIs
│   └── index.ts           # API exports
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components (50+ components)
│   │   ├── button.tsx    # Button with variants
│   │   ├── input.tsx     # Form inputs
│   │   ├── card.tsx      # Card layouts
│   │   ├── file-icon.tsx # File type icons (40+ types)
│   │   ├── provider-icon.tsx # LLM provider icons
│   │   ├── theme-switcher.tsx # Dark/light mode toggle
│   │   ├── task-executor-chart.tsx # System monitoring charts
│   │   └── ...           # More specialized UI components
│   ├── auth/             # Authentication components
│   │   ├── AuthGuard.tsx # Route protection
│   │   ├── AuthCarousel.tsx # Login/register carousel
│   │   └── ImageWithFallback.tsx # Image loading with fallback
│   ├── knowledge/        # Knowledge base components
│   │   ├── EmbeddingModelSelector.tsx # Vector model selection
│   │   ├── RerankModelSelector.tsx # Rerank model selection
│   │   ├── ParserTypeSelector.tsx # Document parser selection
│   │   └── QuickEditModal.tsx # Quick edit functionality
│   ├── chat/             # Chat interface components
│   │   ├── ModelSelector.tsx # LLM model selection
│   │   └── PromptSuggestion.tsx # Prompt suggestions
│   ├── mcp/              # MCP integration components
│   │   └── MCPServerForm.tsx # MCP server configuration
│   ├── forms/            # Specialized form components
│   │   ├── CommonFormFields.tsx # Common form inputs
│   │   ├── GraphRagFormFields.tsx # Graph RAG configuration
│   │   ├── RaptorFormFields.tsx # RAPTOR algorithm settings
│   │   └── AutoKeywordsFormField.tsx # Auto-keyword extraction
│   └── layout/           # Layout components
│       ├── Layout.tsx    # Main app layout with auth guard
│       ├── Header.tsx    # App header with user menu
│       └── Sidebar.tsx   # Navigation sidebar with modern design
├── pages/                # Application pages
│   ├── auth/             # Authentication
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/        # Dashboard
│   │   └── DashboardPage.tsx
│   ├── chat/             # Chat interface
│   │   └── ChatPage.tsx
│   ├── knowledge/        # Knowledge base management
│   │   ├── KnowledgeListPage.tsx # KB listing and management
│   │   ├── KnowledgeCreatePage.tsx # KB creation wizard
│   │   ├── KnowledgeImportPage.tsx # Document import
│   │   ├── KnowledgeDetailLayout.tsx # KB detail layout
│   │   ├── KnowledgeDocumentsPage.tsx # Document management
│   │   ├── KnowledgeSearchPage.tsx # Search interface
│   │   ├── KnowledgeSettingsPage.tsx # KB configuration
│   │   ├── DocumentChunksPage.tsx # Document chunk viewer
│   │   └── settings/     # Parser configuration components
│   │       ├── configuration/ # Specialized parser configs
│   │       ├── ParserVisualizationPanel.tsx
│   │       └── configuration-form-container.tsx
│   ├── ai-tools/         # AI tools and utilities
│   │   ├── AIToolsHomePage.tsx # Tools homepage
│   │   ├── AutoFillWorkbenchPage.tsx # Auto-fill workbench
│   │   └── ref/          # Reference implementations
│   ├── studio/           # App creation studio
│   │   ├── StudioPage.tsx # Studio homepage
│   │   ├── CreateAppPage.tsx # App creation wizard
│   │   └── components/   # Studio-specific components
│   ├── dialog/           # Dialog management
│   │   ├── DialogListPage.tsx # Dialog listing
│   │   └── PromptEditorPage.tsx # Prompt editing
│   ├── explore/          # Content exploration
│   │   └── ExplorePage.tsx # Explore interface
│   ├── system/           # System monitoring
│   │   └── SystemPage.tsx # System dashboard
│   ├── settings/         # Application settings
│   │   ├── SettingsLayout.tsx # Settings layout
│   │   ├── ProfilePage.tsx # User profile
│   │   ├── SecurityPage.tsx # Security settings
│   │   ├── ModelProvidersPage.tsx # LLM provider config
│   │   ├── MCPServersPage.tsx # MCP server management
│   │   ├── MCPToolsPage.tsx # MCP tools browser
│   │   ├── MCPTestPage.tsx # MCP testing interface
│   │   ├── MCPBatchPage.tsx # MCP batch operations
│   │   └── ApiKeysPage.tsx # Comprehensive API key management with OpenAPI docs
│   ├── MCPChatPage.tsx   # MCP-enhanced chat
│   ├── MCPDashboard.tsx  # MCP dashboard
│   └── theme-demo/       # Theme demonstration
├── stores/               # Zustand state management
│   ├── auth.ts           # Authentication state
│   ├── ui.ts             # UI state (sidebar, theme, notifications)
│   ├── chat.ts           # Chat state
│   ├── conversation.ts   # Conversation management
│   ├── knowledge.ts      # Knowledge base state
│   ├── model.ts          # Model configurations
│   └── index.ts          # Store initialization with persistence
├── themes/               # Advanced design system
│   ├── tokens.ts         # Design token definitions
│   ├── theme-generator.ts # Automated theme generation
│   ├── build-themes.ts   # Theme build script
│   ├── tailwind-vars.ts  # Tailwind CSS integration
│   ├── light.css         # Light theme CSS variables
│   ├── dark.css          # Dark theme CSS variables
│   └── *.md              # Design system documentation
├── hooks/                # Custom React hooks
│   ├── use-auth.ts       # Authentication hooks
│   ├── use-conversations.ts # Conversation hooks
│   └── use-system-status.ts # System status hooks
├── lib/                  # Core utilities and configurations
│   ├── router.tsx        # React Router configuration with nested routes
│   ├── query-client.ts   # TanStack Query setup
│   ├── utils.ts          # Utility functions
│   └── toast.ts          # Toast notification system
├── types/                # TypeScript type definitions
│   ├── api.ts            # Comprehensive API types (1000+ lines)
│   └── index.ts          # Type exports
├── constants/            # Application constants
│   └── index.ts          # Routes, API URLs, file types, etc.
└── assets/               # Static assets
    ├── react.svg         # React logo
    └── svg/              # SVG icon library
        └── file-icon/    # File type icons (40+ formats)
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd web
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Available Scripts

```bash
# Development
npm run dev          # Start development server (localhost:5173, accessible externally)
npm run build        # Build for production (TypeScript + Vite)
npm run preview      # Preview production build
npm run lint         # Run ESLint for code quality

# Design System
npm run build:themes # Generate CSS theme files from design tokens

# Type Checking & Quality
npx tsc --noEmit     # TypeScript type checking without emit
```

## ⚙️ Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000  # Backend API URL
```

### API Configuration

The application uses a custom API client (`src/api/client.ts`) that provides:

- Automatic token management
- Request/response interceptors
- Error handling
- Timeout management
- File upload support

## 📱 Features Overview

### 1. Authentication System
- Login/Register pages
- JWT token management
- Protected routes with AuthGuard
- Automatic token refresh

### 2. Dashboard
- System overview
- Quick access to main features
- Activity summaries

### 3. Smart Conversation
- Real-time chat interface
- Message history
- Conversation management
- Streaming responses

### 🔧 Settings & Configuration
- **User Management**: Profile, security, API keys, and authentication settings
- **LLM Providers**: Configure multiple AI providers (OpenAI, Anthropic, Claude, etc.)
- **API Key Management**: Full-featured API key management with CRUD operations, search, and pagination
- **API Documentation**: Interactive OpenAPI documentation system with Monaco editor integration
- **MCP Integration**: Server management, tool discovery, testing, and batch operations
- **Security & Privacy**: Advanced security settings and access controls
- **Theme System**: Light/dark mode with advanced design token customization

## 🎨 Design System & UI

### Advanced Design System
- **Design Tokens**: Comprehensive token system with automated CSS generation
- **Theme Support**: Advanced light/dark mode with CSS custom properties
- **Component Library**: 50+ reusable UI components with consistent styling
- **Icon System**: File type icons (40+ formats), provider icons, and SVG assets

### Key UI Components
- **Form System**: Advanced form components with React Hook Form + Zod validation
- **Code Editor**: Monaco Editor integration with read-only mode and syntax highlighting
- **Data Visualization**: Task executor charts, system status cards, and metrics displays
- **API Documentation**: Interactive OpenAPI viewer with request/response formatting
- **File Management**: File icons, drag-and-drop, batch operations interface
- **Navigation**: Modern sidebar with floating card design and responsive layout
- **Authentication**: Carousel-based login/register with image fallbacks

### Layout Architecture
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Variants**: Using Class Variance Authority for systematic styling
- **Accessibility**: ARIA labels, keyboard navigation, and screen reader support
- **Performance**: Optimized rendering with backdrop-blur removal and efficient CSS

## 📊 State Management

### Zustand Stores
- **`auth`**: User authentication, JWT tokens, user profile, tenant information
- **`ui`**: UI state management (sidebar visibility, notifications, theme preferences)
- **`chat`**: Chat interface state and message management
- **`conversation`**: Conversation history, settings, and streaming state
- **`knowledge`**: Knowledge base management, document states, search results
- **`model`**: LLM provider configurations and model settings

### Store Features
- **Persistence**: Automatic state persistence with localStorage
- **Middleware**: DevTools integration for debugging
- **Type Safety**: Full TypeScript support with proper typing
- **Initialization**: Centralized store initialization system

### TanStack Query
- API state management
- Caching and synchronization
- Background refetching
- Optimistic updates

## 🔒 Security Features

- JWT token authentication
- Route protection
- XSS protection
- CSRF protection
- Secure API communication
- Input validation with Zod

## 📈 Performance Optimization

- Code splitting with React.lazy
- Image optimization
- Bundle size optimization
- Efficient re-rendering with React.memo
- API response caching
- Debounced search inputs

## 🌍 Browser Support

- Chrome (last 2 versions)
- Firefox (last 2 versions)  
- Safari (last 2 versions)
- Edge (last 2 versions)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'feat: add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test additions/modifications
- `chore:` - Build process or auxiliary tool changes

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Contact the development team

---

**Version**: 0.6.1+ | Built with ❤️ using React 19 + TypeScript 5.8 + Vite 7

## 🏗️ Architecture Highlights

- **Modern Stack**: React 19, Vite 7, TypeScript 5.8 with latest ecosystem tools
- **Design System**: Advanced theming with automated CSS generation and design tokens
- **State Management**: Zustand + TanStack Query for optimal client/server state
- **MCP Integration**: Comprehensive Model Context Protocol support
- **Performance**: Optimized bundle size, efficient rendering, and responsive design
- **Developer Experience**: TypeScript-first, comprehensive tooling, and modern practices
