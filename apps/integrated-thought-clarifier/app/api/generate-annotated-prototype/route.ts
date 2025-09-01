import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { PRDParser } from '@/lib/prd-parser'
import { AnnotatedPrototypeConfig } from '@/types/annotation'

const ANNOTATED_PROTOTYPE_SYSTEM_PROMPT = `You are an expert full-stack developer specializing in creating modern, production-ready prototypes with embedded annotation support.

Your task is to generate a SINGLE-FILE React prototype that includes data attributes for annotation layers.

IMPORTANT: Add data attributes to key UI elements for annotation mapping:
- data-annotation-id: Unique identifier for the element
- data-behavior-type: For behavioral examples (good/bad/reject)
- data-boundary-type: For safety boundaries (hard/soft)
- data-flow-step: For user flow steps (1-8)
- data-edge-case: For edge case handling

Example:
<div data-annotation-id="user-input" data-flow-step="1" data-boundary-type="soft">
  <input data-behavior-type="good" ... />
</div>

AVAILABLE LIBRARIES:
- React 18.2.0 with hooks
- Tailwind CSS 3.3.2
- lucide-react for icons
- clsx and tailwind-merge via cn utility

Create a fully functional prototype that demonstrates the product concept while being annotation-ready.
Include realistic mock data and professional polish.
The prototype should work standalone but include annotation hooks.`

export async function POST(req: NextRequest) {
  try {
    const { 
      prdContent, 
      apiKey, 
      modelId = 'claude-3-5-sonnet-20241022',
      includeAnnotations = true 
    } = await req.json()

    if (!prdContent || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields: prdContent and apiKey' },
        { status: 400 }
      )
    }

    // Parse PRD to extract annotation data
    const parser = new PRDParser(prdContent)
    const prdHash = parser.getContentHash()
    
    let annotationConfig: AnnotatedPrototypeConfig | null = null
    
    if (includeAnnotations) {
      annotationConfig = {
        basePrototype: '', // Will be filled with generated code
        layers: {
          behavior: {
            enabled: true,
            examples: parser.extractBehaviorExamples()
          },
          boundaries: {
            enabled: true,
            markers: parser.extractBoundaries()
          },
          flow: {
            enabled: true,
            steps: parser.extractFlowSteps()
          },
          edgeCases: {
            enabled: true,
            cases: parser.extractEdgeCases()
          }
        },
        metadata: {
          prdHash,
          generatedAt: new Date().toISOString(),
          modelUsed: modelId,
          version: '1.0.0'
        }
      }
    }

    // Generate the prototype with annotation hints
    const anthropic = new Anthropic({ apiKey })
    
    const annotationInstructions = includeAnnotations ? `
ANNOTATION REQUIREMENTS:
Based on this PRD, add these data attributes to relevant UI elements:

Behavior Examples Found: ${annotationConfig?.layers.behavior.examples.length || 0}
${annotationConfig?.layers.behavior.examples.slice(0, 3).map(e => 
  `- ${e.type}: ${e.title}`
).join('\n')}

Boundaries Found: ${annotationConfig?.layers.boundaries.markers.length || 0}
${annotationConfig?.layers.boundaries.markers.slice(0, 3).map(b => 
  `- ${b.type} boundary: ${b.title}`
).join('\n')}

Flow Steps Found: ${annotationConfig?.layers.flow.steps.length || 0}
${annotationConfig?.layers.flow.steps.slice(0, 3).map(s => 
  `- Step ${s.stepNumber}: ${s.title}`
).join('\n')}

Add appropriate data attributes to UI elements that correspond to these concepts.
` : ''

    const completion = await anthropic.messages.create({
      model: modelId,
      max_tokens: 8192,
      temperature: 0.7,
      system: ANNOTATED_PROTOTYPE_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Generate an annotated React prototype based on this PRD:

${prdContent}

${annotationInstructions}

Requirements:
1. Create a single-file React component (function App())
2. Include the cn utility function inline
3. Use Tailwind CSS classes for styling
4. Add data attributes for annotation mapping
5. Include realistic mock data
6. Make it fully interactive and polished
7. Focus on demonstrating the core product concept

Return ONLY the React component code, no explanations.`
        }
      ]
    })

    const generatedCode = completion.content[0].type === 'text' 
      ? completion.content[0].text.trim()
      : ''

    // Clean up the code
    let cleanedCode = generatedCode
      .replace(/```jsx?\n?/g, '')
      .replace(/```\n?$/g, '')
      .trim()

    // Update config with generated code
    if (annotationConfig) {
      annotationConfig.basePrototype = cleanedCode
    }

    return NextResponse.json({
      success: true,
      code: cleanedCode,
      annotationConfig,
      usage: {
        inputTokens: completion.usage.input_tokens,
        outputTokens: completion.usage.output_tokens
      }
    })
  } catch (error: any) {
    console.error('Error generating annotated prototype:', error)
    
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key. Please check your Anthropic API key.' },
        { status: 401 }
      )
    }
    
    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
    
    return NextResponse.json(
      { error: error?.message || 'Failed to generate annotated prototype' },
      { status: 500 }
    )
  }
}