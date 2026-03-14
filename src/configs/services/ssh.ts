/**
 * SSH Service Configuration
 * Secure Shell remote access service
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const sshConfig: ServiceConfig = {
  // ===== META =====
  id: 'ssh',
  name: 'SSH (Secure Shell)',
  description: 'SSH - криптографический сетевой протокол для безопасной удаленной Administration. Широко используется для управления серверами, сетевым оборудованием и другими системами. Поддерживает аутентификацию по ключам и паролям.',
  categoryId: 'remote-access',
  version: '1.0.0',
  tags: ['remote-access', 'encryption', 'authentication', 'linux', 'networking'],

  // ===== MATCHERS (CTF-aware) =====
  matchers: {
    // Priority 1: Service name from Nmap -sV
    serviceNames: ['ssh', 'openssh', 'ssh2', 'dropbear', 'libssh'],
    
    // Priority 2: CPE patterns
    cpePatterns: ['cpe:/a:openbsd:openssh', 'cpe:/a:dropbear_ssh', 'cpe:/a:libssh'],
    
    // Priority 3: Banner regex patterns
    bannerRegex: [
      'SSH-\\d\\.\\d-OpenSSH[\\w\\.-]*',
      'SSH-\\d\\.\\d-dropbear',
      'SSH-\\d\\.\\d-libssh',
      'SSH-\\d\\.\\d-',
    ],
    
    // Priority 4: Product patterns
    productPatterns: ['OpenSSH', 'Dropbear', 'libssh', 'PuTTY', 'Tectia'],
    
    // Standard ports (fallback)
    standardPorts: [22, 2222, 22222, 8022],
    
    // NSE script matchers
    nseScriptMatchers: [
      { scriptName: 'ssh-auth-methods', outputPattern: '.' },
      { scriptName: 'ssh-hostkey', outputPattern: '.' },
      { scriptName: 'ssh2-enum-algos', outputPattern: '.' },
    ],
  },

  // Confidence threshold (lower to catch non-standard ports)
  confidenceThreshold: 25,

  // ===== TECHNIQUES =====
  techniques: [
    {
      id: 'ssh-enum-users',
      name: 'User Enumeration',
      mitreId: 'T1087',
      description: 'Перечисление пользователей через timing-атаки, валидацию пользователей при аутентификации или методы error-based enumeration.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 22 --script ssh-auth-methods,ssh-brute <target>', description: 'Определение методов аутентификации' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/ssh/ssh_enumusers', description: 'Enumeration пользователей через SSH' },
        { tool: 'kerbrute', command: 'kerbrute userenum -d <domain> users.txt --ssh <target>', description: 'SSH user enumeration' },
      ],
      nseScripts: [
        { name: 'ssh-auth-methods', description: 'Определение поддерживаемых методов аутентификации', safe: true },
      ],
      requiredTools: ['nmap', 'metasploit'],
      difficulty: 'easy',
      tags: ['enumeration', 'users', 'authentication'],
    },
    {
      id: 'ssh-bruteforce',
      name: 'Brute Force Attack',
      mitreId: 'T1110',
      description: 'Подбор паролей для SSH-доступа. Эффективен при слабых паролях и отсутствии fail2ban.',
      commands: [
        { tool: 'hydra', command: 'hydra -L users.txt -P passwords.txt ssh://<target> -t 4', description: 'SSH brute force с Hydra' },
        { tool: 'medusa', command: 'medusa -h <target> -U users.txt -P passwords.txt -M ssh', description: 'SSH brute force с Medusa' },
        { tool: 'ncrack', command: 'ncrack -p 22 -U users.txt -P passwords.txt <target>', description: 'SSH brute force с Ncrack' },
        { tool: 'patator', command: 'patator ssh_login host=<target> user=FILE0 password=FILE1 0=users.txt 1=passwords.txt', description: 'SSH brute force с Patator' },
      ],
      requiredTools: ['hydra', 'medusa', 'ncrack'],
      difficulty: 'easy',
      prerequisites: ['Список потенциальных пользователей', 'Словарь паролей'],
      tags: ['bruteforce', 'password', 'authentication'],
    },
    {
      id: 'ssh-key-theft',
      name: 'SSH Key Theft',
      mitreId: 'T1562.001',
      description: 'Поиск и кража SSH-ключей на скомпрометированной системе для lateral movement.',
      commands: [
        { tool: 'bash', command: 'find / -name "id_rsa*" -o -name "*.pem" 2>/dev/null', description: 'Поиск приватных SSH ключей' },
        { tool: 'bash', command: 'cat ~/.ssh/authorized_keys ~/.ssh/known_hosts 2>/dev/null', description: 'Проверка authorized_keys и known_hosts' },
        { tool: 'bash', command: 'ls -la /home/*/.ssh/ 2>/dev/null', description: 'SSH директории всех пользователей' },
      ],
      difficulty: 'medium',
      tags: ['post-exploitation', 'keys', 'lateral-movement'],
    },
    {
      id: 'ssh-version-vuln',
      name: 'Version-Specific Vulnerabilities',
      description: 'Эксплуатация уязвимостей в конкретных версиях SSH-серверов.',
      cves: [
        { cveId: 'CVE-2024-6387', cvss: 7.5, description: 'regreSSHion - Remote code execution in OpenSSH', exploitAvailable: true },
        { cveId: 'CVE-2018-15473', cvss: 5.3, description: 'OpenSSH user enumeration via timing attack' },
        { cveId: 'CVE-2016-0777', cvss: 4.6, description: 'OpenSSH client information disclosure' },
      ],
      commands: [
        { tool: 'nmap', command: 'nmap -p 22 --script sshvuln <target>', description: 'Проверка уязвимостей SSH' },
        { tool: 'searchsploit', command: 'searchsploit openssh <version>', description: 'Поиск эксплоитов для версии' },
      ],
      nseScripts: [
        { name: 'sshvuln', description: 'Проверка известных SSH уязвимостей', safe: true },
      ],
      difficulty: 'medium',
      tags: ['vulnerability', 'exploitation', 'version-specific'],
    },
    {
      id: 'ssh-weak-crypto',
      name: 'Weak Cryptography Detection',
      description: 'Определение слабых криптографических алгоритмов и устаревших протоколов.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 22 --script ssh2-enum-algos <target>', description: 'Перечисление поддерживаемых алгоритмов' },
        { tool: 'ssh-audit', command: 'ssh-audit <target>', description: 'Аудит SSH конфигурации' },
        { tool: 'sslscan', command: 'sslscan --ssh <target>', description: 'Сканер SSH шифров' },
      ],
      nseScripts: [
        { name: 'ssh2-enum-algos', description: 'Перечисление поддерживаемых алгоритмов шифрования', safe: true },
      ],
      difficulty: 'easy',
      tags: ['crypto', 'audit', 'hardening'],
    },
    {
      id: 'ssh-tunneling',
      name: 'SSH Tunneling & Port Forwarding',
      mitreId: 'T1572',
      description: 'Использование SSH для создания туннелей и обхода сетевых ограничений.',
      commands: [
        { tool: 'ssh', command: 'ssh -L <local_port>:<target>:<target_port> user@pivot', description: 'Local port forwarding' },
        { tool: 'ssh', command: 'ssh -R <remote_port>:<local_host>:<local_port> user@pivot', description: 'Remote port forwarding' },
        { tool: 'ssh', command: 'ssh -D <local_port> user@target', description: 'Dynamic SOCKS proxy' },
        { tool: 'ssh', command: 'ssh -w 0:1 root@target', description: 'VPN tunnel через SSH' },
      ],
      difficulty: 'medium',
      tags: ['tunneling', 'pivoting', 'evasion'],
    },
  ],

  // ===== TRIGGERS =====
  triggers: [
    {
      techniqueId: 'ssh-version-vuln',
      conditions: [
        { type: 'version', operator: 'regex', value: 'OpenSSH_7\\.[0-4]' },
        { type: 'version', operator: 'regex', value: 'OpenSSH_8\\.[0-6]' },
      ],
    },
    {
      techniqueId: 'ssh-weak-crypto',
      conditions: [
        { type: 'nse_output', operator: 'contains', value: 'arcfour', field: 'ssh2-enum-algos' },
        { type: 'nse_output', operator: 'contains', value: 'ssh-dss', field: 'ssh2-enum-algos' },
      ],
    },
  ],

  // ===== UI =====
  ui: {
    icon: 'terminal',
    color: '#22c55e',
    displayPriority: 100,
    sections: [
      { id: 'enumeration', title: 'Enumeration', defaultExpanded: true },
      { id: 'exploitation', title: 'Exploitation', defaultExpanded: true },
      { id: 'post-exploitation', title: 'Post-Exploitation', defaultExpanded: false },
    ],
  },

  // ===== REFERENCES =====
  references: [
    { title: 'SSH Penetration Testing Guide', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-ssh' },
    { title: 'SSH Security Best Practices', url: 'https://www.ssh.com/academy/ssh/security' },
    { title: 'OpenSSH Security', url: 'https://www.openssh.com/security.html' },
  ],

  notes: 'SSH часто работает на нестандартных портах в CTF (2222, 22222, 8022). Всегда проверяйте banner для определения версии. Dropbear часто используется во встраиваемых системах.',
};

export default sshConfig;
