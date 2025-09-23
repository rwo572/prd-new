import {
  MonitoringPipeline,
  DataCollector,
  DataProcessor,
  SignalAnalyzer,
  FactVerifier,
  IntelligenceStorage,
  AlertingService,
  MonitoringData,
  ProcessedSignal,
  DataSource,
  RawData,
  CronSchedule,
  Anomaly,
  PrioritizedSignal,
  VerificationResult
} from '../types/index.js';

export class CompetitiveMonitoringPipeline implements MonitoringPipeline {
  public collectors: DataCollector[] = [];
  public processor: DataProcessor;
  public analyzer: SignalAnalyzer;
  public verifier: FactVerifier;
  public storage: IntelligenceStorage;
  public alerting: AlertingService;

  private isRunning = false;
  private processingQueue: MonitoringData[] = [];

  constructor(
    processor: DataProcessor,
    analyzer: SignalAnalyzer,
    verifier: FactVerifier,
    storage: IntelligenceStorage,
    alerting: AlertingService
  ) {
    this.processor = processor;
    this.analyzer = analyzer;
    this.verifier = verifier;
    this.storage = storage;
    this.alerting = alerting;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Pipeline is already running');
    }

    console.log('Starting competitive intelligence monitoring pipeline...');
    this.isRunning = true;

    // Start all collectors
    await Promise.all(this.collectors.map(collector => collector.start()));

    // Start processing loop
    this.startProcessingLoop();

    console.log(`Pipeline started with ${this.collectors.length} collectors`);
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping competitive intelligence monitoring pipeline...');
    this.isRunning = false;

    // Stop all collectors
    await Promise.all(this.collectors.map(collector => collector.stop()));

    // Process remaining items in queue
    await this.processQueue();

    console.log('Pipeline stopped');
  }

  addCollector(collector: DataCollector): void {
    this.collectors.push(collector);

    // Set up event handlers
    collector.onData((data) => this.enqueueData(data));
    collector.onError((error) => this.handleCollectorError(collector, error));
  }

  removeCollector(collectorId: string): void {
    const index = this.collectors.findIndex(c => c.id === collectorId);
    if (index !== -1) {
      this.collectors[index].stop();
      this.collectors.splice(index, 1);
    }
  }

  private async startProcessingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        await this.processQueue();
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second interval
      } catch (error) {
        console.error('Error in processing loop:', error);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay on error
      }
    }
  }

  private async processQueue(): Promise<void> {
    const batchSize = 10;
    const batch = this.processingQueue.splice(0, batchSize);

    if (batch.length === 0) {
      return;
    }

    console.log(`Processing batch of ${batch.length} monitoring data items`);

    await Promise.all(batch.map(data => this.processData(data)));
  }

  private async processData(data: MonitoringData): Promise<void> {
    try {
      // Step 1: Basic processing and validation
      const processedData = await this.processor.process(data);

      // Step 2: Signal analysis
      const signal = await this.analyzer.analyzeSignal(processedData);

      // Step 3: Fact verification
      const verification = await this.verifier.verifySignal(signal);

      // Step 4: Update signal with verification results
      signal.verification = verification;

      // Step 5: Store the processed signal
      await this.storage.storeSignal(signal);

      // Step 6: Check for alerts
      await this.checkForAlerts(signal);

      console.log(`Successfully processed signal: ${signal.title}`);

    } catch (error) {
      console.error(`Error processing data ${data.id}:`, error);
      await this.handleProcessingError(data, error);
    }
  }

  private enqueueData(data: MonitoringData): void {
    this.processingQueue.push(data);
    console.log(`Enqueued data item ${data.id}, queue size: ${this.processingQueue.length}`);
  }

  private async checkForAlerts(signal: ProcessedSignal): Promise<void> {
    const shouldAlert = this.shouldTriggerAlert(signal);

    if (shouldAlert) {
      await this.alerting.sendAlert({
        type: 'new_signal',
        signal,
        timestamp: new Date(),
        urgency: signal.impact.strategic === 'critical' ? 'high' : 'medium'
      });
    }
  }

  private shouldTriggerAlert(signal: ProcessedSignal): boolean {
    // High-impact signals
    if (signal.impact.strategic === 'critical' || signal.impact.strategic === 'high') {
      return true;
    }

    // Product launches or major updates
    if (signal.type === 'product_launch' || signal.type === 'pricing_change') {
      return true;
    }

    // High confidence signals with immediate timeframe
    if (signal.verification.confidenceLevel > 0.8 && signal.impact.timeframe === 'immediate') {
      return true;
    }

    return false;
  }

  private async handleCollectorError(collector: DataCollector, error: Error): Promise<void> {
    console.error(`Collector ${collector.id} error:`, error);

    await this.alerting.sendAlert({
      type: 'system_error',
      message: `Data collector ${collector.id} encountered an error: ${error.message}`,
      timestamp: new Date(),
      urgency: 'medium'
    });

    // Implement retry logic or collector restart if needed
    if (collector.canRestart()) {
      console.log(`Attempting to restart collector ${collector.id}`);
      await collector.restart();
    }
  }

  private async handleProcessingError(data: MonitoringData, error: Error): Promise<void> {
    console.error(`Processing error for data ${data.id}:`, error);

    // Store failed processing attempt
    await this.storage.storeProcessingError({
      dataId: data.id,
      error: error.message,
      timestamp: new Date(),
      retryable: this.isRetryableError(error)
    });

    // Send alert for critical processing failures
    if (this.isCriticalError(error)) {
      await this.alerting.sendAlert({
        type: 'processing_error',
        message: `Critical processing error: ${error.message}`,
        timestamp: new Date(),
        urgency: 'high'
      });
    }
  }

  private isRetryableError(error: Error): boolean {
    // Define which errors are retryable
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /rate limit/i,
      /temporary/i
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  private isCriticalError(error: Error): boolean {
    // Define which errors are critical
    const criticalPatterns = [
      /authentication/i,
      /authorization/i,
      /configuration/i,
      /database/i
    ];

    return criticalPatterns.some(pattern => pattern.test(error.message));
  }

  async getMetrics(): Promise<PipelineMetrics> {
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    return {
      collectorsActive: this.collectors.filter(c => c.isActive()).length,
      collectorsTotal: this.collectors.length,
      queueSize: this.processingQueue.length,
      signalsProcessedLastHour: await this.storage.getSignalCount(hourAgo, now),
      averageProcessingTime: await this.storage.getAverageProcessingTime(hourAgo, now),
      errorRate: await this.storage.getErrorRate(hourAgo, now),
      isRunning: this.isRunning
    };
  }
}

export interface PipelineMetrics {
  collectorsActive: number;
  collectorsTotal: number;
  queueSize: number;
  signalsProcessedLastHour: number;
  averageProcessingTime: number;
  errorRate: number;
  isRunning: boolean;
}

export class BaseDataCollector implements DataCollector {
  public id: string;
  public source: DataSource;
  public schedule: CronSchedule;

  private active = false;
  private dataHandler?: (data: MonitoringData) => void;
  private errorHandler?: (error: Error) => void;
  private intervalId?: NodeJS.Timeout;

  constructor(id: string, source: DataSource, schedule: CronSchedule) {
    this.id = id;
    this.source = source;
    this.schedule = schedule;
  }

  async start(): Promise<void> {
    if (this.active) {
      return;
    }

    console.log(`Starting data collector ${this.id}`);
    this.active = true;

    // Set up scheduled collection
    this.scheduleCollection();
  }

  async stop(): Promise<void> {
    if (!this.active) {
      return;
    }

    console.log(`Stopping data collector ${this.id}`);
    this.active = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  async restart(): Promise<void> {
    await this.stop();
    await this.start();
  }

  canRestart(): boolean {
    return true;
  }

  isActive(): boolean {
    return this.active;
  }

  onData(handler: (data: MonitoringData) => void): void {
    this.dataHandler = handler;
  }

  onError(handler: (error: Error) => void): void {
    this.errorHandler = handler;
  }

  async collect(): Promise<RawData[]> {
    throw new Error('collect() method must be implemented by subclass');
  }

  validate(data: RawData): boolean {
    // Basic validation - subclasses can override
    return data !== null && data !== undefined;
  }

  transform(data: RawData): MonitoringData {
    throw new Error('transform() method must be implemented by subclass');
  }

  private scheduleCollection(): void {
    // Convert cron schedule to interval (simplified implementation)
    const intervalMs = this.cronToInterval(this.schedule);

    this.intervalId = setInterval(async () => {
      if (!this.active) {
        return;
      }

      try {
        await this.performCollection();
      } catch (error) {
        this.handleError(error as Error);
      }
    }, intervalMs);

    // Perform initial collection
    this.performCollection().catch(error => this.handleError(error));
  }

  private async performCollection(): Promise<void> {
    try {
      console.log(`Collecting data from ${this.source.name}`);

      const rawData = await this.collect();

      for (const data of rawData) {
        if (this.validate(data)) {
          const monitoringData = this.transform(data);
          this.emitData(monitoringData);
        } else {
          console.warn(`Invalid data from ${this.source.name}:`, data);
        }
      }

      console.log(`Collected ${rawData.length} items from ${this.source.name}`);

    } catch (error) {
      this.handleError(error as Error);
    }
  }

  private emitData(data: MonitoringData): void {
    if (this.dataHandler) {
      this.dataHandler(data);
    }
  }

  private handleError(error: Error): void {
    console.error(`Error in collector ${this.id}:`, error);

    if (this.errorHandler) {
      this.errorHandler(error);
    }
  }

  private cronToInterval(schedule: CronSchedule): number {
    // Simplified cron to interval conversion
    // In a real implementation, you'd use a proper cron parser

    if (schedule.includes('* * * * *')) {
      return 60 * 1000; // Every minute
    } else if (schedule.includes('0 * * * *')) {
      return 60 * 60 * 1000; // Every hour
    } else if (schedule.includes('0 0 * * *')) {
      return 24 * 60 * 60 * 1000; // Every day
    }

    // Default to hourly
    return 60 * 60 * 1000;
  }
}

export class DefaultDataProcessor implements DataProcessor {
  async process(data: MonitoringData): Promise<MonitoringData> {
    // Basic data processing and enrichment
    const processed = { ...data };

    // Add processing timestamp
    processed.processed.metadata = {
      ...processed.processed.metadata,
      processedAt: new Date(),
      processingVersion: '1.0.0'
    };

    // Basic content cleaning
    if (typeof processed.rawData === 'string') {
      processed.rawData = this.cleanText(processed.rawData);
    }

    return processed;
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
      .trim();
  }
}

export class CompetitiveSignalAnalyzer implements SignalAnalyzer {
  async analyzeSignal(data: MonitoringData): Promise<ProcessedSignal> {
    const signal: ProcessedSignal = {
      type: this.detectSignalType(data),
      category: this.categorizeSignal(data),
      title: this.extractTitle(data),
      description: this.extractDescription(data),
      impact: await this.assessImpact(data),
      metadata: await this.extractMetadata(data),
      verification: {
        isVerified: false,
        sourceCount: 1,
        lastVerified: new Date(),
        verificationMethod: 'automatic',
        confidenceLevel: 0.5
      }
    };

    return signal;
  }

  async detectAnomalies(signals: ProcessedSignal[]): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];

    // Detect unusual patterns
    const recentSignals = signals.filter(s =>
      new Date().getTime() - new Date(s.metadata.processedAt || new Date()).getTime() < 24 * 60 * 60 * 1000
    );

    // Check for sudden spike in activity
    if (recentSignals.length > 10) {
      anomalies.push({
        type: 'activity_spike',
        description: `Unusual spike in signals: ${recentSignals.length} in last 24 hours`,
        severity: 'medium',
        signals: recentSignals.slice(0, 5)
      });
    }

    return anomalies;
  }

  async assessImpact(data: MonitoringData): Promise<ImpactAssessment> {
    // Default impact assessment logic
    return {
      strategic: 'medium',
      timeframe: 'medium_term',
      affectedSegments: ['general'],
      responseRecommendation: 'Monitor and analyze further'
    };
  }

  async prioritizeSignals(signals: ProcessedSignal[]): Promise<PrioritizedSignal[]> {
    return signals
      .map(signal => ({
        signal,
        priority: this.calculatePriority(signal)
      }))
      .sort((a, b) => b.priority - a.priority);
  }

  private detectSignalType(data: MonitoringData): SignalType {
    const content = String(data.rawData).toLowerCase();

    if (content.includes('launch') || content.includes('release')) {
      return 'product_launch';
    } else if (content.includes('price') || content.includes('pricing')) {
      return 'pricing_change';
    } else if (content.includes('patent') || content.includes('ip')) {
      return 'patent_filing';
    } else if (content.includes('hiring') || content.includes('job')) {
      return 'hiring_signal';
    }

    return 'market_move';
  }

  private categorizeSignal(data: MonitoringData): string {
    return data.channel.type;
  }

  private extractTitle(data: MonitoringData): string {
    // Extract or generate a meaningful title
    const content = String(data.rawData);
    const lines = content.split('\n');
    return lines[0]?.substring(0, 100) || 'Competitive Signal';
  }

  private extractDescription(data: MonitoringData): string {
    const content = String(data.rawData);
    return content.substring(0, 500);
  }

  private async extractMetadata(data: MonitoringData): Promise<SignalMetadata> {
    return {
      keywords: this.extractKeywords(String(data.rawData)),
      sentiment: 0, // Neutral
      entities: [],
      topics: [],
      language: 'en',
      readabilityScore: 0.5,
      processedAt: new Date()
    };
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const keywords = words.filter(word =>
      word.length > 3 &&
      !this.isStopWord(word)
    );

    return [...new Set(keywords)].slice(0, 10);
  }

  private isStopWord(word: string): boolean {
    const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    return stopWords.includes(word);
  }

  private calculatePriority(signal: ProcessedSignal): number {
    let priority = 0;

    // Impact weight
    switch (signal.impact.strategic) {
      case 'critical': priority += 100; break;
      case 'high': priority += 75; break;
      case 'medium': priority += 50; break;
      case 'low': priority += 25; break;
    }

    // Timeframe weight
    switch (signal.impact.timeframe) {
      case 'immediate': priority += 50; break;
      case 'short_term': priority += 30; break;
      case 'medium_term': priority += 20; break;
      case 'long_term': priority += 10; break;
    }

    // Verification confidence
    priority += signal.verification.confidenceLevel * 25;

    return priority;
  }
}

// Extend the types to include missing interfaces
interface PrioritizedSignal {
  signal: ProcessedSignal;
  priority: number;
}

interface Anomaly {
  type: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  signals: ProcessedSignal[];
}

interface DataProcessor {
  process(data: MonitoringData): Promise<MonitoringData>;
}

interface ProcessingError {
  dataId: string;
  error: string;
  timestamp: Date;
  retryable: boolean;
}

interface Alert {
  type: string;
  signal?: ProcessedSignal;
  message?: string;
  timestamp: Date;
  urgency: 'low' | 'medium' | 'high';
}

// Extend the SignalMetadata type
declare module '../types/index.js' {
  interface SignalMetadata {
    processedAt?: Date;
  }
}