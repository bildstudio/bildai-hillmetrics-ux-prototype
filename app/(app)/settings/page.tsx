"use client"

import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Settings,
  User,
  Bell,
  Shield,
  Database,
  Workflow,
  Monitor,
  Palette,
  Clock,
  Filter,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Save,
  RotateCcw,
  ChevronDown
} from "lucide-react"

const TABS = [
  { id: "general", label: "General", icon: User },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "interface", label: "Interface", icon: Monitor },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data", icon: Database },
  { id: "performance", label: "Performance", icon: RefreshCw },
  { id: "security", label: "Security", icon: Shield },
  { id: "advanced", label: "Advanced", icon: Settings },
]

const ResponsiveTabs = ({
  activeTab,
  onTabChange,
}: {
  activeTab: string
  onTabChange: (tabId: string) => void
}) => {
  const [visibleTabs, setVisibleTabs] = useState(TABS)
  const [hiddenTabs, setHiddenTabs] = useState<typeof TABS>([])
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const tabsContainerRef = useRef<HTMLDivElement>(null)
  const measurementRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const calculateTabs = () => {
      const container = tabsContainerRef.current
      if (!container) return

      const containerWidth = container.offsetWidth
      const moreButtonWidth = 120
      let totalWidth = 0
      let visibleCount = 0

      for (let i = 0; i < TABS.length; i++) {
        const measurementEl = measurementRefs.current[i]
        if (!measurementEl) continue

        const tabWidth = measurementEl.offsetWidth + 8

        if (
          totalWidth + tabWidth >
          containerWidth - (hiddenTabs.length > 0 || i < TABS.length - 1 ? moreButtonWidth : 0)
        ) {
          break
        }

        totalWidth += tabWidth
        visibleCount++
      }

      if (visibleCount === 0) visibleCount = 1

      const newVisibleTabs = TABS.slice(0, visibleCount)
      const newHiddenTabs = TABS.slice(visibleCount)

      setVisibleTabs(newVisibleTabs)
      setHiddenTabs(newHiddenTabs)
    }

    const timeoutId = setTimeout(calculateTabs, 100)

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(calculateTabs, 100)
    })

    if (tabsContainerRef.current) {
      resizeObserver.observe(tabsContainerRef.current)
    }

    return () => {
      clearTimeout(timeoutId)
      resizeObserver.disconnect()
    }
  }, [])

  const handleDropdownSelect = (tabId: string) => {
    onTabChange(tabId)
    setIsMoreOpen(false)
  }

  return (
    <>
      <TabsList
        ref={tabsContainerRef}
        className="relative flex items-center justify-start bg-transparent p-0 h-auto w-full overflow-hidden"
      >
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.id}
            value={tab.id}
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary bg-transparent text-gray-600 data-[state=active]:text-gray-900 font-medium py-3 px-4 transition-colors duration-200 hover:text-gray-900 hover:border-gray-400 whitespace-nowrap flex-shrink-0"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </TabsTrigger>
        ))}
        {hiddenTabs.length > 0 && (
          <DropdownMenu 
            open={isMoreOpen} 
            onOpenChange={setIsMoreOpen}
            modal={false}
          >
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="flex items-center gap-1 ml-auto px-4 flex-shrink-0"
                onClick={(e) => e.stopPropagation()}
              >
                More ({hiddenTabs.length}) <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              forceMount 
              className="z-[10050]" 
              style={{ zIndex: 10050 }}
              onCloseAutoFocus={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {hiddenTabs.map((tab) => (
                <DropdownMenuItem key={tab.id} onSelect={() => handleDropdownSelect(tab.id)}>
                  <tab.icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </TabsList>
      <div className="absolute top-0 left-0 opacity-0 pointer-events-none -z-10">
        <div className="flex">
          {TABS.map((tab, index) => (
            <button
              key={tab.id}
              ref={(el) => {
                measurementRefs.current[index] = el
              }}
              className="flex items-center gap-2 whitespace-nowrap px-4 py-3 font-medium"
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

export default function SettingsPage() {
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [activeTab, setActiveTab] = useState("general")

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">Configure your workflow execution and data processing preferences</p>
          {unsavedChanges && (
            <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-md">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">You have unsaved changes</span>
              </div>
              <div className="w-full sm:w-auto sm:ml-auto flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setUnsavedChanges(false)} className="flex-1 sm:flex-initial">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  Discard
                </Button>
                <Button size="sm" onClick={() => setUnsavedChanges(false)} className="flex-1 sm:flex-initial">
                  <Save className="h-3 w-3 mr-1" />
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="border-b">
            <ResponsiveTabs activeTab={activeTab} onTabChange={setActiveTab} />
          </div>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Preferences</CardTitle>
                <CardDescription>Configure your personal settings and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input id="displayName" placeholder="Enter your display name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="cet">Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="sr">Serbian</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Settings */}
          <TabsContent value="workflow" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Execution</CardTitle>
                <CardDescription>Configure default settings for workflow processing</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="defaultTimeout">Default Timeout (minutes)</Label>
                    <Input id="defaultTimeout" type="number" placeholder="30" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxRetries">Max Retry Attempts</Label>
                    <Input id="maxRetries" type="number" placeholder="3" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Concurrent Processing Limit</Label>
                  <Slider defaultValue={[5]} max={20} min={1} step={1} className="mt-2" />
                  <div className="text-sm text-gray-500">Current: 5 workflows</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-restart Failed Workflows</Label>
                    <div className="text-sm text-gray-500">Automatically retry failed workflows</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Workflow Optimization</Label>
                    <div className="text-sm text-gray-500">Use AI-powered optimization suggestions</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stage Configuration</CardTitle>
                <CardDescription>Default priority and resource allocation for processing stages</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {['Fetching', 'Processing', 'Normalization', 'Refinement', 'Calculation'].map((stage) => (
                    <div key={stage} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{stage}</Badge>
                        <span className="text-sm">{stage} Stage</span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Select defaultValue="medium">
                          <SelectTrigger className="w-24 sm:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low Priority</SelectItem>
                            <SelectItem value="medium">Medium Priority</SelectItem>
                            <SelectItem value="high">High Priority</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Interface Settings */}
          <TabsContent value="interface" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle><Palette className="h-5 w-5 inline mr-2" />Theme & Appearance</CardTitle>
                <CardDescription>Customize the look and feel of your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select defaultValue="light">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="auto">Auto (System)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <div className="flex gap-2">
                    {['blue', 'green', 'purple', 'orange', 'red'].map((color) => (
                      <div key={color} className={`w-8 h-8 rounded-full bg-${color}-500 cursor-pointer border-2 border-transparent hover:border-gray-300`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>UI Density</Label>
                  <Select defaultValue="comfortable">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">Compact</SelectItem>
                      <SelectItem value="comfortable">Comfortable</SelectItem>
                      <SelectItem value="spacious">Spacious</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Blade & Navigation</CardTitle>
                <CardDescription>Configure blade behavior and navigation preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Blade Width</Label>
                  <Select defaultValue="medium">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="narrow">Narrow (400px)</SelectItem>
                      <SelectItem value="medium">Medium (600px)</SelectItem>
                      <SelectItem value="wide">Wide (800px)</SelectItem>
                      <SelectItem value="full">Full Width</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Max Stacked Blades</Label>
                  <Slider defaultValue={[5]} max={10} min={2} step={1} />
                  <div className="text-sm text-gray-500">Current: 5 blades</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-minimize Inactive Blades</Label>
                    <div className="text-sm text-gray-500">Minimize blades after 5 minutes of inactivity</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Remember Blade Positions</Label>
                    <div className="text-sm text-gray-500">Restore blade positions on page reload</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><Filter className="h-5 w-5 inline mr-2" />Grid & Filtering</CardTitle>
                <CardDescription>Default settings for data grids and filters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Page Size</Label>
                    <Select defaultValue="50">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="25">25 items</SelectItem>
                        <SelectItem value="50">50 items</SelectItem>
                        <SelectItem value="100">100 items</SelectItem>
                        <SelectItem value="200">200 items</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Default Date Range</Label>
                    <Select defaultValue="7d">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1d">Last 24 hours</SelectItem>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-refresh Data</Label>
                    <div className="text-sm text-gray-500">Automatically refresh grid data every 30 seconds</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Persist Filter State</Label>
                    <div className="text-sm text-gray-500">Remember applied filters between sessions</div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Notifications</CardTitle>
                <CardDescription>Configure when and how you receive workflow status updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { event: 'Workflow Started', desc: 'When a new workflow begins execution' },
                    { event: 'Workflow Completed', desc: 'When a workflow finishes successfully' },
                    { event: 'Workflow Failed', desc: 'When a workflow encounters an error' },
                    { event: 'Stage Completed', desc: 'When individual stages complete' },
                    { event: 'Long Running Process', desc: 'When workflows exceed expected duration' },
                    { event: 'Resource Limits', desc: 'When system resources are approaching limits' }
                  ].map((item) => (
                    <div key={item.event} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.event}</div>
                        <div className="text-sm text-gray-500">{item.desc}</div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4">
                        <Select defaultValue="email">
                          <SelectTrigger className="w-24 sm:w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="toast">Toast Only</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="both">Toast & Email</SelectItem>
                          </SelectContent>
                        </Select>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>General notification settings and delivery options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quiet Hours</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm text-gray-500">Start Time</Label>
                      <Input type="time" defaultValue="22:00" />
                    </div>
                    <div>
                      <Label className="text-sm text-gray-500">End Time</Label>
                      <Input type="time" defaultValue="08:00" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notification Sound</Label>
                  <Select defaultValue="default">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Sound</SelectItem>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="chime">Chime</SelectItem>
                      <SelectItem value="bell">Bell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Retention</CardTitle>
                <CardDescription>Configure how long different types of data are kept</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {[
                    { type: 'Workflow Execution Logs', current: '90 days' },
                    { type: 'Performance Metrics', current: '30 days' },
                    { type: 'Error Logs', current: '180 days' },
                    { type: 'User Activity Logs', current: '60 days' },
                    { type: 'File Processing History', current: '365 days' }
                  ].map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{item.type}</div>
                        <div className="text-sm text-gray-500">Currently: {item.current}</div>
                      </div>
                      <Select defaultValue={item.current.split(' ')[0]}>
                        <SelectTrigger className="w-24 sm:w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="7">7 days</SelectItem>
                          <SelectItem value="30">30 days</SelectItem>
                          <SelectItem value="90">90 days</SelectItem>
                          <SelectItem value="180">180 days</SelectItem>
                          <SelectItem value="365">1 year</SelectItem>
                          <SelectItem value="forever">Forever</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Export & Backup</CardTitle>
                <CardDescription>Manage data exports and automated backups</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Daily Backups</Label>
                    <div className="text-sm text-gray-500">Create daily backups of critical data</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Export Format</Label>
                  <Select defaultValue="json">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="xlsx">Excel</SelectItem>
                      <SelectItem value="xml">XML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export All Data
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance */}
          <TabsContent value="performance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
                <CardDescription>Monitor and configure system performance settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">94%</div>
                    <div className="text-sm text-gray-500">CPU Usage</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">12.4GB</div>
                    <div className="text-sm text-gray-500">Memory Usage</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">847ms</div>
                    <div className="text-sm text-gray-500">Avg Response</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Memory Allocation for Processing</Label>
                  <Slider defaultValue={[70]} max={90} min={50} step={5} />
                  <div className="text-sm text-gray-500">Current: 70% (recommended: 60-80%)</div>
                </div>
                <div className="space-y-2">
                  <Label>Cache Size Limit</Label>
                  <Select defaultValue="2gb">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="512mb">512 MB</SelectItem>
                      <SelectItem value="1gb">1 GB</SelectItem>
                      <SelectItem value="2gb">2 GB</SelectItem>
                      <SelectItem value="4gb">4 GB</SelectItem>
                      <SelectItem value="8gb">8 GB</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Optimization Settings</CardTitle>
                <CardDescription>Advanced performance tuning options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Query Optimization</Label>
                    <div className="text-sm text-gray-500">Use advanced database query optimization</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Preload Common Data</Label>
                    <div className="text-sm text-gray-500">Cache frequently accessed data</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Lazy Load Large Datasets</Label>
                    <div className="text-sm text-gray-500">Load data progressively to improve response times</div>
                  </div>
                  <Switch />
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Clear All Caches
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication & Access</CardTitle>
                <CardDescription>Manage authentication settings and access controls</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Select defaultValue="8h">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 hour</SelectItem>
                      <SelectItem value="4h">4 hours</SelectItem>
                      <SelectItem value="8h">8 hours</SelectItem>
                      <SelectItem value="24h">24 hours</SelectItem>
                      <SelectItem value="never">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Password Change</Label>
                    <div className="text-sm text-gray-500">Require password updates every 90 days</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit & Logging</CardTitle>
                <CardDescription>Configure security logging and audit trails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Log All User Actions</Label>
                    <div className="text-sm text-gray-500">Track all user interactions for audit purposes</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Failed Login Notifications</Label>
                    <div className="text-sm text-gray-500">Send alerts for failed login attempts</div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="space-y-2">
                  <Label>Log Retention Period</Label>
                  <Select defaultValue="1y">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3m">3 months</SelectItem>
                      <SelectItem value="6m">6 months</SelectItem>
                      <SelectItem value="1y">1 year</SelectItem>
                      <SelectItem value="2y">2 years</SelectItem>
                      <SelectItem value="5y">5 years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API & Integration</CardTitle>
                <CardDescription>Configure API settings and external integrations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <div className="flex gap-2">
                    <Input id="apiKey" type="password" value="sk-1234567890abcdef..." readOnly />
                    <Button variant="outline">Regenerate</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Rate Limiting</Label>
                  <Select defaultValue="1000">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 requests/hour</SelectItem>
                      <SelectItem value="500">500 requests/hour</SelectItem>
                      <SelectItem value="1000">1000 requests/hour</SelectItem>
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Webhooks</Label>
                    <div className="text-sm text-gray-500">Send HTTP callbacks for workflow events</div>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Debug & Development</CardTitle>
                <CardDescription>Development and debugging tools</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Debug Mode</Label>
                    <div className="text-sm text-gray-500">Show detailed error messages and performance metrics</div>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Verbose Logging</Label>
                    <div className="text-sm text-gray-500">Include detailed logs for troubleshooting</div>
                  </div>
                  <Switch />
                </div>
                <div className="space-y-2">
                  <Label>Log Level</Label>
                  <Select defaultValue="info">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="error">Error Only</SelectItem>
                      <SelectItem value="warn">Warning & Error</SelectItem>
                      <SelectItem value="info">Info, Warning & Error</SelectItem>
                      <SelectItem value="debug">All (Debug Mode)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions that affect your entire account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-800">Reset All Settings</div>
                    <div className="text-sm text-red-600">Restore all settings to default values</div>
                  </div>
                  <Button variant="destructive" size="sm">Reset</Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50">
                  <div>
                    <div className="font-medium text-red-800">Clear All Data</div>
                    <div className="text-sm text-red-600">Permanently delete all workflow data and history</div>
                  </div>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
