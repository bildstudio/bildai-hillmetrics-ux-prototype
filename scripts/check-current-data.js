import fs from "fs"
import path from "path"

// Učitaj postojeće podatke
const dataPath = path.join(process.cwd(), "public", "data", "flux-data.json")

try {
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"))

  console.log("📊 TRENUTNO STANJE PODATAKA:")
  console.log("============================")
  console.log(`Ukupno unosa: ${data.length}`)

  if (data.length > 0) {
    const firstItem = data[0]
    console.log("\n🔍 STRUKTURA PRVOG UNOSA:")
    console.log("==========================")
    console.log("Postojeća polja:")
    Object.keys(firstItem).forEach((key) => {
      console.log(`  - ${key}: ${typeof firstItem[key]} = ${JSON.stringify(firstItem[key]).substring(0, 50)}...`)
    })

    console.log("\n❓ NEDOSTAJU POLJA:")
    console.log("===================")
    const requiredFields = [
      "financialType",
      "fluxType",
      "lastFetchingDate",
      "fetchingErrorCount",
      "lastProcessingDate",
      "processingEvents",
      "fetchingEvents",
    ]

    requiredFields.forEach((field) => {
      if (!firstItem.hasOwnProperty(field)) {
        console.log(`  ❌ ${field}`)
      } else {
        console.log(`  ✅ ${field}`)
      }
    })
  }
} catch (error) {
  console.error("❌ Greška pri čitanju podataka:", error.message)
}
