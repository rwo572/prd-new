import { CompetitiveIntelligenceAgent, AgentConfig, CompetitorTarget, TimeFrame, MonitoringSession, MonitoringData, IntelligenceReport, IntelligenceAnalysis, Report, ReportFormat, DataSource, ValidationResult } from '../types/index.js';
import { CompetitiveMonitoringPipeline } from '../pipelines/monitoring-pipeline.js';
import { CompetitiveReportGenerator } from '../services/reporting.js';
import { CompetitiveFactVerifier } from '../services/fact-verification.js';
import { EthicalGuardrailsService } from '../services/ethical-guardrails.js';
import { CollectorFactory } from '../services/data-collectors.js';

export class CompetitiveIntelligenceAgentImpl implements CompetitiveIntelligenceAgent {
  public readonly id = 'competitive-intelligence-monitor';
  public readonly name = 'Competitive Intelligence Monitor';
  public readonly category = 'AI-Native';
  public readonly version = '1.0.0';

  private pipeline: CompetitiveMonitoringPipeline;
  private reportGenerator: CompetitiveReportGenerator;
  private factVerifier: CompetitiveFactVerifier;
  private guardrails: EthicalGuardrailsService;
  private config?: AgentConfig;
  private activeSessions: Map<string, MonitoringSession> = new Map();

  constructor() {
    this.reportGenerator = new CompetitiveReportGenerator();
    this.factVerifier = new CompetitiveFactVerifier();

    // Initialize with default guardrails
    this.guardrails = new EthicalGuardrailsService({
      ethicalChecks: {
        enabled: true,
        strictMode: true,
        prohibitedSources: ['private_communications', 'leaked_data'],
        requiredEthicsApproval: false,
        auditTrail: true
      },
      sourceValidation: {
        requirePublicSources: true,
        blacklistedDomains: [],
        minimumReliability: 0.5,
        crossReferenceRequired: false,
        verificationTimeout: 30000
      },
      contentFiltering: {
        markSpeculation: true,
        filterLowConfidence: true,
        requireEvidence: true,
        sensitiveContentHandling: 'flag'
      },
      complianceSettings: {
        gdprCompliant: true,
        ccpaCompliant: true,
        dataRetentionLimits: true,
        auditLogging: true,
        consentRequired: false
      }
    });

    this.pipeline = new CompetitiveMonitoringPipeline(
      {} as any, // DataProcessor
      {} as any, // SignalAnalyzer
      this.factVerifier,
      {} as any, // IntelligenceStorage
      {} as any  // AlertingService
    );
  }

  async configure(config: AgentConfig): Promise<void> {
    this.config = config;

    // Update guardrails configuration
    if (config.guardrailsConfig) {
      this.guardrails.updateConfig(config.guardrailsConfig);
    }

    console.log('Competitive Intelligence Agent configured successfully');
  }

  async monitor(targets: CompetitorTarget[], timeframe: TimeFrame): Promise<MonitoringSession> {
    if (!this.config) {
      throw new Error('Agent must be configured before monitoring');
    }

    const sessionId = `session_${Date.now()}`;
    const session: MonitoringSession = {
      id: sessionId,
      targets,
      startTime: new Date(),
      status: 'active',
      signalsCollected: 0,
      lastUpdate: new Date()
    };

    this.activeSessions.set(sessionId, session);

    try {
      // Set up collectors for each target
      for (const target of targets) {
        await this.setupCollectorsForTarget(target);
      }

      // Start the monitoring pipeline
      await this.pipeline.start();

      console.log(`Started monitoring session ${sessionId} for ${targets.length} competitors`);
      return session;

    } catch (error) {
      session.status = 'failed';
      this.activeSessions.set(sessionId, session);
      throw error;
    }
  }

  async analyze(data: MonitoringData): Promise<IntelligenceReport> {
    // Validate data through ethical guardrails
    const validation = await this.guardrails.validateDataCollection(data.source, data);
    if (!validation.isValid) {
      throw new Error(`Data validation failed: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    // Process through fact verification
    const verificationResult = await this.factVerifier.verifySignal(data.processed);
    data.processed.verification = verificationResult;

    // Generate intelligence report
    const report: IntelligenceReport = {
      id: `report_${Date.now()}`,
      sessionId: 'current',
      generatedAt: new Date(),
      summary: this.generateSummary(data),
      keyFindings: await this.extractKeyFindings(data),
      signals: [data.processed],
      recommendations: this.generateRecommendations(data),
      confidence: data.confidence * verificationResult.confidenceLevel
    };

    return report;
  }

  async generateReport(analysis: IntelligenceAnalysis, format: ReportFormat): Promise<Report> {
    return await this.reportGenerator.generateReport(analysis, format);
  }

  async validateSources(sources: DataSource[]): Promise<ValidationResult> {
    const allErrors: any[] = [];
    const allWarnings: any[] = [];

    for (const source of sources) {
      const validation = await this.guardrails.validateSource(source);
      allErrors.push(...validation.errors);
      allWarnings.push(...validation.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      recommendations: this.generateSourceRecommendations(allErrors, allWarnings)
    };
  }

  // Public utility methods
  async getActiveMonitoringSessions(): Promise<MonitoringSession[]> {
    return Array.from(this.activeSessions.values());
  }

  async stopMonitoringSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.endTime = new Date();
      this.activeSessions.set(sessionId, session);
    }

    if (this.activeSessions.size === 0) {
      await this.pipeline.stop();
    }
  }

  async getComplianceMetrics() {
    return this.guardrails.getComplianceMetrics();
  }

  // Private helper methods
  private async setupCollectorsForTarget(target: CompetitorTarget): Promise<void> {
    // Set up RSS collector if competitor has a blog
    const blogUrl = `https://${target.domain}/blog/feed.xml`;
    const rssCollector = CollectorFactory.createRSSCollector(target, blogUrl);
    this.pipeline.addCollector(rssCollector);

    // Set up web scraping for pricing page
    const pricingUrl = `https://${target.domain}/pricing`;
    const scrapingCollector = CollectorFactory.createWebScrapingCollector(
      target,
      pricingUrl,
      {
        title: 'h1, .page-title',
        content: '.pricing-content, .pricing-plans',
        pricing: '.price, .cost, [data-price]'
      }
    );
    this.pipeline.addCollector(scrapingCollector);

    // Set up job board monitoring
    const jobBoards = [
      {
        name: 'LinkedIn Jobs',
        baseUrl: 'https://linkedin.com',
        searchUrl: `https://linkedin.com/jobs/search?keywords=${encodeURIComponent(target.name)}&location=&trk=public_jobs_jobs-search-bar_search-submit`,
        selectors: {
          jobItems: '.job-search-card',
          title: '.base-search-card__title',
          company: '.base-search-card__subtitle',
          location: '.job-search-card__location',
          description: '.base-search-card__metadata',
          date: '.job-search-card__listdate',
          link: 'a[href*="/jobs/view/"]'
        }
      }
    ];

    const jobCollector = CollectorFactory.createJobBoardCollector(target, jobBoards);
    this.pipeline.addCollector(jobCollector);
  }

  private generateSummary(data: MonitoringData): string {
    return `${data.processed.type} signal detected for ${data.competitorId}: ${data.processed.title}`;
  }

  private async extractKeyFindings(data: MonitoringData): Promise<any[]> {
    const findings = [];

    if (data.processed.impact.strategic === 'critical' || data.processed.impact.strategic === 'high') {
      findings.push({
        id: `finding_${Date.now()}`,
        title: `High-impact ${data.processed.type}`,
        description: data.processed.description,
        category: data.processed.category,
        impact: data.processed.impact.strategic,
        urgency: data.processed.impact.timeframe === 'immediate' ? 'high' : 'medium',
        evidence: [data.processed.title],
        recommendedActions: [data.processed.impact.responseRecommendation],
        confidence: data.confidence
      });
    }

    return findings;
  }

  private generateRecommendations(data: MonitoringData): string[] {
    const recommendations = [];

    if (data.processed.impact.strategic === 'critical') {
      recommendations.push('Immediate strategic review required');
    }

    if (data.processed.verification.evidenceLevel === 'confirmed') {
      recommendations.push('Monitor for follow-up developments');
    } else {
      recommendations.push('Seek additional verification from alternative sources');
    }

    return recommendations;
  }

  private generateSourceRecommendations(errors: any[], warnings: any[]): string[] {
    const recommendations = [];

    if (errors.some((e: any) => e.code.startsWith('ETHICAL_'))) {
      recommendations.push('Review and update data collection practices to ensure ethical compliance');
    }

    if (warnings.some((w: any) => w.field.includes('reliability'))) {
      recommendations.push('Consider supplementing with higher-reliability sources');
    }

    return recommendations;
  }
}

export default CompetitiveIntelligenceAgentImpl;