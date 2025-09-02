import { LintIssue, ParsedPRD } from '@/types/prd-linter'

interface SuggestionContext {
  content: string
  issue: LintIssue
  surroundingText: string
  isAIProduct: boolean
}

interface AISuggestion {
  text: string
  confidence: number
  explanation: string
}

export class AISuggestionService {
  private static instance: AISuggestionService
  private apiKey: string | null = null
  private model: string = 'claude-3-haiku-20240307'

  private constructor() {}

  static getInstance(): AISuggestionService {
    if (!AISuggestionService.instance) {
      AISuggestionService.instance = new AISuggestionService()
    }
    return AISuggestionService.instance
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  setModel(model: string) {
    this.model = model
  }

  async generateSuggestions(context: SuggestionContext): Promise<AISuggestion[]> {
    if (!this.apiKey) {
      return this.getFallbackSuggestions(context.issue)
    }

    try {
      const prompt = this.buildPrompt(context)
      const response = await this.callAnthropicAPI(prompt)
      return this.parseSuggestions(response)
    } catch (error) {
      console.warn('AI suggestion generation failed, using fallback:', error)
      return this.getFallbackSuggestions(context.issue)
    }
  }

  private buildPrompt(context: SuggestionContext): string {
    const { content, issue, surroundingText, isAIProduct } = context

    return `You are an expert product manager reviewing a PRD. Generate 2-3 specific, actionable suggestions to fix this issue.

CONTEXT:
- Product Type: ${isAIProduct ? 'AI/ML Product' : 'General Software Product'}
- Issue: ${issue.message}
- Rule: ${issue.ruleId}
- Severity: ${issue.severity}

PROBLEMATIC TEXT:
"${issue.matchedText || 'N/A'}"

SURROUNDING CONTEXT:
"${surroundingText}"

REQUIREMENTS:
1. Each suggestion should be a direct replacement for the problematic text
2. Keep suggestions concise and specific
3. Consider the product context (${isAIProduct ? 'AI-specific concerns like bias, explainability, data requirements' : 'general software development practices'})
4. Provide 2-3 alternatives with different approaches

IMPORTANT: Respond with ONLY valid JSON, no markdown code blocks or extra formatting:
{
  "suggestions": [
    {
      "text": "replacement text",
      "confidence": 0.8,
      "explanation": "brief explanation why this works"
    }
  ]
}`
  }

  private async callAnthropicAPI(prompt: string): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add API key to headers if available
    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey
    }

    const response = await fetch('/api/anthropic', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: this.model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  private parseSuggestions(response: string): AISuggestion[] {
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanResponse = response.trim()
      
      // Remove markdown code blocks
      if (cleanResponse.startsWith('```json') || cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/^```(?:json)?\s*/, '')
        cleanResponse = cleanResponse.replace(/```\s*$/, '')
        cleanResponse = cleanResponse.trim()
      }
      
      const parsed = JSON.parse(cleanResponse)
      if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
        throw new Error('Invalid response format')
      }

      return parsed.suggestions.map((s: any) => ({
        text: s.text || '',
        confidence: Math.max(0, Math.min(1, s.confidence || 0.5)),
        explanation: s.explanation || 'AI-generated suggestion'
      }))
    } catch (error) {
      console.warn('Failed to parse AI suggestions:', error, 'Raw response:', response)
      return []
    }
  }

  private getFallbackSuggestions(issue: LintIssue): AISuggestion[] {
    // Return existing static suggestions with confidence scores
    const suggestions: AISuggestion[] = []

    if (issue.suggestion) {
      suggestions.push({
        text: issue.suggestion,
        confidence: 0.7,
        explanation: 'Rule-based suggestion'
      })
    }

    if (issue.suggestions) {
      issue.suggestions.forEach((text, index) => {
        suggestions.push({
          text,
          confidence: 0.6 - (index * 0.1),
          explanation: 'Rule-based alternative'
        })
      })
    }

    return suggestions.slice(0, 3) // Limit to 3 suggestions max
  }

  private extractSurroundingText(content: string, startOffset: number, endOffset: number, contextSize: number = 200): string {
    const start = Math.max(0, startOffset - contextSize)
    const end = Math.min(content.length, endOffset + contextSize)
    
    const before = content.substring(start, startOffset)
    const matched = content.substring(startOffset, endOffset)
    const after = content.substring(endOffset, end)
    
    return `...${before}[${matched}]${after}...`
  }

  async generateContextualSuggestions(
    content: string, 
    issue: LintIssue, 
    isAIProduct: boolean = false
  ): Promise<AISuggestion[]> {
    const startOffset = issue.startOffset || 0
    const endOffset = issue.endOffset || startOffset
    
    const surroundingText = this.extractSurroundingText(content, startOffset, endOffset)
    
    const context: SuggestionContext = {
      content,
      issue,
      surroundingText,
      isAIProduct
    }

    return this.generateSuggestions(context)
  }
}

export const aiSuggestionService = AISuggestionService.getInstance()