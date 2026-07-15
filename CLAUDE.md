# ErrorLedger Developer Guidelines

These guidelines define development workflows, configuration rules, and compiler parameters for ErrorLedger.com.

## 🚀 Background Development Server

When starting the dev server, use background mode:

```bash
npx astro dev --background

```

Manage the background server with `npx astro dev stop`, `npx astro dev status`, and `npx astro dev logs`.

## 🧠 Core Engineering Principles

* **No Code Fixes:** Do not write quick code corrections, temporary SDK patches, or package repair scripts. Focus strictly on system mechanics, BGP/DNS routing patterns, memory leaks, and architectural failures.
* **Primary-Source Integrity:** Ensure all precision performance and time metrics inside markdown files are hyperlinked back to authoritative, verified RCAs or logs.

## 🎨 Layout & Coding Standards

* **Astro Component Style:** Maintain atomic, modular style declarations. Scoped `<style>` tags are preferred over nested class naming utilities.
* **Frontmatter Verification:**
* `meta_title`: Required. Maximum 60 characters.
* `description`: Required. Strictly between 120 and 155 characters.
* `tags`: Required. Exactly 4 to 6 lowercase, hyphenated strings.


* **Build Verification:** Run `npx astro check` before staging changes to verify dynamic routes, link parameters, and typescript safety.

```