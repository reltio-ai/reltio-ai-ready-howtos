# HOWTO: Configure a Reltio tenant for the Top 10 APIs tutorial

Turn a blank sandbox tenant into the tutorial's data model — Individual and Organization entity types, CRM and ERP sources, and an Employment relation — using a single `PUT /configuration` call.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#000066', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#0000CC', 'lineColor': '#000033', 'textColor': '#000033', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#f0f4ff', 'edgeLabelBackground': '#f0f4ff', 'clusterBkg': '#f0f4ff', 'clusterBorder': '#0000CC'}, 'themeCSS': '.edgeLabel { color: #000033 !important; background-color: #f0f4ff !important; font-weight: 500 !important; } .edgeLabel rect, .edgeLabel foreignObject { fill: #f0f4ff !important; }', 'flowchart': {'nodeSpacing': 40, 'rankSpacing': 55, 'curve': 'basis', 'padding': 12}}}%%
flowchart LR
    A[Get token] --> B[Read current L3]
    B --> C[Define sources]
    C --> D[Define entity types]
    D --> E[Add attributes]
    E --> F[Add relation type]
    F --> G[PUT configuration]
    G --> H[Verify tenant]
```

## Overview

This guide walks you through configuring an empty Reltio tenant so the Top 10 APIs tutorial works end to end. You'll apply a Layer 3 ([L3](#glossary)) configuration that defines two entity types, two sources, and one [relation type](#glossary), then verify the tenant is ready. Everything runs against the [Configuration API](#glossary) — no Console UI required.

This guide is for this Reltio role: **Developer**. For more information on data unification roles in the Reltio Context Intelligence Platform, see [About roles](https://docs.reltio.com/en/roles/about-roles).

## Contents

1. [Getting started](#1-getting-started)
2. [Key concepts](#2-key-concepts)
3. [Read the current L3 configuration](#3-read-the-current-l3-configuration)
4. [Define the sources](#4-define-the-sources)
5. [Define the Individual entity type](#5-define-the-individual-entity-type)
6. [Define the Organization entity type](#6-define-the-organization-entity-type)
7. [Define the Employment relation type](#7-define-the-employment-relation-type)
8. [Apply the L3 with Set Configuration](#8-apply-the-l3-with-set-configuration)
9. [Verify the tenant](#9-verify-the-tenant)
10. [Reset and rollback](#10-reset-and-rollback)
11. [Troubleshooting](#11-troubleshooting)
12. [Further reading](#12-further-reading)
13. [Glossary](#13-glossary)

## 1. Getting started

Gather these before you begin:

- A sandbox Reltio tenant you don't mind overwriting
- Your **Client ID** and **Client Secret** — credentials with configuration-update privileges (see the `MDM.config.businessModel - Update` note in Managing Sources)
- Your **Tenant URL** in the format `https://{env}.reltio.com/reltio/api/{tenantId}` (for example, `https://na07-prod.reltio.com/reltio/api/YOUR_TENANT_ID`)
- `curl` and `jq` available on your shell
- An access token obtained through the Reltio Authentication API — see [HOWTO: Authenticate and use Reltio APIs](./HOWTO-authenticate-and-use-reltio-apis.md)

Export the token and tenant URL once so later commands stay short:

```bash
export TOKEN="eyJhbGciOiJSUzI1NiIs..."
export TENANT="https://na07-prod.reltio.com/reltio/api/YOUR_TENANT_ID"
```

> **Important:** The steps below issue a `PUT /configuration`, which **replaces** the tenant's existing L3. Only run this on an empty or sandbox tenant.

> **Learn more:** [Apply an L3 to a tenant](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model/data-model/tenant-configuration-inheritance-across-layers/reltio-l3-layer----customer-tenant/apply-an-l3-to-a-tenant) in the Reltio documentation.

## 2. Key concepts

The tutorial's data model is small on purpose — three object types, three attributes, and two sources. Each piece maps to one or more tutorial steps.

| Component | Purpose |
|-----------|---------|
| [Entity type](#glossary) `Individual` | Represents a person with `FirstName`, `LastName`, and `Email` simple attributes |
| [Entity type](#glossary) `Organization` | Represents a company with a `Name` simple attribute |
| [Source](#glossary) `CRM` | Primary [source](#glossary) for individuals and organizations created during the tutorial |
| Source `ERP` | Second source used to create a near-duplicate record |
| [Relation type](#glossary) `Employment` | Links an `Individual` (start) to an `Organization` (end), with a `Title` attribute |

A few platform concepts to keep straight:

- **[L3](#glossary)** — the customer-owned configuration layer; the consolidated model a tenant actually runs on is L1 + L2 + L3 after inheritance.
- **[Configuration API](#glossary)** — the REST surface used to get and set L3. The two most-used calls are `GET /configuration` (with `_noInheritance` for just the L3 you own) and `PUT /configuration`.
- **[Crosswalk](#glossary)** — a pointer from a Reltio entity back to its source record; every record you load during the tutorial lands in the tenant with a [crosswalk](#glossary) whose `type` points to `configuration/sources/CRM` or `configuration/sources/ERP`.

The Top 10 APIs tutorial exercises CRUD, search, crosswalks, relations, match, and merge. The V1 tutorial you can follow today is [HOWTO: Top 10 Reltio APIs](./HOWTO-top-10-reltio-apis.md).

> **Learn more:** [Configuration API overview](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api) in the Reltio documentation.

## 3. Read the current L3 configuration

`GET /configuration/_noInheritance`

Pull just the L3 layer so you can see what (if anything) is already there before you overwrite it. `_noInheritance` returns only the customer-owned layer, not the consolidated L1 + L2 + L3.

**Request**

```bash
curl -s -X GET "${TENANT}/configuration/_noInheritance" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

**Response**

```json
{
  "label": "Test Business Model",
  "description": "Test Business Model Configuration-used to describe Configuration API format",
  "schemaVersion": "1",
  "entityTypes": [
    {
      "URI": "configuration/entityTypes/Individual",
      "label": "Individual",
      "name": "Individual",
      "id": "1",
      "attributes": [
        {
          "URI": "configuration/entityTypes/Individual/attributes/FirstName",
          "name": "FirstName",
          "label": "First Name",
          "id": "2",
          "type": "String"
        }
      ]
    }
  ]
}
```

### Why this matters

`GET /configuration` (the default) returns the consolidated model — L1 + L2 + L3 merged. The official guidance is explicit: **never apply a consolidated configuration to the tenant**. Always `GET` with `_noInheritance`, edit that, and `PUT` it back.

### Key rules

- **Use `_noInheritance` for edits** — it returns only your L3 layer.
- **Keep a copy of the response** — save it locally before you `PUT` so you can roll back.
- **An empty response is expected on a blank tenant** — the `PUT` will write the first version.

> **Learn more:** [Get Configuration (No Inheritance)](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/get-configuration-no-inheritance) in the Reltio documentation.

## 4. Define the sources

Sources are registered in the tenant's configuration under `configuration/sources`. Every record loaded into a tenant is associated with a source; if you don't specify one, Reltio defaults to `Reltio`. The tutorial uses two custom sources so you can see cross-source behavior.

Here's the fragment of the L3 payload that defines the two sources:

```json
{
  "sources": [
    {
      "URI": "configuration/sources/CRM",
      "label": "CRM",
      "name": "CRM",
      "description": "Primary CRM source for the Top 10 APIs tutorial"
    },
    {
      "URI": "configuration/sources/ERP",
      "label": "ERP",
      "name": "ERP",
      "description": "Secondary ERP source used for the duplicate record"
    }
  ]
}
```

### Key rules

- **Source URIs follow the `configuration/sources/{name}` pattern** — this is the path the platform uses to reach the source.
- **Names are used in the URI** — as a best practice, avoid special characters and spaces when creating a source.
- **Each source needs a unique name** — the `label` is the display name; the `name` is what appears in the URI.

> **Learn more:** [Managing Sources](https://docs.reltio.com/en/objectives/model-data/data-modeling-at-a-glance/data-modeling-operation/define-relationships/configuring-relationship-types/managing-sources) in the Reltio documentation.

## 5. Define the Individual entity type

Individuals are the protagonist of the tutorial — you'll create them, read them, update them, search for them, merge them. Three **simple** attributes keep the payloads compact: `FirstName`, `LastName`, and `Email`. Simple attributes hold a single characteristic and must be defined with a data type — here, `String`.

Here's the `Individual` entity type as it appears in the L3 payload:

```json
{
  "URI": "configuration/entityTypes/Individual",
  "label": "Individual",
  "name": "Individual",
  "description": "Represents people",
  "attributes": [
    {
      "URI": "configuration/entityTypes/Individual/attributes/FirstName",
      "name": "FirstName",
      "label": "First Name",
      "type": "String"
    },
    {
      "URI": "configuration/entityTypes/Individual/attributes/LastName",
      "name": "LastName",
      "label": "Last Name",
      "type": "String"
    },
    {
      "URI": "configuration/entityTypes/Individual/attributes/Email",
      "name": "Email",
      "label": "Email",
      "type": "String"
    }
  ]
}
```

### Why this matters

The entity type `URI` follows the format `configuration/entityTypes/{EntityTypeName}` and is used everywhere else in the payload to reference this type — for example, when the Employment relation points to it as its `startObject`. The `label` is the readable name, which shows up in the Hub.

### Key rules

- **Required metadata** — `URI`, `label`, and `name` must be provided on every entity type. Other properties such as `typeColor`, `typeIcon`, and `dataLabelPattern` are optional.
- **Simple attributes declare a `type`** — `String` works for all three attributes in this tutorial. Other supported data types include `Int`, `Long`, `Boolean`, `Date`, `Timestamp`, and `URL`.
- **Attribute URIs follow the `configuration/entityTypes/{EntityType}/attributes/{AttributeName}` pattern** — this is how cleanse rules, match rules, and survivorship rules reference them.

> **Learn more:** [Add an entity type](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/add-an-entity-type) in the Reltio documentation.

## 6. Define the Organization entity type

Organizations are the other side of the Employment relation. One simple `String` attribute — `Name` — is enough to carry through the tutorial.

```json
{
  "URI": "configuration/entityTypes/Organization",
  "label": "Organization",
  "name": "Organization",
  "description": "Represents companies",
  "attributes": [
    {
      "URI": "configuration/entityTypes/Organization/attributes/Name",
      "name": "Name",
      "label": "Name",
      "type": "String"
    }
  ]
}
```

### Key rules

- **Keep the model minimal** — the tutorial only needs one attribute on `Organization`. You can extend the type later through a follow-up `PUT /configuration` or via the Data Modeler.
- **The same attribute-URI convention applies** — `configuration/entityTypes/Organization/attributes/Name`.

> **Learn more:** [Reltio entity types](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model/data-model/reltio-object-types/reltio-entity-types) in the Reltio documentation.

## 7. Define the Employment relation type

Relation types link two entity types through a `startObject` and an `endObject`. For the tutorial, `Employment` points from an `Individual` to an `Organization`. The relation carries a `Title` attribute so you can store the employee's job title directly on the relation.

```json
{
  "URI": "configuration/relationTypes/Employment",
  "label": "Employment",
  "name": "Employment",
  "description": "Links an Individual to their employing Organization",
  "direction": "directed",
  "startObject": {
    "objectTypeURI": "configuration/entityTypes/Individual"
  },
  "endObject": {
    "objectTypeURI": "configuration/entityTypes/Organization"
  },
  "attributes": [
    {
      "URI": "configuration/relationTypes/Employment/attributes/Title",
      "name": "Title",
      "label": "Title",
      "type": "String"
    }
  ]
}
```

### How it works

Relation type metadata lets you describe *how* two entity types are linked. `direction` accepts `directed`, `undirected`, or `bidirectional`; the default is `directed`, which is what you want here since the Individual and the Organization play different roles. The `startObject` and `endObject` are required when inheritance is applied, and each carries the URI of the entity type it points at.

### Key rules

- **`startObject.objectTypeURI` and `endObject.objectTypeURI` must reference entity types defined in the same (or an inherited) configuration.** The two entity types from steps 5 and 6 satisfy this.
- **Relation attributes follow the same URI pattern as entity attributes** — `configuration/relationTypes/{TypeName}/attributes/{AttributeName}`.
- **Relation attributes are simple, atomic types.** Complex (nested) attributes aren't supported on relations.

> **Learn more:** [Relation Types](https://docs.reltio.com/en/developer-resources/relation-management-apis/relation-management-apis-at-a-glance/relations-api/relation-types) in the Reltio documentation.

## 8. Apply the L3 with Set Configuration

`PUT /configuration`

Assemble the pieces from steps 4–7 into a single L3 payload and `PUT` it. This call replaces the tenant's existing business model — no merge, no patch.

**Request**

```bash
curl -s -X PUT "${TENANT}/configuration" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "label": "Top 10 APIs Tutorial Model",
    "description": "Minimal L3 for the Top 10 Reltio APIs tutorial",
    "schemaVersion": "1",
    "sources": [
      {
        "URI": "configuration/sources/CRM",
        "label": "CRM",
        "name": "CRM",
        "description": "Primary CRM source"
      },
      {
        "URI": "configuration/sources/ERP",
        "label": "ERP",
        "name": "ERP",
        "description": "Secondary ERP source"
      }
    ],
    "entityTypes": [
      {
        "URI": "configuration/entityTypes/Individual",
        "label": "Individual",
        "name": "Individual",
        "attributes": [
          { "URI": "configuration/entityTypes/Individual/attributes/FirstName", "name": "FirstName", "label": "First Name", "type": "String" },
          { "URI": "configuration/entityTypes/Individual/attributes/LastName",  "name": "LastName",  "label": "Last Name",  "type": "String" },
          { "URI": "configuration/entityTypes/Individual/attributes/Email",     "name": "Email",     "label": "Email",      "type": "String" }
        ]
      },
      {
        "URI": "configuration/entityTypes/Organization",
        "label": "Organization",
        "name": "Organization",
        "attributes": [
          { "URI": "configuration/entityTypes/Organization/attributes/Name", "name": "Name", "label": "Name", "type": "String" }
        ]
      }
    ],
    "relationTypes": [
      {
        "URI": "configuration/relationTypes/Employment",
        "label": "Employment",
        "name": "Employment",
        "direction": "directed",
        "startObject": { "objectTypeURI": "configuration/entityTypes/Individual" },
        "endObject":   { "objectTypeURI": "configuration/entityTypes/Organization" },
        "attributes": [
          { "URI": "configuration/relationTypes/Employment/attributes/Title", "name": "Title", "label": "Title", "type": "String" }
        ]
      }
    ]
  }' | jq .
```

**Response**

```json
{
  "label": "Top 10 APIs Tutorial Model",
  "description": "Minimal L3 for the Top 10 Reltio APIs tutorial",
  "schemaVersion": "1",
  "updatedTime": 1700000005000,
  "entityTypes": [
    {
      "URI": "configuration/entityTypes/Individual",
      "label": "Individual",
      "name": "Individual",
      "id": "1",
      "attributes": [
        {
          "URI": "configuration/entityTypes/Individual/attributes/FirstName",
          "name": "FirstName",
          "label": "First Name",
          "id": "2",
          "type": "String"
        }
      ]
    }
  ]
}
```

### Why this matters

`PUT /configuration` is the write endpoint. If a configuration already exists, the operation **overrides** it. The response echoes back the saved model with system-generated `id` values for each entity type, attribute, and relation type. Those `id` values are used internally to diff configurations across versions.

### How it works

Before writing the model, the system runs L3 validation on the payload. If validation passes, the new L3 is applied and overwrites the existing one. If it fails, an error is returned to the client and nothing is persisted.

> **Tip:** Before you push a configuration to a production tenant, run the Validate Tenant Configuration API first: `GET {envUri}/reltio/tenants/{tenantId}/_validateTenantConfiguration`. It surfaces validation errors before they hit the `PUT`.

### Advanced options

You can add the `checkParallelUpdate=true` query parameter to prevent overwriting concurrent updates. When enabled, include the `updatedTime` you read in step 3 so the system can compare it with the stored value:

```bash
curl -s -X PUT "${TENANT}/configuration?checkParallelUpdate=true" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @l3-payload.json
```

If `request.updatedTime` is less than the stored `updatedTime`, the API returns `409 Conflict`.

### Key rules

- **`label` and `schemaVersion` are required** — omitting either fails validation.
- **Every `entityTypes[].URI`, `entityTypes[].name`, and `entityTypes[].label` is required** — same for each attribute.
- **Don't `PUT` a consolidated configuration** — use the L3 payload you built from `_noInheritance`, not the merged response from `GET /configuration`.

### What can go wrong

| Symptom | Cause | Fix |
|---------|-------|-----|
| `303` Business model schema cannot be parsed as XSD | Payload is malformed JSON or violates the schema | Validate the JSON and re-check that required fields (`URI`, `name`, `label`, `type`) are present |
| `304` Failed to validate business model | L3 validation rejected the model (for example, referenced attribute missing) | Read the validation error message and fix the referenced URI |
| `306` Failed to process business model JSON in create configuration request | Server couldn't parse the body | Check `Content-Type: application/json` and that the outer JSON object is well-formed |
| `409 Conflict` | `checkParallelUpdate=true` and your `updatedTime` is stale | Re-read `_noInheritance`, merge your edits, retry |

> **Learn more:** [Set Configuration](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/set-configuration) in the Reltio documentation.

## 9. Verify the tenant

`GET /configuration/_noInheritance`

Read the L3 back and confirm everything you sent is there — two entity types, two sources, and the Employment relation type.

**Request**

```bash
curl -s -X GET "${TENANT}/configuration/_noInheritance" \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq '{ entityTypes: [.entityTypes[].URI], sources: [.sources[].URI], relationTypes: [.relationTypes[].URI] }'
```

**Response**

```json
{
  "entityTypes": [
    "configuration/entityTypes/Individual",
    "configuration/entityTypes/Organization"
  ],
  "sources": [
    "configuration/sources/CRM",
    "configuration/sources/ERP"
  ],
  "relationTypes": [
    "configuration/relationTypes/Employment"
  ]
}
```

### Key rules

- **If a URI is missing, the `PUT` silently ignored that section** — re-check the payload for that object and re-run step 8.
- **`GET /configuration` (no flag) returns the consolidated model** — use `_noInheritance` here to confirm only what you wrote.

> **Learn more:** [GET Configuration](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/get-configuration) in the Reltio documentation.

## 10. Reset and rollback

Two ways to back out of the setup:

- **Re-apply a prior L3** — if you saved the response from step 3, `PUT` it back. `PUT /configuration` overrides the current model with whatever you send.
- **Delete an individual source** — if you only want to remove a source, `DELETE {TenantURL}/configuration/sources/{sourceName}` supports the `option=purgeAttributes` (default) and `option=purgeAllData` parameters. The first deletes the attribute values tied to that source but keeps crosswalks; the second deletes crosswalks too and kicks off a background purge task.

Example — remove the ERP source and purge both attributes and crosswalks:

```bash
curl -s -X DELETE "${TENANT}/configuration/sources/ERP?option=purgeAllData" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

> **Important:** If the source appears in any other L3 section (for example, `sourcesUriOrder` or `immutableForSources`), remove it from those sections first or the `DELETE` will fail validation.

> **Learn more:** [Delete a Source System](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/delete-a-source-system) in the Reltio documentation.

## 11. Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 Unauthorized` on `PUT /configuration` | Access token expired or the client lacks configuration-update privileges | Re-authenticate; confirm the role has `MDM.config.businessModel - Update` privilege |
| `303` or `304` validation error | Payload violates the L3 schema or references a missing URI | Run the Validate Tenant Configuration API before the `PUT` and fix the reported error |
| `309` Tenant not defined in the system | The `TenantURL` in your request is wrong | Copy the tenant URL from the Asset Sheet or the Reltio Console |
| `310` Failed to process Reltio Business Model JSON | Stored model is corrupt or unreadable | Contact Reltio Support |
| `PUT` returns 2xx but `_noInheritance` doesn't show your types | You `PUT` to a different tenant, or a proxy stripped the body | Confirm the `TENANT` variable; re-run step 8 with the body loaded from a file (`-d @l3-payload.json`) |
| Attribute referenced by a match or survivorship rule isn't found | URI typo, or the attribute section is missing from the payload | Fix the attribute URI; verify the attribute exists on the correct entity type |

> **Learn more:** [L3 validation errors](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model/data-model/tenant-configuration-inheritance-across-layers/reltio-l3-layer----customer-tenant/l3-validation-errors) in the Reltio documentation.

## 12. Further reading

- [Apply an L3 to a tenant](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model/data-model/tenant-configuration-inheritance-across-layers/reltio-l3-layer----customer-tenant/apply-an-l3-to-a-tenant)
- [Configuration API overview](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api)
- [Set Configuration](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/set-configuration)
- [GET Configuration](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/get-configuration)
- [Get Configuration (No Inheritance)](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/get-configuration-no-inheritance)
- [Add an entity type](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/add-an-entity-type)
- [Attributes configuration](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/attributes-configuration)
- [Reltio entity types](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model/data-model/reltio-object-types/reltio-entity-types)
- [Reltio attribute types](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model/data-model/reltio-object-types/reltio-attribute-types)
- [Relation Types](https://docs.reltio.com/en/developer-resources/relation-management-apis/relation-management-apis-at-a-glance/relations-api/relation-types)
- [Managing Sources](https://docs.reltio.com/en/objectives/model-data/data-modeling-at-a-glance/data-modeling-operation/define-relationships/configuring-relationship-types/managing-sources)
- [HOWTO: Authenticate and use Reltio APIs](./HOWTO-authenticate-and-use-reltio-apis.md)
- [HOWTO: Top 10 Reltio APIs](./HOWTO-top-10-reltio-apis.md) — the tutorial this setup enables.

## 13. Glossary

**Configuration API:** The REST API for retrieving, editing, and validating a tenant's metadata configuration. Its two most-used calls are `GET /configuration` and `PUT /configuration`.

**Crosswalk:** A reference that links a Reltio entity back to its record in a source system. Every record loaded into a tenant carries a crosswalk whose `type` points to a `configuration/sources/{name}` URI.

**Entity type:** A class of business object (for example, Individual or Organization) defined by metadata including a URI, label, and attributes. Entity types are the building blocks of a Reltio data model.

**L3:** The Layer 3, customer-owned configuration that overlays Reltio's L1 and L2 layers. When an L3 is applied, inheritance produces the consolidated tenant configuration the platform runs on.

**Relation type:** A configuration object that describes how two entity types are linked, using a `startObject` and `endObject`. Relation types can carry their own simple attributes.

**Source:** A registered origin of data in a tenant, defined as `configuration/sources/{name}`. Every record loaded into Reltio is associated with a source; if none is specified, the source defaults to `Reltio`.

---

> **Disclaimer:** AI-generated from the Reltio documentation snapshot 2026-04-22 02:14 UTC (3,233 topics). AI output can contain subtle inaccuracies, and the knowledge base syncs twice a week — so the content here may lag [docs.reltio.com](https://docs.reltio.com). Verify anything critical against the official docs and your own tenant. Full disclaimer: [DISCLAIMER.md](../DISCLAIMER.md).
