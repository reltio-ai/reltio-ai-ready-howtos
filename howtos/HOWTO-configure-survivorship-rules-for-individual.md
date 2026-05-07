# HOWTO: Configure survivorship rules for the Individual entity type

Survivorship rules determine which attribute value becomes the [operational value](#glossary) — the single "best" value Reltio returns to applications and shows in the Hub — when multiple source systems contribute different values for the same Individual record.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#000066', 'primaryTextColor': '#ffffff', 'primaryBorderColor': '#0000CC', 'lineColor': '#000033', 'textColor': '#000033', 'secondaryColor': '#f5f5f5', 'tertiaryColor': '#f0f4ff', 'edgeLabelBackground': '#f0f4ff', 'clusterBkg': '#f0f4ff', 'clusterBorder': '#0000CC'}, 'themeCSS': '.edgeLabel { color: #000033 !important; background-color: #f0f4ff !important; font-weight: 500 !important; } .edgeLabel rect, .edgeLabel foreignObject { fill: #f0f4ff !important; }', 'flowchart': {'nodeSpacing': 40, 'rankSpacing': 55, 'curve': 'basis', 'padding': 12}}}%%
flowchart LR
    A[Get L3 config] --> B[Edit survivorship group]
    B --> C[Validate config]
    C -- Valid --> D[PUT L3 config]
    C -- Invalid --> B
    D --> E[Verify OV values]
```

## Overview

This guide walks you through configuring [survivorship group](#glossary) and [survivorship strategy](#glossary) for the `Individual` [entity type](#glossary) using the Configuration API. You'll read your current [L3 configuration](#glossary), add or update a survivorship group with per-attribute rules, set a default strategy, and verify the result by fetching an Individual entity with survivorship applied.

This guide is for these Reltio roles: **Reltio Configurator**, **Developer**. For more information on data unification roles in the **Reltio Context Intelligence Platform**, see [About roles](https://docs.reltio.com/en/roles/about-roles).

## Contents

1. [Getting started](#1-getting-started)
2. [Key concepts](#2-key-concepts)
3. [Get your current L3 configuration](#3-get-your-current-l3-configuration)
4. [Configure a survivorship group for Individual](#4-configure-a-survivorship-group-for-individual)
5. [Set the default survivorship strategy](#5-set-the-default-survivorship-strategy)
6. [Add a fallback strategy](#6-add-a-fallback-strategy)
7. [Verify survivorship with Get Entity](#7-verify-survivorship-with-get-entity)
8. [Troubleshooting](#8-troubleshooting)
9. [Further reading](#9-further-reading)
10. [Glossary](#10-glossary)

## 1. Getting started

Before you begin, confirm the following:

- **Access token** — you have a valid bearer token. See [HOWTO: Authenticate and use Reltio APIs](HOWTO-authenticate-and-use-reltio-apis.md) if you need one.
- **System Administrator or Reltio Configurator access** — your application client must have permission to read and write tenant configuration.
- **Your tenant URL** — in the format `https://{env}.reltio.com/reltio/api/{tenantId}`. Replace `{TenantURL}` with this value throughout this guide.
- **A JSON editor** — you'll be editing L3 configuration JSON. VS Code with the JSON extension or any comparable editor works well.
- **Existing Individual entity type** — the `Individual` entity type must already exist in your L3.

> **Important:** Always retrieve the L3 configuration using `_noinheritance` before editing, and always validate before applying. Never PUT a consolidated (inherited) configuration back to your tenant.

> **Learn more:** [Configuration API](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 2. Key concepts

Understand these concepts before editing your configuration.

**Operational value (OV):** When multiple source systems contribute values to the same attribute on an entity, Reltio calculates a single "best" value — the operational value — in real time. The OV is what the Hub displays and what API responses return by default.

**Survivorship strategy:** The algorithm Reltio applies to pick the OV. Strategies range from `LUD` (most recently updated value wins) to `SRC_SYS` (a ranked list of source systems determines priority). `LUD` is the default when no strategy is explicitly configured.

**Survivorship group:** A named set of per-attribute survivorship mappings defined for an entity type. Every entity type must have exactly one group marked `"default": true`. Non-default groups apply to users with specific roles.

**Survivorship mapping:** A single rule entry inside a survivorship group that pairs one attribute with one strategy. For example: apply `SRC_SYS` with source priority `[CRM, ERP]` to the `FirstName` attribute.

**L3 configuration:** The customer-owned configuration layer. Survivorship rules are defined here — in the `survivorshipGroups` section of the `entityTypes` object for `Individual`.

> **Learn more:** [Design survivorship rules](https://docs.reltio.com/en/objectives/resolve-potential-matches/potential-matching-at-a-glance/potential-matching-navigation/design-survivorship-rules?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 3. Get your current L3 configuration

Before editing, retrieve the L3 layer using `_noinheritance` to avoid reading inherited L1/L2 rules.

`GET {TenantURL}/configuration?_noinheritance`

**Request**

```bash
curl -X GET "{TenantURL}/configuration?_noinheritance" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (excerpt)**

```json
{
  "URI": "configuration",
  "entityTypes": [
    {
      "URI": "configuration/entityTypes/Individual",
      "survivorshipGroups": [
        {
          "URI": "configuration/entityTypes/Individual/survivorshipGroups/default",
          "default": true,
          "mapping": []
        }
      ]
    }
  ]
}
```

Save this response — you'll modify the `survivorshipGroups` section and PUT it back.

> **Note:** If `survivorshipGroups` is absent or `mapping` is empty, all Individual attributes are using the default `LUD` strategy inherited from the platform.

> **Learn more:** [GET Configuration](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/get-configuration?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 4. Configure a survivorship group for Individual

You can configure survivorship rules either by updating the full L3 via `PUT /configuration` or by using the dedicated `survivorshipGroups` sub-resource endpoint.

### Option A — survivorshipGroups sub-resource (recommended for targeted updates)

`POST {TenantURL}/configuration/entityTypes/Individual/survivorshipGroups/{groupUri}`

Use this endpoint to create or replace a single survivorship group without touching the rest of the L3.

**Request — create a default survivorship group**

```bash
curl -X POST "{TenantURL}/configuration/entityTypes/Individual/survivorshipGroups/default" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "URI": "configuration/entityTypes/Individual/survivorshipGroups/default",
    "default": true,
    "mapping": [
      {
        "attribute": "configuration/entityTypes/Individual/attributes/FirstName",
        "survivorshipStrategy": "SRC_SYS",
        "sourcesUriOrder": [
          "configuration/sources/CRM",
          "configuration/sources/ERP"
        ]
      },
      {
        "attribute": "configuration/entityTypes/Individual/attributes/LastName",
        "survivorshipStrategy": "OtherAttributeWinnerCrosswalk",
        "primaryAttributeUri": "configuration/entityTypes/Individual/attributes/FirstName"
      },
      {
        "attribute": "configuration/entityTypes/Individual/attributes/MiddleName",
        "survivorshipStrategy": "SRC_SYS"
      },
      {
        "attribute": "configuration/entityTypes/Individual/attributes/Email",
        "survivorshipStrategy": "LUD"
      }
    ]
  }'
```

This configuration does the following:

- **FirstName** — the value from the highest-priority source wins. CRM takes priority over ERP.
- **LastName** — follows FirstName's winner [crosswalk](#glossary). If the winning crosswalk for FirstName came from CRM, the LastName value from that same CRM crosswalk becomes the OV.
- **MiddleName** — source system priority applies; the `sourcesUriOrder` at the group level is used when not specified per mapping.
- **Email** — the most recently updated value wins.

### Option B — full L3 PUT

To configure survivorship as part of a broader L3 update:

1. Add the `survivorshipGroups` section to the `Individual` entity type in your saved L3 JSON.
2. Validate the configuration (see step below).
3. PUT the full L3.

**Validate before applying**

```bash
curl -X GET "{TenantURL}/_validateTenantConfiguration" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Fix any errors returned before proceeding. Common error codes are `1812` and `1813`.

**Apply the updated L3**

```bash
curl -X PUT "{TenantURL}/configuration" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @your-updated-l3.json
```

### Retrieve the survivorship group to confirm

```bash
curl -X GET "{TenantURL}/configuration/entityTypes/Individual/survivorshipGroups/default" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Key rules

- Every entity type must have exactly one group marked `"default": true`.
- Attributes not listed in a mapping use the default survivorship strategy (`LUD` unless you've overridden it — see section 5).
- You can't configure survivorship on sub-attributes of referenced attributes. Survivorship for those is governed by the referenced entity type's own rules.
- Survivorship rules are applied in real time — changes take effect immediately on the next attribute value request.

> **Important:** After changing the survivorship strategy, reindex your tenant to get correct search results for OV values. See [Reindex Data Task](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/tasks-api/reindex-data-task?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs).

> **Learn more:** [Configuring survivorship rules in the L3](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/configuring-survivorship-rules-in-the-l3?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 5. Set the default survivorship strategy

By default, `LUD` (Last Update Date) applies to any attribute that doesn't have an explicit [survivorship mapping](#glossary). You can change the default at either the tenant level or the entity type level.

### Set the default at the entity type level (recommended)

Add `defaultSurvivorshipStrategy` to the `Individual` entity type in your L3:

```json
{
  "URI": "configuration/entityTypes/Individual",
  "defaultSurvivorshipStrategy": "Frequency",
  "survivorshipGroups": [...]
}
```

This overrides the tenant-level default for all Individual attributes that don't have an explicit mapping.

### Set the default at the tenant level

In the root of your L3, define `survivorshipStrategies` with exactly one entry marked `"default": true`:

```json
{
  "survivorshipStrategies": [
    {
      "uri": "configuration/survivorshipStrategies/LUD",
      "label": "Recency"
    },
    {
      "uri": "configuration/survivorshipStrategies/Aggregation",
      "label": "All values win",
      "default": true
    }
  ]
}
```

### Valid default strategies

Only these strategies are valid as the default value: `LUD`, `OldestValue`, `WinnerEntityCrosswalk`, `Aggregation`, `Frequency`. Strategies like `MinValue` and `SRC_SYS` can't be set as defaults — a configuration error occurs if you try.

> **Note:** If no default is explicitly configured, `LUD` is used automatically for backward compatibility.

> **Learn more:** [Configure default survivorship strategy](https://docs.reltio.com/en/objectives/resolve-potential-matches/potential-matching-at-a-glance/potential-matching-navigation/design-survivorship-rules/configure-default-survivorship-strategy?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 6. Add a fallback strategy

A [fallback strategy](#glossary) kicks in when the primary survivorship strategy can't pick a single winner — for example, when two records from the same source contribute different values, and `SRC_SYS` can't break the tie.

Add `fallbackStrategies` to any mapping entry:

```json
{
  "attribute": "configuration/entityTypes/Individual/attributes/LastName",
  "survivorshipStrategy": "OtherAttributeWinnerCrosswalk",
  "primaryAttributeUri": "configuration/entityTypes/Individual/attributes/FirstName",
  "fallbackStrategies": [
    {
      "attribute": "configuration/entityTypes/Individual/attributes/LastName",
      "survivorshipStrategy": "SRC_SYS",
      "sourcesUriOrder": [
        "configuration/sources/CRM",
        "configuration/sources/ERP"
      ]
    }
  ],
  "fallbackUsingCriteria": "ZERO_OR_MORE_THAN_ONE"
}
```

The `fallbackUsingCriteria` controls when fallback triggers:

| Value | When fallback applies |
|---|---|
| `MORE_THAN_ONE` (default) | Primary strategy found more than one winner |
| `ZERO` | Primary strategy found zero winners |
| `ZERO_OR_MORE_THAN_ONE` | Either zero or more than one winner |

> **Important:** Fallback strategies are not inherited from other attributes. Each attribute must have its own `fallbackStrategies` defined separately.

> **Learn more:** [Configuring fallback strategies for survivorship rules](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/configuring-fallback-strategies-for-survivorship-rules?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 7. Verify survivorship with Get Entity

After applying your configuration, verify that OV values are calculated correctly by fetching an Individual entity.

`GET {TenantURL}/entities/{entityUri}?ov=true`

**Request**

```bash
curl -X GET "{TenantURL}/entities/{entityUri}?ov=true" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response (excerpt)**

```json
{
  "uri": "entities/ABC123",
  "attributes": {
    "FirstName": [
      { "value": "Jane", "ov": true, "crosswalk": { "type": "configuration/sources/CRM" } },
      { "value": "Janet", "ov": false, "crosswalk": { "type": "configuration/sources/ERP" } }
    ],
    "LastName": [
      { "value": "Smith", "ov": true, "crosswalk": { "type": "configuration/sources/CRM" } }
    ]
  }
}
```

Confirm the correct source's value has `"ov": true`. If the OV doesn't match your expected strategy, check:

1. That the survivorship group was saved correctly — re-fetch via `GET /survivorshipGroups/default`.
2. That source URIs in `sourcesUriOrder` match the actual source names in your tenant configuration.
3. Whether any values are [pinned](#glossary) — pinned values override all survivorship rules.

> **Learn more:** [Get Entity with Survivorship Rules](https://docs.reltio.com/en/developer-resources/entity-management-apis/entity-management-apis-at-a-glance/entities-api/get-entity/get-entity-with-survivorship-rules?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)

## 8. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| All attributes have `"ov": false` | No matching source in `sourcesUriOrder` and no fallback configured | Verify source URIs match `configuration/sources/{name}` in your L3 |
| OV doesn't change after updating configuration | Survivorship is calculated just-in-time but search index lags | Run a Reindex Data Task to update search results |
| Configuration validation error 1812 or 1813 | Invalid survivorship mapping (unknown strategy or missing required field) | Check the `survivorshipStrategy` value and required parameters in the mapping |
| Non-default survivorship group not applying | Group not associated with the correct user role via a Ruleset | Verify the Ruleset configuration links the group to the intended role |
| `"ov": true` on an unexpected value | A value is pinned — pinned values always win | Check whether any attribute value has been pinned via the Reltio Hub or Attribute API |
| `fallbackStrategies` not working | `fallbackUsingCriteria` default is `MORE_THAN_ONE` — fallback won't trigger on zero winners | Set `fallbackUsingCriteria` to `ZERO_OR_MORE_THAN_ONE` if you need both cases covered |

## 9. Further reading

- [Survivorship Rules](https://docs.reltio.com/en/objectives/resolve-potential-matches/potential-matching-at-a-glance/potential-matching-navigation/design-survivorship-rules/survivorship-rules?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs) — full strategy reference including all parameters
- [Configure default survivorship strategy](https://docs.reltio.com/en/objectives/resolve-potential-matches/potential-matching-at-a-glance/potential-matching-navigation/design-survivorship-rules/configure-default-survivorship-strategy?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)
- [Configuring survivorship rules in the L3](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/configuring-survivorship-rules-in-the-l3?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)
- [Survivorship groups for entity types API](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/manage-configuration-sub-resources/survivorship-groups-for-entity-types?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)
- [Configuring fallback strategies for survivorship rules](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/configuration-api/configuring-fallback-strategies-for-survivorship-rules?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs)
- [Reindex Data Task](https://docs.reltio.com/en/developer-resources/system-administration-apis/system-administration-apis-at-a-glance/tasks-api/reindex-data-task?utm_source=ai-corpus&utm_medium=markdown&utm_campaign=reltio-ai-ready-docs) — required after strategy changes for correct search results
- [HOWTO: Authenticate and use Reltio APIs](HOWTO-authenticate-and-use-reltio-apis.md) — get the access token you need for all calls in this guide

## 10. Glossary

**Crosswalk:** A pointer that links a Reltio entity back to its original record in a source system, storing the source system URI and the record's unique ID in that system.

**Entity type:** A named category of master data objects in Reltio — such as `Individual`, `Organization`, or `Product`. Each entity type has its own attributes, match rules, and survivorship configuration.

**Fallback strategy:** A secondary survivorship rule that applies when the primary strategy produces zero winners or more than one winner. Configured per attribute using the `fallbackStrategies` parameter.

**L3 configuration:** The customer-owned configuration layer of a Reltio tenant. Defines entity types, attributes, sources, match rules, and survivorship groups. L1 and L2 are Reltio-managed; only L3 is editable by customers.

**Operational value (OV):** The "winning" attribute value that Reltio selects from all contributed source values using the configured survivorship strategy. The OV is what the Hub displays and what API responses return by default.

**Pinned value:** An attribute value that has been explicitly flagged to always be the OV, bypassing all survivorship rules. Pinned values always win regardless of strategy.

**Survivorship group:** A named configuration object on an entity type that groups survivorship mappings together. Every entity type has a default group; non-default groups can be role-specific.

**Survivorship mapping:** A single rule entry within a survivorship group that associates one attribute with one survivorship strategy and its parameters.

**Survivorship strategy:** The algorithm Reltio uses to determine the operational value for an attribute. Common strategies include `LUD` (last update date), `SRC_SYS` (source system priority), `Frequency` (most common value), `Aggregation` (all values win), `MinValue`, `MaxValue`, and `OtherAttributeWinnerCrosswalk`.

---

> **Disclaimer:** AI-generated from the Reltio documentation snapshot 2026-05-06 02:14 UTC (3,240 topics). AI output can contain subtle inaccuracies, and the knowledge base syncs twice a week — so the content here may lag [docs.reltio.com](https://docs.reltio.com). Verify anything critical against the official docs and your own tenant. Full disclaimer: [DISCLAIMER.md](../DISCLAIMER.md).
