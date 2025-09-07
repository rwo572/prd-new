'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  CheckCheck,
  Loader2,
  RefreshCw,
  Shield,
  Zap,
  FileText,
  Users,
  Code,
  Bot,
  TrendingUp,
  Clock,
  ChevronRight,
  History
} from 'lucide-react'
import { LintReport, LintIssue, AISuggestion, ParsedPRD } from '@/types/prd-linter'
import { ALL_LINTER_RULES, RULE_COUNTS } from '@/lib/linter-rules'
import { getAutoFixTemplate } from '@/lib/linter-templates'
import { 
  calculateQualityScore, 
  getScoreColor, 
  getProgressColor,
  formatScore,
  getScoreMessage,
  getCategoryFeedback,
  estimateTimeToFix
} from '@/lib/linter-scoring'
import { aiSuggestionService } from '@/lib/ai-suggestion-service'
import { cn } from '@/lib/utils'

interface LinterProps {
  content: string
  onAutoFix?: (fixedContent: string) => void
  onIssueClick?: (issue: LintIssue) => void
  onSuggestionApply?: (startOffset: number, endOffset: number, newText: string) => void
  className?: string
  anthropicApiKey?: string
  selectedModel?: string
}

// Category icons
const CATEGORY_ICONS = {
  completeness: FileText,
  clarity: Zap,
  technical: Code,
  ux: Users,
  security: Shield
}

// Severity colors and styles - simplified
const SEVERITY_STYLES = {
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-white',
    borderColor: 'border-l-4 border-l-red-500',
    badgeClass: 'bg-red-50 text-red-600'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600',
    bgColor: 'bg-white',
    borderColor: 'border-l-4 border-l-amber-500',
    badgeClass: 'bg-amber-50 text-amber-600'
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-white',
    borderColor: 'border-l-4 border-l-blue-500',
    badgeClass: 'bg-blue-50 text-blue-600'
  },
  suggestion: {
    icon: Sparkles,
    color: 'text-indigo-600',
    bgColor: 'bg-white',
    borderColor: 'border-l-4 border-l-indigo-500',
    badgeClass: 'bg-indigo-50 text-indigo-600'
  }
}

export default function Linter({ 
  content, 
  onAutoFix, 
  onIssueClick,
  onSuggestionApply,
  className,
  anthropicApiKey,
  selectedModel = 'claude-3-haiku-20240307'
}: LinterProps) {
  const [report, setReport] = useState<LintReport | null>(null)
  const [isLinting, setIsLinting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['completeness', 'technical']))
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set())
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set())
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set())
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, AISuggestion[]>>({})
  const [appliedChanges, setAppliedChanges] = useState<Array<{
    id: string
    timestamp: number
    category: string
    ruleId: string
    message: string
    changeType: 'fix' | 'suggestion' | 'ai'
    appliedText?: string
  }>>([])
  
  // Real-time debounced linting with faster response
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 10) {
        lintPRD(content)
      } else {
        setReport(null)
      }
    }, 500) // 500ms debounce as specified
    
    return () => clearTimeout(timer)
  }, [content])
  
  const lintPRD = useCallback(async (prdContent: string) => {
    const startTime = performance.now()
    setIsLinting(true)
    
    try {
      // Parse PRD
      const parsedPRD: ParsedPRD = {
        content: prdContent
      }
      
      // Detect if this is an AI product
      const aiTerms = ['ai', 'llm', 'gpt', 'claude', 'machine learning', 'artificial intelligence', 'neural', 'model']
      const isAIProduct = aiTerms.some(term => 
        prdContent.toLowerCase().includes(term.toLowerCase())
      )
      
      // Run all lint rules in parallel for better performance
      const issuePromises = ALL_LINTER_RULES.map(rule => 
        Promise.resolve(rule.check(parsedPRD))
      )
      
      const issueArrays = await Promise.all(issuePromises)
      const allIssues = issueArrays.flat()
      
      // Add unique IDs to issues
      const issues = allIssues.map((issue, index) => ({
        ...issue,
        id: `${issue.ruleId}-${index}-${Date.now()}`
      }))
      
      // Calculate statistics
      const stats = {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
        suggestions: issues.filter(i => i.severity === 'suggestion').length
      }
      
      // Calculate quality score
      const scoring = calculateQualityScore(issues, ALL_LINTER_RULES.length, isAIProduct)
      
      // Create report
      const lintReport: LintReport = {
        score: scoring.overallScore,
        issues,
        stats,
        passedRules: ALL_LINTER_RULES
          .filter(rule => !issues.some(i => i.ruleId === rule.id))
          .map(r => r.id),
        failedRules: [...new Set(issues.map(i => i.ruleId))],
        isAIProduct
      }
      
      // Performance check
      const elapsed = performance.now() - startTime
      if (elapsed > 100) {
        console.warn(`Linting took ${elapsed}ms, consider optimization`)
      }
      
      setReport(lintReport)
    } catch (error) {
      console.error('Linting error:', error)
    } finally {
      setIsLinting(false)
    }
  }, [])
  
  // Handle issue click - jump to position in editor
  const handleIssueClick = useCallback((issue: LintIssue) => {
    if (onIssueClick) {
      onIssueClick(issue)
    }
  }, [onIssueClick])
  
  // Handle AI suggestion generation
  const generateAISuggestions = useCallback(async (issue: LintIssue) => {
    // Use the unique issue ID instead of ruleId to store suggestions
    const issueKey = issue.id || issue.ruleId
    if (!anthropicApiKey || loadingSuggestions.has(issueKey)) return
    
    setLoadingSuggestions(prev => new Set(prev).add(issueKey))
    
    try {
      // Set API key and model in the service
      aiSuggestionService.setApiKey(anthropicApiKey)
      aiSuggestionService.setModel(selectedModel)
      
      // Detect if this is an AI product
      const isAIProduct = report?.isAIProduct || false
      
      // Generate contextual suggestions specific to this issue instance
      const suggestions = await aiSuggestionService.generateContextualSuggestions(
        content,
        issue,
        isAIProduct
      )
      
      setAiSuggestions(prev => ({
        ...prev,
        [issueKey]: suggestions
      }))
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
    } finally {
      setLoadingSuggestions(prev => {
        const next = new Set(prev)
        next.delete(issueKey)
        return next
      })
    }
  }, [anthropicApiKey, selectedModel, content, loadingSuggestions, report])
  
  // Apply auto-fix template
  const handleAutoFix = useCallback((issue: LintIssue) => {
    if (!onAutoFix) return
    
    const template = getAutoFixTemplate(issue.ruleId)
    if (template) {
      // Append template to end of document
      const fixedContent = content + '\n\n' + template
      onAutoFix(fixedContent)
      
      // Track the change
      setAppliedChanges(prev => [...prev, {
        id: `change-${Date.now()}`,
        timestamp: Date.now(),
        category: issue.category || 'general',
        ruleId: issue.ruleId,
        message: issue.message,
        changeType: 'fix',
        appliedText: template.substring(0, 100) + '...'
      }])
    }
  }, [content, onAutoFix])
  
  // Apply AI suggestion
  const handleApplySuggestion = useCallback((issue: LintIssue, suggestion: string) => {
    // Check if we have valid offsets (not just placeholder values)
    const hasValidOffsets = issue.startOffset !== undefined && 
                           issue.endOffset !== undefined && 
                           issue.startOffset !== 0 && 
                           issue.endOffset !== 50 && // Ignore placeholder values
                           issue.matchedText !== '' // Must have actual matched text
    
    if (hasValidOffsets && onSuggestionApply) {
      // Use precise replacement for issues with valid text positions
      onSuggestionApply(issue.startOffset!, issue.endOffset!, suggestion)
    } else if (onAutoFix) {
      // For issues without specific positions, append the content
      const fixedContent = content + '\n\n' + suggestion
      onAutoFix(fixedContent)
    }
    
    // Track the change
    const isAISuggestion = aiSuggestions[issue.id || issue.ruleId]?.some(s => s.text === suggestion)
    setAppliedChanges(prev => [...prev, {
      id: `change-${Date.now()}`,
      timestamp: Date.now(),
      category: issue.category || 'general',
      ruleId: issue.ruleId,
      message: issue.message,
      changeType: isAISuggestion ? 'ai' : 'suggestion',
      appliedText: suggestion.substring(0, 100) + (suggestion.length > 100 ? '...' : '')
    }])
  }, [onSuggestionApply, onAutoFix, content, aiSuggestions])
  
  // Dismiss issue
  const handleDismissIssue = useCallback((issueId: string) => {
    setDismissedIssues(prev => new Set(prev).add(issueId))
  }, [])
  
  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])
  
  // Toggle suggestion expansion
  const toggleSuggestions = useCallback((issueId: string) => {
    setExpandedSuggestions(prev => {
      const next = new Set(prev)
      if (next.has(issueId)) {
        next.delete(issueId)
      } else {
        next.add(issueId)
      }
      return next
    })
  }, [])
  
  // Calculate scoring with memoization
  const scoring = useMemo(() => {
    if (!report) return null
    const activeIssues = report.issues.filter(i => !dismissedIssues.has(i.id || i.ruleId))
    return calculateQualityScore(activeIssues, ALL_LINTER_RULES.length, report.isAIProduct)
  }, [report, dismissedIssues])
  
  // Group issues by category
  const issuesByCategory = useMemo(() => {
    if (!report) return {}
    
    const grouped: Record<string, LintIssue[]> = {
      completeness: [],
      clarity: [],
      technical: [],
      ux: [],
      security: []
    }
    
    report.issues
      .filter(issue => !dismissedIssues.has(issue.id || issue.ruleId))
      .forEach(issue => {
        const category = issue.category || 'technical'
        if (grouped[category]) {
          grouped[category].push(issue)
        }
      })
    
    // Sort categories by severity
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 }
        return severityOrder[a.severity] - severityOrder[b.severity]
      })
    })
    
    return grouped
  }, [report, dismissedIssues])
  
  // Apply all fixes
  const handleApplyAll = useCallback(() => {
    if (!onAutoFix || !report) return
    
    const templates: string[] = []
    const appliedRules = new Set<string>()
    
    report.issues
      .filter(issue => issue.autoFixable && !dismissedIssues.has(issue.id || issue.ruleId))
      .forEach(issue => {
        if (!appliedRules.has(issue.ruleId)) {
          const template = getAutoFixTemplate(issue.ruleId)
          if (template) {
            templates.push(template)
            appliedRules.add(issue.ruleId)
          }
        }
      })
    
    if (templates.length > 0) {
      const fixedContent = content + '\n\n' + templates.join('\n\n')
      onAutoFix(fixedContent)
    }
  }, [content, onAutoFix, report, dismissedIssues])
  
  // Dismiss all issues
  const handleDismissAll = useCallback(() => {
    if (!report) return
    
    const allIds = report.issues.map(i => i.id || i.ruleId)
    setDismissedIssues(new Set(allIds))
  }, [report])
  
  if (!report && !isLinting) {
    return (
      <div className={cn("p-6 text-center text-slate-500", className)}>
        <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p className="text-sm">Start typing to see linting suggestions</p>
      </div>
    )
  }
  
  // Get counts for high priority issues
  const errorCount = report?.issues.filter(i => i.severity === 'error' && !dismissedIssues.has(i.id || i.ruleId)).length || 0
  const warningCount = report?.issues.filter(i => i.severity === 'warning' && !dismissedIssues.has(i.id || i.ruleId)).length || 0
  const fixableCount = report?.issues.filter(i => i.autoFixable && !dismissedIssues.has(i.id || i.ruleId)).length || 0
  
  return (
    <div className={cn("flex flex-col h-full bg-slate-50", className)}>
      {/* Clearer Header */}
      <div className="bg-white border-b border-slate-200">
        {/* Progress Section */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">PRD Quality Check</h3>
              {scoring && (
                <p className="text-xs text-slate-600 mt-0.5">
                  {scoring.overallScore === 100 ? 
                    "✨ Perfect! Your PRD is complete." :
                   errorCount > 0 ? 
                    `${errorCount} required items missing` :
                   warningCount > 0 ?
                    `${warningCount} recommendations to review` :
                    "Almost there! Just a few improvements left."}
                </p>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {fixableCount > 0 && (
                <button
                  onClick={handleApplyAll}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-medium transition-colors"
                >
                  Auto-fix {fixableCount} {fixableCount === 1 ? 'issue' : 'issues'}
                </button>
              )}
              {appliedChanges.length > 0 && (
                <button
                  onClick={() => setAppliedChanges([])}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
                >
                  Clear History
                </button>
              )}
            </div>
          </div>
          
          {/* Progress Bar with Label */}
          {scoring && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-700">
                  Completeness: {formatScore(scoring.overallScore)}%
                </span>
                <span className={cn(
                  "text-xs font-semibold",
                  scoring.overallScore >= 80 ? "text-green-600" :
                  scoring.overallScore >= 60 ? "text-amber-600" :
                  "text-red-600"
                )}>
                  Grade: {scoring.grade}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-500",
                    scoring.overallScore >= 80 ? "bg-green-500" :
                    scoring.overallScore >= 60 ? "bg-amber-500" :
                    "bg-red-500"
                  )}
                  style={{ width: `${scoring.overallScore}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Issue Summary Bar */}
        {report && (errorCount > 0 || warningCount > 0 || appliedChanges.length > 0) && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {errorCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-red-600" />
                  <span className="font-medium text-red-600">{errorCount} Required</span>
                </span>
              )}
              {warningCount > 0 && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span className="text-amber-600">{warningCount} Warnings</span>
                </span>
              )}
              {report.stats.info > 0 && (
                <span className="flex items-center gap-1">
                  <Info className="w-3 h-3 text-blue-600" />
                  <span className="text-blue-600">{report.stats.info} Tips</span>
                </span>
              )}
            </div>
            {appliedChanges.length > 0 && (
              <span className="text-slate-500">
                {appliedChanges.length} changes applied this session
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {isLinting && (
          <div className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500 mb-3" />
            <p className="text-sm text-slate-600">Analyzing PRD...</p>
          </div>
        )}
        
        {report && Object.entries(issuesByCategory).map(([category, issues]) => {
          if (issues.length === 0) return null
          
          const Icon = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS]
          const isExpanded = expandedCategories.has(category)
          const hasErrors = issues.some(i => i.severity === 'error')
          const hasWarnings = issues.some(i => i.severity === 'warning')
          
          return (
            <div key={category} className="bg-white mb-2 mx-2 rounded-lg border border-slate-200 overflow-hidden">
              {/* Simplified Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-semibold capitalize text-slate-900">{category}</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium",
                    hasErrors ? "bg-red-100 text-red-700" :
                    hasWarnings ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-600"
                  )}>
                    {issues.length}
                  </span>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-slate-400 transition-transform",
                  isExpanded && "rotate-180"
                )} />
              </button>
              
              {/* Issues List - Simplified */}
              {isExpanded && (
                <div className="border-t border-slate-100">
                  {issues.map((issue, index) => {
                    const severity = SEVERITY_STYLES[issue.severity]
                    const SeverityIcon = severity.icon
                    const issueKey = issue.id || issue.ruleId
                    const hasAiSuggestions = aiSuggestions[issueKey]?.length > 0
                    
                    return (
                      <div
                        key={issue.id || issue.ruleId}
                        className={cn(
                          "px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer",
                          severity.borderColor,
                          index !== 0 && "border-t border-slate-100"
                        )}
                        onClick={() => handleIssueClick(issue)}
                      >
                        {/* Issue Content */}
                        <div className="flex items-start gap-3">
                          <SeverityIcon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", severity.color)} />
                          <div className="flex-1 min-w-0">
                            {/* Issue Message */}
                            <div className="mb-2">
                              <p className="text-sm text-slate-900">{issue.message}</p>
                              {issue.severity === 'error' && (
                                <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-red-50 text-red-600 rounded">
                                  Required
                                </span>
                              )}
                            </div>
                            
                            {/* Suggestion if available */}
                            {issue.suggestion && (
                              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                <p className="text-xs text-blue-800">
                                  <span className="font-semibold">Tip:</span> {issue.suggestion}
                                </p>
                              </div>
                            )}
                            
                            {/* Clear Action Buttons */}
                            <div className="flex items-center gap-2">
                              {issue.autoFixable && onAutoFix && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAutoFix(issue)
                                  }}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors"
                                >
                                  Fix This
                                </button>
                              )}
                              {anthropicApiKey && !hasAiSuggestions && !loadingSuggestions.has(issueKey) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    generateAISuggestions(issue)
                                  }}
                                  className="px-3 py-1.5 bg-white border border-indigo-300 hover:bg-indigo-50 text-indigo-600 rounded text-xs font-semibold transition-colors flex items-center gap-1"
                                >
                                  <Bot className="w-3 h-3" />
                                  Get AI Help
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDismissIssue(issue.id || issue.ruleId)
                                }}
                                className="px-3 py-1.5 text-slate-500 hover:text-slate-700 text-xs transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                            
                            {/* AI Suggestions - Cleaner */}
                            {loadingSuggestions.has(issueKey) && (
                              <div className="flex items-center gap-2 text-xs text-indigo-600 mt-3">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Getting AI suggestions...
                              </div>
                            )}
                            
                            {hasAiSuggestions && (
                              <div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                <p className="text-xs font-semibold text-indigo-900 mb-2">AI Suggestions:</p>
                                <div className="space-y-2">
                                  {aiSuggestions[issueKey].map((suggestion) => (
                                    <div key={suggestion.id}>
                                      <p className="text-xs text-slate-700 mb-1">{suggestion.text}</p>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleApplySuggestion(issue, suggestion.text)
                                        }}
                                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-semibold transition-colors"
                                      >
                                        Apply
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
        
        {/* Empty State - More Encouraging */}
        {report && report.issues.length === 0 && (
          <div className="p-12 text-center bg-white m-4 rounded-lg border border-slate-200">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Excellent work!</h3>
            <p className="text-sm text-slate-600">Your PRD is complete and meets all quality standards.</p>
          </div>
        )}
      </div>
    </div>
  )
}