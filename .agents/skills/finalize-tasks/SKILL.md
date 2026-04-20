---
name: finalize-tasks
description: Prepares a feature for review (clean worktree, resolve conflicts, create PR).
---

# Workflow

You are running the `finalize-tasks` skill. Execute this workflow end to end:

1. **Collect context**
   a. Ask for the task or issue if it is not known.
   b. Read the relevant `tasks-[prd-file-name].md` file in `docs/tasks/` to understand the plan.
   c. Confirm that every checkbox for the current task is `[x]`. If not, stop and tell the user to finish implementation first.
   d. Run `git worktree list` and identify entries whose branch name or path relates to the current task. Ask the user for clarification if multiple branches are ambiguous.

2. **Prepare each worktree**
   a. For every identified worktree path, change into it.
   b. Run `git status` to ensure there are no unstaged changes left behind. If there are, include them or ask the user how to proceed.
   c. Fetch the latest `origin/development` (or the documented base branch) and rebase or merge so the feature branch is up to date. Example: `git fetch origin` followed by `git merge origin/development`.
   d. If merge conflicts appear, attempt to resolve them yourself by editing the conflicted files and committing the fix. If you cannot resolve automatically, pause and ask the user for guidance.

3. **Verify readiness**
   a. Stage any adjustments required by conflict resolution and, if new commits are made, ensure the commit messages follow the existing convention.
   b. Update the `tasks-[prd-file-name].md` file to note that the branch is ready for PR creation and include a short list of the worktree paths used.

4. **Create or update pull requests**
   a. For every branch, check whether a GitHub PR already exists using `gh pr list --head <branch>`.
   b. If a PR exists, open it in edit mode and ensure the base is `development` and the title references the feature.
   c. If no PR exists, run `gh pr create --base development --head <branch> --title "<concise title>" --body "<summary>"`.
   d. Record the resulting PR URL along with the branch name.

5. **Surface results back to the Tasks file**
   a. Update the `tasks-[prd-file-name].md` file with a link to the PR or summarize that the work has been finalized and linking the PRs.

6. **Seek merge approval**
   a. Present the user with the list of PRs, highlight any outstanding checks, and explicitly ask whether to merge.
   b. Only proceed with merges when the user responds with an affirmative signal ("merge", "yes", "go", etc.). If they decline or add blocking feedback, pause and await instructions.

7. **Merge when approved**
   a. For each PR approved by the user, run `gh pr merge <url> --merge --delete-branch=false` (or the project’s preferred merge strategy) once required checks are green.
   b. If a merge fails, surface the error, resolve conflicts if possible, rerun tests, and retry. If it still fails, halt and ask the user how to proceed.
   c. After merging, confirm whether the remote branch should be deleted; follow existing repo policy (typically keep the branch until cleanup is confirmed).

8. **Report to the user**
   a. Summarize which worktrees were processed, whether conflicts occurred (and how they were resolved), test commands executed, PR URLs, and merge status.
   b. Note any follow-up actions still needed (manual QA, post-merge verification, status updates) so the user knows the finish line is crossed.

**Important notes:**
- do not leave worktrees dirty
- ensure the `docs/tasks/` files remain the single source of truth
- never skip conflict resolution or testing steps before creating PRs
