# AGENTS instructions

## General Instructions

- **Always read the PRD in the `/docs/prds/` folder** at the start of a new conversation to understand the project's architecture, goals, style, and constraints. The files have a pattern of `prd-<topic>.md`
- **Check the tasks in the `/docs/tasks/` folder** before starting a new task. If the task isn't listed, add it with a brief description and today's date. The files have a pattern of `tasks-[prd-file-name].md`
- **Check `CONTRIBUTING.md`** when working on tasks.
- **MCP:** Use the MCP `@mcp:context7` to retrieve up-to-date documentation and code examples for SDKs and frameworks.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fizing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Create a PRD in the `/docs/prds/` folder if it doesn't exist using the `create-prd` skill.
2. **Refine the Plan***: If a PRD exists, create a task list, if doesn't exist using the `create-tasks` skill.
2. **Verify Plan**: Check the PRD and task list before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to the task list you're working on in the `/docs/tasks/` folder
6. **Capture Lessons**: Create a learnings after any corrections, and after any changes using the `document-learnings` skill.

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimat Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Boundaries

- **Ask first**
  - Large cross-package refactors.
  - New dependencies with broad impact.
  - Destructive data or migration changes.
- **Never**
  - Commit secrets, credentials, or tokens.
  - Edit generated files by hand when a generation workflow exists.
  - Use destructive git operations unless explicitly requested.
