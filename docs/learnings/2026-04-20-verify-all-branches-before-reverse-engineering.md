---
date: 2026-04-20
topic: Reverse-engineering from diverged branches
---

# Always verify all branches before reverse-engineering a PRD

## The Problem / Context

When reverse-engineering a PRD for the `gaforgithub` project, the initial analysis was done on the `development` branch, which was significantly behind the `master` branch. The `development` branch only had the upstream v2 code plus newly added agent config files, while `master` had 30+ additional commits including:

- Migration from `requestretry` to `axios` + `retry`
- The `ANONYMIZE_IP` bug fix (already wired up)
- Changed cookie behavior (always-track vs. deduplication)
- Azure Functions v3 / Node.js 14 (not v2 / Node 10)
- Multi-region deployment (Terraform + Traffic Manager across 4 regions)
- GitHub Actions CI/CD pipeline
- Custom domain (`ga4gh.datainsights.cloud`)

This led to a PRD that was factually incorrect in multiple sections, which had to be substantially rewritten after the branches were merged.

## The Solution / Learning

**Before reverse-engineering any existing project:**

1. **Check all branches** — run `git log --oneline` on every relevant branch and compare them with `git diff branch1..branch2 --stat`.
2. **Identify the "source of truth" branch** — ask which branch represents the deployed/production state.
3. **Merge or reconcile first** — if branches are diverged, reconcile them before writing documentation. It's much cheaper to merge first than to rewrite a PRD.
4. **Don't assume the current branch is canonical** — `HEAD` may point to a feature/dev branch that's behind production.
