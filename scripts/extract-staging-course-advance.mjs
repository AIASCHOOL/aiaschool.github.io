import fs from "node:fs/promises";
import path from "node:path";
import { JSDOM } from "jsdom";

const root = process.cwd();
const legacyRoot = path.join(root, "_legacy_static", "original", "staging");
const outputPath = path.join(root, "src", "_data", "staging", "course_advance.json");
const markerStart = "<!-- menu end -->";
const markerEnd = "<!-- footer start -->";
const locales = ["ja", "en", "cn", "tw", "ko", "vi", "th", "id", "np"];

function normalizeHtml(html) {
  return html
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replaceAll('src="../images/', 'src="__ASSET_PREFIX__images/')
    .replaceAll('src="images/', 'src="__ASSET_PREFIX__images/');
}

function widthClass(className) {
  return className
    .split(/\s+/)
    .find((part) => part.startsWith("w-")) ?? "w-36";
}

function isSectionHeading(element) {
  return Boolean(element.querySelector(".clip-path-chevron"));
}

function sectionLabelElement(element) {
  return [...element.querySelectorAll(".clip-path-chevron + div")].at(-1);
}

function extractHeading(element) {
  const labelWrap = element.querySelector(".clip-path-chevron")?.parentElement ?? element;
  const label = sectionLabelElement(element);
  const classList = element.className.split(/\s+/);
  const isRow = classList.includes("flex");
  const lead = isRow
    ? [...element.children].find((child) => child !== labelWrap)
    : null;

  return {
    headingStyle: isRow ? "row" : "plain",
    label: label?.textContent.trim() ?? "",
    labelClass: label?.className ?? "absolute top-1 left-8 text-white italic text-lg",
    labelWidth: widthClass(labelWrap.className),
    lead: lead?.innerHTML.trim() ?? "",
    leadClass: lead?.className ?? ""
  };
}

function extractLabelHtml(row) {
  const labelWrap = row.querySelector(".relative.flex-shrink-0");
  return {
    labelWrapClass: labelWrap?.className ?? "relative flex-shrink-0",
    labelHtml: normalizeHtml(labelWrap?.innerHTML.trim() ?? "")
  };
}

function parseCourseSchedule(row) {
  const [, body] = [...row.children];
  const courseCards = [...body.querySelectorAll(".border.rounded-lg")];
  return {
    rowClass: row.className,
    ...extractLabelHtml(row),
    bodyClass: body?.className ?? "",
    courses: courseCards.map((card) => ({
      title: card.querySelector(".bg-\\[\\#009999\\]")?.textContent.trim() ?? "",
      cardClass: card.className,
      titleClass: card.querySelector(".bg-\\[\\#009999\\]")?.className ?? "bg-[#009999] text-white text-center py-2 font-bold",
      tables: [...card.querySelectorAll("table")].map(parseScheduleTable)
    }))
  };
}

function parseScheduleTable(table) {
  const rows = [...table.querySelectorAll("tr")];
  const levelHeadingCells = [...rows[0]?.querySelectorAll("th") ?? []];
  const dayHeadingCells = [...rows[1]?.querySelectorAll("th") ?? []];
  const dayCells = [...rows[2]?.querySelectorAll("th") ?? []];

  return {
    className: table.className,
    colClasses: [...table.querySelectorAll("col")].map((col) => col.className),
    levelLabel: levelHeadingCells[0]?.textContent.trim() ?? "",
    level: levelHeadingCells.at(-1)?.textContent.trim() ?? "",
    timeLabel: dayHeadingCells[0]?.textContent.trim() ?? "",
    dayLabel: dayHeadingCells.at(-1)?.textContent.trim() ?? "",
    days: dayCells.map((cell) => cell.textContent.trim()),
    rows: rows.slice(3).map((row) => {
      const cells = [...row.querySelectorAll("td")].map((cell) => cell.textContent.trim());
      return {
        period: cells[0] ?? "",
        time: cells[1] ?? "",
        subjects: cells.slice(2)
      };
    })
  };
}

function parseCourseOverview(html) {
  const dom = new JSDOM(`<main>${html}</main>`);
  const root = dom.window.document.querySelector("main");
  const rows = [...root.children].filter((child) => child.className.includes("flex"));
  const summaryRows = rows.slice(0, 2).map((row) => {
    const [, body] = [...row.children];
    return {
      rowClass: row.className,
      ...extractLabelHtml(row),
      bodyClass: body?.className ?? "",
      bodyHtml: normalizeHtml(body?.innerHTML.trim() ?? "")
    };
  });
  const classContentRow = rows[2];

  return {
    summaryRows,
    classContent: classContentRow ? parseCourseSchedule(classContentRow) : null
  };
}

function normalizeEnglishCourseOverview(data) {
  const overviewSection = data.en?.sections.find((section) => section.contentType === "courseOverview");
  const classContent = overviewSection?.courseOverview?.classContent;
  if (!classContent) return data;

  classContent.rowClass = "flex flex-col";
  classContent.bodyClass = classContent.bodyClass
    .replace(/\s*md:w-\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return data;
}

function extractPage(locale, html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const doc = dom.window.document;
  const main = doc.querySelector(".w-full.bg-\\[\\#FFFAEB\\] > div");
  const children = main ? [...main.children] : [];
  const sections = [];

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];
    if (!isSectionHeading(child)) continue;

    const section = extractHeading(child);
    const next = children[index + 1];
    if (next && !isSectionHeading(next)) {
      section.contentClass = next.className;
      if (section.label === "授業概要" || section.label === "Course Overview" || section.label === "授課概要") {
        section.contentType = "courseOverview";
        section.courseOverview = parseCourseOverview(next.innerHTML.trim());
      } else {
        section.contentHtml = normalizeHtml(next.innerHTML.trim());
      }
      index += 1;
    }
    sections.push(section);
  }

  return {
    marquee: doc.querySelector(".marquee li")?.textContent.trim() ?? "",
    heroTitle: doc.querySelector("h3")?.textContent.trim() ?? "",
    heroSubtitle: doc.querySelector(".absolute.top-16 p")?.textContent.trim() ?? "",
    sections
  };
}

const data = {};
for (const locale of locales) {
  const filePath = legacyPagePath(locale, "course_advance.html");
  const html = await readMainContent(filePath);
  data[locale] = extractPage(locale, html);
}

normalizeEnglishCourseOverview(data);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
await fs.writeFile(
  outputPath,
  `${JSON.stringify(data, null, 2)}\n`,
  "utf8"
);

console.log(`Wrote ${path.relative(root, outputPath)}`);

async function readMainContent(filePath) {
  const html = await fs.readFile(filePath, "utf8");
  const start = html.indexOf(markerStart);
  const end = html.indexOf(markerEnd, start);
  if (start === -1 || end === -1) {
    throw new Error(`Missing content markers in ${path.relative(root, filePath)}`);
  }
  return html.slice(start + markerStart.length, end).trim();
}

function legacyPagePath(locale, file) {
  return path.join(legacyRoot, locale === "ja" ? "" : locale, file);
}
