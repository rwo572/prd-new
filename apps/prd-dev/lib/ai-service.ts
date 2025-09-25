import { PRDContext, AIResponse, ApiKeys } from '@/types'
import { 
  generateAIGuidedPRD, 
  getNextQuestion, 
  extractAnswers,
  SCOPE_QUESTIONS,
  CONTEXT_QUESTIONS,
  ProductStage 
} from './ai-prd-guidelines'
import { getModelById, getRecommendedModel } from './model-config'

// Check if we're in demo mode (no API keys configured)
function isDemoMode(apiKeys: ApiKeys): boolean {
  return !apiKeys.openai && !apiKeys.anthropic && !apiKeys.gemini
}

export async function generatePRD(
  context: PRDContext,
  apiKeys: ApiKeys
): Promise<AIResponse> {
  const { messages, currentPRD, projectName } = context
  const lastMessage = messages[messages.length - 1]

  // Use mock responses in demo mode
  if (isDemoMode(apiKeys)) {
    return generateMockResponse(lastMessage.content, currentPRD, projectName)
  }

  // Build conversation history for context
  const conversationHistory = messages.map(m => 
    `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
  ).join('\n\n')
  
  // Count assistant messages to track progress
  const assistantMessages = messages.filter(m => m.role === 'assistant')
  const questionCount = assistantMessages.length
  
  // Check what's been collected
  const hasAskedStage = assistantMessages.some(m => 
    m.content.toLowerCase().includes('what stage') && 
    (m.content.includes('0→1') || m.content.includes('0-1'))
  )
  
  const hasStageAnswer = messages.some(m => 
    m.role === 'user' && (
      m.content.toLowerCase().includes('0-1') ||
      m.content.toLowerCase().includes('0→1') ||
      m.content.toLowerCase().includes('1-n') ||
      m.content.toLowerCase().includes('1→n') ||
      m.content.toLowerCase().includes('n-x') ||
      m.content.toLowerCase().includes('n^x') ||
      m.content.toLowerCase().includes('new') ||
      m.content.toLowerCase().includes('scaling') ||
      m.content.toLowerCase().includes('optimiz')
    )
  )
  
  let contextPrompt = `Project: ${projectName}\n\nConversation history:\n${conversationHistory}\n\n`
  
  if (currentPRD) {
    contextPrompt += `Current PRD:\n${currentPRD}\n\n`
  }
  
  // Guide the AI based on conversation state - SMART APPROACH: Generate PRD when you have enough info
  if (questionCount === 0) {
    contextPrompt += `This is your first message. Ask a simple, conversational question about what they want to build. Keep it casual and friendly. Example: "What are you looking to build?" or "Tell me about your product idea!"`
  } else if (questionCount >= 1) {
    contextPrompt += `You've asked ${questionCount} question${questionCount > 1 ? 's' : ''}.

DECISION POINT: Look at the conversation history. Do you have enough core information to write a meaningful PRD? Consider:
- What the product is and what problem it solves
- Who the target users are
- Basic understanding of key features/value prop

IF YES: Generate a comprehensive PRD now using [PRD_UPDATE] markers. Include sections: Executive Summary, Problem Definition, Solution Design, Success Metrics, Implementation Plan, and Risks.

IF NO and you've asked fewer than 4 questions: Ask ONE more simple, conversational follow-up question to get the most critical missing information.

IF NO but you've asked 4+ questions: Generate the PRD anyway with what you have - don't keep asking questions.

Keep any questions short, conversational, and easy to answer. Prioritize generating the PRD over perfect information.

CRITICAL FORMATTING: For task lists in PRDs, use standard markdown format: "- [ ] Task description". NEVER add extra bullets before checkboxes. FORBIDDEN FORMATS: "• - [ ]", "* - [ ]", "• ☐". Use proper line breaks between tasks for readability.`
  }

  try {
    // Get the selected model or use recommended model for PRD generation
    const selectedModel = apiKeys.selectedModel 
      ? getModelById(apiKeys.selectedModel)
      : getRecommendedModel('prd-generation')
    
    if (!selectedModel) {
      throw new Error('No model selected')
    }

    const apiKey = selectedModel.provider === 'openai' ? apiKeys.openai : apiKeys.anthropic
    
    if (!apiKey) {
      throw new Error('No valid API key for selected provider')
    }

    // Use API route to avoid CORS issues
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: contextPrompt,
        modelId: selectedModel.id,
        apiKey,
        provider: selectedModel.provider
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to generate response')
    }

    const data = await response.json()
    return parseAIResponse(data.response, currentPRD)
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

// Helper to extract product type from message
function extractProductType(message: string): string {
  if (message.includes('marketplace')) return 'Marketplace Platform'
  if (message.includes('social')) return 'Social Platform'
  if (message.includes('analytics')) return 'Analytics Dashboard'
  if (message.includes('crm')) return 'CRM System'
  if (message.includes('ecommerce') || message.includes('e-commerce')) return 'E-commerce Platform'
  if (message.includes('saas')) return 'SaaS Application'
  if (message.includes('mobile')) return 'Mobile App'
  if (message.includes('api')) return 'API Service'
  return 'Web Application'
}

// Generate a generic but useful PRD
function generateGenericPRD(productName: string, userMessage: string): string {
  return `# ${productName} PRD

## Executive Summary
A ${productName.toLowerCase()} that addresses [specific user need] through [key innovation].

## Problem Statement
Users currently struggle with:
- Manual, time-consuming processes
- Lack of visibility into key metrics
- Fragmented tools and workflows
- Poor user experience in existing solutions

## Target Users
**Primary:** Tech-savvy early adopters who need efficient solutions
**Secondary:** Businesses looking to modernize their operations

## Core Features (MVP)

### Phase 1: Foundation (Week 1-2)
- ✅ User authentication & onboarding
- ✅ Core data model & API
- ✅ Basic CRUD operations
- ✅ Responsive web interface

### Phase 2: Value Delivery (Week 3-4)
- 📊 Dashboard with key metrics
- 🔍 Search and filtering
- 📱 Mobile-responsive design
- 🔔 Notification system

### Phase 3: Growth (Month 2)
- 👥 Team collaboration features
- 📈 Advanced analytics
- 🔗 Third-party integrations
- 🎯 Personalization engine

## User Stories
1. As a new user, I can sign up and see value within 60 seconds
2. As a daily user, I can complete my core workflow in <5 clicks
3. As an admin, I can manage users and permissions easily

## Technical Stack
- **Frontend:** React/Next.js with TypeScript
- **Backend:** Node.js with Express/Fastify
- **Database:** PostgreSQL with Redis cache
- **Infrastructure:** AWS/Vercel deployment
- **Monitoring:** Sentry, DataDog

## Success Metrics
- Activation rate: >60% complete first action
- Retention: >40% weekly active users
- Performance: <100ms API response time
- Reliability: 99.9% uptime

## MVP Timeline
- **Week 1:** Technical setup & authentication
- **Week 2:** Core features implementation
- **Week 3:** Testing & refinement
- **Week 4:** Beta launch with 50 users

## Risks & Mitigations
| Risk | Mitigation |
|------|------------|
| Technical complexity | Start with proven tech stack |
| User adoption | Launch with focused user group |
| Scaling challenges | Design for horizontal scaling |

## Next Steps
1. Validate assumptions with 5 user interviews
2. Create low-fi wireframes
3. Set up development environment
4. Build MVP prototype`
}

// Track conversation context for scope narrowing
let conversationContext: Record<string, string> = {}
let questionCount = 0

// Mock response generator for demo mode - NOW USES AI PRD GUIDELINES
function generateMockResponse(
  userMessage: string,
  currentPRD: string,
  projectName: string
): Promise<AIResponse> {
  const lowerMessage = userMessage.toLowerCase()
  
  // Extract answers from user message
  const newAnswers = extractAnswers(lowerMessage)
  // Filter out undefined values to maintain Record<string, string> type
  Object.entries(newAnswers).forEach(([key, value]) => {
    if (value !== undefined) {
      conversationContext[key] = value
    }
  })
  
  // Simulate thinking delay
  const delay = Math.random() * 500 + 300 // Faster response
  
  return new Promise((resolve) => {
    setTimeout(() => {
      // ALWAYS get the next question first
      const nextQuestion = getNextQuestion({ 
        messages: [], 
        currentAnswers: conversationContext,
        questionCount 
      })
      
      // Keep questions simple and conversational, max 6 questions
      if (questionCount === 0) {
        questionCount++
        resolve({
          message: `Hi! I'd love to help you create a PRD. What are you looking to build?`
        })
        return
      } else if (questionCount < 6 && (!currentPRD || currentPRD.length < 100)) {
        questionCount++
        // Generate simple follow-up questions based on what we know
        const simpleQuestions = [
          "Who would use this product?",
          "What problem does this solve for them?",
          "How would this be different from what's available today?",
          "What would success look like?",
          "What's the most important feature to get right?"
        ]
        const questionIndex = Math.min(questionCount - 2, simpleQuestions.length - 1)
        resolve({
          message: simpleQuestions[questionIndex] || "Tell me more about your vision for this product."
        })
        return
      }
      
      // Once we have stage, generate PRD and ask next question
      if (!currentPRD || currentPRD.length < 100) {
        const stage = conversationContext.productStage as ProductStage
        questionCount++
        
        // Generate stage-appropriate message and PRD
        let stageMessage = ''
        if (stage === '0-to-1') {
          stageMessage = "Great! You're building something new. I'll structure your PRD for discovery and validation."
        } else if (stage === '1-to-n') {
          stageMessage = "Perfect! You're ready to scale. I'll focus your PRD on growth and expansion."
        } else if (stage === 'n-to-x') {
          stageMessage = "Excellent! You're optimizing a mature product. I'll structure your PRD around improvements and differentiation."
        }
        
        // Generate stage-specific PRD using the new templates
        const prdContent = generateAIGuidedPRD({
          productName: projectName || 'Your Product',
          productStage: stage,
          aiCapability: conversationContext.aiCapability,
          targetUser: conversationContext.targetUser,
          successMetric: conversationContext.successMetric,
          coreProblem: conversationContext.coreProblem
        })
        
        // Ask ONE next question if we have one
        if (nextQuestion) {
          resolve({
            message: `${stageMessage}

**${nextQuestion}**

I've created your ${stage} PRD structure →`,
            updatedPRD: prdContent,
            suggestions: [
              'Tell me more about your target users',
              "What's your unique differentiator?",
              'What are your success criteria?'
            ]
          })
        } else {
          // No more questions, just provide the PRD
          resolve({
            message: `${stageMessage}

I've created your ${stage} PRD. Feel free to share more details to refine it further →`,
            updatedPRD: prdContent
          })
        }
      } else {
        // Subsequent responses - refine the PRD
        if (lowerMessage.includes('user') || lowerMessage.includes('persona')) {
          resolve({
            message: `Let's define your user personas more clearly. Based on what you've shared, here are the key user segments to consider:

• **Primary Users**: The main beneficiaries who will use the product daily
• **Stakeholders**: Decision makers who approve and purchase
• **Administrators**: Those who manage and configure the system

For each persona, we should define their goals, pain points, and success criteria.`,
            suggestions: [
              'Add user journey maps',
              'Define user stories',
              'Specify accessibility requirements'
            ]
          })
        } else if (lowerMessage.includes('feature') || lowerMessage.includes('requirement')) {
          resolve({
            message: `Let's prioritize features using the MoSCoW method:

**Must Have**: Core features essential for MVP
**Should Have**: Important but not critical for launch
**Could Have**: Nice-to-have enhancements
**Won't Have**: Out of scope for this version

This helps focus development on what matters most for your users.`,
            updatedPRD: currentPRD + `\n\n## Feature Prioritization
### Must Have (MVP)
- Core functionality as discussed
- Basic user management
- Essential workflows

### Should Have
- Enhanced UX features
- Basic analytics
- Integration capabilities

### Could Have
- Advanced customization
- Additional integrations
- Premium features`
          })
        } else {
          // Generic follow-up
          resolve({
            message: `Good point! Let me add that to the PRD. 

Based on what you've mentioned, we should also consider:
- Technical implementation details
- Security and compliance requirements
- Performance benchmarks
- Launch strategy

What aspect would you like to explore next?`
          })
        }
      }
    }, delay)
  })
}