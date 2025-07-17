import sqlite3
import os
import json
import random
from datetime import datetime, timezone, timedelta
from faker import Faker

# --- CONSTANTS AND VALUE LISTS ---
TOTAL_FLUXES = 6000
DB_FILENAME = "hillmetrics.db"

SOURCES = ["Option 1", "Option 2", "Option 3", "Option 4"]
FLUX_STATES = {"ACTIVE": "Active", "DISABLED": "Disabled", "BACK_OFFICE": "Back office only"}
SCHEDULE_TYPES = {"ACTIVE": "Active", "INACTIVE": "Inactive"}
FETCHING_STATUSES = {"SUCCESS": "Success", "FAILED": "Failed", "CURRENTLY_FETCHING": "Currently fetching"}
PROCESSING_STATUSES = {"SUCCESS": "Success", "FAILED": "Failed", "CURRENTLY_PROCESSING": "Currently processing"}
FINANCIAL_TYPES = [
    "Fund", "Stock", "Bond", "ETF", "Cryptocurrency", "Derivative",
    "Commodity", "Forex", "Bench", "RealEstate", "Future",
    "PrivateEquity", "Spacs", "StructuredProduct", "Undefined"
]
FLUX_TYPES = ["Email", "API", "HTTP Download", "SFTP", "Webhook", "Scraping", "Manual"]
FREQUENCY_TYPES = ["Never", "Daily", "Immediately", "Every X Minutes", "Every X Hours", "Monthly", "Specific"]

FETCHING_ERROR_MESSAGES = [
    "Unsupported Content Location", "No Attachment", "Attachment Found But Does Not Match Attachment Rule",
    "Email Fetch Error", "Error While Processing Email", "Error While Processing Attachment",
    "Http Fetch Error", "One Attachment For Multiple Flux", "Inconsistent Metadata",
    "Flux Does Not Match Mail", "Unable To Deserialize Json Content", "Error When Trying To Link With Raw Database",
    "Already Exist In Raw Database", "Configuration Error", "Empty Content", "Custom Implementation Error",
    "Unknown Flux Type", "Undefined"
]

PROCESSING_ERROR_MESSAGES = [
    "Unable To Deserialize Json Content", "Different Data For A Same Product", "Currency Not Found",
    "Mic Not Found", "No Data To Process", "Link With Raw Database Is Not Set",
    "Exception Error", "Row Count Mismatch", "Insertion Error", "Financial Identifier Not Found"
]

# Initialize Faker
fake = Faker()

# --- HELPER FUNCTIONS ---
def random_item(arr):
    return random.choice(arr)

def random_int(min_val, max_val):
    return random.randint(min_val, max_val)

def random_bool(probability=0.5):
    return random.random() < probability

# Generate createdAt per distribution
fixed_now = datetime(2025, 6, 27, 12, 0, 0, tzinfo=timezone.utc)

def generate_created_at(index):
    percentage = index / TOTAL_FLUXES
    if percentage < 0.5:
        year = 2025
        if percentage < 0.05:
            month = 6  # June
            if random_bool(0.2):
                day = random_int(20, 27)
            else:
                day = random_int(1, 19)
        else:
            month = random_int(1, 5)  # Jan-May
            day = random_int(1, 28)
    elif percentage < 0.65:
        year = 2024
        month = random_int(1, 12)
        day = random_int(1, 28)
    elif percentage < 0.8:
        year = 2023
        month = random_int(1, 12)
        day = random_int(1, 28)
    else:
        year = 2022
        month = random_int(1, 12)
        day = random_int(1, 28)

    date = datetime(year, month, day,
                    random_int(0, 23), random_int(0, 59), random_int(0, 59),
                    tzinfo=timezone.utc)
    return date

# Generate JSON config for schedule
def generate_schedule_config(type_):
    if type_ == "Never":
        return {"type": type_}
    if type_ == "Immediately":
        return {"type": type_}
    if type_ == "Daily":
        return {"type": type_, "intervalDays": random_int(1, 90)}
    if type_ == "Every X Minutes":
        return {"type": type_, "intervalMinutes": random_int(1, 50)}
    if type_ == "Every X Hours":
        return {"type": type_, "intervalHours": random_int(1, 23)}
    if type_ == "Monthly":
        return {
            "type": type_,
            "dayOfMonth": random_int(1, 28),
            "startTime": f"{random_int(0,23):02d}:{random_int(0,59):02d}"
        }
    if type_ == "Specific":
        return {"type": type_, "hours": [random_int(0, 23)], "minutes": [random_int(0, 59)]}
    return {}

# Generate JSON config for fluxType
def generate_flux_type_config(flux_type):
    if flux_type == "Email":
        return {
            "contentLocation": "Body",
            "emailRuleGroup": [{"criteria": [{"field": "Subject", "operator": "Contains", "value": fake.word()}]}],
            "metadata": {"source": fake.email()}
        }
    if flux_type == "API":
        return {"apiUrl": fake.url(), "apiKey": fake.uuid4(), "metadata": {"version": "v1"}}
    if flux_type == "HTTP Download":
        return {"url": fake.url(), "contentType": "application/json", "metadata": {}}
    if flux_type == "SFTP":
        return {
            "host": fake.domain_name(),
            "port": 22,
            "user": fake.user_name(),
            "password": fake.password(),
            "deleteAfterDownload": random_bool(),
            "useSshKey": random_bool(0.2),
            "fileGroups": [{"path": "/remote/path/", "pattern": "*.csv"}]
        }
    if flux_type == "Webhook":
        return {"url": f"{fake.url()}/webhook", "apiKey": fake.uuid4(), "metadata": {}}
    if flux_type == "Scraping":
        return {"url": fake.url(), "contentType": "text/html", "metadata": {"selector": ".data-table"}}
    if flux_type == "Manual":
        return {"url": "manual_upload", "contentType": "user_defined", "metadata": {}}
    return {}

# Generate short content name
def generate_short_content_name(long_name):
    parts = long_name.replace('/', '_').split('_')
    if len(parts) > 2:
        return "_".join(parts[:3])[:50]
    return long_name[:50]

# --- DATABASE SCHEMA CREATION ---
def create_schema(conn):
    schema = """
    PRAGMA foreign_keys = ON;

    CREATE TABLE fluxData (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        source TEXT,
        fluxState TEXT,
        comment TEXT,
        description TEXT,
        fetchScheduleType TEXT,
        fetchScheduleConfiguration TEXT,
        processingScheduleType TEXT,
        processingScheduleConfiguration TEXT,
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
        lastFetchingDate TEXT,
        lastProcessingDate TEXT,
        lastDurationFetching INTEGER,
        lastDurationProcessing INTEGER,
        createdAt TEXT NOT NULL,
        editedAt TEXT,
        financialType TEXT,
        fluxType TEXT,
        fluxTypeConfiguration TEXT,
        allowConcurrentMultiFetching INTEGER
    );

    CREATE TABLE fetchingHistory (
        fetchingID INTEGER PRIMARY KEY AUTOINCREMENT,
        fluxID INTEGER NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        completedAt TEXT,
        fetchingTimeInSeconds INTEGER,
        progress REAL,
        numberOfContent INTEGER,
        errorMessage TEXT,
        FOREIGN KEY (fluxID) REFERENCES fluxData(id) ON DELETE CASCADE
    );

    CREATE TABLE content_items (
        contentID INTEGER PRIMARY KEY AUTOINCREMENT,
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
        createdAt TEXT,
        modifiedAt TEXT,
        sourceUrl TEXT,
        FOREIGN KEY (fetchingID) REFERENCES fetchingHistory(fetchingID) ON DELETE CASCADE,
        FOREIGN KEY (fluxID) REFERENCES fluxData(id) ON DELETE CASCADE
    );

    CREATE TABLE processingHistory (
        processingID INTEGER PRIMARY KEY AUTOINCREMENT,
        fluxID INTEGER NOT NULL,
        fetchingID INTEGER NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        completedAt TEXT,
        numberOfProcessingContent INTEGER,
        processingTimeInSeconds INTEGER,
        progress REAL,
        errorMessage TEXT,
        FOREIGN KEY (fluxID) REFERENCES fluxData(id) ON DELETE CASCADE,
        FOREIGN KEY (fetchingID) REFERENCES fetchingHistory(fetchingID) ON DELETE CASCADE
    );

    CREATE TABLE processing_content_history (
        processing_content_history_ID INTEGER PRIMARY KEY AUTOINCREMENT,
        processingID INTEGER NOT NULL,
        contentID INTEGER NOT NULL,
        processingStartTime TEXT,
        processingEndTime TEXT,
        processingTimeInSeconds INTEGER,
        status TEXT NOT NULL,
        statistics TEXT,
        FOREIGN KEY (processingID) REFERENCES processingHistory(processingID) ON DELETE CASCADE,
        FOREIGN KEY (contentID) REFERENCES content_items(contentID) ON DELETE CASCADE
    );

    CREATE INDEX idx_fetchinghistory_fluxid ON fetchingHistory(fluxID);
    CREATE INDEX idx_processinghistory_fluxid ON processingHistory(fluxID);
    CREATE INDEX idx_contentitems_fluxid ON content_items(fluxID);
    CREATE INDEX idx_processing_content_history_processingid ON processing_content_history(processingID);
    CREATE INDEX idx_processing_content_history_contentid ON processing_content_history(contentID);
    """
    conn.executescript(schema)

# --- DATA GENERATION ---
def generate_data(conn):
    print(f"Generating {TOTAL_FLUXES} flux entries...")
    cursor = conn.cursor()
    for i in range(1, TOTAL_FLUXES + 1):
        if i % 100 == 0:
            print(f"  - Generated {i}/{TOTAL_FLUXES} fluxes...")

        # 1. Basic fluxData generation
        created_at = generate_created_at(i)
        created_at_iso = created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        edited_at_iso = None
        if random_bool(0.3):
            edited_at = created_at + timedelta(days=random_int(1, 100))
            edited_at_iso = edited_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        else:
            edited_at_iso = created_at_iso

        flux_type = random_item(FLUX_TYPES)
        name = f"{fake.company()} {random_item(FINANCIAL_TYPES)} {flux_type} Flux"

        roll = random.random()
        if roll < 0.7:
            flux_state = FLUX_STATES["ACTIVE"]
        elif roll < 0.9:
            flux_state = FLUX_STATES["BACK_OFFICE"]
        else:
            flux_state = FLUX_STATES["DISABLED"]

        fetch_schedule_type = SCHEDULE_TYPES["ACTIVE"] if random_bool(0.8) else SCHEDULE_TYPES["INACTIVE"]
        processing_schedule_type = SCHEDULE_TYPES["ACTIVE"] if random_bool(0.8) else SCHEDULE_TYPES["INACTIVE"]

        fetch_cfg = generate_schedule_config(random_item(FREQUENCY_TYPES)) if fetch_schedule_type == SCHEDULE_TYPES["ACTIVE"] else {}
        proc_cfg = generate_schedule_config(random_item(FREQUENCY_TYPES)) if processing_schedule_type == SCHEDULE_TYPES["ACTIVE"] else {}

        cursor.execute(
            """
INSERT INTO fluxData (
    id, name, source, fluxState, comment, description,
    fetchScheduleType, fetchScheduleConfiguration,
    processingScheduleType, processingScheduleConfiguration,
    createdAt, editedAt, financialType, fluxType,
    fluxTypeConfiguration, allowConcurrentMultiFetching
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""",
            (
                i,
                name,
                random_item(SOURCES),
                flux_state,
                fake.sentence() if random_bool(0.8) else None,
                fake.paragraph() if random_bool(0.8) else None,
                fetch_schedule_type,
                json.dumps(fetch_cfg),
                processing_schedule_type,
                json.dumps(proc_cfg),
                created_at_iso,
                edited_at_iso,
                random_item(FINANCIAL_TYPES),
                flux_type,
                json.dumps(generate_flux_type_config(flux_type)),
                1 if random_bool(0.02) else 0
            )
        )
        flux_id = i

        if flux_state == FLUX_STATES["DISABLED"]:
            continue

        # 2. History generation
        num_history = random_int(5, 50)
        last_successful_fetch = None
        for j in range(num_history):
            is_last = (j == num_history - 1)
            # Fetching
            if is_last:
                final_roll = random.random()
                if final_roll < 0.75:
                    fetch_status = FETCHING_STATUSES["SUCCESS"]
                elif final_roll < 0.95:
                    fetch_status = FETCHING_STATUSES["FAILED"]
                else:
                    fetch_status = FETCHING_STATUSES["CURRENTLY_FETCHING"]
            else:
                fetch_status = FETCHING_STATUSES["SUCCESS"] if random.random() < 0.9 else FETCHING_STATUSES["FAILED"]

            fetch_ts = created_at + timedelta(days=j, seconds=random_int(1000, 100000))
            fetch_ts_iso = fetch_ts.strftime("%Y-%m-%dT%H:%M:%SZ")
            duration = random_int(5, 120)
            completed_at_iso = None
            if fetch_status != FETCHING_STATUSES["CURRENTLY_FETCHING"]:
                completed_at = fetch_ts + timedelta(seconds=duration)
                completed_at_iso = completed_at.strftime("%Y-%m-%dT%H:%M:%SZ")

            progress = (
                100 if fetch_status == FETCHING_STATUSES["SUCCESS"] else
                random_int(10, 90) if fetch_status == FETCHING_STATUSES["CURRENTLY_FETCHING"] else
                random_int(0, 80)
            )
            num_content = random_int(1, 5) if fetch_status == FETCHING_STATUSES["SUCCESS"] else 0

            cursor.execute(
                """
INSERT INTO fetchingHistory (
    fluxID, status, timestamp, completedAt,
    fetchingTimeInSeconds, progress,
    numberOfContent, errorMessage
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
""",
                (
                    flux_id,
                    fetch_status,
                    fetch_ts_iso,
                    completed_at_iso,
                    duration if fetch_status != FETCHING_STATUSES["CURRENTLY_FETCHING"] else None,
                    progress,
                    num_content,
                    random_item(FETCHING_ERROR_MESSAGES) if fetch_status == FETCHING_STATUSES["FAILED"] else None
                )
            )
            fetching_id = cursor.lastrowid

            if fetch_status == FETCHING_STATUSES["SUCCESS"]:
                last_successful_fetch = (fetching_id, fetch_ts + timedelta(seconds=duration))
                for _ in range(num_content):
                    content_name = fake.file_name(extension=random_item(["csv", "xls", "json", "xml"]))
                    content_short = generate_short_content_name(content_name)
                    now_iso = fetch_ts.strftime("%Y-%m-%dT%H:%M:%SZ")
                    cursor.execute(
                        """
INSERT INTO content_items (
    fetchingID, fluxID, contentName, contentShortName,
    description, fileSize, contentLength,
    fileType, mimeType, encoding, hash,
    createdAt, modifiedAt, sourceUrl
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
""",
                        (
                            fetching_id,
                            flux_id,
                            content_name,
                            content_short,
                            fake.sentence(),
                            random_int(1024, 1024*1024),
                            random_int(1000, 1024*1000),
                            os.path.splitext(content_name)[1].lstrip('.'),
                            fake.mime_type(),
                            "UTF-8",
                            fake.hexify('^'*64),
                            now_iso,
                            now_iso,
                            fake.url()
                        )
                    )

            # Processing
            if last_successful_fetch and random_bool(0.8):
                if is_last:
                    final_roll = random.random()
                    if final_roll < 0.75:
                        proc_status = PROCESSING_STATUSES["SUCCESS"]
                    elif final_roll < 0.95:
                        proc_status = PROCESSING_STATUSES["FAILED"]
                    else:
                        proc_status = PROCESSING_STATUSES["CURRENTLY_PROCESSING"]
                else:
                    proc_status = PROCESSING_STATUSES["SUCCESS"] if random.random() < 0.9 else PROCESSING_STATUSES["FAILED"]

                proc_start = last_successful_fetch[1] + timedelta(seconds=random_int(10000, 60000))
                proc_start_iso = proc_start.strftime("%Y-%m-%dT%H:%M:%SZ")
                proc_dur = random_int(10, 300)
                proc_end_iso = None
                if proc_status != PROCESSING_STATUSES["CURRENTLY_PROCESSING"]:
                    proc_end = proc_start + timedelta(seconds=proc_dur)
                    proc_end_iso = proc_end.strftime("%Y-%m-%dT%H:%M:%SZ")

                proc_prog = (
                    100 if proc_status == PROCESSING_STATUSES["SUCCESS"] else
                    random_int(10, 90) if proc_status == PROCESSING_STATUSES["CURRENTLY_PROCESSING"] else
                    random_int(0, 80)
                )

                cursor.execute(
                    """
INSERT INTO processingHistory (
    fluxID, fetchingID, status, timestamp,
    completedAt, numberOfProcessingContent,
    processingTimeInSeconds, progress, errorMessage
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
""",
                    (
                        flux_id,
                        last_successful_fetch[0],
                        proc_status,
                        proc_start_iso,
                        proc_end_iso,
                        0,
                        proc_dur if proc_status != PROCESSING_STATUSES["CURRENTLY_PROCESSING"] else None,
                        proc_prog,
                        random_item(PROCESSING_ERROR_MESSAGES) if proc_status == PROCESSING_STATUSES["FAILED"] else None
                    )
                )
                processing_id = cursor.lastrowid

                # processing_content_history
                if proc_status == PROCESSING_STATUSES["SUCCESS"]:
                    cursor.execute(
                        "SELECT contentID FROM content_items WHERE fetchingID = ?",
                        (last_successful_fetch[0],)
                    )
                    items = cursor.fetchall()
                    for item in items:
                        start_ct = proc_start + timedelta(seconds=random_int(1000, 5000))
                        dur_ct = random_int(5, 60)
                        end_ct = start_ct + timedelta(seconds=dur_ct)
                        stats = {
                            "rowsInserted": random_int(50, 200),
                            "rowsUpdated": random_int(0, 50),
                            "rowsIgnored": random_int(0, 10)
                        }
                        cursor.execute(
                            """
INSERT INTO processing_content_history (
    processingID, contentID,
    processingStartTime, processingEndTime,
    processingTimeInSeconds, status, statistics
) VALUES (?, ?, ?, ?, ?, ?, ?)
""",
                            (
                                processing_id,
                                item[0],
                                start_ct.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                end_ct.strftime("%Y-%m-%dT%H:%M:%SZ"),
                                dur_ct,
                                PROCESSING_STATUSES["SUCCESS"],
                                json.dumps(stats)
                            )
                        )
                    cursor.execute(
                        "UPDATE processingHistory SET numberOfProcessingContent = ? WHERE processingID = ?",
                        (len(items), processing_id)
                    )

        # 3. Update aggregates
        agg_query = """
WITH LatestFetching AS (
    SELECT * FROM fetchingHistory WHERE fluxID = ? ORDER BY timestamp DESC LIMIT 1
), LatestProcessing AS (
    SELECT * FROM processingHistory WHERE fluxID = ? ORDER BY timestamp DESC LIMIT 1
), Counts AS (
    SELECT
        COUNT(*) AS totalFetches,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) AS successFetches,
        SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) AS errorFetches,
        SUM(CASE WHEN status = 'Currently fetching' THEN 1 ELSE 0 END) AS currentFetches
    FROM fetchingHistory WHERE fluxID = ?
), ProcessingCounts AS (
    SELECT
        COUNT(*) AS totalProcesses,
        SUM(CASE WHEN status = 'Success' THEN 1 ELSE 0 END) AS successProcesses,
        SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) AS errorProcesses,
        SUM(CASE WHEN status = 'Currently processing' THEN 1 ELSE 0 END) AS currentProcesses
    FROM processingHistory WHERE fluxID = ?
)
SELECT
    lf.status AS fetchingStatus,
    lp.status AS processingStatus,
    c.totalFetches,
    pc.totalProcesses,
    c.errorFetches,
    pc.errorProcesses,
    c.successFetches,
    pc.successProcesses,
    c.currentFetches,
    pc.currentProcesses,
    lf.progress AS fetchingProgress,
    lp.progress AS processingProgress,
    lf.timestamp AS lastFetchingDate,
    lp.timestamp AS lastProcessingDate,
    lf.fetchingTimeInSeconds AS lastDurationFetching,
    lp.processingTimeInSeconds AS lastDurationProcessing
FROM LatestFetching lf
LEFT JOIN LatestProcessing lp ON lp.fluxID = lf.fluxID
CROSS JOIN Counts c
CROSS JOIN ProcessingCounts pc
"""
        cursor.execute(agg_query, (flux_id, flux_id, flux_id, flux_id))
        stats = cursor.fetchone()
        if stats:
            cursor.execute(
                """
UPDATE fluxData SET
    fetchingStatus = ?, processingStatus = ?,
    numberOfFetchingTimes = ?, numberOfProcessingTimes = ?,
    numberOfErrorFetching = ?, numberOfErrorsProcessing = ?,
    numberOfSuccessFetching = ?, numberOfSuccessProcessing = ?,
    numberOfCurrentlyFetching = ?, numberOfCurrentlyProcessing = ?,
    fetchingProgress = ?, processingProgress = ?,
    lastFetchingDate = ?, lastProcessingDate = ?,
    lastDurationFetching = ?, lastDurationProcessing = ?
WHERE id = ?
""",
                (
                    stats["fetchingStatus"], stats["processingStatus"],
                    stats["totalFetches"] or 0, stats["totalProcesses"] or 0,
                    stats["errorFetches"] or 0, stats["errorProcesses"] or 0,
                    stats["successFetches"] or 0, stats["successProcesses"] or 0,
                    stats["currentFetches"] or 0, stats["currentProcesses"] or 0,
                    stats["fetchingProgress"], stats["processingProgress"],
                    stats["lastFetchingDate"], stats["lastProcessingDate"],
                    stats["lastDurationFetching"], stats["lastDurationProcessing"],
                    flux_id
                )
            )
    conn.commit()

# --- MAIN EXECUTION ---
def main():
    if os.path.exists(DB_FILENAME):
        os.remove(DB_FILENAME)
        print(f"Deleted existing database: {DB_FILENAME}")
    conn = sqlite3.connect(DB_FILENAME)
    conn.row_factory = sqlite3.Row
    print("Starting database generation process...")
    create_schema(conn)
    generate_data(conn)
    conn.close()
    print(f"✅ Successfully created and populated database: {DB_FILENAME}")

if __name__ == "__main__":
    main()
