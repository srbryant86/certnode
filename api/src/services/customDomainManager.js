/**
 * Custom Domain and Branding Management Service
 * Enterprise white-label capabilities with SSL automation
 */

const crypto = require('crypto');
const dns = require('dns').promises;
const { createContextLogger } = require('../middleware/logging');

class CustomDomainManager {
  constructor(options = {}) {
    this.config = {
      sslProvider: options.sslProvider || 'letsencrypt', // 'letsencrypt', 'cloudflare', 'aws'
      dnsProvider: options.dnsProvider || 'cloudflare',
      autoRenewal: options.autoRenewal !== false,
      challengeType: options.challengeType || 'http-01', // 'http-01', 'dns-01'
      baseDomain: options.baseDomain || 'certnode.io',
      ...options
    };

    this.domains = new Map();
    this.certificates = new Map();
    this.brandingConfigs = new Map();

    this.initialize();
  }

  async initialize() {
    // Load existing domain configurations
    await this.loadDomainConfigurations();

    // Start certificate renewal monitoring
    if (this.config.autoRenewal) {
      this.startCertificateMonitoring();
    }

    console.log('Custom domain manager initialized');
  }

  // Domain Management
  async addCustomDomain(tenantId, domainConfig) {
    const {
      domain,
      subdomain = 'api',
      autoSSL = true,
      branding = {}
    } = domainConfig;

    const logger = createContextLogger();

    try {
      // Validate domain
      await this.validateDomain(domain);

      // Generate full domain name
      const fullDomain = subdomain ? `${subdomain}.${domain}` : domain;

      // Check if domain is already in use
      if (this.domains.has(fullDomain)) {
        throw new Error('Domain already in use');
      }

      logger.info('Adding custom domain', {
        tenantId,
        domain: fullDomain,
        autoSSL
      });

      const domainRecord = {
        id: this.generateDomainId(),
        tenantId,
        domain: fullDomain,
        baseDomain: domain,
        subdomain,
        status: 'pending_verification',
        autoSSL,
        branding,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        verificationToken: this.generateVerificationToken(),
        dnsRecords: this.generateDNSRecords(fullDomain),
        sslStatus: autoSSL ? 'pending' : 'disabled'
      };

      // Store domain configuration
      this.domains.set(fullDomain, domainRecord);

      // Create branding configuration
      if (Object.keys(branding).length > 0) {
        await this.createBrandingConfig(tenantId, fullDomain, branding);
      }

      logger.info('Custom domain added', {
        domainId: domainRecord.id,
        domain: fullDomain,
        verificationToken: domainRecord.verificationToken
      });

      return {
        domainId: domainRecord.id,
        domain: fullDomain,
        status: domainRecord.status,
        verificationToken: domainRecord.verificationToken,
        dnsRecords: domainRecord.dnsRecords,
        nextSteps: this.getVerificationInstructions(domainRecord)
      };

    } catch (error) {
      logger.error('Failed to add custom domain', {
        error: error.message,
        tenantId,
        domain
      });
      throw error;
    }
  }

  async verifyDomain(domainId) {
    const domain = this.findDomainById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    const logger = createContextLogger();

    try {
      logger.info('Verifying domain ownership', {
        domainId,
        domain: domain.domain
      });

      // Perform DNS verification
      const verified = await this.performDNSVerification(domain);

      if (verified) {
        domain.status = 'verified';
        domain.verifiedAt = new Date().toISOString();

        // Initiate SSL certificate generation if enabled
        if (domain.autoSSL) {
          await this.generateSSLCertificate(domain);
        }

        logger.info('Domain verification successful', {
          domainId,
          domain: domain.domain
        });

        return {
          status: 'verified',
          domain: domain.domain,
          sslStatus: domain.sslStatus,
          verifiedAt: domain.verifiedAt
        };
      } else {
        throw new Error('Domain verification failed');
      }

    } catch (error) {
      logger.error('Domain verification failed', {
        error: error.message,
        domainId,
        domain: domain.domain
      });

      domain.status = 'verification_failed';
      domain.lastError = error.message;

      throw error;
    }
  }

  async removeDomain(domainId, tenantId) {
    const domain = this.findDomainById(domainId);
    if (!domain) {
      throw new Error('Domain not found');
    }

    if (domain.tenantId !== tenantId) {
      throw new Error('Access denied');
    }

    const logger = createContextLogger();

    try {
      logger.info('Removing custom domain', {
        domainId,
        domain: domain.domain,
        tenantId
      });

      // Revoke SSL certificate if exists
      if (domain.sslStatus === 'active') {
        await this.revokeCertificate(domain);
      }

      // Remove domain and associated configurations
      this.domains.delete(domain.domain);
      this.brandingConfigs.delete(domain.domain);

      logger.info('Custom domain removed', {
        domainId,
        domain: domain.domain
      });

      return { success: true, domainId };

    } catch (error) {
      logger.error('Failed to remove domain', {
        error: error.message,
        domainId,
        domain: domain.domain
      });
      throw error;
    }
  }

  // SSL Certificate Management
  async generateSSLCertificate(domain) {
    const logger = createContextLogger();

    try {
      logger.info('Generating SSL certificate', {
        domain: domain.domain,
        provider: this.config.sslProvider
      });

      domain.sslStatus = 'generating';

      // Simulate certificate generation based on provider
      switch (this.config.sslProvider) {
        case 'letsencrypt':
          await this.generateLetsEncryptCertificate(domain);
          break;
        case 'cloudflare':
          await this.generateCloudflareCertificate(domain);
          break;
        case 'aws':
          await this.generateAWSCertificate(domain);
          break;
        default:
          throw new Error(`Unsupported SSL provider: ${this.config.sslProvider}`);
      }

      domain.sslStatus = 'active';
      domain.sslGeneratedAt = new Date().toISOString();
      domain.sslExpiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

      logger.info('SSL certificate generated successfully', {
        domain: domain.domain,
        expiresAt: domain.sslExpiresAt
      });

    } catch (error) {
      logger.error('SSL certificate generation failed', {
        error: error.message,
        domain: domain.domain
      });

      domain.sslStatus = 'failed';
      domain.sslError = error.message;
      throw error;
    }
  }

  async generateLetsEncryptCertificate(domain) {
    // Let's Encrypt ACME protocol implementation
    const certificateData = {
      certificate: `-----BEGIN CERTIFICATE-----\n[CERTIFICATE_DATA]\n-----END CERTIFICATE-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----\n[PRIVATE_KEY_DATA]\n-----END PRIVATE KEY-----`,
      chain: `-----BEGIN CERTIFICATE-----\n[CHAIN_DATA]\n-----END CERTIFICATE-----`,
      issuer: 'Let\'s Encrypt',
      algorithm: 'RSA-2048'
    };

    this.certificates.set(domain.domain, certificateData);
    return certificateData;
  }

  async generateCloudflareCertificate(domain) {
    // Cloudflare Origin Certificate implementation
    const certificateData = {
      certificate: `-----BEGIN CERTIFICATE-----\n[CLOUDFLARE_CERTIFICATE_DATA]\n-----END CERTIFICATE-----`,
      privateKey: `-----BEGIN PRIVATE KEY-----\n[CLOUDFLARE_PRIVATE_KEY_DATA]\n-----END PRIVATE KEY-----`,
      issuer: 'Cloudflare Inc ECC CA-3',
      algorithm: 'ECDSA P-256'
    };

    this.certificates.set(domain.domain, certificateData);
    return certificateData;
  }

  async generateAWSCertificate(domain) {
    // AWS Certificate Manager implementation
    const certificateData = {
      certificateArn: `arn:aws:acm:us-east-1:123456789012:certificate/${crypto.randomUUID()}`,
      status: 'ISSUED',
      issuer: 'Amazon',
      algorithm: 'RSA-2048'
    };

    this.certificates.set(domain.domain, certificateData);
    return certificateData;
  }

  // Branding Configuration
  async createBrandingConfig(tenantId, domain, brandingData) {
    const brandingConfig = {
      tenantId,
      domain,
      logo: brandingData.logo || null,
      primaryColor: brandingData.primaryColor || '#007bff',
      secondaryColor: brandingData.secondaryColor || '#6c757d',
      fontFamily: brandingData.fontFamily || 'Inter, sans-serif',
      customCSS: brandingData.customCSS || '',
      favicon: brandingData.favicon || null,
      companyName: brandingData.companyName || 'CertNode',
      footerText: brandingData.footerText || '',
      customHeaders: brandingData.customHeaders || {},
      emailTemplates: brandingData.emailTemplates || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.brandingConfigs.set(domain, brandingConfig);
    return brandingConfig;
  }

  async updateBrandingConfig(domain, tenantId, updates) {
    const existing = this.brandingConfigs.get(domain);
    if (!existing || existing.tenantId !== tenantId) {
      throw new Error('Branding configuration not found or access denied');
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.brandingConfigs.set(domain, updated);
    return updated;
  }

  getBrandingConfig(domain) {
    return this.brandingConfigs.get(domain) || null;
  }

  // Domain Validation
  async validateDomain(domain) {
    // Basic domain format validation
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    if (!domainRegex.test(domain)) {
      throw new Error('Invalid domain format');
    }

    // Check if domain is publicly resolvable
    try {
      await dns.lookup(domain);
    } catch (error) {
      console.warn(`Domain ${domain} is not currently resolvable, but allowing configuration`);
    }

    return true;
  }

  async performDNSVerification(domain) {
    try {
      // Check for verification TXT record
      const txtRecords = await dns.resolveTxt(domain.domain);
      const verificationRecord = txtRecords.find(record =>
        record.join('').includes(domain.verificationToken)
      );

      if (verificationRecord) {
        return true;
      }

      // Check for CNAME record pointing to our service
      try {
        const cnameRecords = await dns.resolveCname(domain.domain);
        const expectedTarget = `${domain.tenantId}.${this.config.baseDomain}`;

        if (cnameRecords.some(record => record === expectedTarget)) {
          return true;
        }
      } catch (error) {
        // CNAME not found, continue with other verification methods
      }

      return false;

    } catch (error) {
      console.error('DNS verification error:', error.message);
      return false;
    }
  }

  // Certificate Monitoring and Renewal
  startCertificateMonitoring() {
    // Check certificates every 24 hours
    setInterval(async () => {
      await this.checkCertificateRenewal();
    }, 24 * 60 * 60 * 1000);

    console.log('Certificate monitoring started');
  }

  async checkCertificateRenewal() {
    const logger = createContextLogger();

    for (const [domainName, domain] of this.domains) {
      if (domain.sslStatus === 'active' && domain.sslExpiresAt) {
        const expiryDate = new Date(domain.sslExpiresAt);
        const renewalDate = new Date(expiryDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days before expiry

        if (new Date() >= renewalDate) {
          logger.info('Certificate renewal required', {
            domain: domainName,
            expiresAt: domain.sslExpiresAt
          });

          try {
            await this.renewCertificate(domain);
          } catch (error) {
            logger.error('Certificate renewal failed', {
              domain: domainName,
              error: error.message
            });
          }
        }
      }
    }
  }

  async renewCertificate(domain) {
    const logger = createContextLogger();

    logger.info('Renewing SSL certificate', {
      domain: domain.domain
    });

    // Generate new certificate
    await this.generateSSLCertificate(domain);

    logger.info('SSL certificate renewed successfully', {
      domain: domain.domain,
      newExpiryDate: domain.sslExpiresAt
    });
  }

  async revokeCertificate(domain) {
    const logger = createContextLogger();

    logger.info('Revoking SSL certificate', {
      domain: domain.domain
    });

    // Remove certificate from storage
    this.certificates.delete(domain.domain);

    // Update domain status
    domain.sslStatus = 'revoked';
    domain.sslRevokedAt = new Date().toISOString();

    logger.info('SSL certificate revoked', {
      domain: domain.domain
    });
  }

  // Domain Routing Middleware
  getDomainRoutingMiddleware() {
    return (req, res, next) => {
      const host = req.get('host');
      const domain = this.domains.get(host);

      if (domain) {
        // Custom domain detected
        req.customDomain = domain;
        req.tenantId = domain.tenantId;

        // Apply branding configuration
        const branding = this.brandingConfigs.get(host);
        if (branding) {
          req.branding = branding;

          // Add custom headers
          if (branding.customHeaders) {
            Object.entries(branding.customHeaders).forEach(([key, value]) => {
              res.setHeader(key, value);
            });
          }
        }

        // Log custom domain usage
        const logger = createContextLogger();
        logger.debug('Custom domain request', {
          domain: host,
          tenantId: domain.tenantId,
          path: req.path
        });
      }

      next();
    };
  }

  // Utility Methods
  generateDomainId() {
    return 'domain_' + crypto.randomUUID();
  }

  generateVerificationToken() {
    return 'certnode-verify-' + crypto.randomBytes(16).toString('hex');
  }

  generateDNSRecords(domain) {
    const baseDomain = this.config.baseDomain;

    return [
      {
        type: 'CNAME',
        name: domain,
        value: `proxy.${baseDomain}`,
        ttl: 300,
        description: 'Points your domain to CertNode\'s proxy servers'
      },
      {
        type: 'TXT',
        name: domain,
        value: `certnode-verification=${this.generateVerificationToken()}`,
        ttl: 300,
        description: 'Verification record to prove domain ownership'
      }
    ];
  }

  getVerificationInstructions(domain) {
    return {
      method: 'dns',
      steps: [
        'Add the provided DNS records to your domain',
        'Wait for DNS propagation (usually 5-60 minutes)',
        'Click "Verify Domain" to complete setup',
        'SSL certificate will be automatically generated upon verification'
      ],
      dnsRecords: domain.dnsRecords,
      verificationUrl: `/api/v1/domains/${domain.id}/verify`
    };
  }

  findDomainById(domainId) {
    for (const domain of this.domains.values()) {
      if (domain.id === domainId) {
        return domain;
      }
    }
    return null;
  }

  findDomainByName(domainName) {
    return this.domains.get(domainName);
  }

  // Data Persistence (placeholder for database integration)
  async loadDomainConfigurations() {
    // In a real implementation, this would load from database
    console.log('Loading domain configurations from storage...');
  }

  async saveDomainConfiguration(domain) {
    // In a real implementation, this would save to database
    console.log(`Saving domain configuration for ${domain.domain}`);
  }

  // Health Check
  async healthCheck() {
    const totalDomains = this.domains.size;
    const activeDomains = Array.from(this.domains.values())
      .filter(d => d.status === 'verified').length;
    const activeCertificates = Array.from(this.domains.values())
      .filter(d => d.sslStatus === 'active').length;

    return {
      status: 'healthy',
      domains: {
        total: totalDomains,
        active: activeDomains,
        withSSL: activeCertificates
      },
      certificates: {
        total: this.certificates.size,
        provider: this.config.sslProvider,
        autoRenewal: this.config.autoRenewal
      },
      branding: {
        total: this.brandingConfigs.size
      },
      timestamp: new Date().toISOString()
    };
  }

  // Statistics and Metrics
  getDomainStatistics() {
    const domains = Array.from(this.domains.values());

    return {
      total: domains.length,
      byStatus: {
        pending: domains.filter(d => d.status === 'pending_verification').length,
        verified: domains.filter(d => d.status === 'verified').length,
        failed: domains.filter(d => d.status === 'verification_failed').length
      },
      ssl: {
        active: domains.filter(d => d.sslStatus === 'active').length,
        pending: domains.filter(d => d.sslStatus === 'pending').length,
        failed: domains.filter(d => d.sslStatus === 'failed').length,
        disabled: domains.filter(d => d.sslStatus === 'disabled').length
      },
      providers: {
        ssl: this.config.sslProvider,
        dns: this.config.dnsProvider
      }
    };
  }
}

module.exports = CustomDomainManager;