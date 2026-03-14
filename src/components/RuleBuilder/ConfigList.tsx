/**
 * Config List Component
 * Displays a list of all service configurations
 */

import React, { useState, useMemo } from 'react';
import type { ServiceConfig } from '../../configs/types';
import { categories, getCategory } from '../../configs/services';
import { 
  Search, Plus, Copy, Trash2, Terminal, Database, Globe, 
  Mail, FolderTree, HelpCircle, ChevronDown, ChevronRight,
  Filter, SortAsc
} from 'lucide-react';

// ============================================
// ICON MAP
// ============================================

const iconMap: Record<string, React.ReactNode> = {
  'terminal': <Terminal className="w-4 h-4" />,
  'database': <Database className="w-4 h-4" />,
  'globe': <Globe className="w-4 h-4" />,
  'mail': <Mail className="w-4 h-4" />,
  'folder-tree': <FolderTree className="w-4 h-4" />,
  'help-circle': <HelpCircle className="w-4 h-4" />,
};

// ============================================
// CATEGORY GROUP COMPONENT
// ============================================

interface CategoryGroupProps {
  categoryId: string;
  configs: ServiceConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

function CategoryGroup({
  categoryId,
  configs,
  selectedId,
  onSelect,
  onDuplicate,
  onDelete,
  isExpanded,
  onToggle,
}: CategoryGroupProps) {
  const category = getCategory(categoryId);
  
  return (
    <div className="border-b border-gray-800 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
        <span 
          className="w-4 h-4 flex items-center justify-center rounded"
          style={{ backgroundColor: category?.color || '#6b7280' }}
        >
          {iconMap[category?.icon || 'help-circle'] || <HelpCircle className="w-3 h-3 text-white" />}
        </span>
        <span className="text-sm text-gray-300">{category?.name || categoryId}</span>
        <span className="text-xs text-gray-500 ml-auto">{configs.length}</span>
      </button>
      
      {isExpanded && (
        <div className="space-y-0.5 pb-1">
          {configs.map((config) => (
            <div
              key={config.id}
              className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
                selectedId === config.id
                  ? 'bg-green-900/30 text-green-400'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => onSelect(config.id)}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.ui?.color || category?.color || '#6b7280' }} />
              <span className="flex-1 text-xs truncate">{config.name}</span>
              
              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate(config.id);
                  }}
                  className="p-1 text-gray-500 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete "${config.name}"?`)) {
                      onDelete(config.id);
                    }
                  }}
                  className="p-1 text-gray-500 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// CONFIG LIST COMPONENT
// ============================================

interface ConfigListProps {
  configs: ServiceConfig[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export default function ConfigList({
  configs,
  selectedId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  isLoading = false,
}: ConfigListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['remote-access', 'database', 'web'])
  );
  const [sortBy, setSortBy] = useState<'name' | 'category' | 'updated'>('name');

  // Filter configs by search
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configs;
    
    const query = searchQuery.toLowerCase();
    return configs.filter((config) => 
      config.name.toLowerCase().includes(query) ||
      config.id.toLowerCase().includes(query) ||
      config.description.toLowerCase().includes(query) ||
      config.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [configs, searchQuery]);

  // Group configs by category
  const groupedConfigs = useMemo(() => {
    const groups: Record<string, ServiceConfig[]> = {};
    
    for (const config of filteredConfigs) {
      if (!groups[config.categoryId]) {
        groups[config.categoryId] = [];
      }
      groups[config.categoryId].push(config);
    }
    
    // Sort within groups
    for (const catId in groups) {
      groups[catId].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'updated') return (b.updatedAt || '').localeCompare(a.updatedAt || '');
        return (a.ui?.displayPriority || 50) - (b.ui?.displayPriority || 50);
      });
    }
    
    return groups;
  }, [filteredConfigs, sortBy]);

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  // Get sorted category IDs
  const sortedCategoryIds = useMemo(() => {
    return categories
      .sort((a, b) => a.order - b.order)
      .map(c => c.id)
      .filter(id => groupedConfigs[id]?.length > 0);
  }, [groupedConfigs]);

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-300">Service Configs</h3>
          <button
            onClick={onCreate}
            disabled={isLoading}
            className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 hover:text-green-300 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          >
            <Plus className="w-3 h-3" />
            New
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search configs..."
            className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        {/* Sort options */}
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <SortAsc className="w-3 h-3" />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="flex-1 px-2 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="name">Name</option>
            <option value="category">Category</option>
            <option value="updated">Updated</option>
          </select>
        </div>
      </div>

      {/* Config list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-green-500 rounded-full" />
          </div>
        ) : filteredConfigs.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {searchQuery ? 'No matching configs found' : 'No configs available'}
          </div>
        ) : (
          sortedCategoryIds.map((categoryId) => (
            <CategoryGroup
              key={categoryId}
              categoryId={categoryId}
              configs={groupedConfigs[categoryId] || []}
              selectedId={selectedId}
              onSelect={onSelect}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              isExpanded={expandedCategories.has(categoryId)}
              onToggle={() => toggleCategory(categoryId)}
            />
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
        {configs.length} total configs
        {searchQuery && ` • ${filteredConfigs.length} matching`}
      </div>
    </div>
  );
}
