import fs from "fs"
import path from "path"

// Učitaj postojeće podatke
const existingDataPath = path.join(process.cwd(), "public", "data", "flux-data.json")
const existingData = JSON.parse(fs.readFileSync(existingDataPath, "utf8"))

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

// Funkcija za generisanje datuma na osnovu perioda
function generateDateForPeriod(period) {
  const now = new Date()
  let targetDate = new Date()

  switch (period) {
    case "today":
      // Danas - random vreme tokom dana
      targetDate = new Date(now)
      targetDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
      break
    case "last7":
      // Poslednih 7 dana
      const daysAgo7 = Math.floor(Math.random() * 7) + 1
      targetDate = new Date(now.getTime() - daysAgo7 * 24 * 60 * 60 * 1000)
      targetDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
      break
    case "last15":
      // Poslednjih 15 dana (8-15 dana unazad)
      const daysAgo15 = Math.floor(Math.random() * 8) + 8
      targetDate = new Date(now.getTime() - daysAgo15 * 24 * 60 * 60 * 1000)
      targetDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
      break
    case "last30":
      // Poslednjih 30 dana (16-30 dana unazad)
      const daysAgo30 = Math.floor(Math.random() * 15) + 16
      targetDate = new Date(now.getTime() - daysAgo30 * 24 * 60 * 60 * 1000)
      targetDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
      break
    case "last2months":
      // Poslednja 2 meseca (31-60 dana unazad)
      const daysAgo60 = Math.floor(Math.random() * 30) + 31
      targetDate = new Date(now.getTime() - daysAgo60 * 24 * 60 * 60 * 1000)
      targetDate.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), 0, 0)
      break
    default:
      targetDate = now
  }

  return targetDate
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
function generateFluxEntry(id, period) {
  const category = categories[Math.floor(Math.random() * categories.length)]
  const processNamesForCategory = processNames[category]
  const baseName = processNamesForCategory[Math.floor(Math.random() * processNamesForCategory.length)]

  // Dodajemo broj na kraj imena
  const nameNumber = Math.floor(id / 15) + 1
  const name = `${baseName} ${nameNumber}`

  // Random status
  const status = statuses[Math.floor(Math.random() * statuses.length)]
  const stage = stagesByStatus[status][Math.floor(Math.random() * stagesByStatus[status].length)]

  let progress
  if (status === "completed") {
    progress = 100
  } else if (status === "failed") {
    progress = Math.floor(Math.random() * 60) + 5 // 5-65%
  } else {
    // active
    progress = Math.floor(Math.random() * 85) + 10 // 10-95%
  }

  const duration = Math.floor(Math.random() * 90) + 3 // 3-93 minutes
  const date = generateDateForPeriod(period)

  return {
    id,
    name,
    stage,
    progress,
    startTime: formatDate(date),
    duration,
    status,
    category,
    createdAt: date.toISOString(),
  }
}

// Generišemo 30 novih unosa - po 6 za svaki period
const periods = ["today", "last7", "last15", "last30", "last2months"]
const newEntries = []
let currentId = Math.max(...existingData.map((item) => item.id)) + 1

periods.forEach((period) => {
  for (let i = 0; i < 6; i++) {
    newEntries.push(generateFluxEntry(currentId++, period))
  }
})

// Kombinujemo postojeće i nove podatke
const allData = [...existingData, ...newEntries]

// Sortiramo po ID-u
allData.sort((a, b) => a.id - b.id)

console.log(`Dodano ${newEntries.length} novih unosa`)
console.log(`Ukupno unosa: ${allData.length}`)

// Brojimo po periodima
const periodCounts = {
  today: 0,
  last7: 0,
  last15: 0,
  last30: 0,
  last2months: 0,
}

const now = new Date()
allData.forEach((item) => {
  const itemDate = new Date(item.createdAt)
  const diffDays = Math.floor((now - itemDate) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    periodCounts.today++
  } else if (diffDays <= 7) {
    periodCounts.last7++
  } else if (diffDays <= 15) {
    periodCounts.last15++
  } else if (diffDays <= 30) {
    periodCounts.last30++
  } else if (diffDays <= 60) {
    periodCounts.last2months++
  }
})

console.log("Distribucija po periodima:")
console.log(`📅 Today: ${periodCounts.today}`)
console.log(`📅 Last 7 days: ${periodCounts.last7}`)
console.log(`📅 Last 15 days: ${periodCounts.last15}`)
console.log(`📅 Last 30 days: ${periodCounts.last30}`)
console.log(`📅 Last 2 months: ${periodCounts.last2months}`)

// Zapisujemo u JSON fajl
const outputPath = path.join(process.cwd(), "public", "data", "flux-data.json")
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2))

console.log(`✅ Uspešno ažuriran fajl: ${outputPath}`)
