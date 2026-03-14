/**
 * Service Configurations Registry
 * Auto-loads all service configurations from individual files
 * 
 * ONE SERVICE = ONE FILE
 * Add new services by creating a new file in this directory and importing it below
 */

import type { ServiceConfig } from '../types';

// Import all service configurations
import { sshConfig } from './ssh';
import { smbConfig } from './smb';
import { rdpConfig } from './rdp';
import { winrmConfig } from './winrm';
import { vncConfig } from './vnc';
import { telnetConfig } from './telnet';
import { mssqlConfig } from './mssql';
import { mysqlConfig } from './mysql';
import { postgresqlConfig } from './postgresql';
import { mongodbConfig } from './mongodb';
import { redisConfig } from './redis';
import { elasticsearchConfig } from './elasticsearch';
import { httpConfig } from './http';
import { smtpConfig } from './smtp';
import { imapConfig } from './imap';
import { pop3Config } from './pop3';
import { ldapConfig } from './ldap';
import { kerberosConfig } from './kerberos';
import { dnsConfig } from './dns';
import { activeDirectoryConfig } from './active-directory';

// ============================================
// SERVICE REGISTRY
// ============================================

/**
 * All service configurations indexed by ID
 */
export const serviceConfigs: Record<string, ServiceConfig> = {
  // Remote Access
  [sshConfig.id]: sshConfig,
  [smbConfig.id]: smbConfig,
  [rdpConfig.id]: rdpConfig,
  [winrmConfig.id]: winrmConfig,
  [vncConfig.id]: vncConfig,
  [telnetConfig.id]: telnetConfig,

  // Database
  [mssqlConfig.id]: mssqlConfig,
  [mysqlConfig.id]: mysqlConfig,
  [postgresqlConfig.id]: postgresqlConfig,
  [mongodbConfig.id]: mongodbConfig,
  [redisConfig.id]: redisConfig,
  [elasticsearchConfig.id]: elasticsearchConfig,

  // Web/Mail
  [httpConfig.id]: httpConfig,
  [smtpConfig.id]: smtpConfig,
  [imapConfig.id]: imapConfig,
  [pop3Config.id]: pop3Config,

  // Directory Services
  [ldapConfig.id]: ldapConfig,
  [kerberosConfig.id]: kerberosConfig,
  [dnsConfig.id]: dnsConfig,
  [activeDirectoryConfig.id]: activeDirectoryConfig,
};

/**
 * Array of all service configurations
 */
export const allServiceConfigs: ServiceConfig[] = Object.values(serviceConfigs);

/**
 * Get a service config by ID
 */
export function getServiceConfig(id: string): ServiceConfig | undefined {
  return serviceConfigs[id];
}

/**
 * Get all service configs by category
 */
export function getServiceConfigsByCategory(categoryId: string): ServiceConfig[] {
  return allServiceConfigs.filter(config => config.categoryId === categoryId);
}

/**
 * Get all unique category IDs
 */
export function getCategories(): string[] {
  const categories = new Set(allServiceConfigs.map(config => config.categoryId));
  return Array.from(categories);
}

/**
 * Search service configs by name or description
 */
export function searchServiceConfigs(query: string): ServiceConfig[] {
  const lowerQuery = query.toLowerCase();
  return allServiceConfigs.filter(config => 
    config.name.toLowerCase().includes(lowerQuery) ||
    config.description.toLowerCase().includes(lowerQuery) ||
    config.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
}

// ============================================
// CATEGORY DEFINITIONS
// ============================================

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export const categories: CategoryDefinition[] = [
  {
    id: 'remote-access',
    name: 'Remote Access',
    description: 'Службы удаленного доступа: SSH, RDP, VNC, Telnet, SMB, WinRM',
    icon: 'terminal',
    color: '#22c55e',
    order: 1,
  },
  {
    id: 'database',
    name: 'Databases',
    description: 'Системы управления базами данных: SQL, NoSQL, кэши',
    icon: 'database',
    color: '#3b82f6',
    order: 2,
  },
  {
    id: 'web',
    name: 'Web Services',
    description: 'Веб-серверы и HTTP-сервисы',
    icon: 'globe',
    color: '#8b5cf6',
    order: 3,
  },
  {
    id: 'mail',
    name: 'Mail Services',
    description: 'Почтовые протоколы: SMTP, IMAP, POP3',
    icon: 'mail',
    color: '#f59e0b',
    order: 4,
  },
  {
    id: 'directory',
    name: 'Directory Services',
    description: 'Службы каталогов: LDAP, Kerberos, DNS, Active Directory',
    icon: 'folder-tree',
    color: '#dc2626',
    order: 5,
  },
  {
    id: 'other',
    name: 'Other Services',
    description: 'Неопознанные или нестандартные сервисы',
    icon: 'help-circle',
    color: '#6b7280',
    order: 999,
  },
];

/**
 * Get category definition by ID
 */
export function getCategory(id: string): CategoryDefinition | undefined {
  return categories.find(cat => cat.id === id);
}

// ============================================
// EXPORTS
// ============================================

export {
  sshConfig,
  smbConfig,
  rdpConfig,
  winrmConfig,
  vncConfig,
  telnetConfig,
  mssqlConfig,
  mysqlConfig,
  postgresqlConfig,
  mongodbConfig,
  redisConfig,
  elasticsearchConfig,
  httpConfig,
  smtpConfig,
  imapConfig,
  pop3Config,
  ldapConfig,
  kerberosConfig,
  dnsConfig,
  activeDirectoryConfig,
};

export default serviceConfigs;
