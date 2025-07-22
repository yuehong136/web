# Multi-RAG Frontend

A modern React-based frontend application for Multi-RAG system, providing intelligent conversation, knowledge base management, system monitoring, and more.

## 🚀 Features

- **Smart Conversation**: AI-powered chat interface with real-time streaming
- **Knowledge Base**: Document upload, processing, and intelligent retrieval
- **System Monitoring**: Real-time system status and task executor monitoring
- **Model Management**: Support for multiple LLM providers and configurations  
- **MCP Servers**: Model Context Protocol server management
- **User Management**: Authentication and profile management
- **Responsive Design**: Mobile-first design with Tailwind CSS

## 📋 Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 5.0 + TanStack Query 5.8
- **Routing**: React Router DOM 7.7
- **Charts**: Recharts 3.1
- **Forms**: React Hook Form 7.6 + Zod 4.0
- **Icons**: Lucide React
- **HTTP Client**: Custom API client with fetch

## 🏗️ Project Structure

```
src/
├── api/                    # API clients and types
│   ├── client.ts          # Base API client
│   ├── auth.ts            # Authentication APIs
│   ├── conversation.ts    # Chat/conversation APIs
│   ├── knowledge.ts       # Knowledge base APIs
│   ├── system.ts          # System monitoring APIs
│   └── index.ts           # API exports
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   ├── auth/             # Authentication components
│   ├── feature/          # Feature-specific components
│   └── layout/           # Layout components
├── pages/                # Application pages
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # Dashboard page
│   ├── chat/             # Chat interface
│   ├── knowledge/        # Knowledge base management
│   ├── system/           # System monitoring
│   └── settings/         # Settings pages
├── stores/               # Zustand state stores
├── hooks/                # Custom React hooks
├── lib/                  # Utilities and configurations
├── types/                # TypeScript type definitions
├── constants/            # Application constants
└── assets/               # Static assets
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
- Document upload (PDF, DOCX, TXT, MD)
- Knowledge base creation and management
- Document processing status
- Search and retrieval

### 5. System Monitoring
- Real-time system status
- Component health checks (Database, Redis, Storage, Doc Engine)
- Task executor monitoring with charts
- Performance metrics

### 6. Settings
- User profile management
- Model provider configurations
- API key management
- System preferences

## 🎨 UI Components

The application uses a consistent design system built with:

- **Base Components**: Button, Input, Card, Modal, etc.
- **Layout Components**: Header, Sidebar, Layout wrapper
- **Feature Components**: StatusCard, TaskExecutorChart, etc.
- **Responsive Design**: Mobile-first approach
- **Dark Mode**: System preference detection

## 📊 State Management

### Zustand Stores
- `auth`: Authentication state
- `ui`: UI state (sidebar, notifications, theme)
- `chat`: Conversation management
- `knowledge`: Knowledge base state
- `model`: Model configurations

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

Built with ❤️ using React + TypeScript + Vite
