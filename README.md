# davidebisio.github.io

Personal GitHub Pages site — a modular Jekyll build using the Modernist theme, optimized for SEO and automated via GitHub Actions.

## Repository Layout

| Path | Purpose |
|---|---|
| `/_articles/` | Evergreen technical articles (Jekyll Collection) |
| `/_posts/` | Chronological blog posts |
| `/_layouts/post.html` | Custom post layout (wraps Modernist's `default`) |
| `/_config.yml` | Central configuration, SEO, and layout defaults |
| `.github/workflows/jekyll.yml` | CI/CD: build on all branches, deploy from `master` |
| `index.md` | Home page |
| `articles.md` | Articles index (dynamically generated via Liquid) |
| `blog.md` | Blog index (dynamically generated via Liquid) |
| `404.md` | Custom 404 error page |
| `assets/img/logo.png` | Logo referenced in JSON-LD structured data by `jekyll-seo-tag` (SEO only, not rendered visually) |
| `assets/css/style.scss` | Loads Modernist theme CSS; add custom overrides here |

## Key Technical Decisions

- **Custom `layout: post`:** The Modernist theme only ships with `default.html`. A local `_layouts/post.html` was created to wrap it, adding date and author metadata for posts and articles.
- **Layout defaults via `_config.yml`:** Posts and articles automatically inherit `layout: post` through front matter defaults — no need to specify it in every file.
- **Dual content model:** `_posts/` for time-stamped blog entries, `_articles/` for evergreen documents with stable URLs (`/articles/:path/`).
- **SEO automation:** `jekyll-seo-tag` manages all metadata, the custom `sitemap.xml` covers pages, posts, and articles, and `robots.txt` is Liquid-templated for correctness.
- **Dynamic listing pages:** Both `blog.md` and `articles.md` use Liquid loops, so no manual updates are needed when adding content.

## How to Update

1. **Blog post:** Add a file to `_posts/` named `YYYY-MM-DD-title.md`. No `layout:` needed in front matter.
2. **Article:** Add a file to `_articles/` (no date in filename). No `layout:` needed.
3. **Deploy:** Push to `master`. GitHub Actions builds and deploys automatically. Pushing to `develop` triggers a build-only check (no deploy).

## Local Development

### Prerequisites

Install the required system packages once (WSL/Ubuntu):

```bash
sudo apt update
sudo apt install -y ruby-bundler ruby-dev build-essential
```

- `ruby-bundler` — provides the `bundle` command
- `ruby-dev` — C headers needed to compile native gem extensions
- `build-essential` — compiler toolchain (`gcc`, `make`, etc.)

### Setup

Gems are installed locally inside the project (no sudo required). On first setup, or after any `Gemfile` change:

```bash
bundle config set --local path 'vendor/bundle'
bundle install
```

Then start the local server:

```bash
bundle exec jekyll serve
```

Open `http://127.0.0.1:4000` in your browser.

> **Note:** `vendor/bundle/` and `Gemfile.lock` are excluded from version control (`.gitignore`). The CI pipeline runs `bundle install` on every build and resolves gems fresh from `Gemfile`.

## SEO Verification

After deployment, verify:

- `https://davidebisio.github.io/sitemap.xml`
- `https://davidebisio.github.io/robots.txt`
