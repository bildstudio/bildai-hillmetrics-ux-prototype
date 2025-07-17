import { faker } from "@faker-js/faker"
import postgres from "postgres"

// --- KONFIGURACIJA ---
const TOTAL_FLUXES = 20
const NOW = new Date("2025-06-27T12:00:00Z") // Fiksiramo "sadašnje" vreme za konzistentnost

// Provera da li je konekcioni string postavljen
if (!process.env.POSTGRES_URL) {
  console.error("❌ Greška: POSTGRES_URL environment variable nije postavljen.")
  process.exit(1)
}

// Konekcija na Supabase/PostgreSQL
const sql = postgres(process.env.POSTGRES_URL, {
  ssl: "require",
  // idle_timeout: 20,
  // max_lifetime: 60 * 30,
})

// --- KONSTANTE I LISTE VREDNOSTI ---
const SOURCES = ["Option 1", "Option 2", "Option 3", "Option 4"]
const FLUX_STATES = { ACTIVE: "Active", DISABLED: "Disabled", BACK_OFFICE: "Back office only" }
const SCHEDULE_TYPES = { ACTIVE: "Active", INACTIVE: "Inactive" }
const FETCHING_STATUSES = { SUCCESS: "Success", FAILED: "Failed", CURRENTLY_FETCHING: "Currently fetching" }
const PROCESSING_STATUSES = { SUCCESS: "Success", FAILED: "Failed", CURRENTLY_PROCESSING: "Currently processing" }
const FINANCIAL_TYPES = [
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
const FLUX_TYPES = ["Email", "API", "HTTP Download", "SFTP", "Webhook", "Scraping", "Manual"]
const FREQUENCY_TYPES = ["Never", "Daily", "Immediately", "Every X Minutes", "Every X Hours", "Monthly", "Specific"]

const FETCHING_ERROR_MESSAGES = [
  "Unsupported Content Location",
  "No Attachment",
  "Attachment Found But Does Not Match Attachment Rule",
  "Email Fetch Error",
  "Error While Processing Email",
  "Error While Processing Attachment",
  "Http Fetch Error",
  "One Attachment For Multiple Flux",
  "Inconsistent Metadata",
  "Flux Does Not Match Mail",
  "Unable To Deserialize Json Content",
  "Error When Trying To Link With Raw Database",
  "Already Exist In Raw Database",
  "Configuration Error",
  "Empty Content",
  "Custom Implementation Error",
  "Unknown Flux Type",
  "Undefined",
]

const PROCESSING_ERROR_MESSAGES = [
  "Unable To Deserialize Json Content",
  "Different Data For A Same Product",
  "Currency Not Found",
  "Mic Not Found",
  "No Data To Process",
  "Link With Raw Database Is Not Set",
  "Exception Error",
  "Row Count Mismatch",
  "Insertion Error",
  "Financial Identifier Not Found",
]

// --- POMOĆNE FUNKCIJE ---
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const randomBool = (probability = 0.5) => Math.random() < probability
const escapeSqlString = (str) => (str === null || str === undefined ? "NULL" : `'${String(str).replace(/'/g, "''")}'`)

// Funkcija za generisanje datuma kreiranja fluxa prema distribuciji
const generateCreatedAt = (index) => {
  const percentage = index / TOTAL_FLUXES
  let year, month, day

  if (percentage < 0.5) {
    // 50% in 2025
    year = 2025
    // 10% od 2025 (tj. 5% od ukupnog) u Junu
    if (percentage < 0.05) {
      month = 5 // Jun (0-indexed)
      // Neki podaci u poslednjoj nedelji Juna (20-27)
      if (randomBool(0.3)) {
        day = randomInt(20, 27)
      } else {
        day = randomInt(1, 19)
      }
    } else {
      month = randomInt(0, 4) // Jan-Maj
      day = randomInt(1, 28)
    }
  } else if (percentage < 0.65) {
    // 15% in 2024
    year = 2024
    month = randomInt(0, 11)
    day = randomInt(1, 28)
  } else if (percentage < 0.8) {
    // 15% in 2023
    year = 2023
    month = randomInt(0, 11)
    day = randomInt(1, 28)
  } else {
    // 20% in 2022
    year = 2022
    month = randomInt(0, 11)
    day = randomInt(1, 28)
  }

  return new Date(Date.UTC(year, month, day, randomInt(0, 23), randomInt(0, 59), randomInt(0, 59)))
}

// Funkcija za generisanje JSON konfiguracije za schedule
const generateScheduleConfig = (type) => {
  if (type === "Never" || type === "Immediately") return { type }
  if (type === "Daily") return { type, intervalDays: randomInt(1, 90) }
  if (type === "Every X Minutes") return { type, intervalMinutes: randomInt(1, 50) }
  if (type === "Every X Hours") return { type, intervalHours: randomInt(1, 23) }
  if (type === "Monthly")
    return {
      type,
      dayOfMonth: randomInt(1, 28), // Ograničeno na 28 da bi bilo validno za sve mesece
      startTime: `${String(randomInt(0, 23)).padStart(2, "0")}:${String(randomInt(0, 59)).padStart(2, "0")}`,
    }
  if (type === "Specific") return { type, hours: [randomInt(0, 23)], minutes: [randomInt(0, 59)] }
  return {}
}

// Funkcija za generisanje JSON konfiguracije za fluxType
const generateFluxTypeConfig = (fluxType) => {
  switch (fluxType) {
    case "Email":
      return {
        contentLocation: randomItem(["Body", "Attachment"]),
        emailRuleGroup: [{ criteria: [{ field: "Subject", operator: "Contains", value: faker.lorem.word() }] }],
        metadata: { source: faker.internet.email() },
      }
    case "API":
      return { apiUrl: faker.internet.url(), apiKey: faker.string.uuid(), metadata: { version: "v1" } }
    case "HTTP Download":
      return { url: faker.internet.url(), contentType: "application/json", metadata: {} }
    case "SFTP":
      return {
        host: faker.internet.domainName(),
        port: 22,
        user: faker.internet.userName(),
        password: faker.internet.password(),
        deleteAfterDownload: randomBool(),
        useSshKey: randomBool(0.2),
        fileGroups: [{ path: "/remote/path/", pattern: "*.csv" }],
      }
    case "Webhook":
      return { url: faker.internet.url() + "/webhook", apiKey: faker.string.uuid(), metadata: {} }
    case "Scraping":
      return { url: faker.internet.url(), contentType: "text/html", metadata: { selector: ".data-table" } }
    case "Manual":
      return { url: "manual_upload", contentType: "user_defined", metadata: {} }
    default:
      return {}
  }
}

// Funkcija za generisanje kratkog imena fajla
const generateShortContentName = (longName) => {
  const parts = longName.split(/[._/-]/)
  const meaningfulParts = parts.filter((p) => p.length > 3 && !/^\d+$/.test(p))
  if (meaningfulParts.length > 1) {
    return meaningfulParts.slice(0, 2).join("_").substring(0, 40)
  }
  return longName.substring(0, 40)
}

// --- KREIRANJE SQL ŠEME ---
const createSchemaSQL = () => {
  return `
-- Brisanje postojećih tabela (opciono, dobro za testiranje)
DROP TABLE IF EXISTS processing_content_history CASCADE;
DROP TABLE IF EXISTS processingHistory CASCADE;
DROP TABLE IF EXISTS content_items CASCADE;
DROP TABLE IF EXISTS fetchingHistory CASCADE;
DROP TABLE IF EXISTS fluxData CASCADE;

-- Kreiranje tabela
CREATE TABLE fluxData (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    source TEXT,
    fluxState TEXT,
    comment TEXT,
    description TEXT,
    fetchScheduleType TEXT,
    fetchScheduleConfiguration JSONB,
    processingScheduleType TEXT,
    processingScheduleConfiguration JSONB,
    fetchingStatus TEXT,
    processingStatus TEXT,
    numberOfFetchingTimes INTEGER DEFAULT 0,
    numberOfProcessingTimes INTEGER DEFAULT 0,
    numberOfErrorFetching INTEGER DEFAULT 0,
    numberOfErrorsProcessing INTEGER DEFAULT 0,
    numberOfSuccessFetching INTEGER DEFAULT 0,
    numberOfSuccessProcessing INTEGER DEFAULT 0,
    numberOfCurrentlyFetching INTEGER DEFAULT 0,
    numberOfCurrentlyProcessing INTEGER DEFAULT 0,
    fetchingProgress REAL,
    processingProgress REAL,
    lastFetchingDate TIMESTAMP(3),
    lastProcessingDate TIMESTAMP(3),
    lastDurationFetching INTEGER,
    lastDurationProcessing INTEGER,
    createdAt TIMESTAMP(3) NOT NULL,
    editedAt TIMESTAMP(3),
    financialType TEXT,
    fluxType TEXT,
    fluxTypeConfiguration JSONB,
    allowConcurrentMultiFetching BOOLEAN DEFAULT FALSE
);

CREATE TABLE fetchingHistory (
    fetchingID SERIAL PRIMARY KEY,
    fluxID INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL,
    completedAt TIMESTAMP(3),
    fetchingTimeInSeconds INTEGER,
    progress REAL,
    numberOfContent INTEGER,
    errorMessage TEXT,
    CONSTRAINT fk_fluxdata
        FOREIGN KEY(fluxID) 
        REFERENCES fluxData(id)
        ON DELETE CASCADE
);

CREATE TABLE content_items (
    contentID SERIAL PRIMARY KEY,
    fetchingID INTEGER NOT NULL,
    fluxID INTEGER NOT NULL,
    contentName TEXT,
    contentShortName TEXT,
    description TEXT,
    fileSize BIGINT,
    contentLength BIGINT,
    fileType VARCHAR(100),
    mimeType VARCHAR(100),
    encoding VARCHAR(50),
    hash CHAR(64),
    createdAt TIMESTAMP(3),
    modifiedAt TIMESTAMP(3),
    sourceUrl TEXT,
    CONSTRAINT fk_fetchinghistory
        FOREIGN KEY(fetchingID) 
        REFERENCES fetchingHistory(fetchingID)
        ON DELETE CASCADE,
    CONSTRAINT fk_fluxdata_content
        FOREIGN KEY(fluxID) 
        REFERENCES fluxData(id)
        ON DELETE CASCADE
);

CREATE TABLE processingHistory (
    processingID SERIAL PRIMARY KEY,
    fluxID INTEGER NOT NULL,
    fetchingID INTEGER NOT NULL,
    status TEXT NOT NULL,
    timestamp TIMESTAMP(3) NOT NULL,
    completedAt TIMESTAMP(3),
    numberOfProcessingContent INTEGER,
    processingTimeInSeconds INTEGER,
    progress REAL,
    errorMessage TEXT,
    CONSTRAINT fk_fluxdata_processing
        FOREIGN KEY(fluxID) 
        REFERENCES fluxData(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_fetchinghistory_processing
        FOREIGN KEY(fetchingID) 
        REFERENCES fetchingHistory(fetchingID)
        ON DELETE CASCADE
);

CREATE TABLE processing_content_history (
    processing_content_history_ID SERIAL PRIMARY KEY,
    processingID INTEGER NOT NULL,
    contentID INTEGER NOT NULL,
    processingStartTime TIMESTAMP(3),
    processingEndTime TIMESTAMP(3),
    processingTimeInSeconds INTEGER,
    status TEXT NOT NULL,
    statistics JSONB,
    CONSTRAINT fk_processinghistory
        FOREIGN KEY(processingID) 
        REFERENCES processingHistory(processingID)
        ON DELETE CASCADE,
    CONSTRAINT fk_contentitems
        FOREIGN KEY(contentID) 
        REFERENCES content_items(contentID)
        ON DELETE CASCADE
);

-- Kreiranje indeksa
CREATE INDEX idx_fetchinghistory_fluxid ON fetchingHistory(fluxID);
CREATE INDEX idx_fetchinghistory_status ON fetchingHistory(status);
CREATE INDEX idx_processinghistory_fluxid ON processingHistory(fluxID);
CREATE INDEX idx_processinghistory_status ON processingHistory(status);
CREATE INDEX idx_contentitems_fluxid ON content_items(fluxID);
CREATE INDEX idx_processing_content_history_processingid ON processing_content_history(processingID);
CREATE INDEX idx_processing_content_history_contentid ON processing_content_history(contentID);
`
}

// --- GENERISANJE PODATAKA ---
const generateData = () => {
  const allFluxData = []
  const fetchingHistoryData = []
  const contentItemsData = []
  const processingHistoryData = []
  const processingContentHistoryData = []
  const fluxUpdateData = []

  // 1. Generisanje osnovnih podataka za fluxData
  for (let i = 1; i <= TOTAL_FLUXES; i++) {
    const fluxData = {}
    fluxData.id = i
    fluxData.createdAt = generateCreatedAt(i)
    fluxData.editedAt = randomBool(0.3)
      ? new Date(fluxData.createdAt.getTime() + randomInt(1, 100) * 86400000)
      : fluxData.createdAt

    // Raspodela fluxState
    const fluxStateRoll = Math.random()
    if (fluxStateRoll < 0.7) fluxData.fluxState = FLUX_STATES.ACTIVE
    else if (fluxStateRoll < 0.9) fluxData.fluxState = FLUX_STATES.BACK_OFFICE
    else fluxData.fluxState = FLUX_STATES.DISABLED

    // Raspodela finalnog fetchingStatus-a (ako nije disabled)
    if (fluxData.fluxState !== FLUX_STATES.DISABLED) {
      const fetchingStatusRoll = Math.random()
      if (fetchingStatusRoll < 0.75) fluxData.intendedFetchingStatus = FETCHING_STATUSES.SUCCESS
      else if (fetchingStatusRoll < 0.95) fluxData.intendedFetchingStatus = FETCHING_STATUSES.FAILED
      else fluxData.intendedFetchingStatus = FETCHING_STATUSES.CURRENTLY_FETCHING
    } else {
      fluxData.intendedFetchingStatus = null
    }

    // Raspodela finalnog processingStatus-a
    if (fluxData.intendedFetchingStatus === FETCHING_STATUSES.SUCCESS) {
      const processingStatusRoll = Math.random()
      if (processingStatusRoll < 0.75) fluxData.intendedProcessingStatus = PROCESSING_STATUSES.SUCCESS
      else if (processingStatusRoll < 0.95) fluxData.intendedProcessingStatus = PROCESSING_STATUSES.FAILED
      else fluxData.intendedProcessingStatus = PROCESSING_STATUSES.CURRENTLY_PROCESSING
    } else {
      fluxData.intendedProcessingStatus = null // Nema procesiranja ako fetch nije uspeo
    }

    fluxData.source = randomItem(SOURCES)
    fluxData.financialType = randomItem(FINANCIAL_TYPES)
    fluxData.fluxType = randomItem(FLUX_TYPES)
    fluxData.name = `${faker.company.name()} ${fluxData.financialType} ${fluxData.fluxType} Flux`
    fluxData.comment = randomBool(0.8) ? faker.lorem.sentence() : null
    fluxData.description = randomBool(0.8) ? faker.lorem.paragraph() : null
    fluxData.allowConcurrentMultiFetching = randomBool(0.02)

    // Fetch & Process Schedule
    fluxData.fetchScheduleType = randomBool(0.8) ? SCHEDULE_TYPES.ACTIVE : SCHEDULE_TYPES.INACTIVE
    fluxData.processingScheduleType = randomBool(0.8) ? SCHEDULE_TYPES.ACTIVE : SCHEDULE_TYPES.INACTIVE

    const getScheduleConfig = () => {
      const roll = Math.random()
      if (roll < 0.05) return generateScheduleConfig("Never")
      if (roll < 0.25) return generateScheduleConfig("Daily")
      if (roll < 0.3) return generateScheduleConfig("Immediately")
      if (roll < 0.4) return generateScheduleConfig("Every X Minutes")
      if (roll < 0.5) return generateScheduleConfig("Every X Hours")
      if (roll < 0.65) return generateScheduleConfig("Monthly")
      return generateScheduleConfig("Specific")
    }

    fluxData.fetchScheduleConfiguration =
      fluxData.fetchScheduleType === SCHEDULE_TYPES.ACTIVE ? getScheduleConfig() : {}
    fluxData.processingScheduleConfiguration =
      fluxData.processingScheduleType === SCHEDULE_TYPES.ACTIVE ? getScheduleConfig() : {}

    fluxData.fluxTypeConfiguration = generateFluxTypeConfig(fluxData.fluxType)

    allFluxData.push(fluxData)
  }

  // 2. Generisanje istorije
  let fetchingIdCounter = 1
  let contentIdCounter = 1
  let processingIdCounter = 1
  let processingContentHistoryIdCounter = 1

  for (const flux of allFluxData) {
    if (flux.fluxState === FLUX_STATES.DISABLED) continue

    const currentFetchingHistory = []
    const currentContentItems = []
    const currentProcessingHistory = []
    const currentProcessingContentHistory = []

    // Generisanje fetching istorije
    const schedule = flux.fetchScheduleConfiguration
    let nextFetchDate = new Date(flux.createdAt)
    if (schedule.type === "Monthly") {
      nextFetchDate.setUTCDate(schedule.dayOfMonth)
    }

    while (nextFetchDate < NOW) {
      if (nextFetchDate > flux.createdAt) {
        currentFetchingHistory.push({ timestamp: new Date(nextFetchDate) })
      }

      // Pomeranje na sledeći datum
      switch (schedule.type) {
        case "Daily":
          nextFetchDate.setUTCDate(nextFetchDate.getUTCDate() + (schedule.intervalDays || 1))
          break
        case "Every X Minutes":
          nextFetchDate.setUTCMinutes(nextFetchDate.getUTCMinutes() + (schedule.intervalMinutes || 30))
          break
        case "Every X Hours":
          nextFetchDate.setUTCHours(nextFetchDate.getUTCHours() + (schedule.intervalHours || 1))
          break
        case "Monthly":
          nextFetchDate.setUTCMonth(nextFetchDate.getUTCMonth() + 1)
          break
        default: // Never, Immediately, Specific - ne generišu ponavljajuću istoriju
          nextFetchDate = new Date(NOW.getTime() + 1) // Prekini petlju
          break
      }
    }
    if (currentFetchingHistory.length === 0 && flux.intendedFetchingStatus) {
      currentFetchingHistory.push({ timestamp: new Date(flux.createdAt.getTime() + 3600000) }) // Barem jedan unos
    }

    // Popunjavanje detalja za fetching istoriju
    currentFetchingHistory.forEach((fetch, index) => {
      const isLast = index === currentFetchingHistory.length - 1
      fetch.fetchingID = fetchingIdCounter++
      fetch.fluxID = flux.id

      if (isLast) {
        fetch.status = flux.intendedFetchingStatus
      } else {
        // 90% success, 10% fail za prethodne
        fetch.status = randomBool(0.9) ? FETCHING_STATUSES.SUCCESS : FETCHING_STATUSES.FAILED
      }

      const duration = randomInt(5, 120)
      fetch.fetchingTimeInSeconds = fetch.status === FETCHING_STATUSES.CURRENTLY_FETCHING ? null : duration
      fetch.completedAt =
        fetch.status === FETCHING_STATUSES.CURRENTLY_FETCHING
          ? null
          : new Date(fetch.timestamp.getTime() + duration * 1000)
      fetch.progress =
        fetch.status === FETCHING_STATUSES.SUCCESS
          ? 100
          : fetch.status === FETCHING_STATUSES.CURRENTLY_FETCHING
            ? randomInt(10, 90)
            : randomInt(0, 80)
      fetch.errorMessage = fetch.status === FETCHING_STATUSES.FAILED ? randomItem(FETCHING_ERROR_MESSAGES) : null
      fetch.numberOfContent = 0

      // Generisanje content items za uspešne fetch-ove
      if (fetch.status === FETCHING_STATUSES.SUCCESS) {
        const numContent = randomInt(1, 3)
        fetch.numberOfContent = numContent
        for (let k = 0; k < numContent; k++) {
          const contentName = `${faker.word.noun()}_${flux.financialType}_${fetch.timestamp.toISOString().slice(0, 10)}_${faker.string.alphanumeric(8)}.${randomItem(["csv", "xls", "json", "xml"])}`
          const content = {
            contentID: contentIdCounter++,
            fetchingID: fetch.fetchingID,
            fluxID: flux.id,
            contentName: contentName,
            contentShortName: generateShortContentName(contentName),
            description: faker.lorem.sentence(),
            fileSize: randomInt(1024, 1024 * 1024),
            contentLength: randomInt(1000, 1024 * 1000),
            fileType: faker.system.fileExt(),
            mimeType: faker.system.mimeType(),
            encoding: "UTF-8",
            hash: faker.string.hexadecimal({ length: 64, casing: "lower" }),
            createdAt: fetch.timestamp,
            modifiedAt: fetch.timestamp,
            sourceUrl: faker.internet.url(),
          }
          currentContentItems.push(content)
        }
      }
    })

    // Generisanje processing istorije
    const successfulFetches = currentFetchingHistory.filter((f) => f.status === FETCHING_STATUSES.SUCCESS)
    successfulFetches.forEach((sFetch, index) => {
      const isLast = index === successfulFetches.length - 1
      const pHistory = {
        processingID: processingIdCounter++,
        fluxID: flux.id,
        fetchingID: sFetch.fetchingID,
        timestamp: new Date(sFetch.completedAt.getTime() + randomInt(10000, 60000)),
      }

      if (isLast) {
        pHistory.status = flux.intendedProcessingStatus
      } else {
        pHistory.status = randomBool(0.9) ? PROCESSING_STATUSES.SUCCESS : PROCESSING_STATUSES.FAILED
      }

      const duration = randomInt(10, 300)
      pHistory.processingTimeInSeconds = pHistory.status === PROCESSING_STATUSES.CURRENTLY_PROCESSING ? null : duration
      pHistory.completedAt =
        pHistory.status === PROCESSING_STATUSES.CURRENTLY_PROCESSING
          ? null
          : new Date(pHistory.timestamp.getTime() + duration * 1000)
      pHistory.progress =
        pHistory.status === PROCESSING_STATUSES.SUCCESS
          ? 100
          : pHistory.status === PROCESSING_STATUSES.CURRENTLY_PROCESSING
            ? randomInt(10, 90)
            : randomInt(0, 80)
      pHistory.errorMessage =
        pHistory.status === PROCESSING_STATUSES.FAILED ? randomItem(PROCESSING_ERROR_MESSAGES) : null
      pHistory.numberOfProcessingContent = 0

      // Generisanje processing_content_history
      if (pHistory.status !== PROCESSING_STATUSES.CURRENTLY_PROCESSING) {
        const relatedContent = currentContentItems.filter((c) => c.fetchingID === sFetch.fetchingID)
        pHistory.numberOfProcessingContent = relatedContent.length

        relatedContent.forEach((content) => {
          const pcStatus =
            pHistory.status === PROCESSING_STATUSES.SUCCESS
              ? PROCESSING_STATUSES.SUCCESS
              : randomItem([PROCESSING_STATUSES.SUCCESS, PROCESSING_STATUSES.FAILED])
          const pcDuration = randomInt(5, 60)
          const pcStartTime = new Date(pHistory.timestamp.getTime() + randomInt(1000, 5000))
          const pcEndTime = new Date(pcStartTime.getTime() + pcDuration * 1000)
          const stats = {
            rowsInserted: randomInt(50, 200),
            rowsUpdated: randomInt(0, 50),
            rowsIgnored: randomInt(0, 10),
          }
          currentProcessingContentHistory.push({
            processing_content_history_ID: processingContentHistoryIdCounter++,
            processingID: pHistory.processingID,
            contentID: content.contentID,
            processingStartTime: pcStartTime,
            processingEndTime: pcEndTime,
            processingTimeInSeconds: pcDuration,
            status: pcStatus,
            statistics: stats,
          })
        })
      }
      currentProcessingHistory.push(pHistory)
    })

    // Priprema podataka za UPDATE
    const lastFetch = currentFetchingHistory[currentFetchingHistory.length - 1]
    const lastProcess = currentProcessingHistory[currentProcessingHistory.length - 1]

    fluxUpdateData.push({
      id: flux.id,
      fetchingStatus: lastFetch?.status,
      processingStatus: lastProcess?.status,
      numberOfFetchingTimes: currentFetchingHistory.length,
      numberOfProcessingTimes: currentProcessingHistory.length,
      numberOfErrorFetching: currentFetchingHistory.filter((f) => f.status === FETCHING_STATUSES.FAILED).length,
      numberOfErrorsProcessing: currentProcessingHistory.filter((p) => p.status === PROCESSING_STATUSES.FAILED).length,
      numberOfSuccessFetching: currentFetchingHistory.filter((f) => f.status === FETCHING_STATUSES.SUCCESS).length,
      numberOfSuccessProcessing: currentProcessingHistory.filter((p) => p.status === PROCESSING_STATUSES.SUCCESS)
        .length,
      numberOfCurrentlyFetching: currentFetchingHistory.filter((f) => f.status === FETCHING_STATUSES.CURRENTLY_FETCHING)
        .length,
      numberOfCurrentlyProcessing: currentProcessingHistory.filter(
        (p) => p.status === PROCESSING_STATUSES.CURRENTLY_PROCESSING,
      ).length,
      fetchingProgress: lastFetch?.progress,
      processingProgress: lastProcess?.progress,
      lastFetchingDate: lastFetch?.timestamp,
      lastProcessingDate: lastProcess?.timestamp,
      lastDurationFetching: lastFetch?.fetchingTimeInSeconds,
      lastDurationProcessing: lastProcess?.processingTimeInSeconds,
    })

    fetchingHistoryData.push(...currentFetchingHistory)
    contentItemsData.push(...currentContentItems)
    processingHistoryData.push(...currentProcessingHistory)
    processingContentHistoryData.push(...currentProcessingContentHistory)
  }

  return {
    allFluxData,
    fetchingHistoryData,
    contentItemsData,
    processingHistoryData,
    processingContentHistoryData,
    fluxUpdateData,
  }
}

// --- GLAVNA IZVRŠNA FUNKCIJA ---
const main = async () => {
  try {
    console.log("🔄 Početak procesa popunjavanja baze podataka...")
    console.log("-------------------------------------------------")
    console.log("⚠️  UPOZORENJE: Skripta će obrisati postojeće tabele pre kreiranja novih.")
    console.log("-------------------------------------------------")

    // 1. Generisanje SQL-a za šemu
    console.log("1️⃣  Generisanje SQL šeme...")
    const schemaSql = createSchemaSQL()

    // 2. Generisanje podataka u memoriji
    console.log("2️⃣  Generisanje podataka u memoriji...")
    const {
      allFluxData,
      fetchingHistoryData,
      contentItemsData,
      processingHistoryData,
      processingContentHistoryData,
      fluxUpdateData,
    } = generateData()
    console.log(`   - Generisano ${allFluxData.length} flux unosa.`)
    console.log(`   - Generisano ${fetchingHistoryData.length} fetching history unosa.`)
    console.log(`   - Generisano ${contentItemsData.length} content item unosa.`)
    console.log(`   - Generisano ${processingHistoryData.length} processing history unosa.`)
    console.log(`   - Generisano ${processingContentHistoryData.length} processing content history unosa.`)

    // 3. Izvršavanje u transakciji
    console.log("3️⃣  Povezivanje na bazu i izvršavanje transakcije...")
    await sql.begin(async (tx) => {
      console.log("   - Izvršavanje DDL (kreiranje šeme)...")
      await tx.unsafe(schemaSql)

      console.log("   - Unos podataka u 'fluxData'...")
      if (allFluxData.length > 0) {
        await tx`INSERT INTO fluxData ${tx(
          allFluxData,
          "id",
          "name",
          "source",
          "fluxState",
          "comment",
          "description",
          "fetchScheduleType",
          "fetchScheduleConfiguration",
          "processingScheduleType",
          "processingScheduleConfiguration",
          "createdAt",
          "editedAt",
          "financialType",
          "fluxType",
          "fluxTypeConfiguration",
          "allowConcurrentMultiFetching",
        )}`
      }

      console.log("   - Unos podataka u 'fetchingHistory'...")
      if (fetchingHistoryData.length > 0) {
        await tx`INSERT INTO fetchingHistory ${tx(
          fetchingHistoryData,
          "fetchingID",
          "fluxID",
          "status",
          "timestamp",
          "completedAt",
          "fetchingTimeInSeconds",
          "progress",
          "numberOfContent",
          "errorMessage",
        )}`
      }

      console.log("   - Unos podataka u 'content_items'...")
      if (contentItemsData.length > 0) {
        await tx`INSERT INTO content_items ${tx(
          contentItemsData,
          "contentID",
          "fetchingID",
          "fluxID",
          "contentName",
          "contentShortName",
          "description",
          "fileSize",
          "contentLength",
          "fileType",
          "mimeType",
          "encoding",
          "hash",
          "createdAt",
          "modifiedAt",
          "sourceUrl",
        )}`
      }

      console.log("   - Unos podataka u 'processingHistory'...")
      if (processingHistoryData.length > 0) {
        await tx`INSERT INTO processingHistory ${tx(
          processingHistoryData,
          "processingID",
          "fluxID",
          "fetchingID",
          "status",
          "timestamp",
          "completedAt",
          "numberOfProcessingContent",
          "processingTimeInSeconds",
          "progress",
          "errorMessage",
        )}`
      }

      console.log("   - Unos podataka u 'processing_content_history'...")
      if (processingContentHistoryData.length > 0) {
        await tx`INSERT INTO processing_content_history ${tx(
          processingContentHistoryData,
          "processing_content_history_ID",
          "processingID",
          "contentID",
          "processingStartTime",
          "processingEndTime",
          "processingTimeInSeconds",
          "status",
          "statistics",
        )}`
      }

      console.log("   - Ažuriranje agregatnih polja u 'fluxData'...")
      if (fluxUpdateData.length > 0) {
        const promises = fluxUpdateData.map(
          (d) => tx`
          UPDATE fluxData SET
            fetchingStatus = ${d.fetchingStatus},
            processingStatus = ${d.processingStatus},
            numberOfFetchingTimes = ${d.numberOfFetchingTimes},
            numberOfProcessingTimes = ${d.numberOfProcessingTimes},
            numberOfErrorFetching = ${d.numberOfErrorFetching},
            numberOfErrorsProcessing = ${d.numberOfErrorsProcessing},
            numberOfSuccessFetching = ${d.numberOfSuccessFetching},
            numberOfSuccessProcessing = ${d.numberOfSuccessProcessing},
            numberOfCurrentlyFetching = ${d.numberOfCurrentlyFetching},
            numberOfCurrentlyProcessing = ${d.numberOfCurrentlyProcessing},
            fetchingProgress = ${d.fetchingProgress},
            processingProgress = ${d.processingProgress},
            lastFetchingDate = ${d.lastFetchingDate},
            lastProcessingDate = ${d.lastProcessingDate},
            lastDurationFetching = ${d.lastDurationFetching},
            lastDurationProcessing = ${d.lastDurationProcessing}
          WHERE id = ${d.id}
        `,
        )
        await Promise.all(promises)
      }

      console.log("   - Resetovanje sekvenci za SERIAL kolone...")
      await tx.unsafe(`
        SELECT setval('fluxdata_id_seq', (SELECT MAX(id) FROM fluxData));
        SELECT setval('fetchinghistory_fetchingid_seq', (SELECT MAX(fetchingID) FROM fetchingHistory));
        SELECT setval('content_items_contentid_seq', (SELECT MAX(contentID) FROM content_items));
        SELECT setval('processinghistory_processingid_seq', (SELECT MAX(processingID) FROM processingHistory));
        SELECT setval('processing_content_history_processing_content_history_id_seq', (SELECT MAX(processing_content_history_ID) FROM processing_content_history));
      `)
    })

    console.log("\n✅ Baza podataka je uspešno popunjena!")
  } catch (err) {
    console.error("\n❌ Došlo je do greške tokom izvršavanja skripte:", err)
  } finally {
    console.log("🔌 Zatvaranje konekcije sa bazom...")
    await sql.end()
  }
}

main()
