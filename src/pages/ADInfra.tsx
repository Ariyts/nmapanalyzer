import { useMemo } from 'react';
import { Shield, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { useScanStore } from '../store/scanStore';
import { detectADInfrastructure } from '../lib/analyzer';

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 80 ? 'text-green-400' : pct >= 60 ? 'text-yellow-400' : 'text-red-400';
  return <span className={`font-bold ${color}`}>[{pct}%]</span>;
}

function PortList({ ports }: { ports: { number: number; service: string }[] }) {
  const dcPorts = [53, 88, 135, 139, 389, 445, 464, 636, 3268, 3269, 3389];
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {ports.map((p) => (
        <span
          key={p.number}
          className={`text-xs px-1.5 py-0.5 rounded border ${
            dcPorts.includes(p.number)
              ? 'bg-orange-900/40 text-orange-300 border-orange-700'
              : 'bg-gray-800 text-gray-400 border-gray-700'
          }`}
        >
          {p.number}/{p.service}
        </span>
      ))}
    </div>
  );
}

export default function ADInfra() {
  const { getActiveScanData } = useScanStore();
  const scan = getActiveScanData();
  const adInfo = useMemo(() => (scan ? detectADInfrastructure(scan.hosts) : null), [scan]);

  if (!scan || !adInfo) return <div className="p-8 text-gray-500">No scan loaded.</div>;

  const noDCFound = adInfo.domainControllers.length === 0 && adInfo.possibleDCs.length === 0;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-orange-400" />
        <div>
          <h1 className="text-lg font-bold text-white">Active Directory Infrastructure</h1>
          <div className="text-xs text-gray-500">Automatic AD detection based on port analysis</div>
        </div>
      </div>

      {/* Domain Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {[
          { label: 'Detected Domain', value: adInfo.domain?.toUpperCase() || 'UNKNOWN', color: 'text-green-400' },
          { label: 'Domain Controllers', value: adInfo.domainControllers.length, color: 'text-white' },
          { label: 'Possible DCs', value: adInfo.possibleDCs.length, color: 'text-yellow-400' },
          { label: 'Domain-Joined Hosts', value: adInfo.domainJoinedHosts.length, color: 'text-white' },
        ].map((stat) => (
          <div key={stat.label} className="bg-gray-900 border border-gray-800 rounded p-3">
            <div className="text-xs text-gray-500 mb-1">{stat.label}</div>
            <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      {noDCFound && (
        <div className="bg-gray-900 border border-gray-700 rounded p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <div>
            <div className="text-sm text-gray-300 font-bold">No Domain Controllers Detected</div>
            <div className="text-xs text-gray-500 mt-0.5">
              DC detection requires Kerberos (88) + LDAP (389). Make sure the scan covered these ports.
            </div>
          </div>
        </div>
      )}

      {/* Confirmed DCs */}
      {adInfo.domainControllers.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 bg-green-900/10 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-sm font-bold text-green-400">Confirmed Domain Controllers (confidence ≥ 80%)</span>
          </div>
          <div className="divide-y divide-gray-800">
            {adInfo.domainControllers.map(({ host, confidence }) => (
              <div key={host.ip} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 font-bold text-sm">⚑</span>
                    <span className="font-bold text-green-400">{host.ip}</span>
                    {host.hostname && <span className="text-gray-400 text-xs">{host.hostname}</span>}
                    <ConfidenceBadge confidence={confidence} />
                  </div>
                  {host.osDetection && (
                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{host.osDetection}</span>
                  )}
                </div>
                <PortList ports={host.ports.filter((p) => p.state === 'open')} />

                {/* DC Indicator explanation */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {[
                    { port: 88, label: 'Kerberos', present: host.ports.some((p) => p.number === 88) },
                    { port: 389, label: 'LDAP', present: host.ports.some((p) => p.number === 389) },
                    { port: 53, label: 'DNS', present: host.ports.some((p) => p.number === 53) },
                    { port: 3268, label: 'Global Catalog', present: host.ports.some((p) => p.number === 3268) },
                    { port: 445, label: 'SMB', present: host.ports.some((p) => p.number === 445) },
                  ].map((ind) => (
                    <span
                      key={ind.port}
                      className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 ${
                        ind.present
                          ? 'bg-green-900/30 text-green-300 border-green-700'
                          : 'bg-gray-800 text-gray-600 border-gray-700'
                      }`}
                    >
                      {ind.present ? '✓' : '✗'} {ind.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Possible DCs */}
      {adInfo.possibleDCs.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800 bg-yellow-900/10 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400">Possible DCs (confidence 40–79%)</span>
          </div>
          <div className="divide-y divide-gray-800">
            {adInfo.possibleDCs.map(({ host, confidence }) => (
              <div key={host.ip} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-green-400">{host.ip}</span>
                  {host.hostname && <span className="text-gray-400 text-xs">{host.hostname}</span>}
                  <ConfidenceBadge confidence={confidence} />
                </div>
                <PortList ports={host.ports.filter((p) => p.state === 'open')} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain-joined hosts */}
      {adInfo.domainJoinedHosts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800">
            <span className="text-sm font-bold text-gray-300">
              Domain-Joined Hosts ({adInfo.domainJoinedHosts.length})
            </span>
            <span className="text-xs text-gray-500 ml-2">
              Hosts with {adInfo.domain} suffix
            </span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {adInfo.domainJoinedHosts.map((host) => (
                <div key={host.ip} className="flex items-center justify-between bg-gray-800 rounded px-2.5 py-1.5 text-xs">
                  <div>
                    <span className="text-green-400 font-bold">{host.ip}</span>
                    {host.hostname && (
                      <div className="text-gray-400">{host.hostname}</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {(host.tags || []).slice(0, 2).map((tag) => (
                      <span key={tag} className="bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded text-xs">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Attack vectors for AD */}
      {adInfo.domainControllers.length > 0 && (
        <div className="bg-gray-900 border border-red-900/50 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-red-900/30 bg-red-900/10">
            <span className="text-sm font-bold text-red-400">⚠ Recommended AD Attack Vectors</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { cmd: `GetNPUsers.py ${adInfo.domain || 'DOMAIN'}/ -no-pass -usersfile users.txt`, label: 'AS-REP Roasting' },
              { cmd: `GetUserSPNs.py ${adInfo.domain || 'DOMAIN'}/user:pass -dc-ip ${adInfo.domainControllers[0]?.host.ip}`, label: 'Kerberoasting' },
              { cmd: `bloodhound-python -d ${adInfo.domain || 'DOMAIN'} -u user -p pass -ns ${adInfo.domainControllers[0]?.host.ip} -c all`, label: 'BloodHound Collection' },
              { cmd: `ldapsearch -x -H ldap://${adInfo.domainControllers[0]?.host.ip} -b '' -s base namingContexts`, label: 'LDAP Anonymous Bind' },
              { cmd: `kerbrute userenum --dc ${adInfo.domainControllers[0]?.host.ip} -d ${adInfo.domain || 'DOMAIN'} users.txt`, label: 'User Enumeration' },
            ].map((item) => (
              <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                <span className="text-xs text-gray-500 w-40 shrink-0">{item.label}:</span>
                <code className="text-xs text-green-300 bg-gray-800 px-3 py-1 rounded font-mono overflow-x-auto flex-1">{item.cmd}</code>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
