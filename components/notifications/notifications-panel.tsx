"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useBladeStack } from "@/lib/blade-stack-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Inbox } from "lucide-react"
import { isToday, isWithinInterval, subHours, startOfToday, parseISO } from "date-fns"
import { ActivityNotificationItem, ActivityNotification } from "./activity-notification-item"

interface NotificationsPanelProps {
  onClose: () => void
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const router = useRouter()
  const { openBlade, closeTopBlade } = useBladeStack()
  const [allNotifications, setAllNotifications] = useState<ActivityNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")

  useEffect(() => {
    async function fetchNotifications() {
      setIsLoading(true)
      try {
        const res = await fetch(
          "/api/activities?fluxId=all&page=1&pageSize=10",
          { cache: "no-store" },
        )
        const data = await res.json()
        const sorted = data.activities.sort(
          (a: any, b: any) =>
            parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime(),
        )
        const mapped: ActivityNotification[] = sorted.map((a, idx) => ({ ...a, isRead: idx >= 5 }))
        setAllNotifications(mapped)
      } catch (error) {
        console.error("Error fetching notifications:", error)
        // Potentially set some error state here
      } finally {
        setIsLoading(false)
      }
    }
    fetchNotifications()
  }, [])

  const handleMarkAsRead = (id: string) => {
    setAllNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
  }

  const handleMarkAllAsRead = () => {
    setAllNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
  }

  const handleTurnOffNotifications = (category: ActivityNotification["type"]) => {
    console.log(`Turn off notifications for category: ${category}`)
  }

  const handleNavigateToFetchedContents = (fetchingID: number) => {
    router.push(`/flux-list/processing-history/fetched-content?fetchingId=${fetchingID}`)
  }

  const handleNavigateToFetchedContentsFromProcessing = (processingID: number) => {
    router.push(`/flux-list/processing-history/fetched-content?processingId=${processingID}`)
  }

  const handleViewProcessingDetails = (id: number) => {
    openBlade(
      () => import("@/components/processing-history/processing-history-details-blade"),
      { processingId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
      `Flux ${id}`,
    )
  }

  const handleViewFetchingDetails = (id: number) => {
    openBlade(
      () => import("@/components/fetching-history/fetching-history-details-blade"),
      { fetchingId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
      `Flux ${id}`,
    )
  }

  const handleViewNormalizationDetails = (id: number) => {
    openBlade(
      () => import("@/components/normalization-history/NormalizationDetailsBlade"),
      { normalizationId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
      `Flux ${id}`,
    )
  }

  const handleViewRefinementDetails = (id: number) => {
    openBlade(
      () => import("@/components/refinement-history/RefinementDetailsBlade"),
      { refinementId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
      `Flux ${id}`,
    )
  }

  const handleViewCalculationDetails = (id: number) => {
    openBlade(
      () => import("@/components/calculation-history/CalculationDetailsBlade"),
      { calculationId: id, fluxName: `Flux ${id}`, fluxId: "all", onClose: closeTopBlade },
      `Flux ${id}`,
    )
  }

  const handleViewWorkflowDetails = async (workflowId: number) => {
    const res = await fetch(
      `/api/workflow-execution-log/item?id=${workflowId}`,
      { cache: "no-store" },
    )
    const { data } = await res.json()
    if (!data) return
    openBlade(
      () => import("@/components/workflow-execution-log/workflow-item-details-blade"),
      {
        item: data,
        onClose: closeTopBlade,
        onViewFetching: handleViewFetchingDetails,
        onViewProcessing: handleViewProcessingDetails,
        onViewNormalization: handleViewNormalizationDetails,
        onViewRefinement: handleViewRefinementDetails,
        onViewCalculation: handleViewCalculationDetails,
        onContentClick: (id: number) => {
          router.push(`/flux-list/processing-history/fetched-content?fetchingId=${id}`)
        },
      },
      data.flux_name || `Flux ${data.flux_id}`,
    )
  }


  const displayedNotifications = useMemo(() => {
    return activeTab === "unread" ? allNotifications.filter((n) => !n.isRead) : allNotifications
  }, [activeTab, allNotifications])

  const groupedNotifications = useMemo(() => {
    const now = new Date()
    const oneHourAgo = subHours(now, 1)
    const todayStart = startOfToday()

    const groups: { new: ActivityNotification[]; today: ActivityNotification[]; earlier: ActivityNotification[] } = {
      new: [],
      today: [],
      earlier: [],
    }

    displayedNotifications.forEach((n) => {
      const notificationDate = parseISO(n.timestamp)
      if (!n.isRead && isWithinInterval(notificationDate, { start: oneHourAgo, end: now })) {
        groups.new.push(n)
      } else if (isToday(notificationDate)) {
        groups.today.push(n)
      } else {
        groups.earlier.push(n)
      }
    })
    return groups
  }, [displayedNotifications])

  const unreadCount = useMemo(() => allNotifications.filter((n) => !n.isRead).length, [allNotifications])

  if (isLoading) {
    return (
      <div className="w-[475px] flex flex-col flex-1 overflow-hidden" style={{ color: "#040404" }}>
        <div className="flex items-center justify-between p-4 border-b border-[#e2e2e2] flex-shrink-0">
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="flex-1 overflow-y-auto gmail-scrollbar">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="p-3 border-b border-gray-200 space-y-2 last:border-b-0">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
        <div className="p-3 border-t border-[#e2e2e2] text-center flex-shrink-0" />
      </div>
    )
  }

  const renderNotificationGroup = (
    title: string,
    notifications: ActivityNotification[],
    groupKey: "new" | "today" | "earlier",
  ) => {
    if (notifications.length === 0) return null
    return (
      <div key={title}>
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="text-xs font-semibold uppercase text-[#9b9b9b]">{title}</h3>
          {groupKey === "new" && notifications.length > 0 && (
            <Button
              variant="link"
              size="sm"
              className="text-xs text-[#5499a2] hover:text-[#41a1ac] p-0 h-auto"
              onClick={() => {
                console.log("See all new notifications clicked")
                // Potentially navigate or filter: onClose(); router.push('/notifications?filter=new');
              }}
            >
              See all
            </Button>
          )}
        </div>
        {notifications.map((notification) => (
          <ActivityNotificationItem
            key={notification.id}
            item={notification}
            onMarkAsRead={handleMarkAsRead}
            onTurnOffNotifications={handleTurnOffNotifications}
            onNavigateToFetchedContents={handleNavigateToFetchedContents}
            onNavigateToFetchedContentsFromProcessing={handleNavigateToFetchedContentsFromProcessing}
            onViewFetchingDetails={handleViewFetchingDetails}
            onViewProcessingDetails={handleViewProcessingDetails}
            onViewWorkflowDetails={handleViewWorkflowDetails}
            onViewNormalizationDetails={handleViewNormalizationDetails}
            onViewRefinementDetails={handleViewRefinementDetails}
            onViewCalculationDetails={handleViewCalculationDetails}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="w-[475px] flex flex-col flex-1 overflow-hidden" style={{ color: "#040404" }}>
      {" "}
      {/* Added flex-1 and overflow-hidden */}
      <div className="flex items-center justify-between p-4 border-b border-[#e2e2e2] flex-shrink-0">
        {" "}
        {/* Added flex-shrink-0 */}
        <h2 className="text-lg font-semibold">Notifications</h2>
        {unreadCount > 0 && (
          <Button
            variant="link"
            size="sm"
            className="text-[#5499a2] hover:text-[#41a1ac]"
            onClick={handleMarkAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "all" | "unread")}
        className="flex-grow flex flex-col overflow-hidden" // Added overflow-hidden
      >
        <TabsList className="grid w-full grid-cols-2 bg-[#d9ecee]/30 mx-3 mt-2 mb-1 p-1 h-auto rounded-md flex-shrink-0">
          {" "}
          {/* Added flex-shrink-0 */}
          <TabsTrigger
            value="all"
            className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#040404] data-[state=active]:shadow-sm"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            value="unread"
            className="text-sm data-[state=active]:bg-white data-[state=active]:text-[#040404] data-[state=active]:shadow-sm"
          >
            Unread{" "}
            {unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-[#d5540e] text-xs font-medium text-white">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
        <ScrollArea className="flex-1 overflow-y-auto gmail-scrollbar">
          {" "}
          {/* Removed style, changed to flex-1 */}
          <TabsContent value="all" className="mt-0 h-full">
            {displayedNotifications.length === 0 && !isLoading ? (
              <div className="text-center py-10 text-[#505050]">
                <Inbox className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2 text-sm">No notifications yet.</p>
              </div>
            ) : (
              <>
                {renderNotificationGroup("New", groupedNotifications.new, "new")}
                {renderNotificationGroup("Today", groupedNotifications.today, "today")}
                {renderNotificationGroup("Earlier", groupedNotifications.earlier, "earlier")}
              </>
            )}
          </TabsContent>
          <TabsContent value="unread" className="mt-0 h-full">
            {displayedNotifications.length === 0 && !isLoading ? (
              <div className="text-center py-10 text-[#505050]">
                <Inbox className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2 text-sm">No unread notifications.</p>
              </div>
            ) : (
              <>
                {renderNotificationGroup("New", groupedNotifications.new, "new")}
                {renderNotificationGroup("Today", groupedNotifications.today, "today")}
                {renderNotificationGroup("Earlier", groupedNotifications.earlier, "earlier")}
              </>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
      <div className="p-3 border-t border-[#e2e2e2] text-center flex-shrink-0">
        <Button
          variant="link"
          className="text-sm text-[#5499a2] hover:text-[#41a1ac]"
          onClick={() => {
            onClose();
            router.push("/recent-activity");
          }}
        >
          View all notifications
        </Button>
      </div>
    </div>
  )
}
