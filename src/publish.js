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

async function confluenceGetTemplate() {
  const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
  const pageId = must("CONFLUENCE_TEMPLATE_PAGE_ID");
  const url = `${base}/rest/api/content/${pageId}?expand=body.storage,space`;

  const res = await axios.get(url, {
    headers: {
      Authorization: confluenceAuthHeader(),
      Accept: "application/json",
    },
  });

  return {
    templateHtml: res.data.body.storage.value, // Confluence storage HTML
    spaceKey: res.data.space.key,
    spaceId: res.data.space.id,
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

  return res.data; // { id, title, ... }
}

async function githubReadFile({ owner, repo, path }) {
  const octokit = new Octokit({ auth: must("GITHUB_TOKEN") });
  const res = await octokit.rest.repos.getContent({ owner, repo, path });
  if (Array.isArray(res.data)) return null;
  return Buffer.from(res.data.content, "base64").toString("utf8");
}

function strictOrNotFound(v) {
  if (v === null || v === undefined) return "Not Found";
  const s = String(v).trim();
  return s ? s : "Not Found";
}

function extractDescription({ pkg, readme }) {
  // Strict preference: package.json description
  const d1 = strictOrNotFound(pkg.description || "");
  if (d1 !== "Not Found") return d1;

  // Fallback: first meaningful non-heading line in README
  const lines = (readme || "").split("\n").map((l) => l.trim());
  const candidate =
    lines.find((l) => l && !l.startsWith("#") && !l.startsWith(">")) || "";
  return strictOrNotFound(candidate);
}

function extractRunInstructions(readme) {
  if (!readme) return "Not Found";
  const m = readme.match(/##\s*Run\s*([\s\S]*?)(\n##|\n#|$)/i);
  if (!m || !m[1]) return "Not Found";
  return strictOrNotFound(m[1]);
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

  const deps =
    pkg.dependencies && typeof pkg.dependencies === "object"
      ? Object.keys(pkg.dependencies)
      : [];

  // Keys MUST match template placeholders exactly:
  return {
    APP_NAME: strictOrNotFound(pkg.name),
    APP_DESCRIPTION: extractDescription({ pkg, readme }),
    REPO_URL: `https://github.com/${owner}/${repo}`,
    TECH_STACK: "Node.js, Express",
    RUN_INSTRUCTIONS: extractRunInstructions(readme),
    DEPENDENCIES: deps.length ? deps.join(", ") : "Not Found",
  };
}

function renderTemplate(templateHtml, facts) {
  // Replace placeholders like {{APP_NAME}}.
  // Leave unknown placeholders unchanged.
  return templateHtml.replace(/\{\{([A-Z0-9_]+)\}\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(facts, key)) return facts[key];
    return match;
  });
}

function buildTitle(appName) {
  const base = `${appName} - Technical Profile (Auto-Generated)`;
  const unique = process.env.UNIQUE_TITLE === "true";
  if (!unique) return base;

  // Make it file/title safe
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${base} (${ts})`;
}

(async () => {
  try {
    const template = await confluenceGetTemplate();
    const facts = await githubGetRepoFacts();

    const finalHtml = renderTemplate(template.templateHtml, facts);
    const title = buildTitle(facts.APP_NAME);

    const created = await confluenceCreatePageV2({
      spaceId: template.spaceId,
      title,
      storageHtml: finalHtml,
    });

    const base = must("CONFLUENCE_BASE_URL").replace(/\/$/, "");
    console.log("Template used:", template.templateTitle);
    console.log("Created page id:", created.id);
    console.log("Created title:", created.title);
    console.log("Open page:", `${base}/spaces/${template.spaceKey}/pages/${created.id}`);
  } catch (err) {
    console.error("ERROR:", err.response?.status, err.response?.data || err.message);
    process.exit(1);
  }
})();