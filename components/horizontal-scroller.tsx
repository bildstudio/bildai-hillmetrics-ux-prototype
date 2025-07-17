"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HorizontalScrollerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  scrollAmount?: number
}

export function HorizontalScroller({ children, className, scrollAmount = 250, ...props }: HorizontalScrollerProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = React.useState(false)
  const [canScrollRight, setCanScrollRight] = React.useState(false)

  const checkForScrollability = React.useCallback(() => {
    const container = scrollContainerRef.current
    if (container) {
      const isScrollable = container.scrollWidth > container.clientWidth
      if (!isScrollable) {
        setCanScrollLeft(false)
        setCanScrollRight(false)
        return
      }
      setCanScrollLeft(container.scrollLeft > 0)
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 1)
    }
  }, [])

  React.useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      checkForScrollability()

      const handleScroll = () => checkForScrollability()
      container.addEventListener("scroll", handleScroll, { passive: true })

      const resizeObserver = new ResizeObserver(checkForScrollability)
      resizeObserver.observe(container)

      const mutationObserver = new MutationObserver(checkForScrollability)
      mutationObserver.observe(container, { childList: true, subtree: true })

      return () => {
        container.removeEventListener("scroll", handleScroll)
        resizeObserver.disconnect()
        mutationObserver.disconnect()
      }
    }
  }, [checkForScrollability])

  const handleScrollLeft = () => {
    scrollContainerRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" })
  }

  const handleScrollRight = () => {
    scrollContainerRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" })
  }

  return (
    <div className={cn("relative", className)} {...props}>
      <div ref={scrollContainerRef} className="overflow-x-auto scrollbar-hide whitespace-nowrap w-full">
        {children}
      </div>
      {canScrollLeft && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-white transition-opacity duration-200"
          onClick={handleScrollLeft}
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </Button>
      )}
      {canScrollRight && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 rounded-full bg-white/80 shadow-md hover:bg-white transition-opacity duration-200"
          onClick={handleScrollRight}
          aria-label="Scroll right"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </Button>
      )}
    </div>
  )
}
