/**
 * Telnet Service Configuration
 * Telnet Protocol
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const telnetConfig: ServiceConfig = {
  id: 'telnet',
  name: 'Telnet',
  description: 'Telnet - устаревший текстовый протокол удаленного доступа. Передает данные (включая пароли) в открытом виде. Часто встречается на старых системах, сетевом оборудовании (роутеры, свитчи) и IoT устройствах.',
  categoryId: 'remote-access',
  version: '1.0.0',
  tags: ['remote-access', 'legacy', 'cleartext', 'iot', 'networking'],

  matchers: {
    serviceNames: ['telnet', 'login', 'shell'],
    bannerRegex: [
      'login:',
      'Username:',
      'Password:',
      'Welcome to',
      'User Access Verification',
      '\\xff\\xfb',  // Telnet IAC sequences
    ],
    productPatterns: ['Cisco', 'Huawei', 'Juniper', 'Telnetd'],
    standardPorts: [23, 2323],
    nseScriptMatchers: [
      { scriptName: 'telnet-encryption', outputPattern: '.' },
      { scriptName: 'telnet-brute', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 25,

  techniques: [
    {
      id: 'telnet-enum',
      name: 'Telnet Enumeration',
      mitreId: 'T1046',
      description: 'Определение типа системы и версии по баннеру Telnet. Часто раскрывает устройство и версию ОС.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 23 --script banner,telnet-encryption <target>', description: 'Telnet banner grab' },
        { tool: 'nc', command: 'nc -nv <target> 23', description: 'Netcat banner grab' },
        { tool: 'telnet', command: 'telnet <target> 23', description: 'Manual connection' },
      ],
      nseScripts: [
        { name: 'banner', description: 'Получение баннера', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'banner-grab'],
    },
    {
      id: 'telnet-bruteforce',
      name: 'Telnet Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных Telnet. Эффективен против IoT устройств и сетевого оборудования с заводскими паролями.',
      commands: [
        { tool: 'hydra', command: 'hydra -L users.txt -P passwords.txt telnet://<target> -t 4', description: 'Telnet brute force' },
        { tool: 'medusa', command: 'medusa -h <target> -U users.txt -P passwords.txt -M telnet', description: 'Medusa telnet brute force' },
        { tool: 'ncrack', command: 'ncrack -p 23 -U users.txt -P passwords.txt <target>', description: 'Ncrack telnet brute force' },
      ],
      difficulty: 'easy',
      notes: 'Попробуйте заводские пароли: admin/admin, root/root, admin/password, cisco/cisco',
      tags: ['bruteforce', 'authentication', 'iot'],
    },
    {
      id: 'telnet-sniffing',
      name: 'Telnet Credential Sniffing',
      mitreId: 'T1040',
      description: 'Перехват Telnet-сессий в сети. Данные передаются в открытом виде, включая пароли.',
      commands: [
        { tool: 'tcpdump', command: 'tcpdump -i eth0 -A port 23', description: 'Capture telnet traffic' },
        { tool: 'wireshark', command: 'wireshark -k -f "port 23"', description: 'Wireshark capture' },
        { tool: 'ettercap', command: 'ettercap -T -M arp:remote /gateway/ /target/ -P repoison_arp', description: 'MITM for telnet' },
      ],
      difficulty: 'medium',
      prerequisites: ['Позиция в сети для перехвата трафика'],
      tags: ['sniffing', 'mitm', 'cleartext'],
    },
    {
      id: 'telnet-default-creds',
      name: 'Default Credentials Check',
      mitreId: 'T1078.001',
      description: 'Проверка заводских паролей по умолчанию для различных устройств.',
      commands: [
        { tool: 'hydra', command: 'hydra -C defaults.txt telnet://<target>', description: 'Default creds check' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/telnet/telnet_login', description: 'MSF telnet login scanner' },
      ],
      difficulty: 'easy',
      notes: 'База заводских паролей: https://github.com/danielmiessler/SecLists/tree/master/Passwords/Default-Credentials',
      tags: ['default-credentials', 'iot', 'misconfiguration'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'terminal',
    color: '#6b7280',
    displayPriority: 70,
  },

  references: [
    { title: 'Telnet Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-telnet' },
    { title: 'Default Passwords', url: 'https://cirt.net/passwords' },
  ],

  notes: 'Telnet часто встречается на CTF и IoT устройствах. Заводские пароли очень распространены. Проверяйте нестандартные порты (2323, 23231). В реальных сетях Telnet должен быть заменен на SSH.',
};

export default telnetConfig;
