// Core agent interfaces and types for competitive intelligence monitoring

export interface CompetitiveIntelligenceAgent {
  id: string;
  name: "Competitive Intelligence Monitor";
  category: "AI-Native";
  version: "1.0.0";

  // Core capabilities
  monitor(targets: CompetitorTarget[], timeframe: TimeFrame): Promise<MonitoringSession>;
  analyze(data: MonitoringData): Promise<IntelligenceReport>;
  generateReport(analysis: IntelligenceAnalysis, format: ReportFormat): Promise<Report>;

  // Configuration
  configure(config: AgentConfig): Promise<void>;
  validateSources(sources: DataSource[]): Promise<ValidationResult>;
}

// Competitor tracking
export interface CompetitorTarget {
  id: string;
  name: string;
  domain: string;
  priority: 'high' | 'medium' | 'low';
  categories: CompetitorCategory[];
  monitoringChannels: MonitoringChannel[];
  lastUpdated: Date;
}

export interface CompetitorCategory {
  type: 'direct' | 'indirect' | 'potential';
  productSegment: string;
  marketShare?: number;
  threatLevel: 1 | 2 | 3 | 4 | 5;
}

// Monitoring configuration
export interface MonitoringChannel {
  type: 'product_updates' | 'pricing' | 'job_postings' | 'patents' | 'tech_blogs' | 'social_media';
  source: DataSource;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  filters: ChannelFilter[];
  enabled: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'rss' | 'api' | 'web_scraping' | 'job_board' | 'patent_db' | 'social';
  url: string;
  authentication?: AuthConfig;
  rateLimit: RateLimit;
  reliability: number; // 0-1 score
}

export interface ChannelFilter {
  type: 'keyword' | 'regex' | 'date_range' | 'content_type';
  value: string | RegExp | DateRange;
  include: boolean;
}

export interface AuthConfig {
  type: 'api_key' | 'bearer_token' | 'oauth' | 'basic_auth';
  credentials: Record<string, string>;
}

export interface RateLimit {
  requestsPerHour: number;
  requestsPerDay: number;
  burstLimit: number;
}

// Intelligence data structures
export interface MonitoringData {
  id: string;
  competitorId: string;
  channel: MonitoringChannel;
  timestamp: Date;
  rawData: unknown;
  processed: ProcessedSignal;
  confidence: number; // 0-1 score
  source: DataSource;
}

export interface ProcessedSignal {
  type: SignalType;
  category: string;
  title: string;
  description: string;
  impact: ImpactAssessment;
  metadata: SignalMetadata;
  verification: VerificationStatus;
}

export type SignalType =
  | 'product_launch'
  | 'feature_update'
  | 'pricing_change'
  | 'hiring_signal'
  | 'patent_filing'
  | 'technical_insight'
  | 'partnership'
  | 'funding'
  | 'market_move';

export interface ImpactAssessment {
  strategic: 'low' | 'medium' | 'high' | 'critical';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  affectedSegments: string[];
  responseRecommendation: string;
}

export interface SignalMetadata {
  keywords: string[];
  sentiment: number; // -1 to 1
  entities: Entity[];
  topics: string[];
  language: string;
  readabilityScore: number;
}

export interface Entity {
  type: 'person' | 'organization' | 'product' | 'technology' | 'location';
  name: string;
  confidence: number;
  mentions: number;
}

export interface VerificationStatus {
  isVerified: boolean;
  sourceCount: number;
  lastVerified: Date;
  verificationMethod: 'automatic' | 'manual' | 'cross_reference';
  confidenceLevel: number;
}

// Monitoring and analysis
export interface MonitoringSession {
  id: string;
  targets: CompetitorTarget[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'paused' | 'completed' | 'failed';
  signalsCollected: number;
  lastUpdate: Date;
}

export interface IntelligenceReport {
  id: string;
  sessionId: string;
  generatedAt: Date;
  summary: string;
  keyFindings: KeyFinding[];
  signals: ProcessedSignal[];
  recommendations: string[];
  confidence: number;
}

export interface IntelligenceAnalysis {
  reportId: string;
  analysisType: AnalysisType;
  findings: AnalysisFinding[];
  insights: AnalysisInsight[];
  trends: TrendAnalysis[];
  competitiveLandscape: CompetitiveLandscape;
}

export type AnalysisType = 'competitor_profile' | 'market_landscape' | 'threat_assessment' | 'opportunity_analysis';

export interface AnalysisFinding {
  id: string;
  type: FindingType;
  title: string;
  description: string;
  evidence: Evidence[];
  confidence: number;
  impact: ImpactLevel;
  urgency: UrgencyLevel;
}

export type FindingType =
  | 'product_innovation'
  | 'market_expansion'
  | 'pricing_strategy'
  | 'competitive_threat'
  | 'partnership'
  | 'technology_shift'
  | 'regulatory_change';

export type ImpactLevel = 'low' | 'medium' | 'high' | 'critical';
export type UrgencyLevel = 'low' | 'medium' | 'high' | 'immediate';

export interface Evidence {
  type: 'primary_source' | 'secondary_source' | 'analysis';
  source: string;
  url?: string;
  date: Date;
  reliability: number;
  description: string;
  excerpt?: string;
}

export interface AnalysisInsight {
  category: string;
  insight: string;
  supportingEvidence: Evidence[];
  actionableItems: string[];
  confidence: number;
}

export interface TrendAnalysis {
  trend: string;
  direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  strength: number; // 0-1
  timeframe: TimeFrame;
  affectedCompetitors: string[];
  implications: string[];
}

export interface CompetitiveLandscape {
  marketSegment: string;
  competitors: CompetitorPosition[];
  marketTrends: MarketTrend[];
  threats: CompetitiveThreat[];
  opportunities: MarketOpportunity[];
}

export interface CompetitorPosition {
  competitorId: string;
  marketShare: number;
  position: 'leader' | 'challenger' | 'follower' | 'niche';
  strengths: string[];
  weaknesses: string[];
  recentMoves: ProcessedSignal[];
}

export interface MarketTrend {
  name: string;
  description: string;
  impact: ImpactLevel;
  adoption: number; // 0-1
  maturity: 'emerging' | 'growing' | 'mature' | 'declining';
  timeHorizon: TimeFrame;
}

export interface CompetitiveThreat {
  type: 'new_entrant' | 'feature_parity' | 'pricing_pressure' | 'market_disruption';
  source: string;
  severity: number; // 1-5
  probability: number; // 0-1
  timeframe: TimeFrame;
  mitigation: string[];
}

export interface MarketOpportunity {
  type: 'gap_in_market' | 'competitor_weakness' | 'emerging_need' | 'technology_shift';
  description: string;
  potential: number; // 1-5
  feasibility: number; // 0-1
  timeToMarket: TimeFrame;
  requirements: string[];
}

// Reporting
export interface Report {
  id: string;
  type: ReportType;
  format: ReportFormat;
  generatedAt: Date;
  period: DateRange;
  content: ReportContent;
  metadata: ReportMetadata;
}

export type ReportType = 'monthly' | 'weekly' | 'daily' | 'ad_hoc' | 'alert';
export type ReportFormat = 'json' | 'markdown' | 'pdf' | 'html' | 'email';

export interface ReportContent {
  executiveSummary: string;
  keyFindings: KeyFinding[];
  competitorUpdates: CompetitorUpdate[];
  marketAnalysis: MarketAnalysis;
  recommendations: StrategicRecommendation[];
  appendix: ReportAppendix;
}

export interface KeyFinding {
  id: string;
  title: string;
  description: string;
  category: FindingType;
  impact: ImpactLevel;
  urgency: UrgencyLevel;
  evidence: Evidence[];
  recommendedActions: string[];
  confidence: number;
}

export interface CompetitorUpdate {
  competitorId: string;
  competitorName: string;
  updates: ProcessedSignal[];
  summary: string;
  significance: ImpactLevel;
  analysisNotes: string;
}

export interface MarketAnalysis {
  segment: string;
  trends: MarketTrend[];
  competitiveDynamics: string;
  emergingThreats: CompetitiveThreat[];
  marketOpportunities: MarketOpportunity[];
}

export interface StrategicRecommendation {
  id: string;
  type: 'defensive' | 'offensive' | 'monitoring' | 'strategic';
  priority: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  rationale: string;
  timeframe: TimeFrame;
  resources: string[];
  expectedOutcome: string;
  risks: string[];
}

export interface ReportAppendix {
  methodology: string;
  dataSources: DataSource[];
  limitations: string[];
  glossary: Record<string, string>;
  rawData?: unknown;
}

export interface ReportMetadata {
  author: string;
  version: string;
  confidenceLevel: number;
  dataQuality: DataQualityMetrics;
  processingTime: number;
  sourcesCovered: number;
}

export interface DataQualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  timeliness: number; // 0-1
  consistency: number; // 0-1
  reliability: number; // 0-1
}

// Configuration and settings
export interface AgentConfig {
  monitoringSettings: MonitoringSettings;
  analysisSettings: AnalysisSettings;
  reportingSettings: ReportingSettings;
  guardrailsConfig: GuardrailsConfig;
  performanceSettings: PerformanceSettings;
}

export interface MonitoringSettings {
  defaultFrequency: MonitoringFrequency;
  maxConcurrentSessions: number;
  dataRetentionDays: number;
  alertThresholds: AlertThresholds;
}

export type MonitoringFrequency = 'realtime' | 'hourly' | 'daily' | 'weekly';

export interface AlertThresholds {
  criticalSignals: number;
  highImpactEvents: number;
  newCompetitorDetection: boolean;
  pricingChanges: boolean;
  productLaunches: boolean;
}

export interface AnalysisSettings {
  confidenceThreshold: number;
  minimumEvidence: number;
  speculationHandling: 'mark' | 'filter' | 'separate';
  sentimentAnalysis: boolean;
  entityExtraction: boolean;
}

export interface ReportingSettings {
  defaultFormat: ReportFormat;
  schedules: ReportSchedule[];
  distribution: DistributionConfig[];
  customization: ReportCustomization;
}

export interface ReportSchedule {
  type: ReportType;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  dayOfWeek?: number;
  dayOfMonth?: number;
  time: string; // HH:MM format
  enabled: boolean;
}

export interface DistributionConfig {
  method: 'email' | 'webhook' | 'api' | 'file';
  recipients: string[];
  format: ReportFormat;
  conditions: DistributionCondition[];
}

export interface DistributionCondition {
  type: 'impact_level' | 'urgency' | 'competitor' | 'category';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface ReportCustomization {
  includeSections: string[];
  excludeSections: string[];
  logoUrl?: string;
  branding: BrandingConfig;
  formatting: FormattingConfig;
}

export interface BrandingConfig {
  companyName: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
}

export interface FormattingConfig {
  dateFormat: string;
  numberFormat: string;
  timezone: string;
  language: string;
}

export interface GuardrailsConfig {
  ethicalChecks: EthicalCheckConfig;
  sourceValidation: SourceValidationConfig;
  contentFiltering: ContentFilteringConfig;
  complianceSettings: ComplianceConfig;
}

export interface EthicalCheckConfig {
  enabled: boolean;
  strictMode: boolean;
  prohibitedSources: string[];
  requiredEthicsApproval: boolean;
  auditTrail: boolean;
}

export interface SourceValidationConfig {
  requirePublicSources: boolean;
  blacklistedDomains: string[];
  minimumReliability: number;
  crossReferenceRequired: boolean;
  verificationTimeout: number;
}

export interface ContentFilteringConfig {
  markSpeculation: boolean;
  filterLowConfidence: boolean;
  requireEvidence: boolean;
  sensitiveContentHandling: 'block' | 'flag' | 'allow';
}

export interface ComplianceConfig {
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  dataRetentionLimits: boolean;
  auditLogging: boolean;
  consentRequired: boolean;
}

export interface PerformanceSettings {
  maxConcurrentCollectors: number;
  requestTimeout: number;
  retryAttempts: number;
  cacheDuration: number;
  resourceLimits: ResourceLimits;
}

export interface ResourceLimits {
  maxMemoryMB: number;
  maxCpuPercent: number;
  maxStorageGB: number;
  maxNetworkMbps: number;
}

// Validation and results
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning' | 'info';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

// Utility types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeFrame {
  duration: number;
  unit: 'hours' | 'days' | 'weeks' | 'months' | 'years';
}

// Event and notification types
export interface AlertEvent {
  id: string;
  type: AlertType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  competitorId?: string;
  signalId?: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
}

export type AlertType =
  | 'new_competitor'
  | 'critical_signal'
  | 'pricing_change'
  | 'product_launch'
  | 'system_error'
  | 'data_quality_issue'
  | 'compliance_violation';

export interface NotificationConfig {
  channels: NotificationChannel[];
  rules: NotificationRule[];
  templates: NotificationTemplate[];
}

export interface NotificationChannel {
  id: string;
  type: 'email' | 'slack' | 'webhook' | 'sms';
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface NotificationRule {
  id: string;
  name: string;
  conditions: NotificationCondition[];
  actions: NotificationAction[];
  enabled: boolean;
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in';
  value: unknown;
}

export interface NotificationAction {
  type: 'send_notification' | 'create_alert' | 'escalate' | 'log';
  channelId?: string;
  templateId?: string;
  parameters: Record<string, unknown>;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  type: 'email' | 'slack' | 'webhook';
  subject: string;
  body: string;
  variables: string[];
}