const i18n = require("./src/_data/i18n");
const fs = require("node:fs");
const path = require("node:path");

function getByPath(source, key) {
  return key.split(".").reduce((value, part) => value?.[part], source);
}

const pageTitleSources = {
  index: ["nav", "news"],
  about_business: ["nav", "business"],
  about_facility: ["nav", "facility"],
  about_publish: ["nav", "publish"],
  message: ["nav", "message"],
  course_advance: ["nav", "advance"],
  course_junior: ["nav", "junior"],
  course_tour: ["nav", "tour"],
  course_lecture: ["nav", "lecture"],
  life_dorm: ["nav", "dorm"],
  life_insurance: ["nav", "insurance"],
  life_visa: ["nav", "visa"],
  books: ["nav", "books"],
  access: ["nav", "access"],
  sitemap: ["footer", "sitemap"],
  policy: ["footer", "policy"],
  privacy: ["footer", "privacy"]
};

const pageTitleFallbacks = {
  about_teacher: {
    ja: "教師陣",
    en: "Faculty",
    cn: "教师阵容",
    tw: "教師陣容",
    ko: "교사진",
    vi: "Đội ngũ giáo viên",
    th: "คณาจารย์",
    id: "Pengajar",
    np: "शिक्षक टोली"
  }
};

function getLocalePageTitle(pageKey, localeData) {
  const sourcePath = pageTitleSources[pageKey];
  const sourceTitle = sourcePath?.reduce((value, part) => value?.[part], localeData);
  if (sourceTitle) return sourceTitle;

  const locale = localeData?.code ?? "ja";
  const fallbackTitle = pageTitleFallbacks[pageKey];
  if (fallbackTitle) return fallbackTitle[locale] ?? fallbackTitle.ja;

  return "";
}

function stripHtmlBlankLines(content) {
  const rawBlocks = [];
  const placeholderPrefix = "___AIA_RAW_BLOCK_";
  const protectedContent = content.replace(
    /<(pre|textarea|script|style)\b[\s\S]*?<\/\1>/gi,
    (match) => {
      const token = `${placeholderPrefix}${rawBlocks.length}___`;
      rawBlocks.push(match);
      return token;
    }
  );

  const cleaned = protectedContent
    .split(/\r?\n/)
    .filter((line) => line.trim() !== "")
    .join("\n")
    .replace(new RegExp(`${placeholderPrefix}(\\d+)___`, "g"), (_, index) => rawBlocks[Number(index)] ?? "");

  return `${cleaned}\n`;
}

function indentBodyContent(content) {
  return content.replace(/(<body\b[^>]*>\n)([\s\S]*?)(\n<\/body>)/i, (_, openTag, bodyContent, closeTag) => {
    const indentedBody = bodyContent
      .split("\n")
      .map((line) => (line.trim() ? `  ${line}` : line))
      .join("\n");

    return `${openTag}${indentedBody}${closeTag}`;
  });
}

function formatHtmlOutput(content) {
  return indentBodyContent(stripHtmlBlankLines(content));
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addFilter("tr", function (key, locale = "ja", scope = "root") {
    const entry =
      getByPath(i18n, `${scope}.${key}`) ??
      getByPath(i18n, `common.${key}`) ??
      getByPath(i18n, key);

    if (!entry || typeof entry !== "object") return entry ?? "";
    return entry[locale] ?? entry.ja ?? "";
  });

  eleventyConfig.addFilter("assetUrls", function (value, assetPrefix = "") {
    return String(value ?? "").replaceAll("__ASSET_PREFIX__", assetPrefix ?? "");
  });

  eleventyConfig.addFilter("json", function (value) {
    return JSON.stringify(value ?? {});
  });

  eleventyConfig.addFilter("pageTitle", function (pageKey, localeData, siteTitle = "") {
    const pageTitle = getLocalePageTitle(pageKey, localeData);
    const baseTitle = siteTitle || "愛知国際学院";

    return pageTitle ? `${pageTitle} | ${baseTitle}` : baseTitle;
  });

  eleventyConfig.addTransform("formatHtmlOutput", function (content) {
    if (!this.page.outputPath?.endsWith(".html")) return content;
    return formatHtmlOutput(content);
  });

  const passthrough = {
    "_legacy_static/original/favicon.ico": "favicon.ico",
    "_legacy_static/original/files": "files",
    "_legacy_static/original/photos": "photos",
    "_legacy_static/original/images": "images",
    "_legacy_static/original/main.css": "main.css",
    "_legacy_static/original/gt.css": "gt.css",
    "_legacy_static/original/main.js": "main.js",
    "_legacy_static/original/parse.js": "parse.js",
    "_legacy_static/original/admin": "admin",
    "_legacy_static/original/CNAME": "CNAME",
    "_legacy_static/original/staging/favicon.ico": "staging/favicon.ico",
    "_legacy_static/original/staging/files": "staging/files",
    "_legacy_static/original/staging/photos": "staging/photos",
    "_legacy_static/original/staging/images": "staging/images",
    "_legacy_static/original/staging/main.css": "staging/main.css",
    "_legacy_static/original/staging/gt.css": "staging/gt.css",
    "_legacy_static/original/staging/main.js": "staging/main.js",
    "_legacy_static/original/staging/parse.js": "staging/parse.js",
    "_legacy_static/original/staging/admin": "staging/admin",
    "_legacy_static/original/staging/CNAME": "staging/CNAME",
    "_legacy_static/original/staging/tailwind.config.js": "staging/tailwind.config.js"
  };

  for (const [from, to] of Object.entries(passthrough)) {
    eleventyConfig.addPassthroughCopy({ [from]: to });
  }

  eleventyConfig.on("eleventy.after", function () {
    const menuSource = path.join(__dirname, "src/assets/menu.js");
    const siteSource = path.join(__dirname, "src/assets/site.js");
    const siteStyleSource = path.join(__dirname, "src/assets/site.css");
    const stagingDir = path.join(__dirname, "staging");

    fs.copyFileSync(menuSource, path.join(__dirname, "menu.js"));
    fs.copyFileSync(siteSource, path.join(__dirname, "site.js"));
    fs.copyFileSync(siteStyleSource, path.join(__dirname, "site.css"));
    fs.mkdirSync(stagingDir, { recursive: true });
    fs.copyFileSync(menuSource, path.join(stagingDir, "menu.js"));
    fs.copyFileSync(siteSource, path.join(stagingDir, "site.js"));
    fs.copyFileSync(siteStyleSource, path.join(stagingDir, "site.css"));
  });

  return {
    dir: {
      input: "src/pages",
      includes: "../_includes",
      data: "../_data",
      output: "."
    },
    htmlTemplateEngine: "njk",
    templateFormats: ["njk"]
  };
};
