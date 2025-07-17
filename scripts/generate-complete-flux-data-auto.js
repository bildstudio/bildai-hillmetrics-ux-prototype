import fs from "fs"
import path from "path"

// Definišemo sve potrebne tipove i konstante
const categories = ["financial", "market", "compliance", "reporting", "analytics"]
const newStatuses = ["active", "completed", "failed", "Processing", "Paused", "Partially"]
const newCategories = ["Back office only", "Disabled", "Obsolete", "Active"]
const financialTypes = [
  "Fund",
  "Stock",
  "Bond",
  "ETF",
  "Cryptocurrency",
  "Derivative",
  "Commodity",
  "Forex",
  "Bench",
  "RealEstate",
  "Future",
  "PrivateEquity",
  "Spacs",
  "StructuredProduct",
  "Undefined",
]
const fluxTypes = ["Email", "API", "HTTP Download", "SFTP", "Webhook", "Scraping", "Manual"]

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
  Processing: ["Processing in progress", "Fetching in progress", "Validating in progress"],
  Paused: ["Paused", "On hold", "Suspended"],
  Partially: ["Partially completed", "Partial success", "Incomplete"],
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

// Error messages
const errorMessages = [
  "Connection timeout",
  "Validation failed",
  "Database error",
  "Network unreachable",
  "Authentication failed",
  "Resource not found",
  "Permission denied",
  "Service unavailable",
  "Rate limit exceeded",
  "Invalid configuration",
  "Memory allocation failed",
  "Disk space full",
  "Process crashed",
  "Dependency failure",
  "Timeout exceeded",
]

// Processing messages
const processingMessages = [
  "Data validation started",
  "Processing financial records",
  "Calculating risk metrics",
  "Generating reports",
  "Updating database records",
  "Performing compliance checks",
  "Analyzing market data",
  "Computing portfolio values",
  "Executing data transformations",
  "Finalizing calculations",
  "Archiving processed data",
  "Sending notifications",
  "Updating cache",
  "Synchronizing with external systems",
  "Completing workflow",
]

// Fetching messages
const fetchingMessages = [
  "Connecting to data source",
  "Authenticating with API",
  "Downloading market data",
  "Retrieving fund information",
  "Fetching price updates",
  "Collecting transaction data",
  "Downloading regulatory files",
  "Synchronizing with external feed",
  "Retrieving historical data",
  "Fetching real-time quotes",
  "Downloading reference data",
  "Collecting metadata",
  "Retrieving configuration updates",
  "Fetching security master data",
  "Downloading compliance reports",
]

// Funkcija za generisanje random datuma
function generateRandomDate(daysBack = 60) {
  const now = new Date()
  const daysAgo = Math.floor(Math.random() * daysBack)
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

// Funkcija za generisanje events
function generateEvents(messagePool, count, baseDate) {
  const events = []
  for (let i = 0; i < count; i++) {
    const eventDate = new Date(baseDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) // 30 dana opseg
    events.push({
      timestamp: eventDate.toISOString(),
      message: messagePool[Math.floor(Math.random() * messagePool.length)],
    })
  }
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// Funkcija za generisanje flux unosa
function generateFluxEntry(id) {
  const category = categories[Math.floor(Math.random() * categories.length)]
  const processNamesForCategory = processNames[category]
  const baseName = processNamesForCategory[Math.floor(Math.random() * processNamesForCategory.length)]
  const nameNumber = Math.floor(id / 15) + 1
  const name = `${baseName} ${nameNumber}`

  // Random status (uključujući nove)
  const status = newStatuses[(id - 1) % newStatuses.length]
  const stage = stagesByStatus[status]
    ? stagesByStatus[status][Math.floor(Math.random() * stagesByStatus[status].length)]
    : "Processing"

  let progress
  if (status === "completed") {
    progress = 100
  } else if (status === "failed") {
    progress = Math.floor(Math.random() * 60) + 5
  } else {
    progress = Math.floor(Math.random() * 85) + 10
  }

  const duration = Math.floor(Math.random() * 90) + 3
  const date = generateRandomDate()

  // Novi podaci
  const financialType = financialTypes[(id - 1) % financialTypes.length]
  const fluxType = fluxTypes[(id - 1) % fluxTypes.length]
  const newCategory = newCategories[(id - 1) % newCategories.length]

  // Generiši events
  const errorEventsCount = Math.floor(Math.random() * 6) // 0-5 grešaka
  const processingEventsCount = Math.floor(Math.random() * 10) + 1 // 1-10
  const fetchingEventsCount = Math.floor(Math.random() * 10) + 1 // 1-10

  const errorEvents = generateEvents(errorMessages, errorEventsCount, date)
  const processingEvents = generateEvents(processingMessages, processingEventsCount, date)
  const fetchingEvents = generateEvents(fetchingMessages, fetchingEventsCount, date)

  // Poslednji datumi
  const lastProcessingDate = processingEvents[processingEvents.length - 1].timestamp
  const lastFetchingDate = fetchingEvents[fetchingEvents.length - 1].timestamp

  return {
    id,
    name,
    stage,
    progress,
    startTime: formatDate(date),
    duration,
    status,
    category: newCategory, // Nova kategorija
    createdAt: date.toISOString(),
    errorEvents,
    completedAt: status === "completed" ? new Date(date.getTime() + duration * 60 * 1000).toISOString() : null,

    // Nova polja
    financialType,
    fluxType,
    lastFetchingDate: formatDate(new Date(lastFetchingDate)),
    fetchingErrorCount: errorEvents.length,
    lastProcessingDate: formatDate(new Date(lastProcessingDate)),
    processingEvents,
    fetchingEvents,
  }
}

// Generiši 600 unosa
console.log("🚀 Generisanje kompletnih flux podataka...")
const allData = []

for (let i = 1; i <= 600; i++) {
  allData.push(generateFluxEntry(i))
}

// Sortiraj po ID-u
allData.sort((a, b) => a.id - b.id)

// Zapisuj u fajl
const outputPath = path.join(process.cwd(), "public", "data", "flux-data.json")

try {
  // Kreiraj direktorijum ako ne postoji
  const dir = path.dirname(outputPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Zapisuj podatke
  fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2))

  console.log(`✅ Uspešno zapisano ${allData.length} flux unosa u ${outputPath}`)

  // Statistike
  const stats = {
    total: allData.length,
    byStatus: {},
    byCategory: {},
    byFinancialType: {},
    byFluxType: {},
    totalErrors: 0,
    totalProcessingEvents: 0,
    totalFetchingEvents: 0,
  }

  allData.forEach((item) => {
    stats.byStatus[item.status] = (stats.byStatus[item.status] || 0) + 1
    stats.byCategory[item.category] = (stats.byCategory[item.category] || 0) + 1
    stats.byFinancialType[item.financialType] = (stats.byFinancialType[item.financialType] || 0) + 1
    stats.byFluxType[item.fluxType] = (stats.byFluxType[item.fluxType] || 0) + 1
    stats.totalErrors += item.fetchingErrorCount
    stats.totalProcessingEvents += item.processingEvents.length
    stats.totalFetchingEvents += item.fetchingEvents.length
  })

  console.log(`\n📊 STATISTIKE:`)
  console.log(`===============`)
  console.log(`📈 Ukupno unosa: ${stats.total}`)
  console.log(`\n🔄 Po statusu:`)
  Object.entries(stats.byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`)
  })
  console.log(`\n📂 Po kategoriji:`)
  Object.entries(stats.byCategory).forEach(([category, count]) => {
    console.log(`   ${category}: ${count}`)
  })
  console.log(`\n💰 Po financial type:`)
  Object.entries(stats.byFinancialType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })
  console.log(`\n🔗 Po flux type:`)
  Object.entries(stats.byFluxType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`)
  })
  console.log(`\n❌ Ukupno grešaka: ${stats.totalErrors}`)
  console.log(`⚙️ Ukupno processing events: ${stats.totalProcessingEvents}`)
  console.log(`📥 Ukupno fetching events: ${stats.totalFetchingEvents}`)
  console.log(`📊 Prosečno grešaka po flux-u: ${(stats.totalErrors / stats.total).toFixed(2)}`)
  console.log(`📊 Prosečno processing events po flux-u: ${(stats.totalProcessingEvents / stats.total).toFixed(2)}`)
  console.log(`📊 Prosečno fetching events po flux-u: ${(stats.totalFetchingEvents / stats.total).toFixed(2)}`)

  // Prikaži primer strukture
  console.log(`\n📋 PRIMER STRUKTURE PRVOG UNOSA:`)
  console.log(`=================================`)
  console.log(JSON.stringify(allData[0], null, 2))

  console.log(`\n🎉 USPEŠNO ZAVRŠENO!`)
  console.log(`====================`)
  console.log(`✅ Fajl public/data/flux-data.json je ažuriran`)
  console.log(`✅ Svi novi podaci su dodati`)
  console.log(`✅ Aplikacija će automatski učitati nove podatke`)
} catch (error) {
  console.error(`❌ Greška pri pisanju fajla:`, error)
}
