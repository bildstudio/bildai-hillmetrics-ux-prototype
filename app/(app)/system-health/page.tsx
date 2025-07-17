"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ComponentStatusItem from "@/components/system-health/component-status-item"
import { mockSystemHealthData } from "@/lib/mock-system-health-data"
import type { ServiceHealth } from "@/types/system-health"
import Link from "next/link"

export default function SystemHealthPage() {
  const services = mockSystemHealthData

  const renderService = (service: ServiceHealth) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{service.type} Status</h3>
        <span className="text-sm text-gray-500">
          {service.overallStatus.toUpperCase()} • {service.overallUptime}
        </span>
      </div>
      <div className="space-y-2">
        {service.components.map((c) => (
          <ComponentStatusItem key={c.name} component={c} />
        ))}
      </div>
      <Link href="#" className="text-sm text-blue-600 hover:underline">
        See details and history
      </Link>
    </div>
  )

  const api = services.find((s) => s.type === "API")!
  const db = services.find((s) => s.type === "Database")!
  const realtime = services.find((s) => s.type === "Realtime")!
  const ai = services.find((s) => s.type === "AI Agent")!

  return (
    <div className="p-4 md:p-6">
      <Tabs defaultValue="api" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="api">API Status</TabsTrigger>
          <TabsTrigger value="db">Database Status</TabsTrigger>
          <TabsTrigger value="rt">Realtime Status</TabsTrigger>
          <TabsTrigger value="ai">AI Agent Status</TabsTrigger>
        </TabsList>
        <TabsContent value="api">{renderService(api)}</TabsContent>
        <TabsContent value="db">{renderService(db)}</TabsContent>
        <TabsContent value="rt">{renderService(realtime)}</TabsContent>
        <TabsContent value="ai">{renderService(ai)}</TabsContent>
      </Tabs>
    </div>
  )
}
