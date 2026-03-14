/**
 * Zustand Store for Configuration Management
 * Manages state for the Rule Builder
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ServiceConfig, Technique, UnknownService } from '../../configs/types';
import {
  getAllConfigs,
  saveConfig,
  deleteConfig as deleteConfigFromDB,
  importConfigs,
  exportConfigs,
  initializeWithDefaults,
  saveUnknownService,
  getAllUnknownServices,
  deleteUnknownService as deleteUnknownServiceFromDB,
  StoredUnknownService,
} from './indexedDB';
import { allServiceConfigs } from '../../configs/services';

// ============================================
// STATE INTERFACE
// ============================================

interface ConfigState {
  // Configs
  configs: ServiceConfig[];
  selectedConfigId: string | null;
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;

  // Unknown services
  unknownServices: StoredUnknownService[];
  selectedUnknownServiceId: string | null;

  // UI State
  editorMode: 'edit' | 'create';
  sidebarTab: 'configs' | 'unknown';

  // Actions - Configs
  loadConfigs: () => Promise<void>;
  selectConfig: (id: string | null) => void;
  createConfig: (partial?: Partial<ServiceConfig>) => ServiceConfig;
  updateConfig: (config: ServiceConfig) => Promise<void>;
  deleteConfig: (id: string) => Promise<void>;
  duplicateConfig: (id: string) => Promise<void>;

  // Actions - Unknown Services
  loadUnknownServices: () => Promise<void>;
  selectUnknownService: (id: string | null) => void;
  deleteUnknownService: (id: string) => Promise<void>;

  // Actions - Import/Export
  importFromFile: (file: File, mode: 'merge' | 'replace') => Promise<{ added: number; updated: number }>;
  exportToFile: () => Promise<void>;

  // Actions - Convert Unknown to Rule
  convertUnknownToRule: (unknownServiceId: string) => ServiceConfig | null;

  // UI Actions
  setDirty: (dirty: boolean) => void;
  setEditorMode: (mode: 'edit' | 'create') => void;
  setSidebarTab: (tab: 'configs' | 'unknown') => void;
  setError: (error: string | null) => void;
}

// ============================================
// DEFAULT CONFIG TEMPLATE
// ============================================

function createDefaultConfig(partial: Partial<ServiceConfig> = {}): ServiceConfig {
  const now = new Date().toISOString();
  return {
    id: `custom-${uuidv4().substring(0, 8)}`,
    name: 'New Service',
    description: '',
    categoryId: 'other',
    version: '1.0.0',
    updatedAt: now,
    tags: [],
    matchers: {
      serviceNames: [],
      cpePatterns: [],
      bannerRegex: [],
      productPatterns: [],
      versionPatterns: [],
      standardPorts: [],
      nseScriptMatchers: [],
    },
    confidenceThreshold: 30,
    techniques: [],
    defaultTechniques: [],
    triggers: [],
    ui: {
      icon: 'help-circle',
      color: '#6b7280',
      displayPriority: 50,
    },
    references: [],
    ...partial,
  };
}

// ============================================
// CREATE STORE
// ============================================

export const useConfigStore = create<ConfigState>((set, get) => ({
  // Initial state
  configs: [],
  selectedConfigId: null,
  isLoading: true,
  error: null,
  isDirty: false,
  unknownServices: [],
  selectedUnknownServiceId: null,
  editorMode: 'edit',
  sidebarTab: 'configs',

  // Load configs from IndexedDB
  loadConfigs: async () => {
    set({ isLoading: true, error: null });
    try {
      // Initialize with defaults if empty
      await initializeWithDefaults(allServiceConfigs);
      
      const configs = await getAllConfigs();
      set({ configs, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Select a config
  selectConfig: (id) => {
    const { isDirty } = get();
    if (isDirty) {
      // Could show a confirmation dialog here
      // For now, just warn in console
      console.warn('Unsaved changes will be lost');
    }
    set({ selectedConfigId: id, editorMode: 'edit', isDirty: false });
  },

  // Create a new config
  createConfig: (partial = {}) => {
    const config = createDefaultConfig(partial);
    set({ 
      selectedConfigId: config.id, 
      editorMode: 'create',
      isDirty: true,
    });
    return config;
  },

  // Update a config
  updateConfig: async (config) => {
    set({ isLoading: true, error: null });
    try {
      await saveConfig(config);
      const configs = await getAllConfigs();
      set({ configs, isLoading: false, isDirty: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Delete a config
  deleteConfig: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await deleteConfigFromDB(id);
      const configs = await getAllConfigs();
      set({ 
        configs, 
        selectedConfigId: get().selectedConfigId === id ? null : get().selectedConfigId,
        isLoading: false 
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  // Duplicate a config
  duplicateConfig: async (id) => {
    const { configs } = get();
    const original = configs.find(c => c.id === id);
    if (!original) return;

    const duplicate: ServiceConfig = {
      ...original,
      id: `${original.id}-copy-${uuidv4().substring(0, 8)}`,
      name: `${original.name} (Copy)`,
      updatedAt: new Date().toISOString(),
    };

    await saveConfig(duplicate);
    const updatedConfigs = await getAllConfigs();
    set({ configs: updatedConfigs, selectedConfigId: duplicate.id });
  },

  // Load unknown services
  loadUnknownServices: async () => {
    try {
      const unknownServices = await getAllUnknownServices();
      set({ unknownServices });
    } catch (error) {
      console.error('Failed to load unknown services:', error);
    }
  },

  // Select unknown service
  selectUnknownService: (id) => {
    set({ selectedUnknownServiceId: id });
  },

  // Delete unknown service
  deleteUnknownService: async (id) => {
    await deleteUnknownServiceFromDB(id);
    const unknownServices = await getAllUnknownServices();
    set({ 
      unknownServices,
      selectedUnknownServiceId: get().selectedUnknownServiceId === id ? null : get().selectedUnknownServiceId,
    });
  },

  // Import from file
  importFromFile: async (file, mode) => {
    set({ isLoading: true, error: null });
    try {
      const { importDatabaseFromFile } = await import('./indexedDB');
      const result = await importDatabaseFromFile(file, mode);
      
      const configs = await getAllConfigs();
      const unknownServices = await getAllUnknownServices();
      
      set({ 
        configs, 
        unknownServices,
        isLoading: false,
      });
      
      return result.configs;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      throw error;
    }
  },

  // Export to file
  exportToFile: async () => {
    const { exportDatabaseToFile } = await import('./indexedDB');
    await exportDatabaseToFile();
  },

  // Convert unknown service to rule
  convertUnknownToRule: (unknownServiceId) => {
    const { unknownServices } = get();
    const unknown = unknownServices.find(s => s.id === unknownServiceId);
    if (!unknown) return null;

    const config = createDefaultConfig({
      id: `custom-${uuidv4().substring(0, 8)}`,
      name: unknown.serviceName || `Custom Service (Port ${unknown.port})`,
      description: `Auto-generated rule from unknown service on port ${unknown.port}`,
      matchers: {
        serviceNames: unknown.serviceName ? [unknown.serviceName] : [],
        standardPorts: [unknown.port],
        bannerRegex: unknown.banner ? [escapeRegex(unknown.banner.substring(0, 50))] : [],
        productPatterns: unknown.product ? [unknown.product] : [],
        versionPatterns: unknown.version ? [unknown.version] : [],
        cpePatterns: [],
        nseScriptMatchers: [],
      },
      notes: `Created from unknown service discovered on ${unknown.hostIp}\nPort: ${unknown.port}/${unknown.protocol}\nProduct: ${unknown.product || 'unknown'}\nVersion: ${unknown.version || 'unknown'}`,
    });

    set({
      selectedConfigId: config.id,
      editorMode: 'create',
      sidebarTab: 'configs',
      isDirty: true,
    });

    return config;
  },

  // UI Actions
  setDirty: (dirty) => set({ isDirty: dirty }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  setSidebarTab: (tab) => set({ sidebarTab: tab }),
  setError: (error) => set({ error }),
}));

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Escape special regex characters for banner regex
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================
// SELECTORS
// ============================================

export const selectCurrentConfig = (state: ConfigState): ServiceConfig | null => {
  if (!state.selectedConfigId) return null;
  return state.configs.find(c => c.id === state.selectedConfigId) || null;
};

export const selectConfigById = (id: string) => (state: ConfigState): ServiceConfig | null => {
  return state.configs.find(c => c.id === id) || null;
};

export const selectConfigsByCategory = (categoryId: string) => (state: ConfigState): ServiceConfig[] => {
  return state.configs.filter(c => c.categoryId === categoryId);
};

export const selectCategories = (state: ConfigState): string[] => {
  const cats = new Set(state.configs.map(c => c.categoryId));
  return Array.from(cats);
};
