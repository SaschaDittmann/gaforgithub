---
name: git-worktree
description: Manages Git worktrees for isolated parallel development. Creates branches (linking ticket IDs if available), copies .env files, and pushes changes to the remote.
---

# GitHub Worktree Workflow

You manage Git worktrees to allow isolated, parallel development. This skill ensures your development environment remains clean while maintaining ticket/issue trackers as the source of truth when applicable.

## Core Mandates

1. **Repository Root First**: Always operate from the repository root that contains `.git`. Many directories may be standalone repos, so `cd` into the correct one first.
2. **Issue Tracker is Truth**: Keep your issue tracker (like Jira, Linear, etc.) as the source of truth. Do NOT save separate local task files.
3. **Context Accuracy**: Always keep the "Relevant Files" section accurate and up to date in your context.
4. **Base Branch**: Every feature or bug branch MUST be based on the `development` branch. All PRs must target `development`.
5. **No Script Overkill**: Use standard Git commands to manage the worktree lifecycle.

## Step-by-Step Workflow

### 1. Initialize the Worktree Environment
Before starting new work, ensure the root directory is prepared for worktrees:

```bash
# From the repository root containing .git
mkdir -p worktrees
# Ensure worktrees/ is ignored in the git repository
grep -q "^worktrees/" .gitignore || echo "worktrees/" >> .gitignore
```

### 2. Create the Worktree
Use the `git worktree` command to create both the branch and its worktree. It is good practice to include the ticket ID in the branch name if one is available.

```bash
git fetch origin development
git worktree add worktrees/feature/<ticket-id> -b feature/<ticket-id> origin/development
```
*(Use `bug/<ticket-id>` if it is a bug fix instead of a feature).*

### 3. Copy Environment Files (CRITICAL)
Immediately after creating the worktree, copy all `.env` files from the main repository root into the new worktree so the application can run properly.

```bash
cp .env* worktrees/feature/<ticket-id>/ 2>/dev/null || true
```

### 4. Work and Iterate
Navigate into the newly created worktree and perform all development and testing there.

```bash
cd worktrees/feature/<ticket-id>
# Perform your file modifications, tests, builds, etc.
```

### 5. Commit and Push
Once the work is complete and tested, push the changes from inside the worktree.

```bash
git add .
git commit -m "feat: <description> (Resolves #<ticket-id>)"
git push -u origin feature/<ticket-id>
```

### 6. Finding Existing Worktrees
If you need to return to a worktree created previously (e.g., for a walkthrough or finalization):

```bash
# List all active worktrees
git worktree list
# Look for the path containing the ticket-id
cd worktrees/feature/<ticket-id>
```


