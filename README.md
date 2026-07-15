# ErrorLedger

ErrorLedger is an independent, zero-trust technology incident database and post-mortem research library built on Astro. It documents the technical, network, and software-level root causes of major platform outages and security breaches.

## 🚀 Project Structure

Inside your ErrorLedger workspace, the directories are structured as follows:

```text
├── public/              # Static assets, sitemaps, and search engine verification files
├── src/
│   ├── assets/          # Global fonts and media assets
│   ├── components/      # UI components (Header, Footer, FormattedDate)
│   ├── content/         # Astro Content Collections
│   │   └── blog/        # Markdown (.md) Incident Records
│   ├── layouts/         # Base layout templates (BlogPost.astro)
│   └── pages/           # Astro page routes (Search Ledger, About, Privacy)
├── astro.config.mjs     # Global Astro config
├── package.json
└── tsconfig.json

```

## 🧞 Build & Development Commands

All commands are executed from the root of the project directory:

| Command | Action |
| --- | --- |
| `npm install` | Installs system dependencies |
| `npm run dev` | Starts the local dev server |
| `npm run build` | Compiles your production-ready static site to `./dist/` |
| `npm run preview` | Previews your production build locally before deployment |
| `npm run astro ...` | Runs native Astro CLI commands (e.g., `astro check`) |

## 🛠️ Content & Writing Guidelines

1. **Strict Metadata Verification:** Every incident record must contain the `meta_title` (under 60 characters) and `description` (120–155 characters) parameters.
2. **The 3-Tier Tag Taxonomy:** Always apply between 4 and 6 tags spanning Platform, Protocol, and System Event layers.
3. **No Code Generation:** We explicitly document *why and how* architectural systems fail at scale. We do not provide localized code fixes, SDK workarounds, or software patches.

```

```