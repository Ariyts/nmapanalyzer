import { Host, ScanInfo, ScanDiff, PortChanges, ServiceGroup, ADInfrastructure, Recommendation } from '../types';

export const SERVICE_CATEGORIES: Record<string, { label: string; ports: number[]; services: string[]; color: string }> = {
  web: {
    label: 'Web',
    ports: [80, 443, 8080, 8443, 8000, 8888, 8008, 9443, 4443],
    services: ['http', 'https', 'http-proxy', 'ssl/http', 'https-alt'],
    color: '#3b82f6',
  },
  smb: {
    label: 'SMB',
    ports: [445, 139],
    services: ['microsoft-ds', 'netbios-ssn'],
    color: '#f59e0b',
  },
  remote_access: {
    label: 'Remote Access',
    ports: [22, 3389, 5985, 5986, 5900, 5901, 23],
    services: ['ssh', 'ms-wbt-server', 'wsman', 'vnc', 'telnet'],
    color: '#8b5cf6',
  },
  databases: {
    label: 'Databases',
    ports: [1433, 3306, 5432, 1521, 27017, 6379, 9200, 5984],
    services: ['ms-sql-s', 'mysql', 'postgresql', 'oracle', 'mongod', 'redis', 'wap-wsp'],
    color: '#ef4444',
  },
  mail: {
    label: 'Mail',
    ports: [25, 110, 143, 465, 587, 993, 995],
    services: ['smtp', 'pop3', 'imap', 'smtps', 'submission', 'imaps'],
    color: '#10b981',
  },
  domain_services: {
    label: 'Domain Services',
    ports: [53, 88, 389, 636, 3268, 3269, 464, 135],
    services: ['domain', 'kerberos-sec', 'ldap', 'tcpwrapped', 'msft-gc', 'msrpc', 'kpasswd5'],
    color: '#f97316',
  },
  printers: {
    label: 'Printers',
    ports: [9100, 515, 631],
    services: ['jetdirect', 'printer', 'ipp'],
    color: '#6b7280',
  },
};

export const HIGH_VALUE_PORTS: Record<number, string> = {
  9200: 'Elasticsearch (often misconfigured)',
  6379: 'Redis (often no auth)',
  3306: 'MySQL (possible data access)',
  1433: 'MSSQL (check for weak creds)',
  27017: 'MongoDB (often no auth)',
  5984: 'CouchDB (check admin party)',
  5985: 'WinRM (remote code execution)',
  5986: 'WinRM HTTPS',
  23: 'Telnet (cleartext creds)',
};

export function classifyServices(hosts: Host[]): ServiceGroup[] {
  const groups: ServiceGroup[] = [];

  Object.entries(SERVICE_CATEGORIES).forEach(([key, cat]) => {
    const matchingHosts: Host[] = [];
    const matchingPorts: { ip: string; port: (typeof hosts)[0]['ports'][0] }[] = [];

    hosts.forEach((host) => {
      if (host.state !== 'up') return;
      const openPorts = host.ports.filter((p) => p.state === 'open');
      const matched = openPorts.filter(
        (p) => cat.ports.includes(p.number) || cat.services.some((s) => p.service.toLowerCase().includes(s))
      );
      if (matched.length > 0) {
        matchingHosts.push(host);
        matched.forEach((mp) => matchingPorts.push({ ip: host.ip, port: mp }));
      }
    });

    if (matchingHosts.length > 0) {
      groups.push({
        category: key,
        label: cat.label,
        color: cat.color,
        hosts: matchingHosts,
        ports: matchingPorts,
      });
    }
  });

  return groups.sort((a, b) => b.hosts.length - a.hosts.length);
}

export function detectADInfrastructure(hosts: Host[]): ADInfrastructure {
  const dcs: { host: Host; confidence: number }[] = [];
  const possibleDCs: { host: Host; confidence: number }[] = [];

  hosts.forEach((host) => {
    if (host.state !== 'up') return;
    if (host.isDC && host.dcConfidence !== undefined) {
      if (host.dcConfidence >= 0.8) dcs.push({ host, confidence: host.dcConfidence });
      else if (host.dcConfidence >= 0.4) possibleDCs.push({ host, confidence: host.dcConfidence });
    }
  });

  // Detect domain from DC hostnames or LDAP banners
  let domain: string | undefined;
  dcs.forEach((dc) => {
    if (dc.host.domain && !domain) domain = dc.host.domain;
  });
  if (!domain) {
    possibleDCs.forEach((dc) => {
      if (dc.host.domain && !domain) domain = dc.host.domain;
    });
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
          highValueFindings.push({ ip, port: port.number, service: port.service, reason: HIGH_VALUE_PORTS[port.number] });
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
        highValueFindings.push({ ip: host.ip, port: port.number, service: port.service, reason: HIGH_VALUE_PORTS[port.number] });
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

export function generateRecommendations(hosts: Host[]): Recommendation[] {
  const recs: Recommendation[] = [];
  const upHosts = hosts.filter((h) => h.state === 'up');

  // AD / DC
  const dcHosts = upHosts.filter((h) => h.isDC && (h.dcConfidence || 0) >= 0.8);
  if (dcHosts.length > 0) {
    const domain = dcHosts[0].domain || '{domain}';
    const dcIPs = dcHosts.map((h) => h.ip);
    recs.push({
      priority: 'CRITICAL',
      category: 'Active Directory',
      targets: dcIPs,
      icon: '🔴',
      checks: [
        `# Active Directory detected — Domain: ${domain}`,
        `GetNPUsers.py ${domain}/ -no-pass -usersfile users.txt`,
        `GetUserSPNs.py ${domain}/user:pass -dc-ip ${dcIPs[0]}`,
        `bloodhound-python -d ${domain} -u user -p pass -ns ${dcIPs[0]} -c all`,
        `ldapsearch -x -H ldap://${dcIPs[0]} -b '' -s base namingContexts`,
        `kerbrute userenum --dc ${dcIPs[0]} -d ${domain} users.txt`,
        `crackmapexec smb ${dcIPs.join(',')} --shares`,
      ],
    });
  }

  // SMB
  const smbHosts = upHosts.filter((h) => h.ports.some((p) => p.number === 445 && p.state === 'open'));
  if (smbHosts.length > 0) {
    recs.push({
      priority: 'HIGH',
      category: `SMB (${smbHosts.length} hosts)`,
      targets: smbHosts.map((h) => h.ip),
      icon: '🟠',
      checks: [
        `crackmapexec smb targets.txt --shares`,
        `crackmapexec smb targets.txt --sessions`,
        `crackmapexec smb targets.txt --gen-relay-list relay_targets.txt`,
        `enum4linux-ng {ip}`,
        `nmap --script smb-vuln* {ip}`,
        `nmap --script smb-vuln-ms17-010 {ip}`,
        `smbclient -L //{ip} -N`,
      ],
    });
  }

  // MSSQL
  const mssqlHosts = upHosts.filter((h) => h.ports.some((p) => p.number === 1433 && p.state === 'open'));
  if (mssqlHosts.length > 0) {
    recs.push({
      priority: 'HIGH',
      category: `MSSQL (${mssqlHosts.length} hosts)`,
      targets: mssqlHosts.map((h) => h.ip),
      icon: '🟠',
      checks: [
        `crackmapexec mssql {ip} -u sa -p ''`,
        `crackmapexec mssql {ip} -u sa -p sa`,
        `mssqlclient.py domain/user:pass@{ip}`,
        `nmap -p 1433 --script ms-sql-info,ms-sql-config,ms-sql-ntlm-info {ip}`,
        `Check xp_cmdshell availability`,
      ],
    });
  }

  // WinRM
  const winrmHosts = upHosts.filter((h) => h.ports.some((p) => [5985, 5986].includes(p.number) && p.state === 'open'));
  if (winrmHosts.length > 0) {
    recs.push({
      priority: 'HIGH',
      category: `WinRM (${winrmHosts.length} hosts)`,
      targets: winrmHosts.map((h) => h.ip),
      icon: '🟠',
      checks: [
        `crackmapexec winrm {ip} -u user -p pass`,
        `evil-winrm -i {ip} -u user -p pass`,
      ],
    });
  }

  // Redis
  const redisHosts = upHosts.filter((h) => h.ports.some((p) => p.number === 6379 && p.state === 'open'));
  if (redisHosts.length > 0) {
    recs.push({
      priority: 'HIGH',
      category: `Redis (${redisHosts.length} hosts)`,
      targets: redisHosts.map((h) => h.ip),
      icon: '🟠',
      checks: [
        `redis-cli -h {ip} INFO`,
        `redis-cli -h {ip} CONFIG GET *`,
        `redis-cli -h {ip} CONFIG SET dir /var/www/html`,
        `Check unauthenticated access and SLAVEOF for RCE`,
      ],
    });
  }

  // Elasticsearch
  const esHosts = upHosts.filter((h) => h.ports.some((p) => p.number === 9200 && p.state === 'open'));
  if (esHosts.length > 0) {
    recs.push({
      priority: 'HIGH',
      category: `Elasticsearch (${esHosts.length} hosts)`,
      targets: esHosts.map((h) => h.ip),
      icon: '🟠',
      checks: [
        `curl http://{ip}:9200/_cat/indices`,
        `curl http://{ip}:9200/_cluster/settings`,
        `curl http://{ip}:9200/_nodes`,
        `Check for unauthenticated access and data exposure`,
      ],
    });
  }

  // Web
  const webHosts = upHosts.filter((h) =>
    h.ports.some((p) => [80, 443, 8080, 8443, 8000].includes(p.number) && p.state === 'open')
  );
  if (webHosts.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      category: `Web Servers (${webHosts.length} hosts)`,
      targets: webHosts.map((h) => h.ip),
      icon: '🟡',
      checks: [
        `whatweb {url}`,
        `nikto -h {url}`,
        `gobuster dir -u {url} -w /usr/share/wordlists/dirb/common.txt`,
        `nuclei -u {url}`,
        `Check for default credentials`,
        `Check for known CVEs based on detected technology`,
      ],
    });
  }

  // RDP
  const rdpHosts = upHosts.filter((h) => h.ports.some((p) => p.number === 3389 && p.state === 'open'));
  if (rdpHosts.length > 0) {
    recs.push({
      priority: 'MEDIUM',
      category: `RDP (${rdpHosts.length} hosts)`,
      targets: rdpHosts.map((h) => h.ip),
      icon: '🟡',
      checks: [
        `nmap --script rdp-enum-encryption -p 3389 {ip}`,
        `nmap --script rdp-vuln-ms12-020 -p 3389 {ip}`,
        `hydra -L users.txt -P pass.txt rdp://{ip}`,
        `Check NLA (Network Level Authentication)`,
        `Check BlueKeep CVE-2019-0708`,
      ],
    });
  }

  return recs;
}

export function exportTargets(
  hosts: Host[],
  category: string,
  format: 'ip' | 'ip:port' | 'url' | 'csv' | 'json'
): string {
  const upHosts = hosts.filter((h) => h.state === 'up');
  let targets: { ip: string; port?: number; service?: string; hostname?: string }[] = [];

  const cat = SERVICE_CATEGORIES[category];
  if (category === 'dc') {
    targets = upHosts
      .filter((h) => h.isDC && (h.dcConfidence || 0) >= 0.8)
      .map((h) => ({ ip: h.ip, hostname: h.hostname }));
  } else if (category === 'all' || !cat) {
    targets = upHosts.map((h) => ({ ip: h.ip, hostname: h.hostname }));
  } else {
    upHosts.forEach((host) => {
      const openPorts = host.ports.filter((p) => p.state === 'open');
      const matched = openPorts.filter(
        (p) => cat.ports.includes(p.number) || cat.services.some((s) => p.service.toLowerCase().includes(s))
      );
      matched.forEach((p) => targets.push({ ip: host.ip, port: p.number, service: p.service, hostname: host.hostname }));
    });
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
