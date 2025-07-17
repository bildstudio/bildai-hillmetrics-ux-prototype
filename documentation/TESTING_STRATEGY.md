# Testing Strategy Guide
## Mind Hillmetric Comprehensive Testing Framework

### Overview
Complete testing strategy with actual test examples, automated testing pipelines, and quality assurance processes for production-ready applications.

---

## Testing Pyramid & Strategy

### Testing Levels
```typescript
// Testing distribution strategy
const TESTING_STRATEGY = {
  unit: {
    percentage: 70,
    focus: 'Individual functions, components, utilities',
    tools: ['Jest', 'React Testing Library', 'Vitest'],
    coverage: '>90%'
  },
  integration: {
    percentage: 20,
    focus: 'API endpoints, database operations, component interactions',
    tools: ['Jest', 'Supertest', 'Testing Library'],
    coverage: '>80%'
  },
  e2e: {
    percentage: 10,
    focus: 'Critical user journeys, full application workflows',
    tools: ['Playwright', 'Cypress'],
    coverage: '>95% of critical paths'
  }
}

// Test execution targets
const TESTING_TARGETS = {
  performance: {
    unitTests: '<50ms per test',
    integrationTests: '<500ms per test',
    e2eTests: '<30s per test suite'
  },
  coverage: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  quality: {
    flakyTestRate: '<2%',
    testMaintenanceTime: '<10% of development time',
    bugEscapeRate: '<5%'
  }
}
```

---

## Unit Testing

### 1. Component Testing with React Testing Library

#### Comprehensive Component Tests
```typescript
// __tests__/components/WorkflowExecutionGrid.test.tsx
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WorkflowExecutionGrid } from '@/components/workflow-execution-log/WorkflowExecutionGrid'
import { mockWorkflowExecutions } from '../__mocks__/workflow-data'

// Test utilities
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
})

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('WorkflowExecutionGrid', () => {
  const mockProps = {
    onViewExecution: jest.fn(),
    onViewWorkflow: jest.fn(),
    status: null,
    durationBucket: null,
    date: null,
    fluxId: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock API calls
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Rendering', () => {
    test('renders loading state initially', () => {
      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)
      
      expect(screen.getByText('Loading workflow execution history...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toHaveClass('animate-spin')
    })

    test('renders grid with data after loading', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflowExecutions,
      })

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Check table headers
      expect(screen.getByText('Workflow Name')).toBeInTheDocument()
      expect(screen.getByText('Status')).toBeInTheDocument()
      expect(screen.getByText('Started At')).toBeInTheDocument()
      expect(screen.getByText('Duration')).toBeInTheDocument()

      // Check data rows
      expect(screen.getByText('Financial Data Processing')).toBeInTheDocument()
      expect(screen.getByText('Document Analysis')).toBeInTheDocument()
    })

    test('renders empty state when no data', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      })

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('No workflow execution history found.')).toBeInTheDocument()
      })
    })

    test('renders error state on API failure', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByText('No workflow execution history found.')).toBeInTheDocument()
      })
    })
  })

  describe('Interactions', () => {
    beforeEach(async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflowExecutions,
      })

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })

    test('handles row click to view execution details', async () => {
      const user = userEvent.setup()
      const firstRow = screen.getByRole('row', { name: /Financial Data Processing/i })
      
      await user.click(firstRow)
      
      expect(mockProps.onViewExecution).toHaveBeenCalledWith(
        expect.objectContaining({
          id: mockWorkflowExecutions[0].id,
          workflow_name: 'Financial Data Processing'
        })
      )
    })

    test('opens dropdown menu on action button click', async () => {
      const user = userEvent.setup()
      const actionButton = screen.getAllByRole('button', { name: /more actions/i })[0]
      
      await user.click(actionButton)
      
      expect(screen.getByText('View Details')).toBeInTheDocument()
      expect(screen.getByText('View Workflow')).toBeInTheDocument()
      expect(screen.getByText('View Diagram')).toBeInTheDocument()
    })

    test('handles filter application', async () => {
      const user = userEvent.setup()
      
      // Click add filter button
      const addFilterButton = screen.getByRole('button', { name: /add filter/i })
      await user.click(addFilterButton)
      
      // Should open filter panel
      await waitFor(() => {
        expect(screen.getByText('Add Filter')).toBeInTheDocument()
      })
    })

    test('handles pagination', async () => {
      const user = userEvent.setup()
      
      // Mock API call for next page
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflowExecutions.slice(20, 40),
      })

      const nextPageButton = screen.getByRole('button', { name: /next page/i })
      await user.click(nextPageButton)
      
      // Should update page indicator
      await waitFor(() => {
        expect(screen.getByText(/21-40 of/)).toBeInTheDocument()
      })
    })
  })

  describe('Status Display', () => {
    test('renders status badges with correct styling', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [
          { ...mockWorkflowExecutions[0], status: 'Success' },
          { ...mockWorkflowExecutions[1], status: 'Failed' },
          { ...mockWorkflowExecutions[2], status: 'InProgress' },
        ],
      })

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        const successIcon = screen.getByTestId('status-success')
        const failedIcon = screen.getByTestId('status-failed')
        const inProgressIcon = screen.getByTestId('status-inprogress')

        expect(successIcon).toHaveClass('text-green-600')
        expect(failedIcon).toHaveClass('text-red-600')
        expect(inProgressIcon).toHaveClass('text-blue-600')
      })
    })
  })

  describe('Performance', () => {
    test('virtualizes large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        ...mockWorkflowExecutions[0],
        id: i + 1,
        workflow_name: `Workflow ${i + 1}`,
      }))

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => largeDataset,
      })

      const startTime = performance.now()
      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      
      // Should render efficiently even with large datasets
      expect(renderTime).toBeLessThan(1000) // Less than 1 second
      
      // Should only render visible rows (virtualization)
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeLessThan(100) // Not all 1000 rows rendered
    })
  })

  describe('Accessibility', () => {
    test('has proper ARIA labels and roles', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflowExecutions,
      })

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        const table = screen.getByRole('table')
        expect(table).toHaveAttribute('aria-label', 'Workflow execution history')
        
        const columnHeaders = screen.getAllByRole('columnheader')
        expect(columnHeaders.length).toBeGreaterThan(0)
        
        columnHeaders.forEach(header => {
          expect(header).toHaveAttribute('aria-sort')
        })
      })
    })

    test('supports keyboard navigation', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflowExecutions,
      })

      renderWithProviders(<WorkflowExecutionGrid {...mockProps} />)

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })

      // Test keyboard navigation
      const user = userEvent.setup()
      const firstActionButton = screen.getAllByRole('button')[0]
      
      firstActionButton.focus()
      expect(firstActionButton).toHaveFocus()
      
      await user.keyboard('{Tab}')
      // Next focusable element should receive focus
    })
  })
})
```

### 2. Utility Function Testing

#### Business Logic Tests
```typescript
// __tests__/lib/utils/workflow-utils.test.ts
import {
  calculateWorkflowDuration,
  getWorkflowStatus,
  formatExecutionData,
  validateWorkflowConfiguration,
  calculateSuccessRate,
} from '@/lib/utils/workflow-utils'

describe('Workflow Utilities', () => {
  describe('calculateWorkflowDuration', () => {
    test('calculates duration correctly for completed workflows', () => {
      const startTime = '2024-01-20T10:00:00Z'
      const endTime = '2024-01-20T11:30:00Z'
      
      const duration = calculateWorkflowDuration(startTime, endTime)
      
      expect(duration).toBe(90) // 90 minutes
    })

    test('returns null for workflows without end time', () => {
      const startTime = '2024-01-20T10:00:00Z'
      const endTime = null
      
      const duration = calculateWorkflowDuration(startTime, endTime)
      
      expect(duration).toBeNull()
    })

    test('handles invalid date formats gracefully', () => {
      const startTime = 'invalid-date'
      const endTime = '2024-01-20T11:30:00Z'
      
      const duration = calculateWorkflowDuration(startTime, endTime)
      
      expect(duration).toBeNull()
    })

    test('returns 0 for same start and end times', () => {
      const time = '2024-01-20T10:00:00Z'
      
      const duration = calculateWorkflowDuration(time, time)
      
      expect(duration).toBe(0)
    })
  })

  describe('getWorkflowStatus', () => {
    test('returns correct status for different execution states', () => {
      expect(getWorkflowStatus('Success', true)).toBe('Success')
      expect(getWorkflowStatus('Failed', true)).toBe('Failed')
      expect(getWorkflowStatus('InProgress', false)).toBe('InProgress')
      expect(getWorkflowStatus('Created', false)).toBe('Created')
    })

    test('handles edge cases', () => {
      expect(getWorkflowStatus('', false)).toBe('Unknown')
      expect(getWorkflowStatus(null, false)).toBe('Unknown')
      expect(getWorkflowStatus(undefined, false)).toBe('Unknown')
    })
  })

  describe('validateWorkflowConfiguration', () => {
    const validConfig = {
      name: 'Test Workflow',
      description: 'Test Description',
      schedule: '0 0 * * *',
      timeout: 3600,
      retries: 3,
    }

    test('validates correct configuration', () => {
      const result = validateWorkflowConfiguration(validConfig)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('catches missing required fields', () => {
      const invalidConfig = { ...validConfig, name: '' }
      
      const result = validateWorkflowConfiguration(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Name is required')
    })

    test('validates cron expression format', () => {
      const invalidConfig = { ...validConfig, schedule: 'invalid-cron' }
      
      const result = validateWorkflowConfiguration(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Invalid cron expression')
    })

    test('validates numeric ranges', () => {
      const invalidConfig = { ...validConfig, timeout: -1, retries: 15 }
      
      const result = validateWorkflowConfiguration(invalidConfig)
      
      expect(result.isValid).toBe(false)
      expect(result.errors).toContain('Timeout must be between 1 and 86400 seconds')
      expect(result.errors).toContain('Retries must be between 0 and 10')
    })
  })

  describe('calculateSuccessRate', () => {
    test('calculates success rate correctly', () => {
      const executions = [
        { status: 'Success' },
        { status: 'Success' },
        { status: 'Failed' },
        { status: 'Success' },
      ]
      
      const rate = calculateSuccessRate(executions)
      
      expect(rate).toBe(75) // 3 out of 4 successful
    })

    test('returns 0 for empty array', () => {
      const rate = calculateSuccessRate([])
      
      expect(rate).toBe(0)
    })

    test('returns 100 for all successful executions', () => {
      const executions = [
        { status: 'Success' },
        { status: 'Success' },
        { status: 'Success' },
      ]
      
      const rate = calculateSuccessRate(executions)
      
      expect(rate).toBe(100)
    })
  })
})
```

### 3. Custom Hooks Testing

#### React Hooks Testing
```typescript
// __tests__/hooks/useWorkflowData.test.tsx
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useWorkflowData } from '@/hooks/useWorkflowData'
import { mockWorkflowExecutions } from '../__mocks__/workflow-data'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useWorkflowData', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('fetches and returns workflow data', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockWorkflowExecutions,
    })

    const { result } = renderHook(() => useWorkflowData(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockWorkflowExecutions)
    expect(result.current.error).toBeNull()
  })

  test('handles API errors gracefully', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('API Error'))

    const { result } = renderHook(() => useWorkflowData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toBeUndefined()
    expect(result.current.error).toBeTruthy()
  })

  test('refetches data when dependencies change', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockWorkflowExecutions,
    })

    const { result, rerender } = renderHook(
      ({ filters }) => useWorkflowData(filters),
      {
        wrapper: createWrapper(),
        initialProps: { filters: { status: 'Success' } },
      }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(global.fetch).toHaveBeenCalledTimes(1)

    // Change filters
    rerender({ filters: { status: 'Failed' } })

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })
  })
})
```

---

## Integration Testing

### 1. API Endpoint Testing

#### Comprehensive API Tests
```typescript
// __tests__/api/workflows.test.ts
import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { GET, POST, PUT, DELETE } from '@/app/api/workflows/route'
import { prismaMock } from '../__mocks__/prisma'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: prismaMock,
}))

describe('/api/workflows', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/workflows', () => {
    test('returns paginated workflow list', async () => {
      const mockWorkflows = [
        {
          id: 1,
          name: 'Test Workflow',
          status: 'active',
          created_at: new Date('2024-01-01'),
          updated_at: new Date('2024-01-02'),
          _count: { executions: 5 },
        },
      ]

      prismaMock.workflow.findMany.mockResolvedValue(mockWorkflows)
      prismaMock.workflow.count.mockResolvedValue(1)

      const request = new NextRequest('http://localhost:3000/api/workflows?page=1&limit=20')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data).toEqual(mockWorkflows)
      expect(data.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      })
    })

    test('handles filtering by status', async () => {
      prismaMock.workflow.findMany.mockResolvedValue([])
      prismaMock.workflow.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/workflows?status=active')
      await GET(request)

      expect(prismaMock.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        })
      )
    })

    test('handles search queries', async () => {
      prismaMock.workflow.findMany.mockResolvedValue([])
      prismaMock.workflow.count.mockResolvedValue(0)

      const request = new NextRequest('http://localhost:3000/api/workflows?search=finance')
      await GET(request)

      expect(prismaMock.workflow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: {
              contains: 'finance',
              mode: 'insensitive',
            },
          },
        })
      )
    })

    test('returns 500 on database error', async () => {
      prismaMock.workflow.findMany.mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/workflows')
      const response = await GET(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/workflows', () => {
    const validWorkflowData = {
      name: 'New Workflow',
      description: 'Test workflow',
      configuration: {
        schedule: '0 0 * * *',
        timeout: 3600,
        retries: 3,
      },
    }

    test('creates new workflow successfully', async () => {
      const createdWorkflow = {
        id: 1,
        ...validWorkflowData,
        status: 'inactive',
        created_at: new Date(),
      }

      prismaMock.workflow.create.mockResolvedValue(createdWorkflow)

      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify(validWorkflowData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data).toEqual(createdWorkflow)
      expect(prismaMock.workflow.create).toHaveBeenCalledWith({
        data: expect.objectContaining(validWorkflowData),
      })
    })

    test('validates required fields', async () => {
      const invalidData = { ...validWorkflowData, name: '' }

      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Validation failed')
      expect(data.details.name).toBe('Name is required')
    })

    test('validates cron expression', async () => {
      const invalidData = {
        ...validWorkflowData,
        configuration: {
          ...validWorkflowData.configuration,
          schedule: 'invalid-cron',
        },
      }

      const request = new NextRequest('http://localhost:3000/api/workflows', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid cron expression')
    })
  })

  describe('Authentication', () => {
    test('returns 401 without valid token', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows')
      // No Authorization header

      const response = await GET(request)

      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    test('returns 403 for insufficient permissions', async () => {
      const request = new NextRequest('http://localhost:3000/api/workflows', {
        headers: {
          Authorization: 'Bearer viewer-token', // Mock token for viewer role
        },
      })

      // Mock JWT verification to return viewer role
      jest.mock('../lib/auth/jwt', () => ({
        verifyAccessToken: () => ({ userId: '1', role: 'viewer' }),
      }))

      const response = await POST(request)

      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Insufficient permissions')
    })
  })
})
```

### 2. Database Integration Tests

#### Prisma Integration Testing
```typescript
// __tests__/integration/database.test.ts
import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { join } from 'path'

const prismaBinary = join(__dirname, '../../node_modules/.bin/prisma')

let prisma: PrismaClient

beforeAll(async () => {
  // Create test database
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST
  
  // Reset database schema
  execSync(`${prismaBinary} db push --force-reset`, {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  })

  prisma = new PrismaClient()
})

afterAll(async () => {
  await prisma.$disconnect()
})

beforeEach(async () => {
  // Clean database before each test
  await prisma.$transaction([
    prisma.workflowExecution.deleteMany(),
    prisma.workflow.deleteMany(),
    prisma.user.deleteMany(),
  ])
})

describe('Database Integration', () => {
  describe('Workflow Operations', () => {
    test('creates workflow with proper relationships', async () => {
      // Create user first
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          displayName: 'Test User',
          password: 'hashed-password',
          role: 'user',
        },
      })

      // Create workflow
      const workflow = await prisma.workflow.create({
        data: {
          name: 'Test Workflow',
          description: 'Integration test workflow',
          status: 'active',
          configuration: {
            schedule: '0 0 * * *',
            timeout: 3600,
          },
          created_by: user.id,
        },
        include: {
          creator: true,
        },
      })

      expect(workflow.id).toBeDefined()
      expect(workflow.creator.email).toBe('test@example.com')
      expect(workflow.configuration).toEqual({
        schedule: '0 0 * * *',
        timeout: 3600,
      })
    })

    test('creates workflow execution with stages', async () => {
      // Setup workflow
      const workflow = await prisma.workflow.create({
        data: {
          name: 'Test Workflow',
          status: 'active',
          configuration: {},
        },
      })

      // Create execution
      const execution = await prisma.workflowExecution.create({
        data: {
          workflow_id: workflow.id,
          status: 'InProgress',
          started_at: new Date(),
          stages: {
            create: [
              {
                stage_name: 'Fetching',
                stage_order: 1,
                status: 'Success',
                started_at: new Date(),
                completed_at: new Date(),
                items_processed: 100,
              },
              {
                stage_name: 'Processing',
                stage_order: 2,
                status: 'InProgress',
                started_at: new Date(),
                items_processed: 50,
              },
            ],
          },
        },
        include: {
          stages: {
            orderBy: { stage_order: 'asc' },
          },
        },
      })

      expect(execution.stages).toHaveLength(2)
      expect(execution.stages[0].stage_name).toBe('Fetching')
      expect(execution.stages[0].status).toBe('Success')
      expect(execution.stages[1].stage_name).toBe('Processing')
      expect(execution.stages[1].status).toBe('InProgress')
    })

    test('handles complex queries with aggregations', async () => {
      // Setup test data
      const workflow = await prisma.workflow.create({
        data: { name: 'Test Workflow', status: 'active', configuration: {} },
      })

      // Create multiple executions
      await prisma.workflowExecution.createMany({
        data: [
          {
            workflow_id: workflow.id,
            status: 'Success',
            started_at: new Date('2024-01-01'),
            completed_at: new Date('2024-01-01T01:00:00'),
            duration_minutes: 60,
          },
          {
            workflow_id: workflow.id,
            status: 'Failed',
            started_at: new Date('2024-01-02'),
            completed_at: new Date('2024-01-02T00:30:00'),
            duration_minutes: 30,
          },
          {
            workflow_id: workflow.id,
            status: 'Success',
            started_at: new Date('2024-01-03'),
            completed_at: new Date('2024-01-03T02:00:00'),
            duration_minutes: 120,
          },
        ],
      })

      // Test aggregation queries
      const stats = await prisma.workflowExecution.aggregate({
        where: { workflow_id: workflow.id },
        _count: { id: true },
        _avg: { duration_minutes: true },
        _max: { duration_minutes: true },
        _min: { duration_minutes: true },
      })

      expect(stats._count.id).toBe(3)
      expect(stats._avg.duration_minutes).toBe(70) // (60 + 30 + 120) / 3
      expect(stats._max.duration_minutes).toBe(120)
      expect(stats._min.duration_minutes).toBe(30)

      // Test groupBy query
      const statusCounts = await prisma.workflowExecution.groupBy({
        by: ['status'],
        where: { workflow_id: workflow.id },
        _count: { status: true },
      })

      const successCount = statusCounts.find(s => s.status === 'Success')?._count.status
      const failedCount = statusCounts.find(s => s.status === 'Failed')?._count.status

      expect(successCount).toBe(2)
      expect(failedCount).toBe(1)
    })
  })

  describe('Transaction Handling', () => {
    test('rolls back transaction on error', async () => {
      const workflow = await prisma.workflow.create({
        data: { name: 'Test Workflow', status: 'active', configuration: {} },
      })

      // This transaction should fail and rollback
      await expect(
        prisma.$transaction(async tx => {
          // Create execution
          await tx.workflowExecution.create({
            data: {
              workflow_id: workflow.id,
              status: 'InProgress',
              started_at: new Date(),
            },
          })

          // This should fail due to invalid foreign key
          await tx.workflowExecution.create({
            data: {
              workflow_id: 99999, // Non-existent workflow
              status: 'InProgress',
              started_at: new Date(),
            },
          })
        })
      ).rejects.toThrow()

      // Verify no executions were created
      const executionCount = await prisma.workflowExecution.count({
        where: { workflow_id: workflow.id },
      })

      expect(executionCount).toBe(0)
    })

    test('commits successful transaction', async () => {
      const workflow = await prisma.workflow.create({
        data: { name: 'Test Workflow', status: 'active', configuration: {} },
      })

      // This transaction should succeed
      await prisma.$transaction(async tx => {
        await tx.workflowExecution.create({
          data: {
            workflow_id: workflow.id,
            status: 'InProgress',
            started_at: new Date(),
          },
        })

        await tx.workflowExecution.create({
          data: {
            workflow_id: workflow.id,
            status: 'Success',
            started_at: new Date(),
            completed_at: new Date(),
          },
        })
      })

      // Verify both executions were created
      const executionCount = await prisma.workflowExecution.count({
        where: { workflow_id: workflow.id },
      })

      expect(executionCount).toBe(2)
    })
  })

  describe('Performance Tests', () => {
    test('handles large dataset efficiently', async () => {
      const workflow = await prisma.workflow.create({
        data: { name: 'Performance Test Workflow', status: 'active', configuration: {} },
      })

      // Create large dataset
      const executions = Array.from({ length: 1000 }, (_, i) => ({
        workflow_id: workflow.id,
        status: i % 4 === 0 ? 'Failed' : 'Success',
        started_at: new Date(2024, 0, 1 + (i % 30)),
        completed_at: new Date(2024, 0, 1 + (i % 30), 1),
        duration_minutes: 60 + (i % 120),
      }))

      const startTime = Date.now()
      await prisma.workflowExecution.createMany({ data: executions })
      const insertTime = Date.now() - startTime

      expect(insertTime).toBeLessThan(5000) // Less than 5 seconds

      // Test query performance
      const queryStartTime = Date.now()
      const results = await prisma.workflowExecution.findMany({
        where: {
          workflow_id: workflow.id,
          status: 'Success',
          started_at: {
            gte: new Date(2024, 0, 1),
            lt: new Date(2024, 0, 15),
          },
        },
        orderBy: { started_at: 'desc' },
        take: 50,
      })
      const queryTime = Date.now() - queryStartTime

      expect(queryTime).toBeLessThan(1000) // Less than 1 second
      expect(results.length).toBeLessThanOrEqual(50)
    })
  })
})
```

---

## End-to-End Testing

### 1. Playwright E2E Tests

#### Critical User Journey Tests
```typescript
// __tests__/e2e/workflow-management.spec.ts
import { test, expect, Page } from '@playwright/test'

test.describe('Workflow Management', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Login before each test
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'admin@mindhill.com')
    await page.fill('[data-testid="password"]', 'testpassword')
    await page.click('[data-testid="login-button"]')
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard')
  })

  test('complete workflow creation and execution flow', async () => {
    // Navigate to workflows page
    await page.click('[data-testid="nav-workflows"]')
    await expect(page).toHaveURL('/workflows')

    // Create new workflow
    await page.click('[data-testid="create-workflow-button"]')
    
    // Fill workflow form
    await page.fill('[data-testid="workflow-name"]', 'E2E Test Workflow')
    await page.fill('[data-testid="workflow-description"]', 'Created by E2E test')
    await page.selectOption('[data-testid="workflow-template"]', 'data-processing')
    
    // Configure schedule
    await page.fill('[data-testid="cron-schedule"]', '0 */6 * * *') // Every 6 hours
    await page.fill('[data-testid="timeout-minutes"]', '120')
    await page.fill('[data-testid="max-retries"]', '2')

    // Save workflow
    await page.click('[data-testid="save-workflow"]')
    
    // Verify workflow was created
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('text=E2E Test Workflow')).toBeVisible()

    // Start workflow execution
    await page.click('[data-testid="workflow-row"]:has-text("E2E Test Workflow")')
    await page.click('[data-testid="start-execution"]')
    
    // Confirm execution start
    await page.click('[data-testid="confirm-start"]')
    
    // Wait for execution to start
    await expect(page.locator('[data-testid="execution-status"]:has-text("InProgress")')).toBeVisible({
      timeout: 10000
    })

    // Navigate to execution details
    await page.click('[data-testid="view-execution-details"]')
    
    // Verify execution details page
    await expect(page.locator('[data-testid="execution-id"]')).toBeVisible()
    await expect(page.locator('[data-testid="workflow-diagram"]')).toBeVisible()
    
    // Check stage progression
    const stages = ['Fetching', 'Processing', 'Normalization', 'Refinement', 'Calculation']
    for (const stage of stages) {
      await expect(page.locator(`[data-testid="stage-${stage.toLowerCase()}"]`)).toBeVisible()
    }
  })

  test('workflow execution monitoring and real-time updates', async () => {
    // Navigate to execution history
    await page.goto('/execution-history')
    
    // Filter by in-progress executions
    await page.click('[data-testid="filter-button"]')
    await page.selectOption('[data-testid="status-filter"]', 'InProgress')
    await page.click('[data-testid="apply-filter"]')
    
    // Select first in-progress execution
    const firstExecution = page.locator('[data-testid="execution-row"]').first()
    await firstExecution.click()
    
    // Open execution details in blade
    await expect(page.locator('[data-testid="execution-blade"]')).toBeVisible()
    
    // Verify real-time updates (mock WebSocket updates)
    await page.evaluate(() => {
      // Simulate WebSocket message for stage completion
      window.dispatchEvent(new CustomEvent('websocket-message', {
        detail: {
          type: 'stage-completed',
          executionId: '12345',
          stage: 'fetching',
          status: 'Success'
        }
      }))
    })
    
    // Verify stage status updated
    await expect(page.locator('[data-testid="stage-fetching-status"]:has-text("Success")')).toBeVisible()
    
    // Test performance metrics display
    await page.click('[data-testid="performance-tab"]')
    await expect(page.locator('[data-testid="duration-chart"]')).toBeVisible()
    await expect(page.locator('[data-testid="throughput-metrics"]')).toBeVisible()
  })

  test('data export functionality', async () => {
    await page.goto('/execution-history')
    
    // Select multiple executions
    await page.check('[data-testid="execution-checkbox"]:nth(0)')
    await page.check('[data-testid="execution-checkbox"]:nth(1)')
    await page.check('[data-testid="execution-checkbox"]:nth(2)')
    
    // Open export modal
    await page.click('[data-testid="export-button"]')
    await expect(page.locator('[data-testid="export-modal"]')).toBeVisible()
    
    // Configure export options
    await page.selectOption('[data-testid="export-format"]', 'csv')
    await page.check('[data-testid="include-stages"]')
    await page.check('[data-testid="include-performance-metrics"]')
    
    // Start export
    await page.click('[data-testid="start-export"]')
    
    // Wait for export completion
    await expect(page.locator('[data-testid="export-progress"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-completed"]')).toBeVisible({ timeout: 30000 })
    
    // Download exported file
    const downloadPromise = page.waitForEvent('download')
    await page.click('[data-testid="download-export"]')
    const download = await downloadPromise
    
    expect(download.suggestedFilename()).toMatch(/execution-history-\d{8}-\d{6}\.csv/)
  })

  test('error handling and recovery', async () => {
    await page.goto('/workflows')
    
    // Simulate network error during workflow creation
    await page.route('**/api/workflows', route => {
      route.abort('failed')
    })
    
    await page.click('[data-testid="create-workflow-button"]')
    await page.fill('[data-testid="workflow-name"]', 'Error Test Workflow')
    await page.click('[data-testid="save-workflow"]')
    
    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]:has-text("Failed to create workflow")')).toBeVisible()
    
    // Clear network error simulation
    await page.unroute('**/api/workflows')
    
    // Retry operation
    await page.click('[data-testid="retry-button"]')
    
    // Verify success after retry
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible({ timeout: 10000 })
  })

  test('accessibility compliance', async () => {
    await page.goto('/dashboard')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Verify focus management
    const focusedElement = await page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test screen reader support
    const mainContent = page.locator('main')
    await expect(mainContent).toHaveAttribute('aria-label')
    
    // Test color contrast (automated check)
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const isVisible = await button.isVisible()
      
      if (isVisible) {
        // Check button has accessible name
        const accessibleName = await button.getAttribute('aria-label') || await button.textContent()
        expect(accessibleName?.trim()).toBeTruthy()
      }
    }
  })

  test('performance under load', async () => {
    // Navigate to large dataset page
    await page.goto('/execution-history?limit=1000')
    
    const startTime = Date.now()
    
    // Wait for grid to load
    await expect(page.locator('[data-testid="execution-grid"]')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(5000) // Should load within 5 seconds
    
    // Test scrolling performance
    const scrollStartTime = Date.now()
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('PageDown')
      await page.waitForTimeout(100) // Small delay for scrolling
    }
    
    const scrollTime = Date.now() - scrollStartTime
    expect(scrollTime).toBeLessThan(2000) // Scrolling should be smooth
    
    // Test filtering performance
    const filterStartTime = Date.now()
    
    await page.click('[data-testid="filter-button"]')
    await page.selectOption('[data-testid="status-filter"]', 'Success')
    await page.click('[data-testid="apply-filter"]')
    
    await expect(page.locator('[data-testid="filter-results"]')).toBeVisible()
    
    const filterTime = Date.now() - filterStartTime
    expect(filterTime).toBeLessThan(3000) // Filtering should complete within 3 seconds
  })
})
```

### 2. Mobile Responsiveness Testing

#### Mobile E2E Tests
```typescript
// __tests__/e2e/mobile-responsive.spec.ts
import { test, expect, devices } from '@playwright/test'

const mobileDevices = [
  devices['iPhone 13'],
  devices['iPad'],
  devices['Pixel 5'],
  devices['Galaxy S8'],
]

mobileDevices.forEach(device => {
  test.describe(`Mobile Tests - ${device.name}`, () => {
    test.use({ ...device })

    test('mobile navigation and workflow management', async ({ page }) => {
      await page.goto('/login')
      
      // Mobile login
      await page.fill('[data-testid="email"]', 'admin@mindhill.com')
      await page.fill('[data-testid="password"]', 'testpassword')
      await page.tap('[data-testid="login-button"]')
      
      // Wait for dashboard
      await page.waitForURL('/dashboard')
      
      // Test mobile menu
      await page.tap('[data-testid="mobile-menu-button"]')
      await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible()
      
      // Navigate using mobile menu
      await page.tap('[data-testid="nav-workflows-mobile"]')
      await expect(page).toHaveURL('/workflows')
      
      // Test horizontal scrolling for table
      const table = page.locator('[data-testid="workflows-table"]')
      await expect(table).toBeVisible()
      
      // Verify table is horizontally scrollable
      const scrollWidth = await table.evaluate(el => el.scrollWidth)
      const clientWidth = await table.evaluate(el => el.clientWidth)
      
      if (device.viewport.width < 768) {
        expect(scrollWidth).toBeGreaterThan(clientWidth)
      }
      
      // Test mobile-optimized workflow card view
      if (device.viewport.width < 640) {
        await expect(page.locator('[data-testid="workflow-cards"]')).toBeVisible()
        await expect(page.locator('[data-testid="workflows-table"]')).not.toBeVisible()
      }
    })

    test('mobile touch interactions', async ({ page }) => {
      await page.goto('/execution-history')
      
      // Test swipe gestures on cards
      const firstCard = page.locator('[data-testid="execution-card"]').first()
      await expect(firstCard).toBeVisible()
      
      // Swipe left to reveal actions
      const cardBox = await firstCard.boundingBox()
      if (cardBox) {
        await page.touchscreen.tap(cardBox.x + cardBox.width - 50, cardBox.y + cardBox.height / 2)
        
        // Swipe left
        await page.touchscreen.tap(cardBox.x + cardBox.width - 100, cardBox.y + cardBox.height / 2)
        
        // Verify action buttons are revealed
        await expect(page.locator('[data-testid="card-actions"]')).toBeVisible()
      }
      
      // Test pull-to-refresh
      await page.touchscreen.tap(100, 100)
      await page.touchscreen.tap(100, 200) // Swipe down
      
      // Should trigger refresh indicator
      await expect(page.locator('[data-testid="refresh-indicator"]')).toBeVisible({ timeout: 1000 })
    })

    test('mobile form interactions', async ({ page }) => {
      await page.goto('/workflows/new')
      
      // Test mobile-optimized form
      await page.fill('[data-testid="workflow-name"]', 'Mobile Test Workflow')
      
      // Test mobile select dropdown
      await page.tap('[data-testid="workflow-template"]')
      await expect(page.locator('[data-testid="template-options"]')).toBeVisible()
      await page.tap('[data-testid="template-data-processing"]')
      
      // Test mobile date/time picker
      await page.tap('[data-testid="schedule-input"]')
      
      if (device.name?.includes('iPhone') || device.name?.includes('iPad')) {
        // iOS native picker
        await expect(page.locator('input[type="datetime-local"]')).toBeVisible()
      } else {
        // Custom mobile picker
        await expect(page.locator('[data-testid="mobile-time-picker"]')).toBeVisible()
      }
      
      // Test mobile keyboard optimization
      const numberInput = page.locator('[data-testid="timeout-minutes"]')
      await numberInput.tap()
      
      const inputType = await numberInput.getAttribute('inputmode')
      expect(inputType).toBe('numeric')
    })
  })
})
```

---

## Performance Testing

### 1. Load Testing with k6

#### API Load Tests
```javascript
// __tests__/performance/api-load-test.js
import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const responseTime = new Trend('response_time')

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 200 },   // Ramp up to 200 users
    { duration: '5m', target: 200 },   // Stay at 200 users
    { duration: '2m', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests must complete below 1s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],             // Custom error rate
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const API_TOKEN = __ENV.API_TOKEN || 'test-token'

export function setup() {
  // Login and get authentication token
  const loginResponse = http.post(`${BASE_URL}/api/auth/login`, JSON.stringify({
    email: 'loadtest@example.com',
    password: 'loadtest123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  })

  check(loginResponse, {
    'login successful': (r) => r.status === 200,
  })

  const token = loginResponse.json('accessToken')
  return { token }
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  }

  // Test different API endpoints with realistic usage patterns
  const scenarios = [
    () => testWorkflowsList(headers),
    () => testWorkflowDetails(headers),
    () => testExecutionHistory(headers),
    () => testCreateWorkflow(headers),
    () => testDataExport(headers),
  ]

  // Execute random scenario
  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)]
  scenario()

  sleep(1) // User think time
}

function testWorkflowsList(headers) {
  const params = new URLSearchParams({
    page: Math.floor(Math.random() * 10) + 1,
    limit: 20,
    status: ['active', 'inactive'][Math.floor(Math.random() * 2)],
  })

  const response = http.get(`${BASE_URL}/api/workflows?${params}`, { headers })
  
  const success = check(response, {
    'workflows list status 200': (r) => r.status === 200,
    'workflows list has data': (r) => r.json('data').length >= 0,
    'workflows list response time < 500ms': (r) => r.timings.duration < 500,
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testWorkflowDetails(headers) {
  const workflowId = Math.floor(Math.random() * 100) + 1
  const response = http.get(`${BASE_URL}/api/workflows/${workflowId}`, { headers })
  
  const success = check(response, {
    'workflow details response': (r) => r.status === 200 || r.status === 404,
    'workflow details response time < 300ms': (r) => r.timings.duration < 300,
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testExecutionHistory(headers) {
  const params = new URLSearchParams({
    page: 1,
    limit: 50,
    status: 'Success',
  })

  const response = http.get(`${BASE_URL}/api/execution-history?${params}`, { headers })
  
  const success = check(response, {
    'execution history status 200': (r) => r.status === 200,
    'execution history response time < 800ms': (r) => r.timings.duration < 800,
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testCreateWorkflow(headers) {
  const workflowData = {
    name: `Load Test Workflow ${Date.now()}`,
    description: 'Created by load test',
    configuration: {
      schedule: '0 0 * * *',
      timeout: 3600,
      retries: 3,
    },
  }

  const response = http.post(`${BASE_URL}/api/workflows`, JSON.stringify(workflowData), { headers })
  
  const success = check(response, {
    'create workflow status 201': (r) => r.status === 201,
    'create workflow response time < 1000ms': (r) => r.timings.duration < 1000,
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

function testDataExport(headers) {
  const exportData = {
    format: 'csv',
    filters: { status: 'Success' },
    dateRange: { from: '2024-01-01', to: '2024-01-31' },
  }

  const response = http.post(`${BASE_URL}/api/export/execution-history`, JSON.stringify(exportData), { headers })
  
  const success = check(response, {
    'export status 200': (r) => r.status === 200,
    'export response time < 5000ms': (r) => r.timings.duration < 5000,
  })

  errorRate.add(!success)
  responseTime.add(response.timings.duration)
}

export function teardown(data) {
  // Cleanup: Logout
  http.post(`${BASE_URL}/api/auth/logout`, {}, {
    headers: { 'Authorization': `Bearer ${data.token}` },
  })
}
```

### 2. Frontend Performance Testing

#### Lighthouse CI Configuration
```javascript
// .lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/workflows',
        'http://localhost:3000/execution-history',
        'http://localhost:3000/workflows/new',
      ],
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        
        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 3000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 500 }],
        
        // Bundle size
        'total-byte-weight': ['error', { maxNumericValue: 2500000 }], // 2.5MB
        'unused-javascript': ['error', { maxNumericValue: 500000 }],  // 500KB
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-reports',
    },
  },
}
```

---

## Test Automation & CI/CD

### 1. GitHub Actions Test Pipeline

#### Comprehensive Test Workflow
```yaml
# .github/workflows/test.yml
name: Comprehensive Testing Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '18'
  DATABASE_URL_TEST: postgresql://postgres:testpass@localhost:5432/mindhill_test
  REDIS_URL_TEST: redis://localhost:6379

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: mindhill_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        npx prisma generate
        npx prisma db push --force-reset
      env:
        DATABASE_URL: ${{ env.DATABASE_URL_TEST }}
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage
      env:
        DATABASE_URL: ${{ env.DATABASE_URL_TEST }}
        REDIS_URL: ${{ env.REDIS_URL_TEST }}
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info
        flags: unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: mindhill_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Setup test database
      run: |
        npx prisma generate
        npx prisma db push --force-reset
        npx prisma db seed
      env:
        DATABASE_URL: ${{ env.DATABASE_URL_TEST }}
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        DATABASE_URL: ${{ env.DATABASE_URL_TEST }}
        REDIS_URL: ${{ env.REDIS_URL_TEST }}

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: testpass
          POSTGRES_DB: mindhill_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:6.2
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright browsers
      run: npx playwright install --with-deps
    
    - name: Setup test database
      run: |
        npx prisma generate
        npx prisma db push --force-reset
        npx prisma db seed
      env:
        DATABASE_URL: ${{ env.DATABASE_URL_TEST }}
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: npm start &
      env:
        DATABASE_URL: ${{ env.DATABASE_URL_TEST }}
        REDIS_URL: ${{ env.REDIS_URL_TEST }}
    
    - name: Wait for application
      run: npx wait-on http://localhost:3000 --timeout 60000
    
    - name: Run E2E tests
      run: npx playwright test
    
    - name: Upload E2E artifacts
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    needs: e2e-tests
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install k6
      run: |
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6
    
    - name: Build and start application
      run: |
        npm run build
        npm start &
        npx wait-on http://localhost:3000 --timeout 60000
    
    - name: Run load tests
      run: k6 run __tests__/performance/api-load-test.js --env BASE_URL=http://localhost:3000
    
    - name: Run Lighthouse CI
      run: |
        npm install -g @lhci/cli
        lhci autorun
    
    - name: Upload performance reports
      uses: actions/upload-artifact@v3
      with:
        name: performance-reports
        path: |
          lighthouse-reports/
          k6-results.json

  security-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Run security audit
      run: npm audit --audit-level high
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v2
      with:
        languages: typescript, javascript
    
    - name: Run Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high

  test-report:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, performance-tests, security-tests]
    if: always()
    
    steps:
    - name: Generate test report
      run: |
        echo "## Test Results Summary" >> $GITHUB_STEP_SUMMARY
        echo "- Unit Tests: ${{ needs.unit-tests.result }}" >> $GITHUB_STEP_SUMMARY
        echo "- Integration Tests: ${{ needs.integration-tests.result }}" >> $GITHUB_STEP_SUMMARY
        echo "- E2E Tests: ${{ needs.e2e-tests.result }}" >> $GITHUB_STEP_SUMMARY
        echo "- Performance Tests: ${{ needs.performance-tests.result }}" >> $GITHUB_STEP_SUMMARY
        echo "- Security Tests: ${{ needs.security-tests.result }}" >> $GITHUB_STEP_SUMMARY
```

### 2. Test Quality Metrics

#### Test Coverage and Quality Tracking
```typescript
// scripts/test-quality-report.ts
import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

interface TestMetrics {
  coverage: {
    statements: number
    branches: number
    functions: number
    lines: number
  }
  performance: {
    unitTestTime: number
    integrationTestTime: number
    e2eTestTime: number
  }
  quality: {
    totalTests: number
    passedTests: number
    failedTests: number
    flakyTests: number
  }
  trends: {
    coverageChange: number
    performanceChange: number
    testCountChange: number
  }
}

async function generateTestReport(): Promise<TestMetrics> {
  console.log('Generating comprehensive test quality report...')

  // Run tests and collect metrics
  const unitTestStart = Date.now()
  const unitTestResult = execSync('npm run test:unit -- --silent --json', { encoding: 'utf8' })
  const unitTestTime = Date.now() - unitTestStart

  const integrationTestStart = Date.now()
  const integrationTestResult = execSync('npm run test:integration -- --silent --json', { encoding: 'utf8' })
  const integrationTestTime = Date.now() - integrationTestStart

  const e2eTestStart = Date.now()
  const e2eTestResult = execSync('npx playwright test --reporter=json', { encoding: 'utf8' })
  const e2eTestTime = Date.now() - e2eTestStart

  // Parse test results
  const unitResults = JSON.parse(unitTestResult)
  const integrationResults = JSON.parse(integrationTestResult)
  const e2eResults = JSON.parse(e2eTestResult)

  // Extract coverage data
  const coverage = {
    statements: unitResults.coverageMap?.getCoverageSummary().statements.pct || 0,
    branches: unitResults.coverageMap?.getCoverageSummary().branches.pct || 0,
    functions: unitResults.coverageMap?.getCoverageSummary().functions.pct || 0,
    lines: unitResults.coverageMap?.getCoverageSummary().lines.pct || 0,
  }

  // Calculate test counts
  const totalTests = unitResults.numTotalTests + integrationResults.numTotalTests + e2eResults.tests.length
  const passedTests = unitResults.numPassedTests + integrationResults.numPassedTests + 
                     e2eResults.tests.filter((t: any) => t.status === 'passed').length
  const failedTests = unitResults.numFailedTests + integrationResults.numFailedTests + 
                     e2eResults.tests.filter((t: any) => t.status === 'failed').length

  // Detect flaky tests (tests that passed on retry)
  const flakyTests = e2eResults.tests.filter((t: any) => t.status === 'passed' && t.retry > 0).length

  const metrics: TestMetrics = {
    coverage,
    performance: {
      unitTestTime,
      integrationTestTime,
      e2eTestTime,
    },
    quality: {
      totalTests,
      passedTests,
      failedTests,
      flakyTests,
    },
    trends: {
      coverageChange: calculateCoverageTrend(coverage),
      performanceChange: calculatePerformanceTrend(unitTestTime + integrationTestTime + e2eTestTime),
      testCountChange: calculateTestCountTrend(totalTests),
    },
  }

  // Generate detailed report
  const report = `
# Test Quality Report
Generated: ${new Date().toISOString()}

## Coverage Metrics
- Statements: ${coverage.statements.toFixed(1)}%
- Branches: ${coverage.branches.toFixed(1)}%
- Functions: ${coverage.functions.toFixed(1)}%
- Lines: ${coverage.lines.toFixed(1)}%

## Performance Metrics
- Unit Tests: ${unitTestTime}ms
- Integration Tests: ${integrationTestTime}ms
- E2E Tests: ${e2eTestTime}ms
- Total Test Time: ${unitTestTime + integrationTestTime + e2eTestTime}ms

## Quality Metrics
- Total Tests: ${totalTests}
- Passed: ${passedTests} (${((passedTests / totalTests) * 100).toFixed(1)}%)
- Failed: ${failedTests} (${((failedTests / totalTests) * 100).toFixed(1)}%)
- Flaky Tests: ${flakyTests}

## Quality Gates
${coverage.statements >= 90 ? '✅' : '❌'} Statement Coverage >= 90%
${coverage.branches >= 85 ? '✅' : '❌'} Branch Coverage >= 85%
${unitTestTime < 30000 ? '✅' : '❌'} Unit Tests < 30s
${integrationTestTime < 120000 ? '✅' : '❌'} Integration Tests < 2min
${e2eTestTime < 300000 ? '✅' : '❌'} E2E Tests < 5min
${flakyTests === 0 ? '✅' : '❌'} No Flaky Tests
${failedTests === 0 ? '✅' : '❌'} All Tests Passing

## Recommendations
${generateRecommendations(metrics)}
`

  writeFileSync('./reports/test-quality-report.md', report)
  console.log('Test quality report generated: ./reports/test-quality-report.md')

  return metrics
}

function calculateCoverageTrend(coverage: any): number {
  // Compare with previous coverage data
  // This would typically read from a historical data file
  return 0 // Placeholder
}

function calculatePerformanceTrend(totalTime: number): number {
  // Compare with previous performance data
  return 0 // Placeholder
}

function calculateTestCountTrend(testCount: number): number {
  // Compare with previous test count
  return 0 // Placeholder
}

function generateRecommendations(metrics: TestMetrics): string {
  const recommendations: string[] = []

  if (metrics.coverage.statements < 90) {
    recommendations.push('- Increase statement coverage by adding tests for uncovered code paths')
  }

  if (metrics.coverage.branches < 85) {
    recommendations.push('- Add tests for missing branch conditions')
  }

  if (metrics.performance.unitTestTime > 30000) {
    recommendations.push('- Optimize slow unit tests - consider mocking heavy dependencies')
  }

  if (metrics.quality.flakyTests > 0) {
    recommendations.push('- Investigate and fix flaky tests to improve reliability')
  }

  if (metrics.performance.e2eTestTime > 300000) {
    recommendations.push('- Consider parallelizing E2E tests or reducing test scope')
  }

  return recommendations.length > 0 ? recommendations.join('\n') : '- All quality metrics are within acceptable ranges!'
}

// Run the report generation
generateTestReport().catch(console.error)
```

---

*This testing strategy provides comprehensive coverage from unit tests to end-to-end testing, with automated quality gates and performance monitoring to ensure production-ready code quality.*