import { createHash } from 'crypto';

export interface LinguisticAnalysis {
  perplexityScore: number;      // N-gram model likelihood (lower = more AI-like)
  syntaxConsistency: number;    // Sentence structure pattern consistency
  modelFingerprints: string[];  // Detected AI model signatures
  formalityIndex: number;       // Academic vs conversational language
  repetitionIndex: number;      // Phrase/structure repetition patterns
}

export interface StatisticalMetrics {
  vocabularyDistribution: number;  // Zipf's law deviation analysis
  punctuationPatterns: number;     // Comma/period/semicolon consistency
  sentenceLengthVariance: number;  // Human variation vs AI consistency
  transitionProbability: number;   // Word-to-word transition naturalness
}

export interface EnhancedDetectionResult {
  confidence: number;              // 0-1 weighted ensemble score
  methods: {
    linguistic: number;            // Grammar/syntax patterns
    statistical: number;           // Vocabulary distribution
    perplexity: number;           // Language model likelihood
    fingerprint: number;          // Specific model signatures
  };
  indicators: string[];           // Specific red flags found
  reasoning: string;              // Human-readable explanation
  modelSignatures: string[];      // Detected AI models (GPT-4, Claude, etc)
  confidenceInterval: [number, number]; // Uncertainty bounds
  processingTime: number;         // Performance tracking
}

// Common AI model signature patterns
const AI_MODEL_SIGNATURES = {
  'gpt-4': [
    'it\'s important to note that',
    'it\'s worth mentioning',
    'while it\'s true that',
    'on the other hand',
    'furthermore',
    'in addition to this',
    'as an ai language model',
    'i don\'t have personal opinions',
    'from my perspective',
    'it\'s also worth noting',
    'building upon this',
    'to put it simply'
  ],
  'claude': [
    'i\'d be happy to help',
    'let me break this down',
    'here\'s what i think',
    'to clarify',
    'alternatively',
    'it\'s worth considering',
    'i\'d be glad to assist',
    'let me explain this',
    'to elaborate on this',
    'i appreciate your question',
    'that\'s an excellent question',
    'i\'d suggest considering'
  ],
  'gemini': [
    'according to my knowledge',
    'based on available information',
    'it\'s generally accepted',
    'research suggests',
    'experts recommend',
    'studies indicate',
    'current understanding suggests',
    'the consensus among experts',
    'evidence points to',
    'scholarly research indicates',
    'data demonstrates that',
    'empirical evidence shows'
  ],
  'chatgpt': [
    'i\'m an ai developed by openai',
    'as chatgpt',
    'i\'m here to help',
    'my training data',
    'i don\'t have the ability to',
    'i can\'t provide real-time',
    'as of my last update',
    'i don\'t have access to',
    'my knowledge cutoff',
    'i\'m not able to browse'
  ],
  'generic-ai': [
    'in conclusion',
    'to summarize',
    'it\'s crucial to understand',
    'comprehensive analysis',
    'facilitate',
    'utilize',
    'implement',
    'optimize',
    'leverage',
    'methodology',
    'framework',
    'paradigm',
    'utilize best practices',
    'ensure optimal results',
    'strategic approach',
    'systematic methodology'
  ]
};

// Common word frequency distribution for English (simplified Zipf distribution)
const COMMON_WORDS = new Map([
  ['the', 7.14], ['of', 4.16], ['and', 3.04], ['to', 2.60], ['a', 2.33],
  ['in', 2.11], ['is', 1.68], ['it', 1.56], ['you', 1.54], ['that', 1.37],
  ['he', 1.36], ['was', 1.26], ['for', 1.24], ['on', 1.17], ['are', 1.04],
  ['as', 0.96], ['with', 0.94], ['his', 0.89], ['they', 0.88], ['i', 0.88]
]);

export class AdvancedTextDetector {
  /**
   * Perform comprehensive AI detection analysis on text content
   */
  async analyze(text: string): Promise<EnhancedDetectionResult> {
    const startTime = Date.now();

    // Perform all analysis methods
    const linguistic = this.analyzeLinguisticPatterns(text);
    const statistical = this.analyzeStatisticalMetrics(text);
    const perplexity = this.calculatePerplexityScore(text);
    const fingerprint = this.detectModelFingerprints(text);

    // Calculate weighted ensemble score
    const confidence = this.calculateEnsembleScore({
      linguistic: linguistic.formalityIndex,
      statistical: statistical.vocabularyDistribution,
      perplexity: perplexity,
      fingerprint: fingerprint.maxConfidence
    });

    // Collect all indicators
    const indicators = [
      ...this.getLinguisticIndicators(linguistic),
      ...this.getStatisticalIndicators(statistical),
      ...this.getPerplexityIndicators(perplexity),
      ...fingerprint.detectedModels.map(model => `${model}_signature`)
    ];

    // Generate human-readable reasoning
    const reasoning = this.generateReasoning(confidence, indicators, fingerprint.detectedModels);

    // Calculate confidence interval (simple approach)
    const uncertainty = Math.min(0.1, 0.05 + (indicators.length * 0.01));
    const confidenceInterval: [number, number] = [
      Math.max(0, confidence - uncertainty),
      Math.min(1, confidence + uncertainty)
    ];

    return {
      confidence,
      methods: {
        linguistic: linguistic.formalityIndex,
        statistical: statistical.vocabularyDistribution,
        perplexity,
        fingerprint: fingerprint.maxConfidence
      },
      indicators,
      reasoning,
      modelSignatures: fingerprint.detectedModels,
      confidenceInterval,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Analyze linguistic patterns in the text
   */
  private analyzeLinguisticPatterns(text: string): LinguisticAnalysis {
    const sentences = this.extractSentences(text);
    const words = this.extractWords(text);

    // Calculate syntax consistency
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const lengthVariance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const syntaxConsistency = Math.min(1, lengthVariance / 100); // Normalize

    // Calculate formality index
    const formalWords = ['utilize', 'facilitate', 'implement', 'comprehensive', 'significant', 'substantial', 'methodology', 'furthermore', 'however', 'therefore'];
    const formalCount = words.filter(word => formalWords.includes(word.toLowerCase())).length;
    const formalityIndex = Math.min(1, (formalCount / words.length) * 10);

    // Calculate repetition index
    const phrases = this.extractPhrases(text, 3); // 3-word phrases
    const uniquePhrases = new Set(phrases);
    const repetitionIndex = Math.max(0, 1 - (uniquePhrases.size / phrases.length));

    return {
      perplexityScore: 0, // Will be calculated separately
      syntaxConsistency,
      modelFingerprints: [], // Will be detected separately
      formalityIndex,
      repetitionIndex
    };
  }

  /**
   * Analyze statistical properties of the text
   */
  private analyzeStatisticalMetrics(text: string): StatisticalMetrics {
    const words = this.extractWords(text);
    const sentences = this.extractSentences(text);

    // Vocabulary distribution analysis (Zipf's law)
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      const lower = word.toLowerCase();
      wordFreq.set(lower, (wordFreq.get(lower) || 0) + 1);
    });

    // Calculate how much the distribution deviates from expected Zipf distribution
    let zipfDeviation = 0;
    let commonWordScore = 0;

    for (const [word, freq] of wordFreq.entries()) {
      const expectedFreq = COMMON_WORDS.get(word);
      if (expectedFreq) {
        const actualFreq = (freq / words.length) * 100;
        const deviation = Math.abs(actualFreq - expectedFreq) / expectedFreq;
        zipfDeviation += deviation;
        commonWordScore += 1;
      }
    }

    const vocabularyDistribution = commonWordScore > 0 ?
      Math.min(1, zipfDeviation / commonWordScore) : 0;

    // Punctuation pattern analysis
    const punctuationMarks = text.match(/[.,;:!?]/g) || [];
    const periods = (text.match(/\./g) || []).length;
    const commas = (text.match(/,/g) || []).length;
    const expectedCommaRatio = 0.3; // Typical comma-to-period ratio in human writing
    const actualCommaRatio = periods > 0 ? commas / periods : 0;
    const punctuationPatterns = Math.abs(actualCommaRatio - expectedCommaRatio);

    // Sentence length variance
    const sentenceLengths = sentences.map(s => s.split(/\s+/).length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const sentenceLengthVariance = Math.min(1, variance / 200); // Normalize

    // Transition probability (simplified)
    let transitionScore = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const current = words[i].toLowerCase();
      const next = words[i + 1].toLowerCase();

      // Simple heuristic: check for common unnatural transitions
      if (this.isUnnaturalTransition(current, next)) {
        transitionScore += 1;
      }
    }
    const transitionProbability = words.length > 1 ? transitionScore / (words.length - 1) : 0;

    return {
      vocabularyDistribution,
      punctuationPatterns,
      sentenceLengthVariance,
      transitionProbability
    };
  }

  /**
   * Calculate approximate perplexity score using n-gram analysis
   */
  private calculatePerplexityScore(text: string): number {
    const words = this.extractWords(text);
    if (words.length < 3) return 0;

    // Simple 2-gram perplexity approximation
    const bigrams = new Map<string, number>();
    const unigrams = new Map<string, number>();

    // Count unigrams and bigrams
    for (let i = 0; i < words.length; i++) {
      const word = words[i].toLowerCase();
      unigrams.set(word, (unigrams.get(word) || 0) + 1);

      if (i < words.length - 1) {
        const bigram = `${word} ${words[i + 1].toLowerCase()}`;
        bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
      }
    }

    // Calculate approximate perplexity
    let logProbSum = 0;
    let bigramCount = 0;

    for (const [bigram, count] of bigrams.entries()) {
      const [word1] = bigram.split(' ');
      const unigramCount = unigrams.get(word1) || 1;
      const probability = count / unigramCount;
      logProbSum += Math.log2(probability);
      bigramCount++;
    }

    if (bigramCount === 0) return 0;

    // Lower perplexity indicates more predictable (AI-like) text
    const avgLogProb = logProbSum / bigramCount;
    const perplexity = Math.pow(2, -avgLogProb);

    // Normalize to 0-1 scale (lower values indicate higher AI likelihood)
    return Math.max(0, Math.min(1, 1 - (perplexity / 100)));
  }

  /**
   * Detect AI model fingerprints in the text
   */
  private detectModelFingerprints(text: string): { detectedModels: string[], maxConfidence: number } {
    const lowerText = text.toLowerCase();
    const detectedModels: string[] = [];
    const confidences: number[] = [];

    for (const [model, signatures] of Object.entries(AI_MODEL_SIGNATURES)) {
      let matchCount = 0;
      for (const signature of signatures) {
        if (lowerText.includes(signature)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        const confidence = Math.min(1, matchCount / signatures.length);
        confidences.push(confidence);

        if (confidence > 0.2) { // Threshold for detection
          detectedModels.push(model);
        }
      }
    }

    const maxConfidence = confidences.length > 0 ? Math.max(...confidences) : 0;
    return { detectedModels, maxConfidence };
  }

  /**
   * Calculate weighted ensemble score from multiple detection methods
   */
  private calculateEnsembleScore(scores: {
    linguistic: number,
    statistical: number,
    perplexity: number,
    fingerprint: number
  }): number {
    // Weights based on empirical effectiveness
    const weights = {
      linguistic: 0.25,
      statistical: 0.20,
      perplexity: 0.35,
      fingerprint: 0.20
    };

    return (
      scores.linguistic * weights.linguistic +
      scores.statistical * weights.statistical +
      scores.perplexity * weights.perplexity +
      scores.fingerprint * weights.fingerprint
    );
  }

  // Helper methods
  private extractSentences(text: string): string[] {
    return text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  }

  private extractWords(text: string): string[] {
    return text.match(/\b\w+\b/g) || [];
  }

  private extractPhrases(text: string, length: number): string[] {
    const words = this.extractWords(text);
    const phrases: string[] = [];

    for (let i = 0; i <= words.length - length; i++) {
      phrases.push(words.slice(i, i + length).join(' ').toLowerCase());
    }

    return phrases;
  }

  private isUnnaturalTransition(current: string, next: string): boolean {
    // Simple heuristic for unnatural word transitions
    const unnaturalPairs = [
      ['the', 'the'], ['and', 'and'], ['of', 'of'], ['to', 'to'],
      ['furthermore', 'furthermore'], ['however', 'however']
    ];

    return unnaturalPairs.some(([first, second]) =>
      current === first && next === second
    );
  }

  private getLinguisticIndicators(analysis: LinguisticAnalysis): string[] {
    const indicators: string[] = [];

    if (analysis.formalityIndex > 0.3) indicators.push('high_formality');
    if (analysis.syntaxConsistency > 0.7) indicators.push('consistent_syntax');
    if (analysis.repetitionIndex > 0.4) indicators.push('repetitive_patterns');

    return indicators;
  }

  private getStatisticalIndicators(metrics: StatisticalMetrics): string[] {
    const indicators: string[] = [];

    if (metrics.vocabularyDistribution > 0.5) indicators.push('unnatural_vocabulary_distribution');
    if (metrics.punctuationPatterns > 0.3) indicators.push('inconsistent_punctuation');
    if (metrics.sentenceLengthVariance < 0.2) indicators.push('uniform_sentence_length');
    if (metrics.transitionProbability > 0.1) indicators.push('unnatural_word_transitions');

    return indicators;
  }

  private getPerplexityIndicators(perplexity: number): string[] {
    const indicators: string[] = [];

    if (perplexity > 0.7) indicators.push('low_perplexity_score');
    if (perplexity > 0.8) indicators.push('highly_predictable_text');

    return indicators;
  }

  private generateReasoning(confidence: number, indicators: string[], modelSignatures: string[]): string {
    if (confidence < 0.3) {
      return "Text shows natural human writing patterns with varied sentence structure and vocabulary.";
    } else if (confidence < 0.7) {
      const reasons = [];
      if (indicators.includes('high_formality')) reasons.push("formal language patterns");
      if (indicators.includes('consistent_syntax')) reasons.push("overly consistent syntax");
      if (modelSignatures.length > 0) reasons.push(`${modelSignatures[0]} model signatures`);

      return `Text shows some AI-generated characteristics: ${reasons.join(', ')}.`;
    } else {
      const strongIndicators = indicators.filter(i =>
        ['low_perplexity_score', 'highly_predictable_text', 'unnatural_vocabulary_distribution'].includes(i)
      );

      return `Text shows strong indicators of AI generation: ${strongIndicators.join(', ')}. ` +
             `${modelSignatures.length > 0 ? `Possible models: ${modelSignatures.join(', ')}.` : ''}`;
    }
  }
}

export const advancedTextDetector = new AdvancedTextDetector();