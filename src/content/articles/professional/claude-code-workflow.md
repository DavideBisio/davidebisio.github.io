---
title: "Building claude-code-workflow"
description: "A Claude Code plugin that turns a repeatable dev process into four gated skills backed by swappable, mock-or-real MCP providers."
pubDate: 2026-10-17
category: professional
tags: ["ai", "claude-code", "workflows"]
---

[`DavideBisio/claude-code-workflow`](https://github.com/DavideBisio/claude-code-workflow) is a Claude Code plugin marketplace. It bundles one plugin, `workflow`, which defines `git-dev`: a four-step dev process — target an issue, plan a test-first fix, execute it, update the tracker — implemented as gated Claude Code skills. Each skill reads and writes a committed `git-dev.data/` folder in the target project, asks for confirmation before acting, and stops rather than guesses when something's missing or conflicting.

The trackers (version control, requirements) are MCP-shaped providers selected per project: a mock backend by default, or a real one that shells out to the `gh` CLI against an actual GitHub repo. Skills never hardcode which provider is active — they resolve it at runtime, so the same skill text drives a no-op mock run or a real PR/issue without changes.

## Why I'm building this

I work on AI workflow development, and this is an example project to try new things out in that space: gated multi-step skills, a provider abstraction that lets the same workflow run against sample data or a live repo, and an end-to-end harness that drives the skills through the real `claude` CLI instead of just unit-testing the Python underneath.

## What I wish to do

- A development companion that walks a process end to end instead of answering one prompt at a time
- Automate the repetitive parts of that process (branching, test-first fix, tracker updates) while keeping a human gate before anything real happens
- Make workflow completion verifiable — state recorded in `git-dev.data/state.json`, not just assumed
- Keep the AI pointed at the project's own conventions (`project-prompt.md`) rather than generic behavior
- Swap in real backends (GitHub issues/PRs) without touching the skills themselves

## What I did

Built the `git-dev` workflow: four ordered skills (`target`, `plan`, `execute`, `update`) plus an orchestrator (`git-dev-run`) and three on-demand skills for creating issues, requirements, and test records. Backed it with two mock MCP servers (requirements tracker, version control) and two real ones that wrap the `gh` CLI, all behind the same provider contract (`list_*`, `get_*`, `create_*`/`update_*`). Wrote a generic e2e harness (`harness.py`) that builds a throwaway git fixture, drives each skill through `claude -p`, and checks both generic outcomes (did it error, did it touch git correctly) and workflow-specific goals. The whole thing was built in one day (27 commits), largely by using early versions of the workflow to build the later parts of itself.

## Todo

Real items from the open backlog, not a generic list:

- **Stop committing regenerated tracker data** ([#19](https://github.com/DavideBisio/claude-code-workflow/issues/19)): `git-dev.data/tracker/*.json` is just a snapshot of the real source of truth, yet it's read in full into the LLM's context and re-committed on every fetch — 8 of 28 commits so far are just that churn. Planned fix is a `handoff-manager.py` that scopes fetches to one issue at a time and keeps only validated, ephemeral handoff files.
- **Update tests and mocks to match** ([#20](https://github.com/DavideBisio/claude-code-workflow/issues/20)), once #19 lands — unit tests, the e2e harness, and the mock providers all currently assume the committed-snapshot shape.
- **Decide whether to add a subagent layer** ([#18](https://github.com/DavideBisio/claude-code-workflow/issues/18)): a frozen design doc weighing skills-only (today) against spawning subagents for the heaviest step (`execute`'s test/fix/retry loop) or an independent reviewer before `update`. Leaning toward adding agents selectively, opt-in, never allowed to push or open a real PR/issue without a gate.
- **Let the provider backends be pluggable from outside the plugin** ([#17](https://github.com/DavideBisio/claude-code-workflow/issues/17)): today a tracker must live inside the plugin's own `mcp/` tree; the proposal adds a `providers:` block in `config.yaml` so an external tracker (Jira, Linear, an internal system) can be wired in without forking.
- **Do the prior-art comparison properly** ([#21](https://github.com/DavideBisio/claude-code-workflow/issues/21)): the README's current survey is shallow (repo search plus a few README skims). The follow-up is to actually read the closest matches' code and harvest reusable ideas — gate design, guard hooks, reviewer independence, change-impact from a diff.

## Pros and cons, so far

**Pros**

- Clean separation between process (skills), data access (providers), and state (`git-dev.data/`) — swapping mock for real GitHub only means changing `config.yaml`
- Every step gates on user confirmation and refuses to push, stash, or guess at missing data — safe to point at a real repo
- There's an actual e2e harness driving the real `claude` CLI, not just mocked unit tests of the Python helpers
- Workflow state survives across sessions because `git-dev.data/` is committed, not scratch

**Cons**

- Only tested headlessly via the CLI harness — never yet run interactively inside Claude Code, so skill auto-invocation and the real UX are unverified
- The `github-*` providers are the ones that take real actions (open issues/PRs) but have the thinnest test coverage — unit tests only, no e2e
- Only one workflow (`git-dev`) exists, so whether the "gated skills + pluggable providers" pattern generalizes is still a one-example hypothesis
- Some manual setup still required outside the tool (e.g. creating the `req`/`test`/`dev` GitHub labels by hand before the real provider works)
