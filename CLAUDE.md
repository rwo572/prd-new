# CLAUDE.md

Repository: 
Default branch: main

Project: prd-new

Conventions:

- Narrate your plan before you implement. Before coding, output a PLAN section with:
-- Goal & Constraints (perf, security, UX, compatibility).
-- Impacted areas (files, services, migrations).
-- Task breakdown (Step 1…N) with test plan.
-- Open questions (if any). If none, say “No open questions.” On approval, execute stepwise and keep a running CHANGELOG in the session.

- Use ccpm commands for PRD planning, task decomposition, and execution.
- Sync epics and tasks to GitHub Issues for collaboration and traceability.
- Prefer spec-driven development; avoid pure vibe coding.
- If ambiguous requirements, prefer smallest viable implementation that satisfies acceptance tests.
- If a decision has cross‑cutting impact, pause and output a short ADR (Architecture Decision Record) for approval before proceeding.

Execution rules:
- Search the repo for relevant code before proposing changes
- Narrate your plan, then request approval
- Ask once for destructive actions, then proceed for similar actions
- Use project scripts; keep logs concise
- Manage context: summarize when needed
- If blocked by missing env/secrets, scaffold `.env.example` and gate paths
Now draft the PLAN.