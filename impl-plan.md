Implementation Plan — EliteA Documentation Sync Capstone
Milestone 1: Project Setup (Done/Current)

Create tool repository (Node.js)


Add .gitignore and .env.example


Configure Confluence space and template page


Verify API connectivity (GitHub read + Confluence read)

Milestone 2: MVP Publish Flow
Goal: Create the generated Confluence page end-to-end.


Tasks:



Implement src/publish.js:

fetch template storage HTML

fetch GitHub README + package.json

extract facts in strict mode

replace placeholders

create a new Confluence page


Add npm script: publish


Manual verification:

open Confluence page URL

verify values replaced correctly

verify missing values show Not Found

Milestone 3: Testing (Capstone Requirement)

Write test cases in Gherkin format (commit to repo or Confluence/Jira as required)


Implement automated tests with Playwright:

run publish script (or CLI)

validate created page exists and contains expected text


Store test execution report/results (commit or attach per guidelines)

Milestone 4: SDLC Artifacts + Demo Evidence

Jira:

Epic + stories + tasks for enhancements and implementation


Confluence:

FRD/Architecture/Design/Wireframes pages created and linked


Git:

PR creation with required PR template/checklist

Code review comments added


Local deployment instructions:

update README with prerequisites and commands

Milestone 5: Final Demo Preparation
Demo flow (HITL at each step):


Requirement/story generation + human review

Implementation plan + PR created

Architecture/design docs + human review

Implementation + code review checklist

Tests executed + results shown

Local run creates Confluence Technical Profile page

