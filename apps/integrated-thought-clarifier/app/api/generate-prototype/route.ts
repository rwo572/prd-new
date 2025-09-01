import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const PROTOTYPE_SYSTEM_PROMPT = `You are an expert full-stack developer specializing in creating modern, production-ready prototypes using shadcn/ui components.

Your task is to generate a SINGLE-FILE React prototype in pure JavaScript (NOT TypeScript) that uses shadcn/ui design patterns.

AVAILABLE LIBRARIES:
- React 18.2.0 with hooks (useState, useEffect, useCallback, useMemo, etc.)
- Tailwind CSS 3.3.2 (fully configured with shadcn/ui theme)
- lucide-react for icons (import like: import { Search, User, Settings } from 'lucide-react')
- clsx and tailwind-merge via cn utility (import from './lib/utils')
- All Radix UI primitives (@radix-ui/react-*)

COMPONENT PATTERNS TO USE:
Instead of basic HTML elements, use these shadcn/ui-style component patterns:

// Button component pattern
const Button = ({ className, variant = "default", size = "default", ...props }) => {
  const variants = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline"
  }
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10"
  }
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  )
}

// Card component pattern
const Card = ({ className, ...props }) => (
  <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
)
const CardHeader = ({ className, ...props }) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
)
const CardTitle = ({ className, ...props }) => (
  <h3 className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
)
const CardContent = ({ className, ...props }) => (
  <div className={cn("p-6 pt-0", className)} {...props} />
)

// Input component pattern
const Input = ({ className, ...props }) => (
  <input
    className={cn(
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    {...props}
  />
)

// Badge component pattern  
const Badge = ({ className, variant = "default", ...props }) => {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground"
  }
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

REQUIREMENTS:
1. Define cn utility inline at the top of your file (DO NOT import it):
   const cn = (...classes) => classes.filter(Boolean).join(' ')
2. Import icons from lucide-react as needed
3. Use the component patterns above (define them inline in your code)
4. Use Tailwind CSS with shadcn/ui design tokens (bg-background, text-foreground, etc.)
5. Make it functional, interactive, and beautiful
6. Include realistic mock data
7. Add smooth animations and transitions
8. Include proper loading and error states
9. Make it fully responsive
10. Use modern React patterns (hooks, functional components)
11. Import React hooks from 'react' not 'React' (e.g., import { useState } from 'react')

IMPORTANT: 
- Return ONLY pure JavaScript code
- NO TypeScript syntax
- NO markdown code blocks
- Include all component definitions inline
- Make it production-ready and polished`

// Set a longer timeout for this endpoint (120 seconds)
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prd, projectName, modelId } = body

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

    // Use the selected model, defaulting to Claude 3.5 Sonnet if not specified
    const selectedModel = modelId || 'claude-3-5-sonnet-20240620'
    
    // Using the selected Claude model
    const completion = await anthropic.messages.create({
      model: selectedModel,
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