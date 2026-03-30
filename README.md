# davidebisio.github.io

Personal GitHub Pages site

This site is a modular Jekyll build using the Modernist theme, optimized for SEO and automated via GitHub Actions.

## Repository Layout
* `/_articles/`: Permanent technical articles (Collection).
* `/_posts/`: Chronological blog updates.
* `/_config.yml`: Central configuration and SEO settings.
* `.github/workflows/jekyll.yml`: The automation engine.
* `index.md`, `articles.md`, `blog.md`: Main site navigation and logic.

## Key Technical Decisions
* **Layout Reusability:** Both Blog posts and Articles use `layout: post` to maintain the Modernist theme's aesthetic without custom CSS.
* **SEO Automation:** `jekyll-seo-tag` manages all metadata. `jekyll-sitemap` handles indexing.
* **Source Control:** The site is served from the root of the `main` branch.

## How to Update
1. **To post a Blog entry:** Add a file to `_posts/` with the format `YYYY-MM-DD-title.md`.
2. **To post an Article:** Add a file to `_articles/` (no date required in filename).
3. **To Deploy:** Simply `git push` to the `main` branch. GitHub Actions will handle the rest.

## SEO Verification
After deployment, verify the following URLs:
* `https://davidebisio.github.io/sitemap.xml`
* `https://davidebisio.github.io/robots.txt`
