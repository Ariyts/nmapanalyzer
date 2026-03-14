import { ServiceConfig } from './types';

/**
 * Printer/JetDirect Configuration
 * 
 * Network printers and print services.
 * Often overlooked attack vector.
 */
export const printerConfig: ServiceConfig = {
  id: 'printer',
  name: 'Network Printer',
  category: 'peripheral',
  description: 'Network printers and print services. Often overlooked but can be used for lateral movement and data exfiltration.',

  triggers: [
    { ports: [9100], services: ['jetdirect'] },
    { ports: [515], services: ['printer', 'lpd'] },
    { ports: [631], services: ['ipp'] },
    { products: ['HP JetDirect', 'LPRng', 'CUPS'] },
  ],

  defaultPriority: 'LOW',
  riskScore: 4,
  highValuePorts: [9100],

  techniques: [
    {
      id: 'printer-info',
      name: 'Information Gathering',
      description: 'Get printer information',
      tools: ['nmap', 'snmpwalk'],
      commands: [
        'nmap -sV -p 9100,515,631 {ip}',
        'snmpwalk -v 1 -c public {ip}',
      ],
      priority: 'LOW',
    },
    {
      id: 'printer-pjl',
      name: 'PJL Commands',
      description: 'Execute PJL commands',
      tools: ['netcat', 'pjl'],
      commands: [
        'echo -e "\\e%-12345X@PJL\\n@PJL INFO ID\\n\\e%-12345X" | nc {ip} 9100',
        '# Read files: @PJL FSDOWNLOAD FORMAT:BINARY',
        '# Write files: @PJL FSUPLOAD',
      ],
      priority: 'HIGH',
    },
    {
      id: 'printer-tftp',
      name: 'TFTP Access',
      description: 'Check for TFTP service',
      tools: ['tftp'],
      commands: [
        'tftp {ip}',
        '# GET config file',
        '# PUT malicious file',
      ],
      priority: 'MEDIUM',
    },
    {
      id: 'printer-ipp',
      name: 'IPP Exploitation',
      description: 'Check for IPP vulnerabilities',
      tools: ['ipp-enum', 'curl'],
      commands: [
        'curl -X POST http://{ip}:631/printers/',
        '# CVE-2020-3898 - CUPS RCE',
      ],
      priority: 'HIGH',
    },
    {
      id: 'printer-firmware',
      name: 'Firmware Update',
      description: 'Upload malicious firmware',
      tools: ['custom'],
      commands: [
        '# Some printers accept unsigned firmware',
        '# Could backdoor the printer',
      ],
      priority: 'CRITICAL',
    },
    {
      id: 'printer-ldap-passback',
      name: 'LDAP Passback',
      description: 'Capture LDAP credentials',
      mitreId: 'T1187',
      tools: ['responder'],
      commands: [
        '# Configure printer LDAP to your server',
        '# Capture credentials when it authenticates',
        'responder -I eth0',
      ],
      priority: 'HIGH',
    },
  ],

  references: [
    { type: 'cwe', id: 'CWE-306', description: 'Missing Authentication' },
    { type: 'blog', url: 'https://blog.trendmicro.com/hacking-network-printers-may-lead-to-internal-network-access/', description: 'Printer Hacking' },
  ],

  uiConfig: {
    icon: 'printer',
    color: '#6b7280',
    tags: ['Printer', 'JetDirect', 'Peripheral', 'IoT'],
  },
};
