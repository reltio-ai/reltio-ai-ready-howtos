# HOWTO: Export Data from Reltio

Export entities, relations, activity logs, and merge trees from the Reltio Context Intelligence Platform using the Export Service API or the Console UI Export application.

## Overview

This guide covers the two methods for exporting data from Reltio: the Export Service API for automation and integration pipelines, and the Export application in the Console UI for interactive, one-off exports. It explains supported data types, output formats, file splitting, and job monitoring.

**Audience:** Developer, Data Product Owner, System Administrator

## Contents

1. [Getting started](#1-getting-started)
2. [Export entities via API](#2-export-entities-via-api)
3. [Export relations via API](#3-export-relations-via-api)
4. [Export activity log data via API](#4-export-activity-log-data-via-api)
5. [Monitor and manage export tasks](#5-monitor-and-manage-export-tasks)
6. [Split exports into multiple files](#6-split-exports-into-multiple-files)
7. [Export using the Console UI](#7-export-using-the-console-ui)
8. [Glossary](#8-glossary)

## 1. Getting started

Before you run any export, confirm you have the following:

- **Reltio access token** — same permissions as your Reltio Server access. See [HOWTO: Authenticate and use Reltio APIs](./HOWTO-authenticate-and-use-reltio-apis.md).
- **Export Service URL** — your environment hostname plus `/jobs`. For example: `https://na07-prod.reltio.com/jobs`.
- **Tenant ID** — available from Reltio Console > Tenant overview.
- **curl** and optionally **jq** for JSON output (`brew install jq` / `apt install jq`).

Set environment variables for the examples throughout this guide:

```bash
export TOKEN="YOUR_ACCESS_TOKEN"
export EXPORT_URL="https://na07-prod.reltio.com/jobs"
export TENANT_ID="YOUR_TENANT_ID"
```

**What you can export:**

The Export Service supports four [export job](#glossary) types:

| Data type | Endpoint path |
|-----------|--------------|
| Entities | `/export/{tenant}/entities` |
| Relations | `/export/{tenant}/relations` |
| Activity log | `/export/{tenant}/activities` |
| Merge tree (crosswalks tree) | `/export/{tenant}/entities/_crosswalksTree` |

**Output formats:** CSV (default, two variants) or JSON. **Compression:** GZIP (`.gz`, default) or ZIP (`.zip`).

**File naming:** Output files follow the default template `part_<part-number>` (for example, `entities/testName/part_00001.csv.gz`). Numbering starts at zero.

> **Important:** Your export permissions match your Reltio Server access — you can only export data that your account can read via the API.

> **Learn more:** [Export data using Reltio export service](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service)

## 2. Export entities via API

Use this endpoint to export all entities, or a filtered subset, to cloud storage. The [Export Service](#glossary) schedules the job, uploads the result to S3/GCS/Azure, and emails you the download links.

**Endpoint:** `POST {ExportServiceURL}/export/{tenant}/entities`

**Required headers:**

```
Authorization: Bearer {token}
Content-Type: application/json
```

### Basic request

Export all entities in CSV format, returning only Operational Values:

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true
  }'
```

### Response

```json
{
  "exportType": "ENTITIES",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": ["831272d6-1685-49cc-a98c-c8965d04bc0d"]
}
```

Save the task ID — you need it to track status (see section 5).

### Key query parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `fileFormat` | `csv` | Output format: `csv` or `json` |
| `dateFormat` | `TIMESTAMP` | Date format: `TIMESTAMP` or `READABLE` |
| `activeness` | `ALL` | Filter by status: `ALL`, `ACTIVE`, or `NOT_ACTIVE` |
| `skipPostprocessing` | `true` | `true` returns links to raw partial files; `false` combines files first |
| `select` | All fields | Comma-separated field list (for example, `type,attributes.FirstName`) |
| `email` | Requesting user | Notification email addresses (comma-separated) |
| `partSize` | Not set | Split output into files of this size (minimum 100 MB; see section 6) |

### Key body parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `ovOnly` | `true` | Export only attributes where `ov=true` (the winning values from survivorship rules) |
| `includeType` | All types | Limit export to specific [entity](#glossary) types (JSON array of type URIs) |
| `updateTimeFilter` | None | Filter by update time: `{"since": 1394726957000, "to": 1394726959000}` |

### Filter and select examples

Export only `Individual` entities updated since a specific timestamp:

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true,
    "includeType": ["configuration/entityTypes/Individual"],
    "updateTimeFilter": {"since": 1394726957000}
  }'
```

Export only specific fields:

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/entities?select=type,attributes.FirstName,createdTime" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"ovOnly": true}'
```

Export as JSON instead of CSV:

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/entities?fileFormat=json" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"ovOnly": true}'
```

> **Note:** The query `filter` parameter takes priority over the body `filter` parameter if both are specified.

> **Important:** If the background task limit for your [tenant](#glossary) is exceeded, the export returns the error `PERIODIC_TASKS_PER_TENANT_LIMIT_EXCEEDED`. Use the Export Tasks Management API to check active tasks before starting new ones.

> **Learn more:** [Export entities](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/export-entities)

## 3. Export relations via API

Exports relations (links between entities) in the same way as entity exports — schedules the job, uploads the result to cloud storage, and emails you the download links.

**Endpoint:** `POST {ExportServiceURL}/export/{tenant}/relations`

### Basic request

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/relations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "ovOnly": true,
    "includeType": ["configuration/relationTypes/Employment"]
  }'
```

### Response

```json
{
  "exportType": "RELATIONS",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": ["57fd98c7-924f-443c-b7bc-902b41a60a2e"]
}
```

### Relation-specific query parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `returnVotes` | `false` | Include votes in the export |
| `sePrefix` | `false` | Add `StartObject`/`EndObject` prefixes to CSV columns |
| `options` | None | Comma-separated: `searchByOv`, `resolveMergedEntities`, `resolveRelationEdgeTypes`, `parallelExecution` |

> **Tip:** Use `resolveMergedEntities` to get winner URIs for start/end objects — useful when entities have been merged since the relation was created.

> **Learn more:** [Export relations](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/export-relations)

## 4. Export activity log data via API

Exports the [activity log](#glossary) — the audit trail of changes made to your tenant's data. By default, the endpoint returns the last 4 months of activity.

**Endpoint:** `POST {ExportServiceURL}/export/{tenant}/activities`

### Basic request

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/activities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Response

```json
{
  "exportType": "ACTIVITY_LOG",
  "status": "scheduled",
  "details": "Export job has been scheduled. Result will be sent to your email: user@example.com",
  "taskIds": ["f30e5d99-a57d-46fb-bad0-70b2575fdd26"]
}
```

### Export a custom time range

Use the `filter` query parameter with a `timestamp` condition to override the 4-month default. The timestamp value is in milliseconds:

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/activities?filter=gt(timestamp,1560800276000)" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### Key parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `filter` | Last 4 months | Time range filter using `gt(timestamp,<ms>)` |
| `dateFormat` | `TIMESTAMP` | Date format: `TIMESTAMP` or `READABLE` |

> **Note:** As a best practice, always specify a time period filter when exporting activity log data. Retention and searching limits are governed by your tenant's quotas.

> **Learn more:** [Exporting Activity Log Data](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service/exporting-activity-log-data)

## 5. Monitor and manage export tasks

Export jobs run asynchronously. After scheduling a job, use the Tasks API to check its progress.

**Endpoint:** `GET {ExportServiceURL}/tasks`

### Check active tasks

```bash
curl -s -X GET "${EXPORT_URL}/tasks" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Task statuses

| Status | Meaning |
|--------|---------|
| `SCHEDULED` | Job is queued, waiting to start |
| `PROCESSING` | Job is actively exporting data |
| `COMPLETED` | Job finished — check your email for download links |
| `PAUSING` | Job is being paused |
| `PAUSED` | Job is paused |
| `CANCELING` | Job is being canceled |
| `WAITING` | Job is waiting for a dependency |
| `WAITING_FOR_RESOURCE` | Job is temporarily suspended because the tenant has too many active tasks |

### Force stop a running export

```bash
curl -s -X PUT "${EXPORT_URL}/tasks/${TASK_ID}/_forceStop" \
  -H "Authorization: Bearer ${TOKEN}"
```

> **Note:** Force stop is available to Administrators only.

> **Learn more:** [Export data using Reltio export service](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service)

## 6. Split exports into multiple files

For large exports, split the output into multiple files using the `partSize` query parameter. Each file is capped at the size you specify before compression.

### How it works

1. Add `partSize` to your export request as a query parameter.
2. Set `skipPostprocessing=false` — `partSize` is ignored when `skipPostprocessing=true`.
3. The Export Service splits the output into files no larger than your `partSize` value.
4. Download links appear in the task's `currentState.exportUrls` field (an array of strings).

### Supported size formats

| Format | Example |
|--------|---------|
| Bytes | `104857600` |
| Kilobytes | `102400k` |
| Megabytes | `100m` |
| Gigabytes | `1g` |

> **Important:** The minimum `partSize` is 100 MB (104857600 bytes).

### Example request

```bash
curl -s -X POST "${EXPORT_URL}/export/${TENANT_ID}/entities?partSize=100m&skipPostprocessing=false" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"ovOnly": true}'
```

**Download links:** Without `partSize`, the download link is a single string at `currentState.exportUrl`. With `partSize`, the links are an array at `currentState.exportUrls` — one URL per file part.

Output files follow the naming convention `_part_[N]`, where `[N]` is the file number.

**Supported endpoints for splitting:**

- `POST {ExportServiceURL}/export/{tenant}/entities`
- `POST {ExportServiceURL}/export/{tenant}/entities/_crosswalksTree`
- `POST {ExportServiceURL}/export/{tenant}/relations`
- `POST {ExportServiceURL}/export/{tenant}/activities`

> **Note:** `partSize` controls the unarchived size of each output file. The downloaded `.gz` or `.zip` file will be smaller due to compression.

> **Learn more:** [Export data using Reltio export service](https://docs.reltio.com/en/objectives/load-and-export-data/data-exporting-at-a-glance/data-exporting-operation/export-data-using-reltio-export-service)

## 7. Export using the Console UI

If you prefer a visual interface over the API, use the Export application in the Reltio Console. You can also use the Console to export entities and relationships together and produce a single output file.

### Steps

1. In the Hub or in the Reltio Console, select **Export**, then select **New Export Job**.
2. Select and filter the data to export.
3. Choose your job details — select the file format: **CSV Flattened**, **JSON**, or **CSV Exploded**.
4. Select **Run**.
5. The job appears on the **PENDING** list. Track it by name.
6. Once the job appears on the **COMPLETED** list, download the export file(s). The Export Service uploads results to tenant storage and sends an email with links.

> **Important:** The **CSV Exploded** format can result in low export performance, large export files, or job failure. The more values that entities have, the higher the risk. Use **CSV Flattened** or **JSON** instead.

> **Learn more:** [Export entities and relationships](https://docs.reltio.com/en/applications/console/tenant-management-applications/data-export-at-a-glance/export-entities-and-relationships)

## 8. Glossary

**Activity log:** An audit trail of all changes made to data in a Reltio tenant, including creates, updates, merges, and deletes. Exportable via the `/activities` endpoint; defaults to the last 4 months.

**Crosswalk:** A pointer that links a Reltio entity back to its original record in a source system, storing the source system URI and the record's ID in that system.

**Entity:** A master data record in Reltio — for example, an Individual, Organization, or Product. Entities are the primary data type exported via the Export Service.

**Export job:** A background task created by the Export Service that extracts data, uploads it to cloud storage (AWS S3, GCS, or Azure Blob Storage), and sends an email notification with download links when complete.

**Export Service:** The Reltio service responsible for extracting and packaging data from a tenant for external use. Accessed at `{environment}/jobs` and distinct from the Entities API used for individual record operations.

**Merge tree:** The history of how entities were merged over time, including which source records contributed to the current golden record. Exportable via the `/_crosswalksTree` endpoint.

**Tenant:** An isolated Reltio environment associated with a specific organization or project. Each tenant has its own data, configuration, and users, identified by a unique tenant ID.

---

> **Disclaimer:** AI-generated from the Reltio documentation snapshot 2026-05-06 02:14 UTC (3,240 topics). AI output can contain subtle inaccuracies, and the knowledge base syncs twice a week — so the content here may lag [docs.reltio.com](https://docs.reltio.com). Verify anything critical against the official docs and your own tenant. See the [full disclaimer](../DISCLAIMER.md).
