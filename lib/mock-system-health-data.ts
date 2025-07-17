import type { ServiceHealth, ComponentStatusValue } from "@/types/system-health"

const generateRandomHistory = (): ComponentStatusValue[] => {
  const history: ComponentStatusValue[] = []
  for (let i = 0; i < 10; i++) {
    // 10 recent points for history
    const rand = Math.random()
    if (rand < 0.05) {
      history.push("down")
    } else if (rand < 0.15) {
      history.push("degraded")
    } else {
      history.push("up")
    }
  }
  return history
}

export const mockSystemHealthData: ServiceHealth[] = [
  {
    type: "API",
    overallStatus: "up",
    overallUptime: "99.99% uptime",
    components: [
      { name: "Auth Service", status: "up", uptime: "99.99%", history: generateRandomHistory() },
      { name: "Data Service", status: "up", uptime: "99.98%", history: generateRandomHistory() },
      { name: "Notification Service", status: "up", uptime: "99.99%", history: generateRandomHistory() },
    ],
  },
  {
    type: "Database",
    overallStatus: "up",
    overallUptime: "99.95% uptime",
    components: [
      { name: "Primary DB", status: "up", uptime: "99.95%", history: generateRandomHistory() },
      { name: "Replica DB", status: "up", uptime: "99.96%", history: generateRandomHistory() },
    ],
  },
  {
    type: "Realtime",
    overallStatus: "degraded", // Example of degraded status
    overallUptime: "98.50% uptime",
    components: [
      { name: "WebSocket Server", status: "degraded", uptime: "98.50%", history: generateRandomHistory() },
      { name: "Event Bus", status: "up", uptime: "99.99%", history: generateRandomHistory() },
    ],
  },
  {
    type: "AI Agent",
    overallStatus: "up",
    overallUptime: "99.90% uptime",
    components: [
      { name: "Model Inference", status: "up", uptime: "99.90%", history: generateRandomHistory() },
      { name: "Training Pipeline", status: "up", uptime: "99.95%", history: generateRandomHistory() },
    ],
  },
]
