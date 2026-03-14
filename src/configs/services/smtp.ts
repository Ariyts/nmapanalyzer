/**
 * SMTP Service Configuration
 * Simple Mail Transfer Protocol
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const smtpConfig: ServiceConfig = {
  id: 'smtp',
  name: 'SMTP (Simple Mail Transfer Protocol)',
  description: 'SMTP - протокол отправки электронной почты. Почтовые серверы часто содержат чувствительную информацию и могут быть вектором фишинга, спуфинга или relay-атак.',
  categoryId: 'mail',
  version: '1.0.0',
  tags: ['mail', 'smtp', 'email', 'phishing', 'communication'],

  matchers: {
    serviceNames: ['smtp', 'smtps', 'submission'],
    cpePatterns: ['cpe:/a:postfix:postfix', 'cpe:/a:sendmail:sendmail', 'cpe:/a:microsoft:exchange'],
    bannerRegex: [
      '220.*SMTP',
      '220.*ESMTP',
      'Postfix',
      'Sendmail',
      'Microsoft ESMTP',
      'Exim',
      '220.*Mail',
    ],
    productPatterns: ['Postfix', 'Sendmail', 'Exim', 'Microsoft Exchange', 'Dovecot'],
    standardPorts: [25, 465, 587, 2525],
    nseScriptMatchers: [
      { scriptName: 'smtp-commands', outputPattern: '.' },
      { scriptName: 'smtp-open-relay', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 30,

  techniques: [
    {
      id: 'smtp-enum',
      name: 'SMTP Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о SMTP сервере: версия, поддерживаемые команды.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 25,587 --script smtp-commands,smtp-ntlm-info <target>', description: 'SMTP enumeration' },
        { tool: 'nc', command: 'nc -nv <target> 25', description: 'Banner grab' },
        { tool: 'telnet', command: 'telnet <target> 25', description: 'Manual connection' },
      ],
      nseScripts: [
        { name: 'smtp-commands', description: 'List supported commands', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'banner-grab'],
    },
    {
      id: 'smtp-user-enum',
      name: 'User Enumeration',
      mitreId: 'T1087',
      description: 'Перечисление пользователей через VRFY, EXPN, RCPT TO команды.',
      commands: [
        { tool: 'smtp-user-enum', command: 'smtp-user-enum -M VRFY -U users.txt -t <target>', description: 'VRFY enumeration' },
        { tool: 'smtp-user-enum', command: 'smtp-user-enum -M RCPT -U users.txt -t <target>', description: 'RCPT enumeration' },
        { tool: 'nmap', command: 'nmap -p 25 --script smtp-enum-users <target>', description: 'NSE user enum' },
      ],
      nseScripts: [
        { name: 'smtp-enum-users', description: 'Enumerate users via SMTP', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'users', 'reconnaissance'],
    },
    {
      id: 'smtp-open-relay',
      name: 'Open Relay Test',
      description: 'Проверка на открытый relay - позволяет отправлять почту от любого имени.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 25 --script smtp-open-relay <target>', description: 'Open relay test' },
        { tool: 'telnet', command: 'telnet <target> 25 -> MAIL FROM: spoofed@fake.com -> RCPT TO: victim@external.com', description: 'Manual relay test' },
      ],
      nseScripts: [
        { name: 'smtp-open-relay', description: 'Test for open relay', safe: true },
      ],
      difficulty: 'easy',
      tags: ['misconfiguration', 'relay', 'spam'],
    },
    {
      id: 'smtp-bruteforce',
      name: 'SMTP Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных SMTP AUTH.',
      commands: [
        { tool: 'hydra', command: 'hydra -L users.txt -P passwords.txt smtp://<target>', description: 'SMTP brute force' },
        { tool: 'medusa', command: 'medusa -h <target> -U users.txt -P passwords.txt -M smtp', description: 'Medusa SMTP brute force' },
      ],
      difficulty: 'medium',
      tags: ['bruteforce', 'authentication'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'mail',
    color: '#f59e0b',
    displayPriority: 75,
  },

  references: [
    { title: 'SMTP Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-smtp' },
  ],

  notes: 'SMTP часто раскрывает информацию о внутренней инфраструктуре. VRFY/EXPN могут быть отключены. Проверяйте open relay для спуфинга. Exchange часто на порту 587 с аутентификацией.',
};

export default smtpConfig;
