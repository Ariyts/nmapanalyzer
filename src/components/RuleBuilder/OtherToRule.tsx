/**
 * Other To Rule Component
 * Convert unknown services to new rules
 */

import React, { useState, useMemo } from 'react';
import type { StoredUnknownService } from '../../lib/storage/indexedDB';
import { 
  Search, Plus, Trash2, ChevronDown, ChevronRight,
  AlertCircle, Zap, FileCode
} from 'lucide-react';

// ============================================
// PROPS
// ============================================

interface OtherToRuleProps {
  unknownServices: StoredUnknownService[];
  onConvert: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export default function OtherToRule({
  unknownServices,
  onConvert,
  onDelete,
  isLoading = false,
}: OtherToRuleProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filter by search
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return unknownServices;
    
    const query = searchQuery.toLowerCase();
    return unknownServices.filter((s) => 
      s.serviceName?.toLowerCase().includes(query) ||
      s.product?.toLowerCase().includes(query) ||
      s.hostIp.toLowerCase().includes(query) ||
      String(s.port).includes(query)
    );
  }, [unknownServices, searchQuery]);

  // Group by host
  const groupedByHost = useMemo(() => {
    const groups: Record<string, StoredUnknownService[]> = {};
    
    for (const service of filteredServices) {
      if (!groups[service.hostIp]) {
        groups[service.hostIp] = [];
      }
      groups[service.hostIp].push(service);
    }
    
    return groups;
  }, [filteredServices]);

  // Toggle group
  const toggleGroup = (hostIp: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(hostIp)) {
        next.delete(hostIp);
      } else {
        next.add(hostIp);
      }
      return next;
    });
  };

  // Handle convert
  const handleConvert = (id: string) => {
    onConvert(id);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Delete this unknown service?')) {
      onDelete(id);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-yellow-500" />
          Unknown Services
        </h3>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-7 pr-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Service list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-green-500 rounded-full" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {unknownServices.length === 0 
              ? 'No unknown services found'
              : 'No matching services'}
          </div>
        ) : (
          Object.entries(groupedByHost).map(([hostIp, services]) => (
            <div key={hostIp} className="border-b border-gray-800">
              {/* Host header */}
              <button
                onClick={() => toggleGroup(hostIp)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800/50 transition-colors"
              >
                {expandedGroups.has(hostIp) ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                <span className="text-sm text-gray-300 font-mono">{hostIp}</span>
                <span className="text-xs text-gray-500 ml-auto">{services.length} service(s)</span>
              </button>

              {/* Services */}
              {expandedGroups.has(hostIp) && (
                <div className="space-y-1 pb-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`group mx-2 p-2 rounded cursor-pointer transition-colors ${
                        selectedId === service.id
                          ? 'bg-yellow-900/20 border border-yellow-700'
                          : 'bg-gray-800/50 border border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedId(service.id)}
                    >
                      {/* Port and protocol */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-mono text-green-400">
                          {service.port}/{service.protocol}
                        </span>
                        {service.serviceName && (
                          <span className="text-xs text-gray-400 bg-gray-700 px-1.5 py-0.5 rounded">
                            {service.serviceName}
                          </span>
                        )}
                      </div>

                      {/* Product/Version */}
                      <div className="text-xs text-gray-500 space-y-0.5">
                        {service.product && (
                          <div className="truncate">
                            <span className="text-gray-600">Product:</span> {service.product}
                          </div>
                        )}
                        {service.version && (
                          <div className="truncate">
                            <span className="text-gray-600">Version:</span> {service.version}
                          </div>
                        )}
                        {service.banner && (
                          <div className="truncate">
                            <span className="text-gray-600">Banner:</span>{' '}
                            <span className="font-mono">{service.banner.substring(0, 50)}</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-700">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConvert(service.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20 rounded transition-colors"
                        >
                          <Zap className="w-3 h-3" />
                          Create Rule
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(service.id);
                          }}
                          className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div className="px-3 py-2 border-t border-gray-800 text-xs text-gray-500">
        {unknownServices.length} unknown service(s)
        {searchQuery && ` • ${filteredServices.length} matching`}
      </div>
    </div>
  );
}
