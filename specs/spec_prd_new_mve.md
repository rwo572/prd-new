## Annotated Prototype PRD (Minimum Viable Epic)

- **Title**: 
- **Author(s)**: 
- **Stakeholders**: Product, Design, Eng, Data/Analytics, QA, Support, Security
- **Status**: Draft
- **Last updated**: 

### TL;DR
- **Problem**: What user problem are we solving and why now?
- **Outcome**: Measurable behavior change we expect.
- **Approach**: Ship a clickable prototype with annotations that function as the PRD.

### Problem & Context
- **Background**: Business context, prior art, constraints.
- **Who is affected**: Personas, segments, volumes.
- **Today**: Current workflow, pain points, baseline metrics.
- **Constraints**: Legal, compliance, platform limits, performance budgets.

### Goals and Non‑Goals
- **Goals**:
  - 
- **Non‑Goals**: (explicitly out of scope)
  - 

### Users and Jobs to Be Done
- **Personas**: 
- **Top JTBD**: When I … I want to … so I can …

### Success Metrics
- **Primary metric**: e.g., task completion rate, activation, conversion.
- **Guardrails**: Error rate, latency, NPS/CSAT.
- **North‑star hypothesis**: If we ship X, Y moves by Z%.

---

## Prototype Map
- **Prototype link**: `[Figma/Framer link]`
- **Version**: 
- **Export/snapshot**: 
- **Password (if any)**: 
- **Screen inventory**:
  - S1: Name — purpose
  - S2: Name — purpose
  - S3: Name — purpose

> The prototype is the source of truth for flows. This doc annotates every hotspot/pin with behavior, states, data, and acceptance criteria.

### Prototype Version Control
- **Goal**: Make prototypes reproducible, reviewable, and traceable to code, ACs, and experiments.

#### Strategy Template
- Version ID: `proto-{epic}-{semver}+{YYYYMMDD}` (e.g., `proto-create-project-1.2+2025-01-15`)
- Artifacts: PNG/PDF exports, JSON export, Scenario DSL, manifest
- Review: open a "Prototype PR" with diffs; require Product/Design/Eng approvals
- Traceability: manifest links AC IDs → pins → tests → analytics events
- Rollback: maintain last 3 minor versions; restore by manifest

#### Repo Layout (suggested)
```
prototype_snapshots/
  proto-create-project-1.2+2025-01-15/
    frames/*.png
    prototype.json
    scenarios/*.yml
    prototype.manifest.json
```

#### Implementation Notes
- Figma API export script (Node): export by file key and node IDs; write `prototype.json`
- Manifest fields: `figma_file_key`, `branch`, `commit_sha`, `screens[]`, `pins[]`, `acs[]`, `tests[]`
- CI: validate that referenced pins/ACs exist; block merges if missing



#### Chosen Strategy — Git‑backed Snapshots
- Versioning: `proto-{epic}-{semver}+{YYYYMMDD}` stored under `prototype_snapshots/`
- Artifacts committed:
  - `frames/*.png` (key frames)
  - `prototype.json` (Figma API export: nodes, components, ids)
  - `scenarios/*.yml` (Scenario DSL)
  - `prototype.manifest.json` (traceability map)

Manifest schema (minimum)
```
{
  "$schema": "https://example.com/schemas/prototype.manifest.schema.json",
  "version_id": "proto-create-project-1.2+20250115",
  "figma": { "file_key": "<FILE_KEY>", "branch": "epic/create-project", "exported_at": "2025-01-15T12:34:56Z" },
  "screens": [
    { "id": "S1", "name": "Create Project", "frame": "frame_123.png" }
  ],
  "pins": [
    { "screen_id": "S1", "pin_id": "P1", "area": "Name input field", "ac_ids": ["AC-CP-001", "AC-CP-004"], "test_ids": ["E2E-CP-01"] }
  ],
  "acs": [
    { "id": "AC-CP-001", "gwt": "Given name > 60 chars ...", "status": "approved" }
  ],
  "tests": [
    { "id": "E2E-CP-01", "scenario": "create_project_happy_path", "last_run": "2025-01-15T13:00:00Z", "status": "passed" }
  ],
  "analytics": [
    { "event": "Project_Create_Submitted", "properties": ["name_length", "visibility"] }
  ]
}
```

Export workflow
- Prereqs: Figma token in env `FIGMA_TOKEN`; file key; node ids for frames.
- Commands (example):
```
mkdir -p prototype_snapshots/proto-create-project-1.2+20250115/frames

curl -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/files/<FILE_KEY>" \
  -o prototype_snapshots/proto-create-project-1.2+20250115/prototype.json

curl -H "X-Figma-Token: $FIGMA_TOKEN" \
  "https://api.figma.com/v1/images/<FILE_KEY>?ids=<NODE_IDS>&format=png&scale=2" \
  -o prototype_snapshots/proto-create-project-1.2+20250115/frames/index.json

# Write scenarios/*.yml and prototype.manifest.json as part of the PR
```

CI validation
- Lint `prototype.manifest.json` against schema
- Verify that all AC IDs referenced by pins exist, and vice versa
- Check that each scenario references valid screen/pin names
- On product code PRs, require latest manifest version id to be referenced

Review process
- Open a "Prototype Snapshot PR" with rendered diffs of frames and JSON
- Require approvals from Product, Design, Eng; link to ACs and tests
- Tag release with `proto-...` for traceability

---

## Screen Specs (Annotated)

For each screen, copy this section and fill it out.

### S{n}: Screen Name
- **Purpose**: 
- **Entry points**: 
- **Exit points**: 
- **Primary flow**: 
- **Alternate paths**: 

#### Interactive Hotspots (Pins)
List every annotation pin from the prototype. One row per interactive region.

- **Pin 1**
  - Area: 
  - Trigger/Interaction: 
  - Expected Result: 
  - Data rules: (validation, transforms, limits)
  - Backend calls: (endpoint, method, payload)
  - Copy: (exact strings, placeholders, error text)
  - Tracking: (event name, properties)

- **Pin 2**
  - Area: 
  - Trigger/Interaction: 
  - Expected Result: 
  - Data rules: 
  - Backend calls: 
  - Copy: 
  - Tracking: 

#### States
- Default
- Loading
- Empty
- Error (enumerate each error case and its copy)
- Success/Confirmation

#### Validation Rules
- Field‑level: 
- Form‑level: 

#### Accessibility
- Keyboard: full tab order, shortcuts, focus management
- Screen readers: labels, roles, announcements
- Contrast/visuals: meets WCAG 2.1 AA

#### Performance
- Time to interactive: target/budget
- Network: max calls, payload size, caching strategy

#### Analytics & Events
- Event(s): Name, when fired, properties, example payload
- Funnels: which steps are included

#### Acceptance Criteria (Behavioral)
Write as scenarios that are testable.

- Given/When/Then #1: 
- Given/When/Then #2: 
- Edge cases: 

##### How to translate AC → Annotations
- Map each AC to: `Pin` + `Trigger` + `Expected Result` + `State/Copy` + `Tracking`.
- If AC implies data rules, add them under the relevant pin’s `Data rules`.
- If AC implies API behavior, specify the exact endpoint and error codes in `Backend calls`.
- If AC implies UI state change, capture it under `States` with conditions.
- If AC implies analytics, add an explicit event with example payload under `Tracking` and the Analytics section.

#### Test Cases
- Manual checklist
- Automation candidates

#### Open Questions
- 

---

## Data Model & API Contracts
- **New/updated entities**: names, ownership, retention
- **Schemas**: fields, types, nullability, constraints
- **Permissions**: who can create/read/update/delete
- **API Endpoints**:
  - Path, method, auth, rate limits
  - Request example (JSON)
  - Response example (JSON)
  - Errors and HTTP codes

---

## Instrumentation Plan
- Event catalogue, property dictionary
- ID strategy (user/session/device), deduplication
- QA plan (how to verify in staging and prod)

---

## AI‑Native Simulation
- **Purpose**: Use synthetic agents to exercise the prototype and system end‑to‑end, before and after code ships, similar to agent‑driven behavior simulation platforms like [Featurely](https://featurely.ai/).

### Persona Schema
- Fields: `id`, `name`, `segment`, `goals`, `frustrations`, `expertise_level`, `devices`, `constraints`, `tone`, `risk_profile`.
- Data sources: research, analytics cohorts, support tags.
- Storage: versioned JSON with retention policy and PII minimization.

Example
```
{
  "id": "pwr_user_pm",
  "name": "Power User PM",
  "segment": "pro_team",
  "goals": ["create projects quickly", "keep workspace tidy"],
  "frustrations": ["slow UI", "naming collisions"],
  "expertise_level": "advanced",
  "devices": ["desktop"],
  "constraints": ["time_boxed_5m"],
  "tone": "decisive",
  "risk_profile": "low"
}
```

### Scenario DSL
- Minimal, readable steps that map to prototype pins or live UI actions.
- Primitives: `navigate`, `click`, `type`, `select`, `assert`, `wait`, `emit_event`.

Example
```
scenario: create_project_happy_path
persona: pwr_user_pm
steps:
  - navigate: "Dashboard"
  - click: "New Project Button"
  - type: { target: "Project Name Input", value: "Q1 Roadmap" }
  - select: { target: "Visibility", value: "private" }
  - click: "Create Button"
  - assert: { navigated_to: "/projects/*" }
  - assert: { event_fired: "Project_Create_Succeeded" }
```

### Agent Harness
- Deterministic mode for CI, stochastic mode for exploratory fuzzing.
- Integrations: prototype driver (Figma/Framer), web driver (Playwright), API client.
- Observability: capture screenshots, DOM snapshots, network traces, event logs.

### Autograding Rubric
- Types: functional correctness, UX heuristics, a11y, performance budgets, analytics coverage.
- Output: score 0–100 with rubric breakdown and actionable diffs to ACs.

Example
```
rubric: create_project
checks:
  - id: name_validation
    description: Name length and character set enforced
    weight: 0.2
  - id: dupe_check
    description: Duplicate names blocked with clear inline error
    weight: 0.2
  - id: a11y_modal
    description: Focus trap and ESC behavior
    weight: 0.2
  - id: perf_p95
    description: POST completes < 500ms p95
    weight: 0.2
  - id: analytics
    description: Submitted/Succeeded/Failed events with properties
    weight: 0.2
```

### Synthetic Traffic Plan
- Volumes: per‑persona per‑scenario daily runs.
- Environments: prototype, staging, production (read‑only, guardrails).
- Scheduling: nightly CI and pre‑merge checks; canary during rollout.

### Privacy, Safety, Governance
- PII redaction in logs; use synthetic data only.
- Rate limits, robots, and feature flags to prevent abuse.
- Review process for new personas and scenarios.

---

## Rollout & Experiment Plan
- Phasing, flags, audiences
- A/B or multivariate details
- Migration/backfill steps
- Support/comms plan

---

## Risks & Mitigations
- 

## Dependencies
- Design assets, backend services, 3rd‑party vendors, legal reviews

## Non‑Functional Requirements
- Reliability, security, privacy, localization, observability

---

## Definition of Done
- Prototype and annotations reviewed by Product, Design, Eng
- Copy reviewed and localized
- A11y checks meet WCAG 2.1 AA
- Tracking spec implemented and validated
- APIs deployed, contracts documented
- Playbooks updated (support, on‑call)
- Monitors/alerts in place

## Review Checklist
- Product: goals, non‑goals, metrics
- Design: flows, states, content, a11y
- Eng: feasibility, performance, data, contracts
- Data: events, schemas, QA plan
- QA: test cases, automation, environments
- Security/Privacy: data handling, permissions

## Change Log
- Date — What changed — Who

---

## Worked Example: "Create Project" Flow (Annotated)

Use this example as a reference for fidelity and level of detail expected.

### S1: Create Project (Modal)
- **Purpose**: Let users create a new project with a name and visibility.
- **Entry points**: Dashboard "New Project" button; keyboard shortcut `N`.
- **Exit points**: "Create" (success → S2), "Cancel" (dismiss), outside click (dismiss with confirmation if dirty).
- **Primary flow**: User enters name, selects visibility, clicks Create.
- **Alternate paths**: Invalid name, duplicate name, network error.

#### Interactive Hotspots (Pins)
- **Pin 1**
  - Area: Name input field
  - Trigger/Interaction: User types; blur triggers validation
  - Expected Result: Shows real‑time remaining characters; on blur validates uniqueness via API
  - Data rules: 1–60 chars, allowed: letters, numbers, spaces, dashes; trim leading/trailing spaces
  - Backend calls: GET `/api/projects/exists?name={encoded}`
  - Copy: Placeholder "Project name"; error "Name is already taken"
  - Tracking: `ProjectName_Changed` { length }

- **Pin 2**
  - Area: Visibility radio group (Private/Public)
  - Trigger/Interaction: Select option
  - Expected Result: Updates helper text; defaults to Private
  - Data rules: Must be one of {private, public}
  - Backend calls: none
  - Copy: Helper text for each option
  - Tracking: `ProjectVisibility_Changed` { value }

- **Pin 3**
  - Area: Create button
  - Trigger/Interaction: Click
  - Expected Result: Validates form; POST to create; on success close modal and navigate to Project Overview
  - Data rules: Requires valid name and visibility
  - Backend calls: POST `/api/projects` body `{ name, visibility }`
  - Copy: Button "Create"
  - Tracking: `Project_Create_Submitted` { name_length, visibility }

- **Pin 4**
  - Area: Cancel button / dismiss
  - Trigger/Interaction: Click or outside click
  - Expected Result: If form dirty, show confirm dialog; else close
  - Data rules: "dirty" = any field changed from default
  - Backend calls: none
  - Copy: "Discard changes?"
  - Tracking: `Project_Create_Cancelled` { dirty }

#### States
- Default: inputs enabled, Create disabled until valid
- Loading: Create shows spinner, inputs disabled during POST
- Empty: name empty
- Error: inline for validation; toast for network/server errors
- Success: modal closes; navigate to `/projects/{id}`

#### Validation Rules
- Name: 1–60 chars after trim; regex `^[A-Za-z0-9 \-]+$`
- Duplicate: API "exists" must be false

#### Accessibility
- Focus trap inside modal; ESC closes when not loading
- Labels associated to inputs; live region for validation errors
- Radio group accessible via arrow keys

#### Performance
- POST response < 500ms p95 in same region
- Uniqueness check debounced at 300ms; cache negative results 60s

#### Analytics & Events
- `Project_Create_Viewed` when modal opens
- `Project_Create_Submitted` with properties { name_length, visibility }
- `Project_Create_Succeeded` { project_id }
- `Project_Create_Failed` { reason }

#### Acceptance Criteria (Behavioral)
- Given the modal is open and the name is empty, When the user types a 61‑character name, Then the input shows an error and the Create button remains disabled.
- Given a valid name and Private selected, When the user clicks Create, Then a POST is sent to `/api/projects` and on 201 the modal closes and navigation goes to the new project page.
- Given the form is dirty, When the user presses ESC, Then a confirmation dialog appears; choosing "Discard" closes the modal.
- Given the network returns 409 for duplicate, When the user blurs the name field, Then inline error "Name is already taken" is shown and Create is disabled.

#### Test Cases
- Valid create path (happy path)
- Duplicate name returns 409 on POST → shows toast and keeps modal open
- Connectivity loss during POST → retry surface, Create re‑enabled

### API Contracts (Example)
- POST `/api/projects`
  - Request
```
{ "name": "My Project", "visibility": "private" }
```
  - Response 201
```
{ "id": "prj_123", "name": "My Project", "visibility": "private", "created_at": "2025-01-01T00:00:00Z" }
```
  - Errors
    - 400 invalid_request
    - 409 duplicate_name

### Tracking (Example)
- `Project_Create_Submitted`
```
{ "name_length": 10, "visibility": "private", "user_id": "u_456", "session_id": "s_789" }
```

### AC → Annotation Mapping (Worked)
- AC: Given the modal is open and the name is empty, When the user types a 61‑character name, Then the input shows an error and the Create button remains disabled.
  - Pin: Name input field
  - Trigger: Type > 60 chars; on blur validate
  - Expected Result: Inline error copy; Create disabled
  - Data rules: 1–60 chars; regex `^[A-Za-z0-9 \\-]+$`
  - States: Error state visible; controls disabled
  - Tracking: `ProjectName_Changed` { length }, optional `Validation_Error` { field: "name", reason: "too_long" }

- AC: Given a valid name and Private selected, When Create is clicked, Then POST `/api/projects` and on 201 close and navigate.
  - Pin: Create button
  - Trigger: Click
  - Backend calls: POST `/api/projects` body `{ name, visibility }`, expect 201
  - Expected Result: Modal closes; navigate `/projects/{id}`
  - States: Loading during POST; Success on 201
  - Tracking: `Project_Create_Submitted`, `Project_Create_Succeeded`

- AC: Given the form is dirty, When ESC is pressed, Then confirmation dialog appears; Discard closes modal.
  - Pin: Modal chrome / ESC
  - Trigger: Key `Escape`
  - Expected Result: Confirm dialog; Discard → close, Cancel → return
  - Data rules: dirty = any field changed
  - Copy: "Discard changes?"
  - Tracking: `Project_Create_Cancelled` { dirty: true }

- AC: Given duplicate name, When blur occurs, Then inline error "Name is already taken" and Create disabled.
  - Pin: Name input field
  - Trigger: Blur
  - Backend calls: GET `/api/projects/exists?name={encoded}`; 200 `{ exists: true }`
  - Expected Result: Inline error; Create disabled
  - States: Error
  - Copy: "Name is already taken"
  - Tracking: `Validation_Error` { field: "name", reason: "duplicate" }

### AI Simulation (Worked Scenario)
- Persona: `pwr_user_pm`
- Scenario: `create_project_happy_path` (see DSL example)
- Harness: run in prototype mode against S1 modal pins; repeat in staging with Playwright.
- Autograde: apply `create_project` rubric; target score ≥ 90.
- Synthetic traffic: 100 runs/night, stochastic noise ±10% typing speed, 2% packet loss simulation.

---

End of template.

