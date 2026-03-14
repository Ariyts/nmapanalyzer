/**
 * Nmap Analyzer - Configuration-Driven Implementation
 * 
 * This module provides analysis functions for Nmap scan results.
 * All business logic is driven by service configurations and the ServiceMatcher.
 * 
 * Features:
 * - Heuristic service matching (service name, CPE, banner, port)
 * - Unknown service detection and logging
 * - Active Directory infrastructure detection
 * - Scan comparison and diff
 * - Security recommendations generation
 */

import type { Host, ScanInfo, ScanDiff, PortChanges, ServiceGroup, ADInfrastructure, Recommendation } from '../types';
import type { MatchResult, UnknownService, ServiceConfig } from '../configs/types';
import { ServiceMatcher, createHostDataFromNmap } from './matcher';
import { otherHandler } from './matcher/OtherHandler';
import { 
  allServiceConfigs, 
  categories, 
  getCategory,
  type CategoryDefinition 
} from '../configs/services';

// ============================================================================
// Types
// ============================================================================

interface ServiceMatch {
  host: Host;
  port: Host['ports'][0];
  matchResult: MatchResult;
}

interface AnalysisResult {
  matchedServices: ServiceMatch[];
  unknownServices: UnknownService[];
  serviceGroups: ServiceGroup[];
  adInfrastructure: ADInfrastructure | null;
}

// ============================================================================
// Service Matcher Instance
// ============================================================================

const serviceMatcher = new ServiceMatcher(allServiceConfigs);

// ============================================================================
// Legacy Compatibility Exports
// ============================================================================

/**
 * Get all unique ports from all service configs (for high-value port detection)
 */
function getAllHighValuePorts(): Record<number, string> {
  const ports: Record<number, string> = {};
  
  for (const config of allServiceConfigs) {
    const standardPorts = config.matchers.standardPorts || [];
    for (const port of standardPorts) {
      ports[port] = config.name;
    }
  }
  
  return ports;
}

export const HIGH_VALUE_PORTS = getAllHighValuePorts();

/**
 * Legacy categories format for backward compatibility
 */
export const SERVICE_CATEGORIES: Record<string, { 
  label: string; 
  color: string; 
  ports: number[]; 
  services: string[] 
}> = {};

for (const cat of categories) {
  const configsWithCategory = allServiceConfigs.filter(c => c.categoryId === cat.id);
  const ports = new Set<number>();
  const services = new Set<string>();
  
  for (const config of configsWithCategory) {
    config.matchers.standardPorts?.forEach(p => ports.add(p));
    config.matchers.serviceNames?.forEach(s => services.add(s));
  }
  
  SERVICE_CATEGORIES[cat.id] = {
    label: cat.name,
    color: cat.color,
    ports: Array.from(ports),
    services: Array.from(services),
  };
}

// ============================================================================
// Service Classification (New Config-Driven)
// ============================================================================

/**
 * Analyze hosts and match services using the configuration-driven matcher
 */
export function analyzeHosts(hosts: Host[]): AnalysisResult {
  const matchedServices: ServiceMatch[] = [];
  const unknownServices: UnknownService[] = [];
  
  // Clear previous unknown services
  otherHandler.clear();
  
  for (const host of hosts) {
    if (host.state !== 'up') continue;
    
    const hostData = createHostDataFromNmap(host);
    const { matched, unknown } = serviceMatcher.analyzeHost(hostData);
    
    // Add matched services
    for (const match of matched) {
      const port = host.ports.find(
        p => p.number === parseInt(match.matchedData) || 
             p.service === match.matchedData ||
             p.state === 'open'
      );
      
      if (port) {
        matchedServices.push({
          host,
          port,
          matchResult: match,
        });
      }
    }
    
    // Add unknown services
    unknownServices.push(...unknown);
    otherHandler.addUnknownServices(unknown);
  }
  
  // Create service groups
  const serviceGroups = createServiceGroups(matchedServices);
  
  // Detect AD infrastructure
  const adInfrastructure = detectADInfrastructure(hosts);
  
  return {
    matchedServices,
    unknownServices,
    serviceGroups,
    adInfrastructure,
  };
}

/**
 * Classify hosts into service groups based on matched configs
 */
export function classifyServices(hosts: Host[]): ServiceGroup[] {
  const { serviceGroups } = analyzeHosts(hosts);
  return serviceGroups;
}

/**
 * Create service groups from matched services
 */
function createServiceGroups(matchedServices: ServiceMatch[]): ServiceGroup[] {
  const groupsMap = new Map<string, ServiceGroup>();
  
  for (const match of matchedServices) {
    const categoryId = match.matchResult.config.categoryId;
    const config = match.matchResult.config;
    
    if (!groupsMap.has(categoryId)) {
      const category = getCategory(categoryId);
      groupsMap.set(categoryId, {
        category: categoryId,
        label: category?.name || categoryId,
        color: category?.color || '#6b7280',
        hosts: [],
        ports: [],
      });
    }
    
    const group = groupsMap.get(categoryId)!;
    
    // Add host if not already present
    if (!group.hosts.includes(match.host)) {
      group.hosts.push(match.host);
    }
    
    // Add port
    group.ports.push({ ip: match.host.ip, port: match.port });
  }
  
  return Array.from(groupsMap.values()).sort((a, b) => b.hosts.length - a.hosts.length);
}

// ============================================================================
// Active Directory Detection
// ============================================================================

/**
 * Detect Active Directory infrastructure from scan results
 */
export function detectADInfrastructure(hosts: Host[]): ADInfrastructure | null {
  const dcs: { host: Host; confidence: number }[] = [];
  const possibleDCs: { host: Host; confidence: number }[] = [];

  for (const host of hosts) {
    if (host.state !== 'up') continue;
    if (host.isDC && host.dcConfidence !== undefined) {
      if (host.dcConfidence >= 0.8) dcs.push({ host, confidence: host.dcConfidence });
      else if (host.dcConfidence >= 0.4) possibleDCs.push({ host, confidence: host.dcConfidence });
    }
  }

  if (dcs.length === 0 && possibleDCs.length === 0) {
    return null;
  }

  // Detect domain from DC hostnames or LDAP banners
  let domain: string | undefined;
  for (const dc of dcs) {
    if (dc.host.domain && !domain) {
      domain = dc.host.domain;
      break;
    }
  }
  if (!domain) {
    for (const dc of possibleDCs) {
      if (dc.host.domain && !domain) {
        domain = dc.host.domain;
        break;
      }
    }
  }

  // Domain-joined hosts
  const domainJoinedHosts = hosts.filter(
    (h) => h.state === 'up' && h.domain && h.domain === domain && !h.isDC
  );

  return {
    domain,
    domainControllers: dcs.sort((a, b) => b.confidence - a.confidence),
    possibleDCs: possibleDCs.sort((a, b) => b.confidence - a.confidence),
    domainJoinedHosts,
  };
}

// ============================================================================
// Scan Comparison
// ============================================================================

/**
 * Compare two scans and detect changes
 */
export function diffScans(scan1: ScanInfo, scan2: ScanInfo): ScanDiff {
  const hosts1Map = new Map(scan1.hosts.filter((h) => h.state === 'up').map((h) => [h.ip, h]));
  const hosts2Map = new Map(scan2.hosts.filter((h) => h.state === 'up').map((h) => [h.ip, h]));

  const newHosts: Host[] = [];
  const removedHosts: string[] = [];
  const portChanges: Record<string, PortChanges> = {};
  const highValueFindings: ScanDiff['highValueFindings'] = [];
  let newPortsCount = 0;

  // New hosts in scan2 not in scan1
  hosts2Map.forEach((host, ip) => {
    if (!hosts1Map.has(ip)) newHosts.push(host);
  });

  // Removed hosts
  hosts1Map.forEach((_, ip) => {
    if (!hosts2Map.has(ip)) removedHosts.push(ip);
  });

  // Port changes for existing hosts
  hosts1Map.forEach((host1, ip) => {
    const host2 = hosts2Map.get(ip);
    if (!host2) return;

    const ports1 = new Map(host1.ports.filter((p) => p.state === 'open').map((p) => [`${p.number}/${p.protocol}`, p]));
    const ports2 = new Map(host2.ports.filter((p) => p.state === 'open').map((p) => [`${p.number}/${p.protocol}`, p]));

    const newPorts: typeof host1.ports = [];
    const removedPorts: number[] = [];

    ports2.forEach((port, key) => {
      if (!ports1.has(key)) {
        newPorts.push(port);
        newPortsCount++;
        if (HIGH_VALUE_PORTS[port.number]) {
          highValueFindings.push({ 
            ip, 
            port: port.number, 
            service: port.service, 
            reason: HIGH_VALUE_PORTS[port.number] 
          });
        }
      }
    });

    ports1.forEach((port, key) => {
      if (!ports2.has(key)) removedPorts.push(port.number);
    });

    if (newPorts.length > 0 || removedPorts.length > 0) {
      portChanges[ip] = { newPorts, removedPorts, serviceChanges: [] };
    }
  });

  // Also check new hosts for high value
  newHosts.forEach((host) => {
    host.ports.forEach((port) => {
      if (HIGH_VALUE_PORTS[port.number]) {
        highValueFindings.push({ 
          ip: host.ip, 
          port: port.number, 
          service: port.service, 
          reason: HIGH_VALUE_PORTS[port.number] 
        });
        newPortsCount++;
      }
    });
  });

  return {
    scan1Name: scan1.name,
    scan2Name: scan2.name,
    newHosts,
    removedHosts,
    portChanges,
    newPortsCount,
    highValueFindings,
  };
}

// ============================================================================
// Recommendations Generator (Config-Driven)
// ============================================================================

/**
 * Generate security recommendations based on detected services
 * Uses service configurations for attack techniques
 */
export function generateRecommendations(hosts: Host[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const analysis = analyzeHosts(hosts);
  
  // Group matched services by config
  const configMatches = new Map<ServiceConfig, ServiceMatch[]>();
  for (const match of analysis.matchedServices) {
    const config = match.matchResult.config;
    if (!configMatches.has(config)) {
      configMatches.set(config, []);
    }
    configMatches.get(config)!.push(match);
  }

  // AD / DC - Critical
  if (analysis.adInfrastructure && analysis.adInfrastructure.domainControllers.length > 0) {
    const ad = analysis.adInfrastructure;
    const domain = ad.domain || '{domain}';
    const dcIPs = ad.domainControllers.map((dc) => dc.host.ip);
    const adConfig = allServiceConfigs.find(c => c.id === 'active-directory');
    
    const checks: string[] = [
      `# Active Directory detected — Domain: ${domain}`,
      `# ${ad.domainControllers.length} Domain Controller(s) found`,
      '',
    ];
    
    if (adConfig?.techniques) {
      for (const tech of adConfig.techniques.slice(0, 4)) {
        checks.push(`## ${tech.name}`);
        checks.push(...(tech.commands?.slice(0, 2).map(c => c.command) || []));
        checks.push('');
      }
    }
    
    recs.push({
      priority: 'CRITICAL',
      category: 'Active Directory',
      targets: dcIPs,
      icon: '🔴',
      checks: checks.filter(Boolean),
    });
  }

  // Process each matched service config
  for (const [config, matches] of configMatches) {
    if (config.id === 'active-directory') continue; // Already handled
    
    const uniqueHosts = [...new Set(matches.map(m => m.host))];
    const uniqueIPs = uniqueHosts.map(h => h.ip);
    
    const checks: string[] = [
      `# ${config.name} (${uniqueHosts.length} hosts)`,
      '',
    ];
    
    // Add techniques
    const techniques = config.techniques || [];
    for (const tech of techniques.slice(0, 5)) {
      checks.push(`## ${tech.name}`);
      if (tech.description) {
        checks.push(`# ${tech.description}`);
      }
      for (const cmd of (tech.commands || []).slice(0, 2)) {
        checks.push(cmd.command);
      }
      checks.push('');
    }
    
    // Determine priority
    let priority: Recommendation['priority'] = 'MEDIUM';
    if (config.cves?.some(c => (c.cvss || 0) >= 9)) {
      priority = 'CRITICAL';
    } else if (config.cves?.some(c => (c.cvss || 0) >= 7)) {
      priority = 'HIGH';
    }
    
    recs.push({
      priority,
      category: `${config.name} (${uniqueHosts.length} hosts)`,
      targets: uniqueIPs,
      icon: getPriorityIcon(priority),
      checks: checks.filter(Boolean),
    });
  }

  // Add unknown services recommendation
  if (analysis.unknownServices.length > 0) {
    const unknownPorts = [...new Set(analysis.unknownServices.map(s => s.port))];
    const unknownHosts = [...new Set(analysis.unknownServices.map(s => s.hostIp))];
    
    recs.push({
      priority: 'LOW',
      category: `Unknown Services (${analysis.unknownServices.length} services)`,
      targets: unknownHosts,
      icon: '❓',
      checks: [
        `# ${analysis.unknownServices.length} unknown/unclassified services detected`,
        `# Unique ports: ${unknownPorts.slice(0, 10).join(', ')}${unknownPorts.length > 10 ? '...' : ''}`,
        '',
        '## Recommended enumeration:',
        `nmap -sV -sC -p${unknownPorts.slice(0, 20).join(',')} ${unknownHosts.slice(0, 5).join(' ')}`,
        '',
        '## Review in Unknown Services tab for details',
      ],
    });
  }

  // Sort by priority
  const priorityOrder: Record<string, number> = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  return recs.sort((a, b) => {
    const prioDiff = (priorityOrder[a.priority] ?? 4) - (priorityOrder[b.priority] ?? 4);
    if (prioDiff !== 0) return prioDiff;
    return b.targets.length - a.targets.length;
  });
}

/**
 * Get icon for priority level
 */
function getPriorityIcon(priority: string): string {
  const icons: Record<string, string> = {
    'CRITICAL': '🔴',
    'HIGH': '🟠',
    'MEDIUM': '🟡',
    'LOW': '🔵',
  };
  return icons[priority] || '📌';
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export targets in various formats
 */
export function exportTargets(
  hosts: Host[],
  category: string,
  format: 'ip' | 'ip:port' | 'url' | 'csv' | 'json'
): string {
  const upHosts = hosts.filter((h) => h.state === 'up');
  let targets: { ip: string; port?: number; service?: string; hostname?: string }[] = [];

  if (category === 'dc') {
    // Domain controllers
    const adResult = detectADInfrastructure(hosts);
    if (adResult) {
      targets = adResult.domainControllers
        .filter(dc => dc.host.state === 'up')
        .map(dc => ({ 
          ip: dc.host.ip, 
          hostname: dc.host.hostname 
        }));
    }
  } else if (category === 'unknown') {
    // Unknown services
    const unknownServices = otherHandler.getUnknownServices();
    targets = unknownServices.map(s => ({
      ip: s.hostIp,
      port: s.port,
      service: s.serviceName,
    }));
  } else if (category === 'all') {
    targets = upHosts.map((h) => ({ ip: h.ip, hostname: h.hostname }));
  } else {
    // Specific category
    const cat = SERVICE_CATEGORIES[category];
    if (cat) {
      upHosts.forEach((host) => {
        const openPorts = host.ports.filter((p) => p.state === 'open');
        const matched = openPorts.filter(
          (p) => cat.ports.includes(p.number) || cat.services.some((s) => p.service.toLowerCase().includes(s.toLowerCase()))
        );
        matched.forEach((p) => targets.push({ ip: host.ip, port: p.number, service: p.service, hostname: host.hostname }));
      });
    }
  }

  if (format === 'json') return JSON.stringify(targets, null, 2);

  if (format === 'csv') {
    const header = 'ip,port,service,hostname';
    const rows = targets.map((t) => `${t.ip},${t.port || ''},${t.service || ''},${t.hostname || ''}`);
    return [header, ...rows].join('\n');
  }

  return targets
    .map((t) => {
      if (format === 'ip') return t.ip;
      if (format === 'ip:port') return t.port ? `${t.ip}:${t.port}` : t.ip;
      if (format === 'url') {
        const proto = t.port === 443 || t.port === 8443 ? 'https' : 'http';
        return t.port ? `${proto}://${t.ip}:${t.port}` : t.ip;
      }
      return t.ip;
    })
    .join('\n');
}

/**
 * Get top services by frequency
 */
export function getTopServices(hosts: Host[]): { service: string; count: number; port?: number }[] {
  const counts = new Map<string, { count: number; port?: number }>();

  hosts.forEach((host) => {
    if (host.state !== 'up') return;
    host.ports.forEach((port) => {
      if (port.state !== 'open') return;
      const key = port.service;
      const existing = counts.get(key);
      counts.set(key, { count: (existing?.count || 0) + 1, port: port.number });
    });
  });

  return Array.from(counts.entries())
    .map(([service, data]) => ({ service, ...data }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/**
 * Get the OtherHandler instance for UI access
 */
export function getOtherHandler() {
  return otherHandler;
}

// Re-export types and matcher for external use
export { ServiceMatcher, otherHandler };
export type { MatchResult, UnknownService, ServiceConfig };
