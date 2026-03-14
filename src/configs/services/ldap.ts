/**
 * LDAP Service Configuration
 * Lightweight Directory Access Protocol
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const ldapConfig: ServiceConfig = {
  id: 'ldap',
  name: 'LDAP (Lightweight Directory Access Protocol)',
  description: 'LDAP - протокол доступа к каталогам, используется для хранения информации о пользователях, группах, ресурсах. Active Directory - основная реализация в Windows-средах. OpenLDAP - в Linux. Критически важен для аутентификации.',
  categoryId: 'directory',
  version: '1.0.0',
  tags: ['directory', 'ldap', 'active-directory', 'authentication', 'windows'],

  matchers: {
    serviceNames: ['ldap', 'ldaps', 'microsoft-ds', 'globalcatLDAP'],
    cpePatterns: ['cpe:/a:microsoft:active_directory', 'cpe:/a:openldap:openldap', 'cpe:/a:openldap'],
    bannerRegex: [
      'LDAP',
      'Active Directory',
      'domaincontroller',
      'domain controller',
    ],
    productPatterns: ['Microsoft Active Directory', 'OpenLDAP', '389 Directory Server'],
    standardPorts: [389, 636, 3268, 3269], // LDAP, LDAPS, Global Catalog
    nseScriptMatchers: [
      { scriptName: 'ldap-rootdse', outputPattern: '.' },
      { scriptName: 'ldap-search', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'ldap-enum',
      name: 'LDAP Enumeration',
      mitreId: 'T1087.002',
      description: 'Сбор информации о LDAP-каталоге: домен, пользователи, группы, политики.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 389,636 --script ldap-rootdse,ldap-search <target>', description: 'LDAP enumeration' },
        { tool: 'ldapsearch', command: 'ldapsearch -x -H ldap://<target> -b "" -s base "(objectclass=*)" namingContexts', description: 'Get base DN' },
        { tool: 'ldapsearch', command: 'ldapsearch -x -H ldap://<target> -b "DC=domain,DC=local" "(objectClass=user)"', description: 'Enumerate users' },
      ],
      nseScripts: [
        { name: 'ldap-rootdse', description: 'Get root DSE', safe: true },
        { name: 'ldap-search', description: 'LDAP search', safe: true },
      ],
      difficulty: 'medium',
      tags: ['enumeration', 'active-directory', 'users'],
    },
    {
      id: 'ldap-null-bind',
      name: 'Null Bind Attack',
      description: 'Подключение к LDAP без аутентификации (anonymous bind).',
      commands: [
        { tool: 'ldapsearch', command: 'ldapsearch -x -H ldap://<target> -b "DC=domain,DC=local"', description: 'Anonymous bind' },
        { tool: 'nmap', command: 'nmap -p 389 --script ldap-search --script-args ldap.searchattrs="*" <target>', description: 'Anonymous LDAP search' },
      ],
      difficulty: 'easy',
      tags: ['misconfiguration', 'anonymous', 'enumeration'],
    },
    {
      id: 'ldap-ad-enum',
      name: 'Active Directory Enumeration',
      mitreId: 'T1087.002',
      description: 'Комплексное перечисление Active Directory через LDAP.',
      commands: [
        { tool: 'windapsearch', command: 'windapsearch -d domain.local -U users.txt -m users', description: 'WindapSearch user enum' },
        { tool: 'bloodhound', command: 'bloodhound-python -u user -p pass -d domain.local -ns <target>', description: 'BloodHound data collection' },
        { tool: 'powerview', command: 'Get-NetUser | Select-Object samAccountName,mail', description: 'PowerView enumeration' },
      ],
      difficulty: 'medium',
      tags: ['active-directory', 'enumeration', 'bloodhound'],
    },
    {
      id: 'ldap-bruteforce',
      name: 'LDAP Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных через LDAP.',
      commands: [
        { tool: 'hydra', command: 'hydra -l user -P passwords.txt ldap://<target>', description: 'LDAP brute force' },
        { tool: 'crackmapexec', command: 'crackmapexec ldap <target> -u users.txt -p passwords.txt', description: 'CME LDAP brute force' },
      ],
      difficulty: 'medium',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'ldap-pass-back',
      name: 'LDAP Pass-Back Attack',
      description: 'Атака на принтеры/устройства с LDAP-конфигурацией для перехвата учетных данных.',
      commands: [
        { tool: 'responder', command: 'responder -I eth0 -v', description: 'Capture LDAP credentials' },
      ],
      difficulty: 'medium',
      prerequisites: ['Устройство с настроенным LDAP', 'Возможность MITM'],
      tags: ['pass-back', 'credential-capture', 'printer'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'folder-tree',
    color: '#3b82f6',
    displayPriority: 90,
  },

  references: [
    { title: 'LDAP Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-ldap' },
    { title: 'Active Directory', url: 'https://book.hacktricks.xyz/windows/active-directory-methodology' },
  ],

  notes: 'LDAP - ключевой компонент Active Directory. Anonymous bind часто разрешен и дает много информации. BloodHound - лучший инструмент для AD анализа. Проверяйте порты 389 (LDAP) и 636 (LDAPS), а также Global Catalog (3268/3269).',
};

export default ldapConfig;
