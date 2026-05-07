# HOWTO: Use the top 10 Reltio APIs

Work through the ten most important Reltio REST APIs end to end — from fetching an access token to reading an [entity](#glossary)'s full audit trail — in a single connected workflow.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#000066', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#0000CC', 'lineColor': '#000033', 'textColor': '#000033', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#f0f4ff', 'edgeLabelBackground': '#f0f4ff', 'clusterBkg': '#f0f4ff', 'clusterBorder': '#0000CC'}, 'themeCSS': '.edgeLabel { color: #000033 !important; background-color: #f0f4ff !important; font-weight: 500 !important; } .edgeLabel rect, .edgeLabel foreignObject { fill: #f0f4ff !important; }', 'flowchart': {'nodeSpacing': 40, 'rankSpacing': 55, 'curve': 'basis', 'padding': 12}}}%%
flowchart LR
    A[Get token] --> B[Read data model]
    B --> C[Create entities]
    C --> D[Search entities]
    D --> E[Lookup crosswalk]
    E --> F[Update attribute]
    F --> G[Create relation]
    G --> H[Find matches]
    H --> I[Merge entities]
    I --> J[View history]
```

## Overview

This tutorial walks you through the ten Reltio API calls that cover the full lifecycle of a mastered record: authenticate, inspect the tenant's data model, create and search entities, reconcile them by [crosswalk](#glossary), update attributes, link entities with a relation, surface potential duplicates, merge them, and review the change history. Each step reuses the data created by the previous one, so by the end you have a working golden record with a complete audit trail. Everything runs against Reltio's REST APIs using `curl` — no SDK or UI required.

This guide is for this Reltio role: **Developer**. For more information on data unification roles in the Reltio Context Intelligence Platform, see [About roles](https://docs.reltio.com/en/roles/about-roles).

## Contents

1. [Getting started](#1-getting-started)
2. [Key concepts](#2-key-concepts)
3. [Authenticate](#3-authenticate)
4. [Read your data model](#4-read-your-data-model)
5. [Create entities](#5-create-entities)
6. [Search for entities](#6-search-for-entities)
7. [Look up an entity by crosswalk](#7-look-up-an-entity-by-crosswalk)
8. [Update an attribute](#8-update-an-attribute)
9. [Create a relationship](#9-create-a-relationship)
10. [Find potential matches](#10-find-potential-matches)
11. [Merge two entities](#11-merge-two-entities)
12. [View entity history](#12-view-entity-history)
13. [Troubleshooting](#13-troubleshooting)
14. [Further reading](#14-further-reading)
15. [Glossary](#15-glossary)

## 1. Getting started

Gather these before you begin:

- A Reltio tenant configured with the tutorial data model — two entity types (`Individual`, `Organization`), two sources (`CRM`, `ERP`), and an `Employment` relation. If you don't have one yet, run [HOWTO: Configure a Reltio tenant for the Top 10 APIs tutorial](./HOWTO-SETUP-for-top-10-reltio-apis.md) first.
- Your **Client ID** and **Client Secret** — credentials for an [application client](#glossary) that can read and write the tenant.
- Your **Tenant URL** in the format `https://{environment}.reltio.com/reltio/api/{tenantId}` (for example, `https://na07-prod.reltio.com/reltio/api/YOUR_TENANT_ID`).
- A terminal with `curl` and `jq` installed.

The tutorial reuses three shell variables across every step. Export them once and keep the terminal open:

```bash
export CLIENT_ID="YOUR_CLIENT_ID"
export CLIENT_SECRET="YOUR_CLIENT_SECRET"
export TENANT="https://na07-prod.reltio.com/reltio/api/YOUR_TENANT_ID"
```

You'll set `TOKEN` in [Step 3](#3-authenticate) and a few entity-URI variables (`ENTITY_JOHN`, `ENTITY_JANE`, `ENTITY_ACME`, `ENTITY_JON`) as you go.

> **Learn more:** [Reltio API overview](https://docs.reltio.com/en/developer-resources) in the Reltio documentation.

## 2. Key concepts

The ten APIs in this guide fall into four groups — one authentication call, one configuration read, six entity-management calls, one relation call, and two match/merge calls. A handful of shared ideas run through all of them.

- **[OAuth 2.0 client credentials](#glossary)** — Reltio's Authentication API issues a short-lived bearer token. Every tenant call needs `Authorization: Bearer ${TOKEN}`.
- **[Entity](#glossary)** — one record of a real-world thing (a person, an organization). Entities have attributes and are identified by a URI like `entities/ABC123`.
- **[Crosswalk](#glossary)** — the pointer from an entity back to its source record. `CRM-1001` in the `CRM` source and `ERP-5001` in the `ERP` source are both crosswalks on the same Reltio entity.
- **[Operational value (OV)](#glossary)** — the [survivorship](#glossary)-selected winning value for an attribute after Reltio reconciles multiple sources.
- **[Match rule](#glossary)** — a configured predicate that flags likely duplicates. The setup guide defines a single `suspect`-type rule called `SuspectLastNameEmail`.
- **Asynchronous processing** — entity creation, match evaluation, and merges complete asynchronously. A successful `HTTP 200` means the request was accepted, not that every downstream index is updated. Wait a few seconds before polling a follow-up call.

Every tenant API URL in this guide is relative to `${TENANT}`. The Authentication API is the one exception: it lives at `https://auth.reltio.com` and is not tenant-specific.

> **Learn more:** [Reltio information model](https://docs.reltio.com/en/reltio/what-does-reltio-do/what-reltio-does-at-a-glance/data-unification-and-mdm-at-a-glance/data-unification-and-mdm-in-detail/reltio-information-model) in the Reltio documentation.

## 3. Authenticate

**Endpoint:** `POST https://auth.reltio.com/oauth/token`

The Authentication API implements the [OAuth 2.0 client credentials](#glossary) grant. You exchange your Client ID and Client Secret for an access token valid for one hour (`3600` seconds by default).

Send the credentials as HTTP Basic auth and ask for a `client_credentials` grant:

```bash
curl -s -X POST "https://auth.reltio.com/oauth/token" \
  -H "Authorization: Basic $(echo -n "${CLIENT_ID}:${CLIENT_SECRET}" | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" | jq .
```

The response returns the access token plus its remaining lifetime in seconds:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "bearer",
  "expires_in": 3599
}
```

Save the token to a shell variable so the rest of the tutorial can reuse it:

```bash
export TOKEN="eyJhbGciOiJSUzI1NiIs..."
```

**Key rules:**

- The grant type is always `client_credentials` — there is no refresh token in this flow, so request a new token when the current one expires.
- The token type is always `bearer`. Every tenant call sends it as `Authorization: Bearer ${TOKEN}`.
- Cache and reuse the token — requesting a new token on every API call wastes quota and can trigger rate limits.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `401 Unauthorized` | Wrong `CLIENT_ID` or `CLIENT_SECRET` | Re-check the Basic auth header and the credentials |
| `400 invalid_grant` | Wrong `grant_type` or malformed body | Send `grant_type=client_credentials` as `application/x-www-form-urlencoded` |
| `403 Forbidden` | Valid token, but the caller's IP is not on the tenant's allow list | Have a tenant admin add the IP to the whitelist |

> **Learn more:** [Authentication API](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/authentication-api) in the Reltio documentation.

## 4. Read your data model

**Endpoint:** `GET ${TENANT}/configuration/entityTypes`

Before writing any data, confirm which entity types and attributes the tenant actually supports. Every attribute you send later must use one of these exact type paths.

List the entity types:

```bash
curl -s -X GET "${TENANT}/configuration/entityTypes" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.[].uri'
```

If you ran the setup guide, you'll see exactly:

```json
"configuration/entityTypes/Individual"
"configuration/entityTypes/Organization"
```

For the full tenant configuration — attributes, relation types, sources, match rules — fetch the root `/configuration` resource:

```bash
curl -s -X GET "${TENANT}/configuration" \
  -H "Authorization: Bearer ${TOKEN}" | jq . > tenant_config.json
```

**Key rules:**

- Attribute payloads use full type paths. `FirstName` on an Individual is `configuration/entityTypes/Individual/attributes/FirstName`.
- If you later send a path that doesn't exist in the configuration, the API rejects the entity.
- Reltio's [L3 layer](#glossary) is what you, the customer, own. L1 and L2 are inherited. When inspecting or modifying configuration, know which layer you're looking at.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `401 Unauthorized` | `TOKEN` missing, expired, or malformed | Re-run [Step 3](#3-authenticate) |
| `404 Not Found` | `TENANT` URL points at the wrong environment or tenant ID | Check `https://{env}.reltio.com/reltio/api/{tenantId}` |
| Empty list | Tenant has no L3 entity types yet | Run the [setup guide](./HOWTO-SETUP-for-top-10-reltio-apis.md) |

> **Learn more:** [Configuration API](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api) in the Reltio documentation.

## 5. Create entities

**Endpoint:** `POST ${TENANT}/entities`

Now load your first records. Create two `Individual` entities — John Smith and Jane Doe — both from the `CRM` source. You'll reuse them in the rest of the tutorial.

```bash
curl -s -X POST "${TENANT}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{"type": "configuration/entityTypes/Individual/attributes/FirstName", "value": "John"}],
        "LastName":  [{"type": "configuration/entityTypes/Individual/attributes/LastName",  "value": "Smith"}],
        "Email":     [{"type": "configuration/entityTypes/Individual/attributes/Email",     "value": "john.smith@example.com"}]
      },
      "crosswalks": [{"type": "configuration/sources/CRM", "value": "CRM-1001"}]
    },
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{"type": "configuration/entityTypes/Individual/attributes/FirstName", "value": "Jane"}],
        "LastName":  [{"type": "configuration/entityTypes/Individual/attributes/LastName",  "value": "Doe"}],
        "Email":     [{"type": "configuration/entityTypes/Individual/attributes/Email",     "value": "jane.doe@example.com"}]
      },
      "crosswalks": [{"type": "configuration/sources/CRM", "value": "CRM-1002"}]
    }
  ]' | jq .
```

The response is an array, one result object per input entity:

```json
[
  {
    "index": 0,
    "object": {
      "URI": "entities/ABC123",
      "type": "configuration/entityTypes/Individual"
    },
    "status": "success"
  },
  {
    "index": 1,
    "object": {
      "URI": "entities/DEF456",
      "type": "configuration/entityTypes/Individual"
    },
    "status": "success"
  }
]
```

Save the URIs for the rest of the tutorial:

```bash
export ENTITY_JOHN="entities/ABC123"
export ENTITY_JANE="entities/DEF456"
```

**Key rules:**

- The request body is **always an array**, even for a single entity.
- Every attribute is an **array of objects** — `"FirstName": [{"type": "...", "value": "John"}]`, never `"FirstName": "John"`.
- Every record must include at least one [crosswalk](#glossary). Without one, Reltio can't track lineage or match.
- Attribute `type` paths must match your tenant configuration exactly.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `400 Bad Request` | Unknown attribute path, bad JSON, or missing crosswalk | Check the type path against [Step 4](#4-read-your-data-model) output |
| `401 Unauthorized` | Token expired mid-session | Re-run [Step 3](#3-authenticate) and re-export `TOKEN` |
| Partial `status: "failed"` in the response array | One entity in the batch was rejected | Inspect the `errorMessage` on the failed `index` and retry that entity only |

> **Learn more:** [Create entities](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/create-entity) in the Reltio documentation.

## 6. Search for entities

**Endpoint:** `GET ${TENANT}/entities?filter=...` (or `POST ${TENANT}/entities/_search` for long filters)

With records in the tenant, you can query them. The [Entity Search API](#glossary) accepts a filter expression with functions like `equals`, `startsWith`, `fuzzy`, `exists`, and `missing`, combined with `AND` and `OR`.

Find every Individual:

```bash
curl -s -X GET \
  "${TENANT}/entities?filter=(equals(type,'configuration/entityTypes/Individual'))&max=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq '.[].uri'
```

Find every Individual whose last name is Smith:

```bash
curl -s -X GET \
  "${TENANT}/entities?filter=(equals(type,'configuration/entityTypes/Individual') AND equals(attributes.LastName,'Smith'))&max=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

When the filter is too long for a URL — or you need to escape quotes cleanly — use the POST form:

```bash
curl -s -X POST "${TENANT}/entities/_search" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "(equals(type,'\''configuration/entityTypes/Individual'\'') AND equals(attributes.LastName,'\''Smith'\''))",
    "max": 10,
    "offset": 0
  }' | jq .
```

**Key rules:**

- Paginate with `max` and `offset`. The total results you can page through is capped at **10,000**.
- Filter functions cover equality, prefix, fuzzy, range, and presence checks. `fuzzy` handles typos; `equals` is case-insensitive.
- Wrap string literals in single quotes inside the filter expression.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `400` "Unable to parse filter" | Unbalanced parens or missing quotes in the filter | Validate the filter expression; use the POST form to avoid URL-encoding issues |
| Empty result set right after create | Search index hasn't caught up | Wait a few seconds — creation is asynchronous |
| `414 URI Too Long` | Filter string exceeded server limit | Switch to `POST /entities/_search` |

> **Learn more:** [Filtering entities](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/get-entity/filtering-entities) in the Reltio documentation.

## 7. Look up an entity by crosswalk

**Endpoint:** `GET ${TENANT}/entities/_byCrosswalk/{value}?type={sourceType}`

This is the integration workhorse. When a source system says "update CRM-1001", your integration uses this call to resolve which Reltio entity corresponds to that source ID.

```bash
curl -s -X GET \
  "${TENANT}/entities/_byCrosswalk/CRM-1001?type=configuration/sources/CRM" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

When the crosswalk value contains characters that make an ugly URL (`/`, `.`, `#`), use the POST variant and send the value in the body:

```bash
curl -s -X POST \
  "${TENANT}/entities/_byCrosswalk?type=configuration/sources/ERP" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: text/plain" \
  -d "ERP/SPECIAL.VALUE-001" | jq .
```

**Key rules:**

- The `type` query parameter is the source URI, not the entity type. It must match a source defined in your configuration (`configuration/sources/CRM`, `configuration/sources/ERP`).
- The typical integration pattern is **find-or-create**: call `_byCrosswalk`; if it returns an entity, send an update; if it returns 404, create a new entity. [Step 8](#8-update-an-attribute) covers the update side of this pattern.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `404 Not Found` | No entity carries that crosswalk value in the given source | Expected outcome for new records; fall back to create |
| `400` with "unknown source" | `type` references a source that doesn't exist in L3 | Check the output of [Step 4](#4-read-your-data-model) |

> **Learn more:** [Get Entity by Crosswalk](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/get-entity/get-entity-by-crosswalk) in the Reltio documentation.

## 8. Update an attribute

**Endpoint:** `POST ${TENANT}/entities?options=partialOverride`

Reltio's **[upsert](#glossary)** pattern uses the same `POST /entities` endpoint you saw in [Step 5](#5-create-entities). When the crosswalk already exists, Reltio finds the matching entity and updates it instead of creating a new one. Add the `partialOverride` option so Reltio only touches the attributes you send.

```bash
curl -s -X POST "${TENANT}/entities?options=partialOverride" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/entityTypes/Individual",
      "crosswalks": [{"type": "configuration/sources/CRM", "value": "CRM-1001"}],
      "attributes": {
        "Email": [
          {
            "type": "configuration/entityTypes/Individual/attributes/Email",
            "value": "john.smith.updated@example.com"
          }
        ]
      }
    }
  ]' | jq .
```

Update modes differ in what happens to attributes **not** in the payload:

| Mode | Behavior | When to use |
|------|----------|-------------|
| Without `partialOverride` | Replaces all attributes for that crosswalk — missing attributes are **removed** | Full refresh from source of record |
| With `partialOverride` | Only the attributes in the payload are written; everything else is preserved | Incremental updates (most integrations) |

**Key rules:**

- Always use `partialOverride` unless you intentionally want a full replace.
- The match that drives [upsert](#glossary) happens on the crosswalk, not on attribute values or the entity URI.
- If no crosswalk matches, Reltio creates a new entity — make sure the crosswalk value is correct before running an "update".

**What can go wrong:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Attributes you didn't touch have disappeared | You forgot `partialOverride` | Re-send the attributes; the current values are preserved in history |
| Reltio created a duplicate instead of updating | Crosswalk value or source `type` doesn't match any existing entity | Use [Step 7](#7-look-up-an-entity-by-crosswalk) to confirm the crosswalk first |

> **Learn more:** [Update Entity](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/update-entity) in the Reltio documentation.

## 9. Create a relationship

**Endpoint:** `POST ${TENANT}/relations`

Entities rarely stand alone. Use the [Relations API](#glossary) to connect the John entity from [Step 5](#5-create-entities) to an Organization through the `Employment` relation type. First, create the Organization:

```bash
curl -s -X POST "${TENANT}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/entityTypes/Organization",
      "attributes": {
        "Name": [{"type": "configuration/entityTypes/Organization/attributes/Name", "value": "Acme Corp"}]
      },
      "crosswalks": [{"type": "configuration/sources/CRM", "value": "ORG-2001"}]
    }
  ]' | jq .
```

```bash
export ENTITY_ACME="entities/GHI789"   # use the URI from the response
```

Now create the relation — John is the `startObject`, Acme is the `endObject`, and the relation itself carries a `Title` attribute and a crosswalk:

```bash
curl -s -X POST "${TENANT}/relations" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/relationTypes/Employment",
      "startObject": {"objectURI": "'"${ENTITY_JOHN}"'"},
      "endObject":   {"objectURI": "'"${ENTITY_ACME}"'"},
      "attributes": {
        "Title": [
          {
            "type": "configuration/relationTypes/Employment/attributes/Title",
            "value": "Software Engineer"
          }
        ]
      },
      "crosswalks": [{"type": "configuration/sources/CRM", "value": "REL-3001"}]
    }
  ]' | jq .
```

To list all relations on an entity:

```bash
curl -s -X GET "${TENANT}/${ENTITY_JOHN}/relations" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

**Key rules:**

- `startObject` and `endObject` can reference entities by `objectURI` **or** by `crosswalks` — handy when you don't have the Reltio URI yet.
- The relation `type` must be defined in the tenant's L3. The setup guide creates `Employment`.
- Like entities, relations are created in arrays and can carry their own attributes and crosswalks.
- Employment is directional: the start is the employee, the end is the employer.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `400` "unknown relation type" | `type` path doesn't match L3 | Confirm the relation type exists (`${TENANT}/configuration/relationTypes`) |
| `404` on one side | `objectURI` points at a URI that no longer exists (e.g., merged away) | Resolve the survivor URI via [Step 7](#7-look-up-an-entity-by-crosswalk) |

> **Learn more:** [Create Relations](https://docs.reltio.com/en/developer-resources/relation-management-apis/relation-management-apis-at-a-glance/relations-api/create-relations) in the Reltio documentation.

## 10. Find potential matches

**Endpoint:** `GET ${TENANT}/{entityURI}/_matches`

Every time an entity is created or updated, Reltio evaluates the tenant's [match rules](#glossary) against it. The [Potential Matches API](#glossary) returns what those rules found, grouped by rule URI.

To see matches in action, first create a near-duplicate of John from the `ERP` source:

```bash
curl -s -X POST "${TENANT}/entities" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[
    {
      "type": "configuration/entityTypes/Individual",
      "attributes": {
        "FirstName": [{"type": "configuration/entityTypes/Individual/attributes/FirstName", "value": "Jon"}],
        "LastName":  [{"type": "configuration/entityTypes/Individual/attributes/LastName",  "value": "Smith"}],
        "Email":     [{"type": "configuration/entityTypes/Individual/attributes/Email",     "value": "john.smith@example.com"}]
      },
      "crosswalks": [{"type": "configuration/sources/ERP", "value": "ERP-5001"}]
    }
  ]' | jq .
```

```bash
export ENTITY_JON="entities/MNO777"   # use the URI from the response
```

Now ask for John's potential matches:

```bash
curl -s -X GET "${TENANT}/${ENTITY_JOHN}/_matches" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

The response is grouped by match-group URI. The setup guide's `SuspectLastNameEmail` rule fires because both records share `LastName=Smith` and `Email=john.smith@example.com`:

```json
{
  "configuration/entityTypes/Individual/matchGroups/SuspectLastNameEmail": [
    {
      "object": {
        "uri": "entities/MNO777",
        "type": "configuration/entityTypes/Individual"
      },
      "createdTime": 1709908613750
    }
  ]
}
```

Useful query parameters:

| Parameter | Purpose |
|-----------|---------|
| `type=automatic` | Only rules configured as auto-merge |
| `type=suspect` | Only rules requiring human review |
| `type=relevance_based` | Rules scored by relevance instead of a fixed threshold |
| `transitive=true` | Include transitive matches (A matches B, B matches C, so A matches C) |
| `max=N` | Limit the number of matches returned |
| `activeness=active` | Exclude merged-away entities |

**Key rules:**

- Match evaluation is **asynchronous**. If `_matches` returns empty right after create, wait 10-15 seconds and retry.
- `automatic` matches are merged for you by the system. `suspect` matches sit in the queue until a human merges or dismisses them — this is what the tutorial exercises in [Step 11](#11-merge-two-entities).

**What can go wrong:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty match list | Rules still evaluating, or the duplicate doesn't meet any rule's predicate | Wait, then re-inspect the rule definition in the tenant config |
| `404` on the URI | Entity was merged and its URI now redirects | Resolve the survivor via `_byCrosswalk` ([Step 7](#7-look-up-an-entity-by-crosswalk)) |

> **Learn more:** [Potential Matches API](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/potential-matches-api) in the Reltio documentation.

## 11. Merge two entities

**Endpoint:** `POST ${TENANT}/{survivorURI}/_sameAs?uri={loserURI}`

When you confirm two entities are the same, merge them. The entity in the URL path becomes the **survivor** and keeps its URI; the entity in the `uri` query parameter is the **loser** and from now on redirects to the survivor. Attributes, crosswalks, roles, and tags from both are combined, and [survivorship](#glossary) picks the winning [OV](#glossary) values.

```bash
curl -s -X POST \
  "${TENANT}/${ENTITY_JOHN}/_sameAs?uri=${ENTITY_JON}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

The response shows the merged entity — same URI as John, now holding attributes and crosswalks from both:

```json
{
  "object": {
    "URI": "entities/ABC123",
    "type": "configuration/entityTypes/Individual",
    "attributes": {
      "FirstName": [
        {"value": "John", "ov": true,  "sources": ["CRM"]},
        {"value": "Jon",  "ov": false, "sources": ["ERP"]}
      ],
      "LastName": [
        {"value": "Smith", "ov": true}
      ],
      "Email": [
        {"value": "john.smith@example.com", "ov": true}
      ]
    },
    "crosswalks": [
      {"type": "configuration/sources/CRM", "value": "CRM-1001"},
      {"type": "configuration/sources/ERP", "value": "ERP-5001"}
    ]
  }
}
```

To override the default survivor, add `explicitWinner`:

```bash
curl -s -X POST \
  "${TENANT}/${ENTITY_JOHN}/_sameAs?uri=${ENTITY_JON}&explicitWinner=${ENTITY_JON}" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

**Key rules:**

- The URL-path entity is the default survivor. `explicitWinner` is only needed when you want the other one to win.
- After a merge, the loser's URI becomes a redirect — any call against it resolves to the survivor.
- Merges are recorded in the audit trail and can be reversed with the Unmerge API (out of scope for this tutorial).

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `400` "entities must be of the same type" | Cross-type merge attempted | Merge only entities of the same type |
| `409 Conflict` | One of the entities is already merged or in the middle of a merge | Re-resolve both URIs via [Step 7](#7-look-up-an-entity-by-crosswalk) and retry |

> **Learn more:** [Merge and Unmerge API](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/merge-and-unmerge-entities-api) in the Reltio documentation.

## 12. View entity history

**Endpoint:** `GET ${TENANT}/{entityURI}/_changes`

Every create, update, merge, and split is recorded. The [Entity History API](#glossary) returns that log — useful for audit, debugging, and reconciliation.

```bash
curl -s -X GET \
  "${TENANT}/${ENTITY_JOHN}/_changes?max=10&order=desc" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

A typical response after running this tutorial looks like:

```json
[
  {"timestamp": 1716549555066, "user": "api_user", "type": "ENTITIES_MERGED"},
  {"timestamp": 1716549000000, "user": "api_user", "type": "ENTITY_CHANGED"},
  {"timestamp": 1716548000000, "user": "api_user", "type": "ENTITY_CREATED"}
]
```

Common event types:

| Event | Meaning |
|-------|---------|
| `ENTITY_CREATED` | First insert |
| `ENTITY_CHANGED` | Attribute, tag, or role update |
| `ENTITIES_MERGED` | Merged via a [match rule](#glossary) |
| `ENTITIES_MERGED_MANUALLY` | Merged via API or UI (as you did in [Step 11](#11-merge-two-entities)) |
| `ENTITIES_MERGED_ON_THE_FLY` | Auto-merged because crosswalks collided on create |
| `ENTITIES_SPLITTED` | A previous merge was reversed |
| `POTENTIAL_MATCHES_FOUND` | A match rule flagged a new duplicate |

Filter by event type or attribute:

```bash
# Only merge events
curl -s -X GET \
  "${TENANT}/${ENTITY_JOHN}/_changes?filter=equals(type,'ENTITIES_MERGED')&max=10" \
  -H "Authorization: Bearer ${TOKEN}" | jq .

# Only FirstName changes
curl -s -X GET \
  "${TENANT}/${ENTITY_JOHN}/_changes?filter=changes(configuration/entityTypes/Individual/attributes/FirstName)" \
  -H "Authorization: Bearer ${TOKEN}" | jq .
```

**Key rules:**

- Entity history returns up to **1,000** most recent events per entity. Pagination beyond that cap is not supported — archive or export older history if you need it.
- The `order` parameter accepts `asc` and `desc`. Default is `desc` (most recent first).
- Use `/{entityURI}/_changesWithTotal` to get a total count alongside the page.

**What can go wrong:**

| Status | Cause | Fix |
|--------|-------|-----|
| `404 Not Found` | Entity URI doesn't exist or was merged away | Resolve the survivor URI via `_byCrosswalk` |
| Events missing near the tail | You exceeded the 1,000-event cap | Narrow the filter or rely on an external audit sink |

> **Learn more:** [Entity History](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/get-entity/entity-history) in the Reltio documentation.

## 13. Troubleshooting

Quick pointers for the most common issues across all ten steps.

| Symptom | Likely cause | First thing to try |
|---------|--------------|--------------------|
| `401 Unauthorized` on a tenant call | Token expired (`expires_in` elapsed) or never set | Re-run [Step 3](#3-authenticate) and re-`export TOKEN` |
| `403 Forbidden` with a valid token | IP not on the tenant's allow list, or scope missing | Ask a tenant admin to whitelist your IP or add the scope |
| `400 Bad Request` on create/update | Unknown attribute path, missing crosswalk, or body not wrapped in `[]` | Validate the path against `${TENANT}/configuration` and re-check the array shape |
| Create returns success but Search doesn't find the entity | Indexing lag (asynchronous) | Wait 5-15 seconds and retry |
| `_matches` returns empty | Match evaluation still running | Wait 10-15 seconds; confirm the rule predicate actually fires against your data |
| Merge fails with `409 Conflict` | One side is in flight or already merged | Resolve current URIs via [Step 7](#7-look-up-an-entity-by-crosswalk) and retry |
| URLs break on `/`, `.`, or `#` | Crosswalk value contains URL-hostile characters | Use the `POST /_byCrosswalk` variant shown in [Step 7](#7-look-up-an-entity-by-crosswalk) |
| `414 URI Too Long` on search | Filter too long for a GET | Switch to `POST ${TENANT}/entities/_search` |
| History stops at ~1,000 events | Entity History cap | Archive externally; pagination doesn't extend past the cap |

Rate-limit defaults worth knowing:

- **Token requests:** 10/second — cache the token, don't request per call.
- **Entities per POST batch:** 1,000 — split larger loads.
- **Max search results:** 10,000 total rows, across all `offset` pages.

## 14. Further reading

- [Reltio developer resources home](https://docs.reltio.com/en/developer-resources)
- [Authentication API](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/authentication-api)
- [Configuration API](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api)
- [Entities API](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api)
- [Crosswalks API](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/crosswalks-api)
- [Relations API](https://docs.reltio.com/en/developer-resources/relation-management-apis/relation-management-apis-at-a-glance/relations-api)
- [Potential Matches API](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/potential-matches-api)
- [Merge and Unmerge API](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/merge-and-unmerge-entities-api)
- [Entity History](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/get-entity/entity-history)
- [Filtering entities](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/get-entity/filtering-entities)
- [API request limits](https://docs.reltio.com/en/reltio/whats-in-the-box/whats-in-the-box-at-a-glance/implementation-assistance-at-a-glance/implementation-assistance-operation/identify-performance-factors/quota-and-limits/api-request-limits)

## 15. Glossary

**Application client:** a machine-to-machine identity in Reltio Auth, identified by a Client ID and secured by a Client Secret. Used by integrations; no human user is attached.

**Crosswalk:** a pointer from a Reltio entity to a record in a source system. Carries a `type` (the source URI) and a `value` (the source's ID for the record).

**Entity:** one record of a real-world thing (person, organization, product). Identified by a URI like `entities/ABC123`.

**Entity History API:** `/{entityURI}/_changes`. Returns the audit log of an entity, up to 1,000 most recent events.

**Entity Search API:** `/entities` (GET) and `/entities/_search` (POST). Accepts filter expressions to query entities.

**L3 layer:** the customer-owned configuration layer. The model a tenant runs on is the inheritance of L1, L2, and L3.

**Match rule:** a configured predicate that flags likely duplicates. Rules are classified as `automatic`, `suspect`, or `relevance_based`.

**OAuth 2.0 client credentials:** the OAuth grant Reltio uses for machine-to-machine authentication. Trades Client ID + Client Secret for a short-lived bearer token.

**Operational value (OV):** the survivorship-selected winning value for an attribute. In API responses, the winner has `"ov": true`.

**Potential Matches API:** `/{entityURI}/_matches`. Returns rule-evaluated duplicate candidates grouped by match-group URI.

**Relations API:** `/relations`. Creates, reads, updates, and deletes directional links between entities.

**Survivorship:** the logic that chooses which candidate value becomes OV when multiple sources disagree.

**Upsert:** the Reltio pattern where `POST /entities` with an existing crosswalk updates instead of creating. Combine with `?options=partialOverride` for incremental updates.

---

> **Disclaimer:** AI-generated from the Reltio documentation snapshot 2026-04-22 02:14 UTC (3,233 topics). AI output can contain subtle inaccuracies, and the knowledge base syncs twice a week — so the content here may lag [docs.reltio.com](https://docs.reltio.com). Verify anything critical against the official docs and your own tenant. Full disclaimer: [DISCLAIMER.md](../DISCLAIMER.md).
