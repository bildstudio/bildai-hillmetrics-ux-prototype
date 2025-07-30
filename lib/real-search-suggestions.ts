import { SearchSuggestion } from "@/components/search/unified-search"
import { 
  FileText, 
  Activity, 
  Database, 
  Workflow, 
  TrendingUp,
  Hash,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

// Real API calls for search suggestions
export async function generateRealSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
  const suggestions: SearchSuggestion[] = []
  const lowerQuery = query.toLowerCase().trim()

  if (!lowerQuery) {
    // Return recent items from localStorage and common suggestions
    return getRecentSuggestionsAndCommon()
  }

  try {
    // Only search flux data for now since other APIs don't exist
    const [
      fluxSuggestions,
      // fetchingSuggestions,
      // processingSuggestions,
      // contentSuggestions,
      // workflowSuggestions
    ] = await Promise.allSettled([
      searchFluxData(lowerQuery),
      // searchFetchingData(lowerQuery),
      // searchProcessingData(lowerQuery), 
      // searchContentData(lowerQuery),
      // searchWorkflowData(lowerQuery)
    ])

    // Add flux suggestions
    if (fluxSuggestions.status === 'fulfilled') {
      suggestions.push(...fluxSuggestions.value)
    }

    // // Add fetching suggestions
    // if (fetchingSuggestions.status === 'fulfilled') {
    //   suggestions.push(...fetchingSuggestions.value)
    // }

    // // Add processing suggestions
    // if (processingSuggestions.status === 'fulfilled') {
    //   suggestions.push(...processingSuggestions.value)
    // }

    // // Add content suggestions
    // if (contentSuggestions.status === 'fulfilled') {
    //   suggestions.push(...contentSuggestions.value)
    // }

    // // Add workflow suggestions
    // if (workflowSuggestions.status === 'fulfilled') {
    //   suggestions.push(...workflowSuggestions.value)
    // }

    // Add smart filter suggestions based on query
    suggestions.push(...generateSmartFilters(lowerQuery))

  } catch (error) {
    console.error('Failed to generate real search suggestions:', error)
  }

  // Sort by relevance and limit results
  return suggestions.slice(0, 8)
}

async function searchFluxData(query: string): Promise<SearchSuggestion[]> {
  try {
    const response = await fetch(`/api/reports?q=${encodeURIComponent(query)}&pageSize=5`)
    const data = await response.json()
    
    if (!data.error && data.data) {
      return data.data.map((flux: any) => ({
        id: `flux-${flux.id}`,
        title: flux.name,
        description: `Flux ${flux.id} • Status: ${flux.status}`,
        category: 'flux' as const,
        icon: TrendingUp,
        value: flux.name,
        data: { fluxId: flux.id, ...flux },
        type: 'navigation' as const
      }))
    }
  } catch (error) {
    console.error('Failed to search flux data:', error)
  }
  return []
}

async function searchFetchingData(query: string): Promise<SearchSuggestion[]> {
  try {
    // Check if query is a number (fetchingID)
    if (/^\d+$/.test(query)) {
      const response = await fetch(`/api/fetching-history?fetchingID=${query}&pageSize=5`)
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Fetching history API returned non-JSON response')
        return []
      }
      
      const data = await response.json()
      
      if (!data.error && data.data && data.data.length > 0) {
        return data.data.map((item: any) => ({
          id: `fetching-${item.fetchingID}`,
          title: `Fetching ID: ${item.fetchingID}`,
          description: `${item.status} • ${item.numberOfContent || 0} items`,
          category: 'fetching' as const,
          icon: Database,
          value: item.fetchingID.toString(),
          data: { fetchingID: item.fetchingID, ...item },
          type: 'navigation' as const
        }))
      }
    }
    
    // Search by status
    if (query.includes('status') || ['success', 'failed', 'fetching'].some(s => query.includes(s))) {
      return [
        {
          id: 'fetching-status-filter',
          title: `Filter by status: ${query}`,
          description: 'Apply status filter to fetching history',
          category: 'fetching',
          icon: CheckCircle,
          value: `status:${query}`,
          data: { field: 'status', operator: 'contains', value: query },
          type: 'filter'
        }
      ]
    }
  } catch (error) {
    console.error('Failed to search fetching data:', error)
  }
  return []
}

async function searchProcessingData(query: string): Promise<SearchSuggestion[]> {
  try {
    // Check if query is a number (processingID)
    if (/^\d+$/.test(query)) {
      const response = await fetch(`/api/processing-history?processingID=${query}&pageSize=5`)
      const data = await response.json()
      
      if (!data.error && data.data && data.data.length > 0) {
        return data.data.map((item: any) => ({
          id: `processing-${item.processingID}`,
          title: `Processing ID: ${item.processingID}`,
          description: `${item.status} • ${item.numberOfProcessingContent || 0} items`,
          category: 'processing' as const,
          icon: Workflow,
          value: item.processingID.toString(),
          data: { processingID: item.processingID, ...item },
          type: 'navigation' as const
        }))
      }
    }
  } catch (error) {
    console.error('Failed to search processing data:', error)
  }
  return []
}

async function searchContentData(query: string): Promise<SearchSuggestion[]> {
  // API doesn't support search parameter, only return results if query looks like contentID
  if (/^\d+$/.test(query)) {
    try {
      // Get recent content and filter by ID
      const response = await fetch(`/api/fetched-contents?pageSize=50`)
      const data = await response.json()
      
      if (!data.error && data.data) {
        const filtered = data.data.filter((item: any) => 
          item.contentID.toString().includes(query) ||
          (item.contentName && item.contentName.toLowerCase().includes(query.toLowerCase()))
        )
        
        return filtered.slice(0, 5).map((item: any) => ({
          id: `content-${item.contentID}`,
          title: item.contentName || `Content ${item.contentID}`,
          description: `${item.fileType} • ${item.status}`,
          category: 'content' as const,
          icon: FileText,
          value: item.contentName || item.contentID.toString(),
          data: { contentID: item.contentID, ...item },
          type: 'navigation' as const
        }))
      }
    } catch (error) {
      console.error('Failed to search content data:', error)
    }
  }
  return []
}

async function searchWorkflowData(query: string): Promise<SearchSuggestion[]> {
  // API doesn't support search parameter, only return results if query looks like workflowID  
  if (/^\d+$/.test(query)) {
    try {
      // Get recent workflows and filter by ID
      const response = await fetch(`/api/workflow-execution-log?pageSize=50`)
      const data = await response.json()
      
      if (!data.error && data.data) {
        const filtered = data.data.filter((item: any) => 
          item.id.toString().includes(query) ||
          (item.flux_name && item.flux_name.toLowerCase().includes(query.toLowerCase()))
        )
        
        return filtered.slice(0, 5).map((item: any) => ({
          id: `workflow-${item.id}`,
          title: `Workflow ${item.id}`,
          description: `${item.flux_name || `Flux ${item.flux_id}`} • ${item.status}`,
          category: 'workflow' as const,
          icon: Activity,
          value: item.flux_name || item.id.toString(),
          data: { workflowID: item.id, ...item },
          type: 'navigation' as const
        }))
      }
    } catch (error) {
      console.error('Failed to search workflow data:', error)
    }
  }
  return []
}

function generateSmartFilters(query: string): SearchSuggestion[] {
  const suggestions: SearchSuggestion[] = []

  // Status-based filters
  if (query.includes('success') || query.includes('completed')) {
    suggestions.push({
      id: 'filter-success',
      title: 'Status: Success',
      description: 'Show only successful items',
      category: 'fetching',
      icon: CheckCircle,
      value: 'status:Success',
      data: { field: 'status', operator: 'equals', value: 'Success' },
      type: 'filter'
    })
  }

  if (query.includes('failed') || query.includes('error')) {
    suggestions.push({
      id: 'filter-failed',
      title: 'Status: Failed',
      description: 'Show only failed items',
      category: 'fetching',
      icon: AlertCircle,
      value: 'status:Failed',
      data: { field: 'status', operator: 'equals', value: 'Failed' },
      type: 'filter'
    })
  }

  if (query.includes('progress') || query.includes('processing')) {
    suggestions.push({
      id: 'filter-progress',
      title: 'Currently Processing',
      description: 'Show items in progress',
      category: 'processing',
      icon: Clock,
      value: 'status:Currently processing',
      data: { field: 'status', operator: 'contains', value: 'processing' },
      type: 'filter'
    })
  }

  // Date-based filters
  if (query.includes('today')) {
    suggestions.push({
      id: 'filter-today',
      title: 'Today',
      description: 'Items from today',
      category: 'workflow',
      icon: Calendar,
      value: 'date:today',
      data: { field: 'timestamp', operator: 'date_range', value: 'today' },
      type: 'filter'
    })
  }

  // File type filters
  const fileTypes = ['pdf', 'xlsx', 'csv', 'txt', 'json', 'xml']
  const matchingFileType = fileTypes.find(type => query.includes(type))
  if (matchingFileType) {
    suggestions.push({
      id: `filter-filetype-${matchingFileType}`,
      title: `${matchingFileType.toUpperCase()} files`,
      description: `Show only ${matchingFileType} files`,
      category: 'content',
      icon: FileText,
      value: `filetype:${matchingFileType}`,
      data: { field: 'fileType', operator: 'equals', value: matchingFileType },
      type: 'filter'
    })
  }

  return suggestions
}

function getRecentSuggestionsAndCommon(): SearchSuggestion[] {
  const recentSearches = getRecentSearches()
  
  // Comprehensive predefined filters
  const predefinedFilters: SearchSuggestion[] = [
    // Status-based filters
    {
      id: 'filter-failed-items',
      title: 'Failed items',
      description: 'View all failed fetching and processing items',
      category: 'fetching',
      icon: AlertCircle,
      value: 'status:Failed',
      data: { field: 'status', operator: 'equals', value: 'Failed', category: 'fetching' },
      type: 'filter'
    },
    {
      id: 'filter-success-items',
      title: 'Successful items',
      description: 'View all successfully completed items',
      category: 'fetching',
      icon: CheckCircle,
      value: 'status:Success',
      data: { field: 'status', operator: 'equals', value: 'Success', category: 'fetching' },
      type: 'filter'
    },
    {
      id: 'filter-in-progress',
      title: 'Currently processing',
      description: 'Items currently being processed',
      category: 'fetching',
      icon: Clock,
      value: 'status:processing',
      data: { field: 'status', operator: 'contains', value: 'processing', category: 'fetching' },
      type: 'filter'
    },
    
    // Time-based filters
    {
      id: 'filter-today',
      title: "Today's activity",
      description: 'Items from today',
      category: 'fetching',
      icon: Calendar,
      value: 'date:today',
      data: { field: 'timestamp', operator: 'date_range', value: 'today', category: 'fetching' },
      type: 'filter'
    },
    {
      id: 'filter-this-week',
      title: 'This week',
      description: 'Items from this week',
      category: 'fetching',
      icon: Calendar,
      value: 'date:week',
      data: { field: 'timestamp', operator: 'date_range', value: 'week', category: 'fetching' },
      type: 'filter'
    },
    {
      id: 'filter-last-hour',
      title: 'Last hour',
      description: 'Recent items from last hour',
      category: 'fetching',
      icon: Clock,
      value: 'date:hour',
      data: { field: 'timestamp', operator: 'date_range', value: 'hour', category: 'fetching' },
      type: 'filter'
    },
    
    // File type filters
    {
      id: 'filter-pdf-files',
      title: 'PDF files',
      description: 'Show only PDF documents',
      category: 'content',
      icon: FileText,
      value: 'filetype:pdf',
      data: { field: 'fileType', operator: 'equals', value: 'pdf', category: 'content' },
      type: 'filter'
    },
    {
      id: 'filter-excel-files',
      title: 'Excel files',
      description: 'Show only Excel spreadsheets',
      category: 'content',
      icon: FileText,
      value: 'filetype:xlsx',
      data: { field: 'fileType', operator: 'equals', value: 'xlsx', category: 'content' },
      type: 'filter'
    },
    {
      id: 'filter-large-files',
      title: 'Large files',
      description: 'Files larger than 10MB',
      category: 'content',
      icon: FileText,
      value: 'size:>10mb',
      data: { field: 'fileSize', operator: 'greaterThan', value: 10485760, category: 'content' },
      type: 'filter'
    },
    
    // Performance filters
    {
      id: 'filter-slow-processing',
      title: 'Slow processing',
      description: 'Items that took longer than 5 minutes',
      category: 'processing',
      icon: Clock,
      value: 'duration:>5min',
      data: { field: 'durationBucket', operator: 'equals', value: '5+ minutes', category: 'processing' },
      type: 'filter'
    },
    {
      id: 'filter-quick-processing',
      title: 'Quick processing',
      description: 'Items processed in under 1 minute',
      category: 'processing',
      icon: TrendingUp,
      value: 'duration:<1min',
      data: { field: 'durationBucket', operator: 'equals', value: '< 1 minute', category: 'processing' },
      type: 'filter'
    },
    
    // Error type filters
    {
      id: 'filter-connection-errors',
      title: 'Connection errors',
      description: 'Items with connection-related failures',
      category: 'fetching',
      icon: AlertCircle,
      value: 'error:connection',
      data: { field: 'errorType', operator: 'contains', value: 'connection', category: 'fetching' },
      type: 'filter'
    },
    {
      id: 'filter-timeout-errors',
      title: 'Timeout errors',
      description: 'Items that failed due to timeout',
      category: 'fetching',
      icon: Clock,
      value: 'error:timeout',
      data: { field: 'errorType', operator: 'contains', value: 'timeout', category: 'fetching' },
      type: 'filter'
    }
  ]

  const recentSuggestions = recentSearches.slice(0, 3).map((search, index) => ({
    id: `recent-${index}`,
    title: search,
    description: 'Recent search',
    category: 'recent' as const,
    icon: Clock,
    value: search,
    data: { searchTerm: search },
    type: 'quick_search' as const
  }))

  return [...recentSuggestions, ...predefinedFilters]
}

// Storage for recent searches (reuse from original file)
const RECENT_SEARCHES_KEY = 'recent_searches'
const MAX_RECENT_SEARCHES = 10

export function saveRecentSearch(searchTerm: string) {
  if (typeof window === 'undefined') return
  
  try {
    const recent = getRecentSearches()
    const updated = [searchTerm, ...recent.filter(s => s !== searchTerm)].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Failed to save recent search:', error)
  }
}

export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error('Failed to get recent searches:', error)
    return []
  }
}

export function clearRecentSearches() {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (error) {
    console.error('Failed to clear recent searches:', error)
  }
}
