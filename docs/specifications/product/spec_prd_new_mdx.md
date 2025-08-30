# Copilot in SaaS Spec: AI-Powered PRD Assistant

## Executive Summary

### What is MDX-based Interactive PRD?

An MDX-based Interactive PRD revolutionizes how product requirements are documented by combining the familiarity of markdown documentation with live, interactive React components. This creates a single source of truth where requirements, prototypes, and acceptance criteria coexist as executable, testable artifacts.

### Key Advantages

1. **Everything is Code**: Natural version control, diffing, and CI/CD integration
2. **Live and Interactive**: Not just documentation, but working prototypes embedded in specs
3. **AI-Native**: LLMs excel at generating both prose documentation and component code
4. **Progressive Enhancement**: Start with text, incrementally add interactivity
5. **Testable Requirements**: Acceptance criteria automatically validated against components
6. **Full Traceability**: Every requirement links to code, tests, and analytics events
7. **Git-Friendly**: Text-based format enables collaboration through standard dev workflows

### Core Innovations from Annotated Prototype PRD

#### 1. Pin-based Annotations → Interactive MDX Components
Transform static annotations into live, interactive components:
```markdown
<AnnotatedComponent id="AC-001">
  <UserProfileForm />
  <Annotations>
    <Pin area="name-input" trigger="blur">
      - Validates 1-60 chars
      - API: GET /api/users/exists?name={encoded}
      - Error: "Username already taken"
      - Track: Username_Changed { length }
    </Pin>
  </Annotations>
</AnnotatedComponent>
```

#### 2. Prototype Version Control → Component Snapshots
Git-backed versioning for both MDX and generated components:
```yaml
version_id: prd-dashboard-1.2.0+20250115
components:
  UserProfileForm:
    code: "./components/UserProfileForm.tsx"
    preview: "./snapshots/UserProfileForm.png"
    acceptance_criteria: ["AC-001", "AC-002"]
    tests: ["E2E-Profile-01"]
```

#### 3. AI-Native Simulation → Live Testing
Persona-driven testing embedded directly in PRDs:
```markdown
<SimulationHarness persona="power_user_pm">
  <Scenario name="create_project_happy_path">
    - navigate: Dashboard
    - click: "New Project"
    - type: { target: "name", value: "Q1 Roadmap" }
    - assert: { navigated_to: "/projects/*" }
  </Scenario>
  <LiveTest autoRun={true} />
</SimulationHarness>
```

#### 4. Acceptance Criteria → Executable Specifications
ACs that validate themselves against actual components:
```markdown
<AcceptanceCriteria id="AC-CP-001" status="in-progress">
  <Criterion test="name-validation">
    Given the name field has 61 characters
    When the user tries to submit
    Then an error "Maximum 60 characters" appears
  </Criterion>
  <AutoValidator component={ProjectForm} />
</AcceptanceCriteria>
```

#### 5. Traceability Manifest → MDX Metadata
Full traceability embedded in frontmatter:
```yaml
---
manifest:
  version_id: prd-dashboard-1.2.0+20250115
  components:
    - id: UserProfileForm
      acs: [AC-001, AC-002]
      tests: [E2E-Profile-01]
      analytics: [Profile_Created, Profile_Updated]
---
```

## 1. Target Workflows & Success Metrics

### Target Workflows
1. **PRD Creation Flow**
   - Empty document → Structured PRD with sections
   - Natural language prompt → MDX content with components
   - Sketch/wireframe → Interactive prototype

2. **Component Generation Flow**
   - Requirement text → React component code
   - Component selection → Props and variations
   - Acceptance criteria → Test cases

3. **Documentation Enhancement Flow**
   - Basic description → Detailed specifications
   - User stories → Acceptance criteria
   - API needs → Endpoint definitions

### Success Metrics
- **Efficiency**: 70% reduction in PRD creation time (baseline: 4 hours → target: 1.2 hours)
- **Quality**: 90% of generated content requires < 3 edits
- **Adoption**: 80% of PMs use AI assistance daily within 30 days
- **Accuracy**: 85% acceptance rate for AI suggestions
- **Engagement**: Average 15+ AI interactions per PRD

## 2. Suggestion Surfaces & Accept/Edit Loops

### Inline Suggestions
```markdown
As user types: "The dashboard should show..." 
→ AI suggests: "...key metrics including MAU, revenue, and churn rate"
[Accept] [Edit] [Dismiss]
```

### Component Palette
```
Type: <Dash|
┌─────────────────────────────────────┐
│ 🎯 Dashboard - Analytics dashboard  │
│ 📊 DataTable - Sortable data grid  │
│ 📈 Chart - Interactive charts       │
│ 📍 AnnotatedComponent - With pins   │
│ ✅ AcceptanceCriteria - Executable │
│ 🧪 SimulationHarness - Test runner │
└─────────────────────────────────────┘
```

### Smart Commands
```
/generate component for user profile
/create acceptance criteria
/add api endpoint
/convert to user story
/add pins to component
/generate test scenario
/create validation rules
/export to figma snapshot
```

### Preview Annotations
Hover over any component in preview:
```
┌─────────────────────┐
│ 💡 AI Suggestions:  │
│ • Add loading state │
│ • Include error msg │
│ • Make responsive   │
└─────────────────────┘
```

## 3. Safe Actions & Reversibility

### Safe by Default
- **Read-only first**: All suggestions preview before applying
- **Explicit confirmation**: Destructive changes require confirmation
- **Sandboxed execution**: Components run in isolated environment
- **Version control**: Every AI edit creates a checkpoint

### Approval Workflows
```yaml
auto_accept:
  - grammar_corrections
  - formatting_improvements
  - component_prop_suggestions

require_preview:
  - new_sections
  - component_generation
  - api_specifications

require_confirmation:
  - delete_operations
  - major_restructuring
  - external_api_calls
```

### Undo/Redo Stack
```
Ctrl+Z: Undo last AI suggestion
Ctrl+Shift+Z: Redo
Cmd+K → "Show edit history": Full timeline
```

## 4. Correction Learning Loop

### Feedback Collection
```typescript
interface AIFeedback {
  suggestion_id: string
  action: 'accepted' | 'edited' | 'rejected'
  edit_diff?: string
  reason?: string
  context: {
    document_type: string
    section: string
    user_role: string
  }
}
```

### Learning Pipeline
1. **Immediate**: Cache user preferences per session
2. **Daily**: Aggregate feedback for prompt tuning
3. **Weekly**: Retrain component generation models
4. **Monthly**: Update suggestion ranking algorithms

### Personalization
```yaml
user_preferences:
  writing_style: "concise"
  component_library: "radix-ui"
  naming_convention: "camelCase"
  typical_products: ["b2b", "saas", "analytics"]
```

## 5. Boundaries & Manual Control

### AI Boundaries
- **Never auto-save**: All changes require user action
- **No external calls**: Without explicit permission
- **Context limits**: Max 10 PRDs in context
- **Rate limits**: 100 suggestions per hour
- **Content filtering**: No PII in training data

### Escalation to Manual
```
AI Confidence Indicators:
🟢 High confidence (>90%) - Auto-suggest
🟡 Medium (70-90%) - Suggest with warning
🔴 Low (<70%) - Prompt for manual input
```

### Manual Override
- `Cmd+Shift+A`: Toggle AI suggestions
- Settings: Disable for specific sections
- "Expert mode": Minimal AI intervention

## 6. Instrumentation & Dashboards

### Key Metrics Dashboard
```
┌─────────────────────────────────────────┐
│ AI Copilot Analytics                    │
├─────────────────────────────────────────┤
│ Acceptance Rate: 87% ▲                  │
│ Avg Time Saved: 2.3 hrs/PRD            │
│ Most Used: Component Generation (45%)    │
│ Error Rate: 0.3% ▼                     │
└─────────────────────────────────────────┘
```

### Telemetry Events
```typescript
track('ai_suggestion_shown', {
  type: 'component_generation',
  confidence: 0.92,
  context_length: 1500
})

track('ai_suggestion_accepted', {
  suggestion_id: 'sg_123',
  time_to_accept: 3.2,
  edits_made: false
})
```

### Quality Monitoring
- A/B testing suggestion algorithms
- Shadow mode comparisons
- User satisfaction surveys
- Performance benchmarks

## 7. Rollout Plan & Enablement

### Phase 1: Alpha (Week 1-2)
- Internal team testing
- Basic suggestions only
- Collect feedback

### Phase 2: Beta (Week 3-6)
- 20 selected customers
- Component generation enabled
- Daily office hours

### Phase 3: GA (Week 7+)
- All users with opt-in
- Full feature set
- Self-serve onboarding

### Enablement Materials
1. **Video Tutorials**
   - "Getting Started with AI PRD" (5 min)
   - "Advanced Component Generation" (10 min)
   - "Best Practices" (15 min)

2. **Interactive Onboarding**
   ```
   First PRD creation triggers tutorial:
   Step 1: Try AI suggestion
   Step 2: Generate a component
   Step 3: Edit and customize
   ```

3. **Documentation**
   - Quick start guide
   - AI prompt cookbook
   - Troubleshooting guide

## 8. Risks & Mitigations

### Risk Matrix
| Risk | Impact | Likelihood | Mitigation |
|------|---------|------------|------------|
| Hallucinated requirements | High | Medium | Human review required |
| API key exposure | High | Low | Encrypted storage, rotation |
| Over-reliance on AI | Medium | High | Education, limits |
| Performance degradation | Medium | Medium | Caching, rate limits |
| Incorrect component code | Low | Medium | Sandboxed preview |

### Security Measures
- Client-side API key encryption
- No training on customer data
- Regular security audits
- SOC 2 compliance

## 9. Owners & Timelines

### RACI Matrix
| Task | Responsible | Accountable | Consulted | Informed |
|------|------------|-------------|-----------|----------|
| AI Integration | AI Team | VP Eng | Security | All PMs |
| UX Design | Design Lead | CPO | Users | Eng |
| Rollout | PM Lead | CEO | CS Team | Company |
| Training | Enablement | VP CS | PMs | Users |

### Timeline
```
Q1 2024:
- Jan: Architecture & Design
- Feb: Core AI Integration
- Mar: Alpha Testing

Q2 2024:
- Apr: Beta Launch
- May: Feedback Integration
- Jun: GA Release
```

## 10. Integrated Annotated Prototype Features

### Component Annotation System
Each component can have rich annotations that serve as living documentation:

```typescript
interface ComponentAnnotation {
  id: string
  component: ReactElement
  pins: Pin[]
  states: ComponentState[]
  validationRules: ValidationRule[]
  apiContracts: APIContract[]
  analytics: AnalyticsEvent[]
  acceptanceCriteria: AcceptanceCriterion[]
}
```

### Pin Mapping
Transform prototype pins into interactive documentation:
```markdown
<PinMapper component={UserForm}>
  <Pin id="P1" area="name-input" x={100} y={50}>
    <Interaction trigger="blur" />
    <Validation rule="uniqueName" />
    <API endpoint="/api/validate/name" />
    <Analytics event="Name_Validated" />
  </Pin>
</PinMapper>
```

### State Management Visualization
```markdown
<StateViewer component={ProjectModal}>
  <State name="default" screenshot="default.png" />
  <State name="loading" screenshot="loading.png" />
  <State name="error" screenshot="error.png">
    <ErrorCase code={409} message="Name already exists" />
    <ErrorCase code={500} message="Server error" />
  </State>
</StateViewer>
```

### Validation Rule Builder
```markdown
<ValidationBuilder>
  <Rule field="projectName">
    - Min length: 1
    - Max length: 60
    - Pattern: ^[A-Za-z0-9 \-]+$
    - Async: checkUniqueness()
  </Rule>
  <TestHarness />
</ValidationBuilder>
```

### API Contract Testing
```markdown
<APIContract endpoint="/api/projects" method="POST">
  <Request>
    ```json
    { "name": "My Project", "visibility": "private" }
    ```
  </Request>
  <Response status={201}>
    ```json
    { "id": "prj_123", "name": "My Project", "visibility": "private" }
    ```
  </Response>
  <LiveTest />
</APIContract>
```

### Analytics Event Tracker
```markdown
<AnalyticsTracker component={Dashboard}>
  <Event name="Dashboard_Viewed" />
  <Event name="Metric_Clicked" properties={["metric_type", "value"]} />
  <Event name="Filter_Applied" properties={["filter_type", "filter_value"]} />
  <DebugPanel show={isDev} />
</AnalyticsTracker>
```

### Acceptance Criteria Automation
```markdown
<ACTestRunner>
  <TestCase id="TC-001">
    Given user is on dashboard
    When clicking "New Project"
    Then modal appears with focus on name field
    <AutomatedTest status="passing" lastRun="2025-01-15" />
  </TestCase>
</ACTestRunner>
```

### Version Control Integration
```yaml
# In MDX frontmatter
---
prototype:
  version: "1.2.0+20250115"
  figma_url: "https://figma.com/..."
  snapshots:
    - components/Dashboard.png
    - components/UserForm.png
  manifest: ./prototype.manifest.json
---
```

### Export Capabilities
```markdown
<ExportOptions>
  <Export format="figma" includeAnnotations={true} />
  <Export format="storybook" generateStories={true} />
  <Export format="playwright" generateTests={true} />
  <Export format="react-app" scaffold={true} />
</ExportOptions>
```

## 11. Appendix: Prompt & Schema Examples

### System Prompt Template
```typescript
const systemPrompt = `You are an AI assistant helping create product requirement documents using MDX format.

Context:
- User is a ${userRole} working on ${productType}
- Document type: ${documentType}
- Company context: ${companyContext}

Guidelines:
- Generate valid MDX with React components
- Follow ${writingStyle} writing style
- Use ${componentLibrary} components
- Include acceptance criteria
- Be concise but comprehensive

Current document context:
${documentContext}
`;
```

### Component Generation Schema
```typescript
interface ComponentGeneration {
  prompt: string
  context: {
    requirements: string[]
    userStories: string[]
    acceptanceCriteria: string[]
    prototypeReference?: string // Figma URL or local snapshot
  }
  output: {
    mdx: string
    component: {
      name: string
      props: Record<string, any>
      code: string
      tests: string[]
      pins: Pin[] // Interactive hotspots
      states: State[] // UI states
      validationRules: ValidationRule[]
      apiEndpoints: APIEndpoint[]
      analytics: AnalyticsEvent[]
    }
    documentation: string
    manifest: {
      version: string
      traceability: {
        requirements: string[]
        acceptanceCriteria: string[]
        tests: string[]
        analytics: string[]
      }
    }
  }
}

interface Pin {
  id: string
  area: string // CSS selector or coordinate
  trigger: 'click' | 'blur' | 'change' | 'hover'
  action: string
  validation?: ValidationRule
  tracking?: AnalyticsEvent
}
```

### API Integration Example
```yaml
endpoint: /api/ai/suggest
method: POST
body:
  action: "generate_component"
  context:
    current_document: "..."
    cursor_position: 1234
    selected_text: "user profile form"
  preferences:
    style: "minimal"
    library: "radix-ui"
response:
  suggestions:
    - type: "component"
      confidence: 0.92
      mdx: "<UserProfile ... />"
      preview_url: "https://..."
```

### Training Data Format
```json
{
  "examples": [
    {
      "input": "Create a dashboard showing user analytics",
      "output": {
        "mdx": "## Analytics Dashboard\n\n<Dashboard>\n  <MetricCard title=\"Active Users\" value={1234} />\n  <Chart type=\"line\" data={userData} />\n</Dashboard>",
        "metadata": {
          "components_used": ["Dashboard", "MetricCard", "Chart"],
          "acceptance_criteria": [
            "Dashboard loads within 2 seconds",
            "Metrics update in real-time"
          ]
        }
      }
    }
  ]
}
```

### Comprehensive MDX PRD Example

```markdown
---
manifest:
  version_id: prd-user-onboarding-2.1.0+20250115
  figma_file: https://figma.com/file/abc123
  components:
    - id: OnboardingFlow
      acs: [AC-ONB-001, AC-ONB-002, AC-ONB-003]
      tests: [E2E-Onboarding-01, E2E-Onboarding-02]
      analytics: [Onboarding_Started, Onboarding_Completed]
---

# User Onboarding PRD

## Interactive Prototype

<AnnotatedComponent id="onboarding-flow">
  <OnboardingWizard />
  
  <Annotations>
    <Pin area="email-input" trigger="blur">
      - Validates email format
      - Checks for existing account
      - API: POST /api/auth/check-email
      - Track: Email_Entered { valid: boolean }
    </Pin>
    
    <Pin area="continue-button" trigger="click">
      - Validates all fields
      - Submits to backend
      - API: POST /api/users/create
      - Track: Onboarding_Step_Completed { step: 1 }
    </Pin>
  </Annotations>
</AnnotatedComponent>

## Acceptance Criteria

<AcceptanceCriteria id="AC-ONB-001">
  <Criterion>
    Given a new user enters an invalid email
    When they click continue
    Then an inline error "Please enter a valid email" appears
    And the continue button remains disabled
  </Criterion>
  <AutoValidator component={OnboardingWizard} />
</AcceptanceCriteria>

## State Management

<StateViewer component={OnboardingWizard}>
  <State name="initial" description="Empty form, continue disabled" />
  <State name="validating" description="Checking email availability" />
  <State name="error" description="Validation or API errors">
    <ErrorCase code="EMAIL_INVALID" />
    <ErrorCase code="EMAIL_TAKEN" />
    <ErrorCase code="NETWORK_ERROR" />
  </State>
  <State name="success" description="Moving to next step" />
</StateViewer>

## API Contracts

<APIContract endpoint="/api/users/create" method="POST">
  <Request>
    ```json
    {
      "email": "user@example.com",
      "name": "Jane Doe",
      "company": "Acme Corp"
    }
    ```
  </Request>
  <Response status={201}>
    ```json
    {
      "id": "usr_123",
      "email": "user@example.com",
      "onboarding_token": "tok_abc123"
    }
    ```
  </Response>
  <LiveTest environment="staging" />
</APIContract>

## Analytics Tracking

<AnalyticsTracker>
  <Event name="Onboarding_Started" />
  <Event name="Onboarding_Step_Completed" properties={["step", "time_spent"]} />
  <Event name="Onboarding_Abandoned" properties={["step", "reason"]} />
  <Event name="Onboarding_Completed" properties={["total_time", "path"]} />
</AnalyticsTracker>

## Automated Testing

<SimulationHarness>
  <Persona id="first_time_user" />
  <Persona id="returning_user" />
  <Persona id="enterprise_admin" />
  
  <Scenario name="happy_path" persona="first_time_user">
    - fill: { email: "new@example.com", name: "Test User" }
    - click: "Continue"
    - assert: { navigated_to: "/onboarding/step-2" }
    - assert: { event_fired: "Onboarding_Step_Completed" }
  </Scenario>
  
  <RunTests schedule="on_commit" />
</SimulationHarness>

## Version Control

<VersionControl>
  <Snapshot version="2.1.0" date="2025-01-15">
    - Added email validation
    - Improved error messaging
    - Added progress indicator
  </Snapshot>
  <Diff from="2.0.0" to="2.1.0" />
  <Export format="figma" />
</VersionControl>
```

<!-- END SAAS COPILOT -->
