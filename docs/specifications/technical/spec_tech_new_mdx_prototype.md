# Technical Specification: MDX-based Interactive PRD Prototype

## 1. Executive Summary

### Project Overview
Build a prototype of an MDX-based Interactive PRD system that combines markdown documentation with live React components, enabling PMs to create executable specifications with AI assistance.

### MVP Scope
- MDX editor with live preview
- Basic component library (5-10 components)
- AI-powered content generation (OpenAI integration)
- Pin-based annotations on components
- Simple acceptance criteria validation
- Git-based version control

## 2. Architecture Overview

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                       │
├─────────────────┬──────────────────┬────────────────────┤
│   MDX Editor    │  Live Preview    │  Component Library │
│   (Monaco)      │  (Sandboxed)     │     (Radix UI)     │
├─────────────────┴──────────────────┴────────────────────┤
│                  State Management (Zustand)              │
├─────────────────────────┬───────────────────────────────┤
│   MDX Processor         │        AI Service             │
│   (@mdx-js/mdx)         │    (OpenAI SDK)              │
├─────────────────────────┴───────────────────────────────┤
│                 Storage Layer                            │
│         (IndexedDB + Git Integration)                    │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack
```yaml
frontend:
  framework: React 18 + TypeScript
  build: Vite 5
  styling: Tailwind CSS + CSS Modules
  
editor:
  monaco: "@monaco-editor/react" # VS Code editor
  mdx: "@mdx-js/react" + "@mdx-js/rollup"
  preview: "react-frame-component" # Sandboxed iframe
  
components:
  ui: "@radix-ui/react-*" # Headless components
  icons: "lucide-react"
  animation: "framer-motion"
  
state:
  global: "zustand" # Simple state management
  persistence: "idb" # IndexedDB wrapper
  
ai:
  sdk: "openai" # Official OpenAI SDK
  streaming: "ai" # Vercel AI SDK for streaming
  
testing:
  unit: "vitest" + "@testing-library/react"
  e2e: "playwright"
```

## 3. Core Components

### 3.1 MDX Editor Module
```typescript
interface MDXEditorProps {
  initialContent: string
  onChange: (content: string) => void
  onSave: () => void
  suggestions: AISuggestion[]
}

// Features:
// - Syntax highlighting for MDX
// - Auto-completion for components
// - Inline AI suggestions
// - Real-time validation
// - Keyboard shortcuts
```

### 3.2 Live Preview System
```typescript
interface PreviewConfig {
  components: Record<string, React.ComponentType>
  scope: Record<string, any>
  wrapper?: React.ComponentType
  errorBoundary?: React.ComponentType
}

// Sandboxing strategy:
// - iframe isolation for security
// - Controlled component registry
// - Error boundary with recovery
// - Hot reload on changes
```

### 3.3 Component Annotation System
```typescript
interface AnnotatedComponent<T> {
  component: React.ComponentType<T>
  pins: Pin[]
  states: ComponentState[]
  validations: ValidationRule[]
}

interface Pin {
  id: string
  position: { x: number; y: number } | string // coords or selector
  trigger: 'click' | 'hover' | 'focus' | 'blur'
  content: {
    description: string
    api?: APIEndpoint
    validation?: ValidationRule
    tracking?: AnalyticsEvent
  }
}
```

### 3.4 AI Integration Layer
```typescript
interface AIService {
  generateComponent(prompt: string, context: PRDContext): Promise<GeneratedComponent>
  suggestContent(partial: string, context: PRDContext): Promise<Suggestion[]>
  enhanceAcceptanceCriteria(criteria: string): Promise<EnhancedCriteria>
  extractDataSchema(component: ComponentInfo): Promise<DataSchema>
}

// Streaming support for better UX
interface StreamingAIService extends AIService {
  generateComponentStream(prompt: string, context: PRDContext): AsyncIterable<string>
}
```

## 4. Data Models

### 4.1 PRD Document Model
```typescript
interface PRDDocument {
  id: string
  title: string
  version: string
  content: string // MDX content
  metadata: {
    author: string
    created: Date
    modified: Date
    tags: string[]
  }
  manifest: {
    components: ComponentManifest[]
    acceptanceCriteria: AcceptanceCriterion[]
    apiContracts: APIContract[]
    analytics: AnalyticsEvent[]
  }
  snapshots: Snapshot[]
}

interface ComponentManifest {
  id: string
  name: string
  path: string
  props: Record<string, PropDefinition>
  acceptanceCriteria: string[] // AC IDs
  tests: string[] // Test IDs
  pins: Pin[]
}
```

### 4.2 Version Control Model
```typescript
interface Snapshot {
  id: string
  version: string
  timestamp: Date
  author: string
  message: string
  diff: {
    added: string[]
    modified: string[]
    deleted: string[]
  }
  artifacts: {
    mdx: string
    components: Record<string, string> // name -> code
    screenshots: Record<string, string> // name -> base64
  }
}
```

### 4.3 Validation Models
```typescript
interface ValidationRule {
  field: string
  type: 'required' | 'pattern' | 'length' | 'custom'
  config: {
    pattern?: RegExp
    min?: number
    max?: number
    validator?: (value: any) => boolean
    message: string
  }
}

interface AcceptanceCriterion {
  id: string
  given: string
  when: string
  then: string
  automated: boolean
  testFunction?: (component: React.ComponentType) => Promise<boolean>
}
```

## 5. Key Features Implementation

### 5.1 Pin-based Annotations
```typescript
// Pin renderer overlays on components
const PinRenderer: React.FC<{ component: ReactElement; pins: Pin[] }> = ({ component, pins }) => {
  return (
    <div className="relative">
      {component}
      {pins.map(pin => (
        <PinMarker
          key={pin.id}
          position={pin.position}
          onHover={() => showTooltip(pin)}
          onClick={() => showDetails(pin)}
        />
      ))}
    </div>
  )
}

// Pin editor for adding/editing pins
const PinEditor: React.FC<{ onSave: (pin: Pin) => void }> = ({ onSave }) => {
  // Click on component to place pin
  // Drag to reposition
  // Right-click to edit content
}
```

### 5.2 Acceptance Criteria Validation
```typescript
// Auto-validator that runs tests against components
const AcceptanceCriteriaValidator: React.FC<{
  criteria: AcceptanceCriterion
  component: React.ComponentType
}> = ({ criteria, component }) => {
  const [status, setStatus] = useState<'pending' | 'running' | 'passed' | 'failed'>('pending')
  
  const runValidation = async () => {
    setStatus('running')
    try {
      const result = await criteria.testFunction?.(component)
      setStatus(result ? 'passed' : 'failed')
    } catch (error) {
      setStatus('failed')
    }
  }
  
  return (
    <div className="ac-validator">
      <div className="ac-text">
        <span className="given">Given {criteria.given}</span>
        <span className="when">When {criteria.when}</span>
        <span className="then">Then {criteria.then}</span>
      </div>
      <ValidationStatus status={status} onRun={runValidation} />
    </div>
  )
}
```

### 5.3 AI Component Generation
```typescript
// Component generator with streaming
const useComponentGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  
  const generateComponent = async (prompt: string, context: PRDContext) => {
    setIsGenerating(true)
    setProgress('Understanding requirements...')
    
    try {
      const stream = await aiService.generateComponentStream(prompt, context)
      let component = ''
      
      for await (const chunk of stream) {
        component += chunk
        setProgress(`Generating... ${component.length} chars`)
      }
      
      // Parse and validate generated component
      const parsed = await parseComponent(component)
      
      // Generate supporting artifacts
      setProgress('Creating tests...')
      const tests = await generateTests(parsed)
      
      setProgress('Extracting data schema...')
      const schema = await extractSchema(parsed)
      
      return { component: parsed, tests, schema }
    } finally {
      setIsGenerating(false)
    }
  }
  
  return { generateComponent, isGenerating, progress }
}
```

### 5.4 Data Schema Extraction
```typescript
// Extract schema from component props and form fields
const extractDataSchema = (component: ComponentInfo): DataSchema => {
  const schema: DataSchema = {
    properties: {},
    required: []
  }
  
  // Analyze prop types
  if (component.propTypes) {
    Object.entries(component.propTypes).forEach(([key, type]) => {
      schema.properties[key] = inferJsonSchema(type)
      if (type.isRequired) schema.required.push(key)
    })
  }
  
  // Analyze form fields in component
  const formFields = findFormFields(component.ast)
  formFields.forEach(field => {
    schema.properties[field.name] = {
      type: field.type,
      validation: field.validation
    }
  })
  
  // Analyze API calls
  const apiCalls = findAPICalls(component.ast)
  apiCalls.forEach(call => {
    mergeSchema(schema, inferSchemaFromAPI(call))
  })
  
  return schema
}
```

## 6. File Structure

```
apps/mdx-prototype/
├── src/
│   ├── components/
│   │   ├── Editor/
│   │   │   ├── MDXEditor.tsx
│   │   │   ├── MonacoConfig.ts
│   │   │   └── Toolbar.tsx
│   │   ├── Preview/
│   │   │   ├── PreviewPane.tsx
│   │   │   ├── Sandbox.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   ├── Annotations/
│   │   │   ├── PinManager.tsx
│   │   │   ├── PinEditor.tsx
│   │   │   └── AnnotationOverlay.tsx
│   │   ├── AI/
│   │   │   ├── AIAssistant.tsx
│   │   │   ├── SuggestionPanel.tsx
│   │   │   └── GeneratorModal.tsx
│   │   └── Library/
│   │       ├── Dashboard.tsx
│   │       ├── UserForm.tsx
│   │       ├── DataTable.tsx
│   │       └── index.ts
│   ├── services/
│   │   ├── ai/
│   │   │   ├── openai.ts
│   │   │   ├── prompts.ts
│   │   │   └── streaming.ts
│   │   ├── mdx/
│   │   │   ├── processor.ts
│   │   │   ├── validator.ts
│   │   │   └── transformer.ts
│   │   └── storage/
│   │       ├── indexeddb.ts
│   │       ├── git.ts
│   │       └── export.ts
│   ├── hooks/
│   │   ├── useAI.ts
│   │   ├── useMDX.ts
│   │   ├── useAnnotations.ts
│   │   └── useVersionControl.ts
│   ├── store/
│   │   ├── document.ts
│   │   ├── ui.ts
│   │   └── settings.ts
│   └── types/
│       ├── prd.ts
│       ├── components.ts
│       └── ai.ts
├── public/
│   └── component-templates/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json
```

## 7. API Endpoints

### 7.1 AI Service Endpoints
```yaml
# Component Generation
POST /api/ai/generate-component
Request:
  prompt: string
  context:
    currentPRD: string
    selectedText?: string
    componentLibrary: string
Response:
  component:
    code: string
    props: Record<string, any>
    tests: string[]
  schema: DataSchema
  suggestions: string[]

# Content Suggestions  
POST /api/ai/suggest
Request:
  partial: string
  context:
    before: string
    after: string
    documentType: string
Response:
  suggestions: Array<{
    text: string
    confidence: number
    reasoning: string
  }>

# Schema Extraction
POST /api/ai/extract-schema
Request:
  component: string
  annotations: Pin[]
Response:
  schema:
    typescript: string
    json: object
    database: string
```

### 7.2 Storage Endpoints
```yaml
# PRD Management
GET /api/prds
GET /api/prds/:id
POST /api/prds
PUT /api/prds/:id
DELETE /api/prds/:id

# Version Control
GET /api/prds/:id/versions
POST /api/prds/:id/snapshot
GET /api/prds/:id/diff?from=v1&to=v2

# Export
POST /api/export/figma
POST /api/export/storybook
POST /api/export/react-app
```

## 8. Security Considerations

### 8.1 Sandboxing
- Run preview components in iframe with restricted permissions
- Whitelist allowed component imports
- Sanitize all user-generated content
- CSP headers to prevent XSS

### 8.2 API Security
- Encrypt API keys in localStorage
- Use environment variables for server-side keys
- Rate limit AI requests
- Validate all generated code before execution

### 8.3 Data Privacy
- No customer data in AI prompts
- Local-first storage with optional sync
- Audit trail for all AI interactions
- GDPR-compliant data handling

## 9. Performance Requirements

### 9.1 Editor Performance
- Typing latency: < 50ms
- Syntax highlighting: < 100ms
- Auto-complete: < 200ms
- File save: < 500ms

### 9.2 Preview Performance
- Initial render: < 1s
- Hot reload: < 200ms
- Component mount: < 100ms
- Annotation render: < 50ms

### 9.3 AI Performance
- Suggestion latency: < 2s
- Component generation: < 10s
- Streaming start: < 1s
- Schema extraction: < 3s

## 10. Testing Strategy

### 10.1 Unit Tests
```typescript
// Example: Pin annotation tests
describe('PinManager', () => {
  it('should add pin on click', async () => {
    const onAddPin = vi.fn()
    const { user } = render(<PinManager onAddPin={onAddPin} />)
    
    await user.click(screen.getByTestId('component-area'))
    
    expect(onAddPin).toHaveBeenCalledWith({
      position: expect.any(Object),
      trigger: 'click'
    })
  })
  
  it('should validate pin content', () => {
    const pin = { content: { description: '' } }
    expect(validatePin(pin)).toBe(false)
  })
})
```

### 10.2 Integration Tests
```typescript
// Example: MDX processing pipeline
describe('MDX Pipeline', () => {
  it('should process MDX with custom components', async () => {
    const mdx = '<Dashboard title="Analytics" />'
    const result = await processMDX(mdx, { components })
    
    expect(result.code).toContain('Dashboard')
    expect(result.errors).toHaveLength(0)
  })
})
```

### 10.3 E2E Tests
```typescript
// Example: Full PRD creation flow
test('create PRD with AI assistance', async ({ page }) => {
  await page.goto('/new')
  
  // Type in editor
  await page.fill('[data-testid="mdx-editor"]', '# User Dashboard PRD\n\n')
  
  // Trigger AI suggestion
  await page.keyboard.type('The dashboard should')
  await page.waitForSelector('.ai-suggestion')
  
  // Accept suggestion
  await page.keyboard.press('Tab')
  
  // Add component
  await page.click('[data-testid="insert-component"]')
  await page.click('[data-testid="component-dashboard"]')
  
  // Verify preview
  await expect(page.frameLocator('#preview')).toContainText('Analytics')
})
```

## 11. Deployment Architecture

### 11.1 Infrastructure
```yaml
production:
  frontend:
    platform: Vercel
    regions: [us-east-1, eu-west-1]
    
  api:
    platform: Vercel Functions
    runtime: Node.js 20
    
  storage:
    primary: Vercel KV (Redis)
    files: Vercel Blob Storage
    
  cdn:
    provider: Vercel Edge Network
```

### 11.2 CI/CD Pipeline
```yaml
pipeline:
  - trigger: push to main
  - steps:
    - install: pnpm install
    - lint: pnpm lint
    - typecheck: pnpm typecheck  
    - test: pnpm test
    - build: pnpm build
    - e2e: pnpm test:e2e
    - deploy: vercel deploy --prod
```

## 12. Monitoring & Analytics

### 12.1 Key Metrics
- AI usage (requests, tokens, costs)
- Editor performance (lag, crashes)
- Component generation success rate
- User engagement (time in editor, components created)
- Error rates by feature

### 12.2 Logging
```typescript
// Structured logging for debugging
logger.info('AI_GENERATION_STARTED', {
  userId,
  prompt,
  context: { prdId, componentCount }
})

logger.error('COMPONENT_VALIDATION_FAILED', {
  error,
  component,
  validationRules
})
```

## 13. Future Enhancements

### Phase 2 Features
- Real-time collaboration (CRDT-based)
- Visual component builder
- Figma plugin for import/export  
- GitHub integration
- Custom component libraries
- Advanced AI features (vision, voice)

### Phase 3 Features
- Marketplace for component templates
- Team workspaces
- Advanced analytics
- API mock server
- Test generation & execution
- CI/CD integration

## 14. Success Criteria

### MVP Success Metrics
- Create full PRD in < 30 minutes (vs 2-4 hours baseline)
- 90% of generated components work without modification
- AI suggestions accepted > 70% of the time
- Zero security vulnerabilities
- 99.9% uptime

### User Satisfaction
- NPS > 50
- Daily active usage > 60%
- Feature request implementation < 2 weeks
- Support response time < 2 hours

This technical specification provides a comprehensive blueprint for building the MDX-based Interactive PRD prototype, focusing on practical implementation while maintaining the innovative features from the PRD.
