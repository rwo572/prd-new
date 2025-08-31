import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const REFINEMENT_SYSTEM_PROMPT = `You are an expert at refining React/TypeScript prototypes based on natural language commands.

Your task is to modify existing prototype code based on user refinement requests.

REQUIREMENTS:
1. Preserve all existing functionality unless explicitly asked to change it
2. Apply the requested changes smoothly
3. Maintain code quality and consistency
4. Keep the same structure and patterns
5. Ensure the code remains functional after changes
6. Use Tailwind CSS for any new styling

COMMON REFINEMENTS:
- "Make it more colorful": Add vibrant colors, gradients, and visual interest
- "Add dark mode": Implement a theme toggle with dark/light modes
- "Make it more professional": Use conservative colors, clean typography
- "Add more spacing": Increase padding and margins
- "Make it mobile-first": Optimize for mobile screens
- "Add animations": Include subtle transitions and hover effects

IMPORTANT: Return ONLY the updated code, no explanations.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { currentPrototype, refinement, projectName } = body

    // Get API key from header
    const apiKey = request.headers.get('x-anthropic-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `Here is the current prototype code for "${projectName}":

${currentPrototype}

User's refinement request: "${refinement}"

Apply this refinement to the code while preserving all existing functionality. Make the changes smooth and professional.`

    const completion = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user', content: prompt }],
      system: REFINEMENT_SYSTEM_PROMPT,
      max_tokens: 8192,
      temperature: 0.3
    })

    const refinedCode = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : ''

    // Clean up the response
    const cleanedCode = refinedCode
      .replace(/^```[a-zA-Z]*\n/gm, '')
      .replace(/\n```$/gm, '')
      .trim()

    return NextResponse.json({ prototype: cleanedCode })
  } catch (error: any) {
    console.error('Prototype Refinement Error:', error)
    
    if (error.message?.includes('rate_limit')) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to refine prototype' },
      { status: 500 }
    )
  }
}