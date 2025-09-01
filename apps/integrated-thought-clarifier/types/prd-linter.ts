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
  autoFixable?: boolean
  context?: string
  category?: string
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
}

export interface PRDLintRule {
  id: string
  category: 'completeness' | 'clarity' | 'technical' | 'ux' | 'security'
  severity: 'error' | 'warning' | 'info' | 'suggestion'
  name: string
  description: string
  check: (prd: ParsedPRD) => LintIssue[]
}