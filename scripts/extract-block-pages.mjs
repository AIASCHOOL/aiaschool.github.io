import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = process.cwd();
const legacyRoot = path.join(root, "_legacy_static", "original");
const dataRoot = path.join(root, "src", "_data");
const markerStart = "<!-- menu end -->";
const markerEnd = "<!-- footer start -->";

const scopes = ["root", "staging"];
const locales = ["ja", "en", "cn", "tw", "ko", "vi", "th", "id", "np"];
const pages = [
  "about_business",
  "about_facility",
  "about_teacher",
  "access",
  "message",
  "course_advance",
  "course_junior",
  "course_tour",
  "course_lecture",
  "life_dorm",
  "life_insurance",
  "life_visa",
  "books",
];

function compactClassName(value) {
  return (value || "").replace(/\s+/g, " ").trim();
}

function normalizeAssetPlaceholders(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/\s(src|href)=(["'])(?:\.\.\/)?(images|photos|files)\//g, " $1=$2__ASSET__$3/")
    .replace(/\s(src|href)=(["'])\/(images|photos|files)\//g, " $1=$2__ASSET__$3/")
    .replace(/(<(?:input|textarea|button)\b[^>]*class=")([^"]*)(")([^>]*?) style="transition:'all \.15s ease'"/g, "$1$2 form-transition$3$4")
    .replace(/<iframe([^>]*?) style="border:0;"/g, '<iframe$1 class="border-0"')
    .replaceAll('<div style="padding-left: 1.2em;">', '<div class="legacy-indent">')
    .replaceAll('<div style="padding-left: -1.2em; text-indent: 1.2em;">', '<div class="legacy-text-indent-md">')
    .replaceAll('<div style="padding-left: -1em; text-indent: 1em;">', '<div class="legacy-text-indent-sm">');
}

function outerHtml(element) {
  return element ? normalizeAssetPlaceholders(element.outerHTML) : "";
}

function innerHtml(element) {
  return element ? normalizeAssetPlaceholders(element.innerHTML.trim()) : "";
}

function isHero(element) {
  const className = compactClassName(element.className);
  return Boolean(element.querySelector("h3") && element.querySelector("img") && className.includes("relative"));
}

function isMainCandidate(element) {
  const className = compactClassName(element.className);
  return className.includes("mx-auto") && className.includes("p-") && (className.includes("mt-") || className.includes("my-"));
}

function findMainElement(children, heroIndex) {
  for (let index = heroIndex + 1; index < children.length; index += 1) {
    const element = children[index];
    if (isMainCandidate(element)) return { element, host: element };

    const className = compactClassName(element.className);
    if (className.includes("w-full") && element.children.length === 1 && isMainCandidate(element.firstElementChild)) {
      return { element: element.firstElementChild, host: element };
    }

    const nested = [...element.querySelectorAll("div")].find(isMainCandidate);
    if (nested) {
      return { element: nested, host: element };
    }
  }
  return null;
}

function hasDirectLabelArt(element) {
  return [...element.children].some((child) => {
    const className = compactClassName(child.className);
    return (
      child.tagName === "IMG" ||
      className.includes("clip-path-chevron") ||
      (
        className.includes("relative") &&
        (className.includes("h-") || className.includes("w-")) &&
        (child.querySelector("img") || child.querySelector(".clip-path-chevron"))
      )
    );
  });
}

function isSectionLabel(element) {
  const className = compactClassName(element.className);
  if (!element.textContent.replace(/\s+/g, "").trim()) return false;

  if (className.includes("h-") && className.includes("relative") && hasDirectLabelArt(element)) {
    return true;
  }

  if (!className.includes("flex") || !(className.includes("sm:flex-row") || className.includes("md:flex-row"))) {
    return false;
  }

  const first = element.firstElementChild;
  if (!first) return false;

  const firstClassName = compactClassName(first.className);
  return (
    firstClassName.includes("relative") &&
    (firstClassName.includes("h-") || firstClassName.includes("w-") || first.querySelector(".clip-path-chevron")) &&
    hasDirectLabelArt(first)
  );
}

function extractHero(hero) {
  const image = hero.querySelector("img");
  const title = hero.querySelector("h3");
  const subtitle = hero.querySelector("p");

  return {
    className: compactClassName(hero.className),
    image: image?.getAttribute("src")?.replace(/^(?:\.\.\/)?/, "") ?? "",
    imageClassName: compactClassName(image?.className),
    titleWrapperClassName: compactClassName(title?.parentElement?.className),
    titleClassName: compactClassName(title?.className),
    titleHtml: title?.innerHTML.trim() ?? "",
    subtitleWrapperClassName: compactClassName(subtitle?.parentElement?.className),
    subtitleClassName: compactClassName(subtitle?.className),
    subtitleHtml: subtitle?.innerHTML.trim() ?? "",
  };
}

function extractBlocks(main) {
  const children = [...main.children];
  const blocks = [];

  for (let index = 0; index < children.length; index += 1) {
    const element = children[index];
    if (isSectionLabel(element)) {
      const body = children[index + 1] && !isSectionLabel(children[index + 1]) ? children[index + 1] : null;
      blocks.push({
        type: "section",
        labelHtml: outerHtml(element),
        bodyHtml: outerHtml(body),
      });
      if (body) index += 1;
    } else {
      blocks.push({
        type: "raw",
        html: outerHtml(element),
      });
    }
  }

  return blocks;
}

function extractPage(filePath) {
  const dom = new JSDOM(`<body>${readMainContent(filePath)}</body>`);
  const children = [...dom.window.document.body.children];
  const heroIndex = children.findIndex(isHero);
  const hero = children[heroIndex];
  const mainResult = hero ? findMainElement(children, heroIndex) : null;
  const main = mainResult?.element;

  if (!hero || !main) {
    throw new Error(`Unable to extract block page structure from ${path.relative(root, filePath)}`);
  }

  const mainHost = mainResult.host;
  const mainIndex = children.indexOf(mainHost);
  let afterHeroHtml = children.slice(heroIndex + 1, mainIndex).map(outerHtml).join("");

  if (mainHost !== main) {
    const hostClone = mainHost.cloneNode(true);
    const nestedMain = [...hostClone.querySelectorAll("div")].find((element) => compactClassName(element.className) === compactClassName(main.className));
    nestedMain?.remove();
    const remainingHtml = innerHtml(hostClone);
    if (remainingHtml) {
      afterHeroHtml += outerHtml(hostClone);
    }
  }

  return {
    hero: extractHero(hero),
    afterHeroHtml,
    mainClassName: compactClassName(main.className),
    blocks: extractBlocks(main),
  };
}

function normalizeEnglishRootLifeLabels(page, data) {
  const blocks = data.en?.blocks;
  if (!blocks) return data;

  if (page === "life_dorm") {
    for (const block of blocks) {
      if (block.html?.includes("BUTTON-10-5_subtitle.png")) {
        block.html = block.html
          .replace(/<div class="h-10 relative[^"]*shrink-0">/, '<div class="h-10 relative w-64 shrink-0">')
          .replace(/class="h-full(?: w-[^"]+)?"/, 'class="h-full w-64"')
          .replace(/<span class="text-white italic text-lg">/, '<span class="whitespace-nowrap text-white italic text-lg">');
      }

      if (block.labelHtml?.includes("Student Dormitory Application")) {
        block.labelHtml = block.labelHtml
          .replace('<div class="h-10 relative">', '<div class="h-10 relative w-80 max-w-full">')
          .replace('class="h-full"', 'class="h-full w-full"')
          .replace('<div class="absolute top-1 left-6 text-white italic text-lg">', '<div class="absolute top-1 left-6 whitespace-nowrap text-white italic text-lg">');
      }
    }
  }

  if (page === "life_insurance") {
    for (const block of blocks) {
      if (!block.labelHtml) continue;

      if (block.labelHtml.includes("National Health Insurance")) {
        block.labelHtml = block.labelHtml
          .replace('<div class="h-10 relative w-36 flex-shrink-0">', '<div class="h-10 relative w-80 flex-shrink-0">')
          .replace('class="h-full"', 'class="h-full w-full"')
          .replace('<div class="absolute top-1 left-4 text-white italic text-lg">', '<div class="absolute top-1 left-4 whitespace-nowrap text-white italic text-lg">');
      }

      if (block.labelHtml.includes("Comprehensive Insurance for Foreigners")) {
        block.labelHtml = block.labelHtml
          .replace('<div class="h-10 relative">', '<div class="h-10 relative w-[460px] max-w-full flex-shrink-0">')
          .replace('class="h-full"', 'class="h-full w-full"')
          .replace('<div class="absolute top-1 left-7 text-white italic text-lg">', '<div class="absolute top-1 left-7 whitespace-nowrap text-white italic text-lg">');
      }
    }
  }

  if (page === "life_visa") {
    for (const block of blocks) {
      if (!block.labelHtml?.includes("BUTTON-11_subtitle.png")) continue;
      block.labelHtml = block.labelHtml
        .replace('<div class="h-10 relative">', '<div class="h-10 relative w-[480px] max-w-full">')
        .replace('class="h-full"', 'class="h-full w-full"')
        .replace('<div class="absolute top-1 left-7 text-white italic text-lg">', '<div class="absolute top-1 left-7 whitespace-nowrap text-white italic text-lg">');
    }
  }

  return data;
}

function readMainContent(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const start = html.indexOf(markerStart);
  const end = html.indexOf(markerEnd, start);
  if (start === -1 || end === -1) {
    throw new Error(`Missing content markers in ${path.relative(root, filePath)}`);
  }
  return html.slice(start + markerStart.length, end).trim();
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
  for (const page of pages) {
    if (scope === "staging" && page === "course_advance") continue;

    const data = {};
    for (const locale of locales) {
      const filePath = legacyPagePath(scope, locale, `${page}.html`);
      if (fs.existsSync(filePath)) {
        data[locale] = extractPage(filePath);
      }
    }

    if (scope === "root") {
      normalizeEnglishRootLifeLabels(page, data);
    }

    const outputPath = path.join(dataRoot, scope, `${page}.json`);
    await fsp.mkdir(path.dirname(outputPath), { recursive: true });
    await fsp.writeFile(outputPath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
    console.log(`Wrote ${path.relative(root, outputPath)}`);
  }
}
