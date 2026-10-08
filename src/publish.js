require("dotenv").config();
const axios = require("axios");
const { Octokit } = require("@octokit/rest");

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

async function confluenceGetTemplate({ templatePageId }) {
  const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
  const url = `${base}/rest/api/content/${templatePageId}?expand=body.storage,space`;

  const res = await axios.get(url, {
    headers: {
      Authorization: confluenceAuthHeader(),
      Accept: "application/json",
    },
  });

  return {
    templateHtml: res.data.body.storage.value, // storage HTML
    spaceKey: res.data.space.key,
    spaceId: res.data.space.id, // numeric string in many tenants
    templateTitle: res.data.title,
  };
}

async function confluenceCreatePageV2({ spaceId, title, storageHtml }) {
  const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
  const url = `${base}/api/v2/pages`;

  const payload = {
    spaceId: String(spaceId),
    status: "current",
    title,
    body: {
      representation: "storage",
      value: storageHtml,
    },
  };

  const res = await axios.post(url, payload, {
    headers: {
      Authorization: confluenceAuthHeader(),
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  return res.data; // contains id, title, etc.
}

async function githubReadFile({ owner, repo, path }) {
  const octokit = new Octokit({ auth: must("GITHUB_TOKEN") });
  const res = await octokit.rest.repos.getContent({ owner, repo, path });
  if (Array.isArray(res.data)) return null;
  return Buffer.from(res.data.content, "base64").toString("utf8");
}

async function githubGetRepoFacts() {
  const owner = must("GITHUB_OWNER");
  const repo = must("GITHUB_REPO");

  let readme = "";
  try {
    readme = (await githubReadFile({ owner, repo, path: "README.md" })) || "";
  } catch {
    readme = "";
  }

  let pkg = {};
  try {
    const pkgText = await githubReadFile({ owner, repo, path: "package.json" });
    pkg = JSON.parse(pkgText);
  } catch {
    pkg = {};
  }

  // Strict extraction: no guessing, only simple derivations
  const APP_NAME = pkg.name || "Not Found";

  let APP_DESCRIPTION = pkg.description || "";
  if (!APP_DESCRIPTION) {
    // Take first non-heading non-empty line from README as fallback
    const lines = readme.split("\n").map((l) => l.trim());
    const candidate =
      lines.find((l) => l && !l.startsWith("#") && !l.startsWith(">")) || "";
    APP_DESCRIPTION = candidate || "Not Found";
  }

  const REPO_URL = `https://github.com/${owner}/${repo}`;

  // For JS sample, keep tech stack simple and factual
  const TECH_STACK = "Node.js, Express";

  const deps =
    pkg.dependencies && typeof pkg.dependencies === "object"
      ? Object.keys(pkg.dependencies)
      : [];
  const DEPENDENCIES = deps.length ? deps.join(", ") : "Not Found";

  // Try to extract "Run" section
  let RUN_INSTRUCTIONS = "Not Found";
  const runMatch = readme.match(/##\s*Run\s*([\s\S]*?)(\n##|\n#|$)/i);
  if (runMatch && runMatch[1] && runMatch[1].trim()) {
    RUN_INSTRUCTIONS = runMatch[1].trim();
  }

  return {
    APP_NAME,
    APP_DESCRIPTION,
    REPO_URL,
    TECH_STACK,
    RUN_INSTRUCTIONS,
    DEPENDENCIES,
  };
}

function renderTemplate(templateHtml, facts) {
  // Replace placeholders like {{APP_NAME}}
  return templateHtml.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(facts, key)) return facts[key];
    return match; // leave unknown placeholders unchanged
  });
}

(async () => {
  try {
    const templatePageId = must("CONFLUENCE_TEMPLATE_PAGE_ID");

    const template = await confluenceGetTemplate({ templatePageId });
    const facts = await githubGetRepoFacts();

    const finalHtml = renderTemplate(template.templateHtml, facts);
    const pageTitle = `${facts.APP_NAME} - Technical Profile (Auto-Generated)`;

    const created = await confluenceCreatePageV2({
      spaceId: template.spaceId,
      title: pageTitle,
      storageHtml: finalHtml,
    });

    const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
    console.log("Template used:", template.templateTitle);
    console.log("Created page id:", created.id);
    console.log("Created title:", created.title);
    console.log("Open page:", `${base}/spaces/${template.spaceKey}/pages/${created.id}`);
  } catch (err) {
    const status = err?.response?.status;
    const data = err?.response?.data;
    console.error("ERROR:", status || "", data || err.message);
    process.exit(1);
  }
})();