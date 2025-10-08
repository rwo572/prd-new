import { ApiKeys } from '@/types'
import { getModelById, getRecommendedModel } from './model-config'
import {
  generateAIGuidedPRD,
  getNextQuestion,
  extractAnswers,
  CONTEXT_QUESTIONS
} from './ai-prd-guidelines'

// Generate a short conversational follow-up (≤20 words)
export async function generateFollowUp(
  userMessage: string,
  aiResponse: string,
  apiKeys: ApiKeys
): Promise<string | null> {
  try {
    const model = getRecommendedModel('chat')
    if (!model) return null

    const prompt = `You are a PM assistant. Read the AI's response and give a SHORT (≤20 words) follow-up.

USER ASKED: "${userMessage}"

AI RESPONDED: "${aiResponse.substring(0, 500)}"

Your follow-up should:
- Acknowledge what was provided
- Ask ONE clarifying question OR suggest next step
- Be conversational and brief (≤20 words)
- Use PM patterns: validate assumptions, clarify scope, identify risks

Examples:
"Great! Should we prioritize mobile or web first?"
"Got it. What's the success metric here?"
"Nice. Any technical constraints I should know?"

Your follow-up:`

    let followUp = ''

    if (model.provider === 'anthropic' && apiKeys.anthropic) {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKeys.anthropic,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: 50,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const data = await response.json()
      followUp = data.content?.[0]?.text || ''
    } else if (model.provider === 'openai' && apiKeys.openai) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
          model: model.id,
          max_tokens: 50,
          temperature: 0.7,
          messages: [{ role: 'user', content: prompt }]
        })
      })

      const data = await response.json()
      followUp = data.choices?.[0]?.message?.content || ''
    }

    return followUp.trim() || null
  } catch (error) {
    console.error('Failed to generate follow-up:', error)
    return null
  }
}

export interface ChatContext {
  type: 'full' | 'selection' | 'file'
  content: string
  selectionStart?: number
  selectionEnd?: number
  fileName?: string
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
    // Check if this is a file upload for translation
    const isFileUpload = context?.type === 'file'

    // Only use guided flow if user explicitly requests it
    const isNewPRDRequest = message.toLowerCase().includes('guide me through') ||
                            message.toLowerCase().includes('walk me through') ||
                            message.toLowerCase().includes('ask me questions')

    // Check for explicit product stage mentions (very specific to avoid false positives)
    const mentions0to1 = message.toLowerCase().includes('0-to-1 prd') ||
                         message.toLowerCase().includes('0→1 prd') ||
                         (message.toLowerCase().includes('discovery') && message.toLowerCase().includes('validation'))
    const mentions1toN = message.toLowerCase().includes('1-to-n prd') ||
                         message.toLowerCase().includes('1→n prd') ||
                         (message.toLowerCase().includes('scaling') && message.toLowerCase().includes('prd'))
    const mentionsNtoX = message.toLowerCase().includes('n-to-x prd') ||
                         message.toLowerCase().includes('n→x prd') ||
                         (message.toLowerCase().includes('optimization') && message.toLowerCase().includes('prd'))
    
    // Build the system prompt based on context
    let systemPrompt = ''

    // Default conversational mode - always respond dynamically to user input
    if (!isFileUpload && !isNewPRDRequest && !mentions0to1 && !mentions1toN && !mentionsNtoX) {
      const questionsAsked = conversationContext.questionsAsked || 0
      const hasMinimalInfo = questionsAsked >= 2 // After 2 exchanges, we have enough

      if (hasMinimalInfo) {
        // Generate spec after 3 questions or less
        systemPrompt = `You are a PM assistant. You've gathered enough context. NOW GENERATE A COMPLETE PRD.

CONVERSATION SO FAR:
${conversationContext.collectedAnswers ? Object.entries(conversationContext.collectedAnswers).map(([k, v]) => `${k}: ${v}`).join('\n') : ''}

USER'S LATEST INPUT: "${message}"

GENERATE a complete markdown PRD with these sections:
# [Product Name]

## Problem
[What problem are we solving? Who has it?]

## Solution
[What are we building? Why will it work?]

## Success Metrics
[How do we measure success?]

## MVP Scope (4 weeks)
- [ ] Core feature 1
- [ ] Core feature 2
- [ ] Core feature 3

## Out of Scope v1
- Future enhancements
- Advanced features

## Risks & Mitigations
[What could go wrong? How do we handle it?]

FORMATTING:
- Use proper markdown
- Use "- [ ]" for tasks
- Be specific, not generic
- Base everything on the conversation

IMPORTANT: Generate the COMPLETE PRD now. Don't ask more questions.`
        conversationContext = {} // Reset
      } else {
        // Ask clarifying questions (max 2-3)
        conversationContext.questionsAsked = questionsAsked + 1
        conversationContext.collectedAnswers = conversationContext.collectedAnswers || {}

        // Store user's answer
        conversationContext.collectedAnswers[`answer_${questionsAsked}`] = message

        systemPrompt = `You are a conversational PM assistant. This is question ${questionsAsked + 1}/3.

USER SAID: "${message}"

PREVIOUS CONTEXT:
${conversationContext.collectedAnswers ? Object.entries(conversationContext.collectedAnswers).map(([k, v]) => `${k}: ${v}`).join('\n') : 'First question'}

YOUR TASK:
${questionsAsked === 0 ? `
Acknowledge what they said, then ask 1 KEY question about:
- Target users OR
- Core problem OR
- Success criteria

Example: "Got it! Who's the main user you're building this for?"
` : questionsAsked === 1 ? `
Acknowledge, then ask about:
- Solution approach OR
- Key features OR
- What makes this unique

Example: "Nice! What's the core feature that solves this?"
` : `
Acknowledge, then say you have enough to generate the PRD.

Example: "Perfect! I have what I need. Let me generate your PRD."

Then ask them to send one more message to trigger generation.
`}

RULES:
- Be conversational (≤30 words)
- Ask 1 question only
- Don't generate PRD yet (wait until next message)`
      }
    } else if (isFileUpload) {
      // Handle file upload translation - detect product type and generate comprehensive PRD
      const fileContent = context.content.toLowerCase()
      const isAINative = fileContent.includes('ai ') ||
                         fileContent.includes('ml ') ||
                         fileContent.includes('machine learning') ||
                         fileContent.includes('neural') ||
                         fileContent.includes('model')

      const pmAgents = isAINative
        ? ['AI-Native Model PM', 'AI-Native Prompt/Interaction PM', 'AI-Native Safety & Responsible AI PM']
        : ['SaaS AI Feature Platform PM', 'SaaS In-Product Copilot PM']

      systemPrompt = `You are an expert Product Manager translating an uploaded requirements document into a comprehensive PRD.dev structure.

**Detected Product Type**: ${isAINative ? 'AI-Native' : 'Traditional SaaS'}

**PM Agent Expertise to Apply**:
${pmAgents.map(agent => `- ${agent}`).join('\n')}

**Reference Guidelines**:
- Follow /docs/specifications/ai_prd_guidelines/10_ai_prd_master_template.md structure
${isAINative ? '- Apply /docs/specifications/ai_prd_guidelines/01_behavioral_contract_definition.md for AI behavior' : ''}

CRITICAL RULES:
1. Generate complete, comprehensive PRD NOW (no questions)
2. Extract ALL information from uploaded document
3. Only use "[To be defined]" for genuinely missing critical information
4. Infer product stage from content (0→1 if MVP/new, 1→n if scaling, n→x if optimization)
5. Structure follows prd-dev best practices (like the prd-dev example)

GENERATE THIS STRUCTURE:

# [Product Name from document]

**Product Type**: ${isAINative ? 'AI-Native' : 'SaaS'}
**Status**: [Infer from document: Discovery/Development/Scaling/Optimization]
**Last Updated**: ${new Date().toISOString().split('T')[0]}

## 📋 Specification Navigation
*Links to detailed specifications (to be created as separate documents)*

## Executive Summary

### Product Vision
[Extract 1-2 sentence vision from document]

### The Opportunity
[Market opportunity and user need]

### The Solution
[What's being built and how it solves the problem]

### Success Looks Like
[Specific outcomes and metrics]

---

## 1. Problem Definition

### 1.1 Core Problem Statement
> [Single clear problem statement from document]

### 1.2 Target Users
- **Primary Persona**: [Who]
- **Core Need**: [What they need]
- **Current Solution**: [How they solve it today]

### 1.3 Why Now?
[Market timing and technology enablers]

---

## 2. Solution Design

### 2.1 Solution Hypothesis
> [One sentence solution approach]

${isAINative ? `### 2.2 Why AI?
[Why AI is necessary for this solution]

### 2.3 AI Capability
- **Type**: [Generation/Classification/Recommendation/Analysis]
- **Model Approach**: [Specific models or approach]
- **Key Innovation**: [Unique AI advantage]

### 2.4 Behavioral Contract (if AI-native)
**Core Principles**:
- [Principle 1]
- [Principle 2]

**Tone & Style**: [Communication style]

### 2.5 Key Features` : '### 2.2 Technical Approach\n[Core technology]\n\n### 2.3 Key Features'}
[Extract from document]

---

## 3. Success Metrics

### North Star Metric
[Primary success indicator]

### Key Performance Indicators
- [Metric 1]
- [Metric 2]
- [Metric 3]

${isAINative ? '### AI Performance Targets\n- Response time: [target]\n- Accuracy: [target]\n- Cost: [target]' : ''}

---

## 4. Implementation Plan

### Development Phases
[Extract timeline and phases from document]

### Technical Requirements
[Key technical details from document]

---

## 5. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| [Risk 1] | [Level] | [Strategy] |

---

## 📚 Next Steps

**Immediate Actions**:
1. [Action 1]
2. [Action 2]

**Additional Documentation Needed**:
- "Generate detailed technical architecture"
${isAINative ? '- "Create comprehensive behavioral contract"' : ''}
- "Document user flows and edge cases"

---

*This PRD follows the [AI PRD Guidelines](../../ai_prd_guidelines/) framework.*

FORMATTING:
- Use "- [ ]" for task lists
- Keep sections actionable
- Extract specifics from document, avoid generic placeholders
- If critical info missing, note it but don't leave entire sections blank`
    } else if (isNewPRDRequest && !mentions0to1 && !mentions1toN && !mentionsNtoX) {
      // Initial stage identification - ASK ONLY ONE QUESTION
      systemPrompt = `You are an AI assistant helping to create a Product Requirements Document (PRD).

Ask ONLY this question in a conversational, friendly tone:

"What stage is your product at? Are you:
- 🚀 **0→1**: Creating something new from scratch (MVP/prototype)
- 📈 **1→n**: Scaling an existing product that has traction
- ⚡ **n→x**: Optimizing a mature product for competitive advantage

Just tell me which one fits best!"

RULES:
- Ask ONLY this one question
- Be conversational and friendly
- Do NOT list additional questions
- Do NOT explain what comes next
- Wait for their answer before asking anything else`
    } else if (mentions0to1) {
      // Track which question we're on (max 3 questions)
      const questionsAsked = conversationContext.questionsAsked || 0

      // Set stage in context
      conversationContext.stage = '0-to-1'

      if (questionsAsked === 0) {
        // QUESTION 1: Product type detection (AI-native vs traditional)
        systemPrompt = `You are an AI assistant helping create a 0→1 (Discovery & Validation) PRD.

Great choice! I'll ask you a few strategic questions to understand your product deeply.

First, let's understand what you're building:

"Does your product use AI/ML as a core capability, or is it a traditional software product?"

RULES:
- Ask ONLY this question
- Be brief and conversational
- Do NOT generate anything yet
- Wait for their answer`
        conversationContext.questionsAsked = 1
      } else if (questionsAsked === 1) {
        // Detect product type from answer
        const isAINative = message.toLowerCase().includes('ai') ||
                          message.toLowerCase().includes('ml') ||
                          message.toLowerCase().includes('machine') ||
                          message.toLowerCase().includes('generat') ||
                          message.toLowerCase().includes('intelligent')

        conversationContext.collectedAnswers = conversationContext.collectedAnswers || {}
        conversationContext.collectedAnswers.productType = isAINative ? 'ai-native' : 'traditional'

        // QUESTION 2: Core problem (from opportunity assessment)
        systemPrompt = `You are an AI assistant helping create a 0→1 PRD${isAINative ? ' for an AI-native product' : ''}.

Perfect! Now let's understand the opportunity:

"Who is your specific target customer, and what precise problem or unmet need are you solving for them?"

RULES:
- Ask ONLY this question
- Be conversational and brief
- Do NOT generate yet
- Wait for their answer`
        conversationContext.questionsAsked = 2
      } else if (questionsAsked === 2) {
        // QUESTION 3: Current solutions and differentiation
        systemPrompt = `You are an AI assistant helping create a 0→1 PRD.

Great! Now let's understand the competitive landscape:

"How are customers solving this problem today? What gaps exist in current solutions, and how will your product uniquely address these?"

RULES:
- Ask ONLY this question
- Be conversational
- Do NOT generate yet
- Wait for their answer`
        conversationContext.questionsAsked = 3
      } else if (questionsAsked === 3) {
        // QUESTION 4: Success metrics and market entry
        systemPrompt = `You are an AI assistant helping create a 0→1 PRD.

Perfect! Final question:

"What are your key early success indicators, and how will you reach your first customers?"

RULES:
- Ask ONLY this question
- This is the final question before generating
- Wait for their answer`
        conversationContext.questionsAsked = 4
      } else {
        // Generate comprehensive PRD using collected context
        const isAINative = conversationContext.collectedAnswers?.productType === 'ai-native'

        // Select relevant PM agents based on product type
        const pmAgents = isAINative
          ? ['AI-Native Model PM', 'AI-Native Prompt/Interaction PM', 'AI-Native AI UX PM', 'AI-Native Evaluation & Quality PM']
          : ['SaaS AI Feature Platform PM', 'SaaS In-Product Copilot PM', 'SaaS AI UX PM']

        systemPrompt = `You are an expert Product Manager with deep expertise in ${isAINative ? 'AI-native products' : 'SaaS products with AI features'}.

CONTEXT FROM CONVERSATION:
You've gathered strategic context through 4 key questions. Now generate a comprehensive PRD following the AI PRD Master Template structure.

**Product Type**: ${isAINative ? 'AI-Native Product' : 'Traditional SaaS Product'}
**Stage**: 0→1 (Discovery & Validation)

**PM Agent Expertise to Apply**:
${pmAgents.map(agent => `- ${agent}`).join('\n')}

**Reference Guidelines**:
- Use /docs/specifications/ai_prd_guidelines/opportunity-assessment-0to1.md structure
- Follow /docs/specifications/ai_prd_guidelines/10_ai_prd_master_template.md format
${isAINative ? '- Apply /docs/specifications/ai_prd_guidelines/01_behavioral_contract_definition.md principles' : ''}

GENERATE A COMPLETE README.md WITH THESE SECTIONS:

# [Product Name] - 0→1 Discovery PRD

**Product Type**: ${isAINative ? 'AI-Native' : 'SaaS'}
**Status**: Discovery & Validation
**Last Updated**: ${new Date().toISOString().split('T')[0]}

## 📋 Specification Navigation
*[Link structure to future detailed docs]*

## Executive Summary

### Product Vision
[1-2 sentence vision based on collected context]

### The Opportunity
[Market opportunity and user need from their answers]

### The Solution
${isAINative ? '[How AI makes this possible/better]' : '[Technical approach to solving the problem]'}

### Success Looks Like
[Specific, quantitative outcomes from their answers]

---

## 1. Problem Definition

### 1.1 Core Problem Statement
> [Single clear sentence from user's answer]

### 1.2 Target Users
- **Primary Persona**: [From their answer]
- **Core Need**: [Specific pain point]
- **Current Solution**: [How they solve it today]

### 1.3 Why Now?
- Market timing factors
- Technology enablers
${isAINative ? '- AI capability maturity' : ''}

---

## 2. Solution Design

### 2.1 Solution Hypothesis
> [One sentence: what you're building and why it will work]

${isAINative ? `### 2.2 Why AI?
[Explain specifically why AI is necessary]

### 2.3 AI Capability
- **Type**: [Generation/Classification/Recommendation/Analysis]
- **Model Approach**: [LLM/ML/Hybrid]
- **Key Innovation**: [Unique AI advantage]` : '### 2.2 Technical Approach\n[Core technology and architecture]'}

### 2.4 MVP Scope (4 weeks)
**In Scope**:
- [ ] Core feature 1
- [ ] Core feature 2
- [ ] Core feature 3

**Out of Scope (v1)**:
- Advanced features
- Multiple integrations
- Enterprise features

---

${isAINative ? `## 3. Behavioral Contract

### 3.1 Core Behavioral Principles
[Define how AI should behave]

### 3.2 Personality & Tone
- **Brand Voice**: [How should it sound]
- **Communication Style**: [Formal/Casual/Technical]

### 3.3 Behavioral Examples
**Scenario 1**: [Common use case]
- **Good Response** ✅: [Ideal behavior]
- **Bad Response** ❌: [What to avoid]

---

` : ''}## ${isAINative ? '4' : '3'}. Success Metrics

### North Star Metric
[Primary success indicator from user's answer]

### MVP Success Criteria
- [ ] 10+ users complete core workflow
- [ ] 60%+ task completion rate
- [ ] User satisfaction >7/10
- [ ] Technical reliability >95%

${isAINative ? `### AI Performance Targets
- Response time: <2s p95
- Accuracy: >90%
- Cost per request: <$0.10` : ''}

---

## ${isAINative ? '5' : '4'}. Market Entry & Validation

### Go-to-Market Strategy
[How to reach first customers from their answer]

### Validation Experiments
| Week | Hypothesis | Method | Success Criteria |
|------|------------|--------|------------------|
| 1 | Problem exists | User interviews | 7/10 confirm pain |
| 2 | Solution works | Prototype test | 5/10 complete workflow |
| 3-4 | Willingness to pay | Pricing discussion | 3+ commit to trial |

---

## ${isAINative ? '6' : '5'}. Implementation Plan

### Development Phases
**Week 1-2**: Core Build
- [ ] Technical foundation
- [ ] Core feature implementation
${isAINative ? '- [ ] AI model integration\n- [ ] Safety guardrails' : '- [ ] API integrations'}

**Week 3**: User Testing
- [ ] 10 user beta test
- [ ] Feedback collection
- [ ] Iteration based on insights

**Week 4**: Go/No-Go Decision
- [ ] Evaluate against success criteria
- [ ] Decide: pivot, persevere, or stop

---

## ${isAINative ? '7' : '6'}. Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| No product-market fit | Medium | High | Fast validation & pivots |
| Technical feasibility | Low | Medium | Early prototyping |
| User adoption | Medium | High | Direct customer development |
${isAINative ? '| AI accuracy insufficient | Medium | High | Multiple model approaches |' : ''}

---

## ${isAINative ? '8' : '7'}. Kill Criteria

**Stop development if by Week 4**:
- <30% of test users see clear value
- Core assumptions proven false
- No viable path to differentiation
- Technical approach not feasible

---

## 📚 Next Steps

**Immediate Actions**:
1. Validate problem with 10 customer interviews
2. Create clickable prototype
3. Technical feasibility spike

**Additional Documentation Needed**:
Ask me to generate:
- "Generate detailed technical architecture"
${isAINative ? '- "Create behavioral contract with examples"\n- "Design prompt engineering specifications"' : ''}
- "Document user flows and edge cases"
- "Build implementation roadmap"

---

*This PRD follows the [AI PRD Guidelines](../../ai_prd_guidelines/) framework. Generated using prd.dev.*

CRITICAL FORMATTING:
- Use "- [ ]" for task lists (with space after dash)
- Keep sections focused and actionable
- Base all content on user's actual answers
- Be specific, not generic`
        conversationContext = {} // Reset for next conversation
      }
    } else if (mentions1toN) {
      const questionsAsked = conversationContext.questionsAsked || 0
      conversationContext.stage = '1-to-n'

      if (questionsAsked === 0) {
        // Detect product type
        systemPrompt = `You are an AI assistant helping create a 1→n (Scaling & Growth) PRD.

Excellent! You're scaling an existing product. Let me ask strategic questions to understand your growth opportunity.

First:

"Does your product have AI/ML features, or is it primarily a traditional software product?"

RULES:
- Ask ONLY this question
- Be brief and conversational
- Wait for their answer`
        conversationContext.questionsAsked = 1
      } else if (questionsAsked === 1) {
        const isAINative = message.toLowerCase().includes('ai') ||
                          message.toLowerCase().includes('ml') ||
                          message.toLowerCase().includes('machine')

        conversationContext.collectedAnswers = conversationContext.collectedAnswers || {}
        conversationContext.collectedAnswers.productType = isAINative ? 'ai-native' : 'traditional'

        systemPrompt = `You are an AI assistant helping create a 1→n PRD.

Perfect! Now:

"What's currently working well? Share your key metrics (users, revenue, retention, etc.)"

RULES:
- Ask ONLY this question
- Wait for their answer`
        conversationContext.questionsAsked = 2
      } else if (questionsAsked === 2) {
        systemPrompt = `You are an AI assistant helping create a 1→n PRD.

Great! Now let's identify the opportunity:

"What's your biggest growth bottleneck, and which customer segments represent your best expansion opportunity?"

RULES:
- Ask ONLY this question
- Wait for their answer`
        conversationContext.questionsAsked = 3
      } else if (questionsAsked === 3) {
        systemPrompt = `You are an AI assistant helping create a 1→n PRD.

Perfect! Final question:

"What could break as you scale 10x, and how will you measure success?"

RULES:
- Final question
- Wait for their answer`
        conversationContext.questionsAsked = 4
      } else {
        const isAINative = conversationContext.collectedAnswers?.productType === 'ai-native'
        const pmAgents = isAINative
          ? ['AI-Native Performance & Cost PM', 'AI-Native Agentic Workflow PM', 'AI-Native Evaluation & Quality PM']
          : ['SaaS Performance & Cost PM', 'SaaS Analytics & Impact PM', 'SaaS Growth & Packaging PM']

        systemPrompt = `You are an expert Product Manager specializing in ${isAINative ? 'AI-native product scaling' : 'SaaS product growth'}.

CONTEXT: You've gathered growth context. Generate a comprehensive 1→n (Scaling) PRD.

**Product Type**: ${isAINative ? 'AI-Native' : 'SaaS'}
**Stage**: 1→n (Scaling & Growth)

**PM Agent Expertise**:
${pmAgents.map(agent => `- ${agent}`).join('\n')}

**Reference**: /docs/specifications/ai_prd_guidelines/opportunity-assessment-1ton.md

GENERATE COMPLETE README.md:

# [Product Name] - 1→n Scaling Strategy

**Product Type**: ${isAINative ? 'AI-Native' : 'SaaS'}
**Status**: Scaling & Growth
**Last Updated**: ${new Date().toISOString().split('T')[0]}

## Executive Summary

### Current State
[Key metrics from user's answer: users, revenue, retention]

### Growth Opportunity
[Target expansion and bottleneck to solve]

### Success Target
[Specific growth goals and timeline]

---

## 1. What's Working (Don't Break)

### Proven Value
- Core feature driving retention
- Key workflow that users love
- Pricing/packaging that converts

### Current Metrics
[Actual numbers from conversation]

---

## 2. Growth Strategy

### Expansion Vectors
1. **Market Expansion**: [Geographic/vertical expansion]
2. **Segment Growth**: [Adjacent customer types]
3. **Use Case Expansion**: [New workflows for existing users]

### Bottleneck to Solve
[Primary growth constraint from their answer]

### Target Metrics (6 months)
- Users: [current] → [target]
- Revenue: [current] → [target]
- Retention: [current] → [target]
${isAINative ? '- AI accuracy: [maintain/improve]' : ''}

---

## 3. Feature Roadmap

### Phase 1: Scaling Infrastructure (Months 1-2)
- [ ] Performance optimization
- [ ] Self-service onboarding
${isAINative ? '- [ ] Model optimization for scale\n- [ ] Cost per request reduction' : '- [ ] Payment processing at scale'}
- [ ] Basic analytics dashboard

### Phase 2: Growth Features (Months 3-4)
- [ ] Team collaboration
${isAINative ? '- [ ] API access for developers' : '- [ ] Advanced integrations'}
- [ ] Mobile experience
- [ ] Advanced user segmentation

### Phase 3: Retention & Expansion (Months 5-6)
- [ ] Power user features
- [ ] Enterprise capabilities
${isAINative ? '- [ ] Custom model fine-tuning' : '- [ ] White-label options'}

---

${isAINative ? `## 4. AI Scaling Considerations

### Performance at Scale
- Response time: <2s p95
- Throughput: [target requests/day]
- Cost optimization: <$[target]/request
- Quality maintenance: >90% accuracy

### Infrastructure Evolution
- Multi-region deployment
- Model caching strategy
- A/B testing framework
- Real-time monitoring

---

` : ''}## ${isAINative ? '5' : '4'}. Risk Management

| Risk | Impact | Mitigation |
|------|--------|------------|
| Quality degradation at scale | High | Staged rollouts, monitoring |
| Infrastructure failure | High | Multi-region, redundancy |
| Competitive response | Medium | Fast feature velocity |
${isAINative ? '| Model drift | Medium | Continuous evaluation |' : '| Technical debt | Medium | Refactoring sprints |'}

### What Could Break at 10x
[Specific risks from user's answer]

---

## ${isAINative ? '6' : '5'}. Success Metrics

### North Star Metric
Weekly Active Users (WAU)

### Supporting Metrics
- Activation rate: >50%
- Week 1 retention: >70%
- CAC payback: <6 months
- NRR: >110%

---

## ${isAINative ? '7' : '6'}. Resource Requirements

### Team Expansion
- [X] Engineers
- [X] Designers
- [X] Customer Success

### Budget
- Infrastructure: $[X]/month
${isAINative ? '- AI costs: $[X]/month' : '- Third-party services: $[X]/month'}
- Marketing: $[X]/month

---

## ${isAINative ? '8' : '7'}. Next Milestones

**Month 1**: Scale to [X] users
**Month 3**: Launch [key feature]
**Month 6**: Achieve [growth target]

---

*References: /docs/specifications/ai_prd_guidelines/opportunity-assessment-1ton.md*

CRITICAL FORMATTING: Use "- [ ]" for tasks. Base on actual user answers.`
        conversationContext = {}
      }
    } else if (mentionsNtoX) {
      const questionsAsked = conversationContext.questionsAsked || 0
      conversationContext.stage = 'n-to-x'

      if (questionsAsked === 0) {
        systemPrompt = `You are an AI assistant helping create an n→x (Optimization & Differentiation) PRD.

Excellent! You're optimizing a mature product. Let me understand your strategic goals.

First:

"Does your product have AI/ML capabilities, or is it primarily traditional software?"

RULES:
- Ask ONLY this question
- Be brief
- Wait for answer`
        conversationContext.questionsAsked = 1
      } else if (questionsAsked === 1) {
        const isAINative = message.toLowerCase().includes('ai') ||
                          message.toLowerCase().includes('ml') ||
                          message.toLowerCase().includes('machine')

        conversationContext.collectedAnswers = conversationContext.collectedAnswers || {}
        conversationContext.collectedAnswers.productType = isAINative ? 'ai-native' : 'traditional'

        systemPrompt = `You are an AI assistant helping create an n→x PRD.

Perfect! Now:

"What specific metric are you optimizing (latency, cost, accuracy, conversion), and what's your current competitive position?"

RULES:
- Ask ONLY this question
- Wait for answer`
        conversationContext.questionsAsked = 2
      } else if (questionsAsked === 2) {
        systemPrompt = `You are an AI assistant helping create an n→x PRD.

Great! Next:

"What enterprise features or capabilities are blocking large deals, and what would 10x improvement look like?"

RULES:
- Ask ONLY this question
- Wait for answer`
        conversationContext.questionsAsked = 3
      } else if (questionsAsked === 3) {
        systemPrompt = `You are an AI assistant helping create an n→x PRD.

Final question:

"Where do you see diminishing returns, and how will you measure success of these optimizations?"

RULES:
- Final question
- Wait for answer`
        conversationContext.questionsAsked = 4
      } else {
        const isAINative = conversationContext.collectedAnswers?.productType === 'ai-native'
        const pmAgents = isAINative
          ? ['AI-Native Performance & Cost PM', 'AI-Native Enterprise Compliance PM', 'AI-Native Developer Ecosystem PM']
          : ['SaaS Enterprise Compliance PM', 'SaaS Packaging & Pricing PM', 'SaaS Ecosystem & Partner PM']

        systemPrompt = `You are an expert Product Manager specializing in ${isAINative ? 'AI-native product optimization' : 'SaaS product excellence'}.

CONTEXT: You've gathered optimization context. Generate a comprehensive n→x (Optimization) PRD.

**Product Type**: ${isAINative ? 'AI-Native' : 'SaaS'}
**Stage**: n→x (Optimization & Market Leadership)

**PM Agent Expertise**:
${pmAgents.map(agent => `- ${agent}`).join('\n')}

**Reference**: /docs/specifications/ai_prd_guidelines/opportunity-assessment-nx.md

GENERATE COMPLETE README.md:

# [Product Name] - n→x Market Leadership Strategy

**Product Type**: ${isAINative ? 'AI-Native' : 'SaaS'}
**Status**: Optimization & Differentiation
**Last Updated**: ${new Date().toISOString().split('T')[0]}

## Executive Summary

### Current Market Position
[Market standing, users, revenue from conversation]

### Optimization Target
[Specific metric and improvement goal]

### Strategic Vision
[How this creates market leadership]

---

## 1. Current State Analysis

### Market Position
- Market share: [current position]
- Key competitive advantages
- Product maturity indicators

### Performance Baseline
[Current metrics for optimization target]

---

## 2. Optimization Goals

### Primary Optimization
**Metric**: [Latency/Cost/Accuracy/Conversion from their answer]
**Target**: [10x improvement or specific %]
**Rationale**: [Why this matters competitively]

${isAINative ? `### AI Performance Targets
| Metric | Current | Target | Approach |
|--------|---------|--------|----------|
| Latency | [X]ms | [Y]ms | Edge deployment |
| Cost/request | $[X] | $[Y] | Model optimization |
| Accuracy | [X]% | [Y]% | Ensemble approach |
| Uptime | [X]% | 99.99% | Multi-region |` : '### Technical Excellence Targets\n- Performance benchmarks\n- Reliability targets\n- Scalability goals'}

---

## 3. Competitive Moat

### Unique Capabilities
1. **Exclusive**: [What only you can do]
2. **Best-in-Class**: [Where you lead the market]
3. **Patent-Pending**: [Novel approaches]

### Defensibility Strategy
- Network effects: [How you build them]
- Switching costs: [Integration depth]
- Data advantage: [Proprietary insights]
${isAINative ? '- Model superiority: [Custom AI capabilities]' : ''}

---

## 4. Excellence Roadmap (12 months)

### Q1-Q2: Foundation (Months 1-6)
- [ ] Performance optimization initiative
- [ ] Enterprise compliance (SOC2, GDPR)
${isAINative ? '- [ ] Model fine-tuning for domain\n- [ ] Real-time inference optimization' : '- [ ] Infrastructure modernization'}
- [ ] Advanced features blocking deals

### Q3-Q4: Market Leadership (Months 7-12)
- [ ] Developer platform/API
- [ ] Ecosystem partnerships
${isAINative ? '- [ ] Custom model marketplace\n- [ ] AI explainability features' : '- [ ] White-label offering'}
- [ ] Category-defining capabilities

---

## 5. Enterprise Readiness

### Compliance & Security
- [ ] SOC 2 Type II certification
- [ ] GDPR/CCPA compliance
${isAINative ? '- [ ] AI governance framework' : ''}
- [ ] HIPAA ready (if applicable)
- [ ] ISO 27001

### Enterprise Features
[Specific features blocking deals from their answer]

### Support & SLAs
- 24/7 support
- 99.99% uptime SLA
- Dedicated success managers

---

## 6. Diminishing Returns Analysis

### Areas of Saturation
[Where improvements have diminishing value from their answer]

### Focus Shift Strategy
[How to reallocate resources]

---

## 7. Success Metrics

### Market Leadership Indicators
- Market share: [current] → [target]%
- Enterprise customers: [X] → [Y]
- NPS: [current] → >70
- Win rate vs competitors: >60%

${isAINative ? `### AI Performance KPIs
- Model accuracy: >99%
- Response time: <50ms p95
- Cost efficiency: 10x improvement
- Uptime: 99.99%` : '### Product Excellence KPIs\n- Performance: Top quartile\n- Reliability: 99.99%\n- Customer satisfaction: >90%'}

---

## 8. Strategic Initiatives

### Ecosystem Development
- Developer community building
- Integration marketplace
- Strategic partnerships

### Innovation Pipeline
- R&D investment: [%] of revenue
${isAINative ? '- AI research collaborations' : '- Technology partnerships'}
- Quarterly innovation reviews

---

## 9. 3-Year Vision

Become the category-defining standard for [domain], achieving:
- 50%+ market share
- $[X]M ARR
- Global presence in [X] markets
- Industry thought leadership

---

## 10. Next Quarter Priorities

**Q[X] Focus**:
1. Ship [optimization improvement]
2. Close [X] enterprise deals
3. Launch [strategic initiative]
4. Achieve [compliance/certification]

---

*References: /docs/specifications/ai_prd_guidelines/opportunity-assessment-nx.md*

CRITICAL FORMATTING: Use "- [ ]" for tasks. Base on actual user answers. Be specific about competitive differentiation.`
        conversationContext = {}
      }
    } else {
      // Regular chat - use README context if available
      const hasReadmeContext = context?.content && context.content.length > 100

      // Check if user is asking for a new document
      const isDocRequest = message.toLowerCase().includes('generate') ||
                          message.toLowerCase().includes('create') ||
                          message.toLowerCase().includes('design') ||
                          message.toLowerCase().includes('document') ||
                          message.toLowerCase().includes('build')

      if (isDocRequest && hasReadmeContext) {
        systemPrompt = `You are an AI assistant helping to create product documentation.

**Project Context (from README.md):**
${context.content.substring(0, 2000)}...

The user is requesting a new document. Based on their request and the README context:

1. **Identify what they're asking for** (technical requirements, API design, user flows, etc.)
2. **Generate a complete, well-structured document** that:
   - References the project from the README
   - Is detailed and comprehensive
   - Uses proper markdown formatting
   - Includes specific, actionable content (not placeholders)

3. **Suggest a filename** for this document (e.g., "Save this as: technical_requirements.md")

Generate the FULL document now. Be specific and detailed.

CRITICAL FORMATTING: For task lists, use "- [ ] Task description"`
      } else {
        systemPrompt = `You are an AI assistant helping to build product specifications.

${hasReadmeContext ? `**Project Context (from README.md):**
${context.content.substring(0, 2000)}...

Use this context when generating specifications.` : ''}

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
      if (context.type === 'file') {
        const fileName = context.fileName || 'uploaded file'
        enhancedMessage = `FILE: ${fileName}\n\n===FILE CONTENT===\n${context.content}\n===END FILE===`
      } else if (context.type === 'full') {
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