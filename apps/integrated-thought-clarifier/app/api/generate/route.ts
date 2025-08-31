import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { getModelById } from '@/lib/model-config'

const SYSTEM_PROMPT = `You are an expert product manager helping to create comprehensive Product Requirements Documents (PRDs). 

You follow the AI PRD Guidelines framework from /docs/specifications/ai_prd_guidelines/, which includes:
- Behavioral Contract Definition (personality, tone, expertise)
- Contextual Behavioral Rules (adaptation, context awareness)
- Safety Rules (boundaries, privacy, compliance)
- Edge Case Handling (detection, response, escalation)
- Quality Standards (accuracy, performance, UX metrics)
- Performance Boundaries (technical limits, cost constraints)
- Implementation Checklist (pre-launch requirements)

CONVERSATION FLOW (MAX 3 QUESTIONS):
1. First message: Ask about product stage (0→1, 1→n, or n^x)
2. Message 2: Ask ONE targeted follow-up question based on stage
3. Message 3: Generate complete PRD following the AI PRD Master Template

STAGE-SPECIFIC FOCUS:
- 0→1: Use opportunity-assessment-0to1.md - Focus on problem validation, MVP scope, kill criteria
- 1→n: Use opportunity-assessment-1ton.md - Focus on scaling, growth metrics, infrastructure
- n^x: Use opportunity-assessment-nx.md - Focus on optimization, differentiation, enterprise

PRD STRUCTURE (from 10_ai_prd_master_template.md):
[PRD_UPDATE]
# Product Name - [Stage] PRD

## 1. Executive Summary
## 2. Behavioral Contract Definition (if AI product)
## 3. Problem & Opportunity
## 4. Solution Approach
## 5. Success Metrics
## 6. Implementation Plan
## 7. Risk Mitigation
[/PRD_UPDATE]

Reference example PRDs for patterns:
- example_prd_ai-prd-task-prioritization.md
- example_prd_ai-prd-support-deflection.md`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, modelId, apiKey, provider } = body

    const model = getModelById(modelId)
    if (!model) {
      return NextResponse.json(
        { error: 'Invalid model selected' },
        { status: 400 }
      )
    }

    let response = ''

    if (provider === 'openai' && apiKey) {
      const openai = new OpenAI({ apiKey })

      const completionParams: any = {
        model: modelId,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ]
      }

      // GPT-5 doesn't support custom temperature
      if (!modelId.includes('gpt-5')) {
        completionParams.temperature = 0.7
      }

      // Newer models use max_completion_tokens
      if (modelId.includes('gpt-4o') || modelId.includes('gpt-5')) {
        completionParams.max_completion_tokens = Math.min(model.outputTokens, 4096)
      } else {
        completionParams.max_tokens = Math.min(model.outputTokens, 4096)
      }

      const completion = await openai.chat.completions.create(completionParams)
      response = completion.choices[0].message.content || ''
    } else if (provider === 'anthropic' && apiKey) {
      const anthropic = new Anthropic({ apiKey })

      const completion = await anthropic.messages.create({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        system: SYSTEM_PROMPT,
        max_tokens: Math.min(model.outputTokens, 4096)
      })

      response = completion.content[0].type === 'text' 
        ? completion.content[0].text 
        : ''
    } else {
      return NextResponse.json(
        { error: 'Invalid provider or missing API key' },
        { status: 400 }
      )
    }

    return NextResponse.json({ response })
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate response' },
      { status: 500 }
    )
  }
}