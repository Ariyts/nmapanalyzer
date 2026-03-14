/**
 * DNS Service Configuration
 * Domain Name System
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const dnsConfig: ServiceConfig = {
  id: 'dns',
  name: 'DNS (Domain Name System)',
  description: 'DNS - система доменных имен, критически важная инфраструктура. DNS-серверы могут быть скомпрометированы для фишинга, перехвата трафика, обхода защит. Active Directory DNS содержит информацию о домене.',
  categoryId: 'directory',
  version: '1.0.0',
  tags: ['directory', 'dns', 'infrastructure', 'active-directory'],

  matchers: {
    serviceNames: ['domain', 'dns', 'dns-udp', 'dns-tcp'],
    cpePatterns: ['cpe:/a:isc:bind', 'cpe:/a:microsoft:dns', 'cpe:/a:powerdns:authoritative'],
    bannerRegex: [
      'BIND',
      'PowerDNS',
      'Microsoft DNS',
    ],
    productPatterns: ['BIND', 'Microsoft DNS', 'PowerDNS', 'Unbound', 'dnsmasq'],
    standardPorts: [53],
    nseScriptMatchers: [
      { scriptName: 'dns-nsid', outputPattern: '.' },
      { scriptName: 'dns-recursion', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'dns-enum',
      name: 'DNS Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации через DNS запросы.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 53 --script dns-nsid,dns-recursion <target>', description: 'DNS enumeration' },
        { tool: 'dig', command: 'dig @<target> version.bind chaos txt', description: 'Get BIND version' },
        { tool: 'dnsenum', command: 'dnsenum domain.local --dnsserver <target>', description: 'DNS enumeration' },
        { tool: 'dnsrecon', command: 'dnsrecon -d domain.local -n <target>', description: 'DNSRecon scan' },
      ],
      nseScripts: [
        { name: 'dns-nsid', description: 'DNS NSID', safe: true },
        { name: 'dns-recursion', description: 'Check recursion', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'dns-zone-transfer',
      name: 'Zone Transfer (AXFR)',
      description: 'Попытка получения полной копии DNS зоны.',
      commands: [
        { tool: 'dig', command: 'dig @<target> domain.local AXFR', description: 'AXFR zone transfer' },
        { tool: 'host', command: 'host -t axfr domain.local <target>', description: 'Host AXFR' },
        { tool: 'nmap', command: 'nmap -p 53 --script dns-zone-transfer --script-args dns-zone-transfer.domain=domain.local <target>', description: 'NSE zone transfer' },
      ],
      difficulty: 'easy',
      tags: ['zone-transfer', 'misconfiguration', 'information-disclosure'],
    },
    {
      id: 'dns-bruteforce',
      name: 'DNS Brute Force',
      mitreId: 'T1590.002',
      description: 'Перебор поддоменов.',
      commands: [
        { tool: 'gobuster', command: 'gobuster dns -d domain.local -r <target> -w subdomains.txt', description: 'Gobuster DNS brute' },
        { tool: 'dnsrecon', command: 'dnsrecon -d domain.local -n <target> -D subdomains.txt -t brt', description: 'DNSRecon brute' },
        { tool: 'ffuf', command: 'ffuf -u http://FUZZ.domain.local -w subdomains.txt', description: 'FFUF DNS fuzz' },
      ],
      difficulty: 'medium',
      tags: ['bruteforce', 'subdomain-enum', 'reconnaissance'],
    },
    {
      id: 'dns-spoofing',
      name: 'DNS Spoofing/Cache Poisoning',
      mitreId: 'T1557.001',
      description: 'Подмена DNS-ответов для перенаправления трафика.',
      commands: [
        { tool: 'ettercap', command: 'ettercap -T -M arp:remote /gateway/ /target/ -P dns_spoof', description: 'DNS spoofing via Ettercap' },
        { tool: 'responder', command: 'responder -I eth0 -wF', description: 'WPAD/LLMNR spoofing' },
      ],
      difficulty: 'medium',
      prerequisites: ['MITM позиция в сети'],
      tags: ['spoofing', 'mitm', 'phishing'],
    },
    {
      id: 'dns-tunneling',
      name: 'DNS Tunneling',
      mitreId: 'T1071.004',
      description: 'Туннелирование данных через DNS.',
      commands: [
        { tool: 'dnscat2', command: 'ruby dnscat2.rb domain.local', description: 'DNS tunnel server' },
        { tool: 'iodine', command: 'iodined -f -c -P password 10.0.0.1 domain.local', description: 'Iodine DNS tunnel' },
      ],
      difficulty: 'hard',
      tags: ['tunneling', 'exfiltration', 'c2'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'globe-2',
    color: '#06b6d4',
    displayPriority: 80,
  },

  references: [
    { title: 'DNS Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-dns' },
  ],

  notes: 'Zone Transfer (AXFR) - классическая находка. DNS Version disclosure раскрывает версию BIND. Проверяйте recursion для open resolvers. AD DNS содержит SRV записи для поиска контроллеров.',
};

export default dnsConfig;
