import { PRDLintRule, ParsedPRD, LintIssue } from '@/types/prd-linter'
import { AI_PRD_LINT_RULES, AI_AUTO_FIX_TEMPLATES } from './ai-prd-lint-rules'

// Combine standard and AI-specific rules
export const PRD_LINT_RULES: PRDLintRule[] = [
  // COMPLETENESS CHECKS
  {
    id: 'has-user-stories',
    category: 'completeness',
    severity: 'error',
    name: 'User Stories Required',
    description: 'PRD must include at least one user story',
    check: (prd: ParsedPRD) => {
      const userStoryPattern = /as\s+a\s+.+?,\s*i\s+want\s+.+?\s+so\s+that\s+.+?/gi
      const matches = prd.content.match(userStoryPattern)
      
      if (!matches || matches.length === 0) {
        return [{
          ruleId: 'has-user-stories',
          severity: 'error',
          message: 'No user stories found',
          suggestion: 'Add user stories in format: "As a [user], I want [feature] so that [benefit]"',
          category: 'completeness'
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
    description: 'PRD should include acceptance criteria',
    check: (prd: ParsedPRD) => {
      const keywords = ['acceptance criteria', 'given', 'when', 'then', 'success criteria']
      const hasAcceptance = keywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasAcceptance) {
        return [{
          ruleId: 'has-acceptance-criteria',
          severity: 'warning',
          message: 'No acceptance criteria specified',
          suggestion: 'Add acceptance criteria: Given [context], When [action], Then [outcome]',
          category: 'completeness'
        }]
      }
      return []
    }
  },
  
  // CLARITY CHECKS
  {
    id: 'no-ambiguous-terms',
    category: 'clarity',
    severity: 'warning',
    name: 'Avoid Ambiguous Terms',
    description: 'PRD should avoid vague terms',
    check: (prd: ParsedPRD) => {
      const ambiguousTerms = [
        { 
          term: 'etc', 
          message: 'Be explicit about all items',
          suggestions: [
            'and other similar features',
            'including X, Y, and Z',
            '(see complete list in appendix)'
          ]
        },
        { 
          term: 'various', 
          message: 'List specific options',
          suggestions: [
            'multiple options including',
            'the following options',
            'three different types'
          ]
        },
        { 
          term: 'some', 
          message: 'Specify exact quantity or criteria',
          suggestions: [
            'at least 3',
            'between 5-10',
            'a subset of users meeting criteria X'
          ]
        },
        { 
          term: 'appropriate', 
          message: 'Define what is appropriate',
          suggestions: [
            'meeting the following criteria',
            'conforming to standard X',
            'as defined in section Y'
          ]
        },
        { 
          term: 'should be fast', 
          message: 'Specify exact performance metrics',
          suggestions: [
            'should load in under 3 seconds',
            'should respond within 200ms',
            'should process 1000 requests/second'
          ]
        },
        { 
          term: 'user-friendly', 
          message: 'Define specific UX requirements',
          suggestions: [
            'accessible to users with disabilities (WCAG 2.1 AA)',
            'requiring no more than 3 clicks to complete core tasks',
            'with clear visual hierarchy and intuitive navigation'
          ]
        },
        { 
          term: 'intuitive', 
          message: 'Describe the expected behavior',
          suggestions: [
            'following common UI patterns (e.g., Material Design)',
            'with clear labels and helpful tooltips',
            'matching user mental models from similar apps'
          ]
        }
      ]
      
      const issues: LintIssue[] = []
      
      ambiguousTerms.forEach(({ term, message, suggestions }) => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi')
        let match
        while ((match = regex.exec(prd.content)) !== null) {
          // Calculate line and column
          const lines = prd.content.substring(0, match.index).split('\n')
          const line = lines.length
          const column = lines[lines.length - 1].length + 1
          
          issues.push({
            ruleId: 'no-ambiguous-terms',
            severity: 'warning',
            message: `Ambiguous term "${term}" found`,
            suggestion: message,
            suggestions: suggestions,
            category: 'clarity',
            startOffset: match.index,
            endOffset: match.index + term.length,
            matchedText: term,
            line: line,
            column: column,
            autoFixable: true
          })
        }
      })
      
      return issues
    }
  },
  
  {
    id: 'has-clear-scope',
    category: 'clarity',
    severity: 'info',
    name: 'Clear Scope Definition',
    description: 'PRD should clearly define what is in and out of scope',
    check: (prd: ParsedPRD) => {
      const scopeKeywords = ['scope', 'out of scope', 'not included', 'excluded', 'boundaries']
      const hasScope = scopeKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasScope) {
        return [{
          ruleId: 'has-clear-scope',
          severity: 'info',
          message: 'No explicit scope definition found',
          suggestion: 'Add sections: "In Scope:" and "Out of Scope:" to clarify boundaries',
          category: 'clarity'
        }]
      }
      return []
    }
  },
  
  // TECHNICAL CHECKS
  {
    id: 'has-performance-criteria',
    category: 'technical',
    severity: 'info',
    name: 'Performance Criteria',
    description: 'PRD should specify performance requirements',
    check: (prd: ParsedPRD) => {
      const perfKeywords = ['performance', 'latency', 'response time', 'load time', 'throughput', 'concurrent']
      const hasPerf = perfKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasPerf) {
        return [{
          ruleId: 'has-performance-criteria',
          severity: 'info',
          message: 'No performance criteria specified',
          suggestion: 'Add performance requirements: "Page load < 3s", "API response < 200ms", etc.',
          category: 'technical'
        }]
      }
      return []
    }
  },
  
  {
    id: 'has-data-requirements',
    category: 'technical',
    severity: 'warning',
    name: 'Data Requirements',
    description: 'PRD should specify data models and validation',
    check: (prd: ParsedPRD) => {
      const dataKeywords = ['data', 'field', 'validation', 'required', 'optional', 'format', 'type']
      const hasData = dataKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasData && prd.content.toLowerCase().includes('form')) {
        return [{
          ruleId: 'has-data-requirements',
          severity: 'warning',
          message: 'Form mentioned but no data requirements specified',
          suggestion: 'Define field types, validation rules, and required/optional fields',
          category: 'technical'
        }]
      }
      return []
    }
  },
  
  // UX CHECKS
  {
    id: 'has-error-handling',
    category: 'ux',
    severity: 'error',
    name: 'Error Handling Specified',
    description: 'PRD must describe error states and handling',
    check: (prd: ParsedPRD) => {
      const errorKeywords = ['error', 'fail', 'invalid', 'exception', 'wrong', 'mistake', 'retry']
      const hasErrorHandling = errorKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasErrorHandling) {
        return [{
          ruleId: 'has-error-handling',
          severity: 'error',
          message: 'No error handling specified',
          suggestion: 'Add error states: validation errors, network failures, server errors, etc.',
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
    description: 'PRD should specify loading and progress indicators',
    check: (prd: ParsedPRD) => {
      const loadingKeywords = ['loading', 'spinner', 'progress', 'skeleton', 'placeholder', 'pending']
      const hasLoading = loadingKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasLoading && prd.content.toLowerCase().includes('fetch')) {
        return [{
          ruleId: 'has-loading-states',
          severity: 'warning',
          message: 'Data fetching mentioned but no loading states specified',
          suggestion: 'Specify loading indicators: spinners, skeleton screens, progress bars',
          category: 'ux'
        }]
      }
      return []
    }
  },
  
  {
    id: 'has-empty-states',
    category: 'ux',
    severity: 'info',
    name: 'Empty States',
    description: 'PRD should specify empty state handling',
    check: (prd: ParsedPRD) => {
      const emptyKeywords = ['empty', 'no data', 'no results', 'not found', 'blank']
      const hasEmpty = emptyKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasEmpty && (prd.content.toLowerCase().includes('list') || prd.content.toLowerCase().includes('table'))) {
        return [{
          ruleId: 'has-empty-states',
          severity: 'info',
          message: 'Lists/tables mentioned but no empty states specified',
          suggestion: 'Define what to show when there is no data: helpful messages, action buttons',
          category: 'ux'
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
    description: 'PRD should include accessibility considerations',
    check: (prd: ParsedPRD) => {
      const a11yKeywords = ['accessibility', 'a11y', 'screen reader', 'keyboard', 'aria', 'wcag', 'color contrast']
      const hasA11y = a11yKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasA11y) {
        return [{
          ruleId: 'has-accessibility',
          severity: 'warning',
          message: 'No accessibility requirements specified',
          suggestion: 'Add: keyboard navigation, screen reader support, WCAG compliance level',
          category: 'ux'
        }]
      }
      return []
    }
  },
  
  // SECURITY CHECKS
  {
    id: 'has-auth-requirements',
    category: 'security',
    severity: 'warning',
    name: 'Authentication Requirements',
    description: 'PRD should specify authentication/authorization needs',
    check: (prd: ParsedPRD) => {
      const authKeywords = ['auth', 'login', 'permission', 'role', 'access control', 'public', 'private']
      const userKeywords = ['user', 'admin', 'member', 'guest']
      
      const hasAuth = authKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      const hasUsers = userKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasUsers && !hasAuth) {
        return [{
          ruleId: 'has-auth-requirements',
          severity: 'warning',
          message: 'Users mentioned but no authentication requirements',
          suggestion: 'Specify: Who can access? How do they authenticate? What are the roles?',
          category: 'security'
        }]
      }
      return []
    }
  },
  
  {
    id: 'has-data-privacy',
    category: 'security',
    severity: 'info',
    name: 'Data Privacy',
    description: 'PRD should address data privacy concerns',
    check: (prd: ParsedPRD) => {
      const privacyKeywords = ['privacy', 'personal', 'sensitive', 'pii', 'gdpr', 'encryption']
      const dataKeywords = ['email', 'phone', 'address', 'password', 'credit card', 'ssn']
      
      const hasPrivacy = privacyKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      const hasSensitiveData = dataKeywords.some(keyword =>
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasSensitiveData && !hasPrivacy) {
        return [{
          ruleId: 'has-data-privacy',
          severity: 'info',
          message: 'Sensitive data mentioned but no privacy requirements',
          suggestion: 'Specify data retention, encryption, and compliance requirements',
          category: 'security'
        }]
      }
      return []
    }
  }
]

// Merge AI-specific rules with standard rules
export const ALL_LINT_RULES = [...PRD_LINT_RULES, ...AI_PRD_LINT_RULES]

// Combine all auto-fix templates
export const AUTO_FIX_TEMPLATES = {
  ...AI_AUTO_FIX_TEMPLATES,
  'has-error-handling': `
## Error Handling

### Validation Errors
- Show inline error messages below invalid fields
- Highlight invalid fields with red border
- Provide specific error messages (e.g., "Email must be valid format")

### Network Errors
- Display: "Connection error. Please check your internet and try again."
- Provide retry button
- Preserve user input

### Server Errors
- Display: "Something went wrong. Please try again later."
- Log error details for debugging
- Optionally show error code for support

### Rate Limiting
- Display: "Too many requests. Please wait before trying again."
- Show countdown timer if applicable`,
  
  'has-loading-states': `
## Loading States

### Initial Load
- Show skeleton screen matching content layout
- Display loading spinner after 500ms if still loading

### Action Feedback
- Disable submit buttons during processing
- Show inline spinner next to action
- Update button text (e.g., "Saving..." instead of "Save")

### Data Refresh
- Show subtle loading indicator without hiding existing content
- Use optimistic updates where appropriate`,
  
  'has-empty-states': `
## Empty States

### No Data
- Display friendly message: "No items yet"
- Show illustration or icon
- Provide action button to create first item

### Search No Results
- Display: "No results found for '[query]'"
- Suggest checking spelling or trying different terms
- Provide button to clear search`
}