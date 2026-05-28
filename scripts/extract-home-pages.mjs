import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = process.cwd();
const legacyRoot = path.join(root, "_legacy_static", "original");
const dataRoot = path.join(root, "src", "_data");
const markerStart = "<!-- menu end -->";
const markerEnd = "<!-- footer start -->";

const scopes = ["root", "staging"];
const locales = ["ja", "en", "cn", "tw", "ko", "vi", "th", "id", "np"];

function normalizeAssetPath(value) {
  return (value || "").replace(/^(?:\.\.\/)?/, "");
}

async function extractPage(filePath) {
  const html = await readMainContent(filePath);
  const dom = new JSDOM(`<body>${html}</body>`);
  const doc = dom.window.document;
  const images = [...doc.querySelectorAll("img")];

  return {
    marquee: doc.querySelector(".marquee li")?.textContent.trim() ?? "",
    heroImage: normalizeAssetPath(images[0]?.getAttribute("src")),
    topicImage: normalizeAssetPath(images[1]?.getAttribute("src")),
    title: doc.querySelector("h3")?.textContent.trim() ?? "",
    carouselId: doc.querySelector("[id^='carousel']")?.getAttribute("id") ?? "carousel-example",
    newsContainerId: doc.querySelector("#news")?.getAttribute("id") ?? "news",
  };
}

async function readMainContent(filePath) {
  const html = await fs.readFile(filePath, "utf8");
  const start = html.indexOf(markerStart);
  const end = html.indexOf(markerEnd, start);
  if (start === -1 || end === -1) {
    throw new Error(`Missing content markers in ${path.relative(root, filePath)}`);
  }

  return html
    .slice(start + markerStart.length, end)
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<!--\s*<div id="google_translate_element"[\s\S]*?-->/gi, "")
    .trim();
}

function legacyPagePath(scope, locale, file) {
  return path.join(
    legacyRoot,
    scope === "staging" ? "staging" : "",
    locale === "ja" ? "" : locale,
    file
  );
}

for (const scope of scopes) {
  const data = {};
  for (const locale of locales) {
    const filePath = legacyPagePath(scope, locale, "index.html");
    data[locale] = await extractPage(filePath);
  }

  const outputPath = path.join(dataRoot, scope, "index.json");
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  console.log(`Wrote ${path.relative(root, outputPath)}`);
}
