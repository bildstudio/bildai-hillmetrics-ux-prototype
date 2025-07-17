import fs from "fs"
import path from "path"

// Učitaj postojeće podatke
const dataPath = path.join(process.cwd(), "public", "data", "flux-data.json")
const existingData = JSON.parse(fs.readFileSync(dataPath, "utf8"))

// Error messages pool
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

// Funkcija za generisanje random error eventa
function generateErrorEvents(createdAt, status) {
  if (status !== "failed") return []

  const events = []
  const numEvents = Math.floor(Math.random() * 3) + 1 // 1-3 eventa
  const startTime = new Date(createdAt)

  for (let i = 0; i < numEvents; i++) {
    const errorTime = new Date(startTime.getTime() + (i + 1) * Math.random() * 30 * 60 * 1000) // 0-30 min nakon start
    events.push({
      timestamp: errorTime.toISOString(),
      message: errorMessages[Math.floor(Math.random() * errorMessages.length)],
    })
  }

  return events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
}

// Funkcija za generisanje completedAt
function generateCompletedAt(createdAt, duration, status) {
  if (status !== "completed") return null

  const startTime = new Date(createdAt)
  const completedTime = new Date(startTime.getTime() + duration * 60 * 1000) // duration je u minutima
  return completedTime.toISOString()
}

// Ažuriraj svaki flux
const updatedData = existingData.map((flux) => ({
  ...flux,
  errorEvents: generateErrorEvents(flux.createdAt, flux.status),
  completedAt: generateCompletedAt(flux.createdAt, flux.duration, flux.status),
}))

// Sačuvaj ažurirane podatke
fs.writeFileSync(dataPath, JSON.stringify(updatedData, null, 2))

console.log(`✅ Uspešno ažurirano ${updatedData.length} flux unosa`)
console.log(`📊 Statistike:`)
console.log(`   - Active: ${updatedData.filter((f) => f.status === "active").length}`)
console.log(`   - Completed: ${updatedData.filter((f) => f.status === "completed").length}`)
console.log(`   - Failed: ${updatedData.filter((f) => f.status === "failed").length}`)
console.log(`   - Total error events: ${updatedData.reduce((sum, f) => sum + f.errorEvents.length, 0)}`)
