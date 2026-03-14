/**
 * POP3 Service Configuration
 * Post Office Protocol 3
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const pop3Config: ServiceConfig = {
  id: 'pop3',
  name: 'POP3 (Post Office Protocol 3)',
  description: 'POP3 - протокол получения электронной почты. Скачивает почту на клиент и (обычно) удаляет с сервера. Простой протокол, часто атакуется через брутфорс.',
  categoryId: 'mail',
  version: '1.0.0',
  tags: ['mail', 'pop3', 'email', 'communication'],

  matchers: {
    serviceNames: ['pop3', 'pop3s', 'pop-3'],
    cpePatterns: ['cpe:/a:dovecot:dovecot', 'cpe:/a:courier:pop3'],
    bannerRegex: [
      '\\+OK.*POP3',
      '\\+OK.*Dovecot',
      'Courier POP3',
      '\\+OK.*Mail Server',
    ],
    productPatterns: ['Dovecot', 'Courier', 'Cyrus', 'Microsoft Exchange', 'Qpopper'],
    standardPorts: [110, 995],
    nseScriptMatchers: [
      { scriptName: 'pop3-capabilities', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'pop3-enum',
      name: 'POP3 Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о POP3 сервере.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 110,995 --script pop3-capabilities <target>', description: 'POP3 capabilities' },
        { tool: 'nc', command: 'nc <target> 110', description: 'Banner grab' },
        { tool: 'openssl', command: 'openssl s_client -connect <target>:995', description: 'POP3S connection' },
      ],
      nseScripts: [
        { name: 'pop3-capabilities', description: 'Get POP3 capabilities', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'pop3-bruteforce',
      name: 'POP3 Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных POP3.',
      commands: [
        { tool: 'hydra', command: 'hydra -l user -P passwords.txt pop3://<target>', description: 'POP3 brute force' },
        { tool: 'medusa', command: 'medusa -h <target> -u user -P passwords.txt -M pop3', description: 'Medusa POP3 brute force' },
        { tool: 'nmap', command: 'nmap -p 110 --script pop3-brute <target>', description: 'NSE brute force' },
      ],
      difficulty: 'medium',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'pop3-read-mail',
      name: 'Read Emails',
      mitreId: 'T1114',
      description: 'Чтение почты после получения доступа.',
      commands: [
        { tool: 'telnet', command: 'telnet <target> 110 -> USER user -> PASS pass -> LIST -> RETR 1', description: 'Manual POP3 commands' },
        { tool: 'fetchmail', command: 'fetchmail -p pop3 -u user -p pass <target>', description: 'Fetchmail download' },
      ],
      difficulty: 'medium',
      prerequisites: ['Учетные данные POP3'],
      tags: ['data-exfiltration', 'email'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'mail',
    color: '#6b7280',
    displayPriority: 65,
  },

  references: [
    { title: 'POP3 Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-pop3' },
  ],

  notes: 'POP3 проще IMAP - только скачивание почты. Часто идет в паре с SMTP. Проверяйте старые версии на уязвимости buffer overflow.',
};

export default pop3Config;
