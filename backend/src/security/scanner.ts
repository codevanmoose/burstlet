import { Request, Response } from 'express';
import { createHash } from 'crypto';
import winston from 'winston';

interface SecurityThreat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  source: string;
  timestamp: number;
  requestId?: string;
  userAgent?: string;
  ip?: string;
}

interface SecurityScanResult {
  passed: boolean;
  threats: SecurityThreat[];
  score: number;
  recommendations: string[];
}

class SecurityScanner {
  private threats: SecurityThreat[] = [];
  private logger: winston.Logger;
  private whitelist: Set<string> = new Set();
  private blacklist: Set<string> = new Set();

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
      ],
    });

    // Initialize security patterns
    this.initializePatterns();
  }

  private initializePatterns() {
    // Common malicious IPs (example - in production, use threat intelligence feeds)
    this.blacklist.add('192.168.1.1'); // Example - replace with real threats
    
    // Trusted IPs
    this.whitelist.add('127.0.0.1');
    this.whitelist.add('::1');
  }

  // SQL injection detection
  detectSQLInjection(input: string): SecurityThreat | null {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /((\%27)|(\'))\s*((\%6F)|o|(\%4F))\s*((\%72)|r|(\%52))/i, // '=' or '1'='1'
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i, // Common SQL injection markers
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        return {
          type: 'sql_injection',
          severity: 'high',
          description: 'Potential SQL injection attempt detected',
          source: input.substring(0, 100),
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  // XSS detection
  detectXSS(input: string): SecurityThreat | null {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers like onclick, onload
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
      /eval\s*\(/gi,
      /expression\s*\(/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        return {
          type: 'xss',
          severity: 'high',
          description: 'Potential XSS attempt detected',
          source: input.substring(0, 100),
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  // Path traversal detection
  detectPathTraversal(input: string): SecurityThreat | null {
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\\//g,
      /\.\.\\/g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi,
      /\.\.%2f/gi,
      /%2e%2e/gi,
    ];

    for (const pattern of pathTraversalPatterns) {
      if (pattern.test(input)) {
        return {
          type: 'path_traversal',
          severity: 'medium',
          description: 'Potential path traversal attempt detected',
          source: input.substring(0, 100),
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  // Command injection detection
  detectCommandInjection(input: string): SecurityThreat | null {
    const commandPatterns = [
      /[;&|`$(){}[\]]/g,
      /\b(cat|ls|pwd|id|whoami|uname|nc|netcat|wget|curl)\b/gi,
      /\$\{[^}]*\}/g, // Variable expansion
      /`[^`]*`/g, // Backticks
      /\$\([^)]*\)/g, // Command substitution
    ];

    for (const pattern of commandPatterns) {
      if (pattern.test(input)) {
        return {
          type: 'command_injection',
          severity: 'critical',
          description: 'Potential command injection attempt detected',
          source: input.substring(0, 100),
          timestamp: Date.now(),
        };
      }
    }

    return null;
  }

  // Rate limiting anomaly detection
  detectRateLimitingAnomaly(ip: string, endpoint: string): SecurityThreat | null {
    // Simple implementation - in production, use more sophisticated algorithms
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    // This would typically be stored in Redis
    const requests = this.getRequestCount(key, windowMs);
    
    if (requests > maxRequests) {
      return {
        type: 'rate_limit_anomaly',
        severity: 'medium',
        description: `Unusual request rate detected: ${requests} requests in ${windowMs}ms`,
        source: `${ip} -> ${endpoint}`,
        timestamp: now,
        ip,
      };
    }

    return null;
  }

  // User agent analysis
  analyzeUserAgent(userAgent: string): SecurityThreat | null {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /w3af/i,
      /nmap/i,
      /masscan/i,
      /zgrab/i,
      /bot.*crawler/i,
      /spider/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        return {
          type: 'suspicious_user_agent',
          severity: 'medium',
          description: 'Suspicious user agent detected',
          source: userAgent,
          timestamp: Date.now(),
          userAgent,
        };
      }
    }

    return null;
  }

  // Geographic anomaly detection
  detectGeographicAnomaly(ip: string): SecurityThreat | null {
    // This would typically integrate with a GeoIP service
    // For now, just check against known bad IP ranges
    
    if (this.blacklist.has(ip)) {
      return {
        type: 'blacklisted_ip',
        severity: 'high',
        description: 'Request from blacklisted IP address',
        source: ip,
        timestamp: Date.now(),
        ip,
      };
    }

    return null;
  }

  // Scan request for threats
  scanRequest(req: Request): SecurityThreat[] {
    const threats: SecurityThreat[] = [];
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || '';

    // Skip whitelisted IPs
    if (this.whitelist.has(ip)) {
      return threats;
    }

    // Scan URL parameters
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        const sqlThreat = this.detectSQLInjection(value);
        if (sqlThreat) {
          sqlThreat.requestId = req.headers['x-request-id'] as string;
          sqlThreat.ip = ip;
          threats.push(sqlThreat);
        }

        const xssThreat = this.detectXSS(value);
        if (xssThreat) {
          xssThreat.requestId = req.headers['x-request-id'] as string;
          xssThreat.ip = ip;
          threats.push(xssThreat);
        }

        const pathThreat = this.detectPathTraversal(value);
        if (pathThreat) {
          pathThreat.requestId = req.headers['x-request-id'] as string;
          pathThreat.ip = ip;
          threats.push(pathThreat);
        }

        const cmdThreat = this.detectCommandInjection(value);
        if (cmdThreat) {
          cmdThreat.requestId = req.headers['x-request-id'] as string;
          cmdThreat.ip = ip;
          threats.push(cmdThreat);
        }
      }
    }

    // Scan request body
    if (req.body && typeof req.body === 'object') {
      const bodyStr = JSON.stringify(req.body);
      
      const sqlThreat = this.detectSQLInjection(bodyStr);
      if (sqlThreat) {
        sqlThreat.requestId = req.headers['x-request-id'] as string;
        sqlThreat.ip = ip;
        threats.push(sqlThreat);
      }

      const xssThreat = this.detectXSS(bodyStr);
      if (xssThreat) {
        xssThreat.requestId = req.headers['x-request-id'] as string;
        xssThreat.ip = ip;
        threats.push(xssThreat);
      }
    }

    // Analyze user agent
    const uaThreat = this.analyzeUserAgent(userAgent);
    if (uaThreat) {
      uaThreat.requestId = req.headers['x-request-id'] as string;
      uaThreat.ip = ip;
      threats.push(uaThreat);
    }

    // Check geographic anomalies
    const geoThreat = this.detectGeographicAnomaly(ip);
    if (geoThreat) {
      geoThreat.requestId = req.headers['x-request-id'] as string;
      threats.push(geoThreat);
    }

    // Check rate limiting anomalies
    const rateThreat = this.detectRateLimitingAnomaly(ip, req.path);
    if (rateThreat) {
      rateThreat.requestId = req.headers['x-request-id'] as string;
      threats.push(rateThreat);
    }

    return threats;
  }

  // Record threat
  recordThreat(threat: SecurityThreat): void {
    this.threats.push(threat);
    
    // Log threat
    this.logger.warn('Security threat detected', threat);

    // Keep only last 1000 threats in memory
    if (this.threats.length > 1000) {
      this.threats.shift();
    }

    // In production, would also:
    // - Send to SIEM system
    // - Update threat intelligence
    // - Trigger automated responses
  }

  // Get threat statistics
  getThreatStats(timeWindowMs: number = 60 * 60 * 1000): any {
    const cutoff = Date.now() - timeWindowMs;
    const recentThreats = this.threats.filter(t => t.timestamp > cutoff);

    const threatsByType = recentThreats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const threatsBySeverity = recentThreats.reduce((acc, threat) => {
      acc[threat.severity] = (acc[threat.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topSources = recentThreats.reduce((acc, threat) => {
      if (threat.ip) {
        acc[threat.ip] = (acc[threat.ip] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalThreats: recentThreats.length,
      threatsByType,
      threatsBySeverity,
      topSources: Object.entries(topSources)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([ip, count]) => ({ ip, count })),
      timeWindow: timeWindowMs,
      timestamp: new Date().toISOString(),
    };
  }

  // Security scan report
  generateSecurityReport(): SecurityScanResult {
    const threats = this.threats.filter(t => Date.now() - t.timestamp < 24 * 60 * 60 * 1000);
    
    const criticalThreats = threats.filter(t => t.severity === 'critical').length;
    const highThreats = threats.filter(t => t.severity === 'high').length;
    const mediumThreats = threats.filter(t => t.severity === 'medium').length;
    const lowThreats = threats.filter(t => t.severity === 'low').length;

    // Calculate security score (0-100)
    let score = 100;
    score -= criticalThreats * 20;
    score -= highThreats * 10;
    score -= mediumThreats * 5;
    score -= lowThreats * 1;
    score = Math.max(0, score);

    const recommendations: string[] = [];
    
    if (criticalThreats > 0) {
      recommendations.push('Immediately investigate critical security threats');
    }
    
    if (highThreats > 5) {
      recommendations.push('Review and strengthen input validation');
    }
    
    if (mediumThreats > 10) {
      recommendations.push('Consider implementing additional rate limiting');
    }

    if (score < 80) {
      recommendations.push('Enable additional security monitoring');
    }

    return {
      passed: score >= 80,
      threats: threats.slice(-10), // Last 10 threats
      score,
      recommendations,
    };
  }

  // Helper method for request counting (simplified)
  private getRequestCount(key: string, windowMs: number): number {
    // In production, this would use Redis with sliding window
    // For now, return a mock value
    return Math.floor(Math.random() * 150);
  }

  // Add IP to whitelist
  whitelistIP(ip: string): void {
    this.whitelist.add(ip);
    this.logger.info('IP added to whitelist', { ip });
  }

  // Add IP to blacklist
  blacklistIP(ip: string): void {
    this.blacklist.add(ip);
    this.logger.info('IP added to blacklist', { ip });
  }

  // Clear threats older than specified age
  clearOldThreats(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    const initialLength = this.threats.length;
    
    this.threats = this.threats.filter(t => t.timestamp > cutoff);
    
    const removed = initialLength - this.threats.length;
    if (removed > 0) {
      this.logger.info('Cleared old security threats', { removed, remaining: this.threats.length });
    }
    
    return removed;
  }
}

// Export singleton instance
export const securityScanner = new SecurityScanner();

// Security scanning middleware
export const securityScanMiddleware = (req: Request, res: Response, next: any) => {
  const threats = securityScanner.scanRequest(req);
  
  if (threats.length > 0) {
    // Record all threats
    threats.forEach(threat => securityScanner.recordThreat(threat));
    
    // Check if any critical threats should block the request
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    
    if (criticalThreats.length > 0) {
      return res.status(403).json({
        error: 'Request Blocked',
        message: 'Request blocked due to security policy violation',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'],
      });
    }
  }

  next();
};