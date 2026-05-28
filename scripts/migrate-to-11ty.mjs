import fs from "node:fs/promises";
import fssync from "node:fs";
import path from "node:path";

const root = process.cwd();
const legacyRoot = path.join(root, "_legacy_static", "original");
const pagesRoot = path.join(root, "src", "pages");

const excludedOnMove = new Set([
  ".git",
  "node_modules",
  "package.json",
  "package-lock.json",
  ".eleventy.js",
  "src",
  "scripts",
  "_legacy_static",
]);

async function main() {
  if (!process.argv.includes("--from-legacy")) {
    console.error([
      "Legacy import is disabled for daily work.",
      "",
      "Edit templates/components under src/_includes and page content under src/_data/*.json, then run:",
      "  npm run build",
      "",
      "If you intentionally want to refresh JSON data from _legacy_static/original, run:",
      "  npm run import:legacy",
    ].join("\n"));
    process.exitCode = 1;
    return;
  }

  await ensureLegacy();
  await writeRoutePage();
}

async function ensureLegacy() {
  if (fssync.existsSync(legacyRoot)) return;

  await fs.mkdir(legacyRoot, { recursive: true });
  const entries = await fs.readdir(root);
  for (const entry of entries) {
    if (excludedOnMove.has(entry)) continue;
    await fs.rename(path.join(root, entry), path.join(legacyRoot, entry));
  }
}

async function writeRoutePage() {
  const page = `---
pagination:
  data: pageVariants
  size: 1
  alias: route
permalink: "{{ route.outputPath }}"
layout: layouts/base.njk
---
{% include route.template %}
`;
  await fs.mkdir(pagesRoot, { recursive: true });
  await fs.writeFile(path.join(pagesRoot, "routes.njk"), page);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
