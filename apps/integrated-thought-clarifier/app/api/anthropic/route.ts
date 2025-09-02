import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { model, max_tokens, messages } = body

    // Get API key from request headers or environment
    const apiKey = request.headers.get('x-api-key') || process.env.ANTHROPIC_API_KEY
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 400 }
      )
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: model || 'claude-3-haiku-20240307',
        max_tokens: max_tokens || 500,
        messages
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Anthropic API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate AI suggestions' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('AI suggestion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}