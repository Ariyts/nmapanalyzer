/**
 * Import/Export Component
 * UI for importing and exporting configurations
 */

import React, { useRef, useState } from 'react';
import { 
  Download, Upload, FileJson, AlertCircle, Check, X,
  Merge, Replace
} from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface ImportExportProps {
  onImport: (file: File, mode: 'merge' | 'replace') => Promise<{ added: number; updated: number }>;
  onExport: () => Promise<void>;
  isLoading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export default function ImportExport({
  onImport,
  onExport,
  isLoading = false,
}: ImportExportProps) {
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<{ added: number; updated: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await onImport(file, importMode);
      setResult(res);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle export
  const handleExport = async () => {
    setExporting(true);
    setError(null);
    
    try {
      await onExport();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  // Clear result
  const clearResult = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
        <FileJson className="w-4 h-4" />
        Import / Export Configurations
      </h3>

      {/* Result message */}
      {result && (
        <div className="flex items-center gap-2 px-3 py-2 bg-green-900/20 border border-green-900 rounded text-green-400 text-sm">
          <Check className="w-4 h-4" />
          <span>
            Imported: {result.added} added, {result.updated} updated
          </span>
          <button
            onClick={clearResult}
            className="ml-auto p-0.5 hover:bg-green-900/50 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-900/20 border border-red-900 rounded text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
          <button
            onClick={clearResult}
            className="ml-auto p-0.5 hover:bg-red-900/50 rounded"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Import section */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">Import configurations from a JSON file</div>
        
        {/* Import mode */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Mode:</span>
          <div className="flex gap-1">
            <button
              onClick={() => setImportMode('merge')}
              disabled={isLoading || importing}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                importMode === 'merge'
                  ? 'bg-green-900/50 text-green-400 border border-green-700'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <Merge className="w-3 h-3" />
              Merge
            </button>
            <button
              onClick={() => setImportMode('replace')}
              disabled={isLoading || importing}
              className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
                importMode === 'replace'
                  ? 'bg-red-900/50 text-red-400 border border-red-700'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
              }`}
            >
              <Replace className="w-3 h-3" />
              Replace
            </button>
          </div>
        </div>

        {/* Mode description */}
        <div className="text-xs text-gray-600">
          {importMode === 'merge' 
            ? 'Merge will add new configs and update existing ones'
            : 'Replace will delete all existing configs and import new ones'}
        </div>

        {/* File input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelect}
          disabled={isLoading || importing}
          className="hidden"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || importing}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50"
        >
          {importing ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-green-500 rounded-full" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Import from File
            </>
          )}
        </button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-800" />

      {/* Export section */}
      <div className="space-y-2">
        <div className="text-xs text-gray-500">Export all configurations to a JSON file</div>
        
        <button
          onClick={handleExport}
          disabled={isLoading || exporting}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-gray-300 hover:bg-gray-700 hover:border-gray-600 transition-colors disabled:opacity-50"
        >
          {exporting ? (
            <>
              <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-green-500 rounded-full" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Export to File
            </>
          )}
        </button>
      </div>
    </div>
  );
}
