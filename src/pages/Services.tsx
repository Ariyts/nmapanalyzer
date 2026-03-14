import { useMemo } from 'react';
import { Globe, ChevronDown, ChevronUp } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { classifyServices } from '../lib/analyzer';
import { useState } from 'react';

export default function Services() {
  const { getActiveScanData } = useScanStore();
  const scan = getActiveScanData();
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['web']));

  const services = useMemo(() => (scan ? classifyServices(scan.hosts) : []), [scan]);

  const toggle = (cat: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (!scan) return <div className="p-8 text-gray-500">No scan loaded.</div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-blue-400" /> Services
        </h1>
        <div className="text-xs text-gray-500 mt-0.5">{services.length} service categories across {scan.hostsUp} hosts</div>
      </div>

      {services.map((sg) => {
        const isOpen = expanded.has(sg.category);
        // Group ports by service name
        const portFreq = new Map<string, { service: string; port: number; count: number }>();
        sg.ports.forEach(({ port }) => {
          const key = `${port.number}/${port.protocol}`;
          const existing = portFreq.get(key);
          portFreq.set(key, { service: port.service, port: port.number, count: (existing?.count || 0) + 1 });
        });
        const portStats = Array.from(portFreq.values()).sort((a, b) => b.count - a.count);

        return (
          <div key={sg.category} className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
            {/* Header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-800 transition-colors"
              onClick={() => toggle(sg.category)}
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ background: sg.color }} />
                <span className="font-bold text-sm text-white">{sg.label}</span>
                <span className="text-xs text-gray-400">{sg.hosts.length} hosts · {sg.ports.length} open ports</span>
              </div>
              {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-800 p-4">
                {/* Port breakdown */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Port Distribution</div>
                  <div className="flex flex-wrap gap-2">
                    {portStats.map((ps) => (
                      <div key={`${ps.port}`} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded px-2.5 py-1">
                        <span className="text-green-400 font-bold text-xs">{ps.port}</span>
                        <span className="text-gray-400 text-xs">({ps.service})</span>
                        <span className="text-white text-xs font-bold ml-1">{ps.count}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bar visualization */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Host Coverage</div>
                  <div className="space-y-1">
                    {portStats.slice(0, 5).map((ps) => {
                      const pct = (ps.count / scan.hostsUp) * 100;
                      return (
                        <div key={ps.port} className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 w-24 shrink-0">{ps.port}/{ps.service.slice(0, 8)}</span>
                          <div className="flex-1 bg-gray-800 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full"
                              style={{ width: `${pct}%`, background: sg.color }}
                            />
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{ps.count} hosts</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Hosts list */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Affected Hosts</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 max-h-48 overflow-y-auto">
                    {sg.hosts.map((host) => {
                      const matchedPorts = host.ports.filter((p) =>
                        sg.ports.some((sp) => sp.ip === host.ip && sp.port.number === p.number)
                      );
                      return (
                        <div key={host.ip} className="flex items-center justify-between bg-gray-800 rounded px-2.5 py-1.5 text-xs">
                          <div>
                            <span className="text-green-400 font-bold">{host.ip}</span>
                            {host.hostname && <span className="text-gray-500 ml-2 text-xs">{host.hostname.split('.')[0]}</span>}
                          </div>
                          <div className="flex gap-1">
                            {matchedPorts.slice(0, 3).map((p) => (
                              <span key={p.number} className="text-gray-400">{p.number}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
