require("dotenv").config();
const axios = require("axios");
const { Octokit } = require("@octokit/rest");

function must(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function getGithubFile(path) {
  const octokit = new Octokit({ auth: must("GITHUB_TOKEN") });
  const owner = must("GITHUB_OWNER");
  const repo = must("GITHUB_REPO");

  const res = await octokit.rest.repos.getContent({ owner, repo, path });
  if (Array.isArray(res.data)) return null;

  return Buffer.from(res.data.content, "base64").toString("utf8");
}

async function getConfluenceTemplateStorage() {
  const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
  const pageId = must("CONFLUENCE_TEMPLATE_PAGE_ID");
  const email = must("CONFLUENCE_EMAIL");
  const token = must("CONFLUENCE_API_TOKEN");

  const url = `${base}/rest/api/content/${pageId}?expand=body.storage`;

  const auth = Buffer.from(`${email}:${token}`).toString("base64");

  const res = await axios.get(url, {
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: "application/json",
    },
  });

  return res.data.body.storage.value; // Confluence storage HTML
}

(async () => {
  try {
    const templateHtml = await getConfluenceTemplateStorage();
    console.log("Confluence template fetched. Length:", templateHtml.length);

    const readme = await getGithubFile("README.md").catch(() => null);
    const pkg = await getGithubFile("package.json").catch(() => null);

    console.log("README fetched:", !!readme);
    console.log("package.json fetched:", !!pkg);
  } catch (err) {
    console.error("ERROR:", err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }
})();