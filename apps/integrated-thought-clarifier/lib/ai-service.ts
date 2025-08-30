import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { PRDContext, AIResponse, ApiKeys } from '@/types'

const SYSTEM_PROMPT = `You are an expert product manager helping to create comprehensive Product Requirements Documents (PRDs). 
Your role is to:
1. Ask clarifying questions to understand the product vision
2. Identify missing requirements and edge cases
3. Structure information into a clear, actionable PRD
4. Ensure requirements are specific, measurable, and testable
5. Generate PRDs that are optimized for AI prototype generation

When updating a PRD, maintain consistency with existing content while adding new information.`

export async function generatePRD(
  context: PRDContext,
  apiKeys: ApiKeys
): Promise<AIResponse> {
  const { messages, currentPRD, projectName } = context
  const lastMessage = messages[messages.length - 1]

  if (!apiKeys.openai && !apiKeys.anthropic) {
    throw new Error('Please configure at least one API key in Settings')
  }

  const contextPrompt = currentPRD
    ? `Current PRD content:\n\n${currentPRD}\n\nProject: ${projectName}\n\nUser message: ${lastMessage.content}`
    : `Project: ${projectName}\n\nUser message: ${lastMessage.content}`

  try {
    if (apiKeys.activeProvider === 'openai' && apiKeys.openai) {
      const openai = new OpenAI({
        apiKey: apiKeys.openai,
        dangerouslyAllowBrowser: true
      })

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: contextPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const response = completion.choices[0].message.content || ''
      return parseAIResponse(response, currentPRD)
    }

    if (apiKeys.activeProvider === 'anthropic' && apiKeys.anthropic) {
      const anthropic = new Anthropic({
        apiKey: apiKeys.anthropic,
        dangerouslyAllowBrowser: true
      })

      const completion = await anthropic.messages.create({
        model: 'claude-3-opus-20240229',
        messages: [
          { role: 'user', content: contextPrompt }
        ],
        system: SYSTEM_PROMPT,
        max_tokens: 2000
      })

      const response = completion.content[0].type === 'text' 
        ? completion.content[0].text 
        : ''
      return parseAIResponse(response, currentPRD)
    }

    throw new Error('No valid API key for selected provider')
  } catch (error) {
    console.error('AI Service Error:', error)
    throw error
  }
}

function parseAIResponse(response: string, currentPRD: string): AIResponse {
  // Check if response contains PRD update markers
  if (response.includes('[PRD_UPDATE]') && response.includes('[/PRD_UPDATE]')) {
    const prdMatch = response.match(/\[PRD_UPDATE\]([\s\S]*?)\[\/PRD_UPDATE\]/)
    const updatedPRD = prdMatch ? prdMatch[1].trim() : currentPRD
    const message = response.replace(/\[PRD_UPDATE\][\s\S]*?\[\/PRD_UPDATE\]/, '').trim()
    
    return {
      message: message || 'I\'ve updated the PRD based on your input.',
      updatedPRD
    }
  }

  // Check if this looks like a complete PRD
  if (response.includes('# ') && response.includes('## ') && response.length > 500) {
    return {
      message: 'I\'ve generated a PRD structure based on your requirements. You can now edit it in the PRD Editor tab.',
      updatedPRD: response
    }
  }

  // Otherwise, treat as conversational response
  return {
    message: response,
    suggestions: extractSuggestions(response)
  }
}

function extractSuggestions(response: string): string[] {
  const suggestions: string[] = []
  
  // Look for numbered lists or bullet points that might be suggestions
  const bulletPoints = response.match(/^[•\-\*]\s+(.+)$/gm)
  const numberedItems = response.match(/^\d+\.\s+(.+)$/gm)
  
  if (bulletPoints) {
    suggestions.push(...bulletPoints.map(item => item.replace(/^[•\-\*]\s+/, '')))
  }
  
  if (numberedItems) {
    suggestions.push(...numberedItems.map(item => item.replace(/^\d+\.\s+/, '')))
  }
  
  return suggestions.slice(0, 5) // Limit to 5 suggestions
}