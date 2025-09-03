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
- 40+ reusable UI components in `src/components/ui/`
- Feature-specific components organized by domain (auth, knowledge, chat, etc.)
- Layout components handling responsive design with modern sidebar

**API Layer**: Centralized API client (`src/api/client.ts`) with automatic token management, request/response interceptors, error handling, and file upload support.

**Design System**: Advanced theming system with:
- Design tokens in `src/themes/tokens.ts`
- Automated theme generation via `src/themes/build-themes.ts`
- CSS custom properties for light/dark modes
- Tailwind CSS integration with semantic color mapping

### Critical Directories

- `src/api/` - API clients organized by domain (auth, chat, knowledge, system, llm)
- `src/stores/` - Zustand stores (auth, ui, chat, conversation, knowledge, model)
- `src/pages/` - Application pages with nested routing structure
- `src/components/ui/` - 40+ base UI components
- `src/themes/` - Design system and theme generation
- `src/types/api.ts` - Comprehensive TypeScript API types (950+ lines)

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

- **React 19.1** with React DOM for UI
- **Vite 7.0** for build tooling  
- **TypeScript 5.8** for type safety
- **Tailwind CSS 3.4** for styling
- **Zustand 5.0** for state management
- **TanStack Query 5.8** for server state
- **React Router DOM 7.7** for routing
- **Radix UI** components for accessibility
- **Recharts 3.1** for data visualization
- **Lucide React** for icons

## Design System Notes

The application uses a sophisticated design token system. When working with colors or themes:
1. Use semantic color tokens from `src/themes/tokens.ts`
2. Regenerate theme files after token changes: `npm run build:themes`
3. Colors are mapped to Tailwind CSS custom properties
4. Support for light/dark modes via CSS custom properties