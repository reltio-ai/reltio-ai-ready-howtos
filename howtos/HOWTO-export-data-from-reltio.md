# HOWTO: Export Data from Reltio

A step-by-step guide to exporting entities, relations, activity logs, and merge trees from Reltio — using the Export Service API and the Console UI.

---

## Table of contents

| Step | What you'll do |
|------|----------------|
| [1](#step-1-understand-how-reltio-export-works) | Understand how Reltio export works |
| [2](#step-2-get-your-export-service-url) | Get your Export Service URL |
| [3](#step-3-export-entities) | Export entities |
| [4](#step-4-export-with-filters) | Export with filters |
| [5](#step-5-export-relations) | Export relations |
| [6](#step-6-export-activity-log-data) | Export activity log data |
| [7](#step-7-check-export-task-status) | Check export task status |
| [8](#step-8-split-exports-into-multiple-files) | Split exports into multiple files |
| [9](#step-9-export-using-the-console-ui) | Export using the Console UI |

---

## Prerequisites

You need these before starting:

| What | Example | Where to get it |
|------|---------|-----------------|
| **Client ID** | `my_app_client` | Reltio Console > Security > Client Credentials |
| **Client Secret** | `s3cretV4lue` | Same location as Client ID |
| **Tenant ID** | `HKlMR3wNbRT3PMo` | Reltio Console > Tenant overview |
| **Environment URL** | `https://na07-prod.reltio.com` | Your Reltio admin |
| **Access token** | `eyJhbGciOiJSUzI1NiIs...` | See [HOWTO: Authenticate](./HOWTO-authenticate-and-use-reltio-apis.md) |

### Set up your environment variables

```bash
export TOKEN="eyJhbGciOiJSUzI1NiIs..."
export TENANT="https://na07-prod.reltio.com/reltio/api/HKlMR3wNbRT3PMo"
export EXPORT_URL="https://na07-prod.reltio.com/jobs"
```

> **Note:** The `EXPORT_URL` is your Reltio instance name plus `/jobs`. Replace `na07-prod.reltio.com` with your actual environment hostname.

### Install tools

All examples use `curl`. Install `jq` for readable JSON output (`brew install jq` / `apt install jq`).

### Key thing to know before you start

Your export permissions match your Reltio Server access — the same data you can read via the API, you can export.

---

## Step 1: Understand how Reltio export works

The Export Service extracts data from Reltio and uploads the results as CSV or JSON files to cloud storage (AWS S3, Google Cloud Storage, or Azure Blob Storage). You receive an email with download links when the job finishes.

### The 3-stage workflow

Every export follows the same pattern:

```
1. Schedule a new export job (API returns a task ID)
         │
         ▼
2. Track the task status (using the task ID)
         │
         ▼
3. Receive an email with links to the output file(s)
```

### What you can export

| Data type | API endpoint | What it includes |
|-----------|-------------|-----------------|
| **Entities** | `POST {ExportServiceURL}/export/{tenant}/entities` | All entity attributes, crosswalks, and metadata |
| **Relations** | `POST {ExportServiceURL}/export/{tenant}/relations` | Relation attributes, start/end object references |
| **Activity log** | `POST {ExportServiceURL}/export/{tenant}/activities` | Audit trail of changes (defaults to last 4 months) |
| **Merge tree** | Entity Management API (separate endpoint) | Merge history and contributor tracking |

### Output formats

| Format | Best for | Notes |
|--------|----------|-------|
| **CSV** | Spreadsheets, flat-file integrations | Default format. Two variants: Flattened (default) and Exploded |
| **JSON** | API integrations, programmatic processing | More efficient than CSV export |

### Compression formats

| Format | Extension | Description |
|--------|-----------|-------------|
| **GZIP** | `.gz` | Default. Compresses a single file. Better compression ratio for individual files |
| **ZIP** | `.zip` | Compresses multiple files and directories into one archive |

---

## Step 2: Get your Export Service URL

The Export Service URL follows this pattern:

```
https://{environment}.reltio.com/jobs
```

For example, if your environment is `na07-prod.reltio.com`, your Export Service URL is:

```
https://na07-prod.reltio.com/jobs
```

Save it as an environment variable for the rest of this guide:

```bash
export EXPORT_URL="https://na07-prod.reltio.com/jobs"
```

> **Note:** Replace `na07-prod.reltio.com` with your actual Reltio environment hostname.

---

## Step 3: Export entities

**API:** `POST {ExportServiceURL}/export/{tenant}/entities`

This is the most common export. It filters and exports all entities (or a subset), uploads the result to cloud storage, and sends you an email with download links.

### Request

Export all entities as CSV, including only Operational Values (OV):

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true
  }' | jq .
```

### Response

```json
{
  "exportType": "ENTITIES",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": [
    "831272d6-1685-49cc-a98c-c8965d04bc0d"
  ]
}
```

Save the task ID — you'll use it to track the export status.

```bash
export TASK_ID="831272d6-1685-49cc-a98c-c8965d04bc0d"
```

### Key parameters

| Parameter | Type | Default | What it does |
|-----------|------|---------|-------------|
| `fileFormat` | Query | `csv` | Output format: `csv` or `json`. JSON is more efficient |
| `dateFormat` | Query | `timestamp` | Date format: `timestamp` or `readable` |
| `activeness` | Query | `ALL` | Which entities: `ALL`, `ACTIVE`, or `NOT_ACTIVE` |
| `skipPostprocessing` | Query | `true` | If `true`, returns links to raw partial files. If `false`, combines files first |
| `select` | Query | All fields | Comma-separated list of fields to export (e.g., `type,attributes.FirstName`) |
| `email` | Query | Requesting user | Comma-separated email addresses for notifications |
| `sendHidden` | Query | `true` | Include hidden attributes in the export |

### Key body parameters

| Parameter | Type | Default | What it does |
|-----------|------|---------|-------------|
| `ovOnly` | Boolean | `true` | If `true`, exports only attributes with `ov=true` (**Operational Values** — the winning values chosen by survivorship rules) |
| `includeType` | JSON array | All types | Limits export to specific entity types |
| `updateTimeFilter` | JSON object | None | Filters by update time range: `{"since": 1394726957000, "to": 1394726959000}` |

> **Tip:** Export to JSON when you're feeding the data into another system programmatically — it's more efficient than CSV.

### What can go wrong

| Error | Cause | Fix |
|-------|-------|-----|
| `401` | Token expired | Get a fresh token |
| `PERIODIC_TASKS_PER_TENANT_LIMIT_EXCEEDED` | Too many background tasks running | Wait for current tasks to complete before starting new ones |

---

## Step 4: Export with filters

You don't always want to export everything. Use filters and body parameters to narrow the export to exactly what you need.

### Export specific entity types

Export only `Individual` entities updated since a specific timestamp:

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true,
    "includeType": [
      "configuration/entityTypes/Individual"
    ],
    "updateTimeFilter": {
      "since": 1394726957000
    }
  }' | jq .
```

### Export with a query filter

Use the `filter` query parameter to apply conditions — the same filter syntax as the Entities API:

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities?filter=equals(type,'configuration/entityTypes/Individual')" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

### Export only specific fields

Use the `select` query parameter to limit which fields appear in the output:

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities?select=type,attributes.FirstName,attributes.Address.City,createdTime" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true
  }' | jq .
```

### Export only active entities

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities?activeness=ACTIVE" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true
  }' | jq .
```

### Export as JSON instead of CSV

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities?fileFormat=json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true
  }' | jq .
```

> **Note:** The query `filter` parameter takes priority over the body `filter` parameter if both are specified.

---

## Step 5: Export relations

**API:** `POST {ExportServiceURL}/export/{tenant}/relations`

Exports relations (links between entities) in the same way as entity exports — uploads the result to cloud storage and emails you the download links.

### Request

Export all relations as CSV:

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/relations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true,
    "includeType": [
      "configuration/relationTypes/Employment"
    ]
  }' | jq .
```

### Response

```json
{
  "exportType": "RELATIONS",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": [
    "57fd98c7-924f-443c-b7bc-902b41a60a2e"
  ]
}
```

### Relation-specific parameters

Relations exports support most of the same parameters as entity exports, plus a few extra:

| Parameter | Type | Default | What it does |
|-----------|------|---------|-------------|
| `returnVotes` | Query | `false` | Include votes in the export |
| `sePrefix` | Query | `false` | Add `StartObject`/`EndObject` prefixes to CSV columns |
| `options` | Query | None | Comma-separated options: `searchByOv`, `resolveMergedEntities`, `resolveRelationEdgeTypes`, `parallelExecution` |

> **Tip:** Use the `resolveMergedEntities` option to get winner URIs for start/end objects — useful when entities have been merged since the relation was created.

---

## Step 6: Export activity log data

**API:** `POST {ExportServiceURL}/export/{tenant}/activities`

Exports the audit trail of changes made to your tenant's data. By default, this returns the last 4 months of activity.

### Request

Export all activity log data (last 4 months by default):

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

### Response

```json
{
  "exportType": "ACTIVITY_LOG",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": [
    "f30e5d99-a57d-46fb-bad0-70b2575fdd26"
  ]
}
```

### Export activity data for a specific time range

Use the `filter` query parameter with a `timestamp` condition to override the 4-month default. The timestamp value is in milliseconds:

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/activities?filter=gt(timestamp,1560800276000)" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
```

This exports all activities from June 17, 2019 onward.

> **Note:** As a best practice, always specify a time period filter when exporting activity log data. Retention and searching limits for activity log data are governed by your tenant's quotas and limits.

---

## Step 7: Check export task status

**API:** `GET {ExportServiceURL}/tasks`

Export jobs run asynchronously. After you schedule one, use the Tasks API to check its progress.

### Request

Get all active export tasks:

```bash
curl -s -X GET "${EXPORT_URL}/tasks" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

### Response

```json
[
  {
    "id": "7fe02b5b-9685-4f4e-b8c2-3cf6819dbf89",
    "type": "com.reltio.export.tasks.v4.ExportTask",
    "status": "PROCESSING",
    "name": "entity-export-task[...]",
    "parameters": {
      "tenantId": "HKlMR3wNbRT3PMo",
      "fileFormat": "CSV",
      "exportType": "ENTITIES",
      ...
    },
    "currentState": {
      "numberOfObjects": 507016,
      "numberOfProcessedObjects": 123456,
      "status": "Processing"
    }
  }
]
```

### Task statuses

| Status | What it means |
|--------|--------------|
| `SCHEDULED` | Job is queued and waiting to start |
| `PROCESSING` | Job is actively exporting data |
| `COMPLETED` | Job finished — check your email for download links |
| `PAUSING` | Job is being paused |
| `PAUSED` | Job is paused |
| `CANCELING` | Job is being canceled |
| `WAITING` | Job is waiting for a dependency |
| `WAITING_FOR_RESOURCE` | Job is temporarily suspended because your tenant has too many active tasks |

### Pagination

Use `max` and `offset` to paginate through active tasks:

```bash
curl -s -X GET "${EXPORT_URL}/tasks?max=10&offset=0" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

### Force stop a running export

If you need to cancel an export job, use the force stop API:

```bash
curl -s -X PUT "${EXPORT_URL}/tasks/${TASK_ID}/_forceStop" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

**Response:**

```json
{
  "status": "success"
}
```

> **Note:** Force stop is available to Administrators only.

---

## Step 8: Split exports into multiple files

For large exports, split the output into multiple files using the `partSize` parameter. Each file is capped at the size you specify (before compression).

### How it works

1. Add `partSize` to your export request as a query parameter.
2. Set `skipPostprocessing=false` — `partSize` is ignored when `skipPostprocessing` is `true`.
3. The Export Service splits the output into files no larger than your `partSize` value.
4. Download links appear in the task's `currentState.exportUrls` field (an array of strings).

### Supported size formats

| Format | Description | Example |
|--------|-------------|---------|
| `[X]` or `[X]b` | Size in bytes | `104857600` (100 MB) |
| `[X]k` or `[X]kb` | Size in kilobytes | `102400k` |
| `[X]m` or `[X]mb` | Size in megabytes | `100m` (100 MB) |
| `[X]g` or `[X]gb` | Size in gigabytes | `1GB` |
| `[X]t` or `[X]tb` | Size in terabytes | `1T` |

> **Important:** The minimum `partSize` is **100 MB** (104857600 bytes). You can't specify a smaller value.

### Request

Export entities split into 100 MB files:

```bash
curl -s -X POST "${EXPORT_URL}/export/HKlMR3wNbRT3PMo/entities?partSize=100m&skipPostprocessing=false" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true
  }' | jq .
```

### How download links differ

| Scenario | Download link field | Type |
|----------|-------------------|------|
| **Without** `partSize` | `currentState.exportUrl` | String (single URL) |
| **With** `partSize` | `currentState.exportUrls` | Array of strings (one URL per file part) |

Output files follow the naming convention `_part_[N]`, where `[N]` is the file number.

### Which endpoints support splitting

- `POST {ExportServiceURL}/export/{tenant}/entities`
- `POST {ExportServiceURL}/export/{tenant}/entities/_crosswalksTree`
- `POST {ExportServiceURL}/export/{tenant}/relations`
- `POST {ExportServiceURL}/export/{tenant}/activities`

> **Note:** The `partSize` controls the **unarchived** size of each output file. For example, `partSize=100m` means each uncompressed file is 100 MB — the downloaded `.zip` or `.gz` file will be smaller due to compression.

---

## Step 9: Export using the Console UI

If you prefer a visual interface over the API, use the Export application in Reltio Console.

### Steps

1. In the Hub or in [Reltio Console](https://console.reltio.com), select **Export**, then select **New Export Job**.
2. Select and filter the data to export. Use the filters to refine your selection.
3. Choose your job details:
   - **File format**: CSV Flattened, JSON, or CSV Exploded
4. Select **Run**.
5. Once the job appears in the **COMPLETED** list, download the export file(s).

> **Important:** The **CSV Exploded** format can result in low export performance, large export files, or failure of the export job. The more values that entities have, the higher the risk. Use **CSV Flattened** or **JSON** instead.

---

## Quick reference

### All endpoints at a glance

| # | Operation | Method | Endpoint |
|---|-----------|--------|----------|
| 1 | Export entities | `POST` | `{ExportServiceURL}/export/{tenant}/entities` |
| 2 | Export relations | `POST` | `{ExportServiceURL}/export/{tenant}/relations` |
| 3 | Export activity log | `POST` | `{ExportServiceURL}/export/{tenant}/activities` |
| 4 | Export crosswalks tree | `POST` | `{ExportServiceURL}/export/{tenant}/entities/_crosswalksTree` |
| 5 | Get active tasks | `GET` | `{ExportServiceURL}/tasks` |
| 6 | Force stop a task | `PUT` | `{ExportServiceURL}/tasks/{taskId}/_forceStop` |

### Common query parameters (all export endpoints)

| Parameter | Default | Values |
|-----------|---------|--------|
| `fileFormat` | `csv` | `csv`, `json` |
| `dateFormat` | `timestamp` | `timestamp`, `readable` |
| `activeness` | `ALL` | `ALL`, `ACTIVE`, `NOT_ACTIVE` |
| `skipPostprocessing` | `true` | `true`, `false` |
| `partSize` | Not set (unlimited) | Human-readable size (e.g., `100m`). Minimum: 100 MB |
| `email` | Requesting user | Comma-separated email addresses |

### Export response structure

Every export request returns the same JSON structure:

```json
{
  "exportType": "ENTITIES",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": ["task-id-here"]
}
```

### File naming convention

Output files follow this default pattern:

```
part_00000.csv.gz
part_00001.csv.gz
part_00002.csv.gz
```

The numbering starts from zero. Each output file name is unique.

---

## Further reading

- [Export Service APIs](https://docs.reltio.com/en/developer-resources/load-and-export-apis/load-and-export-apis-at-a-glance/export-service-apis) — API reference
- [Export entities](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/export-entities) — Full parameter reference
- [Export relations](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/export-relations) — Full parameter reference
- [Exporting Activity Log Data](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/exporting-activity-log-data) — Activity log export details
- [Export data using Reltio export service](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service) — Overview of the export service
- [Export data into multiple files](https://docs.reltio.com/en/developer-resources/load-and-export-apis/load-and-export-apis-at-a-glance/export-service-apis/export-data-into-multiple-files) — `partSize` parameter details
- [Storing export results](https://docs.reltio.com/en/developer-resources/load-and-export-apis/load-and-export-apis-at-a-glance/export-service-apis/store-export-results) — Custom S3/GCS/Azure destinations
- [Create and run an export job](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/create-and-run-an-export-job) — Console UI export walkthrough

---

> **Disclaimer:** This guide was generated with AI assistance using official Reltio documentation as source material. While every effort has been made to ensure accuracy, Reltio product behavior may change between releases. Always verify critical steps against your own Reltio environment and the [official documentation](https://docs.reltio.com). Last validated against documentation dated March 31, 2026.

*Guide based on Reltio documentation (March 2026).*
