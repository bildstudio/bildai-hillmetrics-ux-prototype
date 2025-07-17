"use client"

import { useTestNotification, type NotificationAction } from "@/lib/test-notification-context"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react" // Uklonjena X ikonica jer je sada u CloseNotificationIcon
import { cn } from "@/lib/utils"
import { CloseNotificationIcon } from "@/components/icons/close-notification-icon" // Import nove komponente

export default function TestNotificationComponent() {
  const { notificationState, hideCustomNotification } = useTestNotification()

  if (!notificationState.isVisible) {
    return null
  }

  // Default close action sada koristi novu ikonicu
  const defaultCloseAction: NotificationAction = {
    label: "Close",
    onClick: hideCustomNotification,
    // Nema potrebe za variant i className ovde, jer CloseNotificationIcon ima svoje stilove
  }

  const hasExplicitClose = notificationState.actions.some((action) => action.label.toLowerCase() === "close")

  return (
    <div
      className="fixed bottom-4 left-4 !z-[999999] w-auto max-w-md rounded-md p-4 shadow-2xl
                 flex items-center gap-4 bg-[#202124] text-white"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex-grow">
        {typeof notificationState.message === "string" ? (
          <p className="text-sm font-medium">{notificationState.message}</p>
        ) : (
          notificationState.message
        )}
      </div>

      {(notificationState.isLoading || notificationState.actions.length > 0 || !hasExplicitClose) && (
        <div className="flex items-center gap-2 flex-shrink-0">
          {notificationState.isLoading && <Loader2 className="h-5 w-5 animate-spin text-white" />}
          <div className="flex flex-wrap gap-2">
            {notificationState.actions.map((action, index) =>
              // PROMENA: Ako je akcija "Close", koristi CloseNotificationIcon, inače Button
              action.label.toLowerCase() === "close" ? (
                <CloseNotificationIcon
                  key={index}
                  onClick={action.onClick}
                  aria-label="Close notification"
                  className={action.className} // Omogućava dodatne klase ako su definisane u akciji
                />
              ) : (
                <Button
                  key={index}
                  size="sm"
                  onClick={action.onClick}
                  className={cn(
                    "bg-transparent !text-[#5FB2C1]",
                    "hover:bg-[#FFFFFF] !hover:text-[#021417]",
                    action.className,
                  )}
                >
                  {action.label}
                </Button>
              ),
            )}
          </div>
          {!hasExplicitClose && (
            // PROMENA: Koristi CloseNotificationIcon za podrazumevano dugme za zatvaranje
            <CloseNotificationIcon
              onClick={defaultCloseAction.onClick}
              aria-label="Close notification"
              // Nema potrebe za dodatnim klasama ovde, jer komponenta ima svoje stilove
            />
          )}
        </div>
      )}
    </div>
  )
}
