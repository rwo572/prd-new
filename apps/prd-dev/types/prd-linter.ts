export interface ParsedPRD {
  content: string
  userStories?: string[]
  boundaries?: {
    hard: string[]
    soft: string[]
  }
  flows?: string[]
  edgeCases?: string[]
}

export interface AISuggestion {
  text: string
  confidence: number
  explanation: string
  id: string
}

export interface LintIssue {
  ruleId: string
  severity: 'error' | 'warning' | 'info' | 'suggestion'
  message: string
  line?: number
  column?: number
  startOffset?: number  // Character position in document
  endOffset?: number    // End character position
  matchedText?: string  // The actual text that triggered the issue
  suggestion?: string
  suggestions?: string[] // Multiple fix options
  aiSuggestions?: AISuggestion[] // AI-powered suggestions with confidence
  autoFixable?: boolean
  context?: string
  category?: string
  dismissed?: boolean // Whether user has dismissed this issue
}

export interface LintReport {
  score: number // 0-100
  issues: LintIssue[]
  stats: {
    errors: number
    warnings: number
    info: number
    suggestions: number
  }
  passedRules: string[]
  failedRules: string[]
  isAIProduct?: boolean
}

export interface PRDLintRule {
  id: string
  category: 'completeness' | 'clarity' | 'technical' | 'ux' | 'security'
  severity: 'error' | 'warning' | 'info' | 'suggestion'
  name: string
  description: string
  check: (prd: ParsedPRD) => LintIssue[]
}