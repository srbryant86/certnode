export interface ImageMetadataAnalysis {
  exifConsistency: number;        // EXIF data integrity check (0-1)
  timestampAnomalies: number;     // Creation vs modification time issues
  softwareSignatures: string[];   // Detected generation software
  compressionAnalysis: number;    // JPEG generation artifacts
  overallSuspicion: number;       // Combined suspicion score
}

export interface ImageStatistics {
  pixelDistribution: number;      // Unnatural color distributions
  compressionArtifacts: number;   // AI generation signatures
  noisePatterns: number;          // Camera sensor vs AI noise
  edgeDetection: number;          // Artificial vs natural edges
}

export interface ImageDetectionResult {
  confidence: number;             // 0-1 overall AI generation confidence
  metadata: ImageMetadataAnalysis;
  statistics: ImageStatistics;
  indicators: string[];          // Specific red flags found
  reasoning: string;             // Human-readable explanation
  processingTime: number;        // Performance tracking
}

// Known AI image generation software signatures
const AI_IMAGE_SOFTWARE = [
  'DALL-E', 'DALLE', 'Midjourney', 'Stable Diffusion', 'StableDiffusion',
  'Adobe Firefly', 'Runway', 'Leonardo', 'IMAGEN', 'Craiyon',
  'DeepAI', 'NightCafe', 'Artbreeder', 'Jasper Art', 'Canva AI'
];

// Suspicious software/camera combinations
const SUSPICIOUS_SOFTWARE = [
  'Photoshop', 'GIMP', 'Figma', 'Sketch', 'Procreate'
];

export class ImageMetadataDetector {
  /**
   * Analyze image buffer for AI generation indicators
   * Note: This is a simplified implementation focusing on metadata analysis
   * Full implementation would require image processing libraries
   */
  async analyze(imageBuffer: Buffer): Promise<ImageDetectionResult> {
    const startTime = Date.now();

    // Extract basic metadata (simplified - would use exif-js or similar in production)
    const metadata = this.analyzeImageMetadata(imageBuffer);
    const statistics = this.analyzeImageStatistics(imageBuffer);

    // Calculate overall confidence
    const confidence = this.calculateImageConfidence(metadata, statistics);

    // Collect indicators
    const indicators = [
      ...this.getMetadataIndicators(metadata),
      ...this.getStatisticalIndicators(statistics)
    ];

    // Generate reasoning
    const reasoning = this.generateImageReasoning(confidence, indicators, metadata.softwareSignatures);

    return {
      confidence,
      metadata,
      statistics,
      indicators,
      reasoning,
      processingTime: Date.now() - startTime
    };
  }

  /**
   * Analyze image metadata for suspicious patterns
   */
  private analyzeImageMetadata(imageBuffer: Buffer): ImageMetadataAnalysis {
    // Simplified metadata analysis - in production would use proper EXIF parsing
    const imageString = imageBuffer.toString('binary', 0, Math.min(2048, imageBuffer.length));

    // Look for AI software signatures in metadata
    const detectedSoftware: string[] = [];
    let aiSoftwareScore = 0;

    for (const software of AI_IMAGE_SOFTWARE) {
      if (imageString.toLowerCase().includes(software.toLowerCase())) {
        detectedSoftware.push(software);
        aiSoftwareScore += 1;
      }
    }

    for (const software of SUSPICIOUS_SOFTWARE) {
      if (imageString.toLowerCase().includes(software.toLowerCase())) {
        detectedSoftware.push(`${software} (editing)`);
      }
    }

    // EXIF consistency check (simplified)
    let exifConsistency = 0;
    if (imageString.includes('EXIF') || imageString.includes('Exif')) {
      // Look for inconsistent EXIF patterns
      const hasCamera = imageString.includes('Canon') || imageString.includes('Nikon') ||
                       imageString.includes('Sony') || imageString.includes('iPhone');
      const hasGPS = imageString.includes('GPS');
      const hasTimestamp = imageString.includes('DateTime');

      if (!hasCamera && hasGPS) exifConsistency += 0.3; // GPS without camera info is suspicious
      if (hasCamera && !hasTimestamp) exifConsistency += 0.2; // Camera without timestamp
      if (detectedSoftware.length > 0 && hasCamera) exifConsistency += 0.4; // AI software + camera metadata
    } else {
      // No EXIF data at all (common in AI images)
      exifConsistency = 0.3;
    }

    // Timestamp anomalies (simplified)
    const timestampAnomalies = this.detectTimestampAnomalies(imageString);

    // Compression analysis (basic)
    const compressionAnalysis = this.analyzeCompression(imageBuffer);

    const overallSuspicion = Math.min(1,
      (aiSoftwareScore * 0.4) +
      (exifConsistency * 0.3) +
      (timestampAnomalies * 0.2) +
      (compressionAnalysis * 0.1)
    );

    return {
      exifConsistency,
      timestampAnomalies,
      softwareSignatures: detectedSoftware,
      compressionAnalysis,
      overallSuspicion
    };
  }

  /**
   * Analyze statistical properties of the image
   */
  private analyzeImageStatistics(imageBuffer: Buffer): ImageStatistics {
    // Simplified statistical analysis - would use proper image processing in production

    // Basic file size analysis
    const fileSize = imageBuffer.length;
    let pixelDistribution = 0;
    let compressionArtifacts = 0;
    let noisePatterns = 0;
    let edgeDetection = 0;

    // File size heuristics
    if (fileSize < 50000) {
      // Very small files might be heavily compressed AI images
      compressionArtifacts += 0.2;
    } else if (fileSize > 10000000) {
      // Very large files are less likely to be AI generated
      compressionArtifacts -= 0.1;
    }

    // Basic header analysis for compression signatures
    const header = imageBuffer.slice(0, 100);
    const headerHex = header.toString('hex');

    // JPEG markers analysis
    if (headerHex.startsWith('ffd8ff')) { // JPEG signature
      // Look for unusual JPEG markers that might indicate AI generation
      if (headerHex.includes('ffe1') && headerHex.includes('4578696600')) { // EXIF marker
        compressionArtifacts += 0.1;
      }

      // Check for unusual quantization tables (simplified)
      if (headerHex.includes('ffdb')) { // Quantization table marker
        compressionArtifacts += 0.1;
      }
    }

    // PNG analysis
    if (headerHex.startsWith('89504e47')) { // PNG signature
      // PNG files from AI generators often have specific chunk patterns
      noisePatterns += 0.1;
    }

    // Basic pattern detection in image data
    const sampleSize = Math.min(1000, imageBuffer.length - 100);
    const sampleData = imageBuffer.slice(100, 100 + sampleSize);

    // Look for repetitive patterns (might indicate AI generation)
    let repetitiveBytes = 0;
    for (let i = 0; i < sampleData.length - 1; i++) {
      if (sampleData[i] === sampleData[i + 1]) {
        repetitiveBytes++;
      }
    }

    pixelDistribution = Math.min(1, repetitiveBytes / sampleSize);

    // Edge detection approximation (very basic)
    let edgeChanges = 0;
    for (let i = 0; i < sampleData.length - 2; i++) {
      const diff1 = Math.abs(sampleData[i] - sampleData[i + 1]);
      const diff2 = Math.abs(sampleData[i + 1] - sampleData[i + 2]);
      if (diff1 > 50 && diff2 > 50) {
        edgeChanges++;
      }
    }

    edgeDetection = Math.min(1, edgeChanges / (sampleSize - 2));

    return {
      pixelDistribution: Math.max(0, Math.min(1, pixelDistribution)),
      compressionArtifacts: Math.max(0, Math.min(1, compressionArtifacts)),
      noisePatterns: Math.max(0, Math.min(1, noisePatterns)),
      edgeDetection: Math.max(0, Math.min(1, edgeDetection))
    };
  }

  /**
   * Calculate overall confidence score for AI generation
   */
  private calculateImageConfidence(metadata: ImageMetadataAnalysis, statistics: ImageStatistics): number {
    // Weighted combination of different analysis methods
    const weights = {
      metadata: 0.6,    // Metadata analysis is quite reliable
      statistics: 0.4   // Statistical analysis is supplementary
    };

    const metadataScore = metadata.overallSuspicion;
    const statisticsScore = (
      statistics.pixelDistribution * 0.3 +
      statistics.compressionArtifacts * 0.4 +
      statistics.noisePatterns * 0.2 +
      statistics.edgeDetection * 0.1
    );

    return (metadataScore * weights.metadata) + (statisticsScore * weights.statistics);
  }

  /**
   * Detect timestamp anomalies in image metadata
   */
  private detectTimestampAnomalies(imageString: string): number {
    let anomalyScore = 0;

    // Look for timestamp patterns
    const currentYear = new Date().getFullYear();
    const yearPattern = /20\d{2}/g;
    const years = imageString.match(yearPattern);

    if (years) {
      for (const yearStr of years) {
        const year = parseInt(yearStr);
        if (year > currentYear) {
          anomalyScore += 0.5; // Future timestamp
        } else if (year < 1990) {
          anomalyScore += 0.3; // Suspiciously old for digital image
        }
      }
    }

    // Check for impossible date patterns (simplified)
    if (imageString.includes('2024:13:') || imageString.includes('2024:00:')) {
      anomalyScore += 0.4; // Invalid month
    }

    return Math.min(1, anomalyScore);
  }

  /**
   * Analyze compression patterns for AI generation signatures
   */
  private analyzeCompression(imageBuffer: Buffer): number {
    let compressionScore = 0;

    // File size vs format heuristics
    const fileSize = imageBuffer.length;
    const header = imageBuffer.slice(0, 10).toString('hex');

    if (header.startsWith('ffd8ff')) { // JPEG
      // AI-generated JPEGs often have specific compression characteristics
      if (fileSize < 100000) {
        compressionScore += 0.2; // Small JPEG might be AI-compressed
      }
    } else if (header.startsWith('89504e47')) { // PNG
      // AI generators often output PNG with specific compression
      if (fileSize > 2000000) {
        compressionScore += 0.1; // Large PNG less likely from AI
      } else if (fileSize < 200000) {
        compressionScore += 0.2; // Small PNG might be AI
      }
    }

    return Math.min(1, compressionScore);
  }

  /**
   * Generate indicators from metadata analysis
   */
  private getMetadataIndicators(metadata: ImageMetadataAnalysis): string[] {
    const indicators: string[] = [];

    if (metadata.softwareSignatures.some(s => AI_IMAGE_SOFTWARE.some(ai => s.includes(ai)))) {
      indicators.push('ai_software_signature');
    }

    if (metadata.exifConsistency > 0.4) {
      indicators.push('exif_inconsistencies');
    }

    if (metadata.timestampAnomalies > 0.3) {
      indicators.push('timestamp_anomalies');
    }

    if (metadata.compressionAnalysis > 0.3) {
      indicators.push('suspicious_compression');
    }

    if (metadata.softwareSignatures.length === 0) {
      indicators.push('missing_creation_metadata');
    }

    return indicators;
  }

  /**
   * Generate indicators from statistical analysis
   */
  private getStatisticalIndicators(statistics: ImageStatistics): string[] {
    const indicators: string[] = [];

    if (statistics.pixelDistribution > 0.5) {
      indicators.push('unnatural_pixel_distribution');
    }

    if (statistics.compressionArtifacts > 0.4) {
      indicators.push('ai_compression_artifacts');
    }

    if (statistics.noisePatterns > 0.4) {
      indicators.push('artificial_noise_patterns');
    }

    if (statistics.edgeDetection > 0.6) {
      indicators.push('artificial_edge_enhancement');
    }

    return indicators;
  }

  /**
   * Generate human-readable reasoning for the detection result
   */
  private generateImageReasoning(confidence: number, indicators: string[], softwareSignatures: string[]): string {
    if (confidence < 0.3) {
      return "Image appears to be naturally captured with consistent metadata and statistical properties.";
    } else if (confidence < 0.7) {
      const reasons = [];

      if (indicators.includes('ai_software_signature')) {
        reasons.push("AI generation software detected");
      }
      if (indicators.includes('exif_inconsistencies')) {
        reasons.push("inconsistent EXIF metadata");
      }
      if (indicators.includes('suspicious_compression')) {
        reasons.push("unusual compression patterns");
      }

      return `Image shows some indicators of artificial generation: ${reasons.join(', ')}.`;
    } else {
      const strongIndicators = indicators.filter(i =>
        ['ai_software_signature', 'unnatural_pixel_distribution', 'ai_compression_artifacts'].includes(i)
      );

      let reasoning = `Image shows strong indicators of AI generation: ${strongIndicators.join(', ')}.`;

      if (softwareSignatures.length > 0) {
        const aiSoftware = softwareSignatures.filter(s =>
          AI_IMAGE_SOFTWARE.some(ai => s.includes(ai))
        );
        if (aiSoftware.length > 0) {
          reasoning += ` Detected AI software: ${aiSoftware.join(', ')}.`;
        }
      }

      return reasoning;
    }
  }
}

export const imageMetadataDetector = new ImageMetadataDetector();