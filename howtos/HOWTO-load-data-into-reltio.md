# HOWTO: Load Data into Reltio

Load entity, relationship, and interaction data into the Reltio Context Intelligence Platform using the Data Loader application in the Console or the Data Loader API.

## Overview

This guide covers how to use the Data Loader to bring data from files or cloud storage into a Reltio tenant. It walks through accessing the application, selecting a file source, mapping columns to attributes, setting an update preference, and monitoring the job to completion.

**Audience:** Developer, Data Product Owner, System Administrator

## Contents

1. [Getting started](#1-getting-started)
2. [Access the Data Loader application](#2-access-the-data-loader-application)
3. [Load entities into a tenant](#3-load-entities-into-a-tenant)
4. [Map source columns to attributes](#4-map-source-columns-to-attributes)
5. [Specify record update preference](#5-specify-record-update-preference)
6. [Consolidate multiple records into one entity](#6-consolidate-multiple-records-into-one-entity)
7. [Load relationships into a tenant](#7-load-relationships-into-a-tenant)
8. [Monitor jobs and handle errors](#8-monitor-jobs-and-handle-errors)
9. [Glossary](#9-glossary)

## 1. Getting started

Before you begin, confirm you have the following:

- **Role** — the global role `ROLE_DATALOADER` is required to configure and use the [Data Loader](#glossary). Contact your Data Loader administrator for access.
- **Tenant** — a Reltio tenant with entity types already defined.
- **Input file** — a file in one of the supported formats: CSV, Excel (`.xlsx`), JSON, or RELTIO_JSON.
- **Reltio Console access** — you reach the Data Loader through the Console application.

> **Note:** Tenants provisioned for China can only access the Data Loader APIs — the Data Loader in the Console is not accessible for those tenants.

**Supported data sources:**

The [Data Loader](#glossary) can pull files from:

- Your local machine (up to 50 MB per file)
- Amazon S3
- Google Cloud Storage (GCS)
- Microsoft Azure Blob Storage
- SFTP

**Supported file types:**

| Format | Notes |
|--------|-------|
| CSV | Recommended format. The software transforms JSON and Excel to CSV before loading. |
| Excel (`.xlsx`) | Use plain format — formulas and cell formatting are not supported. |
| JSON | Transformed to CSV before loading. |
| RELTIO_JSON | Skips transformation — raw Reltio format used directly. |

**Data types you can load:**

- [Entities](#glossary) (for example, customers, organizations, products)
- [Relationships](#glossary) (for example, Employment between an Individual and an Organization)
- Interactions (available on Reltio Intelligent 360 tenants only)

> **Learn more:** [Data Loader at a glance](https://docs.reltio.com/en/applications/console/tenant-management-applications/data-loader-at-a-glance)

## 2. Access the Data Loader application

Follow these steps to navigate to the Data Loader in the Reltio Console:

1. On the Reltio home page, select the **App Selector** icon at the upper right.
2. In the **App Selector** dialog, select **Console**.
3. On the **Console** home page, under the **Tenant Management** section, select **Data Loader**.
4. At the top of the page, from the **Select tenant** dropdown menu, select the [tenant](#glossary) you want to work with.

The Data Loader home page displays a **Job Definitions** area where you can work with **Drafts** and **Completed** jobs.

> **Learn more:** [Get started with Data Loader](https://docs.reltio.com/en/applications/console/tenant-management-applications/data-loader-at-a-glance/get-started-with-data-loader)

## 3. Load entities into a tenant

The high-level [Data Loader workflow](#glossary) for loading entities follows these steps:

1. Create a new job or duplicate an existing job.
2. Select the input file from the required source system.
3. Define new mappings or use an existing mapping to map file columns to entity attributes.
4. Specify the records update preference.
5. Analyze key metrics from the input file (optional) before proceeding with the data load.
6. Start the data load.
7. Review data load completion metrics.

### Step-by-step procedure

1. Open your tenant in the **Data Loader**.
2. In the **Job Definition** tab, select **LOAD DATA** and then **Entities** to create a new data load job.
3. On the **Entities data load** page, in the **Upload** section, fill in the following details:
   - **Job definition Name** — enter a name for this job.
   - **Entity type** — select the entity type that matches the data in your file (for example, Organizations, Contacts).
   - **Select file** — choose your source and provide file details:

**Source: My Computer**

- Drop your file on the page or select **BROWSE FILE**.
- Select the file type: **CSV**, **Excel (.xlsx)**, **JSON**, or **RELTIO_JSON**.
- For CSV files, specify the **file delimiter type**: Comma (`,`), Semicolon (`;`), Single pipe (`|`), or Double pipe (`||`).
- Select or clear the **First row is a header** checkbox for CSV or Excel files.

> **Note:** When you upload a file from your local file system, the file size must not exceed 50 MB.

**Source: Amazon S3**

Provide your Amazon S3 credentials:

| Credential | Description |
|-----------|-------------|
| **Account Name** | The Amazon S3 account name |
| **Bucket Name** | Name of the bucket or folder where the file is located |
| **AWS Key** | The AWS account access key (alphanumeric) |
| **AWS Secret** | The AWS secret key or password (alphanumeric) |
| **Role** | AWS IAM role (recommended — more secure than key/secret) |
| **External ID** | External ID for the configured AWS IAM role |
| **S3 file path** | The S3 bucket path for the input file |
| **Region Information** | Example: `us-west-1` |

> **Tip:** Reltio recommends using an AWS IAM role rather than key/secret credentials — it is a more secure way to provide access to files in an S3 bucket.

**Source: Google Cloud Storage**

Provide your GCS credentials including **Account Name**, **Bucket name**, **File path**, **Project-ID**, **Project Key**, **Client ID**, and **Client Email**.

**Source: Azure Blob Storage**

Provide your Azure credentials:

| Credential | Description |
|-----------|-------------|
| **Azure Account Name** | Your Azure storage account name |
| **Access Key** | Found under **Access keys** in your Azure storage account |
| **Container Name** | The name of the container in your Azure storage account |
| **File path** | The file path within your Azure container |

**Source: SFTP**

Provide SFTP credentials: **Account Name**, **SFTP username**, **SFTP password**, **SFTP host**, and **SFTP file path**.

4. For remote sources (Amazon S3, GCS, Azure Blob Storage, SFTP), select the **Save the source settings** checkbox to store credentials for reuse.
5. Select **CONTINUE** to proceed to the mapping stage.

> **Learn more:** [Load entities into a tenant](https://docs.reltio.com/en/objectives/load-and-export-data/data-loading-at-a-glance/data-loading-operation/load-data-with-data-loader/load-entities-into-a-tenant)

## 4. Map source columns to attributes

After uploading a file, you map the file's columns to the corresponding entity attributes in Reltio's data model. The **Map** section displays the content of the uploaded file.

### Manual mapping

1. On the **Map** section, select **Map Attributes**. The right side panel displays the available attributes.
2. Select **Select Mapping** to choose an existing mapping, or select **New Mapping** to create one.
3. Click a column header in the file preview.
4. On the right panel, select the required attribute to map it.
5. Repeat for each column you want to map.
6. For reference attributes (such as Address), expand the attribute in the right panel to map its nested fields.
7. To split a column into two (for example, splitting a full name into first and last name), select **More Options** on a column header and choose **Split Column**.
8. To join two columns into one, select **More Options** and choose **Join Column**.
9. Select **Continue** when all required attributes are mapped.
10. In the **Save mapping** dialog, select **SAVE AND CONTINUE**.

> **Note:** You can add a default value to a simple or nested attribute without mapping it to any column of the input file.

### AI-assisted auto-mapping

If your tenant has `aiEnabled` set to `true` in the physical configuration (under `agentsConfig`), you can use the **Auto-map** feature:

1. On the **Map** section, select **Auto-map**.
2. In the **Auto-map columns** dialog, select **Start Auto-Mapping**.
3. Review the suggested [column mappings](#glossary). Auto-mapped columns display an icon above the column name, the mapped attribute, and the confidence level of the match.
4. Map any remaining unmapped columns manually.
5. Select **Continue** to save.

> **Note:** Auto-mapping does not overwrite manual mappings. If a column is already mapped, the existing mapping remains unchanged.

> **Learn more:** [Map Source Columns to Attributes](https://docs.reltio.com/en/objectives/load-and-export-data/data-loading-at-a-glance/data-loading-operation/load-data-with-data-loader/load-entities-into-a-tenant/map-source-columns-to-attributes)

## 5. Specify record update preference

After mapping, you specify how records in the file should update existing data in Reltio. This is the **Define** stage.

Select either **Full Update** or **Partial Update**:

| Option | Behavior |
|--------|---------|
| **Partial Update** | Only the mapped attributes are updated. Attributes not present in the file remain unchanged. |
| **Full Update** | The mapped attributes are updated, and any attributes not present in the file are set to null. |

> **Note:** If any attributes or columns are missing, **Full Update** can cause those attributes to become null values. Use **Partial Update** to prevent data loss.

**Additional options in the Define stage:**

- **Execute LCA** — when enabled (default), Lifecycle Assessment (LCA) and Data Validation Functions (DVF) are applied as part of the data load.
- **Enable Data Change Request (DCR)** — when enabled, a DCR is created for each entity loaded, and the entity is loaded only after the DCR is approved. Available only on tenants with Workflow enabled. The number of DCRs that can be created per job is limited to 1,000.
- **Recurring Job Definition** — schedule the job to run on a recurring basis. Scheduling is not available when the input file is loaded from the local file system.

After setting your preferences, you can:

- Select **SAVE AS DRAFT** to save the job for later.
- Select **LOAD DATA** to start the load immediately.
- Select **SUGGEST LOAD DATA** (when DCR is enabled) to submit the load for approval.

> **Learn more:** [Specify record update preference](https://docs.reltio.com/en/objectives/load-and-export-data/data-loading-at-a-glance/data-loading-operation/load-data-with-data-loader/load-entities-into-a-tenant/specify-record-update-preference)

## 6. Consolidate multiple records into one entity

By default, the [Data Loader](#glossary) creates a single entity from multiple records that share the same [crosswalk](#glossary) value. This is called record consolidation or grouping.

**Example:** Two rows with crosswalk `ABC` and different `FirstName` values — `John` and `Johnny` — are merged into one entity with a multi-value `FirstName` attribute containing both values.

### Key considerations

- Source file formats for consolidation must be CSV or Excel (`.xlsx`) only — RELTIO_JSON is not supported.
- The total size of all source files in any consolidation job cannot exceed 10 GB.
- If the total number of values for any single attribute exceeds 10,000 during grouping, the job fails with a status of `ERROR`.
- Merge records can come from a single file or multiple files within the same job.

### Enable consolidation

In the **Define** stage when creating a job, select **Consolidate records with same crosswalk value**.

To enable or disable consolidation per project via the API:

```
PUT {{dataloader_uri}}/dataloader/api/{{tenantId}}/project/{{projectId}}
Body: {"groupingEnabled": true}
```

> **Learn more:** [Create one entity from multiple records](https://docs.reltio.com/en/objectives/load-and-export-data/data-loading-at-a-glance/data-loading-operation/load-data-with-data-loader/load-entities-into-a-tenant/create-one-entity-from-multiple-records)

## 7. Load relationships into a tenant

You can load two types of [relationships](#glossary) between entities: unidirectional and bidirectional. For example, a Healthcare Provider (HCP) can be associated with multiple Healthcare Organizations (HCOs), and vice versa.

### Steps

1. In the Data Loader, select **LOAD DATA** and then **Relationships**.
2. Select your source and file, following the same steps as loading entities (see section 3).
3. In the **Map** section, select **Map Attributes** to map file columns to relationship attributes.
4. Select the relationship type from the dropdown list. Types include HCP-HCO, HCO-HCP, Individual-Organization, and so on.
5. Map the crosswalk columns for the start object and the end object.
6. Map relationship attributes (for example, `Desc`, `StartDate`, `EndDate`).
7. Select **Continue** and save the mapping.
8. Specify the record update preference (see section 5).
9. Select **LOAD DATA** to start the load.

> **Note:** You must map the crosswalks for both the start object and the end object. The relationship type determines which attributes appear in the mapping panel.

> **Learn more:** [Load relationships into a tenant](https://docs.reltio.com/en/objectives/load-and-export-data/data-loading-at-a-glance/data-loading-operation/load-data-with-data-loader/load-relationships-into-a-tenant)

## 8. Monitor jobs and handle errors

After starting a data load, the job appears in the **Job Status** page under the **PENDING** tab.

### Job statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Job is queued, waiting to run |
| `COMPLETED` | All records loaded successfully |
| `COMPLETED_WITH_ERRORS` | Some records failed — check the error file |
| `STOPPED` | Job was stopped because the error threshold was reached or the job was manually stopped |
| `ERROR` | Job failed entirely (for example, exceeded the 10,000 attribute value limit during consolidation) |

### Error threshold

The Data Loader uses a configurable error threshold rate. For jobs with more than 10,000 rows, if the rate of failed records reaches or exceeds the threshold, the job is stopped to prevent large error files from being generated. The default threshold is **15%**.

Example error message: `The job was stopped as error threshold limit 15% was reached. Actual is 16.8% (306 to 1819 profiles)`.

You can set a custom threshold in the [job definition](#glossary):

```json
{
  "additionalAttributes": {
    "errorThreshold": 25
  }
}
```

> **Note:** The error threshold applies only when there are more than 10,000 records to process.

### Stop a pending job

1. In the **Job Status** page, select **Pending** to see pending jobs.
2. Select the icon on the right of the date for the job you want to stop.
3. Select **Stop job**.
4. Select **Yes** to confirm.

The job moves to the **Completed** tab with a status of `STOPPED`.

### Download error files

When a job completes with errors, you can download an error file from the job details. Error files are in CSV format and include:

- All original input attributes for the failed rows
- An error message column explaining what went wrong

### Job priority and scheduling

You can set job priority to **High**, **Normal** (default), or **Low**. Higher-priority jobs run before lower-priority ones. Jobs with the same priority run in creation order (FIFO). You can also schedule a job to run on a recurring basis from the job definition.

> **Learn more:** [Data Loader at a glance](https://docs.reltio.com/en/applications/console/tenant-management-applications/data-loader-at-a-glance)

## 9. Glossary

**Column mapping:** The configuration that connects each column in a source file to the corresponding attribute in Reltio's data model, enabling the Data Loader to transform and load data correctly.

**Crosswalk:** A pointer that links a Reltio entity back to its original record in a source system, storing the source system URI and the record's unique ID in that system.

**Data Loader:** The Reltio application in the Console that enables you to prepare and upload data from files or cloud storage into a tenant. Requires the `ROLE_DATALOADER` global role.

**Data Loader workflow:** The sequence of steps for loading data using the Data Loader: create or duplicate a job → select file → map columns → specify update preference → optionally analyze → load → review results.

**Entity:** A master data record in Reltio — for example, an Individual, Organization, or Product. Entities are the primary data type loaded via the Data Loader.

**Job definition:** The configuration object in the Data Loader that stores all settings for a data load job, including source file details, column mappings, update preferences, and scheduling information.

**Relationship:** A typed link between two entities in Reltio — for example, an Employment relationship connecting an Individual entity to an Organization entity.

**Tenant:** An isolated Reltio environment associated with a specific organization or project. Each tenant has its own data, configuration, and users, identified by a unique tenant ID.

---

> **Disclaimer:** AI-generated from the Reltio documentation snapshot 2026-05-06 02:14 UTC (3,240 topics). AI output can contain subtle inaccuracies, and the knowledge base syncs twice a week — so the content here may lag [docs.reltio.com](https://docs.reltio.com). Verify anything critical against the official docs and your own tenant. Full disclaimer: [DISCLAIMER.md](../DISCLAIMER.md).
