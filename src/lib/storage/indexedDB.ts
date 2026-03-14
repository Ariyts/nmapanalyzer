/**
 * IndexedDB Storage Layer
 * Persists service configurations locally
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { ServiceConfig } from '../../configs/types';

// ============================================
// DATABASE SCHEMA
// ============================================

interface NmapAnalyzerDB extends DBSchema {
  configs: {
    key: string;
    value: ServiceConfig;
    indexes: {
      'by-category': string;
      'by-updated': string;
    };
  };
  unknownServices: {
    key: string;
    value: {
      id: string;
      port: number;
      protocol: string;
      serviceName?: string;
      product?: string;
      version?: string;
      banner?: string;
      hostIp: string;
      discoveredAt: string;
    };
  };
}

const DB_NAME = 'nmap-analyzer-db';
const DB_VERSION = 1;

// ============================================
// DATABASE INSTANCE
// ============================================

let dbInstance: IDBPDatabase<NmapAnalyzerDB> | null = null;

/**
 * Get or create the database instance
 */
async function getDB(): Promise<IDBPDatabase<NmapAnalyzerDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<NmapAnalyzerDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Configs store
      if (!db.objectStoreNames.contains('configs')) {
        const configStore = db.createObjectStore('configs', { keyPath: 'id' });
        configStore.createIndex('by-category', 'categoryId');
        configStore.createIndex('by-updated', 'updatedAt');
      }

      // Unknown services store
      if (!db.objectStoreNames.contains('unknownServices')) {
        db.createObjectStore('unknownServices', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// ============================================
// CONFIG OPERATIONS
// ============================================

/**
 * Get all service configurations
 */
export async function getAllConfigs(): Promise<ServiceConfig[]> {
  const db = await getDB();
  return db.getAll('configs');
}

/**
 * Get a single config by ID
 */
export async function getConfig(id: string): Promise<ServiceConfig | undefined> {
  const db = await getDB();
  return db.get('configs', id);
}

/**
 * Save a service configuration
 */
export async function saveConfig(config: ServiceConfig): Promise<void> {
  const db = await getDB();
  const configWithTimestamp = {
    ...config,
    updatedAt: new Date().toISOString(),
  };
  await db.put('configs', configWithTimestamp);
}

/**
 * Delete a service configuration
 */
export async function deleteConfig(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('configs', id);
}

/**
 * Get configs by category
 */
export async function getConfigsByCategory(categoryId: string): Promise<ServiceConfig[]> {
  const db = await getDB();
  return db.getAllFromIndex('configs', 'by-category', categoryId);
}

/**
 * Clear all configs
 */
export async function clearAllConfigs(): Promise<void> {
  const db = await getDB();
  await db.clear('configs');
}

/**
 * Import multiple configs (merge or replace)
 */
export async function importConfigs(
  configs: ServiceConfig[],
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ added: number; updated: number }> {
  const db = await getDB();
  
  if (mode === 'replace') {
    await db.clear('configs');
  }

  let added = 0;
  let updated = 0;

  const tx = db.transaction('configs', 'readwrite');
  
  for (const config of configs) {
    const existing = await tx.store.get(config.id);
    if (existing) {
      updated++;
    } else {
      added++;
    }
    await tx.store.put({
      ...config,
      updatedAt: new Date().toISOString(),
    });
  }

  await tx.done;
  return { added, updated };
}

/**
 * Export all configs as JSON
 */
export async function exportConfigs(): Promise<ServiceConfig[]> {
  return getAllConfigs();
}

// ============================================
// UNKNOWN SERVICE OPERATIONS
// ============================================

export interface StoredUnknownService {
  id: string;
  port: number;
  protocol: string;
  serviceName?: string;
  product?: string;
  version?: string;
  banner?: string;
  nseScripts?: { name: string; output: string }[];
  hostIp: string;
  discoveredAt: string;
}

/**
 * Save an unknown service for later analysis
 */
export async function saveUnknownService(service: StoredUnknownService): Promise<void> {
  const db = await getDB();
  await db.put('unknownServices', service);
}

/**
 * Get all unknown services
 */
export async function getAllUnknownServices(): Promise<StoredUnknownService[]> {
  const db = await getDB();
  return db.getAll('unknownServices');
}

/**
 * Delete an unknown service
 */
export async function deleteUnknownService(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('unknownServices', id);
}

/**
 * Clear all unknown services
 */
export async function clearAllUnknownServices(): Promise<void> {
  const db = await getDB();
  await db.clear('unknownServices');
}

// ============================================
// EXPORT/IMPORT UTILITIES
// ============================================

/**
 * Export database to JSON file
 */
export async function exportDatabaseToFile(): Promise<void> {
  const configs = await exportConfigs();
  const unknownServices = await getAllUnknownServices();
  
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    configs,
    unknownServices,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `nmap-analyzer-configs-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Import database from JSON file
 */
export async function importDatabaseFromFile(
  file: File,
  mode: 'merge' | 'replace' = 'merge'
): Promise<{ configs: { added: number; updated: number }; unknownServices: number }> {
  const text = await file.text();
  const data = JSON.parse(text);

  if (!data.version || !data.configs) {
    throw new Error('Invalid backup file format');
  }

  const configsResult = await importConfigs(data.configs, mode);

  // Import unknown services
  if (data.unknownServices && Array.isArray(data.unknownServices)) {
    const db = await getDB();
    const tx = db.transaction('unknownServices', 'readwrite');
    for (const service of data.unknownServices) {
      await tx.store.put(service);
    }
    await tx.done;
  }

  return {
    configs: configsResult,
    unknownServices: data.unknownServices?.length || 0,
  };
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize database with default configs if empty
 */
export async function initializeWithDefaults(
  defaultConfigs: ServiceConfig[]
): Promise<boolean> {
  const existing = await getAllConfigs();
  
  if (existing.length === 0) {
    await importConfigs(defaultConfigs, 'replace');
    return true;
  }
  
  return false;
}
