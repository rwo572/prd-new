import { LintIssue, LintReport } from '@/types/prd-linter'

// Scoring weights for different severity levels
const SEVERITY_WEIGHTS = {
  error: 15,
  warning: 10,
  info: 5,
  suggestion: 2
}

// Category importance weights (out of 100)
const CATEGORY_WEIGHTS = {
  completeness: 25,
  clarity: 20,
  technical: 20,
  ux: 20,
  security: 15
}

// AI-specific rule weights for AI readiness scoring
const AI_CRITICAL_RULES = {
  'ai-model-specification': 15,
  'ai-safety-guardrails': 15,
  'ai-data-retention': 12,
  'ai-hallucination-prevention': 12,
  'ai-fallback-strategy': 10,
  'ai-transparency': 8,
  'ai-bias-mitigation': 8,
  'ai-latency-requirements': 6,
  'ai-context-management': 6,
  'ai-cost-estimation': 4,
  'prompt-templates': 4
}

export interface ScoringResult {
  overallScore: number
  categoryScores: Record<string, number>
  aiReadinessScore?: number
  scoreBreakdown: {
    possiblePoints: number
    deductedPoints: number
    bonusPoints: number
  }
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  gradeColor: string
  isProductionReady: boolean
}

/**
 * Calculate comprehensive quality score for PRD
 */
export function calculateQualityScore(
  issues: LintIssue[],
  totalRules: number,
  isAIProduct: boolean = false
): ScoringResult {
  // Initialize scoring
  let baseScore = 100
  const categoryIssues: Record<string, LintIssue[]> = {
    completeness: [],
    clarity: [],
    technical: [],
    ux: [],
    security: []
  }
  
  // Group issues by category
  issues.forEach(issue => {
    if (issue.category && !issue.dismissed) {
      const category = issue.category as keyof typeof categoryIssues
      if (categoryIssues[category]) {
        categoryIssues[category].push(issue)
      }
    }
  })
  
  // Calculate deductions by category
  const categoryScores: Record<string, number> = {}
  let totalDeduction = 0
  
  Object.entries(categoryIssues).forEach(([category, categoryIssueList]) => {
    let categoryDeduction = 0
    
    categoryIssueList.forEach(issue => {
      const weight = SEVERITY_WEIGHTS[issue.severity] || 0
      categoryDeduction += weight
    })
    
    // Apply category weight
    const categoryWeight = CATEGORY_WEIGHTS[category as keyof typeof CATEGORY_WEIGHTS] || 20
    const maxCategoryScore = categoryWeight
    const actualCategoryScore = Math.max(0, maxCategoryScore - (categoryDeduction * 0.5))
    
    categoryScores[category] = Math.round((actualCategoryScore / maxCategoryScore) * 100)
    totalDeduction += (maxCategoryScore - actualCategoryScore)
  })
  
  // Calculate overall score
  const overallScore = Math.max(0, Math.min(100, baseScore - totalDeduction))
  
  // Calculate AI readiness score if applicable
  let aiReadinessScore: number | undefined
  
  if (isAIProduct) {
    const aiIssues = issues.filter(issue => 
      AI_CRITICAL_RULES[issue.ruleId as keyof typeof AI_CRITICAL_RULES] && !issue.dismissed
    )
    
    const maxAIScore = Object.values(AI_CRITICAL_RULES).reduce((sum, weight) => sum + weight, 0)
    let aiDeduction = 0
    
    aiIssues.forEach(issue => {
      const weight = AI_CRITICAL_RULES[issue.ruleId as keyof typeof AI_CRITICAL_RULES] || 0
      aiDeduction += weight
    })
    
    aiReadinessScore = Math.round(((maxAIScore - aiDeduction) / maxAIScore) * 100)
  }
  
  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  let gradeColor: string
  
  if (overallScore >= 80) {
    grade = 'A'
    gradeColor = 'text-green-600'
  } else if (overallScore >= 70) {
    grade = 'B'
    gradeColor = 'text-blue-600'
  } else if (overallScore >= 60) {
    grade = 'C'
    gradeColor = 'text-yellow-600'
  } else if (overallScore >= 50) {
    grade = 'D'
    gradeColor = 'text-orange-600'
  } else {
    grade = 'F'
    gradeColor = 'text-red-600'
  }
  
  // Check if production ready
  const criticalIssues = issues.filter(i => i.severity === 'error' && !i.dismissed)
  const isProductionReady = overallScore >= 70 && criticalIssues.length === 0
  
  return {
    overallScore: Math.round(overallScore),
    categoryScores,
    aiReadinessScore,
    scoreBreakdown: {
      possiblePoints: 100,
      deductedPoints: Math.round(totalDeduction),
      bonusPoints: 0
    },
    grade,
    gradeColor,
    isProductionReady
  }
}

/**
 * Get score color based on percentage
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-50'
  if (score >= 60) return 'text-yellow-600 bg-yellow-50'
  if (score >= 40) return 'text-orange-600 bg-orange-50'
  return 'text-red-600 bg-red-50'
}

/**
 * Get progress bar color
 */
export function getProgressColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

/**
 * Format score for display
 */
export function formatScore(score: number): string {
  return `${Math.round(score)}%`
}

/**
 * Get score interpretation message
 */
export function getScoreMessage(score: number, isAIProduct: boolean = false): string {
  if (score >= 90) {
    return isAIProduct 
      ? 'Excellent! Your PRD is comprehensive and AI-ready.'
      : 'Excellent! Your PRD is comprehensive and well-structured.'
  }
  
  if (score >= 80) {
    return isAIProduct
      ? 'Good! Minor improvements needed for production-ready AI product.'
      : 'Good! Your PRD is nearly complete with minor gaps.'
  }
  
  if (score >= 70) {
    return isAIProduct
      ? 'Acceptable. Address AI-specific requirements before launch.'
      : 'Acceptable. Some important sections need attention.'
  }
  
  if (score >= 60) {
    return isAIProduct
      ? 'Needs improvement. Critical AI requirements missing.'
      : 'Needs improvement. Several key areas require work.'
  }
  
  return isAIProduct
    ? 'Major gaps detected. Essential AI requirements not met.'
    : 'Major gaps detected. Significant work needed.'
}

/**
 * Get category-specific feedback
 */
export function getCategoryFeedback(category: string, score: number): string {
  const feedbackMap: Record<string, Record<string, string>> = {
    completeness: {
      high: 'All essential sections present and detailed.',
      medium: 'Most sections covered, some details missing.',
      low: 'Critical sections missing or incomplete.'
    },
    clarity: {
      high: 'Clear, specific language throughout.',
      medium: 'Generally clear with some ambiguous terms.',
      low: 'Too many vague terms and unclear requirements.'
    },
    technical: {
      high: 'Technical requirements well-defined.',
      medium: 'Basic technical specs present, needs detail.',
      low: 'Insufficient technical specifications.'
    },
    ux: {
      high: 'User experience thoroughly considered.',
      medium: 'Basic UX covered, missing edge cases.',
      low: 'User experience needs more attention.'
    },
    security: {
      high: 'Security requirements comprehensive.',
      medium: 'Basic security addressed, needs expansion.',
      low: 'Security requirements need immediate attention.'
    }
  }
  
  const level = score >= 80 ? 'high' : score >= 60 ? 'medium' : 'low'
  return feedbackMap[category]?.[level] || 'Review needed.'
}

/**
 * Calculate time to fix estimate
 */
export function estimateTimeToFix(issues: LintIssue[]): string {
  const activeIssues = issues.filter(i => !i.dismissed)
  
  const timePerIssue = {
    error: 30,      // 30 minutes per error
    warning: 15,    // 15 minutes per warning
    info: 10,       // 10 minutes per info
    suggestion: 5   // 5 minutes per suggestion
  }
  
  let totalMinutes = 0
  activeIssues.forEach(issue => {
    totalMinutes += timePerIssue[issue.severity] || 5
  })
  
  if (totalMinutes < 60) {
    return `~${totalMinutes} minutes`
  } else if (totalMinutes < 480) { // Less than 8 hours
    const hours = Math.round(totalMinutes / 60)
    return `~${hours} hour${hours > 1 ? 's' : ''}`
  } else {
    const days = Math.round(totalMinutes / 480)
    return `~${days} day${days > 1 ? 's' : ''}`
  }
}