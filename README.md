# davidebisio.github.io

Personal site built with [Astro](https://astro.build), deployed to GitHub Pages.

## Structure

```text
src/
  content/articles/
    hobby/          # hobby articles (.md or .mdx)
    professional/   # professional articles (.md or .mdx)
  content.config.ts # article frontmatter schema
  data/cv.ts        # CV content: profile, experience, education, skills tree
  components/       # Header, Footer, ArticleList, SkillsTree (React island)
  layouts/          # Layout, ArticleLayout
  pages/
    index.astro
    cv/index.astro
    articles/index.astro          # all articles
    articles/[category]/index.astro # /articles/hobby/, /articles/professional/
    articles/[...slug].astro        # individual article page
```

## Commands

| Command           | Action                                                        |
| :----------------- | :------------------------------------------------------------ |
| `npm install`       | Install dependencies                                           |
| `npm run dev`       | Start local dev server at `localhost:4321`                     |
| `npm run build`     | Build the site to `./dist/`, then render `dist/cv.pdf`          |
| `npm run preview`   | Preview the production build locally                            |

## Adding an article

Add a `.md` or `.mdx` file under `src/content/articles/hobby/` or `src/content/articles/professional/` with frontmatter:

```yaml
---
title: "Article title"
description: "One-sentence summary."
pubDate: 2026-01-01
category: hobby # or professional
tags: ["optional", "tags"]
---
```

## Editing the CV

Edit `src/data/cv.ts`. The `/cv/` page and the downloadable PDF (`dist/cv.pdf`, generated at build time from that same page) both read from this file, so there's a single source of truth.

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. Enable Pages once in the repo settings: **Settings → Pages → Source → GitHub Actions**.
