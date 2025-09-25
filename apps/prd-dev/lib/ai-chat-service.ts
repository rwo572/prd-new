import { ApiKeys } from '@/types'
import { getModelById, getRecommendedModel } from './model-config'
import { 
  generateAIGuidedPRD, 
  getNextQuestion, 
  extractAnswers,
  CONTEXT_QUESTIONS 
} from './ai-prd-guidelines'

export interface ChatContext {
  type: 'full' | 'selection'
  content: string
  selectionStart?: number
  selectionEnd?: number
}

export interface StreamCallbacks {
  onThought?: (thought: string) => void
  onContent?: (content: string) => void
  onComplete?: (fullResponse: string) => void
  onError?: (error: string) => void
}

// Track conversation context for PRD generation
interface ConversationContext {
  stage?: '0-to-1' | '1-to-n' | 'n-to-x'
  questionsAsked?: number
  collectedAnswers?: Record<string, string>
}

let conversationContext: ConversationContext = {}

// Helper function to clean up task list formatting
export function cleanTaskListFormatting(content: string): string {
  console.log('🧹 Original content:', JSON.stringify(content.substring(0, 200)))

  // Stage 1: Convert plain checkboxes to proper markdown format
  content = content.replace(/^(\s*)\[\s*\]\s*/gm, '$1- [ ] ')

  // Stage 2: Replace Unicode checkboxes with markdown checkboxes
  content = content.replace(/^(\s*)☐\s*/gm, '$1- [ ] ')
  content = content.replace(/^(\s*)[•\-\*]\s*☐\s*/gm, '$1- [ ] ')

  // Stage 3: Fix bullet + checkbox combinations (most aggressive)
  content = content.replace(/^(\s*)[•\*]\s*-\s*\[\s*\]\s*/gm, '$1- [ ] ')
  content = content.replace(/^(\s*)[•\*]\s*\[\s*\]\s*/gm, '$1- [ ] ')

  // Stage 4: Remove bullets that appear before already correct checkboxes
  content = content.replace(/^(\s*)[•\*]\s+(-\s*\[\s*\])/gm, '$1$2')
  content = content.replace(/^(\s*)([•\*])\s*(-\s*\[\s*\])/gm, '$1$3')

  // Stage 5: Catch any other bullet patterns before checkboxes
  content = content.replace(/^(\s*)([•\*·‣⁃▪▫◦‒–—―])\s*(-?\s*\[\s*\])/gm, '$1- [ ] ')

  // Stage 6: Fix spacing and ensure proper checkbox format
  content = content.replace(/^(\s*)-\s*\[\s*\]\s*/gm, '$1- [ ] ')

  console.log('🧹 Cleaned content:', JSON.stringify(content.substring(0, 200)))
  return content
}

export async function streamChatResponse(
  message: string,
  context: ChatContext | undefined,
  apiKeys: ApiKeys,
  callbacks: StreamCallbacks
) {
  try {
    // Check if this is a request to create a new PRD or if PRD is empty
    const isNewPRDRequest = message.toLowerCase().includes('create a new prd') || 
                            message.toLowerCase().includes('new prd from scratch') ||
                            message.toLowerCase().includes('start from scratch') ||
                            (context?.type === 'full' && context.content.trim().length < 100)
    
    // Check for product stage mentions
    const mentions0to1 = message.toLowerCase().includes('0-to-1') || message.toLowerCase().includes('0 to 1') || 
                         message.toLowerCase().includes('new product') || message.toLowerCase().includes('mvp')
    const mentions1toN = message.toLowerCase().includes('1-to-n') || message.toLowerCase().includes('1 to n') || 
                         message.toLowerCase().includes('scaling') || message.toLowerCase().includes('growth')
    const mentionsNtoX = message.toLowerCase().includes('n-to-x') || message.toLowerCase().includes('n to x') || 
                         message.toLowerCase().includes('optimization') || message.toLowerCase().includes('mature')
    
    // Build the system prompt based on context
    let systemPrompt = ''
    
    if (isNewPRDRequest && !mentions0to1 && !mentions1toN && !mentionsNtoX) {
      // Initial stage identification
      systemPrompt = `You are an AI assistant helping to create a Product Requirements Document (PRD) following best practices.

Since the PRD is empty or you're starting fresh, first identify the product stage:

## What stage is your product at?

**Choose one:**

🚀 **0→1 (Discovery & Validation)** 
Creating something completely new. You need to validate product-market fit through rapid experimentation.
- No existing users or product
- Exploring problem space
- Building MVP

📈 **1→n (Scaling & Growth)**
You have initial traction and want to scale. Focus on expanding proven value to more users/segments.
- 100-1000 existing users
- Product-market fit validated
- Ready to grow

⚡ **n→x (Optimization & Differentiation)**
Mature product seeking optimization. Focus on market leadership and advanced features.
- 10,000+ users
- Established market position
- Optimizing for scale

Please tell me which stage best describes your product, and I'll guide you through the appropriate PRD creation process with targeted questions.`
    } else if (mentions0to1) {
      systemPrompt = `You are an AI assistant helping create a 0→1 (Discovery & Validation) PRD.

For a 0→1 product, ask these key questions:

1. **Core Problem**: What specific problem are you solving that hasn't been solved before? What evidence do you have that this problem exists?

2. **Beachhead Customer**: Who is your initial target user segment? Be specific - "busy professionals" is too broad. Think "product managers at B2B SaaS startups with 50-200 employees."

3. **Riskiest Assumption**: What's the biggest assumption that, if wrong, would invalidate your entire approach? How will you test it quickly?

4. **AI Capability**: What type of AI capability is core to your solution?
   - Generation (creating content/code/designs)
   - Classification (categorizing/routing/filtering)
   - Recommendation (suggesting next actions)
   - Analysis (extracting insights/patterns)

5. **Success Criteria**: How will you know you've achieved initial product-market fit? (e.g., 10+ users complete core workflow, 40% would be "very disappointed" without it)

After getting answers, I'll generate a comprehensive 0→1 PRD using our AI PRD template that includes:
- Executive Summary with vision and 4-week MVP timeline
- Problem Definition with evidence and assumptions
- Solution Design with MVP scope
- Behavioral Contract for AI
- Validation Strategy with experiments
- Kill Criteria (what would make you stop)
- Resource Requirements (~$1,000 budget)
- Immediate next actions

Please answer these questions, and I'll create your PRD.

CRITICAL FORMATTING: For task lists, use standard markdown format: "- [ ] Task description". NEVER add extra bullets before checkboxes. FORBIDDEN FORMATS: "• - [ ]", "* - [ ]", "• ☐". Use proper line breaks between tasks for readability.`
    } else if (mentions1toN) {
      systemPrompt = `You are an AI assistant helping create a 1→n (Scaling & Growth) PRD.

For a 1→n product, ask these key questions:

1. **Current State**: What's working well with your existing product? What are your key metrics (users, retention, NPS)? What feedback patterns have emerged?

2. **Growth Lever**: What's your primary growth constraint right now?
   - Awareness (people don't know you exist)
   - Activation (users try but don't succeed)
   - Retention (users leave after initial use)
   - Expansion (users want more capabilities)

3. **Segment Expansion**: Which adjacent user segment represents your best growth opportunity? How similar are their needs to your current users?

4. **AI Enhancement**: How can AI capabilities amplify your proven value?
   - Personalization (adapting to user preferences)
   - Automation (removing manual steps)
   - Intelligence (smarter recommendations)
   - Scale (handling more complexity)

5. **Risk Management**: What could break as you scale 10x? What guardrails need to be in place?

After getting answers, I'll generate a comprehensive 1→n PRD using our AI PRD template that includes:
- Executive Summary with 10x growth vision
- Market Analysis with TAM/SAM/SOM
- User Segmentation & Personas
- Feature Roadmap (Now/Next/Later)
- AI Enhancement Strategy
- Growth Metrics & Targets
- Technical Architecture for Scale
- Go-to-Market Strategy
- Risk Mitigation Plan

Please answer these questions, and I'll create your scaling PRD.

CRITICAL FORMATTING: For task lists, use standard markdown format: "- [ ] Task description". NEVER add extra bullets before checkboxes. FORBIDDEN FORMATS: "• - [ ]", "* - [ ]", "• ☐". Use proper line breaks between tasks for readability.`
    } else if (mentionsNtoX) {
      systemPrompt = `You are an AI assistant helping create an n→x (Optimization & Differentiation) PRD.

For an n→x product, ask these key questions:

1. **Market Position**: What's your current market share? Who are your main competitors? What's your unique differentiation?

2. **Platform Vision**: How can you evolve from a product to a platform?
   - Ecosystem (third-party integrations)
   - Marketplace (user-generated value)
   - API/SDK (developer platform)
   - Multi-product suite

3. **Enterprise Readiness**: What enterprise features are blocking large deals?
   - Security & Compliance (SOC2, GDPR, SSO)
   - Administration (role-based access, audit logs)
   - Customization (white-label, workflows)
   - Support (SLAs, dedicated success)

4. **AI Moat**: What AI capabilities would be defensible and hard to replicate?
   - Proprietary data advantage
   - Custom model training
   - Domain-specific intelligence
   - Network effects from AI

5. **Strategic Bets**: What bold moves could create step-function growth? What would you build if you had unlimited resources?

After getting answers, I'll generate a comprehensive n→x PRD using our AI PRD template that includes:
- Strategic Vision & 3-Year Roadmap
- Competitive Analysis & Positioning
- Platform Architecture & Ecosystem
- Enterprise Feature Requirements
- AI Innovation Strategy
- Revenue Model Evolution
- Partnership & M&A Opportunities
- Organizational Scaling Plan
- Success Metrics & Market Leadership KPIs

Please answer these questions, and I'll create your optimization PRD.

CRITICAL FORMATTING: For task lists, use standard markdown format: "- [ ] Task description". NEVER add extra bullets before checkboxes. FORBIDDEN FORMATS: "• - [ ]", "* - [ ]", "• ☐". Use proper line breaks between tasks for readability.`
    } else {
      systemPrompt = `You are an AI assistant helping to improve a Product Requirements Document (PRD).

Your task is to analyze the content and provide TWO distinct responses:

RESPONSE STRUCTURE (REQUIRED):
You MUST provide your response in exactly this format with the separator:

[IMPROVEMENTS]
## Key Improvements Needed

Provide 3-5 specific improvements in a conversational, easy-to-read format:
• Issue: Clear explanation of what needs improvement
• Why: Brief reason this matters
• Fix: Specific recommendation

Use bullet points and clear formatting. Be conversational and direct.

[MARKDOWN_CHANGES]
## Suggested Markdown

Provide the EXACT markdown text that should replace or be inserted into the document.
This should be the actual content, properly formatted in markdown, ready to be inserted.
Keep it focused on the most important change.

IMPORTANT:
- The [IMPROVEMENTS] section should be styled text explaining the issues
- The [MARKDOWN_CHANGES] section should be the actual markdown to insert
- Always include both sections separated by the markers shown above

CRITICAL FORMATTING RULES - MUST FOLLOW EXACTLY:
- For task lists and checklists, use standard markdown format: "- [ ] Task description"
- NEVER add extra bullets before checkboxes
- FORBIDDEN FORMATS: "• - [ ]", "* - [ ]", "• ☐"
- CORRECT FORMAT: "- [ ] Task description" with proper line breaks
- Example: "- [ ] Set up development environment" NOT "• - [ ] Set up development environment"
- Use proper line breaks between tasks for readability
- For user stories, use numbered lists or bullets, NOT checkboxes
- Keep formatting clean and readable`
    }

    // Check if we should generate a full PRD based on collected answers
    const lowerMessage = message.toLowerCase()
    const isAnsweringQuestions = conversationContext.questionsAsked && conversationContext.questionsAsked > 0
    
    if (isAnsweringQuestions) {
      // Extract answers from the user's message
      const answers = extractAnswers(message)
      conversationContext.collectedAnswers = {
        ...conversationContext.collectedAnswers,
        ...answers
      } as Record<string, string>
      
      // After 2-3 questions, generate the PRD
      if ((conversationContext.questionsAsked || 0) >= 2 || 
          lowerMessage.includes('generate') || 
          lowerMessage.includes('create the prd')) {
        
        // Generate the PRD based on stage and collected context
        const prdContent = await generateAIGuidedPRD(conversationContext.collectedAnswers as any)
        
        // Update system prompt to output the generated PRD
        systemPrompt = `You are an AI assistant that has collected information about a product. 
        Based on the conversation, here is the generated PRD:\n\n${prdContent}\n\n
        Present this PRD to the user in a clear, formatted way.`
        
        // Reset context after generation
        conversationContext = {}
      } else {
        // Get the next question to ask - fixed productStage error
        const nextQuestion = getNextQuestion({
          messages: [],
          currentAnswers: conversationContext.collectedAnswers || {},
          questionCount: conversationContext.questionsAsked || 0
        })
        if (nextQuestion) {
          conversationContext.questionsAsked = (conversationContext.questionsAsked || 0) + 1
          systemPrompt += `\n\nBased on the answer provided, ask: ${nextQuestion}`
        }
      }
    }
    
    // Track if we're starting a stage-based conversation
    if (mentions0to1) conversationContext.stage = '0-to-1'
    if (mentions1toN) conversationContext.stage = '1-to-n'
    if (mentionsNtoX) conversationContext.stage = 'n-to-x'
    
    if (conversationContext.stage && !conversationContext.questionsAsked) {
      conversationContext.questionsAsked = 1
    }
    
    // Build the user message with context
    let enhancedMessage = message
    if (context) {
      if (context.type === 'full') {
        systemPrompt += `\n\nYou are reviewing the entire PRD document. Identify the 3-5 most critical improvements that would have the biggest impact on the document's quality and completeness.`
        enhancedMessage = `${message}\n\n===FULL DOCUMENT===\n${context.content}`
      } else if (context.type === 'selection') {
        systemPrompt += `\n\nYou are reviewing a selected section. Focus ONLY on this specific section and provide 2-3 targeted improvements for just this part.`
        enhancedMessage = `${message}\n\n===SELECTED SECTION===\n${context.content}\n===END SECTION===`
      }
    }

    // Get the selected model
    const selectedModel = apiKeys.selectedModel 
      ? getModelById(apiKeys.selectedModel)
      : getRecommendedModel('chat')
    
    if (!selectedModel) {
      throw new Error('No model selected')
    }

    const apiKey = selectedModel.provider === 'anthropic' ? apiKeys.anthropic : apiKeys.openai
    
    if (!apiKey) {
      throw new Error(`No API key configured for ${selectedModel.provider}`)
    }

    // Start streaming
    callbacks.onThought?.('')

    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
      console.log('Request timeout after 2 minutes')
      controller.abort()
    }, 120000) // 2 minute timeout

    const response = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: enhancedMessage,
        systemPrompt,
        apiKey,
        modelId: selectedModel.id,
        provider: selectedModel.provider,
        stream: true
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''

    if (!reader) {
      throw new Error('Response body is not readable')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)

              if (parsed.content) {
                fullResponse += parsed.content
                const cleanedResponse = cleanTaskListFormatting(fullResponse)
                callbacks.onContent?.(cleanedResponse)
              } else if (parsed.error) {
                callbacks.onError?.(parsed.error)
                return
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream reading error:', error)
      callbacks.onError?.('Stream connection failed. Please try again.')
      return
    } finally {
      reader.releaseLock()
    }

    // Always call onComplete, even if response is empty
    if (fullResponse) {
      const finalCleanedResponse = cleanTaskListFormatting(fullResponse)
      callbacks.onComplete?.(finalCleanedResponse)
    } else {
      // If no response, call onError to reset state
      callbacks.onError?.('No response received from AI. Please try again.')
    }
  } catch (error) {
    console.error('Stream chat error:', error)
    // More specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        callbacks.onError?.('Request was cancelled or timed out. Please try again.')
      } else if (error.message.includes('API key')) {
        callbacks.onError?.('Invalid API key. Please check your settings.')
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        callbacks.onError?.('Network error. Please check your connection and try again.')
      } else if (error.message.includes('API error')) {
        callbacks.onError?.(error.message)
      } else {
        // Don't show generic errors that might be parsing issues
        console.error('Error details:', error)
        callbacks.onError?.('Failed to process response. Please try again.')
      }
    } else {
      callbacks.onError?.('An unexpected error occurred.')
    }
  }
}