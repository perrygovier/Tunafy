# Tunafy

A Tauri + React + TypeScript app built entirely on web APIs, so it ships both as a native desktop app and as a static web build hosted at https://tunafy.madisoncollege.dev.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Development

```bash
npm install
npm run dev          # Vite dev server
npm run tauri dev    # Tauri desktop app
```

## Builds

```bash
npm run build        # Static web build (also consumed by Tauri)
npm run tauri build  # Native desktop app bundle
```

## Deployment

Pushes to `main` trigger `.github/workflows/deploy-pages.yml`, which builds the site, writes a `CNAME` file, and publishes `dist/` to GitHub Pages. The Tauri build is unaffected because it never runs that workflow.

### One-time setup

1. **DNS** — In the `madisoncollege.dev` zone, add:

   | Type  | Name   | Value                  | TTL  |
   |-------|--------|------------------------|------|
   | CNAME | tunafy | perrygovier.github.io. | 3600 |

2. **GitHub repo** — Settings → Pages:
   - Build and deployment → Source: **GitHub Actions**
   - Custom domain: `tunafy.madisoncollege.dev`, then Save
   - Wait for the DNS check to pass, then enable **Enforce HTTPS** (GitHub will provision a Let's Encrypt cert)
