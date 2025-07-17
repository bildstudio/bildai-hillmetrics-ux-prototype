"use client"

import type React from "react"
import { Suspense, useEffect, useState, useRef } from "react"
import { Roboto } from "next/font/google"
import { useRouter, usePathname } from "next/navigation"
import Sidebar from "@/components/layout/sidebar"
import Header from "@/components/layout/header"
import { Loader2 } from "lucide-react"
import { SearchProvider } from "@/lib/search-context"
import { BladePanel, type BladePanelData } from "@/components/blade/blade-panel"
import { TestNotificationProvider, useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import { BladeProvider, useBlade } from "@/lib/blade-context"
import { EditBladeProvider } from "@/lib/edit-blade-context"
import EditBladeManager from "@/components/edit-flux-blade/edit-blade-manager"
import { ViewBladeProvider } from "@/lib/view-blade-context"
import ViewBladeManager from "@/components/view-flux-blade/view-blade-manager"
import MinimizedBladesContainer from "@/components/blade/minimized-blades-container"
import { BladeStackProvider } from "@/lib/blade-stack-context"

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
})

function AppLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const { openBlade, closeBlade, isBladeOpen, bladeData } = useBlade()
  const { showCustomNotification, updateCustomNotification, hideCustomNotification } = useTestNotification()
  const currentProcessTimer = useRef<NodeJS.Timeout | null>(null)
  const [dataFromLastSaveAttempt, setDataFromLastSaveAttempt] = useState<BladePanelData | null>(null)

  // Proveri da li je autentifikacija omogućena
  const isAuthEnabled = process.env.NEXT_PUBLIC_AUTH_ENABLED !== "false"

  useEffect(() => {
    const checkAuth = () => {
      // Ako je autentifikacija onemogućena, preskoči provere
      if (!isAuthEnabled) {
        setIsCheckingAuth(false)
        return
      }

      if (typeof window !== "undefined") {
        const authToken = localStorage.getItem("auth_token")
        const authExpiry = localStorage.getItem("auth_expiry")
        const isLoggedIn = localStorage.getItem("isLoggedIn")

        if (!authToken || !authExpiry || !isLoggedIn) {
          router.replace("/login")
          return
        }
        const expiryTime = Number.parseInt(authExpiry)
        if (Date.now() >= expiryTime) {
          localStorage.removeItem("auth_token")
          localStorage.removeItem("auth_expiry")
          localStorage.removeItem("isLoggedIn")
          router.replace("/login")
          return
        }
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [router, isAuthEnabled])

  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsSidebarOpen(window.innerWidth >= 768)
        if (window.innerWidth < 768) setIsCollapsed(false)
      }
    }
    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  const clearCurrentProcessTimer = () => {
    if (currentProcessTimer.current) {
      clearTimeout(currentProcessTimer.current)
      currentProcessTimer.current = null
    }
  }

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const runGlobalFluxSaveNotificationSequence = async (savedData: BladePanelData) => {
    clearCurrentProcessTimer()
    setDataFromLastSaveAttempt(savedData)

    const cancelSaveAction: NotificationAction = {
      label: "Cancel",
      variant: "outline",
      onClick: () => {
        clearCurrentProcessTimer()
        hideCustomNotification()
        openBlade(dataFromLastSaveAttempt || undefined)
        console.log("Save cancelled, blade reopened.")
      },
    }
    const closeSavingAction: NotificationAction = {
      label: "Close",
      variant: "ghost",
      onClick: () => {
        clearCurrentProcessTimer()
        hideCustomNotification()
        console.log("Saving process closed by user. Flux considered saved (simulated).")
      },
    }
    showCustomNotification("Saving flux...", [cancelSaveAction, closeSavingAction], true)

    try {
      await delay(3000)

      const undoAction: NotificationAction = {
        label: "Undo",
        variant: "destructive",
        onClick: async () => {
          clearCurrentProcessTimer()
          updateCustomNotification("Undoing save...", [], true)
          await delay(1500)
          hideCustomNotification()
          openBlade(dataFromLastSaveAttempt || undefined)
          console.log("Undo successful, flux deleted (simulated), blade reopened.")
        },
      }
      const viewAction: NotificationAction = {
        label: "View",
        onClick: () => {
          console.log("View clicked (placeholder)")
          hideCustomNotification()
        },
        variant: "link",
      }
      const closeUndoStageAction: NotificationAction = {
        label: "Close",
        variant: "ghost",
        onClick: () => {
          clearCurrentProcessTimer()
          hideCustomNotification()
        },
      }
      updateCustomNotification(
        `Flux "${savedData.basic.fluxName || "Untitled"}" successfully saved.`,
        [undoAction, viewAction, closeUndoStageAction],
        false,
      )

      currentProcessTimer.current = setTimeout(async () => {
        const closePermanentStageAction: NotificationAction = {
          label: "Close",
          variant: "ghost",
          onClick: () => {
            clearCurrentProcessTimer()
            hideCustomNotification()
          },
        }
        updateCustomNotification(
          `Flux "${savedData.basic.fluxName || "Untitled"}" permanently saved.`,
          [viewAction, closePermanentStageAction],
          false,
        )

        currentProcessTimer.current = setTimeout(() => {
          hideCustomNotification()
        }, 7000)
      }, 10000)
    } catch (error) {
      console.error("Error during save sequence (timeout related):", error)
      updateCustomNotification(
        "Error saving flux. Please try again.",
        [{ label: "Close", onClick: hideCustomNotification, variant: "ghost" }],
        false,
      )
    }
  }

  const handleGlobalBladeSave = (data: BladePanelData) => {
    console.log("Global save triggered with data:", data)
    closeBlade()
    runGlobalFluxSaveNotificationSequence(data)
  }

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-main-content-bg">
        <Loader2 className="h-12 w-12 animate-spin text-sky-600" />
        <p className="ml-4 text-lg text-gray-700">
          {isAuthEnabled ? "Provera autentifikacije..." : "Loading application..."}
        </p>
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${roboto.className}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main
          className={`flex-1 overflow-y-auto bg-main-content-bg relative ${
            pathname.startsWith("/flux-list/fetching-history") ||
            pathname.startsWith("/flux-list/processing-history")
              ? "pt-0 px-0"
              : "pt-3 px-4 sm:px-6 lg:px-8"
          }`}
        >
          {children}
        </main>
      </div>
      <BladePanel isOpen={isBladeOpen} onClose={closeBlade} onSave={handleGlobalBladeSave} initialData={bladeData} />
      <EditBladeManager />
      <ViewBladeManager />
      <MinimizedBladesContainer />
    </div>
  )
}

function AppLayoutLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-main-content-bg">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-10 w-10 animate-spin text-sky-600" />
        <span className="text-lg text-gray-700">Loading application...</span>
      </div>
    </div>
  )
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SearchProvider>
      <TestNotificationProvider>
        <Suspense fallback={<AppLayoutLoading />}>
          <BladeProvider>
            <ViewBladeProvider>
              <EditBladeProvider>
                <BladeStackProvider>
                  <AppLayoutContent>{children}</AppLayoutContent>
                </BladeStackProvider>
              </EditBladeProvider>
            </ViewBladeProvider>
          </BladeProvider>
        </Suspense>
      </TestNotificationProvider>
    </SearchProvider>
  )
}
