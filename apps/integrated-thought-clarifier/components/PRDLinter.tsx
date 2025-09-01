'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Users, 
  Code, 
  FileText,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { LintReport, LintIssue, ParsedPRD } from '@/types/prd-linter'
import { ALL_LINT_RULES, AUTO_FIX_TEMPLATES } from '@/lib/prd-lint-rules'
import { AI_SCORING_WEIGHTS } from '@/lib/ai-prd-lint-rules'
import { cn } from '@/lib/utils'

interface PRDLinterProps {
  content: string
  onAutoFix?: (fixedContent: string) => void
  onIssueClick?: (issue: LintIssue) => void
  onSuggestionApply?: (startOffset: number, endOffset: number, newText: string) => void
  className?: string
}

export default function PRDLinter({ 
  content, 
  onAutoFix, 
  onIssueClick,
  onSuggestionApply,
  className 
}: PRDLinterProps) {
  const [report, setReport] = useState<LintReport | null>(null)
  const [isLinting, setIsLinting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [showAllIssues, setShowAllIssues] = useState(false)
  const [hoveredIssue, setHoveredIssue] = useState<string | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<{ issueId: string, index: number } | null>(null)
  
  // Debounced linting
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 10) {
        lintPRD(content)
      } else {
        setReport(null)
      }
    }, 500) // 500ms debounce
    
    return () => clearTimeout(timer)
  }, [content])
  
  const lintPRD = async (prdContent: string) => {
    setIsLinting(true)
    
    // Parse PRD
    const parsedPRD: ParsedPRD = {
      content: prdContent
    }
    
    // Detect if this is an AI product
    const isAIProduct = prdContent.toLowerCase().includes('ai') || 
                       prdContent.toLowerCase().includes('llm') ||
                       prdContent.toLowerCase().includes('gpt') ||
                       prdContent.toLowerCase().includes('claude') ||
                       prdContent.toLowerCase().includes('machine learning')
    
    // Run all lint rules
    const issues: LintIssue[] = []
    const passedRules: string[] = []
    const failedRules: string[] = []
    
    ALL_LINT_RULES.forEach(rule => {
      const ruleIssues = rule.check(parsedPRD)
      if (ruleIssues.length > 0) {
        issues.push(...ruleIssues)
        failedRules.push(rule.id)
      } else {
        passedRules.push(rule.id)
      }
    })
    
    // Calculate score with AI-specific weights
    let totalDeductions = 0
    const stats = {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
      suggestions: issues.filter(i => i.severity === 'suggestion').length
    }
    
    // Use custom weights for AI rules if AI product detected
    if (isAIProduct) {
      issues.forEach(issue => {
        const aiWeight = AI_SCORING_WEIGHTS[issue.ruleId as keyof typeof AI_SCORING_WEIGHTS]
        if (aiWeight) {
          totalDeductions += aiWeight
        } else {
          // Default weights for non-AI rules
          const weights = { error: 10, warning: 5, info: 2, suggestion: 1 }
          totalDeductions += weights[issue.severity]
        }
      })
    } else {
      // Standard scoring for non-AI products
      const errorWeight = 10
      const warningWeight = 5
      const infoWeight = 2
      const suggestionWeight = 1
      
      totalDeductions = 
        stats.errors * errorWeight +
        stats.warnings * warningWeight +
        stats.info * infoWeight +
        stats.suggestions * suggestionWeight
    }
    
    const score = Math.max(0, Math.min(100, 100 - totalDeductions))
    
    setReport({
      score,
      issues,
      stats,
      passedRules,
      failedRules
    })
    
    setIsLinting(false)
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50'
    if (score >= 40) return 'text-orange-600 bg-orange-50'
    return 'text-red-600 bg-red-50'
  }
  
  const getScoreEmoji = (score: number) => {
    if (score >= 90) return '🎉'
    if (score >= 80) return '✅'
    if (score >= 60) return '⚠️'
    if (score >= 40) return '🔧'
    return '❌'
  }
  
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info': return <Info className="h-4 w-4 text-blue-500" />
      case 'suggestion': return <Zap className="h-4 w-4 text-purple-500" />
      default: return null
    }
  }
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'completeness': return <FileText className="h-4 w-4" />
      case 'clarity': return <FileText className="h-4 w-4" />
      case 'technical': return <Code className="h-4 w-4" />
      case 'ux': return <Users className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'ai': return <Sparkles className="h-4 w-4" />
      default: return null
    }
  }
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'completeness': return 'text-blue-600'
      case 'clarity': return 'text-purple-600'
      case 'technical': return 'text-green-600'
      case 'ux': return 'text-orange-600'
      case 'security': return 'text-red-600'
      case 'ai': return 'text-indigo-600'
      default: return 'text-gray-600'
    }
  }
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }
  
  const autoFix = useCallback(() => {
    if (!report || !onAutoFix) return
    
    let fixedContent = content
    
    // Apply auto-fixable issues
    report.issues.forEach(issue => {
      if (issue.autoFixable && AUTO_FIX_TEMPLATES[issue.ruleId as keyof typeof AUTO_FIX_TEMPLATES]) {
        fixedContent += '\n' + AUTO_FIX_TEMPLATES[issue.ruleId as keyof typeof AUTO_FIX_TEMPLATES]
      }
    })
    
    onAutoFix(fixedContent)
  }, [report, content, onAutoFix])
  
  if (!report) {
    if (content.length > 0 && content.length <= 10) {
      return (
        <div className={cn("border rounded-lg bg-gray-50 p-4", className)}>
          <p className="text-sm text-gray-500">Start typing to see PRD quality analysis...</p>
        </div>
      )
    }
    return null
  }
  
  // Group issues by category
  const issuesByCategory = report.issues.reduce((acc, issue) => {
    const category = issue.category || 'other'
    if (!acc[category]) acc[category] = []
    acc[category].push(issue)
    return acc
  }, {} as Record<string, LintIssue[]>)
  
  const hasAutoFixable = report.issues.some(i => i.autoFixable)
  
  // Check if this is an AI product
  const isAIProduct = content.toLowerCase().includes('ai') || 
                     content.toLowerCase().includes('llm') ||
                     content.toLowerCase().includes('gpt') ||
                     content.toLowerCase().includes('claude')
  
  // Calculate AI readiness
  const aiCriticalIssues = report.issues.filter(i => 
    ['ai-model-specification', 'ai-safety-guardrails', 'ai-data-retention', 'ai-hallucination-prevention'].includes(i.ruleId)
  )
  const aiReadiness = isAIProduct ? Math.max(0, 100 - (aiCriticalIssues.length * 25)) : null
  
  return (
    <div className={cn("border rounded-lg bg-white shadow-sm", className)}>
      {/* Header with Score - Clickable */}
      <div 
        className="p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => {
          if (Object.keys(issuesByCategory).length > 0) {
            setShowAllIssues(!showAllIssues)
            if (!showAllIssues) {
              setExpandedCategories(new Set(Object.keys(issuesByCategory)))
            } else {
              setExpandedCategories(new Set())
            }
          }
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-gray-600" />
            <h3 className="font-semibold">PRD Quality Score</h3>
          </div>
          {isLinting && (
            <span className="text-xs text-gray-500">Analyzing...</span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn("text-3xl font-bold px-3 py-1 rounded-lg", getScoreColor(report.score))}>
            <span className="mr-2">{getScoreEmoji(report.score)}</span>
            {report.score}%
          </div>
          
          {/* AI Readiness Badge */}
          {isAIProduct && aiReadiness !== null && (
            <div className="flex flex-col items-center">
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1",
                aiReadiness >= 75 ? "bg-indigo-100 text-indigo-700" :
                aiReadiness >= 50 ? "bg-yellow-100 text-yellow-700" :
                "bg-red-100 text-red-700"
              )}>
                <Sparkles className="h-3 w-3" />
                AI Ready: {aiReadiness}%
              </div>
              {aiReadiness < 75 && (
                <span className="text-xs text-gray-500 mt-1">
                  {aiCriticalIssues.length} critical AI {aiCriticalIssues.length === 1 ? 'issue' : 'issues'}
                </span>
              )}
            </div>
          )}
          
          {/* Stats Pills */}
          <div className="flex gap-2 flex-wrap">
            {report.stats.errors > 0 && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full font-medium">
                {report.stats.errors} {report.stats.errors === 1 ? 'error' : 'errors'}
              </span>
            )}
            {report.stats.warnings > 0 && (
              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-full font-medium">
                {report.stats.warnings} {report.stats.warnings === 1 ? 'warning' : 'warnings'}
              </span>
            )}
            {report.stats.info > 0 && (
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full font-medium">
                {report.stats.info} info
              </span>
            )}
            {report.stats.suggestions > 0 && (
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full font-medium">
                {report.stats.suggestions} {report.stats.suggestions === 1 ? 'suggestion' : 'suggestions'}
              </span>
            )}
          </div>
        </div>
        
        {/* Quick Actions */}
        {hasAutoFixable && (
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={autoFix}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
              Apply Auto-fixes
            </button>
            <span className="text-xs text-gray-500">
              {report.issues.filter(i => i.autoFixable).length} fixable issues
            </span>
          </div>
        )}
      </div>
      
      {/* Issues by Category */}
      <div className="max-h-96 overflow-y-auto">
        {Object.entries(issuesByCategory).length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900">Perfect PRD!</p>
            <p className="text-sm text-gray-500 mt-1">No issues found</p>
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(issuesByCategory).map(([category, categoryIssues]) => {
              const isExpanded = expandedCategories.has(category) || showAllIssues
              const Icon = getCategoryIcon(category)
              
              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full px-4 py-2 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className={getCategoryColor(category)}>{Icon}</span>
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full text-gray-600">
                        {categoryIssues.length}
                      </span>
                    </div>
                    {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-4 pb-2 space-y-2">
                      {categoryIssues.map((issue, idx) => {
                        const issueId = `${issue.ruleId}-${idx}`
                        const isHovered = hoveredIssue === issueId
                        
                        return (
                          <div 
                            key={issueId} 
                            className="relative"
                          >
                            <div 
                              className={cn(
                                "pl-6 py-2 border-l-2 cursor-pointer transition-all",
                                isHovered ? "border-blue-400 bg-blue-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                              )}
                              onClick={() => onIssueClick?.(issue)}
                              onMouseEnter={() => setHoveredIssue(issueId)}
                              onMouseLeave={() => setHoveredIssue(null)}
                            >
                              <div className="flex items-start gap-2">
                                {getSeverityIcon(issue.severity)}
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {issue.message}
                                    {issue.matchedText && (
                                      <code className="ml-1 px-1 py-0.5 bg-gray-100 text-xs rounded">
                                        {issue.matchedText}
                                      </code>
                                    )}
                                  </p>
                                  {issue.line && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Line {issue.line}, Column {issue.column}
                                    </p>
                                  )}
                                  {issue.suggestion && (
                                    <p className="text-xs text-gray-600 mt-1">
                                      💡 {issue.suggestion}
                                    </p>
                                  )}
                                  {issue.autoFixable && (
                                    <span className="inline-flex items-center gap-1 text-xs text-blue-600 mt-1">
                                      <Sparkles className="h-3 w-3" />
                                      Click to see suggestions
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Hover Suggestions Popup */}
                            {isHovered && issue.suggestions && issue.suggestions.length > 0 && (
                              <div className="absolute left-full ml-2 top-0 z-50 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2">
                                  Choose a replacement:
                                </p>
                                <div className="space-y-1">
                                  {issue.suggestions.map((suggestion, suggestionIdx) => (
                                    <button
                                      key={suggestionIdx}
                                      className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 rounded transition-colors border border-transparent hover:border-blue-200"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        if (issue.startOffset !== undefined && issue.endOffset !== undefined) {
                                          onSuggestionApply?.(issue.startOffset, issue.endOffset, suggestion)
                                        }
                                      }}
                                    >
                                      <span className="text-blue-600 mr-1">→</span>
                                      {suggestion}
                                    </button>
                                  ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  Click to apply
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {report.issues.length > 3 && (
        <div className="p-3 border-t bg-gray-50">
          <button
            onClick={() => setShowAllIssues(!showAllIssues)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {showAllIssues ? 'Collapse all' : 'Expand all categories'}
          </button>
        </div>
      )}
    </div>
  )
}