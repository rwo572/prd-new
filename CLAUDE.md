# CLAUDE.md

Repository: 
Default branch: main

Project: prd-new

## Conventions:
- Narrate your plan before you implement. Before coding, output a PLAN section with:
-- Goal & Constraints (perf, security, UX, compatibility).
-- Impacted areas (files, services, migrations).
-- Task breakdown (Step 1…N) with test plan.
-- Open questions (if any). If none, say “No open questions.” On approval, execute stepwise and keep a running CHANGELOG in the session.

<!-- - Use ccpm commands for PRD planning, task decomposition, and execution.
- Sync epics and tasks to GitHub Issues for collaboration and traceability.
- Prefer spec-driven development; avoid pure vibe coding.
- If ambiguous requirements, prefer smallest viable implementation that satisfies acceptance tests.
- If a decision has cross‑cutting impact, pause and output a short ADR (Architecture Decision Record) for approval before proceeding. -->

## Execution rules:
- Search the repo for relevant code before proposing changes
- Narrate your plan, then request approval
- Ask once for destructive actions, then proceed for similar actions
- Use project scripts; keep logs concise
- Manage context: summarize when needed
- If blocked by missing env/secrets, scaffold `.env.example` and gate paths
- Visual changes: Always show before/after comparison
- New libraries: Provide maintenance status (last update, weekly downloads, GitHub stars)
- Component creation: Check if similar component exists first
- Style modifications: Reference design system or get approval
- AI features: Include fallback for API failures
- Dependencies: Run `npm audit` after adding new packages
- Git commits: Use conventional commits (feat:, fix:, refactor:, style:, docs:)

## Session Management
- Start each session by reviewing recent changes
- Before major refactors, create a rollback point
- Document decisions in ADR format for future context
- Update README.md with new features/patterns introduced

## Visual Design Adherence
- NEVER modify visual design without explicit approval
- Preserve all existing:
  - Color schemes (reference design tokens if available)
  - Typography (font families, sizes, weights)
  - Spacing (margins, padding, gaps)
  - Component styling and animations
  - Layout structures
- When implementing new UI: Request design specs FIRST, don't improvise
- If design specs are ambiguous, implement minimal viable version and flag for review

## Technology Stack Rules
- DEFAULT to these best-in-class libraries:
  - React 18+ with TypeScript
  - Next.js 14+ (App Router)
  - Tailwind CSS for styling (no arbitrary values without justification)
  - Radix UI / shadcn/ui for accessible components
  - React Hook Form + Zod for forms
  - TanStack Query for data fetching
  - Zustand for state management (avoid Redux unless existing)
  - OpenAI/Anthropic SDK for AI (no deprecated versions)
  
- FORBIDDEN patterns:
  - Class components (use functional only)
  - Direct DOM manipulation
  - Inline styles (use Tailwind classes)
  - Any library last updated >2 years ago
  - Custom implementations of solved problems (auth, forms, etc.)

## Code Quality Rules
- NO overengineering:
  - Start with simplest working solution
  - Add abstractions only when pattern repeats 3+ times
  - Prefer composition over inheritance
  - Avoid premature optimization
  
- Performance considerations:
  - Use React.memo only for expensive renders
  - Implement code splitting for routes
  - Lazy load heavy components
  - Optimize images (next/image, WebP format)

## AI Integration Rules
- Use streaming responses for better UX
- Implement proper error boundaries for AI failures
- Always show loading states during generation
- Cache AI responses when appropriate
- Use environment variables for API keys (never hardcode)
- Implement rate limiting and token usage monitoring

## File Organization
- Components: /components/[feature]/[ComponentName].tsx
- Hooks: /hooks/use[HookName].ts
- Utils: /lib/[category]/[utility].ts
- AI prompts: /prompts/[feature].ts
- Keep components <200 lines (extract sub-components if larger)

## Testing & Validation
- Write tests for:
  - AI prompt templates
  - Data transformations
  - Critical user paths
- Use Playwright for E2E tests involving AI
- Mock AI responses in tests (don't call real APIs)

## Before Making Changes
1. Check existing patterns in codebase
2. Verify design system compliance
3. Confirm library is actively maintained (check npm/GitHub)
4. If changing UI: screenshot before/after
5. If adding dependency: justify why existing tools insufficient