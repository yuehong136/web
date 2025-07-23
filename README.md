# Multi-RAG Frontend

A modern React-based frontend application for Multi-RAG system, providing intelligent conversation, knowledge base management, system monitoring, and more.

## 🆕 What's New in v0.6.0

- **📚 Complete Knowledge Base Management**: Full CRUD operations, document upload, search, and settings
- **🎨 Enhanced UI Components**: 40+ UI components with file type icons for 40+ file formats
- **🔧 LLM Provider Integration**: Support for multiple LLM providers with configuration management
- **📊 Advanced System Monitoring**: Real-time system status and task executor monitoring with charts
- **🏗️ Improved Architecture**: Updated to React 19, Vite 7, and latest dependencies
- **🎯 Better Developer Experience**: Comprehensive TypeScript types, improved error handling

## 🚀 Features

- **Smart Conversation**: AI-powered chat interface with real-time streaming
- **Knowledge Base**: Document upload, processing, and intelligent retrieval
- **System Monitoring**: Real-time system status and task executor monitoring
- **Model Management**: Support for multiple LLM providers and configurations  
- **MCP Servers**: Model Context Protocol server management
- **User Management**: Authentication and profile management
- **Responsive Design**: Mobile-first design with Tailwind CSS

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
│   ├── ui/               # Base UI components (40+ components)
│   │   ├── button.tsx    # Button with variants
│   │   ├── input.tsx     # Form inputs
│   │   ├── card.tsx      # Card layouts
│   │   ├── modal.tsx     # Modal dialogs
│   │   ├── table.tsx     # Data tables
│   │   ├── file-icon.tsx # File type icons (40+ types)
│   │   ├── avatar.tsx    # User avatars
│   │   ├── badge.tsx     # Status badges
│   │   ├── checkbox.tsx  # Form checkboxes
│   │   ├── dropdown.tsx  # Dropdown menus
│   │   ├── tooltip.tsx   # Tooltips
│   │   └── ...           # More UI components
│   ├── auth/             # Authentication components
│   │   └── AuthGuard.tsx # Route protection
│   ├── knowledge/        # Knowledge base components
│   │   ├── EmbeddingModelSelector.tsx
│   │   └── QuickEditModal.tsx
│   ├── forms/            # Form components
│   ├── feature/          # Feature-specific components
│   └── layout/           # Layout components
│       ├── Layout.tsx    # Main app layout
│       ├── Header.tsx    # App header
│       └── Sidebar.tsx   # Navigation sidebar
├── pages/                # Application pages
│   ├── auth/             # Authentication pages
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/        # Dashboard page
│   │   └── DashboardPage.tsx
│   ├── chat/             # Chat interface
│   │   └── ChatPage.tsx
│   ├── knowledge/        # Knowledge base management
│   │   ├── KnowledgeListPage.tsx      # Knowledge base list
│   │   ├── KnowledgeCreatePage.tsx    # Create knowledge base
│   │   ├── KnowledgeImportPage.tsx    # Import documents
│   │   ├── KnowledgeDetailLayout.tsx  # Knowledge base detail layout
│   │   ├── KnowledgeDocumentsPage.tsx # Document management
│   │   ├── KnowledgeSearchPage.tsx    # Search interface
│   │   └── KnowledgeSettingsPage.tsx  # Knowledge base settings
│   ├── system/           # System monitoring
│   │   └── SystemPage.tsx
│   ├── settings/         # Settings pages
│   │   ├── SettingsLayout.tsx         # Settings layout
│   │   ├── ProfilePage.tsx            # User profile
│   │   └── ModelProvidersPage.tsx     # LLM provider settings
│   ├── documents/        # Document management (placeholder)
│   ├── ai-tools/         # AI tools (placeholder)
│   ├── workflow/         # Workflow management (placeholder)
│   └── mcp-servers/      # MCP server management (placeholder)
├── stores/               # Zustand state stores
│   ├── auth.ts           # Authentication state
│   ├── ui.ts             # UI state (sidebar, theme, notifications)
│   ├── chat.ts           # Chat state
│   ├── conversation.ts   # Conversation management
│   ├── knowledge.ts      # Knowledge base state
│   ├── model.ts          # Model configurations
│   └── index.ts          # Store initialization
├── hooks/                # Custom React hooks
│   ├── use-auth.ts       # Authentication hooks
│   ├── use-conversations.ts # Conversation hooks
│   └── use-system-status.ts # System status hooks
├── lib/                  # Utilities and configurations
│   ├── router.tsx        # React Router configuration
│   ├── query-client.ts   # TanStack Query setup
│   ├── utils.ts          # Utility functions
│   └── toast.ts          # Toast notifications
├── types/                # TypeScript type definitions
│   ├── api.ts            # API response types (950+ lines)
│   └── index.ts          # Type exports
├── constants/            # Application constants
│   └── index.ts          # Routes, API URLs, etc.
├── assets/               # Static assets
│   ├── react.svg         # React logo
│   └── svg/              # SVG icons
│       └── file-icon/    # File type icons (40+ types)
│           ├── pdf.svg, docx.svg, txt.svg
│           ├── jpg.svg, png.svg, gif.svg
│           ├── mp4.svg, mp3.svg, avi.svg
│           └── ...       # More file type icons
└── utils/                # Additional utilities
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
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # TypeScript type checking
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

### 4. Knowledge Base Management
- **Knowledge Base Creation**: Create and configure knowledge bases with custom settings
- **Document Upload**: Support for multiple file types (PDF, DOCX, TXT, MD, and 40+ file types)
- **Document Management**: View, organize, and manage uploaded documents
- **Embedding Models**: Configure and select embedding models for knowledge bases
- **Search Interface**: Advanced search and retrieval within knowledge bases
- **Import/Export**: Bulk import documents and export knowledge base data
- **Processing Status**: Real-time document processing and indexing status
- **Quick Edit**: In-place editing of knowledge base settings

### 5. System Monitoring
- Real-time system status
- Component health checks (Database, Redis, Storage, Doc Engine)
- Task executor monitoring with charts
- Performance metrics

### 6. Settings & Configuration
- **User Profile**: Personal information and account settings
- **Model Providers**: Configure LLM providers (OpenAI, Anthropic, etc.)
- **API Keys**: Secure API key management for various services
- **Security Settings**: Password, 2FA, and security preferences (planned)
- **Notifications**: Notification preferences and settings (planned)
- **Appearance**: Theme, language, and UI customization (planned)
- **System Preferences**: Application-wide configuration options

### 7. Additional Features (In Development)
- **Document Management**: Centralized document repository
- **AI Tools**: Collection of AI-powered utilities
- **Workflow Management**: Automated workflow creation and execution
- **MCP Servers**: Model Context Protocol server management

## 🎨 UI Components

The application uses a comprehensive design system built with:

### Base UI Components (40+ components)
- **Form Components**: Button, Input, Checkbox, Custom Select, Dropdown
- **Layout Components**: Card, Modal, Table, Avatar, Badge
- **Interactive Components**: Tooltip, Loading, Status Card
- **File Components**: File Icon (40+ file types), Dropzone integration
- **Data Visualization**: Task Executor Chart, System Status Cards

### Layout System
- **Main Layout**: Header, Sidebar, Content area with responsive design
- **Authentication Guard**: Route protection and user session management
- **Navigation**: Dynamic sidebar with active state management

### Design Features
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Component Variants**: Using Class Variance Authority for consistent styling
- **File Type Recognition**: Comprehensive file icon system for 40+ file types
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Theme System**: Consistent color palette and typography (dark mode planned)

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

**Version**: 0.6.0 | Built with ❤️ using React 19 + TypeScript 5.8 + Vite 7
