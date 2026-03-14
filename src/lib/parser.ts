import { Host, Port, ScanInfo } from '../types';
import { buildScanInfo } from '../data/mockData';

function parsePortElement(portData: Element): Port | null {
  const state = portData.querySelector('state');
  if (!state || state.getAttribute('state') !== 'open') return null;

  const portNum = parseInt(portData.getAttribute('portid') || '0');
  const protocol = (portData.getAttribute('protocol') || 'tcp') as 'tcp' | 'udp';
  const serviceEl = portData.querySelector('service');
  const service = serviceEl?.getAttribute('name') || 'unknown';
  const product = serviceEl?.getAttribute('product') || '';
  const version = serviceEl?.getAttribute('version') || '';
  const versionStr = [product, version].filter(Boolean).join(' ');

  const scripts: { name: string; output: string }[] = [];
  portData.querySelectorAll('script').forEach((s) => {
    scripts.push({ name: s.getAttribute('id') || '', output: s.getAttribute('output') || '' });
  });

  return {
    number: portNum,
    protocol,
    state: 'open',
    service,
    version: versionStr || undefined,
    scripts,
  };
}

function parseHostElement(hostEl: Element, scanSource: string): Host {
  const statusEl = hostEl.querySelector('status');
  const state = (statusEl?.getAttribute('state') || 'down') as 'up' | 'down';

  // IP
  let ip = '';
  hostEl.querySelectorAll('address').forEach((addr) => {
    if (addr.getAttribute('addrtype') === 'ipv4') ip = addr.getAttribute('addr') || '';
  });

  // MAC
  let mac: string | undefined;
  hostEl.querySelectorAll('address').forEach((addr) => {
    if (addr.getAttribute('addrtype') === 'mac') mac = addr.getAttribute('addr') || undefined;
  });

  // Hostname
  let hostname: string | undefined;
  const hostnameEls = hostEl.querySelectorAll('hostnames hostname');
  if (hostnameEls.length > 0) hostname = hostnameEls[0].getAttribute('name') || undefined;

  // OS
  let osDetection: string | undefined;
  const osmatch = hostEl.querySelector('os osmatch');
  if (osmatch) osDetection = osmatch.getAttribute('name') || undefined;

  // Ports
  const ports: Port[] = [];
  hostEl.querySelectorAll('ports port').forEach((portEl) => {
    const port = parsePortElement(portEl);
    if (port) ports.push(port);
  });

  // Tags
  const tags = classifyHost(ports);

  // DC Detection
  const { isDC, confidence, domain } = detectDC(ports, hostname);

  return {
    ip,
    hostname,
    mac,
    osDetection,
    ports,
    state,
    scanSource,
    tags,
    isDC: isDC || undefined,
    dcConfidence: confidence > 0 ? confidence : undefined,
    domain: domain || undefined,
  };
}

function classifyHost(ports: Port[]): string[] {
  const tags = new Set<string>();
  const portNums = ports.map((p) => p.number);
  const services = ports.map((p) => p.service.toLowerCase());

  if (portNums.some((p) => [80, 443, 8080, 8443, 8000, 8888].includes(p))) tags.add('Web');
  if (portNums.some((p) => [445, 139].includes(p))) tags.add('SMB');
  if (portNums.some((p) => [22].includes(p)) || services.includes('ssh')) tags.add('SSH');
  if (portNums.some((p) => [3389].includes(p))) tags.add('RDP');
  if (portNums.some((p) => [5985, 5986].includes(p))) tags.add('WinRM');
  if (portNums.some((p) => [1433, 3306, 5432, 27017, 6379, 9200].includes(p))) tags.add('Database');
  if (portNums.some((p) => [88, 389, 636, 3268, 3269].includes(p))) tags.add('Domain Services');
  if (portNums.some((p) => [25, 110, 143, 465, 587, 993, 995].includes(p))) tags.add('Mail');
  if (portNums.some((p) => [9100].includes(p))) tags.add('Printer');

  return Array.from(tags);
}

function detectDC(ports: Port[], hostname?: string): { isDC: boolean; confidence: number; domain?: string } {
  const portNums = ports.map((p) => p.number);
  const hasKerberos = portNums.includes(88);
  const hasLDAP = portNums.includes(389);
  const hasDNS = portNums.includes(53);
  const hasGC = portNums.includes(3268);
  const hasLDAPS = portNums.includes(636);

  let confidence = 0;
  if (hasKerberos && hasLDAP) {
    confidence = 0.6;
    if (hasDNS) confidence = 0.8;
    if (hasDNS && (hasGC || hasLDAPS)) confidence = 1.0;
  } else if (hasLDAP) {
    confidence = 0.4;
  }

  let domain: string | undefined;
  if (hostname) {
    const parts = hostname.split('.');
    if (parts.length > 2) domain = parts.slice(1).join('.');
  }

  return { isDC: confidence >= 0.4, confidence, domain };
}

export function parseNmapXML(xmlContent: string, filename: string): ScanInfo {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, 'application/xml');

  const scanName = filename.replace(/\.(xml|nmap|gnmap)$/, '');
  const hosts: Host[] = [];

  doc.querySelectorAll('host').forEach((hostEl) => {
    hosts.push(parseHostElement(hostEl, scanName));
  });

  // Filter out hosts with no IP (parse errors)
  const validHosts = hosts.filter((h) => h.ip.length > 0);

  return buildScanInfo(scanName, filename, validHosts);
}

export function parseGNMAP(content: string, filename: string): ScanInfo {
  const scanName = filename.replace(/\.(xml|nmap|gnmap)$/, '');
  const hosts: Host[] = [];

  content.split('\n').forEach((line) => {
    if (!line.startsWith('Host:')) return;

    const ipMatch = line.match(/Host:\s+(\d+\.\d+\.\d+\.\d+)/);
    if (!ipMatch) return;
    const ip = ipMatch[1];

    const hostnameMatch = line.match(/\(([^)]+)\)/);
    const hostname = hostnameMatch ? hostnameMatch[1] : undefined;

    const ports: Port[] = [];
    const portsMatch = line.match(/Ports:\s+(.+?)(?:\s+Ignored|$)/);
    if (portsMatch) {
      portsMatch[1].split(',').forEach((portStr) => {
        const parts = portStr.trim().split('/');
        if (parts.length >= 4 && parts[1] === 'open') {
          ports.push({
            number: parseInt(parts[0]),
            protocol: parts[2] as 'tcp' | 'udp',
            state: 'open',
            service: parts[4] || 'unknown',
            version: parts[6] || undefined,
          });
        }
      });
    }

    const tags = classifyHost(ports);
    const { isDC, confidence, domain } = detectDC(ports, hostname);

    hosts.push({
      ip,
      hostname,
      state: 'up',
      scanSource: scanName,
      ports,
      tags,
      isDC: isDC || undefined,
      dcConfidence: confidence > 0 ? confidence : undefined,
      domain,
    });
  });

  return buildScanInfo(scanName, filename, hosts);
}
