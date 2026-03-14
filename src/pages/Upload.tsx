import { useState, useRef, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle, X } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { parseNmapXML, parseGNMAP } from '../lib/parser';
import { ScanInfo } from '../types';

const SAMPLE_XML = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE nmaprun>
<nmaprun scanner="nmap" args="nmap -sV -p 22,80,443,445,8080" start="1700000000" version="7.94">
<host starttime="1700000001" endtime="1700000010">
<status state="up" reason="echo-reply"/>
<address addr="192.168.100.10" addrtype="ipv4"/>
<address addr="00:11:22:33:44:55" addrtype="mac"/>
<hostnames><hostname name="webserver.example.local" type="PTR"/></hostnames>
<ports>
  <port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="8.2p1"/></port>
  <port protocol="tcp" portid="80"><state state="open" reason="syn-ack"/><service name="http" product="nginx" version="1.20.0"/></port>
  <port protocol="tcp" portid="443"><state state="open" reason="syn-ack"/><service name="https" product="nginx" version="1.20.0"/></port>
</ports>
<os><osmatch name="Linux 5.4" accuracy="95"/></os>
</host>
<host starttime="1700000011" endtime="1700000020">
<status state="up" reason="echo-reply"/>
<address addr="192.168.100.20" addrtype="ipv4"/>
<hostnames><hostname name="dc01.example.local" type="PTR"/></hostnames>
<ports>
  <port protocol="tcp" portid="53"><state state="open" reason="syn-ack"/><service name="domain" product="Microsoft DNS" version="10.0.17763"/></port>
  <port protocol="tcp" portid="88"><state state="open" reason="syn-ack"/><service name="kerberos-sec" product="Microsoft Windows Kerberos"/></port>
  <port protocol="tcp" portid="389"><state state="open" reason="syn-ack"/><service name="ldap" product="Microsoft Windows Active Directory LDAP"/></port>
  <port protocol="tcp" portid="445"><state state="open" reason="syn-ack"/><service name="microsoft-ds" product="Windows Server 2019 microsoft-ds"/></port>
  <port protocol="tcp" portid="3268"><state state="open" reason="syn-ack"/><service name="msft-gc" product="Microsoft Windows Active Directory LDAP"/></port>
</ports>
<os><osmatch name="Windows Server 2019" accuracy="97"/></os>
</host>
</nmaprun>`;

interface ParseStatus {
  filename: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  scan?: ScanInfo;
}

export default function UploadPage() {
  const { addScan } = useScanStore();
  const [dragOver, setDragOver] = useState(false);
  const [files, setFiles] = useState<ParseStatus[]>([]);
  const [customName, setCustomName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File): Promise<ParseStatus> => {
    const name = file.name;
    try {
      const content = await file.text();
      let scan: ScanInfo;

      if (name.endsWith('.xml')) {
        scan = parseNmapXML(content, name);
      } else if (name.endsWith('.gnmap')) {
        scan = parseGNMAP(content, name);
      } else if (name.endsWith('.nmap')) {
        // Basic .nmap text parsing - treat as gnmap-like
        scan = parseGNMAP(content, name);
      } else {
        return { filename: name, status: 'error', message: 'Unsupported format. Use .xml, .gnmap, or .nmap' };
      }

      if (scan.hosts.length === 0) {
        return { filename: name, status: 'error', message: 'No hosts found in file. Check file format.' };
      }

      return { filename: name, status: 'success', scan };
    } catch (e) {
      return { filename: name, status: 'error', message: `Parse error: ${e instanceof Error ? e.message : String(e)}` };
    }
  }, []);

  const handleFiles = useCallback(async (fileList: FileList) => {
    const arr = Array.from(fileList);
    const pending = arr.map((f): ParseStatus => ({ filename: f.name, status: 'pending' }));
    setFiles(pending);

    const results = await Promise.all(arr.map(processFile));
    setFiles(results);
  }, [processFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleImport = () => {
    files.forEach((f) => {
      if (f.status === 'success' && f.scan) {
        const scan = { ...f.scan };
        if (customName && files.length === 1) scan.name = customName;
        addScan(scan);
      }
    });
    setFiles([]);
    setCustomName('');
  };

  const loadSampleXML = () => {
    const blob = new Blob([SAMPLE_XML], { type: 'text/xml' });
    const file = new File([blob], 'sample_scan.xml', { type: 'text/xml' });
    const dt = new DataTransfer();
    dt.items.add(file);
    handleFiles(dt.files);
  };

  const successCount = files.filter((f) => f.status === 'success').length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Upload className="w-6 h-6 text-green-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Upload Scan</h1>
          <div className="text-xs text-gray-500">Load Nmap XML, GNMAP, or .nmap files</div>
        </div>
      </div>

      {/* Supported formats info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { format: '.xml', label: 'Nmap XML', cmd: 'nmap ... -oX scan.xml', priority: 'P0 · Full data', color: 'text-green-400' },
          { format: '.gnmap', label: 'GNMAP', cmd: 'nmap ... -oG scan.gnmap', priority: 'P1 · Quick parse', color: 'text-blue-400' },
          { format: '.nmap', label: 'Nmap Text', cmd: 'nmap ... -oN scan.nmap', priority: 'P2 · Fallback', color: 'text-gray-400' },
        ].map((f) => (
          <div key={f.format} className="bg-gray-900 border border-gray-800 rounded p-3">
            <div className={`text-sm font-bold ${f.color}`}>{f.format}</div>
            <div className="text-xs text-gray-300 mt-0.5">{f.label}</div>
            <code className="text-xs text-gray-500 mt-1 block">{f.cmd}</code>
            <div className="text-xs text-gray-600 mt-1">{f.priority}</div>
          </div>
        ))}
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-green-500 bg-green-900/10' : 'border-gray-700 bg-gray-900/50 hover:border-gray-500'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className={`w-10 h-10 mx-auto mb-3 ${dragOver ? 'text-green-400' : 'text-gray-600'}`} />
        <div className="text-gray-300 text-sm font-medium">Drop Nmap files here or click to browse</div>
        <div className="text-gray-600 text-xs mt-1">Supports .xml, .gnmap, .nmap — Multiple files allowed</div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".xml,.gnmap,.nmap"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Scan name override */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-48">
          <label className="text-xs text-gray-500 block mb-1">Scan Name (optional, single file only)</label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="e.g. project_top100"
            className="w-full bg-gray-900 border border-gray-700 text-xs text-gray-200 rounded px-3 py-1.5 outline-none focus:border-green-600 placeholder-gray-600"
          />
        </div>
        <button
          onClick={loadSampleXML}
          className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 px-3 py-2 rounded transition-colors self-end"
        >
          Load Sample XML
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-800 text-xs font-bold text-gray-400 uppercase tracking-wide">
            Files ({files.length})
          </div>
          <div className="divide-y divide-gray-800">
            {files.map((f, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-500 shrink-0" />
                  <div>
                    <div className="text-sm text-gray-200">{f.filename}</div>
                    {f.status === 'success' && f.scan && (
                      <div className="text-xs text-green-400">
                        ✓ {f.scan.hostsUp} hosts up · {f.scan.totalOpenPorts} open ports
                      </div>
                    )}
                    {f.status === 'error' && (
                      <div className="text-xs text-red-400">{f.message}</div>
                    )}
                    {f.status === 'pending' && (
                      <div className="text-xs text-gray-500">Parsing...</div>
                    )}
                  </div>
                </div>
                <div>
                  {f.status === 'success' && <Check className="w-4 h-4 text-green-400" />}
                  {f.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400" />}
                  {f.status === 'pending' && <div className="w-4 h-4 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin" />}
                </div>
              </div>
            ))}
          </div>

          {successCount > 0 && (
            <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
              <span className="text-xs text-gray-400">{successCount} file(s) ready to import</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
                <button
                  onClick={handleImport}
                  className="text-xs bg-green-700 hover:bg-green-600 text-white px-4 py-1.5 rounded transition-colors"
                >
                  Import {successCount} Scan{successCount > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CLI reference */}
      <div className="bg-gray-900 border border-gray-800 rounded p-4">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Typical Nmap Commands</div>
        <div className="space-y-2">
          {[
            { label: 'Stage 1: Quick scan (top ports)', cmd: 'nmap -iL scope.txt --top-ports 100 --script=vuln -sV --version-all -Pn -A -v -T4 -oA project_top100' },
            { label: 'Stage 2: Full port scan', cmd: 'nmap -iL scope.txt -p- --script=vuln -sV --version-all -Pn -A -v -T4 -oA project_full' },
            { label: 'Load results (auto-detects formats)', cmd: 'analyzer load project_top100' },
            { label: 'Diff baseline vs full', cmd: 'analyzer diff project_top100 project_full' },
          ].map((item) => (
            <div key={item.label}>
              <div className="text-xs text-gray-500 mb-0.5">{item.label}</div>
              <code className="text-xs text-green-300 font-mono bg-gray-800 px-3 py-1.5 rounded block overflow-x-auto">{item.cmd}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
