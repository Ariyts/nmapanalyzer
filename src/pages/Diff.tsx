import { useState, useMemo } from 'react';
import { GitCompare, Plus, Minus, RefreshCw, AlertTriangle } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { diffScans } from '../lib/analyzer';

export default function Diff() {
  const { scans } = useScanStore();
  const [scan1, setScan1] = useState(scans[0]?.name || '');
  const [scan2, setScan2] = useState(scans[1]?.name || '');
  const [newOnly, setNewOnly] = useState(false);
  const [computed, setComputed] = useState(false);

  const scanMap = useMemo(() => new Map(scans.map((s) => [s.name, s])), [scans]);

  const diff = useMemo(() => {
    if (!computed || !scan1 || !scan2) return null;
    const s1 = scanMap.get(scan1);
    const s2 = scanMap.get(scan2);
    if (!s1 || !s2) return null;
    return diffScans(s1, s2);
  }, [computed, scan1, scan2, scanMap]);

  const portChangedHosts = diff
    ? Object.entries(diff.portChanges)
        .filter(([, changes]) => changes.newPorts.length > 0 || (!newOnly && changes.removedPorts.length > 0))
        .sort((a, b) => b[1].newPorts.length - a[1].newPorts.length)
    : [];

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <GitCompare className="w-6 h-6 text-blue-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Diff Scans</h1>
          <div className="text-xs text-gray-500">Compare two scans to find new hosts, ports and services</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Baseline Scan</label>
            <select
              value={scan1}
              onChange={(e) => { setScan1(e.target.value); setComputed(false); }}
              className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 outline-none focus:border-blue-500"
            >
              {scans.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <div className="text-gray-600 pb-1">→</div>
          <div>
            <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Comparison Scan</label>
            <select
              value={scan2}
              onChange={(e) => { setScan2(e.target.value); setComputed(false); }}
              className="bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded px-3 py-1.5 outline-none focus:border-blue-500"
            >
              {scans.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
            </select>
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer pb-1">
            <input
              type="checkbox"
              checked={newOnly}
              onChange={(e) => setNewOnly(e.target.checked)}
              className="accent-green-500"
            />
            New findings only
          </label>
          <button
            onClick={() => setComputed(true)}
            disabled={scan1 === scan2}
            className="flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 disabled:opacity-40 text-white text-sm px-4 py-1.5 rounded transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Compute Diff
          </button>
        </div>
        {scan1 === scan2 && <div className="text-xs text-red-400 mt-2">Select two different scans to compare.</div>}
        {scans.length < 2 && <div className="text-xs text-yellow-400 mt-2">Load at least 2 scans to use diff.</div>}
      </div>

      {diff && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'New Hosts', value: diff.newHosts.length, color: 'text-green-400', icon: Plus },
              { label: 'Hosts Gone Down', value: diff.removedHosts.length, color: 'text-red-400', icon: Minus },
              { label: 'New Ports', value: diff.newPortsCount, color: 'text-blue-400', icon: Plus },
              { label: 'High-Value Findings', value: diff.highValueFindings.length, color: 'text-orange-400', icon: AlertTriangle },
            ].map(({ label, value, color, icon: Icon }) => (
              <div key={label} className="bg-gray-900 border border-gray-800 rounded p-3 flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <div>
                  <div className={`text-2xl font-bold ${color}`}>{value}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* High-value findings */}
          {diff.highValueFindings.length > 0 && (
            <div className="bg-gray-900 border border-red-900/50 rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-red-900/30 bg-red-900/10">
                <span className="text-sm font-bold text-red-400">🔴 High-Value New Findings</span>
              </div>
              <div className="divide-y divide-gray-800">
                {diff.highValueFindings.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-green-400 text-sm">{f.ip}</span>
                      <span className="text-orange-400 font-bold">:{f.port}</span>
                      <span className="text-gray-400 text-xs">({f.service})</span>
                    </div>
                    <span className="text-xs text-yellow-300 bg-yellow-900/20 border border-yellow-700/30 px-2 py-0.5 rounded">
                      {f.reason}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Hosts */}
          {diff.newHosts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 bg-green-900/10">
                <span className="text-sm font-bold text-green-400">
                  <Plus className="inline w-4 h-4 mr-1" />
                  New Hosts ({diff.newHosts.length})
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {diff.newHosts.map((h) => (
                  <div key={h.ip} className="bg-green-900/20 border border-green-700/30 rounded px-3 py-2 text-xs">
                    <div className="font-bold text-green-400">{h.ip}</div>
                    {h.hostname && <div className="text-gray-400">{h.hostname}</div>}
                    <div className="text-gray-400 mt-1">
                      {h.ports.filter((p) => p.state === 'open').map((p) => `${p.number}/${p.service}`).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Removed Hosts */}
          {!newOnly && diff.removedHosts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800 bg-red-900/10">
                <span className="text-sm font-bold text-red-400">
                  <Minus className="inline w-4 h-4 mr-1" />
                  Hosts Gone Down ({diff.removedHosts.length})
                </span>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {diff.removedHosts.map((ip) => (
                  <span key={ip} className="bg-red-900/20 border border-red-700/30 rounded px-3 py-1.5 text-xs text-red-400 font-bold">{ip}</span>
                ))}
              </div>
            </div>
          )}

          {/* Port Changes */}
          {portChangedHosts.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-800">
                <span className="text-sm font-bold text-gray-300">Detailed Port Changes ({portChangedHosts.length} hosts)</span>
              </div>
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {portChangedHosts.map(([ip, changes]) => {
                   const host1 = scanMap.get(scan1)?.hosts.find((h) => h.ip === ip);
                  const orig = host1?.ports.filter((p) => p.state === 'open').map((p) => p.number) || [];
                  return (
                    <div key={ip} className="px-4 py-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold text-green-400">{ip}</span>
                        {host1?.hostname && <span className="text-gray-500 text-xs">{host1.hostname}</span>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-gray-500">{scan1}: </span>
                          <span className="text-gray-300">{orig.join(', ')}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">{scan2}: </span>
                          <span className="text-gray-300">
                            {orig.join(', ')}
                            {changes.newPorts.map((p) => (
                              <span key={p.number} className="text-green-400 font-bold ml-1">[+{p.number} NEW]</span>
                            ))}
                            {!newOnly && changes.removedPorts.map((p) => (
                              <span key={p} className="text-red-400 font-bold ml-1">[-{p} CLOSED]</span>
                            ))}
                          </span>
                        </div>
                      </div>
                      {changes.newPorts.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {changes.newPorts.map((p) => (
                            <span key={p.number} className="bg-green-900/30 border border-green-700/40 text-green-300 px-2 py-0.5 rounded text-xs">
                              +{p.number} ({p.service}{p.version ? ` ${p.version}` : ''})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {portChangedHosts.length === 0 && diff.newHosts.length === 0 && diff.removedHosts.length === 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded p-6 text-center text-gray-500 text-sm">
              No differences found between the two scans.
            </div>
          )}
        </>
      )}
    </div>
  );
}
