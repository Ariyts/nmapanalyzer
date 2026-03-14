import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, Copy, CheckCheck } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { exportTargets } from '../lib/analyzer';

const EXPORT_CATEGORIES = [
  { key: 'web', label: 'Web Targets', icon: '🌐', desc: 'HTTP/HTTPS services (80, 443, 8080, 8443)' },
  { key: 'smb', label: 'SMB Targets', icon: '📁', desc: 'SMB/NetBIOS services (445, 139)' },
  { key: 'remote_access', label: 'Remote Access', icon: '🔗', desc: 'SSH, RDP, WinRM, VNC (22, 3389, 5985)' },
  { key: 'databases', label: 'Databases', icon: '🗄️', desc: 'MSSQL, MySQL, Postgres, Redis, Elastic...' },
  { key: 'mail', label: 'Mail Servers', icon: '✉️', desc: 'SMTP, IMAP, POP3 services' },
  { key: 'domain_services', label: 'Domain Services', icon: '🏛️', desc: 'LDAP, Kerberos, DNS, MSRPC' },
  { key: 'dc', label: 'Domain Controllers', icon: '⚑', desc: 'Confirmed DC hosts (confidence ≥ 80%)' },
  { key: 'all', label: 'All Hosts', icon: '📋', desc: 'Export all active hosts' },
];

const FORMATS = [
  { key: 'ip', label: 'IP only', example: '192.168.1.1' },
  { key: 'ip:port', label: 'IP:Port', example: '192.168.1.1:445' },
  { key: 'url', label: 'URL', example: 'http://192.168.1.1:8080' },
  { key: 'csv', label: 'CSV', example: 'ip,port,service,hostname' },
  { key: 'json', label: 'JSON', example: '[{"ip": "...", "port": ...}]' },
];

export default function Export() {
  const { getActiveScanData } = useScanStore();
  const scan = getActiveScanData();
  const [searchParams] = useSearchParams();
  const defaultCat = searchParams.get('category') || 'smb';

  const [category, setCategory] = useState(defaultCat);
  const [format, setFormat] = useState<'ip' | 'ip:port' | 'url' | 'csv' | 'json'>('ip:port');
  const [copied, setCopied] = useState(false);

  const output = useMemo(() => {
    if (!scan) return '';
    return exportTargets(scan.hosts, category, format);
  }, [scan, category, format]);

  const lineCount = output ? output.split('\n').filter(Boolean).length : 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownload = () => {
    const ext = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'txt';
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${category}_targets_${scan?.name || 'export'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!scan) return <div className="p-8 text-gray-500">No scan loaded.</div>;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Download className="w-6 h-6 text-green-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Export Targets</h1>
          <div className="text-xs text-gray-500">Generate target lists for your pentest tools</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: config */}
        <div className="space-y-4">
          {/* Category */}
          <div className="bg-gray-900 border border-gray-800 rounded p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Category</div>
            <div className="space-y-1.5">
              {EXPORT_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setCategory(cat.key)}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded text-left transition-colors ${
                    category === cat.key
                      ? 'bg-green-900/30 border border-green-700/50 text-green-300'
                      : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  <span className="shrink-0">{cat.icon}</span>
                  <div>
                    <div className="text-xs font-bold">{cat.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{cat.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format */}
          <div className="bg-gray-900 border border-gray-800 rounded p-4">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Output Format</div>
            <div className="space-y-1.5">
              {FORMATS.map((fmt) => (
                <button
                  key={fmt.key}
                  onClick={() => setFormat(fmt.key as typeof format)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded text-left transition-colors ${
                    format === fmt.key
                      ? 'bg-blue-900/30 border border-blue-700/50 text-blue-300'
                      : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-750'
                  }`}
                >
                  <span className="text-xs font-bold">{fmt.label}</span>
                  <code className="text-xs text-gray-500">{fmt.example}</code>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: output */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Output: <span className="text-white font-bold">{lineCount}</span> targets
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-1.5 rounded transition-colors"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleDownload}
                disabled={!output}
                className="flex items-center gap-1.5 text-xs bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white px-3 py-1.5 rounded transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-900 border border-gray-800 rounded p-4 overflow-auto min-h-80 max-h-[60vh]">
            {output ? (
              <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap leading-5">{output}</pre>
            ) : (
              <div className="text-gray-600 text-xs text-center py-8">No results for this category.</div>
            )}
          </div>

          {/* CLI equivalent */}
          <div className="bg-gray-900 border border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 mb-1.5">CLI Equivalent</div>
            <code className="text-xs text-yellow-300 font-mono">
              analyzer export {category} --format {format} -o {category}_targets.txt
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}
