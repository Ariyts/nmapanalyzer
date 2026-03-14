/**
 * Configuration-Driven Architecture Types
 * Enhanced with multi-level heuristic matching for CTF scenarios
 */

// ============================================
// MATCHING SYSTEM (Priority-based detection)
// ============================================

/**
 * Priority levels for service matching
 * Higher priority = checked first
 */
export enum MatcherPriority {
  /** Service name from Nmap -sV (highest confidence) */
  SERVICE_NAME = 100,
  /** CPE identifier match */
  CPE = 90,
  /** Regex pattern on raw banner */
  BANNER_REGEX = 70,
  /** Product name detection */
  PRODUCT = 60,
  /** Version-based detection */
  VERSION = 50,
  /** NSE script output match */
  NSE_SCRIPT = 40,
  /** Port-based fallback (lowest confidence) */
  PORT = 20,
}

/**
 * Single matcher rule
 */
export interface MatcherRule {
  /** Priority level for this matcher */
  priority: MatcherPriority;
  
  /** Matcher type */
  type: 'service_name' | 'cpe' | 'banner_regex' | 'product' | 'version' | 'nse_script' | 'port';
  
  /** The pattern to match (string for exact, regex for patterns) */
  pattern: string;
  
  /** Case insensitive matching (default: true) */
  caseInsensitive?: boolean;
  
  /** Confidence score 0-100 (how sure we are) */
  confidence?: number;
  
  /** Optional: specific NSE script name to check */
  nseScript?: string;
}

/**
 * Matchers configuration for a service
 * Ordered by priority for the matching engine
 */
export interface ServiceMatchers {
  /** Match by Nmap service name (from -sV) */
  serviceNames?: string[];
  
  /** Match by CPE identifier (e.g., "cpe:/a:apache:http_server") */
  cpePatterns?: string[];
  
  /** Regex patterns to match against raw banner/response */
  bannerRegex?: string[];
  
  /** Product name patterns */
  productPatterns?: string[];
  
  /** Version patterns (for specific version detection) */
  versionPatterns?: string[];
  
  /** Standard ports for this service (fallback) */
  standardPorts?: number[];
  
  /** NSE script patterns that indicate this service */
  nseScriptMatchers?: {
    scriptName: string;
    outputPattern?: string;
  }[];
}

// ============================================
// SERVICE CONFIGURATION
// ============================================

/**
 * CVE reference for a technique
 */
export interface CVEReference {
  cveId: string;
  cvss?: number;
  description?: string;
  exploitAvailable?: boolean;
  referenceUrl?: string;
}

/**
 * NSE script configuration
 */
export interface NSEScript {
  /** Script name (e.g., "smb-enum-shares") */
  name: string;
  /** Arguments for the script */
  args?: Record<string, string>;
  /** Description of what this script does */
  description: string;
  /** Is this script safe? */
  safe?: boolean;
  /** Estimated time to run */
  estimatedTime?: string;
}

/**
 * Attack technique
 */
export interface Technique {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** MITRE ATT&CK technique ID */
  mitreId?: string;
  /** Detailed description */
  description: string;
  /** Commands to execute (tool-agnostic) */
  commands?: {
    tool: string;
    command: string;
    description?: string;
  }[];
  /** Related CVEs */
  cves?: CVEReference[];
  /** Required NSE scripts */
  nseScripts?: NSEScript[];
  /** Tools needed */
  requiredTools?: string[];
  /** Difficulty level */
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  /** Prerequisites */
  prerequisites?: string[];
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Trigger condition for activating a technique
 */
export interface TriggerCondition {
  /** Condition type */
  type: 'port' | 'service' | 'version' | 'banner' | 'cve' | 'nse_output' | 'os' | 'hostname' | 'custom';
  /** Condition operator */
  operator: 'equals' | 'contains' | 'regex' | 'exists' | 'greater_than' | 'less_than' | 'in_list';
  /** Value to compare against */
  value: string | number | string[] | number[];
  /** Optional: specific field to check */
  field?: string;
}

/**
 * UI configuration for technique display
 */
export interface UIConfig {
  /** Icon name (Lucide icons) */
  icon?: string;
  /** Color theme */
  color?: string;
  /** Priority in UI (higher = shown first) */
  displayPriority?: number;
  /** Custom component name for specialized rendering */
  customComponent?: string;
  /** Collapsible sections */
  sections?: {
    id: string;
    title: string;
    defaultExpanded?: boolean;
  }[];
}

/**
 * Complete service configuration
 * ONE SERVICE = ONE CONFIG FILE
 */
export interface ServiceConfig {
  // ===== META =====
  /** Unique service identifier (kebab-case) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Detailed description */
  description: string;
  /** Category ID this service belongs to */
  categoryId: string;
  /** Version of this config */
  version?: string;
  /** Author of this config */
  author?: string;
  /** Last updated */
  updatedAt?: string;
  /** Tags for search/filtering */
  tags?: string[];

  // ===== MATCHING (CRITICAL FOR CTF) =====
  /** Multi-level matching rules */
  matchers: ServiceMatchers;
  
  /** Minimum confidence threshold to match this service */
  confidenceThreshold?: number;

  // ===== TECHNIQUES =====
  /** Attack techniques for this service */
  techniques: Technique[];
  
  /** Default techniques to run */
  defaultTechniques?: string[];

  // ===== TRIGGERS =====
  /** Conditions that activate specific techniques */
  triggers?: {
    techniqueId: string;
    conditions: TriggerCondition[];
  }[];

  // ===== UI CONFIGURATION =====
  ui?: UIConfig;

  // ===== REFERENCES =====
  /** External documentation links */
  references?: {
    title: string;
    url: string;
  }[];
  
  /** Notes for manual analysis */
  notes?: string;
}

// ============================================
// CATEGORY CONFIGURATION
// ============================================

export interface ServiceCategory {
  /** Unique category identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description */
  description: string;
  /** Icon name */
  icon?: string;
  /** Color theme */
  color?: string;
  /** Sort order */
  order?: number;
}

// ============================================
// MATCHING RESULT
// ============================================

/**
 * Result from the matching engine
 */
export interface MatchResult {
  /** Matched service config */
  config: ServiceConfig;
  /** Confidence score 0-100 */
  confidence: number;
  /** Which matcher type triggered the match */
  matchedBy: MatcherRule['type'];
  /** The pattern that matched */
  matchedPattern: string;
  /** Raw data that was matched */
  matchedData: string;
}

/**
 * Unknown service data (for "Other" category)
 */
export interface UnknownService {
  /** Port number */
  port: number;
  /** Protocol */
  protocol: string;
  /** Service name from Nmap (if any) */
  serviceName?: string;
  /** Product from Nmap */
  product?: string;
  /** Version from Nmap */
  version?: string;
  /** Raw banner */
  banner?: string;
  /** NSE script outputs */
  nseScripts?: {
    name: string;
    output: string;
  }[];
  /** Host where found */
  hostIp: string;
  /** Timestamp */
  discoveredAt: Date;
  /** Any partial matches found */
  partialMatches?: {
    configId: string;
    confidence: number;
  }[];
}

// ============================================
// STATE STORAGE (IndexedDB)
// ============================================

/**
 * Stored scan result for offline analysis
 */
export interface StoredScan {
  id: string;
  name: string;
  rawOutput: string;
  parseFormat: 'xml' | 'gnmap' | 'json';
  parsedData: unknown;
  analyzedAt: Date;
  matchedServices: MatchResult[];
  unknownServices: UnknownService[];
}

/**
 * User notes for a service/host
 */
export interface UserNote {
  id: string;
  hostIp?: string;
  port?: number;
  serviceId?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}
