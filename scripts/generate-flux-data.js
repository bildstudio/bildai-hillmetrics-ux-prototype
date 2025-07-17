import fs from "fs"
import path from "path"

// Postojeći podaci (30 unosa)
const existingData = [
  {
    id: 1,
    name: "Financial Report Generation 1",
    stage: "Processing in progress",
    progress: 75,
    startTime: "Dec 15, 2024 at 14:30",
    duration: 25,
    status: "active",
    category: "financial",
    createdAt: "2024-12-15T14:30:00Z",
  },
  {
    id: 2,
    name: "Market Data Sync 1",
    stage: "Completed",
    progress: 100,
    startTime: "Dec 14, 2024 at 09:15",
    duration: 12,
    status: "completed",
    category: "market",
    createdAt: "2024-12-14T09:15:00Z",
  },
  {
    id: 3,
    name: "Risk Assessment Pipeline 1",
    stage: "Failed",
    progress: 35,
    startTime: "Dec 13, 2024 at 16:45",
    duration: 8,
    status: "failed",
    category: "compliance",
    createdAt: "2024-12-13T16:45:00Z",
  },
  {
    id: 4,
    name: "Compliance Check Process 1",
    stage: "Fetching in progress",
    progress: 60,
    startTime: "Dec 15, 2024 at 11:20",
    duration: 18,
    status: "active",
    category: "compliance",
    createdAt: "2024-12-15T11:20:00Z",
  },
  {
    id: 5,
    name: "Audit Trail Creation 1",
    stage: "Success",
    progress: 100,
    startTime: "Dec 12, 2024 at 08:30",
    duration: 45,
    status: "completed",
    category: "reporting",
    createdAt: "2024-12-12T08:30:00Z",
  },
  {
    id: 6,
    name: "Data Pipeline Alpha 1",
    stage: "Error",
    progress: 20,
    startTime: "Dec 14, 2024 at 13:10",
    duration: 5,
    status: "failed",
    category: "analytics",
    createdAt: "2024-12-14T13:10:00Z",
  },
  {
    id: 7,
    name: "ETL Process Beta 1",
    stage: "Validating in progress",
    progress: 85,
    startTime: "Dec 15, 2024 at 10:45",
    duration: 32,
    status: "active",
    category: "financial",
    createdAt: "2024-12-15T10:45:00Z",
  },
  {
    id: 8,
    name: "Workflow Gamma 1",
    stage: "Finished",
    progress: 100,
    startTime: "Dec 11, 2024 at 15:20",
    duration: 28,
    status: "completed",
    category: "market",
    createdAt: "2024-12-11T15:20:00Z",
  },
  {
    id: 9,
    name: "Batch Job Delta 1",
    stage: "Timeout",
    progress: 45,
    startTime: "Dec 13, 2024 at 12:30",
    duration: 15,
    status: "failed",
    category: "compliance",
    createdAt: "2024-12-13T12:30:00Z",
  },
  {
    id: 10,
    name: "Stream Process Epsilon 1",
    stage: "Analyzing in progress",
    progress: 40,
    startTime: "Dec 15, 2024 at 13:15",
    duration: 22,
    status: "active",
    category: "reporting",
    createdAt: "2024-12-15T13:15:00Z",
  },
  {
    id: 11,
    name: "Real-time Sync Zeta 1",
    stage: "Done",
    progress: 100,
    startTime: "Dec 10, 2024 at 07:45",
    duration: 38,
    status: "completed",
    category: "analytics",
    createdAt: "2024-12-10T07:45:00Z",
  },
  {
    id: 12,
    name: "Analytics Engine Eta 1",
    stage: "Cancelled",
    progress: 25,
    startTime: "Dec 14, 2024 at 14:20",
    duration: 7,
    status: "failed",
    category: "financial",
    createdAt: "2024-12-14T14:20:00Z",
  },
  {
    id: 13,
    name: "Reporting Service Theta 1",
    stage: "Pending in progress",
    progress: 15,
    startTime: "Dec 15, 2024 at 15:30",
    duration: 10,
    status: "active",
    category: "market",
    createdAt: "2024-12-15T15:30:00Z",
  },
  {
    id: 14,
    name: "Validation Process Iota 1",
    stage: "Completed",
    progress: 100,
    startTime: "Dec 09, 2024 at 11:10",
    duration: 55,
    status: "completed",
    category: "compliance",
    createdAt: "2024-12-09T11:10:00Z",
  },
  {
    id: 15,
    name: "Transform Service Kappa 1",
    stage: "Failed",
    progress: 30,
    startTime: "Dec 13, 2024 at 09:40",
    duration: 12,
    status: "failed",
    category: "reporting",
    createdAt: "2024-12-13T09:40:00Z",
  },
  {
    id: 16,
    name: "Load Balancer Lambda 1",
    stage: "Processing in progress",
    progress: 70,
    startTime: "Dec 15, 2024 at 12:00",
    duration: 35,
    status: "active",
    category: "analytics",
    createdAt: "2024-12-15T12:00:00Z",
  },
  {
    id: 17,
    name: "Cache Manager Mu 1",
    stage: "Success",
    progress: 100,
    startTime: "Dec 08, 2024 at 16:25",
    duration: 42,
    status: "completed",
    category: "financial",
    createdAt: "2024-12-08T16:25:00Z",
  },
  {
    id: 18,
    name: "Queue Processor Nu 1",
    stage: "Rejected",
    progress: 10,
    startTime: "Dec 14, 2024 at 10:15",
    duration: 3,
    status: "failed",
    category: "market",
    createdAt: "2024-12-14T10:15:00Z",
  },
  {
    id: 19,
    name: "Event Handler Xi 1",
    stage: "Fetching in progress",
    progress: 55,
    startTime: "Dec 15, 2024 at 14:45",
    duration: 28,
    status: "active",
    category: "compliance",
    createdAt: "2024-12-15T14:45:00Z",
  },
  {
    id: 20,
    name: "Message Broker Omicron 1",
    stage: "Finished",
    progress: 100,
    startTime: "Dec 07, 2024 at 13:30",
    duration: 48,
    status: "completed",
    category: "reporting",
    createdAt: "2024-12-07T13:30:00Z",
  },
  {
    id: 21,
    name: "Financial Report Generation 2",
    stage: "Validating in progress",
    progress: 80,
    startTime: "Dec 15, 2024 at 09:20",
    duration: 40,
    status: "active",
    category: "financial",
    createdAt: "2024-12-15T09:20:00Z",
  },
  {
    id: 22,
    name: "Market Data Sync 2",
    stage: "Done",
    progress: 100,
    startTime: "Dec 06, 2024 at 14:15",
    duration: 33,
    status: "completed",
    category: "market",
    createdAt: "2024-12-06T14:15:00Z",
  },
  {
    id: 23,
    name: "Risk Assessment Pipeline 2",
    stage: "Error",
    progress: 40,
    startTime: "Dec 13, 2024 at 11:50",
    duration: 18,
    status: "failed",
    category: "compliance",
    createdAt: "2024-12-13T11:50:00Z",
  },
  {
    id: 24,
    name: "Compliance Check Process 2",
    stage: "Analyzing in progress",
    progress: 65,
    startTime: "Dec 15, 2024 at 08:30",
    duration: 45,
    status: "active",
    category: "compliance",
    createdAt: "2024-12-15T08:30:00Z",
  },
  {
    id: 25,
    name: "Audit Trail Creation 2",
    stage: "Completed",
    progress: 100,
    startTime: "Dec 05, 2024 at 12:45",
    duration: 52,
    status: "completed",
    category: "reporting",
    createdAt: "2024-12-05T12:45:00Z",
  },
  {
    id: 26,
    name: "Data Pipeline Alpha 2",
    stage: "Timeout",
    progress: 15,
    startTime: "Dec 14, 2024 at 15:10",
    duration: 8,
    status: "failed",
    category: "analytics",
    createdAt: "2024-12-14T15:10:00Z",
  },
  {
    id: 27,
    name: "ETL Process Beta 2",
    stage: "Pending in progress",
    progress: 25,
    startTime: "Dec 15, 2024 at 16:00",
    duration: 15,
    status: "active",
    category: "financial",
    createdAt: "2024-12-15T16:00:00Z",
  },
  {
    id: 28,
    name: "Workflow Gamma 2",
    stage: "Success",
    progress: 100,
    startTime: "Dec 04, 2024 at 10:20",
    duration: 38,
    status: "completed",
    category: "market",
    createdAt: "2024-12-04T10:20:00Z",
  },
  {
    id: 29,
    name: "Batch Job Delta 2",
    stage: "Failed",
    progress: 50,
    startTime: "Dec 12, 2024 at 13:15",
    duration: 22,
    status: "failed",
    category: "compliance",
    createdAt: "2024-12-12T13:15:00Z",
  },
  {
    id: 30,
    name: "Stream Process Epsilon 2",
    stage: "Processing in progress",
    progress: 90,
    startTime: "Dec 15, 2024 at 07:45",
    duration: 58,
    status: "active",
    category: "reporting",
    createdAt: "2024-12-15T07:45:00Z",
  },
]

// Definišemo kategorije, statuse i stage-ove
const categories = ["financial", "market", "compliance", "reporting", "analytics"]
const statuses = ["active", "completed", "failed"]

// Stage-ovi po statusu
const stagesByStatus = {
  active: [
    "Processing in progress",
    "Fetching in progress",
    "Validating in progress",
    "Analyzing in progress",
    "Pending in progress",
  ],
  completed: ["Completed", "Success", "Finished", "Done"],
  failed: ["Failed", "Error", "Timeout", "Cancelled", "Rejected"],
}

// Imena procesa po kategorijama
const processNames = {
  financial: [
    "Financial Report Generation",
    "Budget Analysis Process",
    "Revenue Calculation Engine",
    "Cost Allocation System",
    "Profit Margin Calculator",
    "Tax Computation Service",
    "Invoice Processing Pipeline",
    "Payment Reconciliation",
    "Financial Audit Trail",
    "Expense Tracking System",
    "Cash Flow Analysis",
    "Investment Portfolio Review",
    "Credit Risk Assessment",
    "Loan Processing Workflow",
    "Asset Valuation Engine",
  ],
  market: [
    "Market Data Sync",
    "Price Discovery Engine",
    "Trading Volume Analysis",
    "Market Sentiment Tracker",
    "Currency Exchange Monitor",
    "Stock Price Updater",
    "Commodity Price Feed",
    "Market Volatility Calculator",
    "Trading Signal Generator",
    "Market Trend Analyzer",
    "Economic Indicator Tracker",
    "Sector Performance Monitor",
    "Index Calculation Service",
    "Market News Aggregator",
    "Trading Session Manager",
  ],
  compliance: [
    "Risk Assessment Pipeline",
    "Compliance Check Process",
    "Regulatory Reporting System",
    "AML Screening Service",
    "KYC Verification Process",
    "Fraud Detection Engine",
    "Audit Compliance Monitor",
    "Policy Enforcement System",
    "Regulatory Filing Process",
    "Compliance Training Tracker",
    "Risk Monitoring Service",
    "Violation Detection System",
    "Compliance Score Calculator",
    "Regulatory Update Monitor",
    "Ethics Compliance Checker",
  ],
  reporting: [
    "Audit Trail Creation",
    "Performance Report Generator",
    "Dashboard Data Aggregator",
    "Monthly Report Compiler",
    "Executive Summary Builder",
    "KPI Calculation Engine",
    "Metrics Collection Service",
    "Report Distribution System",
    "Data Visualization Pipeline",
    "Analytics Report Builder",
    "Custom Report Generator",
    "Scheduled Report Service",
    "Real-time Report Updater",
    "Report Archive Manager",
    "Business Intelligence Processor",
  ],
  analytics: [
    "Data Pipeline Alpha",
    "Analytics Engine",
    "Real-time Sync",
    "Load Balancer",
    "Machine Learning Pipeline",
    "Predictive Analytics Engine",
    "Data Mining Service",
    "Statistical Analysis Tool",
    "Trend Prediction Model",
    "Customer Behavior Analyzer",
    "Performance Metrics Calculator",
    "Data Quality Checker",
    "Anomaly Detection System",
    "Pattern Recognition Engine",
    "Business Intelligence Processor",
  ],
}

// Funkcija za generisanje random datuma u poslednjih 60 dana
function generateRandomDate() {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * 60)
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)

  const hours = Math.floor(Math.random() * 24)
  const minutes = Math.floor(Math.random() * 60)
  date.setHours(hours, minutes, 0, 0)

  return date
}

// Funkcija za formatiranje datuma
function formatDate(date) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const month = months[date.getMonth()]
  const day = date.getDate()
  const year = date.getFullYear()
  const hours = date.getHours().toString().padStart(2, "0")
  const minutes = date.getMinutes().toString().padStart(2, "0")

  return `${month} ${day}, ${year} at ${hours}:${minutes}`
}

// Funkcija za generisanje novog unosa
function generateFluxEntry(id, targetStatus) {
  const category = categories[Math.floor(Math.random() * categories.length)]
  const processNamesForCategory = processNames[category]
  const baseName = processNamesForCategory[Math.floor(Math.random() * processNamesForCategory.length)]

  // Dodajemo broj na kraj imena
  const nameNumber = Math.floor(id / 15) + 1
  const name = `${baseName} ${nameNumber}`

  const stage = stagesByStatus[targetStatus][Math.floor(Math.random() * stagesByStatus[targetStatus].length)]

  let progress
  if (targetStatus === "completed") {
    progress = 100
  } else if (targetStatus === "failed") {
    progress = Math.floor(Math.random() * 60) + 5 // 5-65%
  } else {
    // active
    progress = Math.floor(Math.random() * 85) + 10 // 10-95%
  }

  const duration = Math.floor(Math.random() * 90) + 3 // 3-93 minutes
  const date = generateRandomDate()

  return {
    id,
    name,
    stage,
    progress,
    startTime: formatDate(date),
    duration,
    status: targetStatus,
    category,
    createdAt: date.toISOString(),
  }
}

// Generišemo dodatnih 270 unosa (90 po statusu)
const additionalData = []
const statusCounts = { active: 0, completed: 0, failed: 0 }

// Prvo brojimo postojeće statuse
existingData.forEach((item) => {
  statusCounts[item.status]++
})

console.log("Postojeći statusi:", statusCounts)

// Ciljamo 100 unosa po statusu
const targetPerStatus = 100
const neededPerStatus = {
  active: targetPerStatus - statusCounts.active,
  completed: targetPerStatus - statusCounts.completed,
  failed: targetPerStatus - statusCounts.failed,
}

console.log("Potrebno dodati po statusu:", neededPerStatus)

// Generišemo dodatne unose
let currentId = 31
for (const [status, needed] of Object.entries(neededPerStatus)) {
  for (let i = 0; i < needed; i++) {
    additionalData.push(generateFluxEntry(currentId++, status))
  }
}

// Kombinujemo postojeće i nove podatke
const allData = [...existingData, ...additionalData]

// Sortiramo po ID-u
allData.sort((a, b) => a.id - b.id)

console.log(`Generisano ukupno ${allData.length} unosa`)

// Brojimo finalne statuse
const finalCounts = { active: 0, completed: 0, failed: 0 }
allData.forEach((item) => {
  finalCounts[item.status]++
})

console.log("Finalni statusi:", finalCounts)

// Zapisujemo u JSON fajl
const outputPath = path.join(process.cwd(), "public", "data", "flux-data.json")
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2))

console.log(`✅ Uspešno generisan fajl: ${outputPath}`)
console.log(`📊 Ukupno unosa: ${allData.length}`)
console.log(`📈 Active: ${finalCounts.active}`)
console.log(`✅ Completed: ${finalCounts.completed}`)
console.log(`❌ Failed: ${finalCounts.failed}`)
