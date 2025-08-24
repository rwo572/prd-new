## PRD: Create Project Modal (Annotated Prototype — Markdown Only)

- **Author(s)**: 
- **Stakeholders**: Product, Design, Eng, Data, QA, Support, Security
- **Status**: Draft
- **Last updated**: 

### TL;DR
- **Problem**: Teams need a fast, error‑proof way to create projects without collisions.
- **Outcome**: Increase successful project creates and reduce retries due to duplicates.
- **Approach**: Markdown prototype with explicit pins/behaviors, AI simulation scenarios, and git‑backed snapshots.

### Problem & Context
- **Background**: Current flow is slow and error‑prone; duplicate names common in larger workspaces.
- **Who is affected**: Power users and admins creating multiple projects per week.
- **Today**: No real‑time validation; errors surface post‑submit; copy is inconsistent.
- **Constraints**: no Figma available; prototype is specified in this doc and executed via scenarios.

### Goals and Non‑Goals
- **Goals**
  - Ship a minimal, accessible create flow with strong validation and clear copy
  - Define analytics to measure completion and failures
  - Provide scenarios that can be automated against a stubbed backend
- **Non‑Goals**
  - Full workspace management, permissions UI, or templates

### Users and Jobs to Be Done
- **Persona**: Power User PM (advanced, time‑boxed, prefers keyboard)
- **JTBD**: When kicking off a new initiative, I want to create a project quickly without naming conflicts so I can keep velocity.

### Success Metrics
- **Primary**: Create completion rate; median time to create
- **Guardrails**: Validation error rate, duplicate error rate, p95 submit latency (< 500ms, stubbed)

---

## Prototype Map (Markdown Source of Truth)
- **Source**: This PRD is the canonical prototype; no Figma.
- **Screen inventory**
  - S1: Dashboard — entry point to modal
  - S2: Create Project Modal — name + visibility, create/cancel

### Prototype Version Control (Git‑backed Snapshots)
- **Version ID**: `proto-create-project-0.1+<YYYYMMDD>`
- **Artifacts committed**
  - `spec_prd_new_example.md` (this file)
  - `prototype_snapshots/proto-create-project-0.1+<date>/scenarios/*.yml`
  - `prototype_snapshots/proto-create-project-0.1+<date>/prototype.manifest.json`
- **Manifest (minimum)**
```
{
  "version_id": "proto-create-project-0.1+20250115",
  "screens": [
    { "id": "S1", "name": "Dashboard" },
    { "id": "S2", "name": "Create Project Modal" }
  ],
  "pins": [
    { "screen_id": "S1", "pin_id": "D1", "area": "New Project Button" },
    { "screen_id": "S2", "pin_id": "P1", "area": "Project Name Input" },
    { "screen_id": "S2", "pin_id": "P2", "area": "Visibility Radios" },
    { "screen_id": "S2", "pin_id": "P3", "area": "Create Button" },
    { "screen_id": "S2", "pin_id": "P4", "area": "Cancel/ESC" }
  ],
  "acs": [
    { "id": "AC-CP-001", "gwt": "Given name > 60 chars ..." }
  ],
  "analytics": [
    { "event": "Project_Create_Submitted", "properties": ["name_length", "visibility"] }
  ]
}
```

---

## Screen Specs (Annotated)

### S1: Dashboard
- **Purpose**: Provide entry to create a new project
- **Entry points**: App shell top bar
- **Exit points**: Open S2 on action
- **Primary flow**: Click New Project opens modal
- **Pin D1**
  - Area: New Project Button
  - Trigger/Interaction: Click
  - Expected Result: Open S2 modal; fire `Project_Create_Viewed`
  - Backend calls: none
  - Copy: Button label "New Project"
  - Tracking: `Project_Create_Viewed`

### S2: Create Project Modal
- **Purpose**: Let users create a project with a name and visibility
- **Entry points**: From S1
- **Exit points**: Create (success); Cancel/ESC (dismiss)
- **Primary flow**: Enter name → select visibility → Create
- **Alternate paths**: Invalid name; duplicate; network error

#### Interactive Hotspots (Pins)
- **P1 — Project Name Input**
  - Trigger/Interaction: Type; on blur validate
  - Expected Result: Show remaining characters; duplicate checked via API
  - Data rules: 1–60 chars; regex `^[A-Za-z0-9 \-]+$`; trim spaces
  - Backend calls: GET `/api/projects/exists?name={encoded}` → `{ exists: boolean }`
  - Copy: Placeholder "Project name"; error "Name is already taken"
  - Tracking: `ProjectName_Changed` { length }

- **P2 — Visibility Radios**
  - Trigger/Interaction: Select option
  - Expected Result: Defaults to Private; updates helper text
  - Data rules: one of {private, public}
  - Backend calls: none
  - Copy: Helper text for each option
  - Tracking: `ProjectVisibility_Changed` { value }

- **P3 — Create Button**
  - Trigger/Interaction: Click
  - Expected Result: Validate; POST create; close on success; navigate to overview
  - Data rules: valid name and visibility required
  - Backend calls: POST `/api/projects` body `{ name, visibility }` → 201
  - Copy: "Create"
  - Tracking: `Project_Create_Submitted` { name_length, visibility }, `Project_Create_Succeeded` { project_id }

- **P4 — Cancel/ESC**
  - Trigger/Interaction: Click or ESC key
  - Expected Result: If dirty, confirm; else dismiss
  - Data rules: dirty = any field changed
  - Backend calls: none
  - Copy: Dialog "Discard changes?"
  - Tracking: `Project_Create_Cancelled` { dirty }

#### States
- Default: inputs enabled; Create disabled until valid
- Loading: Create shows spinner; inputs disabled
- Empty: name empty
- Error: inline validation; toast for network/server errors
- Success: modal closes; navigate `/projects/{id}`

#### Validation Rules
- Name: 1–60 chars after trim; regex `^[A-Za-z0-9 \-]+$`
- Duplicate: GET exists must be false

#### Accessibility
- Focus trap; ESC closes when not loading
- Labels bound to inputs; live region for errors
- Radio group accessible via arrows

#### Performance
- p95 POST < 500ms (stub permitted)
- Debounce uniqueness check 300ms; cache negatives 60s

#### Analytics & Events
- `Project_Create_Viewed` when modal opens
- `Project_Create_Submitted` with { name_length, visibility }
- `Project_Create_Succeeded` { project_id }
- `Project_Create_Failed` { reason }

#### Acceptance Criteria (Behavioral)
- Given the modal is open and the name is empty, When the user types a 61‑character name, Then the input shows an error and the Create button remains disabled.
- Given a valid name and Private selected, When the user clicks Create, Then a POST is sent to `/api/projects` and on 201 the modal closes and navigation goes to the new project page.
- Given the form is dirty, When the user presses ESC, Then a confirmation dialog appears; choosing "Discard" closes the modal.
- Given the network returns 409 for duplicate, When the user blurs the name field, Then inline error "Name is already taken" is shown and Create is disabled.

##### AC → Annotation Mapping (Worked)
- AC: 61‑char name shows error; Create disabled → Pin P1; Trigger type>60/blur; Expected inline error; Data rules; State Error; Track `Validation_Error` { field: "name", reason: "too_long" }
- AC: Valid submit → Pin P3; Trigger click; Backend POST 201; Expected close+nav; State Loading/Success; Track Submitted/Succeeded
- AC: Dirty + ESC → Pin P4; Trigger ESC; Expected confirm; Data rule dirty; Copy "Discard changes?"; Track Cancelled { dirty: true }
- AC: Duplicate on blur → Pin P1; Trigger blur; Backend GET exists; Expected inline error; State Error; Track `Validation_Error` { field: "name", reason: "duplicate" }

#### Test Cases
- Happy path create
- Duplicate name on POST → stays open with toast
- Connectivity loss → retry surface; Create re‑enabled

---

## Data Model & API Contracts
- **Entity**: Project { id, name, visibility, created_at }
- **Permissions**: creator can create; public visibility can be read by all

### POST `/api/projects`
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

### GET `/api/projects/exists?name={encoded}`
- Response
```
{ "exists": false }
```

---

## AI‑Native Simulation

### Persona
```
{
  "id": "pwr_user_pm",
  "name": "Power User PM",
  "expertise_level": "advanced",
  "constraints": ["time_boxed_5m"],
  "risk_profile": "low"
}
```

### Scenario DSL
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

### Autograding Rubric (targets)
- Validation rules enforced
- Duplicate name blocked with inline error
- A11y (focus trap, ESC) passes
- p95 create < 500 ms (stubbed)
- Events fired with required properties
- Passing score ≥ 90

### Synthetic Traffic Plan
- Nightly runs: 50 happy path + 20 edge cases
- Environments: local/staging; read‑only in prod with guards

### Privacy & Safety
- Synthetic data only; redact PII in logs
- Rate limits to avoid abuse

---

## Instrumentation Plan
- Events: Submitted, Succeeded, Failed
- Properties: name_length, visibility, project_id, reason
- QA: Validate in staging; sample payloads logged

## Rollout & Experiment Plan
- Feature flag `ff_create_project_modal`
- Canary to 5% of users for 24h, then ramp

## Definition of Done
- All ACs pass; rubric ≥ 90
- Events validated end‑to‑end
- A11y checks meet WCAG 2.1 AA

## Review Checklist
- Product: goals, ACs, metrics
- Design: flows, copy, states
- Eng: feasibility, contracts, performance
- Data: events, QA plan
- QA: test cases and automation

## Change Log
- 2025‑01‑15 — Initial draft — 

