import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const PROTOTYPE_SYSTEM_PROMPT = `You are an expert full-stack developer specializing in creating working prototypes from PRDs.

Your task is to generate a SINGLE-FILE React prototype in pure JavaScript (NOT TypeScript) that can be immediately run in a browser.

REQUIREMENTS:
1. Generate a complete, self-contained React component
2. Use pure JavaScript - NO TypeScript syntax, NO type annotations, NO interfaces
3. DO NOT use any TypeScript features like:
   - Type annotations (: string, : number, etc.)
   - Interfaces or type definitions
   - Generic types (<Type>)
   - as keyword for type assertions
4. Use Tailwind CSS classes for styling (assume Tailwind is available)
5. Make it functional and interactive
6. Include realistic mock data where needed
7. Focus on the core functionality described in the PRD
8. Keep it simple but impressive - show the main value proposition
9. Include loading states and error handling
10. Make it responsive by default

OUTPUT FORMAT:
- Start with React hooks if needed (useState, useEffect, etc.)
- Create the main component as a function
- Include any helper functions
- Export the component as default
- Use modern React patterns (hooks, functional components)
- Use template literals with backticks for string interpolation

IMPORTANT: Return ONLY pure JavaScript code, no TypeScript, no explanations or markdown code blocks.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prd, projectName } = body

    // Get API key from header
    const apiKey = request.headers.get('x-anthropic-api-key')
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured. Please add your API key in Settings.' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({ apiKey })

    const prompt = `Based on this PRD for "${projectName}", generate a working React/TypeScript prototype that demonstrates the core features:

${prd}

Remember: 
- Create a single-file, fully functional React component
- Use Tailwind CSS for styling
- Include interactive elements and state management
- Add realistic mock data
- Make it look professional and polished
- Focus on the main value proposition described in the PRD`

    // Using Claude Sonnet 3.7 - the latest available Sonnet model
    const completion = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-20250219',
      messages: [{ role: 'user', content: prompt }],
      system: PROTOTYPE_SYSTEM_PROMPT,
      max_tokens: 8192,
      temperature: 0.3 // Lower temperature for more consistent code
    })

    const prototypeCode = completion.content[0].type === 'text' 
      ? completion.content[0].text 
      : ''

    // Clean up the response - remove markdown code blocks if present
    const cleanedCode = prototypeCode
      .replace(/^```[a-zA-Z]*\n/gm, '')
      .replace(/\n```$/gm, '')
      .trim()

    return NextResponse.json({ prototype: cleanedCode })
  } catch (error: any) {
    console.error('Prototype Generation Error:', error)
    
    // Provide helpful error messages
    if (error.message?.includes('rate_limit')) {
      return NextResponse.json(
        { error: 'Rate limit reached. Please wait a moment and try again.' },
        { status: 429 }
      )
    }
    
    if (error.message?.includes('api_key')) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Anthropic API key in Settings.' },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to generate prototype. Please try again.' },
      { status: 500 }
    )
  }
}