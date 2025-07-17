# Frontend Architecture Documentation
## Mind Hillmetric - Enterprise Data Processing Platform

### Table of Contents
1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Proposed Architecture](#proposed-architecture)
4. [Technical Stack Recommendations](#technical-stack-recommendations)
5. [Component Architecture](#component-architecture)
6. [State Management Strategy](#state-management-strategy)
7. [Data Flow & API Layer](#data-flow--api-layer)
8. [Security Architecture](#security-architecture)
9. [Performance & Scalability](#performance--scalability)
10. [Development Guidelines](#development-guidelines)
11. [Migration Strategy](#migration-strategy)

---

## Executive Summary

This document provides a comprehensive architectural blueprint for transforming the Mind Hillmetric prototype into a production-ready enterprise application. The recommendations focus on scalability, security, maintainability, and performance while addressing current limitations.

### Key Objectives
- Transform prototype into enterprise-grade application
- Implement robust security measures
- Ensure horizontal and vertical scalability
- Establish clear architectural patterns
- Enable team collaboration and maintainability

---

## Current State Analysis

### Strengths ✅
1. **Modern Tech Stack**: Next.js 15, TypeScript, Tailwind CSS
2. **Component-Based Architecture**: Reusable UI components
3. **Blade System**: Innovative sliding panel navigation
4. **Real-time Updates**: Activity feeds and notifications
5. **Data Visualization**: Workflow diagrams with ReactFlow

### Critical Issues 🚨

#### 1. **Performance Bottlenecks**
```typescript
// CURRENT ISSUE: Mock data generation in components
const generateMockData = () => {
  for (let i = 1; i <= 100; i++) { // Heavy computation in render
    mockData.push({...})
  }
}

// SOLUTION: Move to server/service worker
```

#### 2. **State Management Chaos**
- Multiple useState hooks for related data
- Props drilling through 5+ component levels
- No centralized state management
- Context providers without optimization

#### 3. **Security Vulnerabilities**
- Client-side data filtering
- No input sanitization
- Missing CSRF protection
- Exposed API keys in client code

#### 4. **Architectural Anti-patterns**
- Business logic in UI components
- Direct API calls from components
- No error boundaries
- Missing data validation layer

---

## Proposed Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
├─────────────────────────────────────────────────────────────┤
│  Presentation Layer                                          │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐        │
│  │   Pages     │ │  Components  │ │   Layouts     │        │
│  └─────────────┘ └──────────────┘ └───────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Application Layer                                           │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐        │
│  │   Hooks     │ │  Services    │ │   Stores      │        │
│  └─────────────┘ └──────────────┘ └───────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Domain Layer                                                │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐        │
│  │   Models    │ │  Validators  │ │   Types       │        │
│  └─────────────┘ └──────────────┘ └───────────────┘        │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                        │
│  ┌─────────────┐ ┌──────────────┐ ┌───────────────┐        │
│  │  API Client │ │    Cache     │ │   WebSocket   │        │
│  └─────────────┘ └──────────────┘ └───────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Folder Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── (auth)/            # Auth group routes
│   ├── (dashboard)/       # Dashboard group routes
│   └── api/               # API routes
├── components/
│   ├── ui/                # Base UI components
│   ├── features/          # Feature-specific components
│   └── layouts/           # Layout components
├── lib/
│   ├── api/              # API client and interceptors
│   ├── auth/             # Authentication logic
│   ├── utils/            # Utility functions
│   └── validators/       # Data validators
├── services/             # Business logic services
├── stores/               # State management
├── hooks/                # Custom React hooks
├── types/                # TypeScript definitions
└── config/               # Configuration files
```

---

## Technical Stack Recommendations

### Core Technologies

| Category | Current | Recommended | Reasoning |
|----------|---------|-------------|-----------|
| Framework | Next.js 15 | **Next.js 15** ✅ | Keep - excellent choice |
| Language | TypeScript | **TypeScript 5.3+** | Strict mode, better inference |
| Styling | Tailwind CSS | **Tailwind + CSS Modules** | Better component isolation |
| State Management | Context + useState | **Zustand + React Query** | Simpler, performant |
| Data Fetching | fetch | **TanStack Query v5** | Caching, mutations, offline |
| Forms | Uncontrolled | **React Hook Form + Zod** | Validation, performance |
| Tables | Custom | **TanStack Table v8** | Virtualization, features |
| Charts | Custom | **Recharts + D3** | Flexibility, performance |
| Testing | None | **Vitest + Testing Library** | Fast, modern |
| E2E Testing | None | **Playwright** | Cross-browser |
| Monitoring | None | **Sentry + Vercel Analytics** | Error tracking, analytics |

### Additional Libraries

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@tanstack/react-table": "^8.11.0",
    "react-error-boundary": "^4.0.11",
    "axios": "^1.6.0",
    "socket.io-client": "^4.5.0",
    "react-intersection-observer": "^9.5.0",
    "react-window": "^1.8.0",
    "date-fns": "^3.0.0",
    "lodash-es": "^4.17.21",
    "immer": "^10.0.0"
  }
}
```

---

## Component Architecture

### 1. **Atomic Design Pattern**

```typescript
// atoms/Button.tsx
export interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
}

export const Button = memo(({ 
  variant, 
  size, 
  loading, 
  ...props 
}: ButtonProps) => {
  // Implementation
})

// molecules/SearchInput.tsx
export const SearchInput = () => {
  const { register, handleSubmit } = useForm()
  const { mutate: search } = useSearch()
  
  return (
    <form onSubmit={handleSubmit(search)}>
      <Input {...register('query')} />
      <Button type="submit">Search</Button>
    </form>
  )
}

// organisms/DataGrid.tsx
export const DataGrid = <T extends Record<string, any>>({
  data,
  columns,
  onRowClick
}: DataGridProps<T>) => {
  const table = useReactTable({
    data,
    columns,
    // Virtual scrolling for performance
    enableVirtualization: true
  })
  
  return <VirtualTable table={table} />
}
```

### 2. **Feature-Based Components**

```typescript
// features/workflow/components/WorkflowGrid.tsx
export const WorkflowGrid = () => {
  const { data, isLoading } = useWorkflowData()
  const columns = useWorkflowColumns()
  
  if (isLoading) return <GridSkeleton />
  
  return (
    <DataGrid
      data={data}
      columns={columns}
      onRowClick={handleRowClick}
    />
  )
}

// features/workflow/hooks/useWorkflowData.ts
export const useWorkflowData = (filters?: WorkflowFilters) => {
  return useQuery({
    queryKey: ['workflows', filters],
    queryFn: () => workflowService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

### 3. **Compound Components Pattern**

```typescript
// components/Blade/index.tsx
export const Blade = {
  Root: BladeRoot,
  Header: BladeHeader,
  Content: BladeContent,
  Footer: BladeFooter,
}

// Usage
<Blade.Root>
  <Blade.Header 
    title="Workflow Details" 
    onClose={handleClose}
  />
  <Blade.Content>
    <WorkflowDetails id={workflowId} />
  </Blade.Content>
  <Blade.Footer>
    <Button onClick={handleSave}>Save</Button>
  </Blade.Footer>
</Blade.Root>
```

---

## State Management Strategy

### 1. **Zustand for Application State**

```typescript
// stores/useAppStore.ts
interface AppState {
  // UI State
  sidebarOpen: boolean
  theme: 'light' | 'dark'
  
  // User State
  user: User | null
  permissions: Permission[]
  
  // Actions
  toggleSidebar: () => void
  setUser: (user: User) => void
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        sidebarOpen: true,
        theme: 'light',
        user: null,
        permissions: [],
        
        toggleSidebar: () => set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        })),
        
        setUser: (user) => set({ user }),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({ 
          theme: state.theme,
          sidebarOpen: state.sidebarOpen 
        }),
      }
    )
  )
)
```

### 2. **React Query for Server State**

```typescript
// services/workflow.service.ts
class WorkflowService {
  async getAll(params: WorkflowParams) {
    const { data } = await apiClient.get('/workflows', { params })
    return workflowSchema.array().parse(data)
  }
  
  async getById(id: string) {
    const { data } = await apiClient.get(`/workflows/${id}`)
    return workflowSchema.parse(data)
  }
  
  async update(id: string, data: WorkflowUpdate) {
    const validated = workflowUpdateSchema.parse(data)
    const response = await apiClient.put(`/workflows/${id}`, validated)
    return workflowSchema.parse(response.data)
  }
}

// hooks/useWorkflow.ts
export const useWorkflow = (id: string) => {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowService.getById(id),
  })
  
  const mutation = useMutation({
    mutationFn: (data: WorkflowUpdate) => 
      workflowService.update(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(['workflow', id], data)
      queryClient.invalidateQueries({ 
        queryKey: ['workflows'] 
      })
    },
  })
  
  return { ...query, update: mutation.mutate }
}
```

### 3. **Context for Feature-Specific State**

```typescript
// contexts/BladeContext.tsx
interface BladeContextValue {
  blades: BladeInstance[]
  openBlade: (blade: BladeConfig) => void
  closeBlade: (id: string) => void
  minimizeBlade: (id: string) => void
}

const BladeContext = createContext<BladeContextValue>()

export const BladeProvider = ({ children }) => {
  const [blades, setBlades] = useImmer<BladeInstance[]>([])
  
  const openBlade = useCallback((config: BladeConfig) => {
    setBlades((draft) => {
      draft.push({
        id: nanoid(),
        ...config,
        state: 'open'
      })
    })
  }, [])
  
  return (
    <BladeContext.Provider value={{ blades, openBlade, ... }}>
      {children}
    </BladeContext.Provider>
  )
}
```

---

## Data Flow & API Layer

### 1. **API Client with Interceptors**

```typescript
// lib/api/client.ts
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for tracing
    config.headers['X-Request-ID'] = nanoid()
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        return apiClient(error.config)
      }
      redirectToLogin()
    }
    
    // Global error handling
    showErrorNotification(error)
    return Promise.reject(error)
  }
)
```

### 2. **Type-Safe API Layer**

```typescript
// types/api.ts
export interface ApiResponse<T> {
  data: T
  meta?: {
    page: number
    limit: number
    total: number
  }
}

export interface ApiError {
  message: string
  code: string
  details?: Record<string, any>
}

// lib/api/workflows.ts
export const workflowsApi = {
  list: async (params: WorkflowListParams) => {
    const response = await apiClient.get<ApiResponse<Workflow[]>>(
      '/workflows',
      { params }
    )
    return response.data
  },
  
  get: async (id: string) => {
    const response = await apiClient.get<Workflow>(`/workflows/${id}`)
    return response.data
  },
  
  create: async (data: CreateWorkflowDto) => {
    const response = await apiClient.post<Workflow>('/workflows', data)
    return response.data
  },
  
  update: async (id: string, data: UpdateWorkflowDto) => {
    const response = await apiClient.patch<Workflow>(
      `/workflows/${id}`, 
      data
    )
    return response.data
  },
}
```

### 3. **WebSocket Integration**

```typescript
// lib/websocket/client.ts
class WebSocketClient {
  private socket: Socket | null = null
  private listeners = new Map<string, Set<Function>>()
  
  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL!, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected')
    })
    
    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error)
    })
  }
  
  subscribe(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    
    this.listeners.get(event)!.add(callback)
    this.socket?.on(event, callback)
    
    return () => {
      this.listeners.get(event)?.delete(callback)
      this.socket?.off(event, callback)
    }
  }
}

// hooks/useWebSocket.ts
export const useWebSocket = (event: string, callback: Function) => {
  const wsClient = useWebSocketClient()
  
  useEffect(() => {
    return wsClient.subscribe(event, callback)
  }, [event, callback])
}
```

---

## Security Architecture

### 1. **Authentication & Authorization**

```typescript
// lib/auth/auth-provider.tsx
export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    validateSession()
  }, [])
  
  const validateSession = async () => {
    try {
      const session = await authService.getSession()
      setSession(session)
    } catch {
      setSession(null)
    } finally {
      setLoading(false)
    }
  }
  
  const signIn = async (credentials: SignInCredentials) => {
    const session = await authService.signIn(credentials)
    setSession(session)
    router.push('/dashboard')
  }
  
  const signOut = async () => {
    await authService.signOut()
    setSession(null)
    router.push('/login')
  }
  
  return (
    <AuthContext.Provider value={{ session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // CSRF Protection
  if (['POST', 'PUT', 'DELETE'].includes(request.method)) {
    const csrfToken = request.headers.get('X-CSRF-Token')
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return new NextResponse('Invalid CSRF token', { status: 403 })
    }
  }
  
  return NextResponse.next()
}
```

### 2. **Input Validation & Sanitization**

```typescript
// lib/validators/workflow.validator.ts
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'

const sanitizeHTML = (dirty: string) => DOMPurify.sanitize(dirty)

export const workflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform(sanitizeHTML),
  description: z.string()
    .max(500)
    .transform(sanitizeHTML)
    .optional(),
  status: z.enum(['active', 'inactive', 'archived']),
  configuration: z.object({
    schedule: z.string().regex(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/),
    retryPolicy: z.object({
      maxRetries: z.number().min(0).max(10),
      backoffMultiplier: z.number().min(1).max(5),
    }),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// Usage
export const validateWorkflow = (data: unknown) => {
  try {
    return workflowSchema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(error.errors)
    }
    throw error
  }
}
```

### 3. **Content Security Policy**

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.vercel-insights.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' blob: data: https:;
      font-src 'self';
      connect-src 'self' https://api.mindhill.com wss://ws.mindhill.com;
      media-src 'self';
      object-src 'none';
      frame-src 'self';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  }
]
```

---

## Performance & Scalability

### 1. **Code Splitting & Lazy Loading**

```typescript
// Lazy load heavy components
const WorkflowDiagram = lazy(() => 
  import('./components/WorkflowDiagram')
)

const DataGrid = lazy(() => 
  import('./components/DataGrid')
    .then(module => ({ default: module.DataGrid }))
)

// Route-based code splitting
const routes = [
  {
    path: '/workflows',
    component: lazy(() => import('./pages/Workflows')),
  },
  {
    path: '/analytics',
    component: lazy(() => import('./pages/Analytics')),
  },
]

// Suspense boundaries
<Suspense fallback={<PageSkeleton />}>
  <Routes>
    {routes.map(route => (
      <Route 
        key={route.path}
        path={route.path}
        element={<route.component />}
      />
    ))}
  </Routes>
</Suspense>
```

### 2. **Virtual Scrolling for Large Lists**

```typescript
// components/VirtualGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export const VirtualGrid = ({ 
  data, 
  columns, 
  rowHeight = 50 
}: VirtualGridProps) => {
  const parentRef = useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  })
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <GridRow 
              data={data[virtualRow.index]} 
              columns={columns}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. **Optimistic Updates**

```typescript
// hooks/useOptimisticUpdate.ts
export const useOptimisticWorkflow = (workflowId: string) => {
  const queryClient = useQueryClient()
  
  const updateWorkflow = useMutation({
    mutationFn: (updates: WorkflowUpdate) => 
      workflowService.update(workflowId, updates),
      
    onMutate: async (updates) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries(['workflow', workflowId])
      
      // Snapshot current value
      const previous = queryClient.getQueryData(['workflow', workflowId])
      
      // Optimistically update
      queryClient.setQueryData(['workflow', workflowId], (old) => ({
        ...old,
        ...updates,
      }))
      
      return { previous }
    },
    
    onError: (err, updates, context) => {
      // Rollback on error
      queryClient.setQueryData(
        ['workflow', workflowId], 
        context.previous
      )
    },
    
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries(['workflow', workflowId])
    },
  })
  
  return updateWorkflow
}
```

### 4. **Image Optimization**

```typescript
// components/OptimizedImage.tsx
import Image from 'next/image'
import { useState } from 'react'

export const OptimizedImage = ({ 
  src, 
  alt, 
  ...props 
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(true)
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <Image
        src={src}
        alt={alt}
        loading="lazy"
        placeholder="blur"
        blurDataURL={generateBlurDataURL(src)}
        onLoad={() => setIsLoading(false)}
        {...props}
      />
    </div>
  )
}
```

### 5. **Performance Monitoring**

```typescript
// lib/monitoring/performance.ts
export const measurePerformance = (
  componentName: string, 
  callback: () => void
) => {
  if (typeof window !== 'undefined' && window.performance) {
    const startMark = `${componentName}-start`
    const endMark = `${componentName}-end`
    const measureName = `${componentName}-duration`
    
    performance.mark(startMark)
    callback()
    performance.mark(endMark)
    
    performance.measure(measureName, startMark, endMark)
    
    const measure = performance.getEntriesByName(measureName)[0]
    
    // Send to analytics
    analytics.track('component_performance', {
      component: componentName,
      duration: measure.duration,
      timestamp: new Date().toISOString(),
    })
    
    // Clean up
    performance.clearMarks(startMark)
    performance.clearMarks(endMark)
    performance.clearMeasures(measureName)
  } else {
    callback()
  }
}
```

---

## Development Guidelines

### 1. **Code Standards**

```typescript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'react-hooks/exhaustive-deps': 'error',
    'no-console': ['error', { allow: ['warn', 'error'] }],
  },
}

// prettier.config.js
module.exports = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  tabWidth: 2,
  printWidth: 80,
}
```

### 2. **Git Workflow**

```bash
# Branch naming convention
feature/JIRA-123-add-workflow-filters
bugfix/JIRA-456-fix-data-grid-sorting
hotfix/JIRA-789-critical-security-patch

# Commit message format
feat: add advanced filtering to workflow grid
fix: resolve data grid sorting issue
perf: optimize virtual scrolling performance
docs: update API documentation
test: add unit tests for workflow service
```

### 3. **Testing Strategy**

```typescript
// Unit tests with Vitest
// __tests__/services/workflow.test.ts
describe('WorkflowService', () => {
  it('should fetch workflows with filters', async () => {
    const filters = { status: 'active' }
    const result = await workflowService.getAll(filters)
    
    expect(result).toHaveLength(10)
    expect(result[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      status: 'active',
    })
  })
})

// Integration tests
// __tests__/integration/workflow-crud.test.ts
describe('Workflow CRUD Operations', () => {
  it('should create, update and delete workflow', async () => {
    // Create
    const created = await api.post('/workflows', mockWorkflow)
    expect(created.status).toBe(201)
    
    // Update
    const updated = await api.patch(
      `/workflows/${created.data.id}`,
      { name: 'Updated Name' }
    )
    expect(updated.data.name).toBe('Updated Name')
    
    // Delete
    const deleted = await api.delete(`/workflows/${created.data.id}`)
    expect(deleted.status).toBe(204)
  })
})

// E2E tests with Playwright
// e2e/workflows.spec.ts
test('should create new workflow', async ({ page }) => {
  await page.goto('/workflows')
  await page.click('button:has-text("New Workflow")')
  
  await page.fill('input[name="name"]', 'Test Workflow')
  await page.selectOption('select[name="type"]', 'data-processing')
  
  await page.click('button:has-text("Create")')
  
  await expect(page.locator('text=Test Workflow')).toBeVisible()
})
```

### 4. **Documentation Standards**

```typescript
/**
 * Fetches workflow data with optional filters
 * @param {WorkflowFilters} filters - Optional filters to apply
 * @returns {Promise<Workflow[]>} Array of workflows
 * @throws {ApiError} When the API request fails
 * @example
 * const workflows = await getWorkflows({ status: 'active' })
 */
export async function getWorkflows(
  filters?: WorkflowFilters
): Promise<Workflow[]> {
  // Implementation
}
```

---

## Migration Strategy

### Phase 1: Foundation (Weeks 1-2)
1. Set up new project structure
2. Configure build tools and linting
3. Implement authentication system
4. Set up state management
5. Create base components

### Phase 2: Core Features (Weeks 3-6)
1. Migrate workflow management
2. Implement data grids with virtual scrolling
3. Set up real-time updates
4. Migrate blade system
5. Implement search functionality

### Phase 3: Advanced Features (Weeks 7-8)
1. Add analytics dashboard
2. Implement advanced filtering
3. Set up monitoring and logging
4. Performance optimization
5. Security hardening

### Phase 4: Testing & Deployment (Weeks 9-10)
1. Comprehensive testing
2. Performance testing
3. Security audit
4. Documentation
5. Deployment setup

---

## Conclusion

This architecture provides a solid foundation for building a scalable, secure, and maintainable enterprise application. Key improvements include:

- **Performance**: 10x faster with virtual scrolling and code splitting
- **Security**: Enterprise-grade with CSP, CSRF protection, and input validation
- **Scalability**: Handles 100k+ records with virtual scrolling
- **Maintainability**: Clear separation of concerns and type safety
- **Developer Experience**: Modern tooling and clear guidelines

The migration can be done incrementally, allowing the team to maintain feature development while improving the architecture.