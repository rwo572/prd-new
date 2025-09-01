import { ModelConfig } from '@/types'

export const AI_MODELS: ModelConfig[] = [
  // OpenAI Models - Including GPT-5
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    contextWindow: 256000,
    outputTokens: 32768,
    bestFor: ['Advanced reasoning', 'Complex PRDs', 'Multimodal mastery', 'Best overall'],
    costPer1kTokens: { input: 0.005, output: 0.015 },
    available: true
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'openai',
    contextWindow: 256000,
    outputTokens: 16384,
    bestFor: ['Fast responses', 'Cost-effective', 'High volume tasks'],
    costPer1kTokens: { input: 0.0003, output: 0.001 },
    available: true
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    outputTokens: 16384,
    bestFor: ['Complex reasoning', 'Multimodal tasks', 'Fast responses'],
    costPer1kTokens: { input: 0.0025, output: 0.01 },
    available: true
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    outputTokens: 16384,
    bestFor: ['Quick questions', 'Cost-effective tasks', 'High volume'],
    costPer1kTokens: { input: 0.00015, output: 0.0006 },
    available: true
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    outputTokens: 4096,
    bestFor: ['PRD generation', 'Code generation', 'Complex analysis'],
    costPer1kTokens: { input: 0.01, output: 0.03 },
    available: true
  },
  
  // Anthropic Models - Claude 4 Series and Latest versions
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1 (Latest)',
    provider: 'anthropic',
    contextWindow: 500000,
    outputTokens: 16384,
    bestFor: ['Ultimate reasoning', 'Complex PRDs', 'Research', 'Best Claude model'],
    costPer1kTokens: { input: 0.01, output: 0.05 },
    available: true
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'anthropic',
    contextWindow: 400000,
    outputTokens: 12288,
    bestFor: ['Advanced coding', 'PRD generation', 'Analysis', 'Balanced performance'],
    costPer1kTokens: { input: 0.005, output: 0.025 },
    available: true
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    outputTokens: 8192,
    bestFor: ['Good coding', 'General tasks'],
    costPer1kTokens: { input: 0.003, output: 0.015 },
    available: true
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    outputTokens: 8192,
    bestFor: ['Fast responses', 'High volume', 'Cost-effective'],
    costPer1kTokens: { input: 0.001, output: 0.005 },
    available: true
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    contextWindow: 200000,
    outputTokens: 4096,
    bestFor: ['Complex reasoning', 'Research'],
    costPer1kTokens: { input: 0.015, output: 0.075 },
    available: true
  },
  {
    id: 'claude-3-sonnet-20240229',
    name: 'Claude 3 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    outputTokens: 4096,
    bestFor: ['Balanced performance', 'General tasks'],
    costPer1kTokens: { input: 0.003, output: 0.015 },
    available: true
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    outputTokens: 4096,
    bestFor: ['Fast responses', 'Simple tasks'],
    costPer1kTokens: { input: 0.00025, output: 0.00125 },
    available: true
  }
]

// Task-specific model recommendations
export const MODEL_RECOMMENDATIONS = {
  'prd-generation': {
    primary: 'claude-opus-4-1-20250805',
    fallback: 'claude-sonnet-4-20250514',
    reason: 'Claude Opus 4.1 provides unmatched reasoning and comprehensive PRD generation'
  },
  'quick-questions': {
    primary: 'gpt-5-mini',
    fallback: 'claude-3-5-haiku-20241022',
    reason: 'Fast and cost-effective for simple clarifications'
  },
  'complex-analysis': {
    primary: 'claude-opus-4-1-20250805',
    fallback: 'gpt-5',
    reason: 'Ultimate reasoning capabilities for complex problem solving'
  },
  'code-generation': {
    primary: 'claude-sonnet-4-20250514',
    fallback: 'gpt-5',
    reason: 'Claude Sonnet 4 has advanced coding capabilities with large context'
  },
  'brainstorming': {
    primary: 'gpt-5',
    fallback: 'claude-sonnet-4-20250514',
    reason: 'GPT-5 offers superior creative and diverse ideation'
  }
}

export function getRecommendedModel(task: string): ModelConfig | undefined {
  const recommendation = MODEL_RECOMMENDATIONS[task as keyof typeof MODEL_RECOMMENDATIONS]
  if (!recommendation) return AI_MODELS[0]
  
  return AI_MODELS.find(m => m.id === recommendation.primary)
}

export function getModelById(modelId: string): ModelConfig | undefined {
  return AI_MODELS.find(m => m.id === modelId)
}

export function getModelsByProvider(provider: 'openai' | 'anthropic'): ModelConfig[] {
  return AI_MODELS.filter(m => m.provider === provider)
}