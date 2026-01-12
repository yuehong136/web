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
- **CRITICAL**: Strict separation between presentational and container components (see Component Guidelines below)

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

## Component Architecture Guidelines

### Presentational vs Container Components (MANDATORY SEPARATION)

**Presentational Components** (in `src/components/ui/`, `src/components/vendor/ui/`)
- ✅ Pure display components that only render UI based on props
- ✅ Can use controlled component patterns
- ✅ May contain UI logic (animations, expand/collapse states)
- ❌ **FORBIDDEN**: `useState`, `useEffect`, `useRef` (except DOM refs)
- ❌ **FORBIDDEN**: Direct API calls or store access
- ❌ **FORBIDDEN**: Business logic (data fetching, state management, side effects)

**Example - Correct Presentational Component**:
```typescript
interface MessageBubbleProps {
  content: string;
  sender: string;
  isCurrentUser: boolean;
  onEdit?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  content, sender, isCurrentUser, onEdit
}) => {
  return (
    <div className={cn(
      'flex flex-col gap-space-xs p-space-base rounded-radius-lg',
      isCurrentUser ? 'bg-surface-accent' : 'bg-surface-secondary'
    )}>
      <div className="text-text-body-lg">{content}</div>
      <span className="text-text-caption">{sender}</span>
      {onEdit && <button onClick={onEdit}>Edit</button>}
    </div>
  );
};
```

**Container Components** (in `src/pages/`, feature-specific component folders)
- ✅ Handle business logic, data fetching, state management
- ✅ Use all React Hooks, API calls, Zustand stores, TanStack Query
- ✅ Pass data and callbacks to presentational components via props
- ⚠️ Minimize direct UI code, primarily compose presentational components

**Example - Correct Container Component**:
```typescript
export const ChatContainer: React.FC = () => {
  const { messages, isLoading } = useChatStore();
  const [input, setInput] = useState('');
  const sendMessageMutation = useSendMessage();
  
  const handleSend = async () => {
    await sendMessageMutation.mutateAsync(input);
    setInput('');
  };
  
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      <ChatInput value={input} onChange={setInput} onSend={handleSend} />
    </div>
  );
};
```

### ESLint Enforcement
Configure ESLint to enforce this separation:
```javascript
// eslint.config.js
{
  files: ['src/components/ui/**/*.tsx', 'src/components/vendor/ui/**/*.tsx'],
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['@/api/*', '@/stores/*'],
        message: 'Presentational components must not import API or stores'
      }]
    }]
  }
}
```

## Design System & Styling Constraints

### MANDATORY: Design Token Usage (NO ARBITRARY VALUES)

The application uses a sophisticated design token system. **Arbitrary values are FORBIDDEN**.

#### Required Token Usage
**Colors**:
- ✅ USE: `bg-surface-primary`, `text-text-body`, `border-border-default`
- ❌ FORBIDDEN: `bg-[#1a73e8]`, `text-[#333]`, `bg-blue-600`

**Spacing**:
- ✅ USE: `p-space-base`, `m-space-lg`, `gap-space-md`
- ❌ FORBIDDEN: `p-4`, `p-[20px]`, `m-8`

**Radius**:
- ✅ USE: `rounded-radius-lg`, `rounded-radius-md`
- ❌ FORBIDDEN: `rounded-lg`, `rounded-[12px]`

**Shadows**:
- ✅ USE: `shadow-elevation-low`, `shadow-elevation-high`
- ❌ FORBIDDEN: `shadow-md`, `shadow-[0_4px_6px_rgba(0,0,0,0.1)]`

#### Design Token Priority
When writing styles, use this priority order:
1. **Semantic tokens** (highest priority): `bg-surface-primary`, `text-text-body`
2. **Functional tokens**: `p-space-base`, `gap-space-md`
3. **Tailwind layout utilities**: `flex`, `grid`, `absolute`
4. **NEVER arbitrary values**: Avoid `[#hex]`, `[12px]`

#### Allowed Exceptions
Only these Tailwind native classes are permitted:
- Layout: `flex`, `grid`, `absolute`, `relative`, `fixed`, `sticky`
- Sizing: `w-full`, `h-screen`, `max-w-*` (preset values only)
- Responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- State prefixes: `hover:`, `focus:`, `active:`, `disabled:`

#### Correct vs Incorrect Examples
```typescript
// ✅ CORRECT: Using design tokens
<button className="px-space-md py-space-sm bg-surface-primary text-text-primary rounded-radius-lg shadow-elevation-low">
  Submit
</button>

// ❌ INCORRECT: Using arbitrary/native values
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow-md">
  Submit
</button>

// ✅ CORRECT: Responsive with design tokens
<div className="p-space-sm md:p-space-base lg:p-space-lg bg-surface-primary">
  Responsive content
</div>

// ❌ INCORRECT: Mixed arbitrary values
<div className="p-2 md:p-[16px] lg:p-8 bg-[#f5f5f5]">
  Responsive content
</div>
```

#### Dark Mode Support
All color tokens automatically adapt to dark mode - DO NOT manually add `dark:` prefixes:
```typescript
// ✅ CORRECT: Automatic dark mode
<div className="bg-surface-primary text-text-primary">Content</div>

// ❌ INCORRECT: Manual dark mode override
<div className="bg-white dark:bg-gray-900">Content</div>
```

#### ESLint Enforcement
Configure `eslint-plugin-tailwindcss` to enforce token usage:
```javascript
// eslint.config.js
{
  plugins: ['tailwindcss'],
  rules: {
    'tailwindcss/no-arbitrary-value': 'error', // Forbid arbitrary values
    'tailwindcss/enforces-negative-arbitrary-values': 'error',
  }
}
```

#### Design Token Update Process
When new styling needs arise:
1. **First**: Check if `src/themes/tokens.ts` has an appropriate token
2. **If not**: Consult product/design team to add to design system
3. **FORBIDDEN**: Create temporary arbitrary values to bypass system
4. **After adding tokens**: Run `npm run build:themes` to regenerate CSS

### Design Token Reference
Available token categories (see `src/themes/tokens.ts`):
- **Colors**: `surface-*`, `text-*`, `border-*`, `status-*`
- **Spacing**: `space-xs`, `space-sm`, `space-base`, `space-md`, `space-lg`, `space-xl`, `space-2xl`
- **Radius**: `radius-sm`, `radius-md`, `radius-lg`, `radius-xl`, `radius-full`
- **Elevation**: `elevation-low`, `elevation-medium`, `elevation-high`
- **Typography**: `body-sm`, `body-base`, `body-lg`, `heading-*`
- **Icons**: `icon-sm`, `icon-md`, `icon-lg`, `icon-xl`, `icon-2xl`

## Figma MCP Integration (Design-to-Code Workflow)

When using Figma MCP to generate first-pass display code from design files:

### MANDATORY Constraints for Generated Code

**1. Style System Constraints**:
- ✅ MUST map Figma values to project design tokens
- ❌ NEVER use Figma's arbitrary values directly

**2. Icon Library Constraints**:
- ✅ MUST use **Lucide React** icons exclusively
- ❌ FORBIDDEN: Phosphor, Heroicons, custom SVGs, or other icon libraries
```typescript
// ✅ CORRECT
import { Search, User, Settings } from 'lucide-react';
<Search className="w-icon-md h-icon-md text-text-secondary" />

// ❌ INCORRECT
import { MagnifyingGlass } from 'phosphor-react'; // Wrong library
```

**3. Component Library Constraints**:
- ✅ MUST use existing project components from `@/components/ui/*`
- ❌ FORBIDDEN: Introducing new UI libraries without approval
```typescript
// ✅ CORRECT
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

// ❌ INCORRECT
import { Button } from 'antd'; // Unapproved library
import { Modal } from 'react-modal'; // Use project Dialog instead
```

### Figma-to-Token Mapping Tables

**Color Mapping**:
| Figma Color Type | Map to Design Token |
|-----------------|-------------------|
| Primary/Brand | `bg-surface-accent`, `text-text-accent` |
| Background | `bg-surface-primary`, `bg-surface-secondary` |
| Text | `text-text-primary`, `text-text-secondary` |
| Border | `border-border-default`, `border-border-subtle` |
| Success/Error/Warning | `bg-status-success`, `bg-status-error`, `bg-status-warning` |

**Spacing Mapping**:
| Figma Spacing | Map to Design Token |
|--------------|-------------------|
| 4px | `space-xs` |
| 8px | `space-sm` |
| 12px | `space-base` |
| 16px | `space-md` |
| 24px | `space-lg` |
| 32px | `space-xl` |
| Other values | ⚠️ Require design system confirmation |

### Handling Unmappable Values
When Figma designs contain values not in the design system:
1. **Add TODO comment** with original Figma value
2. **Ask user for confirmation** before introducing new tokens
3. **Use closest existing token** as temporary fallback
4. **NEVER create arbitrary values** without approval

**Example**:
```typescript
// TODO: Figma uses #5E3AEE for emphasis, but no matching token exists
// Original: bg-[#5E3AEE]
// Question: Should this be added to src/themes/tokens.ts as accent-purple?
// Temporary fallback to closest token:
<div className="bg-surface-accent">
```

### Generated Code Quality Standards
MCP-generated code MUST:
- ✅ Follow presentational/container separation (generate pure presentational components)
- ✅ Use project design tokens exclusively (no arbitrary values)
- ✅ Use Lucide React icon library
- ✅ Use existing `@/components/ui/*` components
- ✅ Include TypeScript type definitions
- ✅ Follow kebab-case file naming conventions
- ✅ Include complete props interfaces

### MCP Generation Workflow Example
```bash
# 1. AI reads Figma design via MCP
Component: UserProfileCard
- Size: 320x200px
- Background: #F5F5F5
- Text: #333333, 16px, Inter font
- Spacing: padding 16px, gap 12px
- Border radius: 8px

# 2. AI maps to design tokens
Background: #F5F5F5 → bg-surface-secondary
Text: #333333 → text-text-primary
Spacing: 16px → p-space-md, 12px → gap-space-base
Radius: 8px → rounded-radius-lg

# 3. AI generates component code
export interface UserProfileCardProps {
  name: string;
  avatar: string;
  bio: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({
  name, avatar, bio
}) => {
  return (
    <div className="flex flex-col gap-space-base p-space-md bg-surface-secondary rounded-radius-lg">
      <img src={avatar} alt={name} className="w-icon-2xl h-icon-2xl rounded-full" />
      <h3 className="text-text-primary text-body-lg">{name}</h3>
      <p className="text-text-secondary text-body-sm">{bio}</p>
    </div>
  );
};
```

## Theme System Notes

When working with colors or themes:
1. Use semantic color tokens from `src/themes/tokens.ts` (MANDATORY)
2. Regenerate theme files after token changes: `npm run build:themes`
3. Colors are mapped to Tailwind CSS custom properties
4. Automatic light/dark mode support via CSS custom properties
5. NEVER use arbitrary color values or Tailwind native color classes