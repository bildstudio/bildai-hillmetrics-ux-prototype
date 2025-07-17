"use client"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Menu, Bell, Settings, LogOut, UserCircle, Search, FilterIcon, X, LayoutGrid } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import NotificationsPanel from "@/components/notifications/notifications-panel"
import AppSwitcherPanel from "@/components/layout/app-switcher-panel"
import { useSearch } from "@/lib/search-context"
import { useBladeStack } from "@/lib/blade-stack-context"
import { cn } from "@/lib/utils"
import UnifiedSearch, { SearchSuggestion } from "@/components/search/unified-search"
import AdvancedFilterPanel, { FilterCondition } from "@/components/search/advanced-filter-panel"
import { generateRealSearchSuggestions, saveRecentSearch, getRecentSearches } from "@/lib/real-search-suggestions"

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAppSwitcher, setShowAppSwitcher] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  
  // New unified search state
  const [newSearchSuggestions, setNewSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([])
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { openBlade, closeTopBlade } = useBladeStack()
  const {
    searchTerm,
    handleSearchChange,
    searchSuggestions,
    handleSearchSelect,
    searchOpen,
    setSearchOpen,
    showFilterPanel,
    setShowFilterPanel,
    filters,
    handleFilterChange,
    clearAllFilters,
    availableCategories,
  } = useSearch()

  const localFilterPanelRef = useRef<HTMLDivElement>(null)

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isLoggedIn")
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_expiry")
    }
    router.push("/login")
  }

  useEffect(() => {
    async function fetchUnreadCount() {
      try {
        const response = await fetch("/data/notifications.json")
        if (response.ok) {
          const contentType = response.headers.get("content-type")
          if (contentType && contentType.includes("application/json")) {
            const notificationsData = await response.json()
            const unread = notificationsData.filter((n: any) => !n.isRead).length
            setUnreadNotificationsCount(unread)
          } else {
            console.warn("Received non-JSON response for notifications. Content-Type:", contentType)
            const responseText = await response.text()
            console.warn("Response content (first 200 chars):", responseText.substring(0, 200))
            setUnreadNotificationsCount(0) // Default to 0 if response is not valid JSON
          }
        } else {
          console.error("Failed to fetch notifications with status:", response.status, response.statusText)
          const errorText = await response.text()
          console.error("Response body:", errorText.substring(0, 200))
          setUnreadNotificationsCount(0) // Default to 0 on non-OK status
        }
      } catch (error) {
        console.error("Error fetching or parsing notifications:", error)
        setUnreadNotificationsCount(0) // Default to 0 on any error
      }
    }
    fetchUnreadCount()
    // Load recent searches
    setRecentSearches(getRecentSearches())
  }, [])

  // New search handlers
  const handleNewSearchChange = async (term: string) => {
    handleSearchChange(term)
    
    if (term.length > 0) {
      setIsSearchLoading(true)
      try {
        const suggestions = await generateRealSearchSuggestions(term)
        setNewSearchSuggestions(suggestions)
      } catch (error) {
        console.error('Failed to generate search suggestions:', error)
        setNewSearchSuggestions([])
      }
      setIsSearchLoading(false)
    } else {
      setNewSearchSuggestions([])
    }
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'filter') {
      // Navigate to search page with filter applied
      router.push(`/search?q=${encodeURIComponent(suggestion.value)}`)
      saveRecentSearch(suggestion.value)
      setRecentSearches(getRecentSearches())
    } else if (suggestion.type === 'quick_search') {
      // Navigate to search page with the search term
      router.push(`/search?q=${encodeURIComponent(suggestion.value)}`)
      saveRecentSearch(suggestion.value)
      setRecentSearches(getRecentSearches())
    } else if (suggestion.type === 'navigation') {
      // Open specific blade for the item
      openItemBlade(suggestion)
      saveRecentSearch(suggestion.value)
      setRecentSearches(getRecentSearches())
    }
    setSearchOpen(false)
  }

  const handleApplyFilters = (filters: FilterCondition[]) => {
    setAppliedFilters(filters)
    // Apply filters to search context or navigate with filters
    console.log('Applied filters:', filters)
  }

  const handleClearFilters = () => {
    setAppliedFilters([])
    clearAllFilters()
  }

  const openItemBlade = (suggestion: SearchSuggestion) => {
    console.log('Opening blade for suggestion:', suggestion)
    console.log('Suggestion data:', suggestion.data)
    console.log('Suggestion category:', suggestion.category)
    
    // Open appropriate blade based on data type
    switch (suggestion.category) {
      case 'flux':
        openBlade(
          () => import("@/components/view-flux-blade/ViewFluxBlade"),
          {
            reportId: String(suggestion.data.fluxId || suggestion.data.id),
          },
          suggestion.title
        )
        break
      
      case 'fetching':
        openBlade(
          () => import("@/components/fetching-history/fetching-history-details-blade"),
          {
            fetchingId: suggestion.data.fetchingID,
            fluxName: suggestion.title,
            onClose: closeTopBlade,
          },
          `Fetching ${suggestion.data.fetchingID}`
        )
        break
      
      case 'processing':
        openBlade(
          () => import("@/components/processing-history/processing-history-details-blade"),
          {
            processingId: suggestion.data.processingID,
            fluxName: suggestion.title,
            fluxId: String(suggestion.data.flux_id || ""),
            onClose: closeTopBlade,
          },
          `Processing ${suggestion.data.processingID}`
        )
        break
      
      case 'content':
        openBlade(
          () => import("@/components/view-flux-blade/FilePreviewBlade"),
          {
            file: {
              id: suggestion.data.contentID,
              name: suggestion.title,
              fluxId: suggestion.data.flux_id || suggestion.data.fluxId,
              fluxName: suggestion.data.flux_name
            },
            onClose: closeTopBlade,
          },
          suggestion.title
        )
        break
      
      case 'workflow':
        openBlade(
          () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
          {
            item: suggestion.data,
            onClose: closeTopBlade,
          },
          `Workflow ${suggestion.data.workflowID || suggestion.data.id}`
        )
        break
      
      default:
        console.warn('Unknown suggestion category:', suggestion.category)
        console.warn('Suggestion data:', suggestion)
        break
    }
  }

  const handleEnterKey = () => {
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm)}`)
      setSearchOpen(false)
    }
  }

  const navigateToGridWithFilter = (suggestion: SearchSuggestion) => {
    let targetUrl = ''
    let filterParams = new URLSearchParams()

    // Determine target page based on category
    switch (suggestion.category) {
      case 'flux':
        targetUrl = '/flux-list'
        if (suggestion.data.fluxId) {
          filterParams.set('fluxId', suggestion.data.fluxId.toString())
        }
        break
      
      case 'fetching':
        targetUrl = '/flux-list/fetching-history'
        // Handle specific data
        if (suggestion.data.fetchingID) {
          filterParams.set('fetchingId', suggestion.data.fetchingID.toString())
        }
        if (suggestion.data.status) {
          filterParams.set('status', suggestion.data.status)
        }
        
        // Handle predefined filter suggestions
        if (suggestion.type === 'filter') {
          if (suggestion.data.field === 'status') {
            filterParams.set('status', suggestion.data.value)
          }
          if (suggestion.data.field === 'timestamp') {
            if (suggestion.data.value === 'today') {
              filterParams.set('date', 'today')
            } else if (suggestion.data.value === 'hour') {
              filterParams.set('date', 'hour')
            }
          }
          if (suggestion.data.field === 'errorType') {
            filterParams.set('errorType', suggestion.data.value)
          }
        }
        break
      
      case 'processing':
        targetUrl = '/flux-list/processing-history'
        // Handle specific data
        if (suggestion.data.processingID) {
          filterParams.set('processingId', suggestion.data.processingID.toString())
        }
        if (suggestion.data.status) {
          filterParams.set('status', suggestion.data.status)
        }
        
        // Handle predefined filter suggestions
        if (suggestion.type === 'filter') {
          if (suggestion.data.field === 'status') {
            filterParams.set('status', suggestion.data.value)
          }
          if (suggestion.data.field === 'durationBucket') {
            filterParams.set('durationBucket', suggestion.data.value)
          }
          if (suggestion.data.field === 'timestamp') {
            if (suggestion.data.value === 'today') {
              filterParams.set('date', 'today')
            }
          }
        }
        break
      
      case 'content':
        targetUrl = '/flux-list/processing-history/fetched-content'
        // Handle specific data
        if (suggestion.data.contentID) {
          filterParams.set('contentId', suggestion.data.contentID.toString())
        }
        if (suggestion.data.fetchingID) {
          filterParams.set('fetchingId', suggestion.data.fetchingID.toString())
        }
        if (suggestion.data.processingID) {
          filterParams.set('processingId', suggestion.data.processingID.toString())
        }
        
        // Handle predefined filter suggestions
        if (suggestion.type === 'filter') {
          if (suggestion.data.field === 'fileType') {
            filterParams.set('fileType', suggestion.data.value)
          }
          if (suggestion.data.field === 'fileSize') {
            filterParams.set('fileSize', suggestion.data.value.toString())
          }
        }
        break
      
      case 'workflow':
        targetUrl = '/flux-list/workflow-execution-log'
        // Handle specific data
        if (suggestion.data.workflowID) {
          filterParams.set('workflowId', suggestion.data.workflowID.toString())
        }
        if (suggestion.data.flux_id) {
          filterParams.set('fluxId', suggestion.data.flux_id.toString())
        }
        if (suggestion.data.status) {
          filterParams.set('status', suggestion.data.status)
        }
        
        // Handle predefined filter suggestions
        if (suggestion.type === 'filter') {
          if (suggestion.data.field === 'status') {
            filterParams.set('status', suggestion.data.value)
          }
          if (suggestion.data.field === 'timestamp') {
            if (suggestion.data.value === 'week') {
              filterParams.set('date', 'week')
            } else if (suggestion.data.value === 'today') {
              filterParams.set('date', 'today')
            }
          }
        }
        break
      
      default:
        return
    }

    // Navigate to the target URL with filters
    const finalUrl = filterParams.toString() 
      ? `${targetUrl}?${filterParams.toString()}`
      : targetUrl
    
    router.push(finalUrl)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (localFilterPanelRef.current && !localFilterPanelRef.current.contains(event.target as Node)) {
        const triggerButton = document.querySelector('[aria-label="Open advanced filters"]')
        if (triggerButton && !triggerButton.contains(event.target as Node)) {
          setShowFilterPanel(false)
        }
      }
    }
    if (showFilterPanel) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showFilterPanel, setShowFilterPanel])

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <div className="flex items-center flex-1 mr-4">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuToggle}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Otvori/Zatvori meni</span>
        </Button>

        <div className="relative w-[60%] max-w-2xl">
          <Popover
            open={searchOpen && (searchTerm.length > 0 || newSearchSuggestions.length > 0)}
            onOpenChange={setSearchOpen}
          >
            <PopoverTrigger asChild={true}>
              <div className="relative cursor-pointer group">
                <div className="relative flex items-center bg-[#f1f3f4] hover:bg-white border border-transparent hover:border-[#dadce0] hover:shadow-sm rounded-full h-12 px-4 transition-all duration-200 ease-in-out">
                  <Search className="w-5 h-5 text-[#5f6368] mr-3 flex-shrink-0" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleNewSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnterKey()}
                    onFocus={() => {
                      setSearchOpen(true)
                      if (searchTerm.length === 0) {
                        // Show recent searches and suggestions
                        generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                      }
                    }}
                    className="flex-1 bg-transparent border-0 p-0 h-auto text-[14px] text-[#202124] placeholder:text-[#5f6368] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                    autoComplete="off"
                  />
                  {searchTerm.length > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-[#f8f9fa] flex-shrink-0"
                      onClick={() => {
                        handleNewSearchChange('')
                        setSearchOpen(false)
                      }}
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4 text-[#5f6368]" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-2 h-8 w-8 rounded-full hover:bg-[#f8f9fa] flex-shrink-0"
                    onClick={() => setShowAdvancedFilters(true)}
                    aria-label="Show advanced filters"
                  >
                    <FilterIcon className="h-4 w-4 text-[#5f6368]" />
                    {appliedFilters.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {appliedFilters.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </PopoverTrigger>
            {searchOpen && (
              <PopoverContent className="p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()} style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <UnifiedSearch
                  searchTerm={searchTerm}
                  onSearchChange={handleNewSearchChange}
                  suggestions={newSearchSuggestions}
                  isLoading={isSearchLoading}
                  onSuggestionSelect={handleSuggestionSelect}
                  onShowAdvancedFilters={() => setShowAdvancedFilters(true)}
                  onEnterKey={handleEnterKey}
                  recentSearches={recentSearches}
                />
              </PopoverContent>
            )}
          </Popover>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2">
        <DropdownMenu open={showAppSwitcher} onOpenChange={setShowAppSwitcher}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Aplikacije"
              className={cn("hover:bg-[#d9ecee]/70 transition-colors duration-200", showAppSwitcher && "bg-[#d9ecee]")}
            >
              <LayoutGrid className="h-5 w-5 text-gray-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-0" align="end" sideOffset={8}>
            <AppSwitcherPanel onClose={() => setShowAppSwitcher(false)} />
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Notifikacije"
              className={cn(
                "relative hover:bg-[#d9ecee]/70 transition-colors duration-200",
                showNotifications && "bg-[#d9ecee]",
              )}
            >
              <Bell className="h-5 w-5" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1 right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d5540e] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e00736]"></span>
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="p-0 w-auto max-h-[calc(100vh-8rem)] overflow-hidden flex flex-col"
            align="end"
            sideOffset={8}
          >
            <NotificationsPanel onClose={() => setShowNotifications(false)} />
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          aria-label="Podešavanja"
          className="hover:bg-[#d9ecee]/70 transition-colors duration-200"
          onClick={() => router.push('/settings')}
        >
          <Settings className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-10 rounded-full hover:bg-[#d9ecee]/70 transition-colors duration-200"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage src="/placeholder.svg?width=40&height=40" alt="Korisnički avatar" />
                <AvatarFallback>IL</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Ivo Lasic</p>
                <p className="text-xs leading-none text-muted-foreground">ivo.lasic@bild-studio.net</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Podešavanja</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Odjavi se</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* TestNotification se sada renderuje unutar TestNotificationProvider-a u layout.tsx */}
      
      {/* Advanced Filter Panel */}
      <AdvancedFilterPanel
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        initialFilters={appliedFilters}
      />
    </header>
  )
}
