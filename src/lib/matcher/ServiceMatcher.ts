/**
 * Service Matching Engine
 * Heuristic multi-level matching for CTF and real-world scenarios
 * 
 * Priority order:
 * 1. Service name from Nmap -sV (highest)
 * 2. CPE identifier
 * 3. Banner regex patterns
 * 4. Product name detection
 * 5. Version patterns
 * 6. NSE script output
 * 7. Port numbers (fallback)
 */

import type { 
  ServiceConfig, 
  ServiceMatchers, 
  MatchResult, 
  UnknownService,
  MatcherPriority 
} from '../../configs/types';
import { MatcherPriority as MP } from '../../configs/types';
import { allServiceConfigs } from '../../configs/services';

// ============================================
// TYPES
// ============================================

interface PortData {
  port: number;
  protocol: string;
  service?: string;
  product?: string;
  version?: string;
  extrainfo?: string;
  cpe?: string[];
  banner?: string;
  scripts?: {
    name: string;
    output: string;
  }[];
}

interface HostData {
  ip: string;
  hostname?: string;
  os?: string;
  ports: PortData[];
}

// ============================================
// MATCHER ENGINE
// ============================================

export class ServiceMatcher {
  private configs: ServiceConfig[] = [];
  private configMap: Map<string, ServiceConfig> = new Map();
  private static defaultConfigs: ServiceConfig[] = allServiceConfigs;

  constructor(configs: ServiceConfig[]) {
    this.configs = configs;
    configs.forEach(cfg => this.configMap.set(cfg.id, cfg));
  }

  /**
   * Create a ServiceMatcher with configs from IndexedDB (with fallback to static configs)
   */
  static async createFromStorage(): Promise<ServiceMatcher> {
    try {
      const { getAllConfigs, initializeWithDefaults } = await import('../storage/indexedDB');
      
      // Initialize with defaults if empty
      await initializeWithDefaults(ServiceMatcher.defaultConfigs);
      
      // Load from IndexedDB
      const configs = await getAllConfigs();
      
      return new ServiceMatcher(configs);
    } catch (error) {
      console.warn('Failed to load configs from IndexedDB, using defaults:', error);
      return new ServiceMatcher(ServiceMatcher.defaultConfigs);
    }
  }

  /**
   * Reload configs from IndexedDB
   */
  async reloadFromStorage(): Promise<void> {
    try {
      const { getAllConfigs } = await import('../storage/indexedDB');
      const configs = await getAllConfigs();
      
      this.configs = configs;
      this.configMap.clear();
      configs.forEach(cfg => this.configMap.set(cfg.id, cfg));
    } catch (error) {
      console.warn('Failed to reload configs from IndexedDB:', error);
    }
  }

  /**
   * Add a service config to the matcher
   */
  addConfig(config: ServiceConfig): void {
    // Remove existing config with same ID
    const existingIndex = this.configs.findIndex(c => c.id === config.id);
    if (existingIndex >= 0) {
      this.configs.splice(existingIndex, 1);
    }
    
    this.configs.push(config);
    this.configMap.set(config.id, config);
  }

  /**
   * Remove a config by ID
   */
  removeConfig(id: string): void {
    this.configs = this.configs.filter(c => c.id !== id);
    this.configMap.delete(id);
  }

  /**
   * Get all configs
   */
  getConfigs(): ServiceConfig[] {
    return [...this.configs];
  }

  /**
   * Get a config by ID
   */
  getConfig(id: string): ServiceConfig | undefined {
    return this.configMap.get(id);
  }

  /**
   * Match a single port against all service configs
   * Returns the best match with confidence score
   */
  matchPort(portData: PortData, hostIp: string): MatchResult | null {
    const results: Array<{ result: MatchResult; priority: number }> = [];

    for (const config of this.configs) {
      const match = this.tryMatch(config, portData);
      if (match) {
        results.push({
          result: match,
          priority: this.getMatcherPriority(match.matchedBy),
        });
      }
    }

    if (results.length === 0) {
      return null;
    }

    // Sort by priority (descending), then by confidence (descending)
    results.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.result.confidence - a.result.confidence;
    });

    return results[0].result;
  }

  /**
   * Analyze all ports on a host
   * Returns matched services and unknown services
   */
  analyzeHost(hostData: HostData): {
    matched: MatchResult[];
    unknown: UnknownService[];
  } {
    const matched: MatchResult[] = [];
    const unknown: UnknownService[] = [];

    for (const portData of hostData.ports) {
      const matchResult = this.matchPort(portData, hostData.ip);
      
      if (matchResult) {
        // Check confidence threshold
        const threshold = matchResult.config.confidenceThreshold ?? 30;
        if (matchResult.confidence >= threshold) {
          matched.push(matchResult);
          continue;
        }
      }

      // No match or below threshold - add to unknown
      unknown.push({
        port: portData.port,
        protocol: portData.protocol,
        serviceName: portData.service,
        product: portData.product,
        version: portData.version,
        banner: portData.banner,
        nseScripts: portData.scripts,
        hostIp: hostData.ip,
        discoveredAt: new Date(),
        partialMatches: matchResult 
          ? [{ configId: matchResult.config.id, confidence: matchResult.confidence }]
          : undefined,
      });
    }

    return { matched, unknown };
  }

  // ============================================
  // PRIVATE MATCHING METHODS
  // ============================================

  /**
   * Try to match a port against a specific service config
   */
  private tryMatch(config: ServiceConfig, portData: PortData): MatchResult | null {
    const matchers = config.matchers;
    let bestMatch: { confidence: number; type: MatchResult['matchedBy']; pattern: string; data: string } | null = null;

    // 1. Service name matching (highest priority)
    if (matchers.serviceNames && portData.service) {
      const match = this.matchServiceName(matchers.serviceNames, portData.service);
      if (match) {
        bestMatch = { confidence: 95, type: 'service_name', pattern: match, data: portData.service };
      }
    }

    // 2. CPE matching
    if (!bestMatch && matchers.cpePatterns && portData.cpe?.length) {
      const match = this.matchCPE(matchers.cpePatterns, portData.cpe);
      if (match) {
        bestMatch = { confidence: 90, type: 'cpe', pattern: match, data: portData.cpe.join(', ') };
      }
    }

    // 3. Banner regex matching
    if (!bestMatch && matchers.bannerRegex && portData.banner) {
      const match = this.matchBannerRegex(matchers.bannerRegex, portData.banner);
      if (match) {
        bestMatch = { confidence: 80, type: 'banner_regex', pattern: match, data: portData.banner.substring(0, 100) };
      }
    }

    // 4. Product matching
    if (!bestMatch && matchers.productPatterns && portData.product) {
      const match = this.matchProduct(matchers.productPatterns, portData.product);
      if (match) {
        bestMatch = { confidence: 75, type: 'product', pattern: match, data: portData.product };
      }
    }

    // 5. Version matching
    if (!bestMatch && matchers.versionPatterns && portData.version) {
      const match = this.matchVersion(matchers.versionPatterns, portData.version);
      if (match) {
        bestMatch = { confidence: 65, type: 'version', pattern: match, data: portData.version };
      }
    }

    // 6. NSE script matching
    if (!bestMatch && matchers.nseScriptMatchers && portData.scripts?.length) {
      const match = this.matchNSEScripts(matchers.nseScriptMatchers, portData.scripts);
      if (match) {
        bestMatch = { confidence: 70, type: 'nse_script', pattern: match.pattern, data: match.output };
      }
    }

    // 7. Port-based fallback (lowest priority)
    if (!bestMatch && matchers.standardPorts) {
      const match = this.matchByPortNumber(matchers.standardPorts, portData.port);
      if (match) {
        bestMatch = { confidence: 30, type: 'port', pattern: match, data: String(portData.port) };
      }
    }

    if (!bestMatch) return null;

    return {
      config,
      confidence: bestMatch.confidence,
      matchedBy: bestMatch.type,
      matchedPattern: bestMatch.pattern,
      matchedData: bestMatch.data,
    };
  }

  /**
   * Match by Nmap service name
   */
  private matchServiceName(patterns: string[], serviceName: string): string | null {
    const lower = serviceName.toLowerCase();
    for (const pattern of patterns) {
      if (lower === pattern.toLowerCase()) {
        return pattern;
      }
      // Support wildcard patterns
      if (pattern.includes('*')) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
        if (regex.test(serviceName)) {
          return pattern;
        }
      }
    }
    return null;
  }

  /**
   * Match by CPE identifier
   */
  private matchCPE(patterns: string[], cpes: string[]): string | null {
    for (const pattern of patterns) {
      const lowerPattern = pattern.toLowerCase();
      for (const cpe of cpes) {
        if (cpe.toLowerCase().includes(lowerPattern)) {
          return pattern;
        }
      }
    }
    return null;
  }

  /**
   * Match by banner regex
   */
  private matchBannerRegex(patterns: string[], banner: string): string | null {
    for (const pattern of patterns) {
      try {
        const regex = new RegExp(pattern, 'is');
        if (regex.test(banner)) {
          return pattern;
        }
      } catch {
        // Invalid regex, skip
        console.warn(`Invalid banner regex pattern: ${pattern}`);
      }
    }
    return null;
  }

  /**
   * Match by product name
   */
  private matchProduct(patterns: string[], product: string): string | null {
    const lower = product.toLowerCase();
    for (const pattern of patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Match by version string
   */
  private matchVersion(patterns: string[], version: string): string | null {
    const lower = version.toLowerCase();
    for (const pattern of patterns) {
      if (lower.includes(pattern.toLowerCase())) {
        return pattern;
      }
    }
    return null;
  }

  /**
   * Match by NSE script output
   */
  private matchNSEScripts(
    matchers: ServiceMatchers['nseScriptMatchers'],
    scripts: PortData['scripts']
  ): { pattern: string; output: string } | null {
    if (!scripts) return null;
    
    for (const matcher of matchers) {
      const script = scripts.find(s => s.name === matcher.scriptName);
      if (script) {
        if (!matcher.outputPattern) {
          return { pattern: matcher.scriptName, output: script.output };
        }
        try {
          const regex = new RegExp(matcher.outputPattern, 'is');
          if (regex.test(script.output)) {
            return { pattern: `${matcher.scriptName}:${matcher.outputPattern}`, output: script.output };
          }
        } catch {
          console.warn(`Invalid NSE output pattern: ${matcher.outputPattern}`);
        }
      }
    }
    return null;
  }

  /**
   * Match by port number (fallback)
   */
  private matchByPortNumber(ports: number[], port: number): string | null {
    if (ports.includes(port)) {
      return String(port);
    }
    return null;
  }

  /**
   * Get numeric priority for a matcher type
   */
  private getMatcherPriority(type: MatchResult['matchedBy']): number {
    const priorities: Record<MatchResult['matchedBy'], number> = {
      service_name: MP.SERVICE_NAME,
      cpe: MP.CPE,
      banner_regex: MP.BANNER_REGEX,
      product: MP.PRODUCT,
      version: MP.VERSION,
      nse_script: MP.NSE_SCRIPT,
      port: MP.PORT,
    };
    return priorities[type] ?? 0;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create a PortData object from parsed Nmap data
 */
export function createPortDataFromNmap(port: any): PortData {
  return {
    port: port.port,
    protocol: port.protocol || 'tcp',
    service: port.service,
    product: port.product,
    version: port.version,
    extrainfo: port.extrainfo,
    cpe: port.cpe || [],
    banner: port.banner || port.extrainfo || '',
    scripts: port.scripts?.map((s: any) => ({
      name: s.id || s.name,
      output: s.output || '',
    })) || [],
  };
}

/**
 * Create a HostData object from parsed Nmap data
 */
export function createHostDataFromNmap(host: any): HostData {
  return {
    ip: host.ip || host.address,
    hostname: host.hostname || host.hostnames?.[0],
    os: host.os?.name,
    ports: (host.ports || []).map(createPortDataFromNmap),
  };
}
