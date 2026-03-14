import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Server, Wifi, Globe, Database, AlertTriangle, Shield, ChevronRight, GitCompare } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useScanStore } from '../store/scanStore';
import { classifyServices, getTopServices, detectADInfrastructure, diffScans } from '../lib/analyzer';

function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded p-4 flex items-center gap-4">
      <div className={`p-2 rounded ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
        <div className="text-xs text-gray-400 uppercase tracking-wide">{label}</div>
      </div>
    </div>
  );
}

const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#f97316', '#6b7280'];

export default function Dashboard() {
  const { scans, getActiveScanData } = useScanStore();
  const scan = getActiveScanData();
  const navigate = useNavigate();

  const services = useMemo(() => scan ? classifyServices(scan.hosts) : [], [scan]);
  const topServices = useMemo(() => scan ? getTopServices(scan.hosts) : [], [scan]);
  const adInfo = useMemo(() => scan ? detectADInfrastructure(scan.hosts) : null, [scan]);

  // Diff alert
  const hasDiff = scans.length >= 2;
  const diffData = useMemo(() => {
    if (scans.length < 2) return null;
    return diffScans(scans[0], scans[1]);
  }, [scans]);

  if (!scan) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <p className="text-gray-400">No scan loaded. <button onClick={() => navigate('/upload')} className="text-green-400 underline">Upload a scan</button> to get started.</p>
      </div>
    );
  }

  const pieData = services.slice(0, 6).map((s, i) => ({ name: s.label, value: s.hosts.length, color: COLORS[i] }));

  return (
    <div className="p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest">Scan Analysis</div>
          <h1 className="text-lg font-bold text-green-400 mt-0.5">{scan.name}</h1>
          <div className="text-xs text-gray-500">{scan.filename} · Loaded {new Date(scan.loadedAt).toLocaleString()}</div>
        </div>
        <button
          onClick={() => navigate('/upload')}
          className="flex items-center gap-1.5 bg-green-700 hover:bg-green-600 text-white text-xs px-3 py-1.5 rounded transition-colors"
        >
          + Upload Scan
        </button>
      </div>

      {/* Diff Alert */}
      {hasDiff && diffData && (
        <div
          className="bg-yellow-900/20 border border-yellow-700/50 rounded p-3 flex items-center justify-between cursor-pointer hover:bg-yellow-900/30"
          onClick={() => navigate('/diff')}
        >
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-yellow-300">
              <strong>DIFF ALERT:</strong> Scan "{diffData.scan2Name}" has{' '}
              <span className="text-red-400 font-bold">{diffData.newPortsCount} new ports</span> vs "{diffData.scan1Name}".{' '}
              {diffData.newHosts.length > 0 && <span>{diffData.newHosts.length} new hosts discovered.</span>}
            </span>
          </div>
          <span className="text-xs text-yellow-400 flex items-center gap-1">View Diff <ChevronRight className="w-3 h-3" /></span>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Hosts Up" value={scan.hostsUp} icon={Wifi} color="bg-green-900/40 text-green-400" />
        <StatCard label="Open Ports" value={scan.totalOpenPorts} icon={Globe} color="bg-blue-900/40 text-blue-400" />
        <StatCard label="Services" value={topServices.length} icon={Database} color="bg-purple-900/40 text-purple-400" />
        <StatCard label="Scans Loaded" value={scans.length} icon={Server} color="bg-orange-900/40 text-orange-400" />
      </div>

      {/* Charts + AD */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Service Distribution Bar */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded p-4">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Top Services</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={topServices.slice(0, 8)} margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
              <XAxis dataKey="service" tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: '1px solid #374151', borderRadius: 4, fontSize: 11 }}
                labelStyle={{ color: '#d1d5db' }}
              />
              <Bar dataKey="count" fill="#22c55e" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie */}
        <div className="bg-gray-900 border border-gray-800 rounded p-4">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Service Distribution</h2>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={60} dataKey="value">
                {pieData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1f2937', border: '1px solid #374151', fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1 mt-1">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-gray-400">{d.name}</span>
                </div>
                <span className="text-gray-300 font-bold">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AD Infrastructure */}
      {adInfo && (adInfo.domainControllers.length > 0 || adInfo.possibleDCs.length > 0) && (
        <div className="bg-gray-900 border border-orange-800/50 rounded p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-orange-400" />
              <h2 className="text-xs font-bold text-orange-400 uppercase tracking-wider">Active Directory Infrastructure</h2>
            </div>
            <button onClick={() => navigate('/ad')} className="text-xs text-orange-400 hover:underline flex items-center gap-1">
              View Details <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Detected Domain</div>
              <div className="text-sm text-green-400 font-bold">{adInfo.domain?.toUpperCase() || 'UNKNOWN'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Domain Controllers</div>
              <div className="text-sm text-white">
                {adInfo.domainControllers.length > 0
                  ? adInfo.domainControllers.map((dc) => (
                      <div key={dc.host.ip} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        <span>{dc.host.ip}</span>
                        {dc.host.hostname && <span className="text-gray-400 text-xs">{dc.host.hostname}</span>}
                        <span className="text-green-400 text-xs">[{Math.round(dc.confidence * 100)}%]</span>
                      </div>
                    ))
                  : <span className="text-gray-500">None detected</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Domain-Joined Hosts</div>
              <div className="text-sm text-white">{adInfo.domainJoinedHosts.length} hosts</div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Export */}
      <div className="bg-gray-900 border border-gray-800 rounded p-4">
        <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Quick Export</h2>
        <div className="flex flex-wrap gap-2">
          {['smb', 'web', 'dc', 'databases', 'remote_access'].map((cat) => (
            <button
              key={cat}
              onClick={() => navigate(`/export?category=${cat}`)}
              className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 px-3 py-1.5 rounded transition-colors"
            >
              {cat.replace('_', ' ').toUpperCase()} Targets
            </button>
          ))}
          <button
            onClick={() => navigate('/export?category=all')}
            className="text-xs bg-green-800 hover:bg-green-700 border border-green-700 text-green-100 px-3 py-1.5 rounded transition-colors"
          >
            All High-Value
          </button>
        </div>
      </div>

      {/* Service groups summary */}
      <div className="bg-gray-900 border border-gray-800 rounded p-4">
        <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider mb-3">Service Groups</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {services.map((sg) => (
            <button
              key={sg.category}
              onClick={() => navigate('/services')}
              className="flex items-center justify-between bg-gray-800 hover:bg-gray-750 border border-gray-700 rounded p-2.5 text-xs transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: sg.color }} />
                <span className="text-gray-300">{sg.label}</span>
              </div>
              <span className="font-bold text-white">{sg.hosts.length}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
