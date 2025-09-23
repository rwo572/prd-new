import {
  ReportGenerator,
  CompetitorProfile,
  MarketLandscape,
  ThreatAssessment,
  MonthlyReport,
  Report,
  ReportType,
  ReportFormat,
  ProcessedSignal,
  CompetitorTarget,
  KeyFinding,
  StrategicRecommendation,
  CompetitorUpdate,
  MarketAnalysis,
  TimeFrame,
  DateRange,
  ExecutiveSummary,
  ReportAppendix,
  DataQualityReport
} from '../types/index.js';

export class CompetitiveReportGenerator implements ReportGenerator {
  private signals: ProcessedSignal[] = [];
  private competitors: Map<string, CompetitorTarget> = new Map();

  constructor() {
    // Initialize with empty data - will be populated by monitoring pipeline
  }

  async generateCompetitorProfile(competitorId: string): Promise<CompetitorProfile> {
    const competitor = this.competitors.get(competitorId);
    if (!competitor) {
      throw new Error(`Competitor ${competitorId} not found`);
    }

    const competitorSignals = this.signals.filter(s => s.metadata.entities?.some(e =>
      e.type === 'organization' && this.normalizeCompanyName(e.name) === competitorId
    ));

    // Analyze recent activity
    const recentActivity = this.analyzeRecentActivity(competitorSignals);

    // Assess competitive positioning
    const positioning = this.assessCompetitivePositioning(competitor, competitorSignals);

    // Extract key capabilities and focus areas
    const capabilities = this.extractCapabilities(competitorSignals);

    // Identify strategic moves
    const strategicMoves = this.identifyStrategicMoves(competitorSignals);

    const profile: CompetitorProfile = {
      competitorId,
      name: competitor.name,
      domain: competitor.domain,
      category: competitor.categories[0]?.type || 'unknown',
      lastUpdated: new Date(),

      overview: {
        description: this.generateCompetitorDescription(competitor, competitorSignals),
        marketPosition: positioning.position,
        primaryFocus: capabilities.primary,
        recentActivity: recentActivity.summary
      },

      businessMetrics: {
        estimatedRevenue: this.estimateRevenue(competitorSignals),
        teamSize: this.estimateTeamSize(competitorSignals),
        fundingStage: this.determineFundingStage(competitorSignals),
        marketShare: competitor.categories[0]?.marketShare
      },

      productPortfolio: this.analyzeProductPortfolio(competitorSignals),

      strategicInitiatives: strategicMoves,

      strengths: positioning.strengths,
      weaknesses: positioning.weaknesses,

      recentMoves: strategicMoves.slice(0, 5), // Latest 5 moves

      threatLevel: this.assessThreatLevel(competitor, competitorSignals),

      keyPersonnel: this.extractKeyPersonnel(competitorSignals),

      technologyStack: this.analyzeTechnologyStack(competitorSignals),

      partnerships: this.extractPartnerships(competitorSignals),

      insights: this.generateCompetitorInsights(competitor, competitorSignals),

      recommendations: this.generateCompetitorRecommendations(competitor, competitorSignals)
    };

    return profile;
  }

  async generateMarketLandscape(segment: string): Promise<MarketLandscape> {
    const segmentSignals = this.signals.filter(s =>
      s.impact.affectedSegments.includes(segment) ||
      s.metadata.topics.includes(segment)
    );

    const competitorsInSegment = Array.from(this.competitors.values())
      .filter(c => c.categories.some(cat => cat.productSegment === segment));

    return {
      segment,
      generatedAt: new Date(),

      marketSize: this.estimateMarketSize(segment, segmentSignals),
      growthRate: this.calculateGrowthRate(segment, segmentSignals),

      competitors: competitorsInSegment.map(c => ({
        competitorId: c.id,
        name: c.name,
        marketShare: c.categories.find(cat => cat.productSegment === segment)?.marketShare || 0,
        position: this.determineMarketPosition(c, segmentSignals),
        strengths: this.extractCompetitorStrengths(c.id, segmentSignals),
        weaknesses: this.extractCompetitorWeaknesses(c.id, segmentSignals),
        recentMoves: this.getRecentMoves(c.id, segmentSignals)
      })),

      trends: this.identifyMarketTrends(segment, segmentSignals),

      emergingPlayers: this.identifyEmergingPlayers(segment, segmentSignals),

      marketForces: this.analyzeMarketForces(segment, segmentSignals),

      opportunities: this.identifyMarketOpportunities(segment, segmentSignals),

      threats: this.identifyMarketThreats(segment, segmentSignals),

      predictions: this.generateMarketPredictions(segment, segmentSignals)
    };
  }

  async generateThreatAssessment(timeframe: TimeFrame): Promise<ThreatAssessment> {
    const timeframePeriod = this.convertTimeFrameToDate(timeframe);
    const relevantSignals = this.signals.filter(s =>
      s.timestamp >= timeframePeriod.start &&
      (s.impact.strategic === 'high' || s.impact.strategic === 'critical')
    );

    return {
      assessmentPeriod: timeframePeriod,
      generatedAt: new Date(),

      overallThreatLevel: this.calculateOverallThreatLevel(relevantSignals),

      immediateThreats: this.identifyImmediateThreats(relevantSignals),

      emergingThreats: this.identifyEmergingThreats(relevantSignals),

      competitorThreats: this.analyzeCompetitorThreats(relevantSignals),

      marketDisruptions: this.identifyMarketDisruptions(relevantSignals),

      technologyThreats: this.analyzeTechnologyThreats(relevantSignals),

      mitigationStrategies: this.generateMitigationStrategies(relevantSignals),

      monitoringRecommendations: this.generateMonitoringRecommendations(relevantSignals)
    };
  }

  async generateMonthlyReport(month: Date): Promise<MonthlyReport> {
    const period = this.getMonthPeriod(month);
    const monthlySignals = this.signals.filter(s =>
      s.timestamp >= period.start && s.timestamp <= period.end
    );

    const keyFindings = await this.generateKeyFindings(monthlySignals);
    const competitorUpdates = await this.generateCompetitorUpdates(monthlySignals);
    const marketAnalysis = await this.generateMarketAnalysis(monthlySignals);
    const recommendations = await this.generateStrategicRecommendations(monthlySignals);

    return {
      id: `monthly_${month.getFullYear()}_${month.getMonth() + 1}`,
      period,

      summary: await this.generateExecutiveSummary(
        monthlySignals,
        keyFindings,
        competitorUpdates,
        recommendations
      ),

      keyFindings,
      competitorUpdates,
      marketTrends: this.extractMarketTrends(monthlySignals),
      strategicRecommendations: recommendations,

      dataQuality: this.assessDataQuality(monthlySignals),

      appendix: {
        methodology: this.getMethodologyDescription(),
        dataSources: this.getDataSources(),
        limitations: this.getAnalysisLimitations(),
        glossary: this.getGlossary(),
        rawData: this.shouldIncludeRawData() ? monthlySignals : undefined
      }
    };
  }

  async generateReport(analysis: IntelligenceAnalysis, format: ReportFormat): Promise<Report> {
    const reportContent = await this.buildReportContent(analysis);

    return {
      id: `report_${Date.now()}`,
      type: 'ad_hoc',
      format,
      generatedAt: new Date(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      },
      content: reportContent,
      metadata: {
        author: 'Competitive Intelligence Agent',
        version: '1.0.0',
        confidenceLevel: this.calculateOverallConfidence(analysis),
        dataQuality: this.assessAnalysisDataQuality(analysis),
        processingTime: 0, // Will be set by caller
        sourcesCovered: this.countUniqueSources(analysis)
      }
    };
  }

  // Helper methods for analysis and data processing

  private analyzeRecentActivity(signals: ProcessedSignal[]): { summary: string; activities: string[] } {
    const recent = signals
      .filter(s => Date.now() - s.timestamp.getTime() < 30 * 24 * 60 * 60 * 1000) // Last 30 days
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    const activities = recent.slice(0, 5).map(s => s.title);

    return {
      summary: `${recent.length} activities in the last 30 days`,
      activities
    };
  }

  private assessCompetitivePositioning(
    competitor: CompetitorTarget,
    signals: ProcessedSignal[]
  ): { position: string; strengths: string[]; weaknesses: string[] } {
    // Analyze signals to determine competitive position
    const productSignals = signals.filter(s => s.type === 'product_launch' || s.type === 'feature_update');
    const hiringSignals = signals.filter(s => s.type === 'hiring_signal');
    const fundingSignals = signals.filter(s => s.type === 'funding');

    let position = 'follower';
    if (productSignals.length > 10 && hiringSignals.length > 20) {
      position = 'leader';
    } else if (productSignals.length > 5 || fundingSignals.length > 0) {
      position = 'challenger';
    }

    const strengths = this.extractStrengthsFromSignals(signals);
    const weaknesses = this.extractWeaknessesFromSignals(signals);

    return { position, strengths, weaknesses };
  }

  private extractCapabilities(signals: ProcessedSignal[]): { primary: string[]; emerging: string[] } {
    const capabilities = new Map<string, number>();

    signals.forEach(signal => {
      signal.metadata.keywords.forEach(keyword => {
        capabilities.set(keyword, (capabilities.get(keyword) || 0) + 1);
      });
    });

    const sorted = Array.from(capabilities.entries())
      .sort((a, b) => b[1] - a[1]);

    return {
      primary: sorted.slice(0, 5).map(([capability]) => capability),
      emerging: sorted.slice(5, 10).map(([capability]) => capability)
    };
  }

  private identifyStrategicMoves(signals: ProcessedSignal[]): StrategicMove[] {
    return signals
      .filter(s =>
        s.impact.strategic === 'high' ||
        s.impact.strategic === 'critical' ||
        s.type === 'product_launch' ||
        s.type === 'partnership'
      )
      .map(signal => ({
        type: signal.type,
        description: signal.description,
        date: signal.timestamp,
        impact: signal.impact.strategic,
        implications: signal.impact.responseRecommendation
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  private generateKeyFindings(signals: ProcessedSignal[]): Promise<KeyFinding[]> {
    const findings: KeyFinding[] = [];

    // Group signals by type and analyze patterns
    const signalsByType = this.groupSignalsByType(signals);

    Object.entries(signalsByType).forEach(([type, typeSignals]) => {
      if (typeSignals.length >= 3) { // Significant pattern
        findings.push({
          id: `finding_${type}_${Date.now()}`,
          title: `Increased ${type.replace('_', ' ')} Activity`,
          description: `Observed ${typeSignals.length} ${type} signals, indicating heightened activity in this area`,
          category: this.mapSignalTypeToFindingCategory(type as any),
          impact: this.assessFindingImpact(typeSignals),
          urgency: this.assessFindingUrgency(typeSignals),
          evidence: typeSignals.slice(0, 3).map(s => this.signalToEvidence(s)),
          recommendedActions: this.generateRecommendedActions(type as any, typeSignals),
          confidence: this.calculateFindingConfidence(typeSignals)
        });
      }
    });

    return Promise.resolve(findings);
  }

  private generateCompetitorUpdates(signals: ProcessedSignal[]): Promise<CompetitorUpdate[]> {
    const updatesByCompetitor = new Map<string, ProcessedSignal[]>();

    signals.forEach(signal => {
      signal.metadata.entities?.forEach(entity => {
        if (entity.type === 'organization') {
          const competitorId = this.normalizeCompanyName(entity.name);
          if (!updatesByCompetitor.has(competitorId)) {
            updatesByCompetitor.set(competitorId, []);
          }
          updatesByCompetitor.get(competitorId)!.push(signal);
        }
      });
    });

    const updates: CompetitorUpdate[] = [];

    updatesByCompetitor.forEach((competitorSignals, competitorId) => {
      const competitor = this.competitors.get(competitorId);
      if (competitor && competitorSignals.length > 0) {
        updates.push({
          competitorId,
          competitorName: competitor.name,
          updates: competitorSignals.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()),
          summary: this.generateCompetitorUpdateSummary(competitorSignals),
          significance: this.assessUpdateSignificance(competitorSignals),
          analysisNotes: this.generateAnalysisNotes(competitorSignals)
        });
      }
    });

    return Promise.resolve(updates);
  }

  private generateMarketAnalysis(signals: ProcessedSignal[]): Promise<MarketAnalysis> {
    const analysis: MarketAnalysis = {
      segment: 'overall',
      trends: this.identifyTrends(signals),
      competitiveDynamics: this.analyzeCompetitiveDynamics(signals),
      emergingThreats: this.identifyThreats(signals),
      marketOpportunities: this.identifyOpportunities(signals)
    };

    return Promise.resolve(analysis);
  }

  private generateStrategicRecommendations(signals: ProcessedSignal[]): Promise<StrategicRecommendation[]> {
    const recommendations: StrategicRecommendation[] = [];

    // Analyze patterns and generate recommendations
    const highImpactSignals = signals.filter(s =>
      s.impact.strategic === 'high' || s.impact.strategic === 'critical'
    );

    if (highImpactSignals.length > 5) {
      recommendations.push({
        id: `rec_monitor_${Date.now()}`,
        type: 'monitoring',
        priority: 'high',
        recommendation: 'Increase monitoring frequency for high-impact competitors',
        rationale: `${highImpactSignals.length} high-impact signals detected this period`,
        timeframe: { duration: 2, unit: 'weeks' },
        resources: ['Monitoring team', 'Additional data sources'],
        expectedOutcome: 'Earlier detection of competitive threats',
        risks: ['Resource allocation', 'False positives']
      });
    }

    // Add more recommendation logic based on signal patterns
    return Promise.resolve(recommendations);
  }

  private generateExecutiveSummary(
    signals: ProcessedSignal[],
    findings: KeyFinding[],
    updates: CompetitorUpdate[],
    recommendations: StrategicRecommendation[]
  ): Promise<ExecutiveSummary> {
    const criticalFindings = findings.filter(f => f.impact === 'critical' || f.impact === 'high');
    const activeCompetitors = updates.length;
    const highPriorityRecs = recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');

    const summary: ExecutiveSummary = {
      totalSignals: signals.length,
      criticalFindings: criticalFindings.length,
      activeCompetitors,
      keyInsights: [
        `Monitored ${activeCompetitors} active competitors with ${signals.length} total signals`,
        `Identified ${criticalFindings.length} critical findings requiring attention`,
        `Generated ${highPriorityRecs.length} high-priority strategic recommendations`
      ],
      topThreats: criticalFindings.slice(0, 3).map(f => f.title),
      recommendations: highPriorityRecs.slice(0, 3).map(r => r.recommendation)
    };

    return Promise.resolve(summary);
  }

  // Utility methods

  private normalizeCompanyName(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_');
  }

  private groupSignalsByType(signals: ProcessedSignal[]): Record<string, ProcessedSignal[]> {
    return signals.reduce((groups, signal) => {
      const type = signal.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(signal);
      return groups;
    }, {} as Record<string, ProcessedSignal[]>);
  }

  private mapSignalTypeToFindingCategory(type: any): any {
    const mapping = {
      'product_launch': 'product_innovation',
      'feature_update': 'product_innovation',
      'pricing_change': 'pricing_strategy',
      'hiring_signal': 'market_expansion',
      'partnership': 'partnership',
      'funding': 'market_expansion'
    };

    return mapping[type] || 'competitive_threat';
  }

  private signalToEvidence(signal: ProcessedSignal): Evidence {
    return {
      type: 'primary_source',
      source: signal.metadata.sources?.[0]?.name || 'Unknown',
      date: signal.timestamp,
      reliability: signal.verification.confidenceLevel,
      description: signal.description.substring(0, 200),
      url: signal.metadata.sources?.[0]?.url
    };
  }

  private convertTimeFrameToDate(timeframe: TimeFrame): DateRange {
    const now = new Date();
    let duration = timeframe.duration;

    switch (timeframe.unit) {
      case 'hours':
        duration *= 60 * 60 * 1000;
        break;
      case 'days':
        duration *= 24 * 60 * 60 * 1000;
        break;
      case 'weeks':
        duration *= 7 * 24 * 60 * 60 * 1000;
        break;
      case 'months':
        duration *= 30 * 24 * 60 * 60 * 1000;
        break;
      case 'years':
        duration *= 365 * 24 * 60 * 60 * 1000;
        break;
    }

    return {
      start: new Date(now.getTime() - duration),
      end: now
    };
  }

  // Data management methods

  addSignals(signals: ProcessedSignal[]): void {
    this.signals.push(...signals);
    // Keep only recent signals to manage memory
    const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days
    this.signals = this.signals.filter(s => s.timestamp.getTime() > cutoff);
  }

  addCompetitor(competitor: CompetitorTarget): void {
    this.competitors.set(competitor.id, competitor);
  }

  getSignalCount(): number {
    return this.signals.length;
  }

  getCompetitorCount(): number {
    return this.competitors.size;
  }
}

// Supporting types and interfaces
interface CompetitorProfile {
  competitorId: string;
  name: string;
  domain: string;
  category: string;
  lastUpdated: Date;
  overview: {
    description: string;
    marketPosition: string;
    primaryFocus: string[];
    recentActivity: string;
  };
  businessMetrics: {
    estimatedRevenue?: number;
    teamSize?: number;
    fundingStage?: string;
    marketShare?: number;
  };
  productPortfolio: any;
  strategicInitiatives: StrategicMove[];
  strengths: string[];
  weaknesses: string[];
  recentMoves: StrategicMove[];
  threatLevel: number;
  keyPersonnel: any[];
  technologyStack: any;
  partnerships: any[];
  insights: string[];
  recommendations: string[];
}

interface StrategicMove {
  type: string;
  description: string;
  date: Date;
  impact: string;
  implications: string;
}

interface ExecutiveSummary {
  totalSignals: number;
  criticalFindings: number;
  activeCompetitors: number;
  keyInsights: string[];
  topThreats: string[];
  recommendations: string[];
}

// Placeholder implementations for missing methods
// These would be fully implemented based on specific business logic

export class ReportFormatter {
  static async formatAsMarkdown(report: Report): Promise<string> {
    // Implementation for markdown formatting
    return `# ${report.type.toUpperCase()} Report\n\nGenerated: ${report.generatedAt.toISOString()}\n\n## Executive Summary\n\n${JSON.stringify(report.content.executiveSummary, null, 2)}`;
  }

  static async formatAsJSON(report: Report): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  static async formatAsHTML(report: Report): Promise<string> {
    // Implementation for HTML formatting
    return `<html><head><title>${report.type} Report</title></head><body><h1>${report.type.toUpperCase()} Report</h1><pre>${JSON.stringify(report, null, 2)}</pre></body></html>`;
  }
}