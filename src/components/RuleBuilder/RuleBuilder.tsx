/**
 * Rule Builder Component
 * Main component for managing service configurations
 */

import React, { useEffect, useState, useCallback } from 'react';
import type { ServiceConfig } from '../../configs/types';
import { useConfigStore, selectCurrentConfig } from '../../lib/storage/configStore';
import ConfigEditor from './ConfigEditor';
import ConfigList from './ConfigList';
import ImportExport from './ImportExport';
import OtherToRule from './OtherToRule';
import { Loader2, Settings, AlertCircle } from 'lucide-react';

// ============================================
// RULE BUILDER COMPONENT
// ============================================

export default function RuleBuilder() {
  const {
    configs,
    selectedConfigId,
    isLoading,
    error,
    isDirty,
    editorMode,
    sidebarTab,
    unknownServices,
    
    loadConfigs,
    loadUnknownServices,
    selectConfig,
    createConfig,
    updateConfig,
    deleteConfig,
    duplicateConfig,
    selectUnknownService,
    deleteUnknownService,
    convertUnknownToRule,
    importFromFile,
    exportToFile,
    setDirty,
    setSidebarTab,
    setError,
  } = useConfigStore();

  const [newConfig, setNewConfig] = useState<ServiceConfig | null>(null);
  const [showImportExport, setShowImportExport] = useState(false);

  // Load configs on mount
  useEffect(() => {
    loadConfigs();
    loadUnknownServices();
  }, [loadConfigs, loadUnknownServices]);

  // Get current config
  const currentConfig = useConfigStore(selectCurrentConfig);

  // Determine which config to show in editor
  const editorConfig = editorMode === 'create' && newConfig ? newConfig : currentConfig;

  // Handle create new config
  const handleCreate = useCallback(() => {
    const config = createConfig();
    setNewConfig(config);
  }, [createConfig]);

  // Handle select config
  const handleSelectConfig = useCallback((id: string) => {
    setNewConfig(null);
    selectConfig(id);
  }, [selectConfig]);

  // Handle save config
  const handleSaveConfig = useCallback(async (config: ServiceConfig) => {
    await updateConfig(config);
    setNewConfig(null);
  }, [updateConfig]);

  // Handle cancel edit
  const handleCancelEdit = useCallback(() => {
    setNewConfig(null);
    selectConfig(null);
  }, [selectConfig]);

  // Handle duplicate
  const handleDuplicate = useCallback(async (id: string) => {
    await duplicateConfig(id);
  }, [duplicateConfig]);

  // Handle delete
  const handleDelete = useCallback(async (id: string) => {
    await deleteConfig(id);
    if (selectedConfigId === id) {
      selectConfig(null);
    }
  }, [deleteConfig, selectedConfigId, selectConfig]);

  // Handle convert unknown to rule
  const handleConvertUnknown = useCallback((id: string) => {
    const config = convertUnknownToRule(id);
    if (config) {
      setNewConfig(config);
    }
  }, [convertUnknownToRule]);

  // Handle import
  const handleImport = useCallback(async (file: File, mode: 'merge' | 'replace') => {
    const result = await importFromFile(file, mode);
    return result;
  }, [importFromFile]);

  // Handle dirty change
  const handleDirtyChange = useCallback((dirty: boolean) => {
    setDirty(dirty);
  }, [setDirty]);

  // Loading state
  if (isLoading && configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading configurations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Left Sidebar */}
      <div className="w-64 border-r border-gray-800 flex flex-col shrink-0">
        {/* Sidebar tabs */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setSidebarTab('configs')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              sidebarTab === 'configs'
                ? 'text-green-400 border-b-2 border-green-400 bg-green-900/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            Configs
          </button>
          <button
            onClick={() => setSidebarTab('unknown')}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
              sidebarTab === 'unknown'
                ? 'text-yellow-400 border-b-2 border-yellow-400 bg-yellow-900/20'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
            }`}
          >
            Unknown ({unknownServices.length})
          </button>
        </div>

        {/* Sidebar content */}
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'configs' ? (
            <ConfigList
              configs={configs}
              selectedId={selectedConfigId}
              onSelect={handleSelectConfig}
              onCreate={handleCreate}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          ) : (
            <OtherToRule
              unknownServices={unknownServices}
              onConvert={handleConvertUnknown}
              onDelete={deleteUnknownService}
              isLoading={isLoading}
            />
          )}
        </div>

        {/* Import/Export toggle */}
        <div className="border-t border-gray-800 p-2">
          <button
            onClick={() => setShowImportExport(!showImportExport)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors"
          >
            <Settings className="w-3 h-3" />
            Import / Export
          </button>
        </div>

        {/* Import/Export panel */}
        {showImportExport && (
          <div className="border-t border-gray-800 p-2">
            <ImportExport
              onImport={handleImport}
              onExport={exportToFile}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>

      {/* Main content - Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Error display */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-900/20 border-b border-red-900 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-300 hover:text-red-100"
            >
              ×
            </button>
          </div>
        )}

        {/* Editor */}
        <div className="flex-1 overflow-hidden">
          <ConfigEditor
            config={editorConfig || null}
            onSave={handleSaveConfig}
            onCancel={handleCancelEdit}
            isCreating={editorMode === 'create' && !!newConfig}
            isLoading={isLoading}
            onDirtyChange={handleDirtyChange}
          />
        </div>
      </div>
    </div>
  );
}
