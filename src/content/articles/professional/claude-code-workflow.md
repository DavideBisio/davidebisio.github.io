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

<div class="not-prose my-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
  <div class="rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/20 text-xs font-bold text-crimson dark:text-amber">1</span>
      <span class="font-semibold">End-to-end companion</span>
    </div>
    <p class="mt-2 text-sm text-slate-base/70 dark:text-offwhite/70">Walks a process end to end instead of answering one prompt at a time.</p>
  </div>
  <div class="rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/20 text-xs font-bold text-crimson dark:text-amber">2</span>
      <span class="font-semibold">Automate the repetitive parts</span>
    </div>
    <p class="mt-2 text-sm text-slate-base/70 dark:text-offwhite/70">Branching, test-first fix, tracker updates — while keeping a human gate before anything real happens.</p>
  </div>
  <div class="rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/20 text-xs font-bold text-crimson dark:text-amber">3</span>
      <span class="font-semibold">Verifiable completion</span>
    </div>
    <p class="mt-2 text-sm text-slate-base/70 dark:text-offwhite/70">State recorded in <code>git-dev.data/state.json</code>, not just assumed.</p>
  </div>
  <div class="rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/20 text-xs font-bold text-crimson dark:text-amber">4</span>
      <span class="font-semibold">Project-specific conventions</span>
    </div>
    <p class="mt-2 text-sm text-slate-base/70 dark:text-offwhite/70">Keeps the AI pointed at the project's own conventions (<code>project-prompt.md</code>) rather than generic behavior.</p>
  </div>
  <div class="rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4 sm:col-span-2">
    <div class="flex items-center gap-2">
      <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber/20 text-xs font-bold text-crimson dark:text-amber">5</span>
      <span class="font-semibold">Swappable real backends</span>
    </div>
    <p class="mt-2 text-sm text-slate-base/70 dark:text-offwhite/70">GitHub issues/PRs can be swapped in without touching the skills themselves.</p>
  </div>
</div>

## What I did

Built the `git-dev` workflow: four ordered skills (`target`, `plan`, `execute`, `update`) plus an orchestrator (`git-dev-run`) and three on-demand skills for creating issues, requirements, and test records. Backed it with two mock MCP servers (requirements tracker, version control) and two real ones that wrap the `gh` CLI, all behind the same provider contract (`list_*`, `get_*`, `create_*`/`update_*`). Wrote a generic e2e harness (`harness.py`) that builds a throwaway git fixture, drives each skill through `claude -p`, and checks both generic outcomes (did it error, did it touch git correctly) and workflow-specific goals. The whole thing was built in one day (27 commits), largely by using early versions of the workflow to build the later parts of itself.

<div class="not-prose my-6 overflow-x-auto rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-5 font-mono text-sm leading-relaxed">
  <div class="font-semibold">workflow <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">(plugin)</span></div>
  <ul class="mt-1 ml-1 list-none border-l border-slate-base/15 dark:border-offwhite/15 pl-4">
    <li>
      skills/
      <ul class="mt-1 mb-2 ml-1 list-none border-l border-slate-base/15 dark:border-offwhite/15 pl-4">
        <li><code>git-dev-run</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— orchestrator</span></li>
        <li><code>git-dev-target</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— step 1</span></li>
        <li><code>git-dev-plan</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— step 2</span></li>
        <li><code>git-dev-execute</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— step 3</span></li>
        <li><code>git-dev-update</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— step 4</span></li>
        <li><code>git-dev-new-issue</code>, <code>git-dev-new-req</code>, <code>git-dev-new-test</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— on demand</span></li>
      </ul>
    </li>
    <li>
      mcp/
      <ul class="mt-1 mb-2 ml-1 list-none border-l border-slate-base/15 dark:border-offwhite/15 pl-4">
        <li><code>mock-version-control</code>, <code>mock-req-tracker</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— default</span></li>
        <li><code>github-version-control</code>, <code>github-req-tracker</code> <span class="font-sans text-xs text-slate-base/50 dark:text-offwhite/50">— real, via <code>gh</code></span></li>
      </ul>
    </li>
    <li>
      tests/
      <ul class="mt-1 ml-1 list-none border-l border-slate-base/15 dark:border-offwhite/15 pl-4">
        <li>unit — mocks + <code>git_dev_data.py</code></li>
        <li>e2e/ — <code>harness.py</code> + <code>testplan.py</code></li>
      </ul>
    </li>
  </ul>
</div>

<div class="not-prose my-6">
  <p class="mb-3 text-sm text-slate-base/60 dark:text-offwhite/60">The orchestrator (<code>git-dev-run</code>) walks these four in order:</p>
  <div class="flex flex-col sm:flex-row items-stretch gap-2">
    <div class="flex-1 rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
      <div class="text-xs font-semibold text-crimson dark:text-amber">1 · TARGET</div>
      <div class="mt-1 font-mono text-sm"><code>git-dev-target</code></div>
      <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">pick the issue + requirements</p>
    </div>
    <div class="flex items-center justify-center text-xl text-slate-base/40 dark:text-offwhite/40 rotate-90 sm:rotate-0" aria-hidden="true">→</div>
    <div class="flex-1 rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
      <div class="text-xs font-semibold text-crimson dark:text-amber">2 · PLAN</div>
      <div class="mt-1 font-mono text-sm"><code>git-dev-plan</code></div>
      <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">test-first fix, commit, tracker updates</p>
    </div>
    <div class="flex items-center justify-center text-xl text-slate-base/40 dark:text-offwhite/40 rotate-90 sm:rotate-0" aria-hidden="true">→</div>
    <div class="flex-1 rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
      <div class="text-xs font-semibold text-crimson dark:text-amber">3 · EXECUTE</div>
      <div class="mt-1 font-mono text-sm"><code>git-dev-execute</code></div>
      <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">branch, failing test, fix, passing test</p>
    </div>
    <div class="flex items-center justify-center text-xl text-slate-base/40 dark:text-offwhite/40 rotate-90 sm:rotate-0" aria-hidden="true">→</div>
    <div class="flex-1 rounded-lg border border-slate-base/10 dark:border-offwhite/10 bg-white dark:bg-dark-card p-4">
      <div class="text-xs font-semibold text-crimson dark:text-amber">4 · UPDATE</div>
      <div class="mt-1 font-mono text-sm"><code>git-dev-update</code></div>
      <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">coverage update, MR, commit <code>git-dev.data</code></p>
    </div>
  </div>
</div>

## Todo

Real items from the open backlog, not a generic list — split into what's currently broken or missing, and what's a planned addition on top of a working base:

<div class="not-prose my-6 grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <div class="mb-2 flex items-center gap-2 text-sm font-semibold text-crimson">
      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-crimson/15 text-xs">!</span>
      Known gaps
    </div>
    <div class="space-y-3">
      <div class="rounded-lg border-l-4 border-crimson bg-white dark:bg-dark-card p-4 shadow-sm">
        <div class="font-semibold">Stop committing regenerated tracker data <a href="https://github.com/DavideBisio/claude-code-workflow/issues/19" class="font-normal text-crimson dark:text-amber">#19</a></div>
        <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70"><code>git-dev.data/tracker/*.json</code> is a snapshot re-committed on every fetch — 8 of 28 commits so far are just that churn. Planned fix: a <code>handoff-manager.py</code> that scopes fetches to one issue at a time and keeps only validated, ephemeral handoff files.</p>
      </div>
      <div class="rounded-lg border-l-4 border-crimson bg-white dark:bg-dark-card p-4 shadow-sm">
        <div class="font-semibold">Tests and mocks still assume the old shape <a href="https://github.com/DavideBisio/claude-code-workflow/issues/20" class="font-normal text-crimson dark:text-amber">#20</a></div>
        <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">Unit tests, the e2e harness, and the mock providers all assume the committed-snapshot shape #19 is removing. Blocked until #19 lands.</p>
      </div>
      <div class="rounded-lg border-l-4 border-crimson bg-white dark:bg-dark-card p-4 shadow-sm">
        <div class="font-semibold">No reviewer / subagent layer yet <a href="https://github.com/DavideBisio/claude-code-workflow/issues/18" class="font-normal text-crimson dark:text-amber">#18</a></div>
        <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">Still a frozen design doc, not code: subagents for <code>execute</code>'s test/fix/retry loop, or an independent reviewer before <code>update</code>. Leaning opt-in, never allowed to push or open a real PR/issue without a gate.</p>
      </div>
    </div>
  </div>
  <div>
    <div class="mb-2 flex items-center gap-2 text-sm font-semibold text-teal">
      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-teal/15 text-xs">+</span>
      Planned additions
    </div>
    <div class="space-y-3">
      <div class="rounded-lg border-l-4 border-teal bg-white dark:bg-dark-card p-4 shadow-sm">
        <div class="font-semibold">Pluggable backends from outside the plugin <a href="https://github.com/DavideBisio/claude-code-workflow/issues/17" class="font-normal text-crimson dark:text-amber">#17</a></div>
        <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">Today a tracker must live inside the plugin's own <code>mcp/</code> tree. Proposal: a <code>providers:</code> block in <code>config.yaml</code> so an external tracker (Jira, Linear, an internal system) wires in without forking.</p>
      </div>
      <div class="rounded-lg border-l-4 border-teal bg-white dark:bg-dark-card p-4 shadow-sm">
        <div class="font-semibold">Do the prior-art comparison properly <a href="https://github.com/DavideBisio/claude-code-workflow/issues/21" class="font-normal text-crimson dark:text-amber">#21</a></div>
        <p class="mt-1 text-sm text-slate-base/70 dark:text-offwhite/70">Today's survey is shallow (repo search plus a few README skims). Follow-up: actually read the closest matches' code and harvest reusable ideas — gate design, guard hooks, reviewer independence, change-impact from a diff.</p>
      </div>
    </div>
  </div>
</div>

## How it stacks up against prior art

[#21](https://github.com/DavideBisio/claude-code-workflow/issues/21) names the closest comparable projects: [workkit](https://github.com/itw-creative-works/workkit) and [claude-software-factory](https://github.com/genai-jerry/claude-software-factory) (GitHub issues/labels as the single source of truth, bot identity, guard hooks, staging branch), [reqtrace-mcp](https://github.com/b4ked/reqtrace-mcp) (requirement-to-code-to-test traceability, an independent read-only verifier, stale sign-offs, change-impact from a diff), and [plumbline](https://github.com/dr-zog/plumbline) (requirement-to-code links enforced at build time). That comparison is explicitly a to-do, not finished — this is a first read, not a verdict.

**Where it differs so far**

- The tracker is a swappable provider, not a fixed backend: mock today, `gh`-CLI-backed GitHub next, and ([#17](https://github.com/DavideBisio/claude-code-workflow/issues/17)) any external system wired in via config. workkit and claude-software-factory, by contrast, treat GitHub issues/labels themselves as the one source of truth.
- Requirements, coverage, and version control are modeled as separate trackers (closer to an enterprise req-tracker shape, e.g. Jama) rather than collapsing everything into one issue tracker's labels.
- Every step — not just a few checkpoints — gates on explicit user confirmation before touching anything real.

**Where prior art is already ahead**

- reqtrace-mcp has a working independent verifier and stale-sign-off detection; this project's equivalent — a reviewer step before `update` — is still a design decision, not code ([#18](https://github.com/DavideBisio/claude-code-workflow/issues/18)).
- plumbline enforces requirement-to-code links at build time; here the link is just metadata in a commit message and a coverage record, nothing fails if it's missing or wrong.
- GitHub-issues-as-SSOT designs don't have a stale local cache to manage; this project still commits a redundant snapshot of the tracker on every run, which is exactly the churn [#19](https://github.com/DavideBisio/claude-code-workflow/issues/19) exists to remove.
