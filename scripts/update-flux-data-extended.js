import fs from "fs"
import path from "path"

// Učitaj postojeće podatke
const dataPath = path.join(process.cwd(), "public", "data", "flux-data.json")
const existingData = JSON.parse(fs.readFileSync(dataPath, "utf8"))

// Novi tipovi podataka
const financialTypes = ["Fund", "Forex", "Cryptocurrency", "Futures", "Options", "Forwards", "Swaps", "CFD"]
const fluxTypes = ["https", "API", "SFTP", "Mail", "File"]
const newStatuses = ["active", "completed", "failed", "Processing", "Paused", "Partially"]
const newCategories = ["Back office only", "Disabled", "Obsolete", "Active"]

// Processing messages pool
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

// Fetching messages pool
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

// Error messages pool (existing)
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

// Funkcija za generisanje random datuma u određenom opsegu
function generateRandomDate(baseDate, daysRange = 30) {
  const base = new Date(baseDate)
  const randomDays = Math.floor(Math.random() * daysRange) - daysRange / 2
  const date = new Date(base.getTime() + randomDays * 24 * 60 * 60 * 1000)

  const hours = Math.floor(Math.random() * 24)
  const minutes = Math.floor(Math.random() * 60)
  date.setHours(hours, minutes, 0, 0)

  return date
}

// Funkcija za generisanje processing events
function generateProcessingEvents(createdAt, count) {
  const events = []
  const baseDate = new Date(createdAt)

  for (let i = 0; i < count; i++) {
    const eventDate = generateRandomDate(baseDate, 60) // 60 dana opseg
    events.push({
      timestamp: eventDate.toISOString(),
      message: processingMessages[Math.floor(Math.random() * processingMessages.length)],
    })
  }

  // Sortiraj po datumu
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// Funkcija za generisanje fetching events
function generateFetchingEvents(createdAt, count) {
  const events = []
  const baseDate = new Date(createdAt)

  for (let i = 0; i < count; i++) {
    const eventDate = generateRandomDate(baseDate, 60) // 60 dana opseg
    events.push({
      timestamp: eventDate.toISOString(),
      message: fetchingMessages[Math.floor(Math.random() * fetchingMessages.length)],
    })
  }

  // Sortiraj po datumu
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// Funkcija za generisanje dodatnih error events ako je potrebno
function generateAdditionalErrorEvents(existingErrors, targetCount, createdAt) {
  const events = [...existingErrors]
  const baseDate = new Date(createdAt)

  while (events.length < targetCount) {
    const errorDate = generateRandomDate(baseDate, 60)
    events.push({
      timestamp: errorDate.toISOString(),
      message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
    })
  }

  // Sortiraj po datumu
  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
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

// Ažuriraj svaki flux
const updatedData = existingData.map((flux) => {
  // Generiši processing events (1-10)
  const processingEventsCount = Math.floor(Math.random() * 10) + 1
  const processingEvents = generateProcessingEvents(flux.createdAt, processingEventsCount)

  // Generiši fetching events (1-10)
  const fetchingEventsCount = Math.floor(Math.random() * 10) + 1
  const fetchingEvents = generateFetchingEvents(flux.createdAt, fetchingEventsCount)

  // Možda dodaj još error events (0-5 dodatnih)
  const additionalErrorsCount = Math.floor(Math.random() * 6) // 0-5
  const updatedErrorEvents = generateAdditionalErrorEvents(
    flux.errorEvents,
    flux.errorEvents.length + additionalErrorsCount,
    flux.createdAt,
  )

  // Izračunaj poslednje datume
  const lastProcessingDate = processingEvents[processingEvents.length - 1].timestamp
  const lastFetchingDate = fetchingEvents[fetchingEvents.length - 1].timestamp

  // Dodeli nove tipove
  const financialType = financialTypes[Math.floor(Math.random() * financialTypes.length)]
  const fluxType = fluxTypes[Math.floor(Math.random() * fluxTypes.length)]
  const newCategory = newCategories[Math.floor(Math.random() * newCategories.length)]

  // Možda promeni status na neki od novih
  let newStatus = flux.status
  if (Math.random() < 0.3) {
    // 30% šanse da se promeni na novi status
    const possibleNewStatuses = ["Processing", "Paused", "Partially"]
    newStatus = possibleNewStatuses[Math.floor(Math.random() * possibleNewStatuses.length)]
  }

  return {
    ...flux,
    // Novi podaci
    financialType,
    fluxType,
    lastFetchingDate: formatDate(new Date(lastFetchingDate)),
    fetchingErrorCount: updatedErrorEvents.length,
    lastProcessingDate: formatDate(new Date(lastProcessingDate)),

    // Ažurirani postojeći podaci
    status: newStatus,
    category: newCategory, // Zamenio postojeću kategoriju
    errorEvents: updatedErrorEvents,

    // Novi nizovi
    processingEvents,
    fetchingEvents,
  }
})

// Sačuvaj ažurirane podatke
fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2))

console.log(`✅ Uspešno ažurirano ${updatedData.length} flux unosa sa proširenim podacima`)
console.log(`📊 Statistike:`)

// Statistike po financial type
const financialTypeStats = {}
updatedData.forEach((f) => {
  financialTypeStats[f.financialType] = (financialTypeStats[f.financialType] || 0) + 1
})
console.log(`   Financial Types:`, financialTypeStats)

// Statistike po flux type
const fluxTypeStats = {}
updatedData.forEach((f) => {
  fluxTypeStats[f.fluxType] = (fluxTypeStats[f.fluxType] || 0) + 1
})
console.log(`   Flux Types:`, fluxTypeStats)

// Statistike po kategorijama
const categoryStats = {}
updatedData.forEach((f) => {
  categoryStats[f.category] = (categoryStats[f.category] || 0) + 1
})
console.log(`   Categories:`, categoryStats)

// Statistike po statusu
const statusStats = {}
updatedData.forEach((f) => {
  statusStats[f.status] = (statusStats[f.status] || 0) + 1
})
console.log(`   Statuses:`, statusStats)

// Statistike error events
const totalErrors = updatedData.reduce((sum, f) => sum + f.fetchingErrorCount, 0)
const avgErrors = (totalErrors / updatedData.length).toFixed(2)
console.log(`   Total error events: ${totalErrors}`)
console.log(`   Average errors per flux: ${avgErrors}`)

// Statistike processing events
const totalProcessingEvents = updatedData.reduce((sum, f) => sum + f.processingEvents.length, 0)
const avgProcessingEvents = (totalProcessingEvents / updatedData.length).toFixed(2)
console.log(`   Total processing events: ${totalProcessingEvents}`)
console.log(`   Average processing events per flux: ${avgProcessingEvents}`)

// Statistike fetching events
const totalFetchingEvents = updatedData.reduce((sum, f) => sum + f.fetchingEvents.length, 0)
const avgFetchingEvents = (totalFetchingEvents / updatedData.length).toFixed(2)
console.log(`   Total fetching events: ${totalFetchingEvents}`)
console.log(`   Average fetching events per flux: ${avgFetchingEvents}`)
