'use client'

import { useState, useEffect } from 'react'
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
  ChevronUp,
  Sparkles,
  TrendingUp,
  Target,
  Clock,
  ArrowRight,
  X,
  CheckCheck,
  Loader2,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Star,
  Plus
} from 'lucide-react'
import { LintReport, LintIssue, AISuggestion, ParsedPRD } from '@/types/prd-linter'
import { ALL_LINT_RULES, AUTO_FIX_TEMPLATES } from '@/lib/prd-lint-rules'
import { AI_SCORING_WEIGHTS } from '@/lib/ai-prd-lint-rules'
import { aiSuggestionService } from '@/lib/ai-suggestion-service'
import { cn } from '@/lib/utils'

interface PRDLinterProps {
  content: string
  onAutoFix?: (fixedContent: string) => void
  onIssueClick?: (issue: LintIssue) => void
  onSuggestionApply?: (startOffset: number, endOffset: number, newText: string) => void
  className?: string
  anthropicApiKey?: string
  selectedModel?: string
}

export default function PRDLinter({ 
  content, 
  onAutoFix, 
  onIssueClick,
  onSuggestionApply,
  className,
  anthropicApiKey,
  selectedModel = 'claude-3-haiku-20240307'
}: PRDLinterProps) {
  const [report, setReport] = useState<LintReport | null>(null)
  const [isLinting, setIsLinting] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['clarity']))
  const [hoveredIssue, setHoveredIssue] = useState<string | null>(null)
  const [loadingSuggestions, setLoadingSuggestions] = useState<Set<string>>(new Set())
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set())
  const [expandedSuggestions, setExpandedSuggestions] = useState<Set<string>>(new Set())
  
  // Real-time debounced linting
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content.length > 10) {
        lintPRD(content)
      } else {
        setReport(null)
      }
    }, 300) // Faster debounce for better UX
    
    return () => clearTimeout(timer)
  }, [content])
  
  const lintPRD = async (prdContent: string) => {
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
      
      // Run all lint rules
      const issues: LintIssue[] = []
      const passedRules: string[] = []
      const failedRules: string[] = []
      
      ALL_LINT_RULES.forEach(rule => {
        try {
          const ruleIssues = rule.check(parsedPRD)
          if (ruleIssues.length > 0) {
            // Add unique IDs and ensure proper positioning
            const enhancedIssues = ruleIssues.map((issue, idx) => ({
              ...issue,
              id: `${rule.id}-${idx}`,
              category: issue.category || rule.category || 'other'
            }))
            issues.push(...enhancedIssues)
            failedRules.push(rule.id)
          } else {
            passedRules.push(rule.id)
          }
        } catch (error) {
          console.warn(`Rule ${rule.id} failed:`, error)
        }
      })
      
      // Calculate enhanced score
      const stats = {
        errors: issues.filter(i => i.severity === 'error').length,
        warnings: issues.filter(i => i.severity === 'warning').length,
        info: issues.filter(i => i.severity === 'info').length,
        suggestions: issues.filter(i => i.severity === 'suggestion').length
      }
      
      let totalDeductions = 0
      
      if (isAIProduct) {
        issues.forEach(issue => {
          const aiWeight = AI_SCORING_WEIGHTS[issue.ruleId as keyof typeof AI_SCORING_WEIGHTS]
          if (aiWeight) {
            totalDeductions += aiWeight
          } else {
            const weights = { error: 15, warning: 8, info: 3, suggestion: 1 }
            totalDeductions += weights[issue.severity]
          }
        })
      } else {
        const weights = { error: 12, warning: 6, info: 2, suggestion: 1 }
        totalDeductions = 
          stats.errors * weights.error +
          stats.warnings * weights.warning +
          stats.info * weights.info +
          stats.suggestions * weights.suggestion
      }
      
      const score = Math.max(0, Math.min(100, 100 - totalDeductions))
      
      // Initialize AI suggestion service
      if (anthropicApiKey) {
        aiSuggestionService.setApiKey(anthropicApiKey)
        aiSuggestionService.setModel(selectedModel)
      }
      
      setReport({
        score,
        issues,
        stats,
        passedRules,
        failedRules,
        isAIProduct
      })
    } catch (error) {
      console.error('Linting failed:', error)
    } finally {
      setIsLinting(false)
    }
  }
  
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600'
    if (score >= 75) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }
  
  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-50 border-emerald-200'
    if (score >= 75) return 'bg-green-50 border-green-200'
    if (score >= 60) return 'bg-yellow-50 border-yellow-200'
    if (score >= 40) return 'bg-orange-50 border-orange-200'
    return 'bg-red-50 border-red-200'
  }
  
  const getSeverityIcon = (severity: string) => {
    const iconClass = "h-3.5 w-3.5"
    switch (severity) {
      case 'error': return <AlertCircle className={`${iconClass} text-red-500`} />
      case 'warning': return <AlertTriangle className={`${iconClass} text-amber-500`} />
      case 'info': return <Info className={`${iconClass} text-blue-500`} />
      case 'suggestion': return <Zap className={`${iconClass} text-purple-500`} />
      default: return null
    }
  }

  // Generate AI suggestions for an issue
  const generateAISuggestions = async (issue: LintIssue) => {
    if (!anthropicApiKey || !issue.startOffset || !issue.endOffset) return

    const issueId = `${issue.ruleId}-${issue.startOffset}`
    setLoadingSuggestions(prev => new Set([...prev, issueId]))

    try {
      const suggestions = await aiSuggestionService.generateContextualSuggestions(
        content, 
        issue, 
        report?.isAIProduct || false
      )

      // Update the issue with AI suggestions
      setReport(prevReport => {
        if (!prevReport) return null
        
        return {
          ...prevReport,
          issues: prevReport.issues.map(i => {
            if (i.ruleId === issue.ruleId && i.startOffset === issue.startOffset) {
              return {
                ...i,
                aiSuggestions: suggestions.map((s, idx) => ({
                  ...s,
                  id: `${issueId}-ai-${idx}`
                }))
              }
            }
            return i
          })
        }
      })
    } catch (error) {
      console.error('Failed to generate AI suggestions:', error)
    } finally {
      setLoadingSuggestions(prev => {
        const newSet = new Set(prev)
        newSet.delete(issueId)
        return newSet
      })
    }
  }

  // Dismiss an issue
  const dismissIssue = (issue: LintIssue) => {
    const issueId = `${issue.ruleId}-${issue.startOffset}`
    setDismissedIssues(prev => new Set([...prev, issueId]))
  }

  // Apply a suggestion
  const applySuggestion = (issue: LintIssue, suggestionText: string) => {
    if (onSuggestionApply && issue.startOffset !== undefined && issue.endOffset !== undefined) {
      onSuggestionApply(issue.startOffset, issue.endOffset, suggestionText)
    }
  }

  // Apply all suggestions for an issue (batch apply)
  const applyAllSuggestions = (issue: LintIssue) => {
    const bestSuggestion = getBestSuggestion(issue)
    if (bestSuggestion) {
      applySuggestion(issue, bestSuggestion.text)
    }
  }

  // Get the best suggestion based on confidence
  const getBestSuggestion = (issue: LintIssue): AISuggestion | null => {
    if (issue.aiSuggestions && issue.aiSuggestions.length > 0) {
      return issue.aiSuggestions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      )
    }
    return null
  }

  // Batch apply all high-confidence suggestions
  const applyAllHighConfidenceSuggestions = () => {
    if (!report) return

    report.issues.forEach(issue => {
      if (dismissedIssues.has(`${issue.ruleId}-${issue.startOffset}`)) return
      
      const bestSuggestion = getBestSuggestion(issue)
      if (bestSuggestion && bestSuggestion.confidence >= 0.8) {
        applySuggestion(issue, bestSuggestion.text)
      }
    })
  }
  
  const getCategoryIcon = (category: string) => {
    const iconClass = "h-4 w-4"
    switch (category) {
      case 'completeness': return <FileText className={iconClass} />
      case 'clarity': return <Target className={iconClass} />
      case 'technical': return <Code className={iconClass} />
      case 'ux': return <Users className={iconClass} />
      case 'security': return <Shield className={iconClass} />
      case 'ai': return <Sparkles className={iconClass} />
      default: return <FileText className={iconClass} />
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
  
  const handleAutoFix = () => {
    if (!report || !onAutoFix) return
    
    let fixedContent = content
    const autoFixableIssues = report.issues.filter(issue => issue.autoFixable)
    
    if (autoFixableIssues.length > 0) {
      // Add auto-fix templates
      const templates = autoFixableIssues
        .map(issue => AUTO_FIX_TEMPLATES[issue.ruleId as keyof typeof AUTO_FIX_TEMPLATES])
        .filter(Boolean)
        .join('\n\n')
      
      if (templates) {
        fixedContent += '\n\n' + templates
        onAutoFix(fixedContent)
      }
    }
  }
  
  if (!content.trim()) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">PRD Linter</span>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm text-gray-500">Start writing your PRD to see quality insights</p>
          </div>
        </div>
      </div>
    )
  }
  
  if (!report) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium">Analyzing PRD...</span>
          </div>
        </div>
      </div>
    )
  }
  
  // Group issues by category
  const issuesByCategory = report.issues
    .filter(issue => !dismissedIssues.has(`${issue.ruleId}-${issue.startOffset}`))
    .reduce((acc, issue) => {
      const category = issue.category || 'other'
      if (!acc[category]) acc[category] = []
      acc[category].push(issue)
      return acc
    }, {} as Record<string, LintIssue[]>)
  
  const hasAutoFixable = report.issues.some(i => i.autoFixable)
  const fixableCount = report.issues.filter(i => i.autoFixable).length
  
  // Calculate AI readiness for AI products
  const aiCriticalIssues = report.issues.filter(i => 
    ['ai-model-specification', 'ai-safety-guardrails', 'ai-data-retention', 'ai-hallucination-prevention'].includes(i.ruleId)
  )
  const aiReadiness = report.isAIProduct ? Math.max(0, 100 - (aiCriticalIssues.length * 20)) : null
  
  return (
    <div className="h-full flex flex-col">
      {/* Header - Matches Editor style */}
      <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">PRD Linter</span>
          </div>
          <button
            className="text-xs text-gray-500 hover:text-gray-700"
            title="The PRD Linter checks your document against best practices in real-time. Click any issue to jump to that text in the editor."
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      
      {/* Explainer Text */}
      <div className="px-4 pt-3 pb-2 bg-gradient-to-b from-blue-50 to-white border-b border-gray-100">
        <p className="text-xs text-gray-600 leading-relaxed">
          Real-time analysis of your PRD. <span className="font-medium">Click any issue</span> to jump to that text. 
          Use the <span className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded">
            <Sparkles className="h-2.5 w-2.5" />
            <span className="text-[10px] font-medium">AI</span>
          </span> button for fix suggestions.
        </p>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            Error (-12pts)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            Warning (-6pts)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            Info (-2pts)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            Suggestion (-1pt)
          </span>
        </div>
      </div>
      
      {/* Score Display */}
      <div className="p-4">
        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          {/* Linter Score */}
          <div className="flex items-center gap-2" title={`Score: 100 - (${report.stats.errors}×12 + ${report.stats.warnings}×6 + ${report.stats.info}×2 + ${report.stats.suggestions}×1)`}>
            <div className={cn("text-2xl font-semibold", getScoreColor(report.score))}>
              {report.score}%
            </div>
            <div className="text-gray-600">
              {report.score >= 90 ? 'Excellent' :
               report.score >= 75 ? 'Good' :
               report.score >= 60 ? 'Fair' :
               report.score >= 40 ? 'Needs Work' : 'Poor'}
            </div>
          </div>
          
          {/* AI Readiness */}
          {report.isAIProduct && aiReadiness !== null && (
            <div className="flex items-center gap-2">
              <Sparkles className={cn(
                "h-4 w-4",
                aiReadiness >= 80 ? "text-indigo-600" :
                aiReadiness >= 60 ? "text-yellow-600" :
                "text-red-600"
              )} />
              <span className="text-gray-600">AI Ready</span>
              <span className={cn(
                "font-semibold",
                aiReadiness >= 80 ? "text-indigo-600" :
                aiReadiness >= 60 ? "text-yellow-600" :
                "text-red-600"
              )}>
                {aiReadiness}%
              </span>
            </div>
          )}
          
          {/* Stats */}
          <div className="flex gap-4 text-gray-600">
            {report.stats.errors > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span>{report.stats.errors}</span>
              </div>
            )}
            {report.stats.warnings > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <span>{report.stats.warnings}</span>
              </div>
            )}
            {report.stats.info > 0 && (
              <div className="flex items-center gap-1">
                <Info className="h-4 w-4 text-blue-500" />
                <span>{report.stats.info}</span>
              </div>
            )}
            {report.stats.suggestions > 0 && (
              <div className="flex items-center gap-1">
                <Zap className="h-4 w-4 text-purple-500" />
                <span>{report.stats.suggestions}</span>
              </div>
            )}
          </div>
          
          {isLinting && (
            <div className="flex items-center gap-2 text-gray-500 ml-auto">
              <Clock className="h-4 w-4 animate-pulse" />
              <span className="text-xs">Analyzing...</span>
            </div>
          )}
        </div>
        
        {/* Bulk Actions Row */}
        <div className="flex gap-2 mb-3">
          {/* Auto-fix Button */}
          {hasAutoFixable && (
            <button
              onClick={handleAutoFix}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
            >
              <Sparkles className="h-4 w-4" />
              Apply Auto-fixes
              <span className="bg-purple-500 px-1.5 py-0.5 rounded text-xs">
                {fixableCount}
              </span>
            </button>
          )}
          
          {/* AI-powered bulk actions */}
          {anthropicApiKey && report.issues.some(issue => !dismissedIssues.has(`${issue.ruleId}-${issue.startOffset}`)) && (
            <>
              {/* Apply All High-Confidence */}
              {report.issues.some(issue => {
                const bestSuggestion = getBestSuggestion(issue)
                return bestSuggestion && bestSuggestion.confidence >= 0.8 && !dismissedIssues.has(`${issue.ruleId}-${issue.startOffset}`)
              }) && (
                <button
                  onClick={applyAllHighConfidenceSuggestions}
                  className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                >
                  <CheckCheck className="h-4 w-4" />
                  Fix All
                  <span className="bg-green-500 px-1.5 py-0.5 rounded text-xs">
                    {report.issues.filter(issue => {
                      const bestSuggestion = getBestSuggestion(issue)
                      return bestSuggestion && bestSuggestion.confidence >= 0.8 && !dismissedIssues.has(`${issue.ruleId}-${issue.startOffset}`)
                    }).length}
                  </span>
                </button>
              )}
              
              <button
                onClick={() => {
                  report.issues
                    .filter(issue => !dismissedIssues.has(`${issue.ruleId}-${issue.startOffset}`) && issue.startOffset !== undefined && issue.endOffset !== undefined && !issue.aiSuggestions)
                    .forEach(issue => generateAISuggestions(issue))
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                <Sparkles className="h-4 w-4" />
                AI Help
              </button>
              
              {dismissedIssues.size > 0 && (
                <button
                  onClick={() => setDismissedIssues(new Set())}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  +{dismissedIssues.size}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Issues List */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(issuesByCategory).length === 0 ? (
          <div className="p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium text-gray-900">Perfect PRD!</p>
            <p className="text-sm text-gray-500 mt-1">No issues found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {Object.entries(issuesByCategory)
              .sort(([, a], [, b]) => {
                // Sort by severity priority
                const severityOrder = { error: 0, warning: 1, info: 2, suggestion: 3 }
                const aMaxSeverity = Math.min(...a.map(issue => severityOrder[issue.severity as keyof typeof severityOrder] ?? 4))
                const bMaxSeverity = Math.min(...b.map(issue => severityOrder[issue.severity as keyof typeof severityOrder] ?? 4))
                return aMaxSeverity - bMaxSeverity
              })
              .map(([category, categoryIssues]) => {
                const isExpanded = expandedCategories.has(category)
                const Icon = getCategoryIcon(category)
                
                return (
                  <div key={category}>
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={getCategoryColor(category)}>{Icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-sm capitalize text-gray-900">{category}</div>
                          <div className="text-xs text-gray-500">
                            {categoryIssues.length} {categoryIssues.length === 1 ? 'issue' : 'issues'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          {categoryIssues.slice(0, 3).map((issue, idx) => (
                            <div key={idx}>
                              {getSeverityIcon(issue.severity)}
                            </div>
                          ))}
                          {categoryIssues.length > 3 && (
                            <span className="text-xs text-gray-400">+{categoryIssues.length - 3}</span>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="divide-y divide-gray-100">
                        {categoryIssues.map((issue) => {
                          const issueId = `${issue.ruleId}-${Math.random()}`
                          const isHovered = hoveredIssue === issueId
                          
                          return (
                            <div 
                              key={issueId}
                              className="relative group"
                            >
                              <div 
                                className={cn(
                                  "p-3 hover:bg-gray-50 cursor-pointer transition-colors border-l-2",
                                  issue.severity === 'error' ? "border-red-400" :
                                  issue.severity === 'warning' ? "border-amber-400" :
                                  issue.severity === 'info' ? "border-blue-400" : "border-purple-400"
                                )}
                                onClick={() => {
                                  // Always call onIssueClick to select text in editor
                                  if (onIssueClick) {
                                    onIssueClick(issue)
                                  }
                                }}
                                onMouseEnter={() => setHoveredIssue(issueId)}
                                onMouseLeave={() => setHoveredIssue(null)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      {getSeverityIcon(issue.severity)}
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {issue.message}
                                      </p>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                      {issue.line && (
                                        <span className="flex items-center gap-1">
                                          <ArrowRight className="h-3 w-3" />
                                          Line {issue.line}
                                        </span>
                                      )}
                                      {issue.matchedText && (
                                        <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono cursor-pointer hover:bg-gray-200 transition-colors" title="Click to select in editor">
                                          "{issue.matchedText.length > 30 ? issue.matchedText.substring(0, 30) + '...' : issue.matchedText}"
                                        </code>
                                      )}
                                    </div>
                                    
                                    {/* AI Suggestions Compact */}
                                    {issue.aiSuggestions && issue.aiSuggestions.length > 0 && (
                                      <div className="mt-2 space-y-1">
                                        {issue.aiSuggestions.slice(0, expandedSuggestions.has(`${issue.ruleId}-${issue.startOffset}`) ? undefined : 1).map((aiSuggestion) => (
                                          <div key={aiSuggestion.id} className="bg-indigo-50 rounded-md px-2 py-1.5">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <div className="flex items-center gap-1 bg-white rounded px-1 py-0.5 border">
                                                  <Star className="h-2.5 w-2.5 text-yellow-500" fill="currentColor" />
                                                  <span className="text-xs font-medium">{Math.round(aiSuggestion.confidence * 100)}%</span>
                                                </div>
                                                <p className="text-xs text-gray-700 truncate flex-1">"{aiSuggestion.text}"</p>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    generateAISuggestions(issue)
                                                  }}
                                                  disabled={loadingSuggestions.has(`${issue.ruleId}-${issue.startOffset}`)}
                                                  className="p-1 hover:bg-purple-100 rounded transition-colors disabled:opacity-50"
                                                  title="Regenerate suggestions"
                                                >
                                                  {loadingSuggestions.has(`${issue.ruleId}-${issue.startOffset}`) ? (
                                                    <Loader2 className="h-3 w-3 text-purple-600 animate-spin" />
                                                  ) : (
                                                    <RefreshCw className="h-3 w-3 text-purple-600" />
                                                  )}
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    applySuggestion(issue, aiSuggestion.text)
                                                  }}
                                                  className="px-2 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700"
                                                >
                                                  Apply
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                        {issue.aiSuggestions.length > 1 && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              const key = `${issue.ruleId}-${issue.startOffset}`
                                              if (expandedSuggestions.has(key)) {
                                                setExpandedSuggestions(prev => {
                                                  const newSet = new Set(prev)
                                                  newSet.delete(key)
                                                  return newSet
                                                })
                                              } else {
                                                setExpandedSuggestions(prev => new Set([...prev, key]))
                                              }
                                            }}
                                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                                          >
                                            {expandedSuggestions.has(`${issue.ruleId}-${issue.startOffset}`) 
                                              ? `Show less` 
                                              : `+${issue.aiSuggestions.length - 1} more suggestions`}
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Quick Actions - Always visible for AI button */}
                                  <div className="flex items-center gap-1">
                                    {anthropicApiKey && issue.startOffset !== undefined && issue.endOffset !== undefined && !issue.aiSuggestions && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          generateAISuggestions(issue)
                                        }}
                                        disabled={loadingSuggestions.has(`${issue.ruleId}-${issue.startOffset}`)}
                                        className="p-1.5 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded hover:from-indigo-600 hover:to-blue-600 transition-all shadow-sm"
                                        title="Generate AI suggestion to fix this issue"
                                      >
                                        {loadingSuggestions.has(`${issue.ruleId}-${issue.startOffset}`) ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                                        ) : (
                                          <Sparkles className="h-3.5 w-3.5 text-white" />
                                        )}
                                      </button>
                                    )}
                                    
                                    {issue.aiSuggestions && issue.aiSuggestions.length > 0 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          applyAllSuggestions(issue)
                                        }}
                                        className="p-1.5 hover:bg-green-100 rounded transition-colors"
                                        title="Apply best suggestion"
                                      >
                                        <ThumbsUp className="h-3.5 w-3.5 text-green-600" />
                                      </button>
                                    )}
                                    
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        dismissIssue(issue)
                                      }}
                                      className="p-1.5 hover:bg-red-100 rounded transition-colors"
                                      title="Dismiss"
                                    >
                                      <X className="h-3.5 w-3.5 text-gray-400" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Hover Suggestions Popup */}
                              {isHovered && issue.suggestions && issue.suggestions.length > 0 && (
                                <div className="absolute left-full ml-2 top-0 z-50 w-72 bg-white border border-gray-200 rounded-lg shadow-lg p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Sparkles className="h-4 w-4 text-purple-500" />
                                    <p className="text-sm font-semibold text-gray-900">
                                      Suggested replacements:
                                    </p>
                                  </div>
                                  <div className="space-y-2">
                                    {issue.suggestions.map((suggestion, idx) => (
                                      <button
                                        key={idx}
                                        className="w-full text-left p-2 text-sm hover:bg-purple-50 rounded border border-transparent hover:border-purple-200 transition-colors"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (issue.startOffset !== undefined && issue.endOffset !== undefined) {
                                            onSuggestionApply?.(issue.startOffset, issue.endOffset, suggestion)
                                          }
                                        }}
                                      >
                                        <div className="flex items-start gap-2">
                                          <ArrowRight className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                          <span className="text-gray-900">{suggestion}</span>
                                        </div>
                                      </button>
                                    ))}
                                  </div>
                                  <p className="text-xs text-gray-500 mt-2 text-center border-t pt-2">
                                    Click to apply replacement
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
    </div>
  )
}