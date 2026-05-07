# Reltio AI-Ready HOWTOs

Generate hands-on HOWTO guides for the Reltio Context Intelligence Platform — powered by Claude Code and grounded in official Reltio documentation.

## How it works

```
reltio-docs/docs.md        ← 3,000+ topics of official Reltio documentation
reltio-docs/index.md       ← structured topic index
        │
        ▼
   CLAUDE.md               ← generation rules + accuracy enforcement
   STYLE-GUIDE.md          ← Microsoft Writing Style voice + Reltio conventions
   STRUCTURE-GUIDE.md      ← document skeleton, diagrams, glossary, section types
        │
        ▼
   howtos/HOWTO-*.md       ← guides you generate (your fork, your content)
   howtos-html/            ← rendered HTML, auto-generated on every commit
```
## Pre-generated guides

This repo ships with a set of pre-generated HOWTOs you can use as reference examples:

- [`howtos/`](howtos/) — Markdown source files
- [`howtos-html/`](howtos-html/) — Pre-rendered, self-contained HTML

These guides were AI-generated against the official Reltio docs corpus. Regenerate any of them at any time to pick up the latest docs snapshot.

This repo is a **generator kit**. You fork it, open it in Claude Code, and generate HOWTOs tailored to your use cases. The guides your team generates go into your own copy.

> **This repo does not accept pull requests.** Fork it and keep your guides in your own fork.

Every guide is generated against the official Reltio docs corpus. If a topic isn't covered in the docs, the generator won't generate a HOWTO as a guardrail against content fabrication.

## Quickstart

### 1. Fork this repo

Click **Fork** on GitHub. You own your fork — generate as many HOWTOs as you want.

### 2. Clone and install

```bash
git clone https://github.com/YOUR_ORG/reltio-ai-ready-howtos.git
cd reltio-ai-ready-howtos
npm install        # installs dependencies + wires the pre-commit hook
```

`npm install` takes about 30 seconds and sets up the pre-commit hook that auto-generates HTML every time you commit a new guide.

### 3. Open in Claude Code

```bash
claude
```

Claude Code reads `CLAUDE.md` automatically on startup. No configuration needed.

### 4. Generate a HOWTO

```
Generate a HOWTO about configuring match rules in Reltio
```

Be specific — `"configure match rules"` produces a better guide than `"matching"`. The more precise the topic, the better the source discovery.

The generator will:
- Search the 3,000+-topic docs corpus for relevant source material
- Refuse (with alternatives) if there isn't enough to write reliably
- Write the guide following the style and structure conventions
- Include a Mermaid workflow diagram when the topic has a real multi-step process
- Validate every claim against the documentation
- Auto-generate the rendered HTML alongside the Markdown

### 5. Locate your files

```
howtos/HOWTO-your-topic.md          ← the Markdown source
howtos-html/HOWTO-your-topic.html   ← self-contained HTML (email it, host it, share it)
```

Every HTML file is fully self-contained — CSS embedded, diagrams inlined. No server, no build step, no external dependencies. To view it, download the file and open it in any browser — GitHub does not render HTML files directly.

## What makes a good HOWTO request

| Good | Too vague |
|------|-----------|
| `Configure survivorship rules for the Individual entity type` | `Survivorship` |
| `Set up RIH for Salesforce with real-time sync` | `Salesforce integration` |
| `Use the Export Service API to download entity data` | `Exporting data` |
| `Authenticate with Reltio using OAuth 2.0 client credentials` | `Authentication` |

If the generator can't find 30+ lines of source material on your topic, it tells you what it found and suggests the closest alternatives. This is by design — an assertive refusal is better than an inaccurate guide.

## Update the docs corpus

The documentation corpus is at **[github.com/reltio-ai/reltio-ai-ready-docs](https://github.com/reltio-ai/reltio-ai-ready-docs)** and is updated bi-weekly from the official Reltio documentation. To pull the latest into your fork:

```bash
npm run refresh-docs
```

Then regenerate any guide that covers topics that may have changed. Check the `_Generated:` timestamp in `reltio-docs/docs.md` to see how recent your local copy is.

## Requirements

- [Claude Code](https://claude.ai/claude-code)
- Node.js 18+
- `curl` and `jq` (for the API examples in the generated guides)

## License

The generator infrastructure (scripts, templates, style guides) is licensed under the [Reltio HOWTOs License](LICENSE.md). Guides you generate using this kit are for your own internal use — you may not republish or redistribute them.

---

> **Note:** This is a generator kit, not a guide collection. The guides in your fork reflect your company's use of Reltio — they're yours, not ours. See [DISCLAIMER.md](DISCLAIMER.md) for the full AI-generation caveat.
