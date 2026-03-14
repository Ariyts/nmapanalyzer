/**
 * IMAP Service Configuration
 * Internet Message Access Protocol
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const imapConfig: ServiceConfig = {
  id: 'imap',
  name: 'IMAP (Internet Message Access Protocol)',
  description: 'IMAP - протокол доступа к электронной почте. Позволяет клиентам читать почту на сервере без загрузки. Почтовые ящики могут содержать чувствительную информацию.',
  categoryId: 'mail',
  version: '1.0.0',
  tags: ['mail', 'imap', 'email', 'communication'],

  matchers: {
    serviceNames: ['imap', 'imaps', 'imap2', 'imap3'],
    cpePatterns: ['cpe:/a:dovecot:dovecot', 'cpe:/a:courier:imap'],
    bannerRegex: [
      '\\* OK.*IMAP',
      '\\* OK.*Dovecot',
      'Courier-IMAP',
      '\\* CAPABILITY.*IMAP',
    ],
    productPatterns: ['Dovecot', 'Courier', 'Cyrus', 'Microsoft Exchange'],
    standardPorts: [143, 993],
    nseScriptMatchers: [
      { scriptName: 'imap-capabilities', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'imap-enum',
      name: 'IMAP Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о IMAP сервере.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 143,993 --script imap-capabilities <target>', description: 'IMAP capabilities' },
        { tool: 'openssl', command: 'openssl s_client -connect <target>:993', description: 'IMAPS connection' },
        { tool: 'nc', command: 'nc <target> 143', description: 'Banner grab' },
      ],
      nseScripts: [
        { name: 'imap-capabilities', description: 'Get IMAP capabilities', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'imap-bruteforce',
      name: 'IMAP Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных IMAP.',
      commands: [
        { tool: 'hydra', command: 'hydra -l user -P passwords.txt imap://<target>', description: 'IMAP brute force' },
        { tool: 'medusa', command: 'medusa -h <target> -u user -P passwords.txt -M imap', description: 'Medusa IMAP brute force' },
      ],
      difficulty: 'medium',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'imap-read-mail',
      name: 'Read Emails',
      mitreId: 'T1114',
      description: 'Чтение почты после получения доступа.',
      commands: [
        { tool: 'curl', command: 'curl -u user:pass imap://<target>/INBOX', description: 'List inbox' },
        { tool: 'mutt', command: 'mutt -f imap://user:pass@target/INBOX', description: 'Mutt IMAP client' },
      ],
      difficulty: 'medium',
      prerequisites: ['Учетные данные IMAP'],
      tags: ['data-exfiltration', 'email'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'inbox',
    color: '#8b5cf6',
    displayPriority: 70,
  },

  references: [
    { title: 'IMAP Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-imap' },
  ],

  notes: 'IMAP часто идет в паре с SMTP. После получения доступа проверяйте папки с чувствительной информацией.',
};

export default imapConfig;
