# HOWTO: Use Search Before Create in the Reltio Integration for Salesforce

A guide to understanding, setting up, and using Search Before Create (SBC) in the Reltio Integration for Salesforce with RIH — so your team searches for existing records before creating new ones, avoiding duplicates across both systems.

---

## Table of contents

1. [What is Search Before Create?](#1-what-is-search-before-create)
2. [How it works](#2-how-it-works)
3. [Prerequisites](#3-prerequisites)
4. [Install the managed package](#4-install-the-managed-package)
5. [Activate the SBC API collection in RIH](#5-activate-the-sbc-api-collection-in-rih)
6. [Create an API client and generate a security code](#6-create-an-api-client-and-generate-a-security-code)
7. [Configure SBC in Salesforce](#7-configure-sbc-in-salesforce)
8. [Override the New button](#8-override-the-new-button)
9. [Using SBC day-to-day](#9-using-sbc-day-to-day)
10. [SBC recipes in RIH](#10-sbc-recipes-in-rih)
11. [Add a custom field to SBC search](#11-add-a-custom-field-to-sbc-search)
12. [Import with relations](#12-import-with-relations)
13. [SBC API reference](#13-sbc-api-reference)
14. [Troubleshooting](#14-troubleshooting)
15. [Known limitations](#15-known-limitations)

---

## Prerequisites

| What | Details |
|------|---------|
| **Reltio product** | Reltio Entity Resolution, Multidomain MDM, or 360 Data Products |
| **Integration Hub** | RIH access with `ROLE_INTEGRATION_SPECIALIST` or `ROLE_INTEGRATION_CUSTOMER_ADMIN` |
| **Salesforce** | Admin access to install managed packages |
| **Reltio role** | `ROLE_API` (required for SBC) |
| **Connections** | Active connections to both Salesforce and your Reltio tenant in RIH |
| **Recipe groups** | Common Functions, Search Before Create, To SFDC Sync/RT Event-Driven, and To Reltio Sync/RT Event-Driven groups must be started |

---

## 1. What is Search Before Create?

Search Before Create (SBC) is a feature in the Reltio Integration for Salesforce that performs a **real-time search across both Reltio and Salesforce** before creating a new record. It searches for existing entries in Salesforce, the Reltio Customer Tenant, and the Reltio Data Tenant.

The goal: **eliminate duplicate records** when users create Accounts or Contacts in Salesforce.

SBC uses RIH recipes to search for records in Salesforce and Reltio, and imports the missing records into Salesforce — so instead of blindly creating a new record, the system first checks whether it already exists somewhere.

---

## 2. How it works

When a user clicks **New** on an Account or Contact in Salesforce (with SBC enabled), three things can happen:

| Scenario | What happens |
|----------|-------------|
| **Record exists in Salesforce** | SBC finds it in the search results. The user navigates directly to the existing record — no duplicate created. |
| **Record exists in Reltio but not Salesforce** | SBC finds it in Reltio. The user imports it into Salesforce. The connector adds a Salesforce crosswalk to the Reltio entity. |
| **Record doesn't exist anywhere** | No results found. The user creates a new record in Salesforce. The connector creates the entity in Reltio and adds a crosswalk. |

The search happens in three stages:

1. **Salesforce records** — searches existing Salesforce data
2. **Reltio Customer Tenant (CT)** — searches the master data
3. **Reltio Data Tenant (DT)** — searches data tenant records

Results are displayed with actions: **Preview/Import** for Reltio-sourced records, and **Preview** for Salesforce-sourced records.

---

## 3. Prerequisites

Before setting up SBC, make sure you have:

- The Reltio Integration for Salesforce (with RIH) set up with **bidirectional sync** working
- Active connections to Salesforce and your Reltio tenant in RIH
- The following recipe groups started:
  - Common Functions
  - Search Before Create
  - To SFDC Sync/RT Event-Driven
  - To Reltio Sync/RT Event-Driven
- A Salesforce admin account (to install the managed package)
- A Trailblazer account (for Salesforce AppExchange access)

---

## 4. Install the managed package

The SBC feature requires the **Reltio Integration for Salesforce managed package** installed in your Salesforce org.

1. Log in to your **Trailblazer** account.
2. Go to Salesforce **AppExchange** and search for the Reltio Integration for Salesforce package.
3. Select **Install for Admins Only**.
4. Complete the installation.

> **Important:** After installation, configure **remote site settings** to allow Salesforce to communicate with the RIH API. Add the Workato URI (`https://apim.workato.com`) to your Salesforce remote site settings.

> **Note:** Non-admin users need the **RIH SBC Other Users** permission set assignment to use SBC.

---

## 5. Activate the SBC API collection in RIH

The SBC recipes use an API collection called **SFDC-SBC** that exposes search and import endpoints.

1. In RIH, go to **API Platform** > **API Collection**.
2. Find the **SFDC-SBC** collection.
3. Select **Activate endpoint**.
4. Copy the generated URL — you'll need it when configuring SBC in Salesforce.

The SFDC-SBC collection includes these endpoints:

| Endpoint | Purpose |
|----------|---------|
| `SBC-Account-Search` | Search for Account records |
| `SBC-Account-Import` | Import Account records |
| `SBC-Contact-Search` | Search for Contact records |
| `SBC-Contact-Import` | Import Contact records |

---

## 6. Create an API client and generate a security code

SBC needs an API client to authenticate requests between Salesforce and RIH.

1. In RIH, go to **API Platform**.
2. Select **Create API client**.
3. Set the name to `SBC MP Client`.
4. Set the profile to `SBC MP Client Profile`.
5. Set the API collection to **SFDC-SBC**.
6. **Generate a security code** — copy it. You'll enter this in the Salesforce Control Panel.

---

## 7. Configure SBC in Salesforce

With the managed package installed, the API collection activated, and the security code generated:

1. In Salesforce, open the **App Launcher**.
2. Select **Control Panel** (the Reltio Control Panel).
3. Select **+NEW** to create a new SBC configuration.
4. Select the **object** (Account or Contact).
5. Enter the **Import endpoint URL** (from the SFDC-SBC collection).
6. Enter the **Search endpoint URL** (from the SFDC-SBC collection).
7. Enter the **Security code** (generated in the previous step).
8. Select the **Input fields** — these are the fields users will search by.
9. Select **Test** to verify the connection.
10. **Save** the configuration.

> **Tip:** The search section in the SBC page is generated dynamically from the input mapping. Choose input fields that your users will naturally search by — name, email, phone, etc.

---

## 8. Override the New button

To make SBC the default experience when users create new records, override the standard **New** button with the SBC component.

1. In Salesforce, go to **Setup** > **Object Manager**.
2. Select the object (e.g., Account).
3. Go to **Buttons, Links, and Actions**.
4. Find the **New** button.
5. Select **Override** and set it to the SBC component: `rihsbc:SbcObjectFormComponent`.

After this, clicking **New** on an Account or Contact opens the SBC search page instead of the standard create form.

> **Note:** If the user's search returns no results, a **Create New Account** (or Contact) button appears. The search fields the user already populated carry forward into the creation form — no need to re-enter them.

---

## 9. Using SBC day-to-day

Once configured, this is the user experience:

1. In Salesforce, click **New** on an Account or Contact.
2. The SBC search page opens instead of the standard form.
3. Enter search criteria (name, email, phone, etc.).
4. Select **Search**.
5. Review results from three sources: Salesforce, Reltio CT, and Reltio DT.
6. Choose an action:

| Result source | Available actions |
|---------------|-------------------|
| **Salesforce** | **Preview** — view the existing record and navigate to it |
| **Reltio CT or DT** | **Preview** — view the record details. **Import** — import it into Salesforce |
| **No results** | **Create New** — opens the standard creation form with search fields pre-populated |

When you import a Reltio record into Salesforce, the connector automatically adds a Salesforce crosswalk to the Reltio entity — linking the two records for future sync.

---

## 10. SBC recipes in RIH

SBC uses a set of prebuilt RIH recipes. Understanding them helps with troubleshooting and customization.

### Trigger recipes

| Recipe | Purpose |
|--------|---------|
| `SFDC \| API \| SBC - Search Account` | Triggers an Account search via the SBC API |
| `SFDC \| API \| SBC - Search Contact` | Triggers a Contact search via the SBC API |
| `SFDC \| API \| SBC - Import Account` | Triggers an Account import via the SBC API |
| `SFDC \| API \| SBC - Import Contact` | Triggers a Contact import via the SBC API |

### Process recipes

| Recipe | Purpose |
|--------|---------|
| `SFDC \| PROC \| SBC - Search Process for Account` | Converts SBC search parameters into SOQL (for Salesforce) and Reltio search format, searches both systems |
| `SFDC \| PROC \| SBC - Search Process for Contact` | Same as above, for Contacts |
| `SFDC \| PROC \| SBC - Import Process for Account - Reltio` | Converts Reltio entity objects to Salesforce Account object model for import |
| `SFDC \| PROC \| SBC - Import Process for Contact - Reltio` | Same as above, for Contacts |

### Search parameters

The search API trigger recipes accept these parameters:

| Parameter | Description |
|-----------|-------------|
| `filter` | Search criteria (e.g., `FirstName:John`) |
| `recordTypeId` | Salesforce Record Type ID for the object |
| `test` | Set to `true` to test without creating records |
| `options` | Comma-separated: `searchByOv`, `useContains`, `useFuzzy`, `useOr`, `useSOSL` |
| `max` | Maximum results per source (up to 100) |

### Import parameters

| Parameter | Description |
|-----------|-------------|
| `sourceSystem` | The source system for the import (`ct` or `dt`) |
| `recordTypeId` | Salesforce Record Type ID |
| `test` | Set to `true` for test mode |
| `sourceSystemEntityID` | The Reltio entity URI to import |

---

## 11. Add a custom field to SBC search

To add a field that isn't in the default SBC mapping:

1. In RIH, navigate to **SFDC** > **Search Before Create** > **2-Process**.
2. Open the **SBC - Search Process** recipe for the relevant object (Account or Contact).
3. Add the new field to the search mapping.
4. Save and restart the recipe.

The new field will appear in the SBC search page the next time a user opens it.

---

## 12. Import with relations

SBC can import records **with their related objects** — for example, importing a Contact and automatically creating its parent Account if it doesn't exist in Salesforce.

### Enable import with relations

This feature requires managed package version **1.10019 or later**.

1. In the Reltio Control Panel, go to **SBC Basic Settings**.
2. Enable the **Import with relations** flag.

### How it works

When importing a Reltio record:

1. SBC checks if the related object (e.g., parent Account) already exists in Salesforce by checking crosswalks.
2. If the related object exists, it links the imported record to it.
3. If the related object doesn't exist, SBC creates it first, then links the imported record.

This avoids orphaned records and maintains relationship integrity across both systems.

---

## 13. SBC API reference

SBC exposes three APIs through the managed package.

### Perform Search

Searches for records in both Salesforce and Reltio.

```
GET {SbcApiUrl}/{tenant}/{profile}/search
```

| Parameter | Description |
|-----------|-------------|
| `sObject` | Salesforce object type (e.g., `Account`) |
| `recordTypeId` | Salesforce Record Type ID |
| `filter` | Search criteria (e.g., `FirstName:John`) |
| `searchIn` | Where to search: `ct` (Customer Tenant), `dt` (Data Tenant), or both |
| `select` | Fields to return |
| `options` | `searchByOv`, `useContains`, `useFuzzy`, `useOr`, `useSOSL` |
| `max` | Maximum results per source (up to 100) |
| `sort` | Field to sort by |
| `order` | Sort order (`asc` or `desc`) |

**Search methods:** The API uses **SOSL** first (if enabled via `useSOSL`), then falls back to **SOQL**.

**Response** contains three arrays:

| Array | Source |
|-------|--------|
| `sf` | Salesforce records |
| `ct` | Reltio Customer Tenant records |
| `dt` | Reltio Data Tenant records |

### Fuzzy search

Add `useFuzzy` to the options to return results even with typos:

```
GET {SbcApiUrl}/{tenant}/{profile}/search?searchIn=ct&sObject=Account&recordTypeId={recordTypeId}&filter=FirstName:Ttayana&options=useFuzzy
```

### Get Input Mapping

Returns the Salesforce fields available for SBC search, including related objects.

```
GET {SbcApiUrl}/{tenant}/{profile}/inputMappings
```

Returns fields with their relationship, type, and RecordTypeId.

### Import Entity

Imports a record from Reltio (Customer Tenant or Data Tenant) into Salesforce.

```
GET {SbcApiUrl}/{tenant}/{profile}/{source}/import
```

| Parameter | Description |
|-----------|-------------|
| `sObject` | Salesforce object type |
| `recordTypeId` | Salesforce Record Type ID |
| `uri` | Reltio entity URI to import |
| `ownerId` | Salesforce owner ID for the imported record |

---

## 14. Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| **Invalid Cross Reference ID** | An ID field references a record from a different Salesforce org | Check your mapping — make sure IDs match the current Salesforce org |
| **Salesforce validation error** | A Salesforce Validation Rule is blocking the import | Review the Validation Rules on the object and adjust your mapping or the rule |
| **Country must be set before setting State** | State/Country picklists require the country first | Use `CountryCode` mapping with ISO 3166 country codes instead of country names |
| **Field is not writable** | The mapping includes a non-editable Salesforce field | Remove the non-editable field from the `to_salesforce` mapping |
| **Picklists not appearing for State/Country** | State/Country picklists not configured | Use `CountryCode` and `StateCode` fields with ISO 3166 codes |

### SBC Mappings when sync is to_reltio only

If your sync mapping only has a `to_reltio` section (no `to_salesforce`), SBC mappings still need the `to_salesforce` section because SBC searches by Salesforce fields. Add the `to_salesforce` section with the `sbcOnly` property to support SBC without enabling full outbound sync.

---

## 15. Known limitations

- SBC is supported for **Account** and **Contact** objects only.
- Maximum **100 results per source** (Salesforce, CT, DT) per search.
- The **Import with relations** feature requires managed package version 1.10019 or later.
- SBC requires the `ROLE_API` Reltio role.
- When a Salesforce record creation fails due to detected duplicates, Reltio automatically links the existing Salesforce record to the corresponding Reltio entity by adding the Salesforce crosswalk and retries as an update.

---

## Further reading

- [Reltio Integration for Salesforce (with RIH) overview](https://docs.reltio.com/en/applications/integration-hub/reltio-integration-for-salesforce-with-rih/reltio-integration-for-salesforce-with-rih-at-a-glance) — Setup and architecture
- [Enable Search Before Create](https://docs.reltio.com/en/applications/integration-hub/reltio-integration-for-salesforce-with-rih/enable-search-before-create) — Prerequisites and activation steps
- [SBC recipes](https://docs.reltio.com/en/applications/integration-hub/reltio-integration-for-salesforce-with-rih/recipes-for-search-before-create) — Prebuilt recipe reference
- [Install the managed package](https://docs.reltio.com/en/applications/integration-hub/reltio-integration-for-salesforce-with-rih/install-the-reltio-integration-for-salesforce-managed-package-to-enable-sbc) — AppExchange installation steps
- [Configure SBC](https://docs.reltio.com/en/applications/integration-hub/reltio-integration-for-salesforce-with-rih/configure-search-before-create-rih) — Salesforce-side configuration
- [SBC API reference](https://docs.reltio.com/en/developer-resources/reltio-managed-package-apis/search-before-create-api) — Perform Search, Get Input Mapping, Import Entity

---

> **Disclaimer:** This guide was generated with AI assistance using official Reltio documentation as source material. While every effort has been made to ensure accuracy, Reltio product behavior may change between releases. Always verify critical steps against your own Reltio environment and the [official documentation](https://docs.reltio.com). Last validated against documentation dated March 31, 2026.

*Guide based on Reltio documentation (March 2026).*
