# AIA School Static Site

## Daily Editing

Edit files under `src`, then run:

```bash
npm run build
```

Generated HTML files in the project root, language folders, and `staging/` are build output. Do not edit those directly because they will be overwritten.

## Current Architecture

Every public page is generated through the single route entrypoint:

```txt
src/pages/routes.njk
```

That route applies the shared base layout, then chooses the root or staging app layout:

```txt
src/_includes/layouts/base.njk
src/_includes/layouts/scopes/root.njk
src/_includes/layouts/scopes/staging.njk
```

Header, footer, hero, section labels, document tables, and course schedule pieces are shared components:

```txt
src/_includes/components/
```

Root and staging intentionally stay as separate site scopes, but they use the same route system and shared component style.

## I18n And Content Data

Normal content editing now happens in JSON data files:

```txt
src/_data/homePages.json
src/_data/blockPages.json
src/_data/aboutPublish.json
src/_data/legalPages.json
src/_data/stagingCourseAdvance.json
src/_data/i18n.json
src/_data/navigation.json
src/_data/sitePages.json
src/_data/locales.json
```

Use `src/_data/i18n.json` for small shared UI labels and translation keys. Larger page content lives in the page-specific JSON files above.

The old per-locale HTML fragments are not kept under `src/_includes` anymore. Legacy refresh scripts read directly from `_legacy_static/original`, then regenerate the JSON files above.

## Page Templates

Page layout is centralized under:

```txt
src/_includes/templates/pages/
src/_includes/templates/staging/
```

Current page mapping:

```txt
index.html                    -> templates/pages/home.njk
about_business.html           -> templates/pages/block_page.njk
about_facility.html           -> templates/pages/block_page.njk
about_teacher.html            -> templates/pages/block_page.njk
access.html                   -> templates/pages/block_page.njk
message.html                  -> templates/pages/block_page.njk
course_advance.html           -> root: templates/pages/block_page.njk
staging/course_advance.html   -> templates/staging/course_advance.njk
course_junior.html            -> templates/pages/block_page.njk
course_tour.html              -> templates/pages/block_page.njk
course_lecture.html           -> templates/pages/block_page.njk
life_dorm.html                -> templates/pages/block_page.njk
life_insurance.html           -> templates/pages/block_page.njk
life_visa.html                -> templates/pages/block_page.njk
books.html                    -> templates/pages/block_page.njk
about_publish.html            -> templates/pages/about_publish.njk
sitemap.html                  -> templates/pages/sitemap.njk
policy.html, privacy.html     -> templates/pages/legal.njk
```

Only the homepage keeps the existing Google Translate news behavior. Inner pages should use prepared per-language content in JSON.

## Legacy Import

`_legacy_static/original` is kept as the old-site backup and import source. Only run this when you intentionally want to refresh from that backup:

```bash
npm run import:legacy
npm run build
```

`npm run import:legacy` reads `_legacy_static/original` and regenerates the JSON data. It can overwrite imported JSON, so use it intentionally.

For normal work, use `npm run build`.
