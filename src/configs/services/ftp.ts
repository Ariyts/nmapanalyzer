import { ServiceConfig } from './types';

/**
 * FTP Configuration
 * 
 * File Transfer Protocol.
 * Often allows anonymous access and has clear-text credentials.
 */
export const ftpConfig: ServiceConfig = {
  id: 'ftp',
  name: 'FTP (File Transfer Protocol)',
  category: 'file_sharing',
  description: 'File Transfer Protocol for file transfers. Uses clear-text authentication and often allows anonymous access.',

  triggers: [
    { ports: [21], services: ['ftp'] },
    { products: ['vsftpd', 'ProFTPD', 'Pure-FTPd', 'Microsoft FTP Service', 'FileZilla'] },
    { bannerPatterns: ['FTP', 'vsFTPd', 'ProFTPD', 'FileZilla'] },
  ],

  defaultPriority: 'MEDIUM',
  riskScore: 5,
  highValuePorts: [21],
  highValueReason: 'FTP may allow anonymous access and transmits credentials in clear text',

  techniques: [
    {
      id: 'ftp-info',
      name: 'Banner Grab',
      description: 'Get FTP server banner',
      tools: ['nmap', 'netcat'],
      commands: [
        'nmap -sV -p 21 {ip}',
        'nc -vn {ip} 21',
      ],
      priority: 'LOW',
    },
    {
      id: 'ftp-anonymous',
      name: 'Anonymous Login',
      description: 'Check for anonymous FTP access',
      tools: ['nmap', 'ftp'],
      commands: [
        'nmap --script ftp-anon -p 21 {ip}',
        'ftp {ip}',
        '# User: anonymous, Pass: anything',
      ],
      priority: 'HIGH',
    },
    {
      id: 'ftp-bruteforce',
      name: 'Brute Force',
      description: 'Test for weak credentials',
      mitreId: 'T1110',
      tools: ['hydra', 'medusa', 'ncrack'],
      commands: [
        'hydra -l admin -P passwords.txt ftp://{ip}',
        'hydra -L users.txt -P passwords.txt ftp://{ip}',
        'medusa -h {ip} -u admin -P passwords.txt -M ftp',
      ],
      priority: 'HIGH',
    },
    {
      id: 'ftp-enum',
      name: 'Directory Enumeration',
      description: 'List files and directories',
      tools: ['ftp', 'wget'],
      commands: [
        'ftp {ip}',
        '# ls, cd, get files',
        'wget -r ftp://user:pass@{ip}/',
      ],
      priority: 'MEDIUM',
    },
    {
      id: 'ftp-bounce',
      name: 'Bounce Attack',
      description: 'Use FTP server as proxy',
      tools: ['nmap', 'metasploit'],
      commands: [
        'nmap -b username:pass@ftp-server:21 target',
        '# Metasploit: use auxiliary/scanner/portscan/ftpbounce',
      ],
      priority: 'MEDIUM',
    },
    {
      id: 'ftp-vuln-scan',
      name: 'Vulnerability Scan',
      description: 'Scan for known FTP vulnerabilities',
      tools: ['nmap'],
      commands: [
        'nmap --script ftp-vuln* -p 21 {ip}',
        'nmap --script ftp-proftpd-backdoor -p 21 {ip}',
        'nmap --script ftp-vsftpd-backdoor -p 21 {ip}',
      ],
      priority: 'HIGH',
    },
    {
      id: 'ftp-sniff',
      name: 'Credential Sniffing',
      description: 'Capture clear-text credentials',
      mitreId: 'T1040',
      tools: ['wireshark', 'tcpdump'],
      commands: [
        'tcpdump -i eth0 port 21 -w ftp_capture.pcap',
        '# Or use Wireshark filter: ftp',
      ],
      priority: 'HIGH',
    },
  ],

  references: [
    { type: 'cwe', id: 'CWE-287', description: 'Improper Authentication' },
    { type: 'cwe', id: 'CWE-319', description: 'Cleartext Transmission' },
  ],

  uiConfig: {
    icon: 'upload',
    color: '#6b7280',
    tags: ['FTP', 'File Transfer', 'Clear-text'],
  },
};
