# HOWTO: Load Data into Reltio

A practical, step-by-step guide to loading your first data into a Reltio tenant — from preparing your file to verifying the results.

---

## Table of Contents

| Step | What You'll Do |
|------|----------------|
| [1](#step-1-understand-what-the-data-loader-does) | Understand what the Data Loader does |
| [2](#step-2-prepare-your-data-file) | Prepare your data file |
| [3](#step-3-set-up-crosswalks) | Set up crosswalks so Reltio can track your records |
| [4](#step-4-load-entities-via-the-api) | Load entities via the API |
| [5](#step-5-load-entities-via-the-console-ui) | Load entities via the Console UI |
| [6](#step-6-map-your-columns-to-attributes) | Map your file columns to Reltio attributes |
| [7](#step-7-consolidate-multiple-records-into-one-entity) | Consolidate multiple records into one entity |
| [8](#step-8-load-relationships) | Load relationships between entities |
| [9](#step-9-monitor-your-job-and-handle-errors) | Monitor your job and handle errors |
| [10](#step-10-verify-the-loaded-data) | Verify the loaded data |

---

## Prerequisites

### 1. A configured tenant

You need a Reltio tenant with entity types already defined. If you followed the [Top 10 APIs setup](./HOWTO-SETUP-for-top-10-reltio-apis.md), you already have `Individual` and `Organization` entity types.

### 2. An access token

All API calls need a Bearer token. See [HOWTO: Authenticate](./HOWTO-authenticate-and-use-reltio-apis.md) to get one.

```bash
export TOKEN="your_access_token"
export TENANT="https://na07-prod.reltio.com/reltio/api/YOUR_TENANT_ID"
```

### 3. Tools

- `curl` for API calls
- `jq` for readable JSON output (`brew install jq` / `apt install jq`)
- Access to the Reltio Console UI (for Steps 5-6)

---

## Step 1: Understand What the Data Loader Does

The Data Loader takes records from a file (CSV, Excel, or JSON), maps them to your tenant's entity types and attributes, and creates entities in Reltio. Each record gets a **crosswalk** — a pointer back to its source system — so Reltio always knows where the data came from.

You can load:
- **Entities** (e.g., customers, organizations)
- **Relationships** (e.g., "Jane works at Acme Corp")
- **Interactions** (e.g., transactions, events — requires Reltio Intelligent 360)

There are two ways to load data:
1. **API** — POST entities directly (best for automation and pipelines)
2. **Console UI** — upload a file through the Data Loader interface (best for one-off loads and business users)

---

## Step 2: Prepare Your Data File

### Supported file formats

| Format | Max Size (Local Upload) | Max Size (Remote/Cloud) | Notes |
|--------|------------------------|------------------------|-------|
| **CSV** | 50 MB | No limit (10 GB with consolidation) | Must follow RFC 4180 standard |
| **MS Excel** | 50 MB | No limit (10 GB with consolidation) | `.xlsx` format |
| **JSON** | No limit | No limit (10 GB with consolidation) | Standard Reltio JSON structure |
| **RELTIO_JSON** | No limit | No limit | Skips transformation — raw Reltio format |

### Supported remote sources

If your file is larger than 50 MB, upload it to one of these cloud locations first:

- Amazon S3
- Google Cloud Storage (GCP)
- Microsoft Azure Blob Storage
- SFTP

### Example CSV file

Here's a simple CSV for loading Individual entities:

```csv
SourceID,FirstName,LastName,Email
CRM-001,Jane,Smith,jane.smith@example.com
CRM-002,John,Doe,john.doe@example.com
CRM-003,Maria,Garcia,maria.garcia@example.com
```

> **Important:** Reltio automatically trims leading/trailing spaces, tabs, and newlines from values (except for RELTIO_JSON format). You don't need to clean whitespace yourself.

---

## Step 3: Set Up Crosswalks

Every record you load must have a **crosswalk** — this is how Reltio tracks which source system a record came from and what its ID is in that system.

A crosswalk has two required fields:

| Field | What It Is | Example |
|-------|-----------|---------|
| **Type** | The source system URI from your tenant config | `configuration/sources/CRM` |
| **Value** | The unique record ID in that source system | `CRM-001` |

> **Rule of thumb:** If you're loading 10,000+ records, crosswalks are **mandatory**. For smaller loads, Reltio generates a default crosswalk, but you should always provide your own for traceability.

### Why crosswalks matter

- They let you look up entities by source system ID later (`GET /entities?filter=equals(crosswalks.value,'CRM-001')`)
- They prevent duplicates — if you load the same crosswalk twice, Reltio updates the existing entity instead of creating a new one
- They enable the **upsert pattern**: load once to create, load again to update

---

## Step 4: Load Entities via the API

**API:** `POST {TenantURL}/entities`

This is the programmatic way to load data — ideal for integrations and automated pipelines.

### Load a single entity

```bash
curl -s -X POST "${TENANT}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{ "value": "Jane" }],
        "LastName": [{ "value": "Smith" }],
        "Email": [{ "value": "jane.smith@example.com" }]
      },
      "crosswalks": [
        {
          "type": "configuration/sources/CRM",
          "value": "CRM-001"
        }
      ]
    }
  ]' | jq .
```

### Response

```json
[
  {
    "uri": "entities/abc123",
    "type": "configuration/entityTypes/Individual",
    "crosswalks": [
      {
        "type": "configuration/sources/CRM",
        "value": "CRM-001"
      }
    ]
  }
]
```

### Load a batch of entities

The body is always a JSON array — you can include up to **1,000 entities per request**:

```bash
curl -s -X POST "${TENANT}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{ "value": "Jane" }],
        "LastName": [{ "value": "Smith" }],
        "Email": [{ "value": "jane.smith@example.com" }]
      },
      "crosswalks": [{ "type": "configuration/sources/CRM", "value": "CRM-001" }]
    },
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{ "value": "John" }],
        "LastName": [{ "value": "Doe" }],
        "Email": [{ "value": "john.doe@example.com" }]
      },
      "crosswalks": [{ "type": "configuration/sources/CRM", "value": "CRM-002" }]
    },
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{ "value": "Maria" }],
        "LastName": [{ "value": "Garcia" }],
        "Email": [{ "value": "maria.garcia@example.com" }]
      },
      "crosswalks": [{ "type": "configuration/sources/CRM", "value": "CRM-003" }]
    }
  ]' | jq .
```

### Key rules

- **The body is always an array** — even for a single entity, wrap it in `[ ]`
- **Max 1,000 entities per POST** — for larger loads, split into batches
- **Max 50 MB per request body** — exceeding this returns a `413 Payload Too Large` error
- **Attributes are always arrays of objects** — `"FirstName": [{ "value": "Jane" }]`, not `"FirstName": "Jane"`

### What can go wrong

| Error | Cause | Fix |
|-------|-------|-----|
| `401` | Token expired | Get a fresh token |
| `400` | Invalid entity type or attribute | Check your type path matches the tenant configuration |
| `413` | Request body too large | Split into smaller batches (< 50 MB) |
| `429` | Rate limit exceeded | Add a delay between requests; implement exponential backoff |

---

## Step 5: Load Entities via the Console UI

If you prefer a visual workflow or you're doing a one-off data load, the Console Data Loader is the way to go.

### The workflow

1. **Log in** to the Reltio Console
2. Navigate to **Data Loader** in the left sidebar
3. **Create a new job** (or duplicate an existing one)
4. **Select your input file** — upload from your computer (< 50 MB) or connect to S3/GCS/Azure/SFTP
5. **Select the source system** — this determines the crosswalk type (e.g., CRM, ERP)
6. **Define your mapping** — map file columns to entity attributes (see Step 6)
7. **Choose your update preference** — create new entities, update existing, or upsert
8. **Analyze** (optional) — preview key metrics from your file before loading
9. **Start the load**
10. **Review results** — check completion metrics and any errors

> **Tip:** You can only load one data type per job (entities, relationships, or interactions). Create separate jobs for each type.

---

## Step 6: Map Your Columns to Attributes

When using the Console Data Loader, you need to tell Reltio which columns in your file correspond to which entity attributes.

### Manual mapping

For each column in your file, select the corresponding Reltio attribute:

| File Column | Maps To |
|-------------|---------|
| `SourceID` | Crosswalk > Value |
| `FirstName` | `configuration/entityTypes/Individual/attributes/FirstName` |
| `LastName` | `configuration/entityTypes/Individual/attributes/LastName` |
| `Email` | `configuration/entityTypes/Individual/attributes/Email` |

### AI automapping (if enabled)

If your tenant has `agentsConfig.aiEnabled: true`, you can use the **AI Automapping API** to get mapping suggestions automatically:

```bash
curl -s -X POST "${DL_HOST}/api/ai/${TENANT_ID}/map" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "entityTypeUri": "configuration/entityTypes/Individual",
    "headers": ["SourceID", "FirstName", "LastName", "Email"],
    "sampleData": [
      ["CRM-001", "Jane", "Smith", "jane.smith@example.com"],
      ["CRM-002", "John", "Doe", "john.doe@example.com"]
    ]
  }' | jq .
```

The API returns suggestions with confidence levels (high or medium). Review them before accepting.

### Advanced crosswalk settings

When mapping crosswalks, you can also configure:

| Setting | Purpose |
|---------|---------|
| **Source table** | Sub-categorize records within a source |
| **External info** | Attach metadata to the crosswalk |
| **Create date** | Override the entity creation timestamp |
| **Update date** | Override the entity update timestamp |
| **Delete date** | Mark the crosswalk as deleted |
| **Data Provider** | Mark source as authoritative (selected by default) |
| **Contributor Provider** | Mark source as supplementary |

---

## Step 7: Consolidate Multiple Records into One Entity

By default, the Data Loader creates one entity per row. But what if your file has multiple rows for the same person — say, two addresses for the same customer?

### How consolidation works

If two rows share the same **crosswalk value**, Reltio merges them into a single entity with multi-value attributes:

**Input file:**

| SourceID | FirstName | LastName | Email |
|----------|-----------|----------|-------|
| CRM-001 | Jane | Smith | jane.smith@work.com |
| CRM-001 | Jane | Smith | jane.smith@personal.com |

**Result:** One entity with crosswalk `CRM-001` and two Email values.

### Enable consolidation

**Via API:** Add `groupingEnabled: true` to your data load job configuration.

**Via Console UI:** Toggle "Consolidate records with same crosswalk value" when creating the job.

### Limitations

- Works with **CSV and Excel only** (not RELTIO_JSON)
- Max file size: **10 GB**
- If a single entity accumulates more than **10,000 attribute values** during consolidation, the job fails with an ERROR status

---

## Step 8: Load Relationships

**API:** `POST {TenantURL}/relations`

Once you've loaded entities, you can create relationships between them. You need the entity URIs from Step 4.

### Example: Create an Employment relationship

```bash
curl -s -X POST "${TENANT}/relations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/relationTypes/Employment",
      "startObject": {
        "objectURI": "entities/abc123"
      },
      "endObject": {
        "objectURI": "entities/def456"
      },
      "attributes": {
        "Title": [{ "value": "Software Engineer" }]
      },
      "crosswalks": [
        {
          "type": "configuration/sources/CRM",
          "value": "REL-001"
        }
      ]
    }
  ]' | jq .
```

### Via the Console UI

Loading relationships through the Data Loader requires a file with columns for:
- **Start entity crosswalk** (the "from" entity)
- **End entity crosswalk** (the "to" entity)
- **Relationship attributes** (e.g., Title, StartDate)

> **Important:** Load your entities first, then your relationships. The entities must exist before you can link them.

---

## Step 9: Monitor Your Job and Handle Errors

### Job statuses

| Status | Meaning |
|--------|---------|
| `SCHEDULED` | Job is queued, waiting to run |
| `RUNNING` | Job is actively processing |
| `COMPLETED` | All records loaded successfully |
| `COMPLETED_WITH_ERRORS` | Some records failed — check the error file |
| `STOPPED` | Job was stopped due to error threshold or manual intervention |
| `ERROR` | Job failed entirely |

### Error threshold

By default, if more than **15%** of records fail (for loads of 10,000+ records), the job is stopped. This prevents bad data from flooding your tenant.

### Download error files

Error files are available as a ZIP download containing CSV files. Each file includes:
- All the original input attributes
- An error message column explaining what went wrong

Each error file contains a maximum of 1,000 records.

### Job priority

If you have multiple loads queued, you can control the order:

| Priority | Behavior |
|----------|----------|
| **High** | Runs before Normal and Low jobs |
| **Normal** (default) | Standard processing order |
| **Low** | Runs after all High and Normal jobs |

Jobs with the same priority are processed in creation order (FIFO).

You can also **pause and resume** active jobs — useful if you need to reprioritize.

---

## Step 10: Verify the Loaded Data

After your load completes, confirm the data landed correctly.

### Search for your entities

```bash
curl -s -X GET "${TENANT}/entities?filter=equals(type,'configuration/entityTypes/Individual')&max=5" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.[] | {uri, type, FirstName: .attributes.FirstName[0].value, LastName: .attributes.LastName[0].value}'
```

### Look up a specific entity by crosswalk

```bash
curl -s -X GET "${TENANT}/entities?filter=equals(crosswalks.value,'CRM-001')" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

### Check entity count

```bash
curl -s -X GET "${TENANT}/entities?filter=equals(type,'configuration/entityTypes/Individual')&count=true&max=0" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

### What to check

- **Entity count** matches your expected number of records
- **Attribute values** are correct (not truncated, correctly typed)
- **Crosswalks** are present and point to the right source
- **Relationships** link the correct entities (if applicable)

---

## Quick Reference

### API Endpoints

| Operation | Method | Endpoint |
|-----------|--------|----------|
| Load entities | `POST` | `{TenantURL}/entities` |
| Load relationships | `POST` | `{TenantURL}/relations` |
| Search entities | `GET` | `{TenantURL}/entities?filter=...` |
| Crosswalk lookup | `GET` | `{TenantURL}/entities?filter=equals(crosswalks.value,'...')` |

### Limits

| What | Limit |
|------|-------|
| Entities per POST | 1,000 |
| POST body size | 50 MB |
| Local file upload | 50 MB |
| Consolidation file size | 10 GB |
| Error threshold (default) | 15% |
| Max values per entity during consolidation | 10,000 |
| Large dataset auto-optimization | 10M+ rows |

---

## Further Reading

- [HOWTO: Authenticate with Reltio](./HOWTO-authenticate-and-use-reltio-apis.md) — Get your access token
- [HOWTO: Top 10 Reltio APIs](./HOWTO-top-10-reltio-apis.md) — Work with entities after loading
- [Reltio Official Documentation](https://docs.reltio.com) — Full Data Loader reference

*Guide based on Reltio documentation (March 2026).*
