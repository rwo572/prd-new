import { PRDLintRule, ParsedPRD, LintIssue } from '@/types/prd-linter'

// AI-NATIVE PRODUCT LINTING RULES
export const AI_PRD_LINT_RULES: PRDLintRule[] = [
  // ==================== AI MODEL & ARCHITECTURE ====================
  {
    id: 'ai-model-specification',
    category: 'technical',
    severity: 'error',
    name: 'AI Model Specification',
    description: 'PRD must specify which AI models to use',
    check: (prd: ParsedPRD) => {
      const modelKeywords = ['gpt-4', 'gpt-3.5', 'claude', 'gemini', 'llama', 'mistral', 'model', 'llm', 'ai model']
      const hasModel = modelKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasModel && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-model-specification',
          severity: 'error',
          message: 'No AI model specified',
          suggestion: 'Specify which AI model(s) to use',
          suggestions: [
            'GPT-4o for complex reasoning tasks',
            'Claude 3.5 Sonnet for code generation',
            'GPT-4o-mini for cost-effective operations',
            'Gemini 1.5 Pro for multimodal tasks'
          ],
          category: 'technical',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'ai-fallback-strategy',
    category: 'technical',
    severity: 'warning',
    name: 'AI Fallback Strategy',
    description: 'PRD should define fallback behavior when AI fails',
    check: (prd: ParsedPRD) => {
      const fallbackKeywords = ['fallback', 'degradation', 'offline mode', 'ai fails', 'model unavailable']
      const hasFallback = fallbackKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasFallback && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-fallback-strategy',
          severity: 'warning',
          message: 'No AI fallback strategy defined',
          suggestion: 'Define what happens when AI is unavailable',
          suggestions: [
            'Provide cached responses for common queries',
            'Switch to rule-based logic for critical features',
            'Queue requests for later processing',
            'Offer manual input alternatives'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  // ==================== PROMPT ENGINEERING ====================
  {
    id: 'prompt-templates',
    category: 'technical',
    severity: 'warning',
    name: 'Prompt Template Definition',
    description: 'PRD should include example prompts',
    check: (prd: ParsedPRD) => {
      const promptKeywords = ['prompt', 'system message', 'instruction', 'few-shot', 'zero-shot']
      const hasPrompts = promptKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasPrompts && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'prompt-templates',
          severity: 'warning',
          message: 'No prompt templates or examples provided',
          suggestion: 'Include example prompts for AI interactions',
          suggestions: [
            '## System Prompt\nYou are a helpful assistant that...',
            '## User Prompt Template\nGiven {context}, perform {task}...',
            '## Few-shot Examples\nExample 1: Input: X, Output: Y'
          ],
          category: 'technical',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'context-window-limits',
    category: 'technical',
    severity: 'info',
    name: 'Context Window Management',
    description: 'PRD should address context window limitations',
    check: (prd: ParsedPRD) => {
      const contextKeywords = ['context window', 'token limit', 'context length', 'truncation', 'summarization']
      const hasContext = contextKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasContext && prd.content.toLowerCase().includes('conversation')) {
        return [{
          ruleId: 'context-window-limits',
          severity: 'info',
          message: 'No context window management strategy',
          suggestion: 'Define how to handle long conversations',
          suggestions: [
            'Implement sliding window with last N messages',
            'Use summarization for older messages',
            'Store conversation history with retrieval',
            'Implement context compression techniques'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  // ==================== AI SAFETY & ETHICS ====================
  {
    id: 'ai-safety-guardrails',
    category: 'security',
    severity: 'error',
    name: 'AI Safety Guardrails',
    description: 'PRD must define safety measures',
    check: (prd: ParsedPRD) => {
      const safetyKeywords = ['safety', 'guardrail', 'content filter', 'moderation', 'harmful', 'toxic']
      const hasSafety = safetyKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasSafety && prd.content.toLowerCase().includes('user-generated')) {
        return [{
          ruleId: 'ai-safety-guardrails',
          severity: 'error',
          message: 'No AI safety guardrails specified',
          suggestion: 'Define content moderation and safety measures',
          suggestions: [
            'Implement content filtering for harmful outputs',
            'Add rate limiting per user',
            'Block prompt injection attempts',
            'Monitor for adversarial inputs'
          ],
          category: 'security',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'ai-bias-mitigation',
    category: 'ux',
    severity: 'warning',
    name: 'Bias Mitigation Strategy',
    description: 'PRD should address potential AI biases',
    check: (prd: ParsedPRD) => {
      const biasKeywords = ['bias', 'fairness', 'discrimination', 'diverse', 'inclusive', 'equity']
      const hasBias = biasKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasBias && prd.content.toLowerCase().includes('personalization')) {
        return [{
          ruleId: 'ai-bias-mitigation',
          severity: 'warning',
          message: 'No bias mitigation strategy defined',
          suggestion: 'Address how to prevent and detect AI bias',
          suggestions: [
            'Regular audits of AI outputs for bias',
            'Diverse training data requirements',
            'Fairness metrics and monitoring',
            'User feedback mechanism for bias reporting'
          ],
          category: 'ux'
        }]
      }
      return []
    }
  },

  // ==================== DATA & PRIVACY ====================
  {
    id: 'ai-data-retention',
    category: 'security',
    severity: 'error',
    name: 'AI Data Retention Policy',
    description: 'PRD must specify data retention for AI interactions',
    check: (prd: ParsedPRD) => {
      const retentionKeywords = ['retention', 'data storage', 'conversation history', 'delete', 'purge', 'gdpr']
      const hasRetention = retentionKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasRetention && prd.content.toLowerCase().includes('chat')) {
        return [{
          ruleId: 'ai-data-retention',
          severity: 'error',
          message: 'No data retention policy for AI interactions',
          suggestion: 'Specify how long to store user conversations',
          suggestions: [
            'Delete conversations after 30 days',
            'Anonymize data after 90 days',
            'User-controlled data deletion',
            'Separate retention for training vs operational data'
          ],
          category: 'security',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'ai-training-data',
    category: 'security',
    severity: 'warning',
    name: 'Training Data Usage',
    description: 'PRD should clarify if user data is used for training',
    check: (prd: ParsedPRD) => {
      const trainingKeywords = ['training', 'fine-tuning', 'improvement', 'learn from users']
      const hasTraining = trainingKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasTraining && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-training-data',
          severity: 'warning',
          message: 'Training data usage not specified',
          suggestion: 'Clarify if and how user data is used for model training',
          suggestions: [
            'User data will NOT be used for training',
            'Anonymized data may be used with consent',
            'Opt-in training data contribution',
            'Federated learning without data collection'
          ],
          category: 'security'
        }]
      }
      return []
    }
  },

  // ==================== PERFORMANCE & COST ====================
  {
    id: 'ai-latency-requirements',
    category: 'technical',
    severity: 'warning',
    name: 'AI Response Latency',
    description: 'PRD should specify acceptable AI response times',
    check: (prd: ParsedPRD) => {
      const latencyKeywords = ['latency', 'response time', 'streaming', 'real-time', 'timeout']
      const hasLatency = latencyKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasLatency && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-latency-requirements',
          severity: 'warning',
          message: 'No AI response time requirements specified',
          suggestion: 'Define acceptable latency for AI responses',
          suggestions: [
            'First token within 1 second',
            'Complete response within 10 seconds',
            'Stream responses for better UX',
            'Show typing indicators during generation'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  {
    id: 'ai-cost-estimation',
    category: 'technical',
    severity: 'info',
    name: 'AI Cost Estimation',
    description: 'PRD should estimate AI API costs',
    check: (prd: ParsedPRD) => {
      const costKeywords = ['cost', 'pricing', 'budget', 'token usage', 'api costs']
      const hasCost = costKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasCost && (prd.content.toLowerCase().includes('gpt') || prd.content.toLowerCase().includes('claude'))) {
        return [{
          ruleId: 'ai-cost-estimation',
          severity: 'info',
          message: 'No AI cost estimation provided',
          suggestion: 'Estimate API costs based on usage',
          suggestions: [
            'Estimated $X per 1000 users/month',
            'Average Y tokens per request at $Z per 1M tokens',
            'Implement usage quotas per user',
            'Cache common responses to reduce costs'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  // ==================== AI UX PATTERNS ====================
  {
    id: 'ai-transparency',
    category: 'ux',
    severity: 'warning',
    name: 'AI Transparency',
    description: 'Users should know when interacting with AI',
    check: (prd: ParsedPRD) => {
      const transparencyKeywords = ['ai-generated', 'automated', 'bot', 'disclosure', 'transparency']
      const hasTransparency = transparencyKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasTransparency && prd.content.toLowerCase().includes('assistant')) {
        return [{
          ruleId: 'ai-transparency',
          severity: 'warning',
          message: 'No AI transparency measures specified',
          suggestion: 'Clearly indicate AI-generated content',
          suggestions: [
            'Add "AI Assistant" label to bot messages',
            'Include disclaimer about AI limitations',
            'Show confidence scores when appropriate',
            'Allow users to request human support'
          ],
          category: 'ux'
        }]
      }
      return []
    }
  },

  {
    id: 'ai-feedback-loop',
    category: 'ux',
    severity: 'info',
    name: 'AI Feedback Mechanism',
    description: 'PRD should include user feedback for AI',
    check: (prd: ParsedPRD) => {
      const feedbackKeywords = ['thumbs up', 'thumbs down', 'feedback', 'rating', 'improve', 'report']
      const hasFeedback = feedbackKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasFeedback && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-feedback-loop',
          severity: 'info',
          message: 'No AI feedback mechanism specified',
          suggestion: 'Add ways for users to rate AI responses',
          suggestions: [
            'Thumbs up/down for each response',
            'Report incorrect or harmful outputs',
            'Suggest better responses',
            'Rate helpfulness on 1-5 scale'
          ],
          category: 'ux',
          autoFixable: true
        }]
      }
      return []
    }
  },

  // ==================== EVALUATION & TESTING ====================
  {
    id: 'ai-evaluation-metrics',
    category: 'technical',
    severity: 'warning',
    name: 'AI Evaluation Metrics',
    description: 'PRD should define success metrics for AI',
    check: (prd: ParsedPRD) => {
      const metricsKeywords = ['accuracy', 'precision', 'recall', 'f1', 'bleu', 'rouge', 'perplexity', 'success rate']
      const hasMetrics = metricsKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasMetrics && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-evaluation-metrics',
          severity: 'warning',
          message: 'No AI evaluation metrics defined',
          suggestion: 'Define how to measure AI performance',
          suggestions: [
            'Task completion rate > 80%',
            'User satisfaction score > 4.0/5.0',
            'Response relevance score > 0.8',
            'Hallucination rate < 5%'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  {
    id: 'ai-test-cases',
    category: 'technical',
    severity: 'warning',
    name: 'AI Test Cases',
    description: 'PRD should include AI-specific test scenarios',
    check: (prd: ParsedPRD) => {
      const testKeywords = ['test case', 'edge case', 'adversarial', 'prompt injection', 'jailbreak']
      const hasTests = testKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasTests && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-test-cases',
          severity: 'warning',
          message: 'No AI-specific test cases defined',
          suggestion: 'Include test cases for AI behavior',
          suggestions: [
            'Test with ambiguous inputs',
            'Test with adversarial prompts',
            'Test with out-of-domain questions',
            'Test with multiple languages'
          ],
          category: 'technical',
          autoFixable: true
        }]
      }
      return []
    }
  },

  // ==================== ADVANCED AI FEATURES ====================
  {
    id: 'ai-memory-persistence',
    category: 'technical',
    severity: 'info',
    name: 'AI Memory & Persistence',
    description: 'PRD should specify if AI remembers context',
    check: (prd: ParsedPRD) => {
      const memoryKeywords = ['memory', 'remember', 'persist', 'conversation history', 'context retention']
      const hasMemory = memoryKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasMemory && prd.content.toLowerCase().includes('personalized')) {
        return [{
          ruleId: 'ai-memory-persistence',
          severity: 'info',
          message: 'AI memory/persistence not specified',
          suggestion: 'Define if AI should remember user preferences',
          suggestions: [
            'Remember user preferences across sessions',
            'Maintain conversation context for 24 hours',
            'Store user-specific fine-tuning',
            'No persistence - each session is independent'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  {
    id: 'ai-multimodal',
    category: 'technical',
    severity: 'info',
    name: 'Multimodal Capabilities',
    description: 'PRD should specify multimodal requirements',
    check: (prd: ParsedPRD) => {
      const multimodalKeywords = ['image', 'audio', 'video', 'file upload', 'vision', 'speech']
      const hasMultimodal = multimodalKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (hasMultimodal && !prd.content.toLowerCase().includes('format')) {
        return [{
          ruleId: 'ai-multimodal',
          severity: 'info',
          message: 'Multimodal format specifications missing',
          suggestion: 'Specify supported file formats and limits',
          suggestions: [
            'Images: JPG, PNG up to 20MB',
            'Audio: MP3, WAV up to 10 minutes',
            'Documents: PDF, DOCX with OCR support',
            'Video: MP4 up to 100MB'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  {
    id: 'ai-tool-use',
    category: 'technical',
    severity: 'info',
    name: 'AI Tool/Function Calling',
    description: 'PRD should specify if AI can use tools',
    check: (prd: ParsedPRD) => {
      const toolKeywords = ['function calling', 'tool use', 'api call', 'plugin', 'action', 'integration']
      const hasTools = toolKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (prd.content.toLowerCase().includes('assistant') && !hasTools) {
        return [{
          ruleId: 'ai-tool-use',
          severity: 'info',
          message: 'AI tool/function capabilities not specified',
          suggestion: 'Define what tools the AI can access',
          suggestions: [
            'Calendar integration for scheduling',
            'Database queries for information retrieval',
            'Email sending with user confirmation',
            'Web search for current information'
          ],
          category: 'technical'
        }]
      }
      return []
    }
  },

  // ==================== HALLUCINATION & ACCURACY ====================
  {
    id: 'ai-hallucination-prevention',
    category: 'technical',
    severity: 'error',
    name: 'Hallucination Prevention',
    description: 'PRD must address hallucination risks',
    check: (prd: ParsedPRD) => {
      const hallucinationKeywords = ['hallucination', 'factual', 'accuracy', 'verification', 'ground truth', 'citation']
      const hasHallucination = hallucinationKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasHallucination && prd.content.toLowerCase().includes('information')) {
        return [{
          ruleId: 'ai-hallucination-prevention',
          severity: 'error',
          message: 'No hallucination prevention strategy',
          suggestion: 'Define how to prevent/detect AI hallucinations',
          suggestions: [
            'Require citations for factual claims',
            'Implement RAG with verified sources',
            'Add confidence scores to responses',
            'Human review for critical information'
          ],
          category: 'technical',
          autoFixable: true
        }]
      }
      return []
    }
  },

  {
    id: 'ai-uncertainty-handling',
    category: 'ux',
    severity: 'warning',
    name: 'Uncertainty Communication',
    description: 'AI should communicate uncertainty',
    check: (prd: ParsedPRD) => {
      const uncertaintyKeywords = ['uncertain', 'confidence', 'not sure', 'might be', 'approximate']
      const hasUncertainty = uncertaintyKeywords.some(keyword => 
        prd.content.toLowerCase().includes(keyword)
      )
      
      if (!hasUncertainty && prd.content.toLowerCase().includes('ai')) {
        return [{
          ruleId: 'ai-uncertainty-handling',
          severity: 'warning',
          message: 'No uncertainty handling specified',
          suggestion: 'Define how AI expresses uncertainty',
          suggestions: [
            'Use qualifiers like "likely", "possibly"',
            'Show confidence percentages',
            'Provide multiple options when uncertain',
            'Explicitly state limitations'
          ],
          category: 'ux'
        }]
      }
      return []
    }
  }
]

// SCORING WEIGHTS FOR AI-SPECIFIC RULES
export const AI_SCORING_WEIGHTS = {
  'ai-model-specification': 15,
  'ai-safety-guardrails': 15,
  'ai-data-retention': 12,
  'ai-hallucination-prevention': 12,
  'ai-evaluation-metrics': 10,
  'ai-bias-mitigation': 10,
  'ai-cost-estimation': 8,
  'ai-fallback-strategy': 8,
  'prompt-templates': 8,
  'ai-latency-requirements': 7,
  'ai-transparency': 7,
  'ai-test-cases': 7,
  'ai-training-data': 6,
  'ai-feedback-loop': 5,
  'context-window-limits': 5,
  'ai-uncertainty-handling': 5,
  'ai-memory-persistence': 4,
  'ai-multimodal': 4,
  'ai-tool-use': 4
}

// AUTO-FIX TEMPLATES FOR AI RULES
export const AI_AUTO_FIX_TEMPLATES = {
  'ai-model-specification': `
## AI Model Selection

### Primary Model
- **Model**: GPT-4o
- **Use Case**: Complex reasoning, code generation, analysis
- **Context Window**: 128k tokens
- **Cost**: $5.00 / 1M input tokens

### Fallback Model
- **Model**: GPT-4o-mini
- **Use Case**: Simple queries, cost optimization
- **Context Window**: 128k tokens
- **Cost**: $0.15 / 1M input tokens`,

  'ai-safety-guardrails': `
## AI Safety & Content Moderation

### Input Validation
- Detect and block prompt injection attempts
- Filter PII before sending to AI
- Rate limit: 100 requests per user per hour

### Output Filtering
- Block harmful, toxic, or inappropriate content
- Remove any leaked system prompts
- Sanitize code outputs for security vulnerabilities

### Monitoring
- Log all flagged interactions for review
- Alert on unusual usage patterns
- Regular audit of AI responses`,

  'ai-data-retention': `
## Data Retention & Privacy

### Conversation Data
- **Retention Period**: 30 days for active users
- **Deletion**: Automatic after inactivity period
- **User Control**: Users can delete all data anytime

### Training Data
- User data will NOT be used for model training
- Anonymized feedback may be collected with consent
- Compliance with GDPR, CCPA regulations

### Data Storage
- Encrypted at rest and in transit
- Geographically distributed based on user location
- Regular security audits`,

  'ai-hallucination-prevention': `
## Hallucination Prevention Strategy

### Retrieval-Augmented Generation (RAG)
- Ground responses in verified documentation
- Cite sources for all factual claims
- Confidence threshold: 0.8 for factual statements

### Verification Layer
- Cross-reference critical information
- Human review for high-stakes decisions
- Automated fact-checking where possible

### User Communication
- Clear disclaimers about AI limitations
- Encourage users to verify important information
- Provide feedback mechanism for corrections`,

  'ai-evaluation-metrics': `
## AI Performance Metrics

### Quality Metrics
- **Response Relevance**: > 85% (cosine similarity)
- **Task Completion Rate**: > 80%
- **User Satisfaction**: > 4.2/5.0

### Safety Metrics
- **Hallucination Rate**: < 5%
- **Harmful Output Rate**: < 0.1%
- **Prompt Injection Success**: 0%

### Performance Metrics
- **First Token Latency**: < 1 second
- **Total Response Time**: < 10 seconds
- **Availability**: > 99.9%`,

  'prompt-templates': `
## Prompt Engineering

### System Prompt
\`\`\`
You are a helpful AI assistant for [product name].
Your role is to [primary function].

Guidelines:
- Be concise and accurate
- Admit uncertainty when unsure
- Refuse harmful requests
- Cite sources when providing facts
\`\`\`

### User Prompt Template
\`\`\`
Context: {user_context}
Task: {user_request}
Constraints: {any_limitations}
Format: {expected_output_format}
\`\`\`

### Few-Shot Examples
\`\`\`
User: [Example input 1]
Assistant: [Example output 1]

User: [Example input 2]
Assistant: [Example output 2]
\`\`\``,

  'ai-test-cases': `
## AI Test Scenarios

### Functional Tests
1. **Basic Functionality**: Standard use cases
2. **Edge Cases**: Unusual but valid inputs
3. **Error Handling**: Invalid or malformed inputs

### Safety Tests
1. **Prompt Injection**: "Ignore previous instructions..."
2. **Jailbreak Attempts**: Trying to bypass safety
3. **PII Leakage**: Ensuring no data exposure

### Performance Tests
1. **Load Testing**: 100 concurrent users
2. **Latency Testing**: Response time under load
3. **Context Overflow**: Maximum context handling

### Quality Tests
1. **Accuracy**: Factual correctness
2. **Relevance**: Response appropriateness
3. **Consistency**: Similar inputs → similar outputs`,

  'ai-feedback-loop': `
## User Feedback System

### Feedback Collection
- 👍 👎 buttons on each AI response
- Optional text feedback for improvements
- Bug report mechanism for errors

### Feedback Processing
- Aggregate ratings for quality metrics
- Prioritize commonly reported issues
- Use feedback for prompt refinement

### User Communication
- Acknowledge feedback receipt
- Share improvements based on feedback
- Regular updates on system enhancements`
}