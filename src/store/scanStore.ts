import { create } from 'zustand';
import { ScanInfo, ScanDiff } from '../types';
import { DEMO_SCAN_BASELINE, DEMO_SCAN_FULL } from '../data/mockData';
import { diffScans } from '../lib/analyzer';

interface ScanStore {
  scans: ScanInfo[];
  activeScan: string | null;
  diffs: ScanDiff[];
  addScan: (scan: ScanInfo) => void;
  removeScan: (name: string) => void;
  setActiveScan: (name: string | null) => void;
  computeDiff: (scan1Name: string, scan2Name: string) => ScanDiff | null;
  getActiveScanData: () => ScanInfo | null;
}

export const useScanStore = create<ScanStore>((set, get) => ({
  scans: [DEMO_SCAN_BASELINE, DEMO_SCAN_FULL],
  activeScan: DEMO_SCAN_BASELINE.name,
  diffs: [],

  addScan: (scan) => {
    set((state) => ({
      scans: [...state.scans.filter((s) => s.name !== scan.name), scan],
      activeScan: scan.name,
    }));
  },

  removeScan: (name) => {
    set((state) => ({
      scans: state.scans.filter((s) => s.name !== name),
      activeScan: state.activeScan === name ? (state.scans[0]?.name ?? null) : state.activeScan,
      diffs: state.diffs.filter((d) => d.scan1Name !== name && d.scan2Name !== name),
    }));
  },

  setActiveScan: (name) => set({ activeScan: name }),

  computeDiff: (scan1Name, scan2Name) => {
    const { scans } = get();
    const scan1 = scans.find((s) => s.name === scan1Name);
    const scan2 = scans.find((s) => s.name === scan2Name);
    if (!scan1 || !scan2) return null;
    const diff = diffScans(scan1, scan2);
    set((state) => ({
      diffs: [...state.diffs.filter((d) => !(d.scan1Name === scan1Name && d.scan2Name === scan2Name)), diff],
    }));
    return diff;
  },

  getActiveScanData: () => {
    const { scans, activeScan } = get();
    return scans.find((s) => s.name === activeScan) ?? null;
  },
}));
