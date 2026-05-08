# Reltio HOWTO Style Guide

Every Reltio HOWTO follows the **Microsoft Writing Style Guide** as its foundation, with Reltio-specific conventions layered on top. This document covers voice, writing conventions, code, tables, callouts, and Reltio-specific rules. For document layout, section ordering, workflow diagrams, glossary, and file naming, see `STRUCTURE-GUIDE.md`.

_Sources: [Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/), existing Reltio HOWTOs (`howtos/HOWTO-authenticate-and-use-reltio-apis.md`, `howtos/HOWTO-top-10-reltio-apis.md`, `howtos/HOWTO-SETUP-for-top-10-reltio-apis.md`)._

---

## Part A: Voice and Writing Principles

These rules apply to **every sentence** in every HOWTO. They come from the Microsoft Writing Style Guide's three voice principles: warm and relaxed, crisp and clear, ready to lend a hand.

### A1. Write like you speak

Read your text aloud. If it sounds stiff, rewrite it.

| Instead of | Write |
|-----------|-------|
| "The authentication process involves exchanging credentials for a token" | "You exchange your Client ID and Client Secret for an access token" |
| "It is necessary to include crosswalks" | "Always include crosswalks" |
| "The entity can be retrieved by specifying its URI" | "Get an entity by its URI" |

### A2. Get to the point fast

Lead with what's most important. Front-load keywords for scanning. Don't make the reader wade through context before reaching the action.

| Instead of | Write |
|-----------|-------|
| "Templates provide a starting point for creating new documents. A template can include the styles, formats, and page layouts you use frequently." | "Save time by creating a template with the styles and layouts you use most." |
| "In order to authenticate with the Reltio platform, you will first need to obtain an access token by sending your credentials to the authentication endpoint." | "Everything starts here. You exchange your Client ID and Client Secret for an access token that's valid for 60 minutes." |

### A3. Use bigger ideas, fewer words

Shorter is always better. Prune every excess word. Give readers just enough information to make decisions confidently.

| Wordy | Concise |
|-------|---------|
| "In order to" | "To" |
| "It is important to note that" | (Delete — just state the thing) |
| "At this point in time" | "Now" |
| "Due to the fact that" | "Because" |
| "Has the ability to" | "Can" |
| "Make sure that you" | (Delete — start with the verb) |

### A4. Use contractions

Contractions make text warmer and more conversational. Use them freely.

Use: *it's, you'll, you're, we're, let's, don't, can't, won't, isn't, doesn't, hasn't, aren't, that's, there's, here's, what's*

Don't force a contraction where it sounds awkward. Read it aloud — if the contraction sounds natural, use it.

### A5. Use sentence-style capitalization

Capitalize only the first word of a heading and proper nouns. Never use title case.

| Instead of | Write |
|-----------|-------|
| "What Can Go Wrong" | "What can go wrong" |
| "Save Your Token For Later" | "Save your token for the rest of this tutorial" |
| "Common API Operations" | "Common API operations" |

**Exception:** The existing HOWTOs use title-style capitalization for headings. New guides should transition to sentence-style per Microsoft guidelines. Either style is acceptable during the transition, but be consistent within a single document.

### A6. Use active voice and present tense

Start sentences with verbs when possible. Edit out "you can" and "there is/there are."

| Instead of | Write |
|-----------|-------|
| "You can access your tenant's configuration by calling..." | "Access your tenant's configuration by calling..." |
| "There are several filter functions available" | "Search supports these filter functions:" |
| "The token was returned by the server" | "The server returns a token" |
| "The entity will be created" | "Reltio creates the entity" |

### A7. Use second person

Always address the reader as "you." Never use "the user," "the developer," or "one."

### A8. Be brief with paragraphs

Three to seven lines per paragraph. One-sentence paragraphs are fine. If a paragraph goes past seven lines, break it up or convert it to a list.

### A9. Oxford comma

Always use the serial comma before the conjunction in a list of three or more items.

| Instead of | Write |
|-----------|-------|
| "entity types, sources and match rules" | "entity types, sources, and match rules" |

### A10. Skip periods on headings

Don't use periods, colons, exclamation marks, or question marks at the end of headings, subheadings, or table titles. Save periods for body text.

### A11. Bold sparingly

Bold is permitted for exactly three cases:

1. **UI element labels** the user must interact with (button names, tab names, field names, menu items)
2. **First use of a term** defined in the Glossary
3. **Bold lead-in terms** in named lists (e.g., "**The body is always an array** — even for a single entity...")

Do not bold: role names after first use, product names, general concepts, section references, emphasis words.

| Wrong | Right |
|-------|-------|
| "Go to the **Reltio Console** and click **Security**" (product name bolded) | "Go to the Reltio Console and click **Security**" (only the UI label is bold) |
| "This is **really important** to remember" | "This is really important to remember" |
| "The **developer** should check the **response**" | "Check the response" |
| "See **Part C** for code examples" | "See Part C for code examples" |
| "Use **Reltio** to manage your **data**" | "Use Reltio to manage your data" |

---

## Part B: Step and List Formatting

### B1. Explain before showing code

Always give 1-2 sentences of context before a code block. Don't drop a code block without explaining what it does and why the reader needs it.

| Instead of | Write |
|-----------|-------|
| `### Request` [code block] | `### Request` "Let's verify everything works by reading your tenant's configuration." [code block] |

### B2. Show the simplest example first

Start with the basic case. Add complexity after. Reserve complicated examples for sections where you provide a step-by-step explanation.

### B3. Leading sentence required before every list

Every bulleted or numbered list must have a leading sentence that introduces it. Never drop a list cold after a heading.

| Wrong | Right |
|-------|-------|
| `### Getting started` <br> `- Node.js 18+` <br> `- A Reltio tenant` | `### Getting started` <br> "Gather these before you start:" <br> `- Node.js 18+` <br> `- A Reltio tenant` |
| `### Key rules` <br> `1. Always include crosswalks` | `### Key rules` <br> "Keep these in mind when creating entities:" <br> `1. Always include crosswalks` |

### B4. List item separator is ` — ` (em dash with spaces)

Use an em dash with a space on each side to separate the lead-in term from its explanation. Do not use a colon.

| Wrong | Right |
|-------|-------|
| `- **Crosswalk:** a pointer back to the source` | `- **Crosswalk** — a pointer back to the source` |
| `- **OV**: the winning value` | `- **OV** — the winning value` |

This convention is used throughout the existing guides. Keep it consistent.

### B5. No "Step X:" prefixes inside numbered lists

Markdown numbering handles step sequencing. Adding "Step 1:", "Step 2:" inside the list text is redundant and clutters the page.

| Wrong | Right |
|-------|-------|
| `1. Step 1: Get an access token` <br> `2. Step 2: Read the configuration` | `1. Get an access token` <br> `2. Read the configuration` |

> **Note:** `## Step N:` headings for major sections are fine — this rule applies only to numbered list items within a section.

---

## Part C: Code Examples

### C1. curl commands

Standard format:

```bash
curl -s -X [METHOD] "${TENANT}/[endpoint]" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '[...]' | jq .
```

Rules:
- Always use `-s` (silent mode)
- Always use explicit `-X METHOD`, even for GET
- Break long commands across lines with `\`
- Each `-H` header on its own line
- Pipe to `jq .` for JSON output (or `jq '.[].uri'` for selective output)
- Use `${VARIABLE}` syntax, not `$VARIABLE`
- Use single quotes for JSON values inside filters, double quotes for the outer string

### C2. Environment variables

Set up at the start, reuse throughout:

```bash
export TOKEN="eyJhbGciOiJSUzI1NiIs..."
export TENANT="https://na07-prod.reltio.com/reltio/api/HKlMR3wNbRT3PMo"
```

Naming:
- `TOKEN` or `RELTIO_TOKEN` — access token
- `TENANT` or `TENANT_URL` — tenant URL
- `ENTITY_JOHN`, `ENTITY_ACME` — saved entity URIs (descriptive names)

Remind the reader to substitute real values: "(Use the actual URIs from your response.)"

### C3. JSON responses

- Show realistic but truncated responses — use `...` for omitted fields
- Include the key fields fully
- For critical operations (create, merge), show enough structure to understand the response

```json
{
  "index": 0,
  "object": {
    "URI": "entities/ABC123",
    "type": "configuration/entityTypes/Individual",
    ...
  },
  "status": "success"
}
```

### C4. JSON payloads

- Show the full structure for the first example of each operation
- Subsequent examples can be shorter if the structure was already shown
- Use placeholder values: `YOUR_CLIENT_ID`, `CRM-1001`, `entities/ABC123`
- Never use real credentials
- Design code for reuse — help readers determine what to modify
- Add comments to explain details, but don't state the obvious

### C5. Code comments

Use comments to explain the "why," not the "what." Don't over-comment.

| Over-commented | Right amount |
|---------------|-------------|
| `# Set the variable TOKEN to the access token value` | `# Save for reuse — valid for 60 minutes` |
| `# Send a POST request to the entities endpoint` | `# Create two individuals` |

### C6. Multi-language examples

Use collapsible `<details>` sections. The first language (Python) uses `<details open>`. Others use `<details>`.

```markdown
<details open>
<summary><strong>Python</strong></summary>

Requires: `pip install requests`

```python
...
```

</details>
```

Each script should demonstrate the same operations for consistency.

### C7. Show expected output

Always show what the reader should expect. Either in a separate Response section after the code or by using code comments within the code.

---

## Part D: Tables

### D1. When to use tables

Tables are for structured comparisons. Use them for:

- **Getting started** — What | Example | Where to get it
- **API parameters/filters** — Function | What it does | Example
- **Error handling** — Error | Cause | Fix
- **Rate limits** — Limit | Value | What happens
- **Comparisons** — Mode | Behavior | When to use
- **Event types** — Event | What happened
- **Configuration components** — Component | Details
- **Step mapping** — Setup component | Tutorial step that uses it

### D2. "What can go wrong" tables

Always 3 columns: **Error | Cause | Fix**

```markdown
| Error | Cause | Fix |
|-------|-------|-----|
| `401` | Wrong Client ID or Secret | Double-check credentials |
| `429` | Too many token requests (limit: 10/sec) | Cache and reuse your token |
```

Place after Request/Response. Not every step needs one — use for steps where errors are common or confusing.

### D3. "Key rules" lists

Numbered or bulleted list with **bold lead-in**:

```markdown
### Key rules

1. **The body is always an array** — even for a single entity, wrap it in `[ ]`.
2. **Every attribute is an array of objects** — not plain values.
3. **Always include crosswalks** — they track data lineage.
```

---

## Part E: Callouts and Emphasis

### E1. Blockquote callouts

Use `>` blockquotes with a bold label. Four types:

```markdown
> **Important:** This will **overwrite** the tenant's L3 configuration.

> **Note:** Match evaluation is asynchronous. If you get an empty result, wait 10-15 seconds.

> **Tip:** For complex searches, use POST instead of GET to avoid URL length limits.

> **Rule of thumb:** Get one token, reuse it for 55 minutes, then get a new one.
```

**When to use each:**
- **Important** — something that could break things or cause data loss
- **Note** — supplementary information that clarifies behavior
- **Tip** — a better way to do something
- **Rule of thumb** — a practical heuristic to remember

### E2. Inline code

Use backticks for:
- HTTP methods: `POST`, `GET`, `PUT`, `DELETE`
- Status codes: `401`, `429`, `503`
- Endpoints and paths: `/entities`, `configuration/entityTypes/Individual`
- JSON field names: `access_token`, `crosswalks`, `type`
- Variable names: `${TOKEN}`, `${TENANT}`
- Tool names: `curl`, `jq`, `python3`
- Parameter values: `partialOverride`, `true`, `false`
- Config values: `"suspect"`, `"automatic"`

---

## Part F: Scannability

These rules come directly from Microsoft's scannable content guidelines.

### F1. Write for scanning first, reading second

Most readers scan before they commit to reading. Use headings, lists, tables, and short paragraphs to create visual landmarks.

### F2. Front-load keywords

Place important keywords near the beginning of headings, table entries, and paragraphs so they're easy to spot when scanning.

| Hard to scan | Easy to scan |
|-------------|-------------|
| "A brief explanation of how crosswalks work" | "Crosswalks track where data came from" |
| "Information about rate limits" | "Rate limits: what you need to know" |

### F3. Establish patterns

Consistent structure creates patterns that help readers comprehend faster. Apply the same section structure to every step. Use the same table format for errors. Use the same callout labels throughout.

### F4. Use lists for three or more related items

Don't bury lists in paragraphs. If you mention three or more items, break them into a bullet or numbered list.

| Instead of | Write |
|-----------|-------|
| "You can load entities, relationships, and interactions." | "You can load: <br>- Entities <br>- Relationships <br>- Interactions" |

### F5. Keep tables simple

Two to four columns. Use the simplest table that conveys the information. Don't pack entire paragraphs into table cells.

---

## Part G: Reltio-Specific Conventions

### G1. Credential placeholders

Always use these placeholders — never real values:

| Placeholder | Example value |
|-------------|---------------|
| `YOUR_CLIENT_ID` | `my_app_client` |
| `YOUR_CLIENT_SECRET` | `s3cretV4lue` |
| `YOUR_TENANT_ID` | `HKlMR3wNbRT3PMo` |
| Environment URL | `https://na07-prod.reltio.com` |

### G2. Entity type paths

Always use the full configuration path in code examples:

```
configuration/entityTypes/Individual
configuration/entityTypes/Individual/attributes/FirstName
configuration/sources/CRM
configuration/relationTypes/Employment
```

Never abbreviate to `Individual` or `FirstName` in code. In prose, the short name is fine: "the `Individual` entity type."

### G3. Crosswalk values

Use a consistent naming pattern:

- Source records: `CRM-1001`, `CRM-1002`, `ERP-5001`
- Organization records: `ORG-2001`
- Relationship records: `REL-3001`
- Test records: `TEST-CLEANSE-001`

### G4. Entity URIs

Use placeholder URIs: `entities/ABC123`, `entities/DEF456`, `entities/GHI789`, `entities/MNO777`.

Always remind: "(Use the actual URIs from your response.)"

### G5. Explain Reltio terms on first use

When a Reltio-specific term first appears, explain it inline. After the first explanation, use the term freely without re-explaining. For the canonical list of Reltio terms and their definitions, see the glossary in `STRUCTURE-GUIDE.md`.

- **Crosswalk** — "a pointer back to its source system that tracks where the data came from"
- **Operational Value (OV)** — "the winning value chosen by survivorship rules"
- **Survivorship** — "rules for choosing which attribute value wins when records are merged"
- **L3 configuration** — "the business-level data model (entity types, attributes, sources, match rules)"
- **Golden record** — "the single, merged entity that represents the truth"

### G6. Use the current platform name — never "Reltio Data Cloud"

The product is the **Reltio Context Intelligence Platform**. "Reltio Data Cloud" is a retired brand name and must never appear in any HOWTO, example, or boilerplate.

| ❌ Never write | ✅ Always write |
|---|---|
| Reltio Data Cloud | Reltio Context Intelligence Platform |

This applies everywhere: audience lines, body text, callouts, glossary entries, and diagram labels. The documentation corpus (`reltio-docs/docs.md`) predates the rename and still contains the old name in many places — **do not copy it from the corpus**. The rule overrides the source material.

**HTML generation enforcement:** `generate-html.js` runs a lint check that blocks HTML generation for any `.md` file containing "Reltio Data Cloud". A violation causes an immediate, named error and halts the build.

**Do not add "Reltio Context Intelligence Platform" as a glossary entry.** The platform name is not a Reltio-specific technical term that needs defining — it is simply the name of the product the reader is already using. Customers do not need a glossary entry explaining what the product is called. If a guide must reference the platform name in the glossary for some reason, the definition must be a plain customer-facing description only — never an internal note like "This is the current product name."

---

## Part H: Links and Cross-References

### H1. Internal links (within the repo)

Use relative paths:

```markdown
[HOWTO: Authenticate](./howtos/HOWTO-authenticate-and-use-reltio-apis.md)
```

### H2. Anchor links (within the same document)

Use in the Contents list:

```markdown
[1. Getting started](#1-getting-started)
```

### H3. External links (Reltio docs)

Use full URLs to the official documentation portal. Place external links in a "Further reading" or "Useful Reltio docs links" section at the end, not inline in the middle of steps.

### H4. Contents anchor format

Every anchor in the Contents list must resolve to an actual heading in the document. Generate anchors by converting the heading text to lowercase, replacing spaces with hyphens, and stripping punctuation (including the period after the section number).

| Heading | Anchor |
|---------|--------|
| `## 1. Getting started` | `#1-getting-started` |
| `## 2. Key concepts` | `#2-key-concepts` |
| `## 3. Search for entities` | `#3-search-for-entities` |

Before publishing, click every TOC link to verify it jumps to the right section.

### H5. No fake links

Every link must resolve to a real target. Do not include placeholder links (`#TODO`, `#tbd`, empty `()` targets) or links to pages that don't exist yet. If a target document hasn't been written, mention it in plain text without a link and note that it's forthcoming.

| Wrong | Right |
|-------|-------|
| `[Data cleansing guide](#TODO)` | "A data cleansing guide is forthcoming." |
| `[See details](./howtos/HOWTO-not-yet-written.md)` | "A separate HOWTO will cover this topic." |

---

## Checklist: Before Publishing a New HOWTO

### Voice (Microsoft Writing Style)
- [ ] Reads naturally when spoken aloud
- [ ] Leads with what's most important in each section
- [ ] No unnecessary words — every sentence earns its place
- [ ] Uses contractions throughout
- [ ] Uses active voice and present tense
- [ ] Addresses the reader as "you"
- [ ] Paragraphs are 3-7 lines max
- [ ] Headings use sentence-style capitalization (or consistent title case within the doc)
- [ ] No periods on headings
- [ ] Oxford commas used consistently
- [ ] Bold used only for UI labels, first-use glossary terms, and list lead-in terms

### Steps and lists
- [ ] Every list has a leading sentence that introduces it
- [ ] No "Step X:" prefixes inside numbered list items
- [ ] Em dash with spaces (` — `) separates lead-in terms from explanations

### Code
- [ ] Every API step shows: endpoint, curl example, response
- [ ] Placeholder credentials used — never real values
- [ ] Full configuration paths in all code examples
- [ ] Crosswalk values follow naming pattern (`CRM-XXXX`, `ERP-XXXX`)
- [ ] Code comments explain "why," not "what"
- [ ] Expected output shown for every example

### Reltio-specific
- [ ] Reltio-specific terms explained on first use (see glossary in `STRUCTURE-GUIDE.md`)
- [ ] Callouts use correct labels (Important, Note, Tip, Rule of thumb)
- [ ] All internal links are relative paths
- [ ] External links go to docs.reltio.com

### Links
- [ ] TOC anchors resolve to actual headings in the document
- [ ] No fake or placeholder links — every link target exists

### Quality
- [ ] API endpoints verified against `reltio-docs/docs.md`
- [ ] JSON payloads use correct attribute structure (arrays of objects)
- [ ] Rate limits and quotas cited accurately
- [ ] Guide reviewed by someone with Reltio tenant access

> **Note:** For structure-related checks (title format, opening line, TOC, prerequisites, footer, horizontal rules, file naming), see the checklist in `STRUCTURE-GUIDE.md`.
