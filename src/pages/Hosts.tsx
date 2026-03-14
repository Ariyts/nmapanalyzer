import { useState, useMemo } from 'react';
import { Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { Host } from '../types';

const TAG_COLORS: Record<string, string> = {
  DC: 'bg-orange-900/50 text-orange-300 border-orange-700',
  Web: 'bg-blue-900/50 text-blue-300 border-blue-700',
  SMB: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
  Database: 'bg-red-900/50 text-red-300 border-red-700',
  SSH: 'bg-purple-900/50 text-purple-300 border-purple-700',
  RDP: 'bg-pink-900/50 text-pink-300 border-pink-700',
  WinRM: 'bg-indigo-900/50 text-indigo-300 border-indigo-700',
  Mail: 'bg-green-900/50 text-green-300 border-green-700',
  Printer: 'bg-gray-700/50 text-gray-300 border-gray-600',
  'Domain Services': 'bg-orange-900/40 text-orange-300 border-orange-700',
  'File Server': 'bg-yellow-900/40 text-yellow-300 border-yellow-800',
};

function PortBadge({ port }: { port: Host['ports'][0] }) {
  const highValue = [6379, 9200, 1433, 3306, 5985, 27017, 23].includes(port.number);
  return (
    <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded border mr-1 mb-1 ${
      highValue ? 'bg-red-900/50 text-red-300 border-red-700' : 'bg-gray-800 text-gray-300 border-gray-700'
    }`}>
      {port.number}/{port.protocol}
      {port.service !== 'unknown' && <span className="ml-1 text-gray-500">({port.service})</span>}
    </span>
  );
}

function HostRow({ host, expanded, onToggle }: { host: Host; expanded: boolean; onToggle: () => void }) {
  const openPorts = host.ports.filter((p) => p.state === 'open');
  return (
    <>
      <tr
        className="border-b border-gray-800 hover:bg-gray-900/50 cursor-pointer"
        onClick={onToggle}
      >
        <td className="px-3 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${host.state === 'up' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="font-bold text-green-400">{host.ip}</span>
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-400 max-w-0 truncate">
          {host.hostname || <span className="text-gray-600">—</span>}
        </td>
        <td className="px-3 py-2.5 text-xs">
          <span className="text-blue-400 font-bold">{openPorts.length}</span>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-400">
          {host.osDetection || <span className="text-gray-600">—</span>}
        </td>
        <td className="px-3 py-2.5 text-xs">
          <div className="flex flex-wrap gap-1">
            {(host.tags || []).slice(0, 3).map((tag) => (
              <span key={tag} className={`px-1.5 py-0.5 rounded border text-xs ${TAG_COLORS[tag] || 'bg-gray-700 text-gray-300 border-gray-600'}`}>
                {tag}
              </span>
            ))}
            {host.isDC && !host.tags?.includes('DC') && (
              <span className={`px-1.5 py-0.5 rounded border text-xs ${TAG_COLORS['DC']}`}>DC</span>
            )}
          </div>
        </td>
        <td className="px-3 py-2.5 text-xs text-gray-500">
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-900/30">
          <td colSpan={6} className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Ports */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Open Ports</div>
                <div className="flex flex-wrap">
                  {openPorts.map((p) => <PortBadge key={`${p.number}/${p.protocol}`} port={p} />)}
                  {openPorts.length === 0 && <span className="text-gray-600 text-xs">No open ports</span>}
                </div>
              </div>
              {/* Details */}
              <div className="space-y-1">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Details</div>
                {host.hostname && (
                  <div className="text-xs"><span className="text-gray-500">Hostname: </span><span className="text-gray-200">{host.hostname}</span></div>
                )}
                {host.mac && (
                  <div className="text-xs"><span className="text-gray-500">MAC: </span><span className="text-gray-200">{host.mac}</span></div>
                )}
                {host.osDetection && (
                  <div className="text-xs"><span className="text-gray-500">OS: </span><span className="text-gray-200">{host.osDetection}</span></div>
                )}
                {host.isDC && (
                  <div className="text-xs"><span className="text-orange-400">⚑ Domain Controller</span><span className="text-gray-400 ml-2">[{Math.round((host.dcConfidence || 0) * 100)}% confidence]</span></div>
                )}
                {host.domain && (
                  <div className="text-xs"><span className="text-gray-500">Domain: </span><span className="text-green-400">{host.domain}</span></div>
                )}
              </div>
            </div>
            {/* Scripts */}
            {openPorts.some((p) => p.scripts && p.scripts.length > 0) && (
              <div className="mt-3">
                <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Script Results</div>
                {openPorts.filter((p) => p.scripts && p.scripts.length > 0).map((p) =>
                  p.scripts!.map((s) => (
                    <div key={s.name} className="text-xs mb-1">
                      <span className="text-yellow-400">[{p.number}/{p.protocol}] {s.name}: </span>
                      <span className="text-gray-400">{s.output.slice(0, 200)}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

const ALL_TAGS = ['DC', 'Web', 'SMB', 'Database', 'SSH', 'RDP', 'WinRM', 'Mail', 'Printer', 'Domain Services'];

export default function Hosts() {
  const { getActiveScanData } = useScanStore();
  const scan = getActiveScanData();
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [stateFilter, setStateFilter] = useState<'all' | 'up' | 'down'>('up');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const filtered = useMemo(() => {
    if (!scan) return [];
    return scan.hosts.filter((h) => {
      if (stateFilter !== 'all' && h.state !== stateFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const inIP = h.ip.includes(q);
        const inHost = h.hostname?.toLowerCase().includes(q);
        const inOS = h.osDetection?.toLowerCase().includes(q);
        const inPort = h.ports.some((p) => String(p.number).includes(q) || p.service.toLowerCase().includes(q));
        const inTags = (h.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!inIP && !inHost && !inOS && !inPort && !inTags) return false;
      }
      if (selectedTags.length > 0) {
        const hostTags = [...(h.tags || []), ...(h.isDC ? ['DC'] : [])];
        if (!selectedTags.some((t) => hostTags.includes(t))) return false;
      }
      return true;
    });
  }, [scan, search, selectedTags, stateFilter]);

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
    setPage(0);
  };

  const toggleExpanded = (ip: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) next.delete(ip);
      else next.add(ip);
      return next;
    });
  };

  if (!scan) return <div className="p-8 text-gray-500">No scan loaded.</div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-white">Hosts</h1>
          <div className="text-xs text-gray-500">{filtered.length} hosts {search || selectedTags.length > 0 ? 'matching filters' : 'total'}</div>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'up', 'down'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStateFilter(s); setPage(0); }}
              className={`text-xs px-2.5 py-1 rounded ${stateFilter === s ? 'bg-green-700 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-40">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search IP, hostname, port, service..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="w-full bg-gray-900 border border-gray-700 text-xs text-gray-200 rounded pl-7 pr-3 py-1.5 outline-none focus:border-green-600 placeholder-gray-600"
          />
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter className="w-3 h-3 text-gray-500" />
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`text-xs px-2 py-0.5 rounded border transition-colors ${
                selectedTags.includes(tag)
                  ? TAG_COLORS[tag] || 'bg-gray-700 text-white border-gray-500'
                  : 'border-gray-700 text-gray-500 hover:text-gray-300'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-800 border-b border-gray-700">
            <tr>
              <th className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider w-32">IP</th>
              <th className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Hostname</th>
              <th className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider w-16">Ports</th>
              <th className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">OS</th>
              <th className="px-3 py-2 text-xs text-gray-400 font-semibold uppercase tracking-wider">Tags</th>
              <th className="px-3 py-2 w-8" />
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-gray-500 text-xs">No hosts match the current filters</td></tr>
            )}
            {paginated.map((host) => (
              <HostRow
                key={host.ip}
                host={host}
                expanded={expanded.has(host.ip)}
                onToggle={() => toggleExpanded(host.ip)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <button onClick={() => setPage(0)} disabled={page === 0} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-30">«</button>
            <button onClick={() => setPage(p => p - 1)} disabled={page === 0} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-30">‹</button>
            <span className="px-2 py-1">{page + 1} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-30">›</button>
            <button onClick={() => setPage(totalPages - 1)} disabled={page >= totalPages - 1} className="px-2 py-1 rounded bg-gray-800 disabled:opacity-30">»</button>
          </div>
        </div>
      )}
    </div>
  );
}
