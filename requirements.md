Requirements — EliteA Documentation Sync (Agentic SDLC Capstone)
1. Background / Problem
Teams often maintain technical documentation manually in Confluence, which becomes outdated as code changes. This capstone implements an EliteA-style workflow that auto-generates a standardized “Technical Profile” page in Confluence by extracting facts from a GitHub repository and applying a master template.


2. Objective
Build a Node.js (JavaScript) tool that:


Reads a Confluence “Master Template” page containing placeholders

Scans a GitHub repository for key files (README, package.json, configs)

Extracts facts in strict mode (no guessing)

Creates a new Confluence page populated with extracted values

3. Scope
In Scope
Real GitHub API integration to read repository file contents

Real Confluence API integration:

Read master template page content (storage format)

Create a new Confluence page in a target space

Placeholder detection and replacement (e.g., {{APP_NAME}})

Strict extraction policy:

if not found in repo content -> output Not Found / Not Specified (consistent wording)

Local execution (CLI / node script) and repeatable runs

Out of Scope (MVP)
Two-way sync (Confluence -> GitHub)

Complex inference / AI “guessing” of values

Full repo parsing of every file type

Multi-space or multi-template orchestration (can be future enhancement)

4. Users / Personas
Developer / Tech Writer: runs tool to generate documentation

Reviewer (HITL): reviews generated requirements/design/test outputs and final generated Confluence page

5. Inputs
GitHub:

owner, repo

GitHub Personal Access Token (PAT)

Confluence:

base URL (Confluence Cloud)

space key (target space)

master template page ID

Atlassian email + API token

6. Outputs
A new Confluence page created in the target space:

Title format: &#60;App Name&#62; - Technical Profile (Auto-Generated)

The page body is in Confluence storage representation populated from template placeholders

Console logs indicating:

which fields were filled

which fields were not found (optional but recommended)

7. Functional Requirements
FR-1: Read Confluence template page


The tool SHALL fetch the Confluence template page by ID

The tool SHALL read its content in body.storage format

FR-2: Identify placeholders


The tool SHALL detect placeholders of the format {{PLACEHOLDER_NAME}}

FR-3: Read GitHub repository content


The tool SHALL read at minimum:

README.md

package.json

The tool MAY read additional files such as:

.env.example, docker-compose.yml, config files

FR-4: Strict fact extraction (no guessing)


For each placeholder, the tool SHALL populate values only from evidence found in repo content

If the value is not found, the tool SHALL populate Not Found (or Not Specified) and SHALL NOT hallucinate values

FR-5: Render final page


The tool SHALL replace placeholders with extracted values to produce final Confluence storage HTML

FR-6: Publish generated page


The tool SHALL create a new Confluence page in the target space

The tool SHALL follow naming convention: &#60;App Name&#62; - Technical Profile (Auto-Generated)

FR-7: Error handling


The tool SHALL provide clear errors for:

missing env vars

authentication failures (401)

permission failures (403)

missing template page / missing repo files (should not crash; should degrade gracefully)

8. Non-Functional Requirements
NFR-1 Security


Secrets (tokens) SHALL NOT be committed to git

Secrets SHALL be read from local environment (e.g., .env ignored)

NFR-2 Reliability & Resilience


Handle missing README/package.json by using Not Found values

Provide deterministic output for same inputs

NFR-3 Maintainability


Code should be modular: GitHub client, Confluence client, extractors, renderer

NFR-4 Observability


Log key steps: template fetched, files fetched, page created (id and URL)

9. Acceptance Criteria (MVP)
Given valid tokens and configuration, the tool can:

fetch the Confluence template successfully

fetch README and package.json from GitHub successfully

create a new Confluence page with placeholders replaced

Missing values are rendered as Not Found (no guessing)

10. Edge Cases
Template contains placeholders not supported -> leave placeholder unchanged or set to Not Found (document chosen behavior)

Repo has no README -> still create page with Not Found values

package.json invalid JSON -> treat as missing

API rate limits -> minimal calls; surface message to user