import { ModelConfig } from '@/types'

export const AI_MODELS: ModelConfig[] = [
  // OpenAI Models - Latest 2025 Models
  {
    id: 'o3',
    name: 'OpenAI o3',
    provider: 'openai',
    contextWindow: 200000,
    outputTokens: 32768,
    bestFor: ['Ultimate reasoning', 'Complex problem solving', 'Math', 'Science', 'Coding'],
    costPer1kTokens: { input: 0.06, output: 0.24 },
    available: true
  },
  {
    id: 'o4-mini',
    name: 'OpenAI o4-mini',
    provider: 'openai',
    contextWindow: 200000,
    outputTokens: 16384,
    bestFor: ['Fast reasoning', 'Cost-effective problem solving', 'Math', 'Coding'],
    costPer1kTokens: { input: 0.003, output: 0.012 },
    available: true
  },
  {
    id: 'gpt-4.1',
    name: 'GPT-4.1',
    provider: 'openai',
    contextWindow: 200000,
    outputTokens: 16384,
    bestFor: ['Enhanced coding', 'Instruction following', 'General tasks'],
    costPer1kTokens: { input: 0.005, output: 0.015 },
    available: true
  },
  {
    id: 'gpt-4.1-mini',
    name: 'GPT-4.1 Mini',
    provider: 'openai',
    contextWindow: 200000,
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
    bestFor: ['Multimodal tasks', 'Creative work', 'General conversations'],
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
  
  // Anthropic Models - Claude 4 Series and Latest versions
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
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
  },

  // Google Gemini Models
  {
    id: 'gemini-pro',
    name: 'Gemini Pro',
    provider: 'gemini',
    contextWindow: 32000,
    outputTokens: 8192,
    bestFor: ['General tasks', 'Reasoning', 'Content generation'],
    costPer1kTokens: { input: 0.000125, output: 0.000375 },
    available: true
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'gemini',
    contextWindow: 128000,
    outputTokens: 8192,
    bestFor: ['Advanced reasoning', 'Large context tasks', 'PRD generation'],
    costPer1kTokens: { input: 0.00125, output: 0.005 },
    available: true
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'gemini',
    contextWindow: 1000000,
    outputTokens: 8192,
    bestFor: ['Fast responses', 'High volume', 'Large document processing'],
    costPer1kTokens: { input: 0.000075, output: 0.0003 },
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
    primary: 'o4-mini',
    fallback: 'gpt-4.1-mini',
    reason: 'Fast reasoning and cost-effective for simple clarifications'
  },
  'complex-analysis': {
    primary: 'o3',
    fallback: 'claude-opus-4-1-20250805',
    reason: 'Ultimate reasoning capabilities for complex problem solving'
  },
  'code-generation': {
    primary: 'claude-sonnet-4-20250514',
    fallback: 'gpt-4.1',
    reason: 'Claude Sonnet 4 has advanced coding capabilities with large context'
  },
  'brainstorming': {
    primary: 'gpt-4.1',
    fallback: 'claude-sonnet-4-20250514',
    reason: 'GPT-4.1 offers superior creative and diverse ideation'
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

export function getModelsByProvider(provider: 'openai' | 'anthropic' | 'gemini'): ModelConfig[] {
  return AI_MODELS.filter(m => m.provider === provider)
}