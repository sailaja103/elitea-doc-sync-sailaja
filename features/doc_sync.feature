Feature: EliteA Documentation Sync to Confluence

  Background:
    Given valid GitHub and Confluence credentials are configured

  Scenario: Generate a Technical Profile page from a GitHub repo and publish to Confluence
    Given a Confluence master template page exists
    And a GitHub repository exists with README.md and package.json
    When I run the documentation sync publish command
    Then a new Confluence page should be created
    And the page title should end with "Technical Profile (Auto-Generated)"
    And the page content should not contain unresolved placeholders like "{{APP_NAME}}"

  Scenario: Strict mode - missing README still creates page with Not Found values
    Given a GitHub repository without README.md
    When I run the documentation sync publish command
    Then a new Confluence page should be created
    And missing fields should be marked as "Not Found"