---
name: "QA Review"
description: Review code implementation against the original user request. Checks requirements coverage, unintended side effects, and style consistency. Run after each coding session with /qa-review.
category: Quality
tags: [qa, review, requirements]
---

Review code changes against the most recent user request to verify correctness and completeness.

## Input

Optionally pass a summary of the original request: `/qa-review <request summary>`
If omitted, infer the request from conversation context (last user message before coding started).

## Steps

### 1. Gather context

Run these commands to understand what changed:

```bash
git diff HEAD~1 --name-only
git diff HEAD~1 -- "*.ts" "*.tsx" "*.js"
git log -1 --format="%s"
```

Extract from conversation context:
- **Original request**: the user's last coding request (what they asked Claude to build/fix)
- **Changed files**: from git diff output above

If no git diff exists (nothing committed), use:
```bash
git diff --name-only
git diff -- "*.ts" "*.tsx"
```

### 2. Launch 3 parallel review agents

Spawn all 3 agents simultaneously with Agent tool, each with a specific focus.
Pass each agent: (a) the original request text, (b) the list of changed files, (c) the full git diff.

**Agent 1 — Requirements Coverage**
> "You are a QA engineer. The user's original request was: [REQUEST].
> The following code was changed: [DIFF].
> Check: Does the implementation fully satisfy the request?
> For each requirement in the request, state DONE, PARTIAL, or MISSING.
> List any requirements that were NOT implemented.
> Be concise — bullet points only."

**Agent 2 — Scope & Side Effects**
> "You are a QA engineer. The user's original request was: [REQUEST].
> The following code was changed: [DIFF].
> Check: Did the implementation change anything the user did NOT ask for?
> Look for: removed features, changed behavior in unrelated screens, altered imports that affect other files, deleted code.
> List any unintended changes. If none, say CLEAN.
> Be concise — bullet points only."

**Agent 3 — Style & Convention**
> "You are a QA engineer reviewing a React Native / Expo app (Viloca).
> Project conventions: use colors.nomad.* palette, reuse Badge/EmptyState/ScreenWrapper/Card components from src/components/ui/, StyleSheet.create() for styles, no inline styles.
> The following code was changed: [DIFF].
> Check: Does the implementation follow project conventions?
> List any violations. If none, say CLEAN.
> Be concise — bullet points only."

### 3. Synthesize results

Determine overall verdict:
- **PASS** — all requirements done, no unintended changes, style clean
- **WARN** — requirements done but minor style issues or small scope creep
- **FAIL** — requirements missing or breaking changes found

### 4. Output QA report

Use exactly this format:

```
─────────────────────────────────
QA Review
─────────────────────────────────
Request: "<original request summary>"
Changed: <list of files>

Requirements Coverage
  ✅ <requirement 1>
  ✅ <requirement 2>
  ⚠️  <requirement partially done>
  ❌ <missing requirement>

Side Effects
  ✅ CLEAN  (or list of issues)

Style & Convention
  ✅ CLEAN  (or list of violations)

Verdict: PASS | WARN | FAIL
─────────────────────────────────
```

If verdict is WARN or FAIL, add a **Fix** section listing what needs to be done.

## Guardrails

- Do NOT modify any code during this review — read only
- If git diff is empty (no changes), say "No code changes detected since last commit"
- Focus only on the current request, not older history
- Keep each agent report to 5 bullet points max
- Do not re-review files that weren't changed
