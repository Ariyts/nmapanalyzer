/**
 * Elasticsearch Service Configuration
 * Elasticsearch Search Engine
 * 
 * @version 1.0.0
 * @author Security Team
 */
import type { ServiceConfig } from '../types';

export const elasticsearchConfig: ServiceConfig = {
  id: 'elasticsearch',
  name: 'Elasticsearch',
  description: 'Elasticsearch - распределенный поисковый движок на базе Lucene. Часто используется для логов (ELK stack), аналитики и полнотекстового поиска. Часто развертывается без аутентификации с доступом к чувствительным данным.',
  categoryId: 'database',
  version: '1.0.0',
  tags: ['database', 'search', 'nosql', 'elk', 'json'],

  matchers: {
    serviceNames: ['elasticsearch', 'http', 'https'],
    cpePatterns: ['cpe:/a:elasticsearch:elasticsearch', 'cpe:/a:elastic:elasticsearch'],
    bannerRegex: [
      'elasticsearch',
      '"cluster_name"',
      '"version"\\s*:\\s*\\{',
      '"lucene_version"',
      'You Know, for Search',
    ],
    productPatterns: ['Elasticsearch', 'OpenSearch'],
    standardPorts: [9200, 9300],
    nseScriptMatchers: [
      { scriptName: 'http-title', outputPattern: 'Elasticsearch' },
    ],
  },

  confidenceThreshold: 35,

  techniques: [
    {
      id: 'elasticsearch-enum',
      name: 'Elasticsearch Enumeration',
      mitreId: 'T1046',
      description: 'Сбор информации о кластере Elasticsearch.',
      commands: [
        { tool: 'curl', command: 'curl -X GET http://<target>:9200/', description: 'Get cluster info' },
        { tool: 'curl', command: 'curl -X GET http://<target>:9200/_cat/indices?v', description: 'List all indices' },
        { tool: 'curl', command: 'curl -X GET http://<target>:9200/_cat/nodes?v', description: 'List nodes' },
        { tool: 'curl', command: 'curl -X GET http://<target>:9200/_cluster/health?pretty', description: 'Cluster health' },
      ],
      difficulty: 'easy',
      tags: ['enumeration', 'reconnaissance'],
    },
    {
      id: 'elasticsearch-unauth',
      name: 'Unauthenticated Access',
      mitreId: 'T1078',
      description: 'Подключение к Elasticsearch без аутентификации.',
      commands: [
        { tool: 'curl', command: 'curl http://<target>:9200/_search?pretty', description: 'Search all documents' },
        { tool: 'curl', command: 'curl http://<target>:9200/_all/_search?size=1000&pretty', description: 'Get all data' },
        { tool: 'curl', command: 'curl "http://<target>:9200/index/_search?q=*:*&size=1000"', description: 'Dump index' },
      ],
      difficulty: 'easy',
      tags: ['misconfiguration', 'unauthenticated', 'data-exfiltration'],
    },
    {
      id: 'elasticsearch-dump',
      name: 'Data Dumping',
      mitreId: 'T1005',
      description: 'Извлечение данных из Elasticsearch.',
      commands: [
        { tool: 'curl', command: 'curl http://<target>:9200/_all/_search?size=10000 > dump.json', description: 'Full dump via curl' },
        { tool: 'elasticdump', command: 'elasticdump --input=http://<target>:9200/myindex --output=data.json', description: 'elasticdump export' },
        { tool: 'curl', command: 'curl -X POST "http://<target>:9200/index/_search" -H "Content-Type: application/json" -d \'{"query":{"match_all":{}},"size":10000}\'', description: 'Query all documents' },
      ],
      difficulty: 'easy',
      tags: ['data-exfiltration', 'dumping'],
    },
    {
      id: 'elasticsearch-rce',
      name: 'Remote Code Execution',
      mitreId: 'T1059',
      description: 'Эксплуатация RCE уязвимостей в Elasticsearch.',
      cves: [
        { cveId: 'CVE-2015-1427', cvss: 7.5, description: 'Groovy sandbox bypass RCE', exploitAvailable: true },
        { cveId: 'CVE-2014-3120', cvss: 7.5, description: 'MVEL script RCE', exploitAvailable: true },
        { cveId: 'CVE-2015-3337', cvss: 5.0, description: 'Directory traversal' },
      ],
      commands: [
        { tool: 'metasploit', command: 'use exploit/multi/elasticsearch/script_mvel_rce', description: 'MVEL RCE (old versions)' },
        { tool: 'metasploit', command: 'use exploit/multi/elasticsearch/groovy_script_rce', description: 'Groovy RCE' },
      ],
      difficulty: 'hard',
      tags: ['rce', 'vulnerability', 'exploitation'],
    },
    {
      id: 'elasticsearch-query-injection',
      name: 'Query Injection',
      description: 'Эксплуатация инъекций в Elasticsearch запросах.',
      commands: [
        { tool: 'curl', command: 'curl -X GET "http://<target>:9200/index/_search?q=title:\\"*\\""', description: 'Query injection test' },
        { tool: 'curl', command: 'curl -X POST "http://<target>:9200/index/_search" -d \'{"query":{"script":{"script":"...\'}}', description: 'Script injection' },
      ],
      difficulty: 'medium',
      tags: ['injection', 'scripting'],
    },
  ],

  triggers: [],

  ui: {
    icon: 'search',
    color: '#f59e0b',
    displayPriority: 85,
  },

  references: [
    { title: 'Elasticsearch Pentesting', url: 'https://book.hacktricks.xyz/network-services-pentesting/9200-pentesting-elasticsearch' },
  ],

  notes: 'Elasticsearch почти всегда без аутентификации в старых версиях. REST API на порту 9200. Проверяйте все индексы на наличие чувствительных данных. В Kibana (5601) часто удобнее просматривать данные.',
};

export default elasticsearchConfig;
