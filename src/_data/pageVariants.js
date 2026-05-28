const locales = require("./locales");
const sitePages = require("./sitePages");

const scopes = ["root", "staging"];

function outputHtmlPath(scope, locale, file) {
  const parts = [];
  if (scope === "staging") parts.push("staging");
  if (locale.code !== "ja") parts.push(locale.dir);
  parts.push(file);
  return parts.join("/");
}

function assetPrefix(locale) {
  return locale.code === "ja" ? "" : "../";
}

function languageLinks(scope, currentLocale, file) {
  const currentIsLocaleDir = currentLocale.code !== "ja";

  return locales.map((language) => ({
    label: language.label,
    code: language.code,
    href: (language.code === "ja"
      ? (currentIsLocaleDir ? "../" : "")
      : (currentIsLocaleDir ? `../${language.dir}/` : `${language.dir}/`)) + file
  }));
}

function templateFor(scope, page) {
  const template = page.templateByScope?.[scope] ?? page.template;
  if (!template) {
    throw new Error(`Missing template for ${scope}/${page.file}`);
  }
  return template;
}

module.exports = scopes.flatMap((scope) =>
  sitePages.flatMap((page) =>
    locales.map((locale) => ({
      scope,
      navVariant: scope === "staging" ? "staging" : "root",
      pageKey: page.key,
      file: page.file,
      outputPath: outputHtmlPath(scope, locale, page.file),
      assetPrefix: assetPrefix(locale),
      locale,
      languageLinks: languageLinks(scope, locale, page.file),
      appLayout: scope === "staging" ? "layouts/scopes/staging.njk" : "layouts/scopes/root.njk",
      template: templateFor(scope, page),
      newsTranslate: page.key === "index" && locale.code !== "ja"
    }))
  )
);
