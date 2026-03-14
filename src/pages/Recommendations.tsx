import { useMemo, useState } from 'react';
import { Target, Copy, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { generateRecommendations } from '../lib/analyzer';
import { Recommendation } from '../types';

const PRIORITY_ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const PRIORITY_STYLES: Record<string, { border: string; bg: string; label: string }> = {
  CRITICAL: { border: 'border-red-700/50', bg: 'bg-red-900/10', label: 'text-red-400' },
  HIGH: { border: 'border-orange-700/50', bg: 'bg-orange-900/10', label: 'text-orange-400' },
  MEDIUM: { border: 'border-yellow-700/50', bg: 'bg-yellow-900/10', label: 'text-yellow-400' },
  LOW: { border: 'border-gray-700', bg: 'bg-gray-900', label: 'text-gray-400' },
};

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);
  const style = PRIORITY_STYLES[rec.priority];
  const targets = rec.targets.slice(0, 5);

  const copyCmd = (cmd: string, idx: number) => {
    navigator.clipboard.writeText(cmd).then(() => {
      setCopied(idx);
      setTimeout(() => setCopied(null), 1500);
    });
  };

  return (
    <div className={`border ${style.border} rounded overflow-hidden`}>
      <button
        className={`w-full flex items-center justify-between px-4 py-3 ${style.bg} hover:brightness-110 transition-all`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">{rec.icon}</span>
          <div className="text-left">
            <div className={`font-bold text-sm ${style.label}`}>{rec.priority}</div>
            <div className="text-gray-200 text-sm">{rec.category}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{rec.targets.length} targets · {rec.checks.length} checks</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>

      {expanded && (
        <div className="bg-gray-900 border-t border-gray-800 p-4 space-y-3">
          {/* Target IPs */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Target IPs</div>
            <div className="flex flex-wrap gap-1.5">
              {targets.map((ip) => (
                <span key={ip} className="bg-gray-800 border border-gray-700 text-green-400 text-xs px-2 py-0.5 rounded font-mono">{ip}</span>
              ))}
              {rec.targets.length > 5 && (
                <span className="text-gray-500 text-xs self-center">+{rec.targets.length - 5} more</span>
              )}
            </div>
          </div>

          {/* Commands */}
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-1.5">Attack Checklist</div>
            <div className="space-y-1.5">
              {rec.checks.map((check, i) => {
                const isComment = check.startsWith('#');
                return (
                  <div key={i} className="flex items-start gap-2 group">
                    <span className="text-gray-600 text-xs mt-1 shrink-0">□</span>
                    <code className={`flex-1 text-xs px-2.5 py-1.5 rounded font-mono break-all ${
                      isComment ? 'text-gray-500 bg-transparent' : 'bg-gray-800 text-green-300 border border-gray-700'
                    }`}>
                      {check}
                    </code>
                    {!isComment && (
                      <button
                        onClick={() => copyCmd(check, i)}
                        className="shrink-0 text-gray-600 hover:text-gray-300 mt-0.5 transition-colors"
                        title="Copy command"
                      >
                        {copied === i ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Recommendations() {
  const { getActiveScanData } = useScanStore();
  const scan = getActiveScanData();
  const [filterPriority, setFilterPriority] = useState<string>('ALL');

  const recs = useMemo(
    () => scan ? generateRecommendations(scan.hosts).sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]) : [],
    [scan]
  );

  const filtered = filterPriority === 'ALL' ? recs : recs.filter((r) => r.priority === filterPriority);

  if (!scan) return <div className="p-8 text-gray-500">No scan loaded.</div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Target className="w-6 h-6 text-red-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Attack Recommendations</h1>
          <div className="text-xs text-gray-500">Automated pentest playbook based on discovered services</div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'] as const).map((p) => {
          const count = p === 'ALL' ? recs.length : recs.filter((r) => r.priority === p).length;
          const style = p === 'ALL' ? { label: 'text-gray-300', bg: 'bg-gray-800' } : PRIORITY_STYLES[p];
          return (
            <button
              key={p}
              onClick={() => setFilterPriority(p)}
              className={`${style.bg} border ${p === 'ALL' ? 'border-gray-700' : PRIORITY_STYLES[p]?.border} rounded p-2.5 text-left transition-all ${filterPriority === p ? 'ring-1 ring-green-500' : ''}`}
            >
              <div className={`text-xl font-bold ${p === 'ALL' ? 'text-white' : PRIORITY_STYLES[p].label}`}>{count}</div>
              <div className="text-xs text-gray-500">{p} {p !== 'ALL' ? 'priority' : 'total'}</div>
            </button>
          );
        })}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded p-6 text-center text-gray-500 text-sm">
            No recommendations for the selected priority.
          </div>
        )}
        {filtered.map((rec, i) => (
          <RecommendationCard key={i} rec={rec} />
        ))}
      </div>
    </div>
  );
}
