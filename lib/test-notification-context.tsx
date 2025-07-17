"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import TestNotificationComponent from "@/components/custom-toast/test-notification" // Renamed to avoid confusion

export interface NotificationAction {
  label: string
  onClick: () => void
  variant?: "default" | "outline" | "destructive" | "ghost" | "link"
  className?: string
}

export interface CustomNotificationState {
  isVisible: boolean
  message: ReactNode
  actions: NotificationAction[]
  isLoading: boolean
}

interface TestNotificationContextType {
  showCustomNotification: (message: ReactNode, actions?: NotificationAction[], isLoading?: boolean) => void
  updateCustomNotification: (message: ReactNode, actions?: NotificationAction[], isLoading?: boolean) => void
  hideCustomNotification: () => void
  notificationState: CustomNotificationState
}

const TestNotificationContext = createContext<TestNotificationContextType | undefined>(undefined)

export function TestNotificationProvider({ children }: { children: ReactNode }) {
  const [notificationState, setNotificationState] = useState<CustomNotificationState>({
    isVisible: false,
    message: "",
    actions: [],
    isLoading: false,
  })

  const showCustomNotification = useCallback(
    (message: ReactNode, actions: NotificationAction[] = [], isLoading = false) => {
      setNotificationState({ isVisible: true, message, actions, isLoading })
    },
    [],
  )

  const updateCustomNotification = useCallback(
    (message: ReactNode, actions: NotificationAction[] = [], isLoading = false) => {
      // Only update if already visible, otherwise it's like a show
      setNotificationState((prevState) => ({
        ...prevState,
        isVisible: true, // Ensure it's visible if called as an update
        message,
        actions,
        isLoading,
      }))
    },
    [],
  )

  const hideCustomNotification = useCallback(() => {
    setNotificationState({ isVisible: false, message: "", actions: [], isLoading: false })
  }, [])

  return (
    <TestNotificationContext.Provider
      value={{ showCustomNotification, updateCustomNotification, hideCustomNotification, notificationState }}
    >
      {children}
      <TestNotificationComponent />
    </TestNotificationContext.Provider>
  )
}

export function useTestNotification() {
  const context = useContext(TestNotificationContext)
  if (context === undefined) {
    throw new Error("useTestNotification must be used within a TestNotificationProvider")
  }
  return context
}
