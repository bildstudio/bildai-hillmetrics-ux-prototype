"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ChevronDown, Edit3, Trash2, Info, RefreshCw, Loader2 } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { dataStore } from "@/lib/data-store"
import { commonStatusMap } from "@/lib/status-config" // Import commonStatusMap

export default function DashboardPage() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState("Last month")
  const [visibleLines, setVisibleLines] = useState({
    active: true,
    successful: true,
    failed: true,
  })
  const [todoItems, setTodoItems] = useState([
    "Create flux for ------",
    "Check errors for ID 48",
    "Create mapping for document ------",
    "Create mapping for document ------",
  ])
  const [newTodoItem, setNewTodoItem] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDataLoaded, setIsDataLoaded] = useState(false)

  // Get data from centralized store
  const [stats, setStats] = useState(dataStore.getStats())
  const [currentChartData, setCurrentChartData] = useState(dataStore.getChartData(selectedPeriod))

  // Update chart data when period changes
  useEffect(() => {
    setCurrentChartData(dataStore.getChartData(selectedPeriod))
  }, [selectedPeriod])

  // Refresh data periodically or on mount
  useEffect(() => {
    const refreshStats = () => {
      const newStats = dataStore.getStats()
      console.log("Dashboard: Refreshed stats:", newStats)
      setStats(newStats)
    }

    refreshStats()

    // Optional: refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const checkDataLoad = async () => {
      console.log("Waiting for data to load...")
      await dataStore.waitForLoad()
      console.log("Data loaded, setting state...")
      setIsDataLoaded(true)
      const newStats = dataStore.getStats()
      const newChartData = dataStore.getChartData(selectedPeriod)
      console.log("Setting stats:", newStats)
      console.log("Setting chart data:", newChartData)
      setStats(newStats)
      setCurrentChartData(newChartData)
    }
    checkDataLoad()
  }, [selectedPeriod])

  const toggleLine = (lineKey: keyof typeof visibleLines) => {
    setVisibleLines((prev) => ({
      ...prev,
      [lineKey]: !prev[lineKey],
    }))
  }

  const handleStatClick = (filter: string) => {
    console.log("Dashboard: Navigating to financial-workflow with filter:", filter)
    router.push(`/financial-workflow?filter=${filter}`)
  }

  const statsCards = [
    {
      title: "Active fluxes",
      value: stats.activeFlux.toString(),
      description: "Total active workflow processes",
      statusKey: "active" as keyof typeof commonStatusMap, // Use statusKey for commonStatusMap
      onClick: () => handleStatClick("active"),
      clickable: true,
    },
    {
      title: "Successful",
      value: stats.completedFlux.toString(),
      description: "Successfully completed workflows",
      statusKey: "completed" as keyof typeof commonStatusMap, // Use statusKey
      onClick: () => handleStatClick("completed"),
      clickable: true,
    },
    {
      title: "Failed",
      value: stats.failedFlux.toString(),
      description: "Failed workflow executions",
      statusKey: "failed" as keyof typeof commonStatusMap, // Use statusKey
      onClick: () => handleStatClick("failed"),
      clickable: true,
    },
    {
      title: "Avg. Time (min)",
      value: stats.avgTime.toString(),
      description: "Average processing time",
      icon: "/icons/processings-today.svg", // Keep original icon for this one
      onClick: () => {},
      clickable: false,
    },
  ]

  const recentActivities = [
    {
      icon: "/icons/total-flux.svg",
      title: 'New flux "Pricing report" created',
      date: "Jun 16, 2024 at 18:07",
    },
    {
      icon: "/icons/fetchings-today.svg",
      title: 'Fetching resources from "Daily asset data"',
      date: "April 20, 2024 at 09:25",
    },
    {
      icon: "/icons/active-errors.svg",
      title: "Error processing flux, ID 87",
      date: "Nov 03, 2023 at 04:20",
    },
    {
      icon: "/icons/fetchings-today.svg",
      title: 'Fetching resources from "Daily asset data"',
      date: "April 20, 2024 at 09:25",
    },
  ]

  const systemHealth = [
    { name: "Database", status: "online" },
    { name: "API", status: "online" },
    { name: "Realtime", status: "online" },
    { name: "AI agent", status: "online" },
  ]

  const addTodoItem = () => {
    if (newTodoItem.trim()) {
      setTodoItems([...todoItems, newTodoItem.trim()])
      setNewTodoItem("")
      setIsDialogOpen(false)
    }
  }

  const removeTodoItem = (index: number) => {
    setTodoItems(todoItems.filter((_, i) => i !== index))
  }

  console.log("Dashboard render:", { stats, currentChartData, selectedPeriod })

  console.log("Dashboard render debug:", {
    isDataLoaded,
    stats,
    currentChartData,
    selectedPeriod,
    chartDataLength: currentChartData?.length,
    visibleLines,
  })

  if (!isDataLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin text-[#5499a2]" />
          <span className="text-lg text-[#505050]">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-5">
      {/* Removed breadcrumb and title */}

      {/* Removed Refresh Button section */}
      {/* <div className="flex items-center justify-end">
        <Button
          variant="outline"
          onClick={handleRefresh}
          className="text-[#5499a2] border-[#5499a2] hover:bg-[#5499a2]/10"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div> */}

      {/* Stats Cards and Chart - Now clickable */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Stats Cards - Now clickable */}
        <div className="lg:col-span-2">
          <div className="grid gap-4 grid-cols-2 h-full">
            {statsCards.map((stat) => {
              // @ts-ignore
              const statusConfig = stat.statusKey ? commonStatusMap[stat.statusKey] : null
              const IconComponent = statusConfig ? statusConfig.icon : null

              return (
                <Card
                  key={stat.title}
                  className={`transition-all duration-200 h-full ${
                    stat.clickable ? "cursor-pointer hover:shadow-md hover:bg-[#d9ecee]" : "cursor-default"
                  }`}
                  onClick={stat.clickable ? stat.onClick : undefined}
                >
                  <CardContent className="p-6 h-full flex items-center justify-center">
                    <div className="w-full">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex-shrink-0">
                          {IconComponent && statusConfig ? (
                            <IconComponent className={cn("h-8 w-8", statusConfig.colorClass)} />
                          ) : (
                            // @ts-ignore
                            <Image src={stat.icon || "/placeholder.svg"} alt={stat.title} width={34} height={34} />
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl font-bold text-[#040404]">{stat.value}</span>
                          <span className="text-base font-medium text-[#505050]">{stat.title}</span>
                        </div>
                      </div>
                      <div className="border-t border-[#e2e2e2] mb-3"></div>
                      <div>
                        <p className="text-sm text-[#9b9b9b] leading-relaxed">{stat.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Flux workflow Report */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-[#040404]">Flux workflow Report</CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-[#505050]">
                    {selectedPeriod}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {["Last week", "Last month", "Last three months", "Last year", "All time"].map((period) => (
                    <DropdownMenuItem
                      key={period}
                      onClick={() => setSelectedPeriod(period)}
                      className={selectedPeriod === period ? "bg-[#d9ecee]" : ""}
                    >
                      {period}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="flex space-x-2 mb-4">
                <Badge
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    visibleLines.active
                      ? "bg-[#fcbd12] text-[#040404] hover:bg-[#fcbd12]/80"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300",
                  )}
                  onClick={() => toggleLine("active")}
                >
                  Active: {stats.activeFlux}
                  <Info className="ml-1 h-3 w-3" />
                </Badge>
                <Badge
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    visibleLines.successful
                      ? "bg-[#5bc0de] text-white hover:bg-[#5bc0de]/80"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300",
                  )}
                  onClick={() => toggleLine("successful")}
                >
                  Successful: {stats.completedFlux}
                  <Info className="ml-1 h-3 w-3" />
                </Badge>
                <Badge
                  className={cn(
                    "cursor-pointer transition-all duration-200",
                    visibleLines.failed
                      ? "bg-[#d9534f] text-white hover:bg-[#d9534f]/80"
                      : "bg-gray-200 text-gray-500 hover:bg-gray-300",
                  )}
                  onClick={() => toggleLine("failed")}
                >
                  Failed: {stats.failedFlux}
                  <Info className="ml-1 h-3 w-3" />
                </Badge>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentChartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e2e2" />
                    <XAxis dataKey="date" stroke="#505050" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#505050" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e2e2e2",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    {visibleLines.active && (
                      <Line
                        type="monotone"
                        dataKey="active"
                        stroke="#fcbd12"
                        strokeWidth={3}
                        dot={{ fill: "#fcbd12", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#fcbd12" }}
                      />
                    )}
                    {visibleLines.successful && (
                      <Line
                        type="monotone"
                        dataKey="successful"
                        stroke="#5bc0de"
                        strokeWidth={3}
                        dot={{ fill: "#5bc0de", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#5bc0de" }}
                      />
                    )}
                    {visibleLines.failed && (
                      <Line
                        type="monotone"
                        dataKey="failed"
                        stroke="#d9534f"
                        strokeWidth={3}
                        dot={{ fill: "#d9534f", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#d9534f" }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent activities */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-[#040404]">Recent activities</CardTitle>
              <Button variant="ghost" size="icon">
                <RefreshCw className="h-4 w-4 text-[#505050]" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="rounded-lg p-2 bg-gray-50">
                      <Image src={activity.icon || "/placeholder.svg"} alt="Activity icon" width={16} height={16} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[#040404]">{activity.title}</p>
                    </div>
                    <div className="text-xs text-[#505050]">{activity.date}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* To do */}
        <div>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-xl font-semibold text-[#040404]">To do</CardTitle>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Edit3 className="h-4 w-4 text-[#5499a2]" />
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>To do list</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#505050]">List item label</label>
                    </div>
                    <div className="space-y-2">
                      {todoItems.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <span className="text-sm">{item}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTodoItem(index)}
                            className="h-6 w-6 text-[#e0173d] hover:text-[#e0173d]/80"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Input
                      placeholder="Enter list label"
                      value={newTodoItem}
                      onChange={(e) => setNewTodoItem(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addTodoItem()}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={addTodoItem} className="bg-[#5499a2] hover:bg-[#5499a2]/90">
                        Save
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {todoItems.map((item, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox id={`todo-${index}`} />
                    <label htmlFor={`todo-${index}`} className="text-sm text-[#505050] cursor-pointer">
                      {item}
                    </label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
