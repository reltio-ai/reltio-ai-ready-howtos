# Reltio docs corpus

`docs.md` and `index.md` are the knowledge source for all HOWTO generation.
They are published and maintained at:

**https://github.com/reltio-ai/reltio-ai-ready-docs**

## Refresh locally

```bash
npm run refresh-docs
```

Or manually:

```bash
curl -sL https://raw.githubusercontent.com/reltio-ai/reltio-ai-ready-docs/main/docs.md \
     -o reltio-docs/docs.md
curl -sL https://raw.githubusercontent.com/reltio-ai/reltio-ai-ready-docs/main/index.md \
     -o reltio-docs/index.md
```

The corpus syncs from the official Reltio documentation. Check the `_Generated:` header
in `docs.md` to see how fresh your local copy is.
