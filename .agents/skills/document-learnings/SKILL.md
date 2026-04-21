---
name: document-learnings
description: Lightweight skill to capture solved problems and learnings into simple markdown files
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Bash
---

# document-learnings Skill

**Purpose:** A lightweight, frictionless way to automatically document solved problems, bug fixes, and new learnings into searchable markdown files.

## Overview

This skill captures learnings immediately after confirming a solution, creating simple, structured documentation that serves as a searchable knowledge base. All learnings are saved in a flat directory structure with basic YAML frontmatter.

---

## 3-Step Process

### Step 1: Gather Context

**Auto-invoke after phrases:**
- "that worked"
- "it's fixed"
- "problem solved"
- "good to know"

**OR manual:** `/learn` command

Extract the following from the conversation history:
1. **Topic/Symptom**: Brief description of the issue or the concept learned.
2. **Solution/Takeaway**: What was the fix or the key learning?

*If context is completely missing, briefly ask the user:*
"What was the key learning or fix you'd like to document?"
</step>

### Step 2: Create File

Generate a simple, sanitized filename: `docs/learnings/YYYY-MM-DD-[short-topic].md`

**Sanitization rules:**
- Lowercase
- Replace spaces with hyphens
- Truncate to reasonable length (< 50 chars)

Ensure the directory exists:
```bash
mkdir -p docs/learnings
```

Write the documentation file populated with the context gathered in Step 1. Use the following simple template:

```markdown
---
date: [YYYY-MM-DD]
topic: [Short Topic]
---

# [Topic/Symptom]

## The Problem / Context
[Clear description of the issue or what was being attempted]

## The Solution / Learning
[Explanation of how it was fixed or the key takeaway]
```
</step>

### Step 3: Confirm

Once the file is created, present a simple confirmation to the user:

```
✓ Learning documented!

Saved to: docs/learnings/[filename].md
```

Return control to the user. No complex decision menus or cross-referencing required.
</step>

</critical_sequence>

---

## Execution Guidelines

**MUST do:**
- Create the `docs/learnings/` directory before writing (`mkdir -p`).
- Ensure basic markdown formatting.
- Keep the generated documentation concise and to the point.

**MUST NOT do:**
- Block the user with strict schema validation.
- Ask for excessive details if the conversation history already contains the solution.
