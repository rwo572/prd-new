import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message, systemPrompt, apiKey, modelId, provider, stream } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'API key required' }, { status: 400 })
    }

    // Create a TransformStream for SSE
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          if (provider === 'anthropic') {
            await streamAnthropicResponse(
              message,
              systemPrompt,
              apiKey,
              modelId,
              controller,
              encoder,
              request.signal
            )
          } else if (provider === 'openai') {
            await streamOpenAIResponse(
              message,
              systemPrompt,
              apiKey,
              modelId,
              controller,
              encoder,
              request.signal
            )
          } else {
            throw new Error(`Unsupported provider: ${provider}`)
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error'
          const isAbortError = error instanceof Error && (error.name === 'AbortError' || errorMessage.includes('aborted'))

          try {
            if (isAbortError) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Generation stopped by user' })}\n\n`))
            } else {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`))
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          } catch (e) {
            // Controller might already be closed
            console.error('Controller error:', e)
          }
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Chat stream error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

async function streamAnthropicResponse(
  message: string,
  systemPrompt: string,
  apiKey: string,
  modelId: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  clientSignal?: AbortSignal
) {
  // Create AbortController for the API request with longer timeout
  const apiController = new AbortController()
  const apiTimeoutId = setTimeout(() => apiController.abort(), 180000) // 3 minutes

  // Listen for client abort signal
  if (clientSignal) {
    clientSignal.addEventListener('abort', () => {
      apiController.abort()
    })
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    signal: apiController.signal,
    body: JSON.stringify({
      model: modelId || 'claude-3-5-haiku-20241022',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: `${systemPrompt}\n\nUser request: ${message}`
        }
      ],
      stream: true,
    }),
  })

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  if (!reader) {
    throw new Error('Response body is not readable')
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const data = line.trim().slice(6)
          if (data === '[DONE]') continue
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta' && parsed.delta?.text) {
              // Stream all content directly
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: parsed.delta.text })}\n\n`))
            }
          } catch (e) {
            // Skip malformed JSON
            if (data !== '') {
              console.error('Error parsing Anthropic SSE:', data.substring(0, 100))
            }
          }
        }
      }
    }
  } finally {
    // Clean up API timeout
    clearTimeout(apiTimeoutId)

    // Send final done message and close controller
    try {
      if (controller.desiredSize !== null) { // Check if controller is not closed
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    } catch (e) {
      // Controller might already be closed
      console.log('Controller already closed:', e)
    }
  }
}

async function streamOpenAIResponse(
  message: string,
  systemPrompt: string,
  apiKey: string,
  modelId: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  clientSignal?: AbortSignal
) {
  // Create AbortController for the API request with longer timeout
  const apiController = new AbortController()
  const apiTimeoutId = setTimeout(() => apiController.abort(), 180000) // 3 minutes

  // Listen for client abort signal
  if (clientSignal) {
    clientSignal.addEventListener('abort', () => {
      apiController.abort()
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    signal: apiController.signal,
    body: JSON.stringify({
      model: modelId || 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: message
        }
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 4000,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  if (!reader) {
    throw new Error('Response body is not readable')
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      const lines = buffer.split('\n')
      buffer = lines.pop() || '' // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim().startsWith('data: ')) {
          const data = line.trim().slice(6)
          if (data === '[DONE]') continue
          if (!data) continue

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices?.[0]?.delta?.content
            
            if (content) {
              // Stream all content directly
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
            }
          } catch (e) {
            // Skip malformed JSON
            if (data !== '') {
              console.error('Error parsing OpenAI SSE:', data.substring(0, 100))
            }
          }
        }
      }
    }
  } finally {
    // Clean up API timeout
    clearTimeout(apiTimeoutId)

    // Send final done message and close controller
    try {
      if (controller.desiredSize !== null) { // Check if controller is not closed
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      }
    } catch (e) {
      // Controller might already be closed
      console.log('Controller already closed:', e)
    }
  }
}