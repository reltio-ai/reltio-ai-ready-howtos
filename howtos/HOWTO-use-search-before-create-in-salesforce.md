# HOWTO: Use Search Before Create in Salesforce

Set up and use Search Before Create (SBC) in the Reltio Integration for Salesforce with RIH to prevent duplicate records by searching Reltio and Salesforce before creating anything new.

## Overview

This guide covers the end-to-end setup of Search Before Create in the Reltio Integration for Salesforce: installing the managed package, activating the API collection in RIH, creating an API client, and using the SBC search and import workflow day-to-day. It also covers the SBC recipes and the end-user search flow.

**Audience:** Developer, System Administrator

## Contents

1. [Getting started](#1-getting-started)
2. [Install the managed package](#2-install-the-managed-package)
3. [Activate the SBC API collection in RIH](#3-activate-the-sbc-api-collection-in-rih)
4. [Create an API client and generate a security code](#4-create-an-api-client-and-generate-a-security-code)
5. [Search for existing records before creating](#5-search-for-existing-records-before-creating)
6. [SBC recipes reference](#6-sbc-recipes-reference)
7. [Glossary](#7-glossary)

## 1. Getting started

Search Before Create ([SBC](#glossary)) is a feature in the Reltio Integration for Salesforce that performs a real-time search across both Reltio and Salesforce before a user creates a new Account or Contact. It searches for existing entries in Salesforce, the Reltio Customer Tenant, and the Reltio Data Tenant. The goal is to eliminate duplicate records.

When a user clicks **New** on an Account or Contact in Salesforce with SBC enabled, three outcomes are possible:

| Scenario | What happens |
|----------|-------------|
| Record exists in Salesforce | SBC finds it in search results — the user navigates to the existing record, no duplicate created |
| Record exists in Reltio but not Salesforce | SBC finds it in Reltio — the user can import it into Salesforce; the connector adds a Salesforce [crosswalk](#glossary) to the Reltio entity |
| Record does not exist anywhere | No results found — the user creates a new record in Salesforce; the connector creates the entity in Reltio and adds a crosswalk |

Before you begin setup, confirm you have:

- Reltio Integration for Salesforce (with [RIH](#glossary)) already set up with bidirectional sync working
- Active connections to both Salesforce and your Reltio tenant in RIH
- The following [recipe](#glossary) groups started in RIH: Common Functions, Search Before Create, To SFDC Sync/RT Event-Driven, and To Reltio Sync/RT Event-Driven
- Admin access to Salesforce (to install [managed packages](#glossary))
- A Trailblazer account (for Salesforce AppExchange access)
- The Reltio role `ROLE_API` (required for SBC)

> **Learn more:** [Search Before Create (SBC)](https://docs.reltio.com/en/applications/data-integrations/application-integration-at-a-glance/reltio-integration-for-salesforce-with-rih-at-a-glance/reltio-integration-for-salesforce-with-rih-set-up/search-before-create-sbc)

## 2. Install the managed package

The SBC feature requires the Reltio Integration for Salesforce [managed package](#glossary) installed in your Salesforce org.

**Prerequisites:**

- Trailblazer account
- Salesforce login credentials
- Admin access to Salesforce AppExchange

**Steps:**

1. In Salesforce Setup, search for AppExchange or use App Launcher, then select **Visit AppExchange**.
2. In the AppExchange Marketplace, select **Go to AppExchange**.
3. Log in to your Trailblazer account and select **Continue with Salesforce**.
4. Search for **Reltio Integration for Salesforce**.
5. Select it, then click **Get It Now**.
6. Allow AppExchange to access your Salesforce URL.
7. In the **Where do you want to install** dialog, select your environment. Reltio recommends installing in a sandbox environment first.
8. Confirm and select **Install**. Enter your Salesforce credentials when prompted.
9. Select **Install for Admins Only**.
10. Complete the installation.
11. Configure remote site settings to allow Salesforce to communicate with the RIH API. Add the Workato URI (`https://apim.workato.com`) to your Salesforce remote site settings.
12. Launch **Reltio Integration for Salesforce** and proceed to **Configure Search before Create**.

> **Note:** Non-admin users need the **RIH SBC Other Users** permission set assignment to use SBC.

> **Learn more:** [Install the Reltio Integration for Salesforce managed package to enable SBC](https://docs.reltio.com/en/applications/data-integrations/application-integration-at-a-glance/reltio-integration-for-salesforce-with-rih-at-a-glance/reltio-integration-for-salesforce-with-rih-set-up/search-before-create-sbc/install-the-reltio-integration-for-salesforce-managed-package-to-enable-sbc)

## 3. Activate the SBC API collection in RIH

The SBC [recipes](#glossary) use an [API collection](#glossary) called **SFDC-SBC** that exposes the search and import endpoints. You must activate all endpoints in this collection before configuring SBC in Salesforce.

**Prerequisites:** SBC recipe groups must be started in [RIH](#glossary).

**Steps:**

1. In RIH, select **API Platform**.
2. Select **API Collection** and find **SFDC-SBC**.
3. For all endpoints in the collection, select **Activate endpoint** from the more options menu.
4. Select an endpoint to view its details.
5. In the right pane, select **Copy URL** — you will use this URL when configuring SBC in the Salesforce managed package (SFDC MP).

The SFDC-SBC collection includes endpoints for searching and importing both Account and Contact records.

> **Learn more:** [Enable Search Before Create](https://docs.reltio.com/en/applications/data-integrations/application-integration-at-a-glance/reltio-integration-for-salesforce-with-rih-at-a-glance/reltio-integration-for-salesforce-with-rih-set-up/search-before-create-sbc/enable-search-before-create)

## 4. Create an API client and generate a security code

SBC needs an API client in RIH to authenticate requests between Salesforce and RIH. The security code (Auth Token) generated here is entered into the Salesforce Control Panel.

**Steps:**

1. In RIH, select **API Platform**, then select **Clients**, then select **Add new client**.
2. Enter the name: **SBC MP Client**.
3. Select **Create New Access Profile** and enter the name: **SBC MP Client Profile**.
4. Under **API Collections to Include**, select **SFDC-SBC**.
5. Set **Authentication Mode** to **Auth Token**.
6. Leave the **Policy** field empty.

> **Caution:** If the Policy field is configured, it restricts API access. Leave it empty for standard SBC use.

7. Select **Next**. The API client is created.
8. Select the **API keys** tab, then select **Create API key**, and enter a name.
9. Leave **Allowed IPs** and **Blocked IPs** empty.

> **Caution:** If Allowed IPs or Blocked IPs are configured, they limit who can call the API. Leave them empty unless your security requirements specify otherwise.

10. Copy the **Auth Token** (Security Code). You will enter this value into the SBC configuration in Salesforce.

> **Learn more:** [Enable Search Before Create](https://docs.reltio.com/en/applications/data-integrations/application-integration-at-a-glance/reltio-integration-for-salesforce-with-rih-at-a-glance/reltio-integration-for-salesforce-with-rih-set-up/search-before-create-sbc/enable-search-before-create)

## 5. Search for existing records before creating

Once the [managed package](#glossary) is installed and SBC is configured, this is the end-user workflow for searching before creating a new Account or Contact in Salesforce.

**Steps:**

1. Open the **App Launcher** in Salesforce.
2. Select **Reltio Integration for Salesforce**.
3. Select the **Control Panel** tab.
4. From the **Search objects** tab, select the Salesforce object you want to search (Account or Contact).
5. Open the list view of the selected object.
6. Select **New**.
7. On the **Search Account** (or Search Contact) page, enter your search criteria.
8. Optionally, select **Configure Search** to choose which fields are displayed in the search form:
   - Add fields to or remove them from the **Selected fields** column.
   - Select **Save**.
9. Enter details in the search fields and select **Search**.
10. Review the search results from three sources: Salesforce, Reltio CT, and Reltio DT.
11. Take an action based on the results:

| Result source | Available actions |
|---------------|-------------------|
| Salesforce | **Preview** — view the existing record and navigate to it |
| Reltio CT or Reltio DT | **Preview** — view the record details. **Import** — import the record into Salesforce. |
| Record already exists in Salesforce | **Use This Record** — link to the existing Salesforce record instead of importing. |
| No results found | **Create New** — opens the standard creation form with the search fields pre-populated. |

When you import a Reltio record into Salesforce, the connector automatically adds a Salesforce [crosswalk](#glossary) to the Reltio entity, linking the two records for future sync.

> **Learn more:** [Search Before Create (SBC)](https://docs.reltio.com/en/applications/data-integrations/application-integration-at-a-glance/reltio-integration-for-salesforce-with-rih-at-a-glance/reltio-integration-for-salesforce-with-rih-set-up/search-before-create-sbc)

## 6. SBC recipes reference

[SBC](#glossary) uses a set of prebuilt [RIH](#glossary) [recipes](#glossary) to handle search and import operations. Understanding them helps with troubleshooting and customization.

### Search recipe

**SFDC | API | SBC - Search Account/Contact**

An API endpoint [recipe](#glossary) that searches for accounts or contacts in both Salesforce and Reltio (Organization details).

| Input parameter | Description |
|----------------|-------------|
| `filter` | SBC search filter criteria |
| `recordTypeId` | Salesforce Account or Contact record type ID |
| `test` | Set to `true` to test without creating records |
| `options` | Comma-separated options: `searchByOv`, `useContains`, `useFuzzy`, `useOr` |
| `max` | Maximum records per source (up to 100) |

Returns: a list of matching records, or an error code.

### Import recipe

**SFDC | API | SBC - Import Account/Contact**

An API endpoint [recipe](#glossary) that triggers the import of an account or contact object (and its parent objects) from Reltio into Salesforce.

| Input parameter | Description |
|----------------|-------------|
| `sourceSystem` | The source system for the import (`ct` for Customer Tenant or `dt` for Data Tenant) |
| `recordTypeId` | Salesforce Account or Contact record type ID |
| `test` | Set to `true` for test mode |
| `sourceSystemEntityID` | The Reltio entity URI to import (for example, `entities/04rIXee`) |

Returns: information about the imported record and related records, or an error.

> **Learn more:** [Recipes for Search Before Create](https://docs.reltio.com/en/applications/data-integrations/application-integration-at-a-glance/reltio-integration-for-salesforce-with-rih-at-a-glance/reltio-integration-for-salesforce-with-rih-set-up/search-before-create-sbc/recipes-for-search-before-create)

## 7. Glossary

**API collection:** A named group of related API endpoints in RIH that are managed together for access control and activation. The SFDC-SBC collection contains the Search and Import endpoints for SBC.

**Crosswalk:** A pointer that links a Reltio entity back to its original record in a source system, storing the source system URI and the record's unique ID in that system. When SBC imports a Salesforce record, the connector adds a Salesforce crosswalk to the Reltio entity.

**Managed package:** A Salesforce AppExchange package that bundles components (Apex classes, Lightning components, custom objects) and is installed into a Salesforce org. The Reltio Integration for Salesforce managed package adds the SBC UI and configuration components.

**Recipe:** A prebuilt automation workflow in the Reltio Integration Hub (RIH) that connects Reltio and Salesforce. SBC uses API endpoint recipes to handle search and import requests between the two systems.

**RIH (Reltio Integration Hub):** The Reltio integration platform (built on Workato) that hosts prebuilt recipes for connecting Reltio to external systems such as Salesforce. RIH manages the API collections and clients used by SBC.

**SBC (Search Before Create):** A feature in the Reltio Integration for Salesforce that searches both Reltio and Salesforce for an existing record before a user creates a new one. Prevents duplicate records across both systems. Supported for Account and Contact objects only, with a maximum of 100 results per source.

---

> **Disclaimer:** AI-generated from the Reltio documentation snapshot 2026-05-06 02:14 UTC (3,240 topics). AI output can contain subtle inaccuracies, and the knowledge base syncs twice a week — so the content here may lag [docs.reltio.com](https://docs.reltio.com). Verify anything critical against the official docs and your own tenant. Full disclaimer: [DISCLAIMER.md](../DISCLAIMER.md).
