Architecture — EliteA Documentation Sync (Node.js)
1. High-Level Architecture
The solution is a Node.js CLI/script that orchestrates two external systems:


GitHub REST API (repository content)

Confluence REST API (template read + page creation)

2. Components
2.1 CLI / Runner
Entry point that:

loads configuration from environment

calls GitHub + Confluence clients

executes extraction and rendering pipeline

creates Confluence page

2.2 GitHub Client (Octokit)
Responsibilities:


Authenticate with PAT

Read repo file contents using repos.getContent

Provide normalized text outputs

2.3 Confluence Client (Axios)
Responsibilities:


Authenticate via Basic Auth (email:apiToken)

Read template page:

GET /rest/api/content/{id}?expand=body.storage,space

Create generated page:

POST /api/v2/pages (storage representation body)

2.4 Extractors (Strict Mode)
Responsibilities:


Extract facts from:

package.json (name, description, dependencies)

README sections (run instructions)

Output a dictionary like:

{ APP_NAME: "...", DEPENDENCIES: "...", ... }

Any unknown or missing data -> Not Found

2.5 Renderer
Responsibilities:


Replace placeholders in template HTML storage:

{{KEY}} -&#62; value

Unknown placeholders remain unchanged (or set to Not Found, if desired)

3. Data Flow / Sequence
Load .env config

Fetch Confluence template storage HTML

Fetch GitHub README and package.json

Extract facts in strict mode

Render final Confluence storage HTML

Create Confluence page titled &#60;App Name&#62; - Technical Profile (Auto-Generated)

Print created page URL

4. Configuration (Environment Variables)
GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO

CONFLUENCE_BASE_URL, CONFLUENCE_EMAIL, CONFLUENCE_API_TOKEN

CONFLUENCE_SPACE_KEY

CONFLUENCE_TEMPLATE_PAGE_ID

5. Security
.env must be gitignored

Tokens must be rotated if exposed

Use least-privilege PAT:

public_repo scope for public repositories

6. Local Deployment
Run locally via npm scripts:

npm start for connectivity verification

npm run publish for actual page creation (planned)

7. Future Enhancements
Support additional file types/configs

Update existing page rather than creating duplicates

Support parent page placement and versioning strategies

Add caching/retry/backoff for rate limits