import {
  FactVerifier,
  ProcessedSignal,
  VerificationResult,
  DataSource,
  CrossReference,
  CredibilityScore,
  SpeculationFlag,
  Evidence
} from '../types/index.js';

export class CompetitiveFactVerifier implements FactVerifier {
  private crossReferenceSources: DataSource[];
  private credibilityCache: Map<string, CredibilityScore> = new Map();
  private verificationHistory: Map<string, VerificationResult> = new Map();

  constructor(crossReferenceSources: DataSource[] = []) {
    this.crossReferenceSources = crossReferenceSources;
  }

  async verifySignal(signal: ProcessedSignal): Promise<VerificationResult> {
    console.log(`Verifying signal: ${signal.title}`);

    try {
      // Step 1: Check for obvious speculation markers
      const speculationFlags = await this.flagSpeculation(signal.description);

      // Step 2: Cross-reference with other sources
      const crossReferences = await this.crossReference(signal, this.crossReferenceSources);

      // Step 3: Assess source credibility
      const sourceCredibility = await this.assessCredibility(signal.metadata.sources?.[0]);

      // Step 4: Analyze evidence strength
      const evidenceLevel = this.analyzeEvidenceLevel(signal, crossReferences, speculationFlags);

      // Step 5: Calculate overall verification result
      const result: VerificationResult = {
        isFactual: this.determineFactualStatus(evidenceLevel, speculationFlags, sourceCredibility),
        evidenceLevel,
        supportingSources: crossReferences
          .filter(ref => ref.agreement > 0.7)
          .map(ref => ref.source),
        contradictingSources: crossReferences
          .filter(ref => ref.agreement < 0.3)
          .map(ref => ref.source),
        verificationNotes: this.generateVerificationNotes(
          evidenceLevel,
          speculationFlags,
          crossReferences,
          sourceCredibility
        ),
        lastVerified: new Date()
      };

      // Cache the result
      this.verificationHistory.set(signal.title, result);

      console.log(`Verification complete: ${evidenceLevel} confidence with ${crossReferences.length} cross-references`);

      return result;

    } catch (error) {
      console.error(`Error verifying signal ${signal.title}:`, error);

      // Return low-confidence result on error
      return {
        isFactual: false,
        evidenceLevel: 'unconfirmed',
        supportingSources: [],
        contradictingSources: [],
        verificationNotes: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastVerified: new Date()
      };
    }
  }

  async crossReference(signal: ProcessedSignal, sources: DataSource[]): Promise<CrossReference[]> {
    const crossReferences: CrossReference[] = [];

    for (const source of sources) {
      try {
        const reference = await this.checkSourceForSignal(signal, source);
        if (reference) {
          crossReferences.push(reference);
        }
      } catch (error) {
        console.warn(`Error cross-referencing with ${source.name}:`, error);
      }
    }

    return crossReferences;
  }

  async assessCredibility(source?: DataSource): Promise<CredibilityScore> {
    if (!source) {
      return {
        overall: 0.5,
        factual: 0.5,
        timeliness: 0.5,
        expertise: 0.5,
        bias: 0.5,
        factors: ['No source provided']
      };
    }

    // Check cache first
    const cached = this.credibilityCache.get(source.id);
    if (cached && this.isCacheValid(cached.lastUpdated)) {
      return cached;
    }

    const credibility = await this.calculateCredibility(source);
    this.credibilityCache.set(source.id, credibility);

    return credibility;
  }

  async flagSpeculation(content: string): Promise<SpeculationFlag[]> {
    const flags: SpeculationFlag[] = [];

    const speculationPatterns = [
      // Uncertainty indicators
      { pattern: /(?:might|may|could|possibly|potentially|likely|probably|perhaps|seems|appears)\s+(?:to\s+)?(?:be|have|indicate|suggest)/gi, reason: 'Uncertainty language detected' },

      // Future predictions without evidence
      { pattern: /(?:will|going to|planning|intends?|expects?)\s+(?:to\s+)?(?:launch|release|announce|implement)/gi, reason: 'Future prediction without evidence' },

      // Speculation markers
      { pattern: /(?:rumor|speculation|unconfirmed|alleged|supposedly|reportedly)/gi, reason: 'Explicit speculation marker' },

      // Weak evidence
      { pattern: /(?:sources? say|according to rumors|word is|it seems|word on the street)/gi, reason: 'Weak or anonymous sourcing' },

      // Opinion markers
      { pattern: /(?:i think|i believe|in my opinion|it appears that|it looks like)/gi, reason: 'Opinion rather than fact' },

      // Hedge words
      { pattern: /(?:somewhat|rather|quite|fairly|relatively|sort of|kind of)\s+(?:significant|important|large|small)/gi, reason: 'Hedging language' }
    ];

    for (const { pattern, reason } of speculationPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        flags.push({
          text: match[0],
          position: match.index,
          reason,
          confidence: 0.8,
          suggestedRevision: this.suggestFactualRevision(match[0])
        });
      }
    }

    return flags;
  }

  private async checkSourceForSignal(signal: ProcessedSignal, source: DataSource): Promise<CrossReference | null> {
    try {
      // Simulate cross-reference check (in real implementation, this would query the source)
      const searchTerms = [
        signal.title,
        ...signal.metadata.keywords.slice(0, 3)
      ];

      // Mock implementation - in reality, this would search the source
      const agreement = this.simulateSourceAgreement(signal, source);

      if (agreement > 0.1) { // Only return if there's some relevance
        return {
          source,
          agreement,
          conflictingInfo: agreement < 0.5 ? [`Different perspective on ${signal.category}`] : [],
          supportingInfo: agreement > 0.7 ? [`Confirms ${signal.type}`] : [],
          lastChecked: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error(`Error checking source ${source.name}:`, error);
      return null;
    }
  }

  private async calculateCredibility(source: DataSource): Promise<CredibilityScore> {
    const factors: string[] = [];
    let factual = 0.5;
    let timeliness = 0.5;
    let expertise = 0.5;
    let bias = 0.5;

    // Assess based on source type
    switch (source.type) {
      case 'rss':
        if (this.isKnownTechBlog(source.url)) {
          factual = 0.8;
          expertise = 0.9;
          factors.push('Established tech blog');
        } else {
          factual = 0.6;
          expertise = 0.6;
          factors.push('General RSS source');
        }
        break;

      case 'api':
        factual = 0.9;
        timeliness = 0.9;
        expertise = 0.8;
        factors.push('Official API source');
        break;

      case 'web_scraping':
        if (this.isOfficialSite(source.url)) {
          factual = 0.95;
          timeliness = 0.8;
          expertise = 1.0;
          factors.push('Official company website');
        } else {
          factual = 0.6;
          timeliness = 0.6;
          expertise = 0.5;
          factors.push('Third-party website');
        }
        break;

      case 'job_board':
        factual = 0.85;
        timeliness = 0.9;
        expertise = 0.7;
        bias = 0.8; // Job postings are generally factual
        factors.push('Job posting platform');
        break;

      case 'patent_db':
        factual = 0.95;
        timeliness = 0.7; // Patents can be delayed
        expertise = 0.9;
        bias = 0.9;
        factors.push('Official patent database');
        break;

      case 'social':
        factual = 0.3;
        timeliness = 0.9;
        expertise = 0.4;
        bias = 0.3;
        factors.push('Social media source - high speculation risk');
        break;

      default:
        factors.push('Unknown source type');
    }

    // Assess reliability score if available
    if (source.reliability) {
      factual = (factual + source.reliability) / 2;
      factors.push(`Historical reliability: ${(source.reliability * 100).toFixed(0)}%`);
    }

    // Check domain reputation
    const domainReputation = this.getDomainReputation(source.url);
    if (domainReputation > 0.7) {
      factual += 0.1;
      expertise += 0.1;
      factors.push('High-reputation domain');
    } else if (domainReputation < 0.3) {
      factual -= 0.1;
      bias -= 0.2;
      factors.push('Low-reputation domain');
    }

    const overall = (factual + timeliness + expertise + bias) / 4;

    return {
      overall: Math.min(1.0, Math.max(0.0, overall)),
      factual: Math.min(1.0, Math.max(0.0, factual)),
      timeliness: Math.min(1.0, Math.max(0.0, timeliness)),
      expertise: Math.min(1.0, Math.max(0.0, expertise)),
      bias: Math.min(1.0, Math.max(0.0, bias)),
      factors,
      lastUpdated: new Date()
    };
  }

  private analyzeEvidenceLevel(
    signal: ProcessedSignal,
    crossReferences: CrossReference[],
    speculationFlags: SpeculationFlag[]
  ): 'confirmed' | 'likely' | 'unconfirmed' | 'speculative' {
    // High speculation = speculative
    if (speculationFlags.length > 2) {
      return 'speculative';
    }

    // Multiple confirming sources = confirmed
    const confirmingSources = crossReferences.filter(ref => ref.agreement > 0.7).length;
    if (confirmingSources >= 2) {
      return 'confirmed';
    }

    // One good source or high signal confidence = likely
    if (confirmingSources === 1 || signal.verification.confidenceLevel > 0.8) {
      return 'likely';
    }

    // Some speculation but not excessive = unconfirmed
    if (speculationFlags.length > 0) {
      return 'unconfirmed';
    }

    // Default to unconfirmed for single-source signals
    return 'unconfirmed';
  }

  private determineFactualStatus(
    evidenceLevel: 'confirmed' | 'likely' | 'unconfirmed' | 'speculative',
    speculationFlags: SpeculationFlag[],
    sourceCredibility: CredibilityScore
  ): boolean {
    // Definitely not factual if highly speculative
    if (evidenceLevel === 'speculative' || speculationFlags.length > 3) {
      return false;
    }

    // Confirmed with good sources is factual
    if (evidenceLevel === 'confirmed' && sourceCredibility.overall > 0.7) {
      return true;
    }

    // Likely with very credible sources is factual
    if (evidenceLevel === 'likely' && sourceCredibility.overall > 0.8) {
      return true;
    }

    // Everything else requires human verification
    return false;
  }

  private generateVerificationNotes(
    evidenceLevel: 'confirmed' | 'likely' | 'unconfirmed' | 'speculative',
    speculationFlags: SpeculationFlag[],
    crossReferences: CrossReference[],
    sourceCredibility: CredibilityScore
  ): string {
    const notes: string[] = [];

    // Evidence level note
    switch (evidenceLevel) {
      case 'confirmed':
        notes.push('Multiple sources confirm this information');
        break;
      case 'likely':
        notes.push('Evidence suggests this is accurate');
        break;
      case 'unconfirmed':
        notes.push('Limited evidence available');
        break;
      case 'speculative':
        notes.push('Contains significant speculation');
        break;
    }

    // Source credibility note
    if (sourceCredibility.overall > 0.8) {
      notes.push('High-credibility source');
    } else if (sourceCredibility.overall < 0.4) {
      notes.push('Low-credibility source - verify independently');
    }

    // Speculation warnings
    if (speculationFlags.length > 0) {
      notes.push(`Contains ${speculationFlags.length} speculation indicator(s)`);
    }

    // Cross-reference summary
    const supporting = crossReferences.filter(ref => ref.agreement > 0.7).length;
    const contradicting = crossReferences.filter(ref => ref.agreement < 0.3).length;

    if (supporting > 0) {
      notes.push(`${supporting} source(s) support this information`);
    }
    if (contradicting > 0) {
      notes.push(`${contradicting} source(s) contradict this information`);
    }

    return notes.join('. ') + '.';
  }

  private suggestFactualRevision(speculativeText: string): string {
    const revisions: Record<string, string> = {
      'might be': 'appears to be (unconfirmed)',
      'will launch': 'announced plans to launch',
      'reportedly': 'according to [source]',
      'rumor has it': 'unconfirmed reports suggest',
      'likely to': 'may potentially',
      'planning to': 'has indicated plans to'
    };

    const lowerText = speculativeText.toLowerCase();
    for (const [speculative, factual] of Object.entries(revisions)) {
      if (lowerText.includes(speculative)) {
        return factual;
      }
    }

    return `[VERIFY] ${speculativeText}`;
  }

  private simulateSourceAgreement(signal: ProcessedSignal, source: DataSource): number {
    // Mock implementation - in reality, this would analyze content similarity
    const sourceTypeWeight = {
      'api': 0.9,
      'rss': 0.7,
      'web_scraping': 0.8,
      'job_board': 0.6,
      'patent_db': 0.85,
      'social': 0.3
    };

    const baseAgreement = sourceTypeWeight[source.type] || 0.5;
    const noise = (Math.random() - 0.5) * 0.3; // Add some randomness

    return Math.max(0, Math.min(1, baseAgreement + noise));
  }

  private isKnownTechBlog(url: string): boolean {
    const techBlogs = [
      'techcrunch.com',
      'venturebeat.com',
      'blog.stripe.com',
      'engineering.uber.com',
      'netflixtechblog.com',
      'eng.lyft.com',
      'medium.com/airbnb-engineering'
    ];

    return techBlogs.some(blog => url.includes(blog));
  }

  private isOfficialSite(url: string): boolean {
    // Check if URL appears to be an official company website
    const patterns = [
      /^https?:\/\/(?:www\.)?[^\/]+\.com\/(?:pricing|features|about|blog)/,
      /^https?:\/\/(?:www\.)?[^\/]+\.(?:com|org|net)$/
    ];

    return patterns.some(pattern => pattern.test(url));
  }

  private getDomainReputation(url: string): number {
    // Simplified domain reputation scoring
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '');

      const highRepDomains = [
        'github.com', 'stackoverflow.com', 'techcrunch.com',
        'venturebeat.com', 'reuters.com', 'bloomberg.com'
      ];

      const lowRepDomains = [
        'blogspot.com', 'wordpress.com', 'medium.com' // Not low rep, but less authoritative
      ];

      if (highRepDomains.includes(domain)) {
        return 0.9;
      } else if (lowRepDomains.includes(domain)) {
        return 0.4;
      }

      // Check TLD
      if (domain.endsWith('.edu') || domain.endsWith('.gov')) {
        return 0.95;
      } else if (domain.endsWith('.com') || domain.endsWith('.org')) {
        return 0.6;
      }

      return 0.5; // Default neutral reputation
    } catch {
      return 0.3; // Invalid URL gets low reputation
    }
  }

  private isCacheValid(lastUpdated?: Date): boolean {
    if (!lastUpdated) return false;

    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - lastUpdated.getTime() < maxAge;
  }

  // Public methods for external verification workflows
  async batchVerifySignals(signals: ProcessedSignal[]): Promise<Map<string, VerificationResult>> {
    const results = new Map<string, VerificationResult>();

    // Process signals in batches to avoid overwhelming sources
    const batchSize = 5;
    for (let i = 0; i < signals.length; i += batchSize) {
      const batch = signals.slice(i, i + batchSize);

      const batchPromises = batch.map(async (signal) => {
        const result = await this.verifySignal(signal);
        return { signal: signal.title, result };
      });

      const batchResults = await Promise.all(batchPromises);

      batchResults.forEach(({ signal, result }) => {
        results.set(signal, result);
      });

      // Small delay between batches
      if (i + batchSize < signals.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  getVerificationHistory(): Map<string, VerificationResult> {
    return new Map(this.verificationHistory);
  }

  clearVerificationHistory(): void {
    this.verificationHistory.clear();
  }

  getCredibilityCache(): Map<string, CredibilityScore> {
    return new Map(this.credibilityCache);
  }

  async addCrossReferenceSource(source: DataSource): Promise<void> {
    if (!this.crossReferenceSources.find(s => s.id === source.id)) {
      this.crossReferenceSources.push(source);
      console.log(`Added cross-reference source: ${source.name}`);
    }
  }

  removeCrossReferenceSource(sourceId: string): void {
    const index = this.crossReferenceSources.findIndex(s => s.id === sourceId);
    if (index !== -1) {
      const removed = this.crossReferenceSources.splice(index, 1)[0];
      console.log(`Removed cross-reference source: ${removed.name}`);
    }
  }
}

// Supporting interfaces for cross-referencing
interface CrossReference {
  source: DataSource;
  agreement: number; // 0-1 scale
  conflictingInfo: string[];
  supportingInfo: string[];
  lastChecked: Date;
}

interface CredibilityScore {
  overall: number;
  factual: number;
  timeliness: number;
  expertise: number;
  bias: number;
  factors: string[];
  lastUpdated?: Date;
}