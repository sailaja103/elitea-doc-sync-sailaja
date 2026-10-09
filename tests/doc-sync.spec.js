const { test, expect } = require("@playwright/test");
const { execSync } = require("child_process");
const axios = require("axios");
require("dotenv").config();

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function confluenceAuthHeader() {
  const email = must("CONFLUENCE_EMAIL");
  const token = must("CONFLUENCE_API_TOKEN");
  const auth = Buffer.from(`${email}:${token}`).toString("base64");
  return `Basic ${auth}`;
}

async function getConfluencePageHtml(pageId) {
  const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
  const url = `${base}/rest/api/content/${pageId}?expand=body.storage`;

  const res = await axios.get(url, {
    headers: {
      Authorization: confluenceAuthHeader(),
      Accept: "application/json",
    },
  });

  return res.data.body.storage.value;
}

test("publish creates a confluence page and replaces placeholders", async () => {
  // IMPORTANT: ensure unique Confluence page title to avoid 400 duplicate-title errors
  const out = execSync("npm run publish", {
    encoding: "utf8",
    env: { ...process.env, UNIQUE_TITLE: "true" },
  });

  const match = out.match(/Created page id:\s*(\d+)/i);
  expect(match, `Expected 'Created page id' in output.\nOutput:\n${out}`).toBeTruthy();

  const pageId = match[1];
  const html = await getConfluencePageHtml(pageId);

  // Verify placeholders are replaced (based on YOUR template)
  expect(html).not.toContain("{{APP_NAME}}");
  expect(html).not.toContain("{{APP_DESCRIPTION}}");
  expect(html).not.toContain("{{REPO_URL}}");
  expect(html).not.toContain("{{TECH_STACK}}");
  expect(html).not.toContain("{{RUN_INSTRUCTIONS}}");
  expect(html).not.toContain("{{DEPENDENCIES}}");

  // Optional sanity checks (helps prove content exists)
  expect(html.length).toBeGreaterThan(50);
});