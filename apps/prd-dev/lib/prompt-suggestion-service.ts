import { ApiKeys } from '@/types'
import { getModelById } from './model-config'

export interface PromptSuggestion {
  icon: string
  label: string
  prompt: string
}

// AI PRD Guidelines context for better prompt generation
const PRD_GUIDELINES_CONTEXT = `
You are an expert in Product Requirements Documents (PRDs) following best practices from:
- Amazon's Working Backwards methodology (PR/FAQ process)
- AI product behavioral contracts and safety rules
- Product stage frameworks (0-to-1, 1-to-n, n-to-x)
- Quality standards for AI products

Key PRD sections to consider:
- Problem Definition & Customer Needs
- Solution Design & Technical Specs
- Success Metrics & KPIs
- Risk Assessment & Mitigations
- Implementation Timeline & Resources
- AI Behavioral Contracts & Edge Cases
`

export async function generatePromptSuggestions(
  selectedText: string,
  apiKeys: ApiKeys,
  prdContent?: string
): Promise<PromptSuggestion[]> {
  // Default suggestions if API call fails
  const defaultSuggestions: PromptSuggestion[] = [
    { icon: '✨', label: 'Improve clarity', prompt: 'Make this section clearer and more concise' },
    { icon: '📝', label: 'Add details', prompt: 'Add more specific details and examples' },
    { icon: '🎯', label: 'Make actionable', prompt: 'Make this more actionable with specific steps' }
  ]

  // Determine which model and API key to use
  const selectedModel = apiKeys.selectedModel 
    ? getModelById(apiKeys.selectedModel)
    : null
    
  const provider = selectedModel?.provider || (apiKeys.anthropic ? 'anthropic' : 'openai')
  const apiKey = provider === 'anthropic' ? apiKeys.anthropic : apiKeys.openai
  const modelId = selectedModel?.id || (provider === 'anthropic' ? 'claude-3-5-haiku-20241022' : 'gpt-4o-mini')

  if (!apiKey) {
    return getQuickPromptSuggestions(selectedText).slice(0, 3)
  }

  try {
    const response = await fetch('/api/generate-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        selectedText: selectedText.slice(0, 800), // Increased context
        prdContext: prdContent?.slice(0, 1000), // Add PRD context
        guidelines: PRD_GUIDELINES_CONTEXT,
        apiKey,
        provider,
        modelId
      })
    })

    if (!response.ok) {
      console.warn('Failed to generate prompts, using defaults')
      return defaultSuggestions
    }

    const data = await response.json()
    return data.suggestions || defaultSuggestions
  } catch (error) {
    console.error('Error generating prompt suggestions:', error)
    return defaultSuggestions
  }
}

export function getQuickPromptSuggestions(selectedText: string, prdStage?: string): PromptSuggestion[] {
  const text = selectedText.toLowerCase()
  const suggestions: PromptSuggestion[] = []
  
  // Get a preview of the selected text for context
  const preview = selectedText.slice(0, 50)
  const textSnippet = preview + (selectedText.length > 50 ? '...' : '')
  
  // Add stage-specific suggestions if PRD stage is detected
  if (prdStage) {
    if (prdStage === '0-to-1') {
      suggestions.push({
        icon: '🚀',
        label: 'Validate assumptions',
        prompt: `Identify key assumptions to validate for "${textSnippet}"`
      })
    } else if (prdStage === '1-to-n') {
      suggestions.push({
        icon: '📈',
        label: 'Scaling strategy',
        prompt: `Define scaling approach for "${textSnippet}"`
      })
    } else if (prdStage === 'n-to-x') {
      suggestions.push({
        icon: '⚡',
        label: 'Optimize performance',
        prompt: `Suggest optimizations for "${textSnippet}"`
      })
    }
  }

  // Analyze the content to provide contextual suggestions
  if (text.includes('user') || text.includes('customer') || text.includes('persona')) {
    suggestions.push({
      icon: '👥',
      label: 'Expand user stories',
      prompt: `Expand "${textSnippet}" into detailed user stories`
    })
  }

  if (text.includes('feature') || text.includes('functionality')) {
    suggestions.push({
      icon: '⚙️',
      label: 'Technical specs',
      prompt: `Add technical specs for "${textSnippet}"`
    })
  }

  if (text.includes('goal') || text.includes('objective') || text.includes('success')) {
    suggestions.push({
      icon: '🎯',
      label: 'Define metrics',
      prompt: `Define success metrics for "${textSnippet}"`
    })
  }

  if (text.includes('problem') || text.includes('issue') || text.includes('challenge')) {
    suggestions.push({
      icon: '💡',
      label: 'Propose solutions',
      prompt: `Propose solutions for "${textSnippet}"`
    })
  }

  if (text.includes('requirement') || text.includes('need')) {
    suggestions.push({
      icon: '✅',
      label: 'Add criteria',
      prompt: `Add acceptance criteria for "${textSnippet}"`
    })
  }

  if (text.includes('api') || text.includes('endpoint') || text.includes('integration')) {
    suggestions.push({
      icon: '🔌',
      label: 'API docs',
      prompt: `Document API details for "${textSnippet}"`
    })
  }

  if (text.includes('design') || text.includes('ui') || text.includes('ux')) {
    suggestions.push({
      icon: '🎨',
      label: 'Design details',
      prompt: `Add UI/UX details for "${textSnippet}"`
    })
  }

  if (text.includes('test') || text.includes('qa') || text.includes('quality')) {
    suggestions.push({
      icon: '🧪',
      label: 'Test scenarios',
      prompt: `Generate test cases for "${textSnippet}"`
    })
  }

  if (text.includes('risk') || text.includes('concern') || text.includes('limitation')) {
    suggestions.push({
      icon: '⚠️',
      label: 'Risk mitigation',
      prompt: `Identify risks in "${textSnippet}"`
    })
  }

  if (text.includes('timeline') || text.includes('schedule') || text.includes('deadline')) {
    suggestions.push({
      icon: '📅',
      label: 'Timeline',
      prompt: `Break down timeline for "${textSnippet}"`
    })
  }

  // Add context-specific general suggestions if we don't have enough
  if (suggestions.length < 2) {
    suggestions.push({
      icon: '✨',
      label: 'Improve clarity',
      prompt: `Make "${textSnippet}" clearer and more concise`
    })
    suggestions.push({
      icon: '📝',
      label: 'Add details',
      prompt: `Expand "${textSnippet}" with more details`
    })
  }

  return suggestions.slice(0, 2) // Return max 2 suggestions
}