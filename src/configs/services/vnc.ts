/**
 * VNC Service Configuration
 * Virtual Network Computing
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const vncConfig: ServiceConfig = {
  id: 'vnc',
  name: 'VNC (Virtual Network Computing)',
  description: 'VNC - система удаленного доступа к рабочему столу, использующая RFB-протокол. Популярна на Linux-системах. Часто плохо защищена: слабые пароли, незашифрованное соединение, уязвимые версии.',
  categoryId: 'remote-access',
  version: '1.0.0',
  tags: ['remote-access', 'graphical', 'linux', 'cross-platform'],

  matchers: {
    serviceNames: ['vnc', 'rfb', 'vnc-http', 'tightvnc', 'realvnc', 'x11vnc'],
    cpePatterns: ['cpe:/a:realvnc:vnc', 'cpe:/a:tightvnc:tightvnc', 'cpe:/a:x11vnc'],
    bannerRegex: [
      'RFB\\s*\\d{3}\\.\\d{3}',  // RFB protocol version
      'VNC',
      'TightVNC',
      'RealVNC',
      'x11vnc',
    ],
    productPatterns: ['VNC', 'TightVNC', 'RealVNC', 'UltraVNC', 'x11vnc', 'TigerVNC'],
    standardPorts: [5900, 5901, 5902, 5903, 5904, 5905, 5906, 5907, 5908, 5909, 5800], // 5900+N for display N, 5800 for HTTP
    nseScriptMatchers: [
      { scriptName: 'vnc-info', outputPattern: '.' },
      { scriptName: 'realvnc-auth-bypass', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 30,

  techniques: [
    {
      id: 'vnc-enum',
      name: 'VNC Enumeration',
      mitreId: 'T1046',
      description: 'Определение версии VNC-сервера и поддерживаемых методов аутентификации.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 5900-5910 --script vnc-info <target>', description: 'VNC enumeration' },
        { tool: 'vncsnapshot', command: 'vncsnapshot -help <target>:0 snapshot.jpg', description: 'VNC screenshot' },
      ],
      nseScripts: [
        { name: 'vnc-info', description: 'Информация о VNC сервере', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'vnc-bruteforce',
      name: 'VNC Brute Force',
      mitreId: 'T1110',
      description: 'Подбор пароля VNC. VNC использует ограниченный набор символов (до 8 символов), что упрощает брутфорс.',
      commands: [
        { tool: 'hydra', command: 'hydra -P passwords.txt vnc://<target> -t 1', description: 'VNC brute force' },
        { tool: 'medusa', command: 'medusa -h <target> -P passwords.txt -M vnc', description: 'Medusa VNC brute force' },
        { tool: 'patator', command: 'patator vnc_login host=<target> password=FILE0 0=passwords.txt', description: 'Patator VNC brute force' },
      ],
      difficulty: 'easy',
      notes: 'VNC пароли обычно короткие (до 8 символов). Часто используются пустые пароли или пароли по умолчанию.',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'vnc-auth-bypass',
      name: 'VNC Auth Bypass',
      description: 'Эксплуатация уязвимостей аутентификации VNC.',
      cves: [
        { cveId: 'CVE-2006-2369', cvss: 7.5, description: 'RealVNC 4.1.1 auth bypass', exploitAvailable: true },
        { cveId: 'CVE-2019-15687', cvss: 9.8, description: 'TightVNC buffer overflow', exploitAvailable: true },
      ],
      commands: [
        { tool: 'metasploit', command: 'use exploit/windows/vnc/realvnc_client', description: 'VNC client exploit' },
        { tool: 'nmap', command: 'nmap -p 5900 --script realvnc-auth-bypass <target>', description: 'Auth bypass check' },
      ],
      difficulty: 'medium',
      tags: ['vulnerability', 'auth-bypass'],
    },
    {
      id: 'vnc-password-crack',
      name: 'VNC Password Cracking',
      description: 'Восстановление пароля VNC из конфигурационных файлов или registry.',
      commands: [
        { tool: 'vncpwd', command: 'vncpwd <encrypted_password>', description: 'Decrypt VNC password' },
        { tool: 'bash', command: 'cat ~/.vnc/passwd', description: 'Linux VNC password file' },
        { tool: 'reg', command: 'reg query HKLM\\SOFTWARE\\RealVNC\\vncserver /v Password', description: 'Windows registry password' },
      ],
      difficulty: 'medium',
      prerequisites: ['Доступ к конфигурационным файлам VNC'],
      tags: ['post-exploitation', 'password-cracking'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'tv',
    color: '#f59e0b',
    displayPriority: 80,
  },

  references: [
    { title: 'VNC Penetration Testing', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-vnc' },
  ],

  notes: 'VNC часто работает на нестандартных портах в CTF. Проверяйте диапазон 5900-5999. Display :0 = port 5900, :1 = 5901 и т.д. Также проверяйте HTTP-интерфейс на порту 5800+.',
};

export default vncConfig;
