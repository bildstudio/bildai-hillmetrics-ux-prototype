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
import { useViewBlade } from "@/lib/view-blade-context"
import { cn } from "@/lib/utils"
import UnifiedSearch, { SearchSuggestion } from "@/components/search/unified-search"
import { FilterCondition } from "@/components/search/advanced-filter-panel"
import { generateRealSearchSuggestions, saveRecentSearch, getRecentSearches } from "@/lib/real-search-suggestions"
import { LinearProgress } from "@/components/ui/linear-progress"
import { useNavigation } from "@/lib/navigation-context"
import { useAdvancedFilter } from "@/lib/advanced-filter-context"
import { generateAvatarProps } from "@/lib/avatar-utils"

interface HeaderProps {
  onMenuToggle: () => void
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAppSwitcher, setShowAppSwitcher] = useState(false)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const { isNavigating, setIsNavigating } = useNavigation()
  const { setIsOpen: setAdvancedFilterOpen } = useAdvancedFilter()
  
  // New unified search state
  const [newSearchSuggestions, setNewSearchSuggestions] = useState<SearchSuggestion[]>([])
  const [isSearchLoading, setIsSearchLoading] = useState(false)
  const [hasLoadedInitialSuggestions, setHasLoadedInitialSuggestions] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [appliedFilters, setAppliedFilters] = useState<FilterCondition[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const [isMobileSearchExpanded, setIsMobileSearchExpanded] = useState(false)
  
  // Auto-expand search on mobile when on search page
  useEffect(() => {
    if (isMobile && pathname === '/search') {
      setIsMobileSearchExpanded(true)
    }
  }, [isMobile, pathname])
  const searchParams = useSearchParams()
  const { openBlade: openStackBlade, closeTopBlade } = useBladeStack()
  const { openBlade: openViewBladeCtx } = useViewBlade()
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
  
  // Korisničke informacije - ove bi trebalo da dođu iz konteksta ili API-ja
  const userFullName = "Ivo Lasic";
  const userEmail = "ivo.lasic@bild-studio.net";
  const userProfileImage = null; // null ako nema slike
  
  // Generiši avatar props
  const avatarProps = generateAvatarProps(userFullName, userEmail);

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

    // Sluša promjene filtera sa search stranice
    const handleSearchFiltersChanged = (event: CustomEvent) => {
      console.log('Header: Received searchFiltersChanged event:', event.detail.filters, 'pathname:', pathname)
      if (pathname === '/search') {
        setAppliedFilters(event.detail.filters || [])
        console.log('Header: Updated appliedFilters to:', event.detail.filters || [])
      }
    }

    // Resetuj filtere kad napustimo search stranicu
    if (pathname !== '/search') {
      setAppliedFilters([])
    }

    window.addEventListener('searchFiltersChanged', handleSearchFiltersChanged as EventListener)
    
    return () => {
      window.removeEventListener('searchFiltersChanged', handleSearchFiltersChanged as EventListener)
    }
  }, [pathname])

  // Navigation progress indicator - listen for pathname changes
  useEffect(() => {
    // Reset navigation state when pathname changes (page loaded)
    const timer = setTimeout(() => setIsNavigating(false), 100)
    return () => clearTimeout(timer)
  }, [pathname, setIsNavigating])

  // Reset mobile search bar when pathname changes (navigation occurred)
  useEffect(() => {
    if (isMobileSearchExpanded && pathname !== '/search') {
      setIsMobileSearchExpanded(false)
      setSearchOpen(false)
    }
  }, [pathname]) // Only depend on pathname, not isMobileSearchExpanded

  // New search handlers
  const handleNewSearchChange = async (term: string) => {
    handleSearchChange(term)
    
    if (term.length > 0) {
      setHasLoadedInitialSuggestions(false) // Reset flag when user starts typing
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
      setHasLoadedInitialSuggestions(false) // Reset flag when search is cleared
    }
  }

  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'filter') {
      // Navigate to search page with filter applied
      setIsNavigating(true)
      router.push(`/search?q=${encodeURIComponent(suggestion.value)}`)
      saveRecentSearch(suggestion.value)
      setRecentSearches(getRecentSearches())
    } else if (suggestion.type === 'quick_search') {
      // Navigate to search page with the search term
      setIsNavigating(true)
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



  const openItemBlade = (suggestion: SearchSuggestion) => {
    console.log('Opening blade for suggestion:', suggestion)
    console.log('Suggestion data:', suggestion.data)
    console.log('Suggestion category:', suggestion.category)
    
    // Open appropriate blade based on data type
    switch (suggestion.category) {
      case 'flux':
        const fluxId = String(suggestion.data.fluxId || suggestion.data.id)
        openViewBladeCtx(fluxId, suggestion.title, { stackControlled: true })
        openStackBlade(
          () => import("@/components/view-flux-blade/ViewFluxBlade"),
          {
            reportId: fluxId,
          },
          suggestion.title
        )
        break
      
      case 'fetching':
        openStackBlade(
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
        openStackBlade(
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
        openStackBlade(
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
        openStackBlade(
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
      setIsNavigating(true)
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
    
    setIsNavigating(true)
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
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8 relative">
      {/* Material 3 Linear Progress Indicator */}
      {isNavigating && (
        <div className="absolute bottom-0 left-0 right-0 z-30">
          <LinearProgress className="h-1" />
        </div>
      )}
      <div className="flex items-center flex-1 mr-4">
        <Button variant="ghost" size="icon" className="mr-2 md:hidden" onClick={onMenuToggle}>
          <Menu className="h-6 w-6" />
          <span className="sr-only">Otvori/Zatvori meni</span>
        </Button>

        {/* Desktop Search */}
        <div className={`relative hidden sm:block transition-all duration-300 ${isMobileSearchExpanded ? 'sm:w-0 sm:opacity-0' : 'w-[60%] max-w-2xl'}`}>
          <Popover
            open={searchOpen}
            onOpenChange={(open) => {
              // Ne dozvoljavaj automatsko zatvaranje kad user klikne na search area
              // Samo eksplicitno zatvaranje
              if (!open && searchOpen) {
                // Provjeri da li je klik bio van search area-a
                setSearchOpen(false)
              }
            }}
          >
            <PopoverTrigger asChild={true}>
              <div className="relative cursor-pointer group">
                <div 
                  className="relative flex items-center bg-[#f1f3f4] hover:bg-white border border-transparent hover:border-[#dadce0] hover:shadow-sm rounded-full h-12 px-4 transition-all duration-200 ease-in-out"
                  onClick={() => {
                    if (!searchOpen) {
                      setSearchOpen(true)
                      if (searchTerm.length === 0 && !hasLoadedInitialSuggestions) {
                        setHasLoadedInitialSuggestions(true)
                        generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                      }
                    }
                  }}
                >
                  <Search className="w-5 h-5 text-[#5f6368] mr-3 flex-shrink-0" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleNewSearchChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEnterKey()}
                    onFocus={() => {
                      if (!searchOpen) {
                        setSearchOpen(true)
                        if (searchTerm.length === 0 && !hasLoadedInitialSuggestions) {
                          // Show recent searches and suggestions only once
                          setHasLoadedInitialSuggestions(true)
                          generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                        }
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!searchOpen) {
                        setSearchOpen(true)
                        if (searchTerm.length === 0 && !hasLoadedInitialSuggestions) {
                          setHasLoadedInitialSuggestions(true)
                          generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                        }
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
                    onClick={(e) => {
                      e.stopPropagation()
                      setSearchOpen(false) // Zatvori search dropdown
                      
                      if (pathname === '/search') {
                        // If on search page, use local event
                        window.dispatchEvent(new CustomEvent('openAdvancedFilters'))
                      } else {
                        // Otherwise, open global filter panel
                        setAdvancedFilterOpen(true)
                      }
                    }}
                    aria-label="Show advanced filters"
                  >
                    <FilterIcon className="h-4 w-4 text-[#5f6368]" />
                    {console.log('Header: Rendering badge with appliedFilters.length:', appliedFilters.length)}
                    {appliedFilters.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                        {appliedFilters.length}
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()} style={{ width: 'var(--radix-popover-trigger-width)' }}>
                <UnifiedSearch
                  searchTerm={searchTerm}
                  onSearchChange={handleNewSearchChange}
                  suggestions={newSearchSuggestions}
                  isLoading={isSearchLoading}
                  onSuggestionSelect={handleSuggestionSelect}
                  onShowAdvancedFilters={() => {
                    setSearchOpen(false) // Zatvori search dropdown
                    
                    if (pathname === '/search') {
                      // If on search page, use local event
                      window.dispatchEvent(new CustomEvent('openAdvancedFilters'))
                    } else {
                      // Otherwise, open global filter panel
                      setAdvancedFilterOpen(true)
                    }
                  }}
                  onEnterKey={handleEnterKey}
                  recentSearches={recentSearches}
                />
              </PopoverContent>
          </Popover>
        </div>

        {/* Mobile Search - Expandable */}
        <div className="sm:hidden flex items-center">
          {!isMobileSearchExpanded && pathname !== '/search' ? (
            // Search Icon Button - hidden on search page
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full hover:bg-[#f8f9fa]"
              onClick={() => {
                setIsMobileSearchExpanded(true)
                setSearchOpen(true)
                if (searchTerm.length === 0 && !hasLoadedInitialSuggestions) {
                  setHasLoadedInitialSuggestions(true)
                  generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                }
              }}
              aria-label="Open search"
            >
              <Search className="h-5 w-5 text-[#5f6368]" />
            </Button>
          ) : null}
        </div>
        
        {/* Mobile Search Overlay - Full Width */}
        {(isMobileSearchExpanded || (isMobile && pathname === '/search')) && (
          <div className="sm:hidden absolute top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 h-16 flex items-center px-4">
            {/* Hamburger Menu */}
            <Button variant="ghost" size="icon" className="mr-2 flex-shrink-0" onClick={onMenuToggle}>
              <Menu className="h-6 w-6" />
              <span className="sr-only">Otvori/Zatvori meni</span>
            </Button>
            <Popover
              open={searchOpen}
              onOpenChange={(open) => {
                if (!open && searchOpen) {
                  setSearchOpen(false)
                }
              }}
            >
              <div className="relative flex-1">
                <div className="relative flex items-center bg-[#f1f3f4] border border-transparent rounded-full h-12 px-4 transition-all duration-200 ease-in-out">
                  <PopoverTrigger asChild>
                    <div className="flex-1 flex items-center">
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => handleNewSearchChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEnterKey()}
                        onFocus={() => {
                          if (!searchOpen) {
                            setSearchOpen(true)
                            if (searchTerm.length === 0 && !hasLoadedInitialSuggestions) {
                              setHasLoadedInitialSuggestions(true)
                              generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                            }
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!searchOpen) {
                            setSearchOpen(true)
                            if (searchTerm.length === 0 && !hasLoadedInitialSuggestions) {
                              setHasLoadedInitialSuggestions(true)
                              generateRealSearchSuggestions('').then(setNewSearchSuggestions)
                            }
                          }
                        }}
                        className="flex-1 bg-transparent border-0 p-0 h-auto text-[14px] text-[#202124] placeholder:text-[#5f6368] focus-visible:ring-0 focus-visible:ring-offset-0 outline-none"
                        autoComplete="off"
                        autoFocus
                      />
                    </div>
                  </PopoverTrigger>
                    {searchTerm.length > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full hover:bg-[#f8f9fa] flex-shrink-0"
                        onClick={() => {
                          handleNewSearchChange('')
                        }}
                        aria-label="Clear search"
                      >
                        <X className="h-4 w-4 text-[#5f6368]" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-2 h-8 w-8 rounded-full hover:bg-[#f8f9fa] flex-shrink-0 relative"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSearchOpen(false) // Zatvori search dropdown
                        setIsMobileSearchExpanded(false) // Zatvori mobile search
                        
                        if (pathname === '/search') {
                          // If on search page, use local event
                          window.dispatchEvent(new CustomEvent('openAdvancedFilters'))
                        } else {
                          // Otherwise, open global filter panel
                          setAdvancedFilterOpen(true)
                        }
                      }}
                      aria-label="Show advanced filters"
                    >
                      <FilterIcon className="h-4 w-4 text-[#5f6368]" />
                      {console.log('Mobile Header: Rendering badge with appliedFilters.length:', appliedFilters.length)}
                      {appliedFilters.length > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {appliedFilters.length}
                        </span>
                      )}
                    </Button>
                </div>
              </div>
              <PopoverContent className="p-0" align="start" onOpenAutoFocus={(e) => e.preventDefault()} style={{ width: 'calc(100vw - 2rem)' }}>
                <UnifiedSearch
                  searchTerm={searchTerm}
                  onSearchChange={handleNewSearchChange}
                  suggestions={newSearchSuggestions}
                  isLoading={isSearchLoading}
                  onSuggestionSelect={(suggestion) => {
                    handleSuggestionSelect(suggestion)
                    // Don't close search on search page
                    if (pathname !== '/search') {
                      setIsMobileSearchExpanded(false)
                    }
                  }}
                  onShowAdvancedFilters={() => {
                    setSearchOpen(false)
                    // Don't close search on search page
                    if (pathname !== '/search') {
                      setIsMobileSearchExpanded(false)
                    }
                    
                    if (pathname === '/search') {
                      window.dispatchEvent(new CustomEvent('openAdvancedFilters'))
                    } else {
                      setAdvancedFilterOpen(true)
                    }
                  }}
                  onEnterKey={() => {
                    handleEnterKey()
                    // Don't close search on search page
                    if (pathname !== '/search') {
                      setIsMobileSearchExpanded(false)
                    }
                  }}
                  recentSearches={recentSearches}
                />
              </PopoverContent>
            </Popover>
            {pathname !== '/search' && (
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-8 w-8 rounded-full hover:bg-[#f8f9fa] flex-shrink-0"
                onClick={() => {
                  setIsMobileSearchExpanded(false)
                  setSearchOpen(false)
                  handleNewSearchChange('')
                }}
                aria-label="Close search"
              >
                <X className="h-4 w-4 text-[#5f6368]" />
              </Button>
            )}
          </div>
        )}
      </div>

      <div className={`flex items-center space-x-1 sm:space-x-2 transition-all duration-300 ${isMobileSearchExpanded ? 'sm:opacity-100 opacity-0 pointer-events-none sm:pointer-events-auto' : 'opacity-100 pointer-events-auto'}`}>
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

        {isMobile ? (
          // Mobile: Direct button without dropdown
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifikacije"
            className={cn(
              "relative hover:bg-[#d9ecee]/70 transition-colors duration-200",
              showNotifications && "bg-[#d9ecee]",
            )}
            onClick={() => setShowNotifications(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d5540e] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e00736]"></span>
              </span>
            )}
          </Button>
        ) : (
          // Desktop: Dropdown menu
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
              side="bottom"
              alignOffset={-8}
            >
              <NotificationsPanel onClose={() => setShowNotifications(false)} isMobile={false} />
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          variant="ghost"
          size="icon"
          aria-label="Podešavanja"
          className="hover:bg-[#d9ecee]/70 transition-colors duration-200"
          onClick={() => {
            setIsNavigating(true)
            router.push('/settings')
          }}
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
                <AvatarImage src={userProfileImage} alt={userFullName} />
                <AvatarFallback 
                  style={{ 
                    backgroundColor: avatarProps.backgroundColor,
                    color: avatarProps.textColor,
                    fontWeight: 500,
                    fontSize: '14px'
                  }}
                >
                  {avatarProps.initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount onOpenAutoFocus={(e) => e.preventDefault()}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userFullName}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              setIsNavigating(true)
              router.push('/profile')
            }}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setIsNavigating(true)
              router.push('/settings')
            }}>
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
      
      {/* Mobile Notifications Panel */}
      {isMobile && showNotifications && (
        <NotificationsPanel onClose={() => setShowNotifications(false)} isMobile={true} />
      )}
      
    </header>
  )
}
