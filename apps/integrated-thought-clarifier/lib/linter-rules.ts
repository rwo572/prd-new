import { PRDLintRule, ParsedPRD, LintIssue } from '@/types/prd-linter'

// Helper function to find text position in content
function findTextPosition(
  content: string, 
  searchTerm: string, 
  caseInsensitive = true
): { startOffset: number; endOffset: number; line: number; column: number; matchedText: string } | null {
  const searchContent = caseInsensitive ? content.toLowerCase() : content
  const searchFor = caseInsensitive ? searchTerm.toLowerCase() : searchTerm
  const index = searchContent.indexOf(searchFor)
  
  if (index === -1) return null
  
  const lines = content.substring(0, index).split('\n')
  const line = lines.length
  const column = lines[lines.length - 1].length + 1
  
  // Get the actual matched text from original content
  const matchedText = content.substring(index, index + searchTerm.length)
  
  return {
    startOffset: index,
    endOffset: index + searchTerm.length,
    line,
    column,
    matchedText
  }
}

// Helper to find multiple occurrences
function findAllOccurrences(
  content: string, 
  searchTerm: string, 
  caseInsensitive = true
): Array<{ startOffset: number; endOffset: number; line: number; column: number; matchedText: string }> {
  const results = []
  const searchContent = caseInsensitive ? content.toLowerCase() : content
  const searchFor = caseInsensitive ? searchTerm.toLowerCase() : searchTerm
  
  let index = searchContent.indexOf(searchFor)
  let processedLength = 0
  
  while (index !== -1) {
    const absoluteIndex = processedLength + index
    const lines = content.substring(0, absoluteIndex).split('\n')
    const line = lines.length
    const column = lines[lines.length - 1].length + 1
    const matchedText = content.substring(absoluteIndex, absoluteIndex + searchTerm.length)
    
    results.push({
      startOffset: absoluteIndex,
      endOffset: absoluteIndex + searchTerm.length,
      line,
      column,
      matchedText
    })
    
    processedLength = absoluteIndex + searchTerm.length
    index = searchContent.substring(processedLength).indexOf(searchFor)
  }
  
  return results
}

// ==================== COMPLETENESS RULES ====================
export const COMPLETENESS_RULES: PRDLintRule[] = [
  {
    id: 'has-user-stories',
    category: 'completeness',
    severity: 'error',
    name: 'User Stories Required',
    description: 'PRD must include at least one properly formatted user story',
    check: (prd: ParsedPRD) => {
      const userStoryPattern = /as\s+a\s+.+?,\s*i\s+(want|need)\s+.+?\s+so\s+that\s+.+?/gi
      const matches = prd.content.match(userStoryPattern)
      
      if (!matches || matches.length === 0) {
        const position = findTextPosition(prd.content, 'user stor') || 
                         findTextPosition(prd.content, 'requirement') ||
                         findTextPosition(prd.content, 'feature') ||
                         { startOffset: 0, endOffset: 50, line: 1, column: 1, matchedText: '' }
        
        return [{
          ruleId: 'has-user-stories',
          severity: 'error',
          message: 'No user stories found. User stories help clarify who needs what and why.',
          suggestion: 'Add user stories in format: "As a [user type], I want [feature] so that [benefit]"',
          suggestions: [
            'As a product manager, I want to generate PRDs quickly so that I can focus on strategic work',
            'As a developer, I want clear requirements so that I can build the right features',
            'As a stakeholder, I want to review PRDs easily so that I can provide timely feedback'
          ],
          category: 'completeness',
          autoFixable: true,
          ...position
        }]
      }
      return []
    }
  },
  
  {
    id: 'has-acceptance-criteria',
    category: 'completeness',
    severity: 'warning',
    name: 'Acceptance Criteria',
    description: 'PRD should include testable acceptance criteria',
    check: (prd: ParsedPRD) => {
      const keywords = ['acceptance criteria', 'given', 'when', 'then', 'success criteria', 'definition of done']
      const hasAcceptance = keywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasAcceptance) {
        const position = findTextPosition(prd.content, 'requirement') ||
                         findTextPosition(prd.content, 'feature') ||
                         { startOffset: 0, endOffset: 50, line: 1, column: 1, matchedText: '' }
        
        return [{
          ruleId: 'has-acceptance-criteria',
          severity: 'warning',
          message: 'No acceptance criteria specified. Clear criteria ensure features meet expectations.',
          suggestion: 'Add acceptance criteria using Given/When/Then format',
          suggestions: [
            'Given [initial context], When [action taken], Then [expected outcome]',
            'GIVEN a user is logged in, WHEN they click submit, THEN the form is saved',
            'Success Criteria:\n- [ ] Feature works on mobile\n- [ ] Page loads in <2s\n- [ ] All tests pass'
          ],
          category: 'completeness',
          autoFixable: true,
          ...position
        }]
      }
      return []
    }
  },

  {
    id: 'has-scope-definition',
    category: 'completeness',
    severity: 'warning',
    name: 'Scope Definition',
    description: 'PRD should explicitly define what is in and out of scope',
    check: (prd: ParsedPRD) => {
      const scopeKeywords = ['in scope', 'out of scope', 'scope', 'boundaries', 'includes', 'excludes']
      const hasScope = scopeKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasScope) {
        return [{
          ruleId: 'has-scope-definition',
          severity: 'warning',
          message: 'No explicit scope definition found',
          suggestion: 'Define what is in scope and out of scope',
          suggestions: [
            '## In Scope\n- Feature A\n- Integration with Service B\n\n## Out of Scope\n- Mobile app (future phase)\n- Legacy system migration',
            '### Scope\n**Included:** Core functionality, API integration\n**Excluded:** Advanced analytics, third-party plugins',
            '### MVP Scope\n- Essential features only\n- Desktop web only\n- English language only'
          ],
          category: 'completeness',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'has-success-metrics',
    category: 'completeness',
    severity: 'info',
    name: 'Success Metrics',
    description: 'PRD should define measurable success metrics',
    check: (prd: ParsedPRD) => {
      const metricsKeywords = ['metric', 'kpi', 'measure', 'success metric', 'goal', 'target', 'benchmark']
      const hasMetrics = metricsKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasMetrics) {
        return [{
          ruleId: 'has-success-metrics',
          severity: 'info',
          message: 'No success metrics defined',
          suggestion: 'Add measurable success metrics',
          suggestions: [
            '## Success Metrics\n- User adoption: 80% within 3 months\n- Performance: <2s page load\n- Error rate: <1%',
            '### KPIs\n- Daily Active Users (DAU): 10,000\n- User Satisfaction (NPS): >50\n- Feature Adoption Rate: 60%',
            '### Goals\n- Reduce time to complete task by 50%\n- Increase conversion rate by 20%\n- Achieve 99.9% uptime'
          ],
          category: 'completeness',
          autoFixable: true
        }]
      }
      return []
    }
  }
]

// ==================== CLARITY RULES ====================
export const CLARITY_RULES: PRDLintRule[] = [
  {
    id: 'no-ambiguous-terms',
    category: 'clarity',
    severity: 'warning',
    name: 'Avoid Ambiguous Terms',
    description: 'PRD should avoid vague or ambiguous language',
    check: (prd: ParsedPRD) => {
      const ambiguousTerms = [
        { term: 'etc', suggestion: 'List all specific items instead of using "etc"' },
        { term: 'various', suggestion: 'Specify exactly which items or options' },
        { term: 'some', suggestion: 'Quantify the exact number or percentage' },
        { term: 'maybe', suggestion: 'Make a clear decision or mark as "to be determined"' },
        { term: 'should', suggestion: 'Use "must" for requirements or "may" for optional features' },
        { term: 'fast', suggestion: 'Specify exact performance metrics (e.g., "<2 seconds")' },
        { term: 'slow', suggestion: 'Define specific performance thresholds' },
        { term: 'big', suggestion: 'Provide specific size or scale measurements' },
        { term: 'small', suggestion: 'Provide specific size constraints' },
        { term: 'user-friendly', suggestion: 'Define specific UX requirements or usability metrics' },
        { term: 'intuitive', suggestion: 'Specify exact UX patterns or behaviors' },
        { term: 'modern', suggestion: 'Reference specific design systems or patterns' },
        { term: 'secure', suggestion: 'List specific security requirements (encryption, auth, etc.)' },
        { term: 'scalable', suggestion: 'Define specific scalability targets (users, requests/sec, etc.)' }
      ]
      
      const issues: LintIssue[] = []
      
      ambiguousTerms.forEach(({ term, suggestion }) => {
        const occurrences = findAllOccurrences(prd.content, term)
        occurrences.forEach(position => {
          // Check if it's a standalone word (not part of another word)
          const beforeChar = position.startOffset > 0 ? prd.content[position.startOffset - 1] : ' '
          const afterChar = position.endOffset < prd.content.length ? prd.content[position.endOffset] : ' '
          
          if (/\W/.test(beforeChar) && /\W/.test(afterChar)) {
            issues.push({
              ruleId: 'no-ambiguous-terms',
              severity: 'warning',
              message: `Ambiguous term "${term}" found`,
              suggestion,
              category: 'clarity',
              ...position
            })
          }
        })
      })
      
      return issues
    }
  },

  {
    id: 'quantifiable-metrics',
    category: 'clarity',
    severity: 'warning',
    name: 'Quantifiable Metrics',
    description: 'Performance requirements should have specific values',
    check: (prd: ParsedPRD) => {
      const performanceTerms = ['performance', 'speed', 'load time', 'response time', 'latency']
      const issues: LintIssue[] = []
      
      performanceTerms.forEach(term => {
        const positions = findAllOccurrences(prd.content, term)
        positions.forEach(position => {
          // Check if there's a number nearby (within 50 characters)
          const contextStart = Math.max(0, position.startOffset - 50)
          const contextEnd = Math.min(prd.content.length, position.endOffset + 50)
          const context = prd.content.substring(contextStart, contextEnd)
          
          if (!/\d+\s*(ms|s|seconds|milliseconds|%|MB|GB|KB)/.test(context)) {
            issues.push({
              ruleId: 'quantifiable-metrics',
              severity: 'warning',
              message: `"${term}" mentioned without specific metrics`,
              suggestion: 'Add specific performance targets',
              suggestions: [
                'Page load time: <2 seconds on 3G connection',
                'API response time: <200ms for 95th percentile',
                'Memory usage: <100MB on mobile devices'
              ],
              category: 'clarity',
              ...position
            })
          }
        })
      })
      
      return issues
    }
  },

  {
    id: 'concrete-examples',
    category: 'clarity',
    severity: 'info',
    name: 'Concrete Examples',
    description: 'Abstract concepts should include concrete examples',
    check: (prd: ParsedPRD) => {
      const abstractTerms = ['workflow', 'process', 'integration', 'functionality', 'feature']
      const exampleKeywords = ['example', 'e.g.', 'for instance', 'such as', 'like']
      const issues: LintIssue[] = []
      
      abstractTerms.forEach(term => {
        const positions = findAllOccurrences(prd.content, term)
        positions.forEach(position => {
          // Check if there's an example nearby
          const contextStart = Math.max(0, position.startOffset - 100)
          const contextEnd = Math.min(prd.content.length, position.endOffset + 100)
          const context = prd.content.substring(contextStart, contextEnd).toLowerCase()
          
          const hasExample = exampleKeywords.some(keyword => context.includes(keyword))
          
          if (!hasExample) {
            issues.push({
              ruleId: 'concrete-examples',
              severity: 'info',
              message: `"${term}" mentioned without concrete examples`,
              suggestion: 'Add specific examples to clarify',
              category: 'clarity',
              ...position
            })
          }
        })
      })
      
      return issues
    }
  }
]

// ==================== TECHNICAL RULES ====================
export const TECHNICAL_RULES: PRDLintRule[] = [
  {
    id: 'has-performance-criteria',
    category: 'technical',
    severity: 'warning',
    name: 'Performance Criteria',
    description: 'PRD should specify performance requirements',
    check: (prd: ParsedPRD) => {
      const perfKeywords = ['performance', 'load time', 'response time', 'latency', 'throughput']
      const hasPerfCriteria = perfKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasPerfCriteria) {
        return [{
          ruleId: 'has-performance-criteria',
          severity: 'warning',
          message: 'No performance criteria specified',
          suggestion: 'Add specific performance requirements',
          suggestions: [
            '## Performance Requirements\n- Page load: <2s\n- API response: <200ms\n- Database queries: <50ms',
            '### Performance Targets\n- Support 10,000 concurrent users\n- 99.9% uptime SLA\n- <1% error rate',
            '### Speed Requirements\n- Initial load: <3s on 3G\n- Interactions: <100ms feedback\n- Search results: <500ms'
          ],
          category: 'technical',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'has-data-requirements',
    category: 'technical',
    severity: 'info',
    name: 'Data Requirements',
    description: 'PRD should define data models and validation rules',
    check: (prd: ParsedPRD) => {
      const dataKeywords = ['data model', 'schema', 'field', 'validation', 'data type', 'database']
      const hasDataReqs = dataKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasDataReqs && prd.content.toLowerCase().includes('data')) {
        return [{
          ruleId: 'has-data-requirements',
          severity: 'info',
          message: 'Data mentioned but no data requirements specified',
          suggestion: 'Define data models and validation rules',
          suggestions: [
            '## Data Model\n```\nUser {\n  id: UUID\n  email: string (required, unique)\n  name: string (required)\n  createdAt: timestamp\n}\n```',
            '### Field Validation\n- Email: Valid email format\n- Password: Min 8 chars, 1 uppercase, 1 number\n- Phone: E.164 format',
            '### Data Storage\n- Database: PostgreSQL\n- Cache: Redis\n- Files: S3'
          ],
          category: 'technical',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'has-api-specifications',
    category: 'technical',
    severity: 'info',
    name: 'API Specifications',
    description: 'PRD should define API endpoints when applicable',
    check: (prd: ParsedPRD) => {
      const apiKeywords = ['api', 'endpoint', 'rest', 'graphql', 'webhook', 'integration']
      const hasApiMention = apiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasApiMention) {
        const specKeywords = ['post', 'get', 'put', 'delete', 'patch', 'request', 'response']
        const hasApiSpec = specKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasApiSpec) {
          return [{
            ruleId: 'has-api-specifications',
            severity: 'info',
            message: 'API mentioned but no specifications provided',
            suggestion: 'Define API endpoints and contracts',
            suggestions: [
              '## API Endpoints\n```\nPOST /api/users\nGET /api/users/:id\nPUT /api/users/:id\nDELETE /api/users/:id\n```',
              '### API Contract\n```json\n{\n  "endpoint": "/api/resource",\n  "method": "POST",\n  "request": {},\n  "response": {}\n}\n```',
              '### Integration Points\n- Authentication: OAuth 2.0\n- Rate Limiting: 100 req/min\n- Format: JSON'
            ],
            category: 'technical',
            autoFixable: true
          }]
        }
      }
      return []
    }
  }
]

// ==================== UX RULES ====================
export const UX_RULES: PRDLintRule[] = [
  {
    id: 'has-error-handling',
    category: 'ux',
    severity: 'error',
    name: 'Error Handling',
    description: 'PRD must specify how errors are handled',
    check: (prd: ParsedPRD) => {
      const errorKeywords = ['error', 'exception', 'fail', 'invalid', 'incorrect']
      const hasErrorMention = errorKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasErrorMention) {
        return [{
          ruleId: 'has-error-handling',
          severity: 'error',
          message: 'No error handling specified',
          suggestion: 'Define how the system handles errors',
          suggestions: [
            '## Error Handling\n- Network errors: Show retry button\n- Validation errors: Inline field messages\n- System errors: Fallback to cached data',
            '### Error States\n- 400: Show validation messages\n- 404: Display "not found" page\n- 500: Show friendly error with support contact',
            '### Error Recovery\n- Auto-retry failed requests (3x)\n- Save draft on error\n- Provide manual refresh option'
          ],
          category: 'ux',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'has-loading-states',
    category: 'ux',
    severity: 'warning',
    name: 'Loading States',
    description: 'PRD should define loading indicators',
    check: (prd: ParsedPRD) => {
      const loadingKeywords = ['loading', 'spinner', 'skeleton', 'progress', 'pending']
      const hasLoadingStates = loadingKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasLoadingStates) {
        return [{
          ruleId: 'has-loading-states',
          severity: 'warning',
          message: 'No loading states defined',
          suggestion: 'Specify loading indicators for async operations',
          suggestions: [
            '## Loading States\n- Initial load: Full-page skeleton\n- Data fetch: Inline spinner\n- File upload: Progress bar with percentage',
            '### Loading Indicators\n- <100ms: No indicator\n- 100ms-1s: Spinner\n- >1s: Progress bar',
            '### Skeleton Screens\n- Show content structure\n- Animate shimmer effect\n- Match actual content layout'
          ],
          category: 'ux',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'has-empty-states',
    category: 'ux',
    severity: 'warning',
    name: 'Empty States',
    description: 'PRD should define empty/no-data scenarios',
    check: (prd: ParsedPRD) => {
      const emptyKeywords = ['empty', 'no data', 'no results', 'blank', 'zero state']
      const hasEmptyStates = emptyKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasEmptyStates) {
        return [{
          ruleId: 'has-empty-states',
          severity: 'warning',
          message: 'No empty states defined',
          suggestion: 'Define what users see when there is no data',
          suggestions: [
            '## Empty States\n- No results: "No items found. Try adjusting filters."\n- First time: "Welcome! Create your first item."\n- Error: "Unable to load. Please try again."',
            '### Zero State Design\n- Illustration or icon\n- Helpful message\n- Call-to-action button',
            '### No Data Scenarios\n- Search: Suggest alternatives\n- List: Show onboarding\n- Dashboard: Display tutorial'
          ],
          category: 'ux',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'has-accessibility',
    category: 'ux',
    severity: 'warning',
    name: 'Accessibility Requirements',
    description: 'PRD should specify accessibility standards',
    check: (prd: ParsedPRD) => {
      const a11yKeywords = ['accessibility', 'wcag', 'aria', 'screen reader', 'keyboard', 'a11y']
      const hasA11y = a11yKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasA11y) {
        return [{
          ruleId: 'has-accessibility',
          severity: 'warning',
          message: 'No accessibility requirements specified',
          suggestion: 'Define accessibility standards and requirements',
          suggestions: [
            '## Accessibility Requirements\n- WCAG 2.1 AA compliance\n- Full keyboard navigation\n- Screen reader support\n- Color contrast ratio ≥4.5:1',
            '### Accessibility Standards\n- Alt text for all images\n- ARIA labels for interactive elements\n- Focus indicators visible\n- Semantic HTML structure',
            '### Inclusive Design\n- Support keyboard-only users\n- Provide text alternatives\n- Ensure sufficient contrast\n- Test with screen readers'
          ],
          category: 'ux',
          autoFixable: true
        }]
      }
      return []
    }
  }
]

// ==================== SECURITY RULES ====================
export const SECURITY_RULES: PRDLintRule[] = [
  {
    id: 'has-authentication',
    category: 'security',
    severity: 'error',
    name: 'Authentication Requirements',
    description: 'PRD must specify authentication when users are mentioned',
    check: (prd: ParsedPRD) => {
      const userKeywords = ['user', 'account', 'profile', 'member', 'customer']
      const hasUsers = userKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasUsers) {
        const authKeywords = ['authentication', 'auth', 'login', 'sign in', 'oauth', 'sso']
        const hasAuth = authKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasAuth) {
          return [{
            ruleId: 'has-authentication',
            severity: 'error',
            message: 'Users mentioned but no authentication specified',
            suggestion: 'Define authentication requirements',
            suggestions: [
              '## Authentication\n- Method: OAuth 2.0 with Google/GitHub\n- MFA: Optional TOTP\n- Session: JWT with 24h expiry',
              '### Auth Requirements\n- Email/password with email verification\n- Password requirements: 8+ chars, mixed case, numbers\n- Account lockout after 5 failed attempts',
              '### SSO Integration\n- SAML 2.0 for enterprise\n- OAuth for social login\n- Magic links for passwordless'
            ],
            category: 'security',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'has-data-privacy',
    category: 'security',
    severity: 'warning',
    name: 'Data Privacy',
    description: 'PRD should address data privacy when handling user data',
    check: (prd: ParsedPRD) => {
      const dataKeywords = ['personal', 'email', 'phone', 'address', 'payment', 'sensitive']
      const hasPersonalData = dataKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasPersonalData) {
        const privacyKeywords = ['privacy', 'gdpr', 'ccpa', 'encryption', 'anonymize', 'data protection']
        const hasPrivacy = privacyKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasPrivacy) {
          return [{
            ruleId: 'has-data-privacy',
            severity: 'warning',
            message: 'Personal data mentioned but no privacy requirements',
            suggestion: 'Define data privacy and protection measures',
            suggestions: [
              '## Data Privacy\n- Encryption: AES-256 at rest, TLS 1.3 in transit\n- PII handling: Minimize collection, anonymize logs\n- Compliance: GDPR, CCPA',
              '### Privacy Requirements\n- User consent for data collection\n- Right to deletion (GDPR)\n- Data portability\n- Audit logging',
              '### Data Protection\n- Encrypt sensitive fields\n- Mask PII in logs\n- Secure key management\n- Regular security audits'
            ],
            category: 'security',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'has-authorization',
    category: 'security',
    severity: 'warning',
    name: 'Authorization & Access Control',
    description: 'PRD should define role-based access control when applicable',
    check: (prd: ParsedPRD) => {
      const roleKeywords = ['role', 'permission', 'admin', 'manager', 'access', 'authorize']
      const hasRoles = roleKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasRoles) {
        const authzKeywords = ['rbac', 'authorization', 'access control', 'permission']
        const hasAuthz = authzKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasAuthz) {
          return [{
            ruleId: 'has-authorization',
            severity: 'warning',
            message: 'Roles mentioned but no authorization rules defined',
            suggestion: 'Define role-based access control',
            suggestions: [
              '## Authorization\n- Admin: Full access\n- Manager: Read/write own team\n- User: Read/write own data\n- Guest: Read-only public data',
              '### RBAC Matrix\n| Role | Create | Read | Update | Delete |\n|------|--------|------|--------|--------|\n| Admin | ✓ | ✓ | ✓ | ✓ |\n| User | Own | Own | Own | Own |',
              '### Permission Model\n- Resource-based permissions\n- Hierarchical roles\n- Custom permission sets\n- API key scopes'
            ],
            category: 'security',
            autoFixable: true
          }]
        }
      }
      return []
    }
  }
]

// ==================== AI-NATIVE RULES ====================
export const AI_NATIVE_RULES: PRDLintRule[] = [
  // Model & Architecture
  {
    id: 'ai-model-specification',
    category: 'technical',
    severity: 'error',
    name: 'AI Model Specification',
    description: 'AI products must specify which models to use',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'llm', 'machine learning', 'ml', 'artificial intelligence']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const modelKeywords = ['gpt-4', 'gpt-3.5', 'claude', 'gemini', 'llama', 'mistral', 'model']
        const hasModel = modelKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasModel) {
          return [{
            ruleId: 'ai-model-specification',
            severity: 'error',
            message: 'AI product detected but no model specified',
            suggestion: 'Specify which AI models to use',
            suggestions: [
              '## AI Models\n- Primary: GPT-4o (complex reasoning)\n- Secondary: GPT-4o-mini (cost-effective)\n- Fallback: GPT-3.5-turbo',
              '### Model Selection\n- Text Generation: Claude 3.5 Sonnet\n- Code Generation: GPT-4\n- Embeddings: text-embedding-3-small',
              '### Model Configuration\n- Model: GPT-4\n- Temperature: 0.7\n- Max Tokens: 2000\n- Top P: 0.9'
            ],
            category: 'technical',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'ai-fallback-strategy',
    category: 'technical',
    severity: 'warning',
    name: 'AI Fallback Strategy',
    description: 'Define fallback behavior when AI fails',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'llm', 'model', 'gpt', 'claude']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const fallbackKeywords = ['fallback', 'degradation', 'offline', 'unavailable', 'error handling']
        const hasFallback = fallbackKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasFallback) {
          return [{
            ruleId: 'ai-fallback-strategy',
            severity: 'warning',
            message: 'No AI fallback strategy defined',
            suggestion: 'Define what happens when AI is unavailable',
            suggestions: [
              '## Fallback Strategy\n- Primary failure: Switch to secondary model\n- All models down: Use cached responses\n- Rate limited: Queue and retry',
              '### Graceful Degradation\n1. Try primary model (GPT-4)\n2. Fallback to GPT-3.5\n3. Use rule-based logic\n4. Show manual input option',
              '### Error Handling\n- Timeout: 30s then fallback\n- Rate limit: Exponential backoff\n- Invalid response: Retry with temperature 0'
            ],
            category: 'technical',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'ai-context-management',
    category: 'technical',
    severity: 'info',
    name: 'Context Window Management',
    description: 'Define how to handle token limits',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'llm', 'conversation', 'chat', 'context']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const contextKeywords = ['token', 'context window', 'context limit', 'truncate', 'summarize']
        const hasContext = contextKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasContext) {
          return [{
            ruleId: 'ai-context-management',
            severity: 'info',
            message: 'No context window management strategy',
            suggestion: 'Define how to handle token limits',
            suggestions: [
              '## Context Management\n- Max context: 8000 tokens\n- Reserve 2000 for response\n- Truncate oldest messages first',
              '### Token Limits\n- GPT-4: 8k context\n- Summary after 5 messages\n- Keep system prompt always',
              '### Context Strategy\n- Sliding window: Last 10 messages\n- Summarize older context\n- Priority: Recent > Important > Old'
            ],
            category: 'technical',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  // Safety & Ethics
  {
    id: 'ai-safety-guardrails',
    category: 'security',
    severity: 'error',
    name: 'AI Safety Guardrails',
    description: 'Must define content moderation and safety measures',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'llm', 'generate', 'content', 'response']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const safetyKeywords = ['safety', 'moderation', 'filter', 'harmful', 'inappropriate', 'guardrail']
        const hasSafety = safetyKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasSafety) {
          return [{
            ruleId: 'ai-safety-guardrails',
            severity: 'error',
            message: 'No AI safety guardrails defined',
            suggestion: 'Define content moderation and safety measures',
            suggestions: [
              '## Safety Guardrails\n- Content filtering: Block harmful/inappropriate\n- Input validation: Prevent prompt injection\n- Output monitoring: Flag concerning responses',
              '### Content Moderation\n- Pre-filter: Check inputs for harmful content\n- Post-filter: Validate AI responses\n- Human review: Flag edge cases',
              '### Safety Measures\n- Rate limiting per user\n- Prompt injection detection\n- PII redaction\n- Toxicity scoring'
            ],
            category: 'security',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'ai-bias-mitigation',
    category: 'security',
    severity: 'warning',
    name: 'Bias Mitigation',
    description: 'Address fairness and inclusivity',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'llm', 'model', 'recommendation', 'decision']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const biasKeywords = ['bias', 'fairness', 'inclusive', 'diverse', 'equity']
        const hasBias = biasKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasBias) {
          return [{
            ruleId: 'ai-bias-mitigation',
            severity: 'warning',
            message: 'No bias mitigation strategy',
            suggestion: 'Address fairness and inclusivity concerns',
            suggestions: [
              '## Bias Mitigation\n- Test with diverse inputs\n- Monitor for biased outputs\n- Regular bias audits\n- Inclusive prompt design',
              '### Fairness Measures\n- Demographic parity checks\n- Outcome equality monitoring\n- Diverse test datasets\n- Bias detection tools',
              '### Inclusive Design\n- Gender-neutral language\n- Cultural sensitivity\n- Accessibility first\n- Multi-language support'
            ],
            category: 'security',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'ai-transparency',
    category: 'ux',
    severity: 'warning',
    name: 'AI Transparency',
    description: 'Users must know they are interacting with AI',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'bot', 'assistant', 'automated', 'generated']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const transparencyKeywords = ['disclosure', 'transparency', 'ai-generated', 'automated', 'bot']
        const hasTransparency = transparencyKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasTransparency) {
          return [{
            ruleId: 'ai-transparency',
            severity: 'warning',
            message: 'No AI transparency requirements',
            suggestion: 'Ensure users know they are interacting with AI',
            suggestions: [
              '## AI Transparency\n- Clear AI disclosure in UI\n- "AI-generated" labels\n- Explanation of AI limitations\n- Human review options',
              '### User Disclosure\n- Initial message: "You are chatting with an AI"\n- AI badge on responses\n- Disclaimer about accuracy',
              '### Transparency Features\n- Show confidence scores\n- Explain AI decisions\n- Provide sources\n- Allow feedback'
            ],
            category: 'ux',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  // Performance & Cost
  {
    id: 'ai-latency-requirements',
    category: 'technical',
    severity: 'warning',
    name: 'AI Latency Requirements',
    description: 'Define acceptable AI response times',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'llm', 'response', 'generation', 'inference']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const latencyKeywords = ['latency', 'response time', 'speed', 'performance', 'streaming']
        const hasLatency = latencyKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasLatency) {
          return [{
            ruleId: 'ai-latency-requirements',
            severity: 'warning',
            message: 'No AI latency requirements specified',
            suggestion: 'Define acceptable response times',
            suggestions: [
              '## Latency Requirements\n- First token: <1s\n- Full response: <10s\n- Streaming: Start within 500ms',
              '### Performance Targets\n- Chat response: <2s first token\n- Code generation: <5s\n- Search: <1s',
              '### Optimization\n- Use streaming responses\n- Cache common queries\n- Parallel processing\n- Edge deployment'
            ],
            category: 'technical',
            autoFixable: true
          }]
        }
      }
      return []
    }
  },

  {
    id: 'ai-cost-estimation',
    category: 'technical',
    severity: 'info',
    name: 'AI Cost Estimation',
    description: 'Estimate API costs per user',
    check: (prd: ParsedPRD) => {
      const aiKeywords = ['ai', 'api', 'gpt', 'claude', 'model']
      const isAIProduct = aiKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (isAIProduct) {
        const costKeywords = ['cost', 'pricing', 'budget', 'token', 'usage']
        const hasCost = costKeywords.some(keyword => 
          prd.content.toLowerCase().includes(keyword)
        )
        
        if (!hasCost) {
          return [{
            ruleId: 'ai-cost-estimation',
            severity: 'info',
            message: 'No AI cost estimation provided',
            suggestion: 'Estimate API costs per user/month',
            suggestions: [
              '## Cost Estimation\n- Avg tokens/request: 1000\n- Requests/user/day: 50\n- Cost/user/month: $5-10',
              '### API Budget\n- GPT-4: $0.03/1k tokens\n- Target: <$10/user/month\n- Optimization: Cache 30% of responses',
              '### Cost Controls\n- Daily limits per user\n- Tier-based access\n- Cost alerts at 80%\n- Fallback to cheaper models'
            ],
            category: 'technical',
            autoFixable: true
          }]
        }
      }
      return []
    }
  }
]

// Combine all rules
export const ALL_LINTER_RULES: PRDLintRule[] = [
  ...COMPLETENESS_RULES,
  ...CLARITY_RULES,
  ...TECHNICAL_RULES,
  ...UX_RULES,
  ...SECURITY_RULES,
  ...AI_NATIVE_RULES
]

// Export rule counts for metrics
export const RULE_COUNTS = {
  completeness: COMPLETENESS_RULES.length,
  clarity: CLARITY_RULES.length,
  technical: TECHNICAL_RULES.length + AI_NATIVE_RULES.filter(r => r.category === 'technical').length,
  ux: UX_RULES.length + AI_NATIVE_RULES.filter(r => r.category === 'ux').length,
  security: SECURITY_RULES.length + AI_NATIVE_RULES.filter(r => r.category === 'security').length,
  total: ALL_LINTER_RULES.length
}