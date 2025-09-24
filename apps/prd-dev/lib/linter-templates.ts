// Auto-fix templates for common PRD requirements
export const LINTER_AUTO_FIX_TEMPLATES = {
  // ==================== STANDARD TEMPLATES ====================
  userStories: `## User Stories

As a **product manager**, I want to **generate comprehensive PRDs quickly** so that **I can focus on strategic planning rather than documentation**.

As a **developer**, I want to **receive clear and detailed requirements** so that **I can build features correctly the first time**.

As a **stakeholder**, I want to **review well-structured PRDs** so that **I can provide meaningful feedback and make informed decisions**.

As a **designer**, I want to **understand user needs and constraints** so that **I can create intuitive and effective interfaces**.`,

  acceptanceCriteria: `## Acceptance Criteria

### Feature: [Feature Name]

**Scenario 1: [Happy Path]**
- **Given** the user is authenticated and on the dashboard
- **When** they click the "Create" button
- **Then** a new item should be created and displayed in the list

**Scenario 2: [Error Handling]**
- **Given** the user submits invalid data
- **When** they click "Save"
- **Then** validation errors should be displayed inline

**Scenario 3: [Edge Case]**
- **Given** the system is under heavy load
- **When** the user performs an action
- **Then** the system should queue the request and provide feedback

### Definition of Done
☐ All acceptance criteria met
☐ Unit tests written and passing
☐ Code reviewed and approved
☐ Documentation updated
☐ Deployed to staging environment`,

  scopeDefinition: `## Scope

### In Scope (MVP)
- **Core Features**
  - User authentication and authorization
  - Basic CRUD operations
  - Data validation and error handling
  - Desktop web application

- **Integrations**
  - REST API development
  - Database setup (PostgreSQL)
  - Third-party authentication (OAuth)

### Out of Scope (Future Phases)
- Mobile applications (iOS/Android)
- Advanced analytics and reporting
- Multi-language support
- Offline mode
- Legacy system migration
- Custom themes and white-labeling

### Constraints
- Must work on Chrome, Firefox, Safari (latest 2 versions)
- Response time <2 seconds for 95th percentile
- Support up to 10,000 concurrent users
- GDPR and CCPA compliant`,

  successMetrics: `## Success Metrics

### Primary KPIs
- **User Adoption**: 80% of target users actively using within 3 months
- **Performance**: 95th percentile response time <2 seconds
- **Reliability**: 99.9% uptime SLA
- **User Satisfaction**: NPS score >50

### Secondary Metrics
- **Engagement**
  - Daily Active Users (DAU): 5,000
  - Average session duration: >5 minutes
  - Feature adoption rate: 60% within first month

- **Quality**
  - Bug escape rate: <5%
  - Customer support tickets: <10 per 1000 users
  - Time to resolution: <24 hours for critical issues

### Success Criteria
- Reduce time to complete primary workflow by 50%
- Increase user productivity by 30%
- Achieve positive ROI within 6 months`,

  errorHandling: `## Error Handling

### Client-Side Errors
- **Validation Errors**: Display inline with field, red border, clear message
- **Network Errors**: Show toast notification with retry option
- **Timeout Errors**: Display timeout message after 30s, offer manual refresh

### Server-Side Errors
- **400 Bad Request**: Show specific validation messages
- **401 Unauthorized**: Redirect to login with return URL
- **403 Forbidden**: Display permission denied message
- **404 Not Found**: Show custom 404 page with navigation options
- **500 Internal Error**: Display friendly error with support contact

### Error Recovery Strategies
- **Automatic Retry**: 3 attempts with exponential backoff
- **Data Preservation**: Save form data in localStorage on error
- **Graceful Degradation**: Fallback to cached data when available
- **Manual Recovery**: Provide refresh/retry buttons

### Error Logging
- Log all errors to monitoring service (Sentry/Rollbar)
- Include user context and session information
- Set up alerts for error rate spikes`,

  loadingStates: `## Loading States

### Loading Indicators by Duration
- **0-100ms**: No indicator (perceived as instant)
- **100ms-1s**: Spinner or progress indicator
- **1s-3s**: Skeleton screen with animated shimmer
- **>3s**: Progress bar with estimated time

### Loading State Types
1. **Full Page Load**
   - Skeleton screen matching page layout
   - Progressive content rendering
   - Priority loading for above-the-fold content

2. **Component Loading**
   - Inline spinner replacing content area
   - Maintain component dimensions to prevent layout shift
   - Fade transition when content appears

3. **Data Fetching**
   - Table: Show skeleton rows
   - Cards: Display placeholder cards
   - Forms: Disable inputs with loading overlay

4. **File Operations**
   - Upload: Progress bar with percentage and speed
   - Download: Progress indicator with file size
   - Processing: Indeterminate progress with status messages`,

  emptyStates: `## Empty States

### Types of Empty States

1. **First Use (Onboarding)**
   - Welcome message
   - Brief explanation of the feature
   - Clear call-to-action button
   - Optional: Tutorial or demo data option

2. **No Results (Search/Filter)**
   - "No results found" message
   - Suggestions to modify search criteria
   - Option to clear filters
   - Related or suggested items

3. **User Cleared (Deleted All)**
   - Confirmation of successful deletion
   - Option to undo (if applicable)
   - Prompt to create new items

4. **Error State**
   - Error icon and message
   - Explanation of what went wrong
   - Retry button or alternative actions
   - Support contact information

### Empty State Components
- **Visual Element**: Icon or illustration (not too large)
- **Title**: Clear, concise explanation
- **Description**: Additional context (optional)
- **Action**: Primary button or link
- **Alternative Actions**: Secondary options

### Examples
- "No projects yet. Create your first project to get started."
- "No matches found. Try adjusting your filters or search terms."
- "Unable to load data. Please check your connection and try again."`,

  authenticationRequirements: `## Authentication Requirements

### Authentication Methods
- **Primary**: Email/password with email verification
- **Social Login**: OAuth 2.0 (Google, GitHub, Microsoft)
- **Enterprise**: SAML 2.0 SSO integration
- **Passwordless**: Magic link via email (optional)

### Security Requirements
- **Password Policy**: 
  - Minimum 8 characters
  - At least one uppercase, lowercase, number
  - Password strength indicator
  - Prevent common passwords
- **Account Security**:
  - Account lockout after 5 failed attempts
  - CAPTCHA after 3 failed attempts
  - Email notification for new device login
- **Session Management**:
  - JWT tokens with 24-hour expiry
  - Refresh token rotation
  - Secure cookie storage (httpOnly, sameSite)
- **Multi-Factor Authentication**:
  - TOTP (Google Authenticator, Authy)
  - SMS backup (optional)
  - Recovery codes

### User Account Features
- Password reset via email
- Account recovery process
- Device management dashboard
- Login history audit log`,

  dataPrivacyPolicy: `## Data Privacy & Protection

### Data Classification
- **PII (Personally Identifiable Information)**:
  - Names, email addresses, phone numbers
  - Encryption at rest and in transit
  - Access on need-to-know basis
- **Sensitive Data**:
  - Payment information (PCI compliance)
  - Health records (HIPAA compliance if applicable)
  - Government IDs (restricted access)
- **Usage Data**:
  - Analytics (anonymized)
  - Performance metrics
  - User behavior tracking (with consent)

### Privacy Controls
- **User Rights**:
  - Right to access (data export)
  - Right to deletion (account removal)
  - Right to correction (profile editing)
  - Right to portability (standard formats)
- **Consent Management**:
  - Explicit consent for data collection
  - Granular privacy settings
  - Cookie consent banner
  - Marketing communication opt-in/out

### Compliance Requirements
- **GDPR** (European Union):
  - Privacy by design
  - Data minimization
  - Purpose limitation
  - 72-hour breach notification
- **CCPA** (California):
  - Do not sell personal information option
  - Privacy policy disclosure
- **Industry Standards**:
  - SOC 2 Type II
  - ISO 27001
  - Regular security audits

### Data Retention
- User data: Retained while account active + 30 days
- Logs: 90 days
- Backups: 1 year
- Deleted data: Purged within 30 days`,

  performanceRequirements: `## Performance Requirements

### Response Time Targets
- **Page Load**: <2 seconds (First Contentful Paint)
- **Time to Interactive**: <3 seconds
- **API Response**: <200ms for 95th percentile
- **Database Queries**: <50ms average
- **Search Results**: <500ms including network latency

### Throughput Requirements
- **Concurrent Users**: Support 10,000 simultaneous users
- **Requests per Second**: Handle 1,000 RPS peak load
- **Data Processing**: Process 100,000 records in <10 seconds
- **File Upload**: Support files up to 100MB

### Resource Constraints
- **Memory Usage**: <500MB per user session
- **CPU Usage**: <70% under normal load
- **Network Bandwidth**: Optimize for 3G connections
- **Storage**: <100MB client-side storage

### Optimization Strategies
- Implement lazy loading for images and components
- Use CDN for static assets
- Enable HTTP/2 and compression
- Implement database query optimization and caching
- Use service workers for offline functionality`,

  // ==================== AI-SPECIFIC TEMPLATES ====================
  aiModelSpecification: `## AI Model Configuration

### Primary Model
- **Model**: GPT-4o (gpt-4o-2024-08-06)
- **Use Cases**: Complex reasoning, content generation, code analysis
- **Temperature**: 0.7 for creative tasks, 0.3 for analytical tasks
- **Max Tokens**: 4096 response, 8192 context
- **Top P**: 0.9

### Secondary Model (Cost Optimization)
- **Model**: GPT-4o-mini
- **Use Cases**: Simple queries, classifications, summaries
- **Temperature**: 0.5
- **Max Tokens**: 2048

### Fallback Model
- **Model**: GPT-3.5-turbo
- **Use Cases**: Emergency fallback when primary models unavailable
- **Temperature**: 0.5
- **Max Tokens**: 2048

### Specialized Models
- **Embeddings**: text-embedding-3-small
- **Image Analysis**: gpt-4o (vision enabled)
- **Code Generation**: Claude 3.5 Sonnet

### Model Selection Logic
\`\`\`
if (task.complexity === 'high' || task.type === 'reasoning') {
  return 'gpt-4o';
} else if (task.cost_sensitive) {
  return 'gpt-4o-mini';
} else {
  return 'gpt-3.5-turbo';
}
\`\`\``,

  aiFallbackStrategy: `## AI Fallback Strategy

### Fallback Hierarchy
1. **Primary**: GPT-4o with streaming
2. **Secondary**: GPT-4o-mini (if rate limited or timeout)
3. **Tertiary**: GPT-3.5-turbo (if all advanced models fail)
4. **Cache**: Return cached response for similar queries
5. **Manual**: Provide manual input interface

### Error Handling by Type

#### Rate Limiting (429)
- Implement exponential backoff (1s, 2s, 4s, 8s)
- Queue requests for batch processing
- Switch to lower-tier model temporarily
- Notify user of delay with estimated time

#### Timeout (>30s)
- Cancel request after 30 seconds
- Try with smaller context window
- Switch to faster model
- Offer to retry with optimizations

#### Invalid Response
- Validate response format
- Retry with temperature 0
- Add response format instructions
- Log for debugging

#### Service Unavailable (503)
- Check service status
- Switch to alternative provider
- Use cached responses
- Show degraded mode message

### Graceful Degradation Features
- Disable AI suggestions but keep core functionality
- Provide rule-based alternatives where possible
- Cache last 100 successful responses
- Allow manual override for critical features`,

  aiSafetyGuardrails: `## AI Safety Guardrails

### Input Validation
- **Prompt Injection Detection**
  - Block common injection patterns
  - Validate against whitelist of allowed instructions
  - Escape special characters
  - Length limits (max 10,000 characters)

- **Content Filtering**
  - Block inappropriate content (violence, adult, etc.)
  - Detect and reject hate speech
  - Filter personal information (SSN, credit cards)
  - Prevent jailbreak attempts

### Output Validation
- **Response Filtering**
  - Check for harmful content
  - Validate factual claims when possible
  - Redact any exposed PII
  - Block discriminatory language

- **Quality Checks**
  - Ensure response relevance
  - Check for hallucinations
  - Validate JSON/code syntax
  - Verify response completeness

### Safety Measures
- **Rate Limiting**
  - 100 requests per user per hour
  - 10 concurrent requests maximum
  - Graduated limits based on user tier

- **Monitoring & Alerts**
  - Log all requests and responses
  - Alert on suspicious patterns
  - Track safety metric trends
  - Human review queue for edge cases

### Compliance & Ethics
- Content moderation API integration
- Regular safety audits
- User feedback mechanism
- Transparency reports`,

  promptTemplates: `## Prompt Templates

### System Prompt
\`\`\`
You are a helpful AI assistant specialized in [domain].
Your responses should be:
- Accurate and factual
- Clear and concise
- Professional yet friendly
- Focused on user needs

Constraints:
- Do not provide medical, legal, or financial advice
- Always cite sources when making factual claims
- Admit uncertainty when you don't know something
- Refuse inappropriate or harmful requests
\`\`\`

### User Prompt Templates

#### Information Retrieval
\`\`\`
Context: {context}
Question: {user_question}
Instructions: Provide a clear, accurate answer based on the context. If the answer is not in the context, say so.
\`\`\`

#### Content Generation
\`\`\`
Task: {task_description}
Requirements:
- Tone: {tone}
- Length: {word_count}
- Format: {format}
- Key Points: {key_points}

Generate content that meets all requirements.
\`\`\`

#### Code Generation
\`\`\`
Language: {programming_language}
Task: {task_description}
Constraints:
- Follow {style_guide} conventions
- Include error handling
- Add comprehensive comments
- Optimize for readability

Generate complete, working code.
\`\`\`

### Few-Shot Examples
\`\`\`
Example 1:
Input: {example_input_1}
Output: {example_output_1}

Example 2:
Input: {example_input_2}
Output: {example_output_2}

Now process:
Input: {actual_input}
Output:
\`\`\``,

  dataRetentionPolicy: `## Data Retention Policy

### Conversation Data
- **Storage Duration**: 30 days for active sessions
- **Anonymization**: After 30 days, remove all PII
- **Archival**: Aggregate insights only after 90 days
- **Deletion**: Complete removal after 1 year

### User Controls
- **Data Access**: Users can export their data anytime
- **Data Deletion**: "Delete my data" option in settings
- **Opt-out**: Option to disable data storage entirely
- **Consent**: Explicit consent for data usage

### Compliance Requirements
#### GDPR (Europe)
- Right to access (data export)
- Right to erasure (data deletion)
- Right to rectification (data correction)
- Data portability (standard format export)

#### CCPA (California)
- Notice at collection
- Opt-out of sale
- Access and deletion rights
- Non-discrimination

### Data Handling
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Access Control**: Role-based, audit logged
- **Backup**: Encrypted backups with same retention
- **Monitoring**: Alert on unusual access patterns

### Training Data Usage
- User data is NOT used for model training
- Aggregate patterns only for product improvement
- Explicit opt-in for research participation
- Clear disclosure of any data sharing`,

  hallucinationPrevention: `## Hallucination Prevention Strategy

### Prevention Techniques

#### 1. Retrieval Augmented Generation (RAG)
- Connect to verified knowledge base
- Include source documents in context
- Cite sources in responses
- Confidence scoring for facts

#### 2. Response Validation
- Fact-check against knowledge base
- Cross-reference multiple sources
- Flag low-confidence statements
- Require citations for claims

#### 3. Prompt Engineering
\`\`\`
Instructions:
- Only provide information you're certain about
- Say "I don't know" when uncertain
- Cite sources for factual claims
- Distinguish between facts and opinions
- Do not make up information
\`\`\`

### Confidence Thresholds
- **High (>0.9)**: Present as fact
- **Medium (0.7-0.9)**: Present with qualifier ("likely", "probably")
- **Low (<0.7)**: Do not include or mark as uncertain

### Monitoring & Feedback
- Track hallucination rate per model/prompt
- User feedback on accuracy
- Regular accuracy audits
- Continuous prompt refinement

### Fallback Strategies
- When uncertain, provide multiple possibilities
- Suggest where to find authoritative information
- Offer to search for updated information
- Escalate to human review when needed`
}

// Helper function to apply templates
export function getAutoFixTemplate(ruleId: string): string | null {
  const templateMap: Record<string, string> = {
    'has-user-stories': LINTER_AUTO_FIX_TEMPLATES.userStories,
    'has-acceptance-criteria': LINTER_AUTO_FIX_TEMPLATES.acceptanceCriteria,
    'has-scope-definition': LINTER_AUTO_FIX_TEMPLATES.scopeDefinition,
    'has-success-metrics': LINTER_AUTO_FIX_TEMPLATES.successMetrics,
    'has-error-handling': LINTER_AUTO_FIX_TEMPLATES.errorHandling,
    'has-loading-states': LINTER_AUTO_FIX_TEMPLATES.loadingStates,
    'has-empty-states': LINTER_AUTO_FIX_TEMPLATES.emptyStates,
    'has-authentication': LINTER_AUTO_FIX_TEMPLATES.authenticationRequirements,
    'has-data-privacy': LINTER_AUTO_FIX_TEMPLATES.dataPrivacyPolicy,
    'has-performance-criteria': LINTER_AUTO_FIX_TEMPLATES.performanceRequirements,
    'ai-model-specification': LINTER_AUTO_FIX_TEMPLATES.aiModelSpecification,
    'ai-fallback-strategy': LINTER_AUTO_FIX_TEMPLATES.aiFallbackStrategy,
    'ai-safety-guardrails': LINTER_AUTO_FIX_TEMPLATES.aiSafetyGuardrails,
    'prompt-templates': LINTER_AUTO_FIX_TEMPLATES.promptTemplates,
    'ai-data-retention': LINTER_AUTO_FIX_TEMPLATES.dataRetentionPolicy,
    'ai-hallucination-prevention': LINTER_AUTO_FIX_TEMPLATES.hallucinationPrevention
  }
  
  return templateMap[ruleId] || null
}