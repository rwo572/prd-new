import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { selectedText, prdContext, guidelines, apiKey, provider, modelId } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ 
        suggestions: getDefaultSuggestions(selectedText) 
      })
    }

    const systemPrompt = `${guidelines || ''}

You are an expert PRD consultant that suggests highly relevant prompts for improving Product Requirements Documents.
Given a selected text from a PRD, suggest exactly 3 highly specific follow-up prompts that would help improve that EXACT section.

Context about the PRD:
${prdContext ? `The PRD contains: ${prdContext.slice(0, 200)}...` : 'Working on a product requirements document.'}

Return a JSON array with exactly 3 objects, each containing:
- icon: A single emoji that represents the suggestion
- label: A short 2-3 word label (e.g., "Add metrics", "Define scope", "Risk analysis")
- prompt: A specific, actionable prompt (10-20 words) that directly improves the selected text

IMPORTANT: 
- Reference Amazon's Working Backwards methodology where relevant
- Consider AI product best practices (behavioral contracts, edge cases, safety)
- Suggest improvements specific to the product stage (0-to-1, 1-to-n, n-to-x) if detectable
- Focus on making the PRD more customer-obsessed, data-driven, and actionable`

    const userPrompt = `Generate 3 highly specific follow-up prompts for improving this exact PRD section:

Selected text: "${selectedText}"

Analyze this specific content and provide 3 focused follow-up prompts that directly address the most critical improvements needed.
Return only the JSON array with 3 suggestions prioritizing: clarity, completeness, and actionability.`

    let suggestions = []

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelId || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: "json_object" }
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices[0]?.message?.content
        if (content) {
          try {
            const parsed = JSON.parse(content)
            suggestions = parsed.suggestions || parsed
          } catch (e) {
            console.error('Failed to parse OpenAI response:', e)
          }
        }
      }
    } else if (provider === 'anthropic') {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelId || 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [
            {
              role: 'user',
              content: `${systemPrompt}\n\n${userPrompt}`
            }
          ],
          temperature: 0.7,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.content?.[0]?.text
        if (content) {
          try {
            // Extract JSON from the response
            const jsonMatch = content.match(/\[[\s\S]*\]/)
            if (jsonMatch) {
              suggestions = JSON.parse(jsonMatch[0])
            }
          } catch (e) {
            console.error('Failed to parse Anthropic response:', e)
          }
        }
      }
    }

    // Validate and sanitize suggestions
    if (Array.isArray(suggestions) && suggestions.length > 0) {
      suggestions = suggestions.slice(0, 3).map(s => ({
        icon: s.icon || '💡',
        label: s.label || 'Improve',
        prompt: s.prompt || 'Improve this section'
      }))
    } else {
      suggestions = getDefaultSuggestions(selectedText)
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('Error generating prompts:', error)
    return NextResponse.json({ 
      suggestions: getDefaultSuggestions('') 
    })
  }
}

function getDefaultSuggestions(selectedText: string) {
  const text = selectedText.toLowerCase()
  const suggestions = []

  // Context-aware defaults based on content
  if (text.includes('user') || text.includes('customer')) {
    suggestions.push({
      icon: '👥',
      label: 'User stories',
      prompt: 'Convert this into detailed user stories'
    })
  }

  if (text.includes('feature') || text.includes('function')) {
    suggestions.push({
      icon: '⚙️',
      label: 'Technical detail',
      prompt: 'Add technical implementation details'
    })
  }

  if (text.includes('goal') || text.includes('objective')) {
    suggestions.push({
      icon: '📊',
      label: 'Add metrics',
      prompt: 'Add measurable success metrics'
    })
  }

  // Fill with general suggestions if needed
  const generals = [
    { icon: '✨', label: 'Clarify', prompt: 'Make this clearer and more concise' },
    { icon: '📝', label: 'Expand', prompt: 'Add more details and examples' },
    { icon: '🎯', label: 'Make actionable', prompt: 'Turn this into specific action items' }
  ]
  
  let generalIndex = 0
  while (suggestions.length < 3 && generalIndex < generals.length) {
    // Check if this general suggestion isn't already in the list
    const general = generals[generalIndex]
    if (!suggestions.some(s => s.label === general.label)) {
      suggestions.push(general)
    }
    generalIndex++
  }

  return suggestions.slice(0, 3)
}