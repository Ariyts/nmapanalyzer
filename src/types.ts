export interface Script {
  name: string;
  output: string;
}

export interface Port {
  number: number;
  protocol: 'tcp' | 'udp';
  state: 'open' | 'filtered' | 'closed';
  service: string;
  version?: string;
  scripts?: Script[];
}

export interface Host {
  ip: string;
  hostname?: string;
  mac?: string;
  osDetection?: string;
  ports: Port[];
  state: 'up' | 'down';
  scanSource: string;
  tags?: string[];
  isDC?: boolean;
  dcConfidence?: number;
  domain?: string;
}

export interface ScanInfo {
  name: string;
  filename: string;
  loadedAt: string;
  totalHosts: number;
  hostsUp: number;
  hostsDown: number;
  totalOpenPorts: number;
  hosts: Host[];
}

export interface PortChanges {
  newPorts: Port[];
  removedPorts: number[];
  serviceChanges: { port: number; oldService: string; newService: string }[];
}

export interface ScanDiff {
  scan1Name: string;
  scan2Name: string;
  newHosts: Host[];
  removedHosts: string[];
  portChanges: Record<string, PortChanges>;
  newPortsCount: number;
  highValueFindings: { ip: string; port: number; service: string; reason: string }[];
}

export interface ServiceGroup {
  category: string;
  label: string;
  color: string;
  hosts: Host[];
  ports: { ip: string; port: Port }[];
}

export interface Recommendation {
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  targets: string[];
  checks: string[];
  icon: string;
}

export interface ADInfrastructure {
  domain?: string;
  domainControllers: { host: Host; confidence: number }[];
  possibleDCs: { host: Host; confidence: number }[];
  domainJoinedHosts: Host[];
}
