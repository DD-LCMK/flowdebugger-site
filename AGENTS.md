# ErrorLedger Agent System Protocols

This file contains operational instructions for autonomous developer agents, local LLMs, and workspace scrapers executing pipeline workflows within this repository.

## 1. Scope and Domain Constancy
* This repository is an authoritative technical archive for technology incident post-mortems.
* Do not write or recommend localized code repairs, configuration patches, or SDK quick-fixes.
* Focus purely on documenting structural failures, distributed consensus bottlenecks, routing behaviors, and memory constraints.

## 2. Dynamic Router Rules
* Every incident record must be mapped dynamically to its output file path using the `slug` frontmatter variable.
* The content collection schema defined in `src/content.config.ts` acts as the strict baseline validator for all markdown generation passes.

## 3. SEO Standard Compliance
* The `meta_title` must remain strictly under 60 characters.
* The `description` must remain strictly between 120 and 155 characters.
* The `tags` list must populate Platform, Vector, and Event classifications using 4 to 6 lowercase, hyphenated strings.