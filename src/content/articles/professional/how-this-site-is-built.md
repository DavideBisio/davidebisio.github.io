---
title: "How this site is built: Claude, GitHub and Astro"
description: "The workflow behind davidebisio.github.io: Claude Code on WSL and in the cloud, feature branches and PRs, Astro, and GitHub Actions deploying to GitHub Pages."
pubDate: 2026-10-06
category: professional
tags: ["astro", "github-actions", "claude-code", "workflow"]
---

This site is a small static project, and the way it gets from an idea to a live page is deliberately simple. This article describes the whole loop: where the work happens, why the site is built with Astro, and how GitHub Actions publishes it.

## The workflow at a glance

```text
 idea
  │
  ├─► Claude Code on WSL (local)  ──┐
  │                                 ├─► feature branch ─► pull request ─► merge to main
  └─► Claude Code in the cloud   ───┘                                          │
                                                                               ▼
                                                  GitHub Actions: build ─► deploy ─► github.io
```

Two ways of working on the same repository, one way of shipping it.

## Working with Claude

### Claude Code on WSL

The local setup runs on Windows with WSL. The repository lives on the **Linux filesystem**, not under `/mnt/c`, and uses a **Linux-native Node** rather than the Windows binaries that WSL puts on `PATH` by default. Windows `npm` cannot build native modules against files on the Linux side, so `setup.sh` installs Node into `~/.local/opt` (no `sudo`) and wires it into `~/.bashrc`. After that, `npm install` and `astro dev` behave like on any Linux machine.

Claude Code runs in that same WSL terminal. It can read the project, edit files, run the dev server (`astro dev --background`, managed with `astro dev stop|status|logs`) and run the build, so changes are checked against the real site before anything is committed. Project conventions live in `CLAUDE.md` / `AGENTS.md`, which Claude reads at the start of every session.

### Claude Code in the cloud

The same repository can also be opened in a cloud session connected to GitHub. The session gets a fresh, isolated clone, so there is nothing to install locally and it works from any device. It is well suited to self-contained tasks: add a page, tweak a layout, fix a build error. The session commits to a branch and pushes it to GitHub; nothing on my machine is involved.

### One rule for both: separate branches, PR at the end

Whichever environment is used, work never goes straight to `main`:

1. Create a dedicated branch for the change.
2. Commit in small, descriptive steps.
3. Push the branch.
4. Open a **pull request** when the work is complete, review the diff, and merge.

`main` is the deployed branch, so keeping it clean means the live site only changes when I decide it should.

## Why Astro

- **Content first, zero JavaScript by default.** Astro renders pages to plain HTML at build time. Articles and the CV need no client-side framework, so pages are fast and simple to host.
- **Content collections.** Articles (`professional` / `hobby`) and trips are Markdown/MDX files validated by a schema in `src/content.config.ts`. Writing a new article means adding one `.md` file with frontmatter; listing pages and routes follow automatically.
- **Islands for the interactive bits.** The few interactive pieces, such as the skills tree and the Leaflet maps for trips, are React components hydrated only where needed. Everything else stays static.
- **Build-time work.** GPX tracks and photo EXIF data are parsed during the build, so the browser never ships the parser. The CV page is also rendered to `cv.pdf` at the end of `npm run build`.
- **Static output suits GitHub Pages.** The result is a `dist/` folder of files, which is exactly what Pages serves. No server, no database, no running costs.
- **Tailwind CSS** handles styling, with the typography plugin for article prose.

The alternatives (a hand-written HTML site, or a heavier React framework) were either too manual for a growing content set, or more machinery than a personal site needs.

## GitHub Actions: build and deploy

The site is published by `.github/workflows/deploy.yml`. It runs on every push to `main` (and can be triggered manually with `workflow_dispatch`), in two jobs:

| Job      | What it does                                                                                           |
| :------- | :----------------------------------------------------------------------------------------------------- |
| `build`  | Checks out the repo, sets up Node 22 with npm caching, runs `npm ci` and `npm run build`, then uploads `./dist` as a Pages artifact |
| `deploy` | Waits for `build`, then publishes the artifact to the `github-pages` environment with `actions/deploy-pages` |

A few details worth noting:

- **Least privilege.** The workflow requests only `contents: read`, `pages: write` and `id-token: write`.
- **No overlapping deploys.** A `concurrency` group (`pages`) with `cancel-in-progress: false` queues deploys instead of killing one that is already publishing.
- **Pages source is "GitHub Actions".** In *Settings → Pages* the source is set to GitHub Actions, so there is no `gh-pages` branch to maintain.
- **A failed build never ships.** If `npm run build` fails (a schema error in frontmatter, a broken import), the deploy job does not run and the previous version stays live.

## Putting it together

Adding this very page followed the loop above: ask Claude for the page, let it work on a feature branch, review the diff in a pull request, merge to `main`, and let GitHub Actions build and publish it to `davidebisio.github.io` a minute or two later.
