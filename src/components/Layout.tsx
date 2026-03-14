import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Server, Globe, Shield, GitCompare,
  Download, Target, Upload, ChevronDown, Wifi, Terminal, Menu, X
} from 'lucide-react';
import { useScanStore } from '../store/scanStore';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hosts', icon: Server, label: 'Hosts' },
  { to: '/services', icon: Globe, label: 'Services' },
  { to: '/ad', icon: Shield, label: 'AD Infrastructure' },
  { to: '/diff', icon: GitCompare, label: 'Diff Scans' },
  { to: '/recommendations', icon: Target, label: 'Recommendations' },
  { to: '/export', icon: Download, label: 'Export Targets' },
  { to: '/upload', icon: Upload, label: 'Upload Scan' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { scans, activeScan, setActiveScan, removeScan } = useScanStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [scanDropdownOpen, setScanDropdownOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 font-mono overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} bg-gray-900 border-r border-gray-800 flex flex-col transition-all duration-200 shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 border-b border-gray-800">
          <Terminal className="w-5 h-5 text-green-400 shrink-0" />
          {sidebarOpen && (
            <span className="text-green-400 font-bold text-sm tracking-wider">NmapAnalyzer</span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="ml-auto text-gray-500 hover:text-gray-300"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>

        {/* Active scan selector */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-b border-gray-800 relative">
            <div className="text-xs text-gray-500 mb-1">ACTIVE SCAN</div>
            <button
              className="w-full flex items-center justify-between text-xs bg-gray-800 px-2 py-1.5 rounded text-green-400 hover:bg-gray-700"
              onClick={() => setScanDropdownOpen(!scanDropdownOpen)}
            >
              <span className="truncate">{activeScan || 'Select scan'}</span>
              <ChevronDown className="w-3 h-3 shrink-0 ml-1" />
            </button>
            {scanDropdownOpen && (
              <div className="absolute left-2 right-2 top-full mt-1 bg-gray-800 border border-gray-700 rounded z-50 shadow-xl">
                {scans.map((scan) => (
                  <div key={scan.name} className="flex items-center justify-between px-2 py-1.5 hover:bg-gray-700 cursor-pointer group">
                    <span
                      className={`text-xs truncate ${activeScan === scan.name ? 'text-green-400' : 'text-gray-300'}`}
                      onClick={() => { setActiveScan(scan.name); setScanDropdownOpen(false); navigate('/'); }}
                    >
                      {scan.name}
                    </span>
                    <button
                      onClick={() => removeScan(scan.name)}
                      className="text-red-500 opacity-0 group-hover:opacity-100 ml-1 hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <div
                  className="px-2 py-1.5 text-xs text-blue-400 hover:bg-gray-700 cursor-pointer border-t border-gray-700"
                  onClick={() => { setScanDropdownOpen(false); navigate('/upload'); }}
                >
                  + Load new scan
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                  isActive
                    ? 'bg-green-900/30 text-green-400 border-r-2 border-green-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              {sidebarOpen && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        {sidebarOpen && (
          <div className="px-3 py-2 border-t border-gray-800">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Wifi className="w-3 h-3 text-green-500" />
              <span>Offline Mode</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-gray-950">
        {children}
      </main>
    </div>
  );
}
