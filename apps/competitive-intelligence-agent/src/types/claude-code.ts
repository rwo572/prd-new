// Claude Code SDK integration types

export interface ClaudeCodeAgent {
  id: string;
  name: string;
  description: string;
  version: string;
  capabilities: AgentCapability[];
  tools: AgentTool[];
  configuration: AgentConfiguration;
}

export interface AgentCapability {
  name: string;
  description: string;
  inputs: CapabilityInput[];
  outputs: CapabilityOutput[];
  requirements: string[];
}

export interface CapabilityInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: ValidationRule[];
}

export interface CapabilityOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  schema?: object;
}

export interface ValidationRule {
  type: 'min' | 'max' | 'pattern' | 'enum' | 'custom';
  value: unknown;
  message: string;
}

export interface AgentTool {
  id: string;
  name: string;
  type: ToolType;
  description: string;
  parameters: ToolParameter[];
  implementation: ToolImplementation;
}

export type ToolType =
  | 'web_scraper'
  | 'api_client'
  | 'content_analyzer'
  | 'sentiment_analyzer'
  | 'entity_extractor'
  | 'fact_checker'
  | 'report_generator'
  | 'notification_sender';

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  required: boolean;
  description: string;
  defaultValue?: unknown;
}

export interface ToolImplementation {
  handler: ToolHandler;
  timeout: number;
  retries: number;
  rateLimit?: RateLimit;
}

export type ToolHandler = (parameters: Record<string, unknown>) => Promise<ToolResult>;

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: ToolError;
  metadata?: ToolMetadata;
}

export interface ToolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ToolMetadata {
  executionTime: number;
  tokensUsed?: number;
  sourcesAccessed?: string[];
  confidence?: number;
}

export interface AgentConfiguration {
  environment: 'development' | 'staging' | 'production';
  apiKeys: Record<string, string>;
  limits: AgentLimits;
  scheduling: SchedulingConfig;
  monitoring: MonitoringConfig;
}

export interface AgentLimits {
  maxConcurrentTasks: number;
  maxExecutionTime: number;
  maxMemoryUsage: number;
  maxApiCalls: number;
  dailyQuota: number;
}

export interface SchedulingConfig {
  timezone: string;
  schedules: TaskSchedule[];
  dependencies: TaskDependency[];
}

export interface TaskSchedule {
  id: string;
  name: string;
  cron: string;
  task: string;
  parameters: Record<string, unknown>;
  enabled: boolean;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[];
  condition: 'success' | 'completion' | 'failure';
}

export interface MonitoringConfig {
  healthChecks: HealthCheck[];
  metrics: MetricConfig[];
  logging: LoggingConfig;
  alerts: AlertConfig[];
}

export interface HealthCheck {
  name: string;
  endpoint: string;
  interval: number;
  timeout: number;
  expectedStatus: number;
}

export interface MetricConfig {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  labels: string[];
  aggregation: 'sum' | 'avg' | 'max' | 'min' | 'count';
}

export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  format: 'json' | 'text';
  destinations: LogDestination[];
  retention: number;
}

export interface LogDestination {
  type: 'console' | 'file' | 'elasticsearch' | 'datadog';
  config: Record<string, unknown>;
}

export interface AlertConfig {
  name: string;
  condition: AlertCondition;
  actions: AlertAction[];
  cooldown: number;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne' | 'gte' | 'lte';
  threshold: number;
  duration: number;
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'pagerduty';
  config: Record<string, unknown>;
}

// Task execution types
export interface AgentTask {
  id: string;
  type: TaskType;
  priority: TaskPriority;
  parameters: Record<string, unknown>;
  context: TaskContext;
  status: TaskStatus;
  result?: TaskResult;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export type TaskType =
  | 'monitor_competitor'
  | 'analyze_signals'
  | 'generate_report'
  | 'send_alert'
  | 'validate_sources'
  | 'fact_check'
  | 'extract_entities'
  | 'sentiment_analysis';

export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

export type TaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface TaskContext {
  sessionId?: string;
  userId?: string;
  competitorId?: string;
  reportId?: string;
  metadata: Record<string, unknown>;
}

export interface TaskResult {
  success: boolean;
  data?: unknown;
  error?: TaskError;
  metrics: TaskMetrics;
}

export interface TaskError {
  type: 'validation' | 'execution' | 'timeout' | 'rate_limit' | 'system';
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface TaskMetrics {
  executionTime: number;
  memoryUsed: number;
  apiCallsMade: number;
  tokensConsumed: number;
  successRate: number;
}

// Integration with Claude Code SDK
export interface ClaudeCodeSDKIntegration {
  client: ClaudeCodeClient;
  agentManager: AgentManager;
  taskExecutor: TaskExecutor;
  toolRegistry: ToolRegistry;
}

export interface ClaudeCodeClient {
  initialize(config: SDKConfig): Promise<void>;
  authenticate(credentials: AuthCredentials): Promise<void>;
  registerAgent(agent: ClaudeCodeAgent): Promise<AgentRegistration>;
  submitTask(task: AgentTask): Promise<TaskSubmission>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  getTaskResult(taskId: string): Promise<TaskResult>;
}

export interface SDKConfig {
  apiUrl: string;
  apiKey: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  retries: number;
  timeout: number;
}

export interface AuthCredentials {
  type: 'api_key' | 'oauth' | 'service_account';
  credentials: Record<string, string>;
}

export interface AgentRegistration {
  agentId: string;
  status: 'registered' | 'pending' | 'rejected';
  capabilities: string[];
  endpoints: AgentEndpoint[];
}

export interface AgentEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  parameters: EndpointParameter[];
}

export interface EndpointParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
}

export interface TaskSubmission {
  taskId: string;
  status: TaskStatus;
  estimatedCompletion?: Date;
  queuePosition?: number;
}

export interface AgentManager {
  listAgents(): Promise<ClaudeCodeAgent[]>;
  getAgent(agentId: string): Promise<ClaudeCodeAgent>;
  updateAgent(agentId: string, updates: Partial<ClaudeCodeAgent>): Promise<void>;
  deleteAgent(agentId: string): Promise<void>;
  getAgentMetrics(agentId: string): Promise<AgentMetrics>;
}

export interface AgentMetrics {
  tasksExecuted: number;
  successRate: number;
  averageExecutionTime: number;
  resourceUsage: ResourceUsage;
  errorRate: number;
  uptime: number;
}

export interface ResourceUsage {
  cpu: number;
  memory: number;
  network: number;
  storage: number;
}

export interface TaskExecutor {
  execute(task: AgentTask): Promise<TaskResult>;
  schedule(task: AgentTask, schedule: TaskSchedule): Promise<void>;
  cancel(taskId: string): Promise<void>;
  retry(taskId: string): Promise<TaskResult>;
  getExecutionLogs(taskId: string): Promise<ExecutionLog[]>;
}

export interface ExecutionLog {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context: Record<string, unknown>;
}

export interface ToolRegistry {
  registerTool(tool: AgentTool): Promise<void>;
  getTool(toolId: string): Promise<AgentTool>;
  listTools(): Promise<AgentTool[]>;
  updateTool(toolId: string, updates: Partial<AgentTool>): Promise<void>;
  deleteTool(toolId: string): Promise<void>;
}

// Streaming and real-time updates
export interface StreamingConfig {
  enabled: boolean;
  batchSize: number;
  flushInterval: number;
  compression: boolean;
}

export interface StreamingUpdate {
  type: 'signal' | 'alert' | 'status' | 'metric';
  timestamp: Date;
  data: unknown;
  sessionId?: string;
  competitorId?: string;
}

export interface StreamingSubscription {
  id: string;
  filters: StreamingFilter[];
  callback: StreamingCallback;
  active: boolean;
}

export interface StreamingFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith';
  value: string;
}

export type StreamingCallback = (update: StreamingUpdate) => void | Promise<void>;

// Error handling and recovery
export interface ErrorRecoveryConfig {
  retryStrategies: RetryStrategy[];
  fallbackActions: FallbackAction[];
  circuitBreaker: CircuitBreakerConfig;
}

export interface RetryStrategy {
  errorTypes: string[];
  maxAttempts: number;
  backoffType: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  jitter: boolean;
}

export interface FallbackAction {
  errorTypes: string[];
  action: 'skip' | 'retry_later' | 'use_cache' | 'notify_admin';
  parameters: Record<string, unknown>;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  halfOpenMaxCalls: number;
  monitoringWindow: number;
}