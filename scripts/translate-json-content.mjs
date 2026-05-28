import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = process.cwd();
const dataRoot = path.join(root, "src", "_data");
const cachePath = path.join(root, "scripts", ".cache", "generatedTranslationCache.json");

const targets = {
  en: "en",
  cn: "zh-CN",
  tw: "zh-TW",
  ko: "ko",
  vi: "vi",
  th: "th",
  id: "id",
  np: "ne",
};

const kanaPattern = /[ぁ-ゖァ-ヺー]/;
const htmlPattern = /<\/?[a-z][\s\S]*>/i;

const skipExact = new Set([
  "",
  "A1",
  "A2",
  "B1",
  "B2",
  "N4",
  "N5",
  "EJU",
  "JLPT",
  "PDF",
  "pdf",
  "TEL",
  "FAX",
  "SNS",
  "LINE",
  "Facebook",
  "WeChat",
  "Teams",
  "Skype",
  "HOME",
  "PICK UP",
  "愛知国際学院",
]);

const structuralKeys = new Set([
  "bodyClass",
  "cardClass",
  "carouselId",
  "className",
  "colClasses",
  "contentClass",
  "contentType",
  "file",
  "heroImage",
  "image",
  "imageClassName",
  "labelClass",
  "labelWidth",
  "labelWrapClass",
  "leadClass",
  "mainClassName",
  "newsContainerId",
  "outputPath",
  "rowClass",
  "subtitleClassName",
  "subtitleWrapperClassName",
  "template",
  "titleClass",
  "titleClassName",
  "titleWrapperClassName",
  "topicImage",
  "type",
]);

const translatableAttributes = ["alt", "aria-label", "placeholder", "title"];

function isStructuralKey(key) {
  return structuralKeys.has(key) || /(?:Class|ClassName)$/.test(key);
}

const manualTranslations = {
  tw: {
    学生保険: "學生保險",
    "国民健康保険 / 外国人向け総合保険": "國民健康保險 / 外籍人士綜合保險",
    国民健康保険: "國民健康保險",
    外国人向け総合保険: "外籍人士綜合保險",
    安心して勉強できる環境づくり: "打造能安心學習的環境",
    事故でも安心: "遇到意外時也能安心",
    "詳しい情報はこちら →": "詳細資訊請看這裡 →",
    "学生が安心に勉強できる環境作り事故、死亡、障害、病気などの高額費用負担を保障軽減するため、学生全員、国民健康保険及び保険加入します":
      "為了讓學生能在安心的環境中學習，並減輕事故、死亡、傷害、疾病等可能造成的高額費用負擔，所有學生皆須加入國民健康保險及相關保險。",
    "国民健康保険は日本国民健康保険法に基づいて、日本在住国民および外国人定住者を対象とした、全民医療保険制度です。":
      "國民健康保險是依據日本國民健康保險法設立，提供給居住在日本的國民及外國居民加入的全民醫療保險制度。",
    "保険料の支払いについては、収入によって違いますが、外国人留学生の初年度は約月2000円の保険料を払います。その後収入によって増減することがあります。":
      "保險費會依收入而有所不同，外國留學生第一年度大約每月需繳納 2,000 日圓，之後可能會依收入狀況調整。",
    "一般的には医療費個人負担は３割で、低所得者が高額の医療費が必要となる場合、月35400円を上限として、不足分の全額は国が負担します。":
      "一般情況下，醫療費個人負擔為三成。低收入者如需支付高額醫療費，每月個人負擔上限為 35,400 日圓，超出部分由國家負擔。",
  },
  cn: {
    学生保険: "学生保险",
    "国民健康保険 / 外国人向け総合保険": "国民健康保险 / 面向外国人的综合保险",
    国民健康保険: "国民健康保险",
    外国人向け総合保険: "面向外国人的综合保险",
    安心して勉強できる環境づくり: "营造安心学习的环境",
    事故でも安心: "遇到意外也能安心",
    "詳しい情報はこちら →": "详细信息请看这里 →",
  },
  en: {
    学生保険: "Student Insurance",
    "国民健康保険 / 外国人向け総合保険": "National Health Insurance / Comprehensive Insurance for Foreign Residents",
    国民健康保険: "National Health Insurance",
    外国人向け総合保険: "Comprehensive Insurance for Foreign Residents",
    安心して勉強できる環境づくり: "Creating an environment where students can study with peace of mind",
    事故でも安心: "Peace of mind in case of accidents",
    "詳しい情報はこちら →": "More information here →",
  },
};

function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function cacheLookup(cache, locale, text) {
  return cache[locale]?.[text] || cache[locale]?.[normalizeText(text)];
}

function cacheStore(cache, locale, source, translated) {
  cache[locale] ||= {};
  cache[locale][normalizeText(source)] = translated;
}

function shouldSkip(text) {
  const normalized = normalizeText(text);
  if (skipExact.has(normalized)) return true;
  if (isStructuralText(normalized)) return true;
  if (/^[\d\s:./()\-+〒¥￥,，、。・~〜&]+$/.test(normalized)) return true;
  if (/^https?:\/\//.test(normalized)) return true;
  return false;
}

function isStructuralText(text) {
  const normalized = normalizeText(text);
  if (!normalized) return true;
  if (/^(?:\.\.\/)?(?:images|photos|files)\//.test(normalized)) return true;
  if (/\.(?:jpe?g|png|gif|webp|svg|pdf|css|js|ico)(?:[?#].*)?$/i.test(normalized)) return true;
  if (/[{};]/.test(normalized) && /\b(?:position|display|width|height|background|transform|z-index|content|absolute|relative)\b/.test(normalized)) return true;
  if (
    /\s/.test(normalized) &&
    /\b(?:flex|grid|relative|absolute|mx-auto|object-cover|object-center|text-|bg-|w-|h-|p-|m-|top-|left-|right-|rounded|shadow|border)\b/.test(normalized)
  ) {
    return true;
  }
  return false;
}

function isTranslatableTextNode(node) {
  const parent = node.parentElement;
  if (!parent) return false;
  return !parent.closest("script, style, noscript, template");
}

function textNodesFromHtml(html) {
  const dom = new JSDOM(`<main>${html}</main>`);
  const walker = dom.window.document.createTreeWalker(
    dom.window.document.querySelector("main"),
    dom.window.NodeFilter.SHOW_TEXT
  );
  const texts = [];
  while (walker.nextNode()) {
    if (!isTranslatableTextNode(walker.currentNode)) continue;
    const value = normalizeText(walker.currentNode.nodeValue || "");
    if (value) texts.push(value);
  }
  return texts;
}

function collectReferenceTexts(value, texts = new Set(), key = "") {
  if (isStructuralKey(key)) return texts;

  if (typeof value === "string") {
    if (htmlPattern.test(value)) {
      for (const text of textNodesFromHtml(value)) texts.add(text);
    } else {
      const normalized = normalizeText(value);
      if (normalized) texts.add(normalized);
    }
  } else if (Array.isArray(value)) {
    for (const item of value) collectReferenceTexts(item, texts, key);
  } else if (value && typeof value === "object") {
    for (const [childKey, item] of Object.entries(value)) collectReferenceTexts(item, texts, childKey);
  }
  return texts;
}

function shouldTranslate(text, referenceTexts) {
  const normalized = normalizeText(text);
  if (shouldSkip(normalized)) return false;
  return kanaPattern.test(normalized) || referenceTexts.has(normalized) || Boolean(manualTranslations.tw[normalized]);
}

async function translateText(text, locale, cache) {
  const normalized = normalizeText(text);
  if (manualTranslations[locale]?.[normalized]) return manualTranslations[locale][normalized];
  const cached = cacheLookup(cache, locale, normalized);
  if (cached) return cached;

  const target = targets[locale];
  if (!target) return text;

  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", "ja");
  url.searchParams.set("tl", target);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", normalized);

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      const translated = data[0].map((item) => item[0]).join("").trim();
      cacheStore(cache, locale, normalized, translated || normalized);
      await new Promise((resolve) => setTimeout(resolve, 35));
      return translated || normalized;
    } catch (error) {
      if (attempt === 4) {
        console.warn(`translate skipped (${locale}): ${normalized} (${error.message})`);
        return text;
      }
      await new Promise((resolve) => setTimeout(resolve, 300 * attempt));
    }
  }
  return text;
}

async function translateHtml(html, locale, referenceTexts, cache, stats) {
  const dom = new JSDOM(`<main>${html}</main>`);
  const rootElement = dom.window.document.querySelector("main");
  const walker = dom.window.document.createTreeWalker(rootElement, dom.window.NodeFilter.SHOW_TEXT);
  const nodes = [];

  while (walker.nextNode()) {
    if (isTranslatableTextNode(walker.currentNode)) nodes.push(walker.currentNode);
  }

  for (const node of nodes) {
    const original = node.nodeValue || "";
    const normalized = normalizeText(original);
    if (!shouldTranslate(normalized, referenceTexts)) continue;
    const translated = await translateText(normalized, locale, cache);
    if (translated !== normalized) stats.changed += 1;
    const leading = original.match(/^\s*/)?.[0] || "";
    const trailing = original.match(/\s*$/)?.[0] || "";
    node.nodeValue = `${leading}${translated}${trailing}`;
  }

  for (const element of rootElement.querySelectorAll("*")) {
    for (const attribute of translatableAttributes) {
      const original = element.getAttribute(attribute);
      const normalized = normalizeText(original || "");
      if (!shouldTranslate(normalized, referenceTexts)) continue;
      const translated = await translateText(normalized, locale, cache);
      if (translated !== normalized) stats.changed += 1;
      element.setAttribute(attribute, translated);
    }
  }

  return rootElement.innerHTML;
}

async function translateValue(value, locale, referenceTexts, cache, stats, key = "") {
  if (isStructuralKey(key)) return value;

  if (typeof value === "string") {
    if (htmlPattern.test(value)) return translateHtml(value, locale, referenceTexts, cache, stats);
    const normalized = normalizeText(value);
    if (shouldTranslate(normalized, referenceTexts)) {
      const translated = await translateText(normalized, locale, cache);
      if (translated !== value) stats.changed += 1;
      return translated;
    }
    return value;
  }

  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      value[index] = await translateValue(value[index], locale, referenceTexts, cache, stats, key);
    }
    return value;
  }

  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      value[key] = await translateValue(value[key], locale, referenceTexts, cache, stats, key);
    }
  }
  return value;
}

async function translatePageFile(filePath, cache) {
  const data = JSON.parse(await fs.readFile(filePath, "utf8"));
  const stats = { changed: 0 };
  if (!data.ja) return 0;

  const referenceTexts = collectReferenceTexts(data.ja);
  for (const locale of Object.keys(targets)) {
    if (!data[locale]) continue;
    data[locale] = await translateValue(data[locale], locale, referenceTexts, cache, stats);
  }

  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  return stats.changed;
}

async function translateScopedPages(cache) {
  let changes = 0;
  for (const scope of ["root", "staging"]) {
    const scopePath = path.join(dataRoot, scope);
    const entries = await fs.readdir(scopePath, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith(".json") || entry.name === "index.json") continue;
      changes += await translatePageFile(path.join(scopePath, entry.name), cache);
    }
  }
  return changes;
}

function cleanCache(cache) {
  let removed = 0;
  for (const locale of Object.keys(cache)) {
    for (const [key, value] of Object.entries(cache[locale] || {})) {
      if (isStructuralText(key) || isStructuralText(String(value ?? ""))) {
        delete cache[locale][key];
        removed += 1;
      }
    }
  }
  return removed;
}

async function main() {
  const cache = JSON.parse(await fs.readFile(cachePath, "utf8").catch(() => "{}"));
  const removedCacheEntries = cleanCache(cache);
  const pageChanges = await translateScopedPages(cache);
  await fs.mkdir(path.dirname(cachePath), { recursive: true });
  await fs.writeFile(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
  console.log(`Translated JSON text nodes: pages=${pageChanges}, removedCacheEntries=${removedCacheEntries}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
