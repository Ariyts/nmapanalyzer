/**
 * OtherHandler - Handler for Unknown/Unclassified Services
 * 
 * Handles services that don't match any known configuration.
 * Logs all available data for manual analysis and potential future config creation.
 */

import type { UnknownService } from '../../configs/types';

// ============================================
// STORAGE INTERFACE
// ============================================

interface UnknownServiceStorage {
  services: UnknownService[];
  lastUpdated: Date;
}

// ============================================
// OTHER HANDLER CLASS
// ============================================

export class OtherHandler {
  private storage: UnknownServiceStorage = {
    services: [],
    lastUpdated: new Date(),
  };
  private listeners: Array<(services: UnknownService[]) => void> = [];

  /**
   * Add an unknown service to the handler
   */
  addUnknownService(service: UnknownService): void {
    // Check for duplicates (same host + port)
    const exists = this.storage.services.some(
      s => s.hostIp === service.hostIp && s.port === service.port
    );

    if (!exists) {
      this.storage.services.push(service);
      this.storage.lastUpdated = new Date();
      this.notifyListeners();
    }
  }

  /**
   * Add multiple unknown services
   */
  addUnknownServices(services: UnknownService[]): void {
    services.forEach(service => this.addUnknownService(service));
  }

  /**
   * Get all unknown services
   */
  getUnknownServices(): UnknownService[] {
    return [...this.storage.services];
  }

  /**
   * Get unknown services by host
   */
  getServicesByHost(hostIp: string): UnknownService[] {
    return this.storage.services.filter(s => s.hostIp === hostIp);
  }

  /**
   * Get unknown services by port
   */
  getServicesByPort(port: number): UnknownService[] {
    return this.storage.services.filter(s => s.port === port);
  }

  /**
   * Get unique ports from unknown services
   */
  getUniquePorts(): number[] {
    const ports = new Set(this.storage.services.map(s => s.port));
    return Array.from(ports).sort((a, b) => a - b);
  }

  /**
   * Get unique service names from unknown services
   */
  getUniqueServiceNames(): string[] {
    const names = new Set(
      this.storage.services
        .map(s => s.serviceName)
        .filter((name): name is string => name !== undefined)
    );
    return Array.from(names).sort();
  }

  /**
   * Get statistics about unknown services
   */
  getStatistics(): {
    totalServices: number;
    uniqueHosts: number;
    uniquePorts: number;
    withBanner: number;
    withPartialMatch: number;
    topPorts: Array<{ port: number; count: number }>;
  } {
    const hosts = new Set(this.storage.services.map(s => s.hostIp));
    const portCounts = new Map<number, number>();

    this.storage.services.forEach(s => {
      portCounts.set(s.port, (portCounts.get(s.port) || 0) + 1);
    });

    const topPorts = Array.from(portCounts.entries())
      .map(([port, count]) => ({ port, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalServices: this.storage.services.length,
      uniqueHosts: hosts.size,
      uniquePorts: portCounts.size,
      withBanner: this.storage.services.filter(s => s.banner).length,
      withPartialMatch: this.storage.services.filter(s => s.partialMatches?.length).length,
      topPorts,
    };
  }

  /**
   * Export unknown services for analysis or reporting
   */
  exportToJson(): string {
    return JSON.stringify(this.storage, null, 2);
  }

  /**
   * Export to Markdown report
   */
  exportToMarkdown(): string {
    const stats = this.getStatistics();
    
    let md = `# Unknown Services Report\n\n`;
    md += `**Generated:** ${this.storage.lastUpdated.toISOString()}\n\n`;
    md += `## Statistics\n\n`;
    md += `- **Total Services:** ${stats.totalServices}\n`;
    md += `- **Unique Hosts:** ${stats.uniqueHosts}\n`;
    md += `- **Unique Ports:** ${stats.uniquePorts}\n`;
    md += `- **With Banner:** ${stats.withBanner}\n\n`;

    md += `## Top Ports\n\n`;
    md += `| Port | Count |\n|------|-------|\n`;
    stats.topPorts.forEach(({ port, count }) => {
      md += `| ${port} | ${count} |\n`;
    });

    md += `\n## All Unknown Services\n\n`;
    md += `| Host | Port | Protocol | Service | Product | Banner |\n`;
    md += `|------|------|----------|---------|---------|--------|\n`;

    this.storage.services.forEach(s => {
      const banner = s.banner 
        ? s.banner.substring(0, 50).replace(/\n/g, ' ') + (s.banner.length > 50 ? '...' : '')
        : '-';
      md += `| ${s.hostIp} | ${s.port} | ${s.protocol} | ${s.serviceName || '-'} | ${s.product || '-'} | ${banner} |\n`;
    });

    // Section for manual analysis suggestions
    md += `\n## Suggested Actions\n\n`;
    
    const uniquePorts = this.getUniquePorts();
    const unknownPortSuggestions = uniquePorts
      .filter(p => p > 10000)
      .slice(0, 5);

    if (unknownPortSuggestions.length > 0) {
      md += `### High Ports to Investigate\n\n`;
      unknownPortSuggestions.forEach(port => {
        md += `- Port ${port}: Check for custom services, backdoors, or ephemeral services\n`;
      });
    }

    const servicesWithoutBanner = this.storage.services.filter(s => !s.banner);
    if (servicesWithoutBanner.length > 0) {
      md += `\n### Services Without Banner\n\n`;
      md += `Run additional enumeration:\n`;
      md += `\`\`\`bash\n`;
      md += `nmap -sV -sC -p${[...new Set(servicesWithoutBanner.map(s => s.port))].join(',')} <targets>\n`;
      md += `\`\`\`\n`;
    }

    return md;
  }

  /**
   * Generate Nmap command for further enumeration
   */
  generateEnumerationCommand(): string {
    const ports = this.getUniquePorts();
    const hosts = new Set(this.storage.services.map(s => s.hostIp));
    
    if (ports.length === 0 || hosts.size === 0) {
      return '# No unknown services to enumerate';
    }

    const portList = ports.length > 20 
      ? '-' // All ports
      : ports.join(',');

    return `nmap -sV -sC -p${portList} ${Array.from(hosts).join(' ')}`;
  }

  /**
   * Clear all stored unknown services
   */
  clear(): void {
    this.storage = {
      services: [],
      lastUpdated: new Date(),
    };
    this.notifyListeners();
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: (services: UnknownService[]) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.storage.services));
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const otherHandler = new OtherHandler();

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Create an UnknownService from port data
 */
export function createUnknownService(
  hostIp: string,
  port: number,
  protocol: string,
  data: {
    serviceName?: string;
    product?: string;
    version?: string;
    banner?: string;
    nseScripts?: Array<{ name: string; output: string }>;
    partialMatches?: Array<{ configId: string; confidence: number }>;
  }
): UnknownService {
  return {
    hostIp,
    port,
    protocol,
    ...data,
    discoveredAt: new Date(),
  };
}
