import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import UnifiedSearch, { type SearchSuggestion } from '@/components/search/unified-search'
import { Search } from 'lucide-react'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
  Filter: () => <div data-testid="filter-icon" />,
  FileText: () => <div data-testid="filetext-icon" />,
  Database: () => <div data-testid="database-icon" />,
  Workflow: () => <div data-testid="workflow-icon" />,
  TrendingUp: () => <div data-testid="trending-icon" />,
}))

// Mock UI components
jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children }: { children: React.ReactNode }) => 
    <span data-testid="badge">{children}</span>
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => 
    <button onClick={onClick} data-testid="button">{children}</button>
}))

jest.mock('@/components/ui/separator', () => ({
  Separator: () => <div data-testid="separator" />
}))

const mockSuggestions: SearchSuggestion[] = [
  {
    id: '1',
    title: 'Financial Data Processing',
    description: 'Process financial reports',
    category: 'workflow',
    icon: Search,
    value: 'financial',
    data: { workflowId: '123' },
    type: 'navigation'
  }
]

describe('UnifiedSearch', () => {
  const defaultProps = {
    searchTerm: '',
    onSearchChange: jest.fn(),
    suggestions: mockSuggestions,
    onSuggestionSelect: jest.fn(),
    onShowAdvancedFilters: jest.fn(),
    onEnterKey: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render without crashing', () => {
    render(<UnifiedSearch {...defaultProps} />)
    expect(document.body).toBeInTheDocument()
  })

  test('should display suggestions when provided', () => {
    render(<UnifiedSearch {...defaultProps} searchTerm="financial" />)
    expect(screen.getByText('Financial Data Processing')).toBeInTheDocument()
  })

  test('should show loading state', () => {
    render(<UnifiedSearch {...defaultProps} isLoading={true} />)
    expect(screen.getByText('Searching...')).toBeInTheDocument()
  })

  test('should handle suggestion click', () => {
    const onSuggestionSelect = jest.fn()
    render(
      <UnifiedSearch 
        {...defaultProps} 
        searchTerm="financial"
        onSuggestionSelect={onSuggestionSelect}
      />
    )
    
    fireEvent.click(screen.getByText('Financial Data Processing'))
    expect(onSuggestionSelect).toHaveBeenCalledWith(mockSuggestions[0])
  })
})