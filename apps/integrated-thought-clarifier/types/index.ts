export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  isImprovements?: boolean // Indicates this is the improvements/analysis message
  isMarkdown?: boolean // Indicates this is the markdown changes message
}

export interface PRDContext {
  messages: Message[]
  currentPRD: string
  projectName: string
}

export interface AIResponse {
  message: string
  updatedPRD?: string
  suggestions?: string[]
}

export interface ApiKeys {
  openai: string
  anthropic: string
  activeProvider: 'openai' | 'anthropic'
  selectedModel?: string
}

export interface ModelConfig {
  id: string
  name: string
  provider: 'openai' | 'anthropic'
  contextWindow: number
  outputTokens: number
  bestFor: string[]
  costPer1kTokens: { input: number; output: number }
  available: boolean
}

export interface PRDTemplate {
  id: string
  name: string
  description: string
  category: 'b2b' | 'b2c' | 'ai' | 'mobile' | 'platform'
  content: string
}

export interface GitHubRepo {
  name: string
  url: string
  private: boolean
  createdAt: Date
}

export interface PRDSection {
  title: string
  content: string
  required: boolean
  order: number
}

export interface ExportFormat {
  type: 'markdown' | 'json' | 'prompt'
  targetTool?: 'v0' | 'cursor' | 'claude' | 'generic'
}