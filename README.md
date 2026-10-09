# elitea-doc-sync-sailaja
# EliteA Doc Sync (Capstone) — elitea-doc-sync-sailaja

Node.js tool to generate and publish a “Technical Profile (Auto-Generated)” Confluence page by:
- reading a Confluence master template page
- scanning a GitHub repository (README.md, package.json)
- filling placeholders in strict mode (no guessing)
- creating a new Confluence page

## Repos
- Tool repo: `elitea-doc-sync-sailaja`
- Sample app repo (scanned): `elitea-SDLC_Capstone`

## Prerequisites
- Node.js (recommended: 20 LTS)
- GitHub PAT (classic) with `public_repo` scope (for public repo access)
- Confluence Cloud API token

## Setup
```bash
npm install