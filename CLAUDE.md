# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm run dev` - Start development server (runs on localhost:5173, accessible externally via 0.0.0.0)
- `npm run build` - Build for production (runs TypeScript compilation + Vite build)
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint for code quality checks
- `npx tsc --noEmit` - TypeScript type checking without emitting files

### Theme Development
- `npm run build:themes` - Generate CSS theme files (light.css, dark.css) from design tokens

## Architecture Overview

This is a React 19 + TypeScript 5.8 + Vite 7 application implementing a Multi-RAG frontend with intelligent conversation, knowledge base management, and system monitoring.

### Key Architecture Patterns

**State Management**: Uses Zustand for client state with persistence, TanStack Query for server state management and caching.

**Component Architecture**:
- 48 base UI components in `src/components/ui/`
- 96 feature-specific components organized by domain (auth, knowledge, chat, mcp, environment, forms, layout, agent)
- Layout components handling responsive design with modern sidebar

**Agent Canvas System**: Visual workflow builder using @xyflow/react for node-based agent design and automation pipelines.

**Document Preview System**: Multi-format document preview supporting PDF, DOCX, Excel (.xlsx), PowerPoint (.pptx) with in-browser rendering via specialized libraries (react-pdf-highlighter, docx-preview, pptx-preview, @js-preview/excel).

**Security**: XSS protection via DOMPurify for user-generated content and search result highlighting.

**API Layer**: Centralized API client (`src/api/client.ts`) with automatic token management, request/response interceptors, error handling, and file upload support.

**Design System**: Advanced theming system with:
- Design tokens in `src/themes/tokens.ts`
- Automated theme generation via `src/themes/build-themes.ts`
- CSS custom properties for light/dark modes
- Tailwind CSS integration with semantic color mapping

### Critical Directories

- `src/api/` - API clients organized by domain (auth, chat, conversation, knowledge, system, llm, agent, mcp, mcp-chat, document, dialog, environment)
- `src/stores/` - Zustand stores (auth, ui, chat, conversation, knowledge, model, environmentStore)
- `src/pages/` - 97 page files across 34 modules with nested routing structure
- `src/pages/agent/` - Agent canvas system (AgentListPage, AgentCanvasPage with node-based workflow builder)
- `src/components/ui/` - 48 base UI components
- `src/components/chat/` - 19 chat components (ChatInput, ChatMessage, MarkdownRenderer, ToolCallDisplay, InlineSourceRef, ReferenceDocumentList)
- `src/components/knowledge/` - 10 knowledge components including DocumentPreview (multi-format) and HighlightText (search highlighting)
- `src/themes/` - Design system and theme generation
- `src/types/api.ts` - Comprehensive TypeScript API types (1,284 lines)
- `src/hooks/` - Custom React hooks (use-auth, use-conversations, use-dialog-apps, use-system-status, useDebouncedValue)

### Configuration Files

**Vite Configuration**: Uses `@` alias for `./src`, server runs on 0.0.0.0:5173 for external access.

**ESLint**: TypeScript ESLint config with React Hooks and React Refresh plugins, targeting browser globals.

**Tailwind**: Extended with design token integration, semantic color mapping, custom animations, and plugins for forms, typography, and scrollbars.

## Environment Setup

Copy `.env.example` to `.env.local` and configure:
- `VITE_API_BASE_URL` - Backend API endpoint (default: http://localhost:8000)
- `VITE_WS_BASE_URL` - WebSocket endpoint for real-time features
- Feature flags for analytics, debug mode, and registration

## Development Workflow

**Routing**: React Router DOM 7.7 with nested routes, protected routes via AuthGuard component.

**Forms**: React Hook Form + Zod validation pattern used throughout.

**File Handling**: React Dropzone integration with 40+ file type icons and comprehensive file type support.

**API Integration**: All API calls go through centralized client with JWT token management and automatic error handling.

## Testing & Quality

Run linting before commits: `npm run lint`
Type checking: `npx tsc --noEmit`
No specific test framework detected - check with team for testing approach.

## Key Dependencies

### Core Framework
- **React 19.1** with React DOM for UI
- **Vite 7.0** for build tooling
- **TypeScript 5.8** for type safety

### State & Routing
- **Zustand 5.0** for client state management with persistence
- **TanStack Query 5.83** for server state and caching
- **React Router DOM 7.7** for routing

### UI & Styling
- **Tailwind CSS 3.4** with Forms, Typography, and Scrollbar plugins
- **Radix UI** (20+ primitives) for accessible components
- **Ant Design 6.0** + @ant-design/x for additional UI components
- **Lucide React 0.525** for icons
- **Class Variance Authority** + Tailwind Merge + CLSX for styling utilities

### Specialized Libraries
- **@xyflow/react 12.9** for agent canvas/workflow builder
- **@monaco-editor/react 4.7** for code editing
- **Recharts 3.1** for data visualization
- **React Hook Form 7.60** + Zod 4.0 for form validation

### Document Processing
- **react-pdf-highlighter 6.1** for PDF viewing
- **docx-preview 0.3.7** for DOCX preview
- **pptx-preview 1.0.7** for PowerPoint preview
- **@js-preview/excel 1.7.14** for Excel preview
- **mammoth 1.11** for DOCX parsing

### Security & Utilities
- **DOMPurify 3.3** for XSS protection
- **React Dropzone 14.3** for file uploads
- **DND Kit** for drag-and-drop interfaces

## Design System Notes

The application uses a sophisticated design token system. When working with colors or themes:
1. Use semantic color tokens from `src/themes/tokens.ts`
2. Regenerate theme files after token changes: `npm run build:themes`
3. Colors are mapped to Tailwind CSS custom properties
4. Support for light/dark modes via CSS custom properties