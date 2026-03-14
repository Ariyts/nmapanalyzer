import { Host, ScanInfo } from '../types';

export function generateMockHosts(scanSource: string, seed: number = 0): Host[] {
  const hosts: Host[] = [];

  // DC01
  hosts.push({
    ip: '10.10.10.1',
    hostname: 'DC01.corp.company.local',
    osDetection: 'Windows Server 2019',
    state: 'up',
    scanSource,
    tags: ['DC', 'Domain Services'],
    isDC: true,
    dcConfidence: 1.0,
    domain: 'corp.company.local',
    ports: [
      { number: 53, protocol: 'tcp', state: 'open', service: 'domain', version: 'Microsoft DNS 10.0' },
      { number: 88, protocol: 'tcp', state: 'open', service: 'kerberos-sec', version: 'Microsoft Windows Kerberos' },
      { number: 135, protocol: 'tcp', state: 'open', service: 'msrpc', version: 'Microsoft Windows RPC' },
      { number: 139, protocol: 'tcp', state: 'open', service: 'netbios-ssn', version: 'Microsoft netbios-ssn' },
      { number: 389, protocol: 'tcp', state: 'open', service: 'ldap', version: 'Microsoft Windows AD LDAP' },
      { number: 445, protocol: 'tcp', state: 'open', service: 'microsoft-ds', version: 'Windows Server 2019 microsoft-ds' },
      { number: 464, protocol: 'tcp', state: 'open', service: 'kpasswd5', version: '' },
      { number: 636, protocol: 'tcp', state: 'open', service: 'tcpwrapped', version: '' },
      { number: 3268, protocol: 'tcp', state: 'open', service: 'msft-gc', version: 'Microsoft Windows Active Directory LDAP' },
      { number: 3269, protocol: 'tcp', state: 'open', service: 'tcpwrapped', version: '' },
      { number: 3389, protocol: 'tcp', state: 'open', service: 'ms-wbt-server', version: 'Microsoft Terminal Services' },
      { number: 5985, protocol: 'tcp', state: 'open', service: 'http', version: 'Microsoft HTTPAPI httpd 2.0' },
    ],
    mac: '00:0C:29:A1:B2:C3',
  });

  // DC02
  hosts.push({
    ip: '10.10.10.2',
    hostname: 'DC02.corp.company.local',
    osDetection: 'Windows Server 2019',
    state: 'up',
    scanSource,
    tags: ['DC', 'Domain Services'],
    isDC: true,
    dcConfidence: 1.0,
    domain: 'corp.company.local',
    ports: [
      { number: 53, protocol: 'tcp', state: 'open', service: 'domain', version: 'Microsoft DNS 10.0' },
      { number: 88, protocol: 'tcp', state: 'open', service: 'kerberos-sec', version: 'Microsoft Windows Kerberos' },
      { number: 135, protocol: 'tcp', state: 'open', service: 'msrpc', version: 'Microsoft Windows RPC' },
      { number: 139, protocol: 'tcp', state: 'open', service: 'netbios-ssn', version: 'Microsoft netbios-ssn' },
      { number: 389, protocol: 'tcp', state: 'open', service: 'ldap', version: 'Microsoft Windows AD LDAP' },
      { number: 445, protocol: 'tcp', state: 'open', service: 'microsoft-ds', version: 'Windows Server 2019 microsoft-ds' },
      { number: 464, protocol: 'tcp', state: 'open', service: 'kpasswd5', version: '' },
      { number: 636, protocol: 'tcp', state: 'open', service: 'tcpwrapped', version: '' },
      { number: 3268, protocol: 'tcp', state: 'open', service: 'msft-gc', version: 'Microsoft Windows Active Directory LDAP' },
      { number: 3389, protocol: 'tcp', state: 'open', service: 'ms-wbt-server', version: 'Microsoft Terminal Services' },
    ],
    mac: '00:0C:29:A1:B2:C4',
  });

  // Possible DC
  hosts.push({
    ip: '10.10.10.5',
    hostname: undefined,
    osDetection: 'Windows Server 2016',
    state: 'up',
    scanSource,
    tags: ['Domain Services'],
    isDC: true,
    dcConfidence: 0.6,
    domain: 'corp.company.local',
    ports: [
      { number: 88, protocol: 'tcp', state: 'open', service: 'kerberos-sec', version: '' },
      { number: 389, protocol: 'tcp', state: 'open', service: 'ldap', version: '' },
      { number: 445, protocol: 'tcp', state: 'open', service: 'microsoft-ds', version: '' },
    ],
  });

  // Web servers
  for (let i = 10; i < 25; i++) {
    hosts.push({
      ip: `10.10.${seed + 20}.${i}`,
      hostname: `WEB${String(i - 9).padStart(2, '0')}.corp.company.local`,
      osDetection: i % 3 === 0 ? 'Linux 4.15' : 'Windows Server 2016',
      state: 'up',
      scanSource,
      tags: ['Web'],
      ports: [
        { number: 80, protocol: 'tcp', state: 'open', service: 'http', version: i % 2 === 0 ? 'Apache httpd 2.4.41' : 'nginx 1.18.0' },
        { number: 443, protocol: 'tcp', state: 'open', service: 'https', version: i % 2 === 0 ? 'Apache httpd 2.4.41' : 'nginx 1.18.0' },
        ...(i % 4 === 0 ? [{ number: 8080, protocol: 'tcp' as const, state: 'open' as const, service: 'http-proxy', version: 'Apache Tomcat 9.0' }] : []),
        ...(i % 5 === 0 ? [{ number: 8443, protocol: 'tcp' as const, state: 'open' as const, service: 'https-alt', version: '' }] : []),
      ],
    });
  }

  // SMB / File servers
  for (let i = 30; i < 50; i++) {
    hosts.push({
      ip: `10.10.${seed + 10}.${i}`,
      hostname: `FS${String(i - 29).padStart(2, '0')}.corp.company.local`,
      osDetection: 'Windows Server 2016',
      state: 'up',
      scanSource,
      tags: ['File Server', 'SMB'],
      domain: 'corp.company.local',
      ports: [
        { number: 135, protocol: 'tcp', state: 'open', service: 'msrpc', version: 'Microsoft Windows RPC' },
        { number: 139, protocol: 'tcp', state: 'open', service: 'netbios-ssn', version: '' },
        { number: 445, protocol: 'tcp', state: 'open', service: 'microsoft-ds', version: 'Windows Server 2016' },
        ...(i % 3 === 0 ? [{ number: 3389, protocol: 'tcp' as const, state: 'open' as const, service: 'ms-wbt-server', version: 'Microsoft Terminal Services' }] : []),
      ],
    });
  }

  // Database servers
  const dbPorts = [
    { number: 1433, service: 'ms-sql-s', version: 'Microsoft SQL Server 2019', tag: 'MSSQL' },
    { number: 3306, service: 'mysql', version: 'MySQL 8.0.26', tag: 'MySQL' },
    { number: 5432, service: 'postgresql', version: 'PostgreSQL 13.3', tag: 'PostgreSQL' },
    { number: 27017, service: 'mongod', version: 'MongoDB 4.4.6', tag: 'MongoDB' },
    { number: 6379, service: 'redis', version: 'Redis key-value store', tag: 'Redis' },
    { number: 9200, service: 'wap-wsp', version: 'Elasticsearch REST API 7.14.0', tag: 'Elasticsearch' },
  ];

  for (let i = 0; i < 12; i++) {
    const db = dbPorts[i % dbPorts.length];
    hosts.push({
      ip: `10.10.${seed + 30}.${i + 10}`,
      hostname: `DB${String(i + 1).padStart(2, '0')}.corp.company.local`,
      osDetection: i % 2 === 0 ? 'Windows Server 2019' : 'Linux 5.4',
      state: 'up',
      scanSource,
      tags: ['Database', db.tag],
      domain: i % 2 === 0 ? 'corp.company.local' : undefined,
      ports: [
        { number: db.number, protocol: 'tcp', state: 'open', service: db.service, version: db.version },
        ...(i % 2 === 0 ? [{ number: 445, protocol: 'tcp' as const, state: 'open' as const, service: 'microsoft-ds', version: '' }] : []),
        { number: 22, protocol: 'tcp', state: 'open', service: 'ssh', version: 'OpenSSH 7.9' },
      ],
    });
  }

  // Remote access hosts
  for (let i = 50; i < 75; i++) {
    hosts.push({
      ip: `10.10.${seed + 40}.${i}`,
      hostname: `WS${String(i - 49).padStart(2, '0')}.corp.company.local`,
      osDetection: i % 3 === 0 ? 'Linux 5.4' : 'Windows 10',
      state: 'up',
      scanSource,
      tags: i % 3 === 0 ? ['SSH'] : ['RDP'],
      domain: 'corp.company.local',
      ports: [
        ...(i % 3 === 0
          ? [{ number: 22, protocol: 'tcp' as const, state: 'open' as const, service: 'ssh', version: 'OpenSSH 8.2p1' }]
          : [
              { number: 3389, protocol: 'tcp' as const, state: 'open' as const, service: 'ms-wbt-server', version: 'Microsoft Terminal Services' },
              { number: 445, protocol: 'tcp' as const, state: 'open' as const, service: 'microsoft-ds', version: '' },
            ]),
        ...(i % 7 === 0 ? [{ number: 5985, protocol: 'tcp' as const, state: 'open' as const, service: 'http', version: 'WinRM' }] : []),
      ],
    });
  }

  // Mail server
  hosts.push({
    ip: '10.10.10.25',
    hostname: 'MAIL01.corp.company.local',
    osDetection: 'Windows Server 2019',
    state: 'up',
    scanSource,
    tags: ['Mail'],
    domain: 'corp.company.local',
    ports: [
      { number: 25, protocol: 'tcp', state: 'open', service: 'smtp', version: 'Microsoft ESMTP 10.0.17763.1' },
      { number: 110, protocol: 'tcp', state: 'open', service: 'pop3', version: '' },
      { number: 143, protocol: 'tcp', state: 'open', service: 'imap', version: '' },
      { number: 443, protocol: 'tcp', state: 'open', service: 'https', version: 'Microsoft HTTPAPI 2.0' },
      { number: 465, protocol: 'tcp', state: 'open', service: 'smtps', version: '' },
      { number: 587, protocol: 'tcp', state: 'open', service: 'submission', version: '' },
      { number: 993, protocol: 'tcp', state: 'open', service: 'imaps', version: '' },
    ],
  });

  // Printers
  for (let i = 0; i < 5; i++) {
    hosts.push({
      ip: `10.10.10.${200 + i}`,
      hostname: `PRINTER${i + 1}`,
      osDetection: 'Embedded Linux',
      state: 'up',
      scanSource,
      tags: ['Printer'],
      ports: [
        { number: 80, protocol: 'tcp', state: 'open', service: 'http', version: 'HP Embedded HTTP' },
        { number: 443, protocol: 'tcp', state: 'open', service: 'https', version: '' },
        { number: 9100, protocol: 'tcp', state: 'open', service: 'jetdirect', version: '' },
        { number: 161, protocol: 'udp', state: 'open', service: 'snmp', version: '' },
      ],
    });
  }

  // Down hosts
  for (let i = 100; i < 115; i++) {
    hosts.push({
      ip: `10.10.50.${i}`,
      hostname: undefined,
      osDetection: undefined,
      state: 'down',
      scanSource,
      tags: [],
      ports: [],
    });
  }

  return hosts;
}

export function generateFullScanHosts(scanSource: string): Host[] {
  const baseHosts = generateMockHosts(scanSource, 0);

  // Add new hosts discovered in full scan
  const newHosts: Host[] = [
    {
      ip: '10.10.10.50',
      hostname: 'HIDDEN01.corp.company.local',
      osDetection: 'Linux 5.4',
      state: 'up',
      scanSource,
      tags: ['Web', 'Database'],
      ports: [
        { number: 80, protocol: 'tcp', state: 'open', service: 'http', version: 'nginx 1.20.0' },
        { number: 3306, protocol: 'tcp', state: 'open', service: 'mysql', version: 'MySQL 5.7' },
        { number: 6379, protocol: 'tcp', state: 'open', service: 'redis', version: 'Redis 6.2' },
      ],
    },
    {
      ip: '10.10.10.51',
      hostname: 'HIDDEN02.corp.company.local',
      osDetection: 'Windows Server 2012 R2',
      state: 'up',
      scanSource,
      tags: ['Remote Access'],
      ports: [
        { number: 3389, protocol: 'tcp', state: 'open', service: 'ms-wbt-server', version: '' },
        { number: 5985, protocol: 'tcp', state: 'open', service: 'http', version: 'WinRM' },
      ],
    },
    {
      ip: '10.10.10.52',
      hostname: undefined,
      osDetection: 'Linux 4.19',
      state: 'up',
      scanSource,
      tags: ['Database'],
      ports: [
        { number: 9200, protocol: 'tcp', state: 'open', service: 'wap-wsp', version: 'Elasticsearch 7.14' },
        { number: 5601, protocol: 'tcp', state: 'open', service: 'http', version: 'Kibana 7.14' },
      ],
    },
  ];

  // Modify some existing hosts (add new ports)
  const modifiedHosts = baseHosts.map((host) => {
    if (host.ip === '10.10.20.10') {
      return {
        ...host,
        ports: [
          ...host.ports,
          { number: 3306, protocol: 'tcp' as const, state: 'open' as const, service: 'mysql', version: 'MySQL 8.0' },
          { number: 6379, protocol: 'tcp' as const, state: 'open' as const, service: 'redis', version: 'Redis 6.2' },
        ],
      };
    }
    if (host.ip === '10.10.20.11') {
      return {
        ...host,
        ports: [
          ...host.ports,
          { number: 8080, protocol: 'tcp' as const, state: 'open' as const, service: 'http-proxy', version: 'Apache Tomcat 9.0' },
          { number: 9200, protocol: 'tcp' as const, state: 'open' as const, service: 'wap-wsp', version: 'Elasticsearch 7.14' },
        ],
      };
    }
    if (host.ip === '10.10.30.10') {
      return {
        ...host,
        ports: [
          ...host.ports,
          { number: 1433, protocol: 'tcp' as const, state: 'open' as const, service: 'ms-sql-s', version: 'MSSQL 2019' },
        ],
      };
    }
    return host;
  });

  return [...modifiedHosts, ...newHosts];
}

export function buildScanInfo(name: string, filename: string, hosts: Host[]): ScanInfo {
  const hostsUp = hosts.filter((h) => h.state === 'up');
  const hostsDown = hosts.filter((h) => h.state === 'down');
  const totalOpenPorts = hostsUp.reduce((sum, h) => sum + h.ports.filter((p) => p.state === 'open').length, 0);

  return {
    name,
    filename,
    loadedAt: new Date().toISOString(),
    totalHosts: hosts.length,
    hostsUp: hostsUp.length,
    hostsDown: hostsDown.length,
    totalOpenPorts,
    hosts,
  };
}

export const DEMO_SCAN_BASELINE = buildScanInfo(
  'project_top100',
  'project_top100.xml',
  generateMockHosts('project_top100')
);

export const DEMO_SCAN_FULL = buildScanInfo(
  'project_full',
  'project_full.xml',
  generateFullScanHosts('project_full')
);
