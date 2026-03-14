/**
 * JSON Schema Definitions for ServiceConfig
 * Used by react-jsonschema-form for auto-generating forms
 */

import type { ServiceConfig, Technique, ServiceMatchers, TriggerCondition, UIConfig } from '../../configs/types';

// ============================================
// MAIN SERVICE CONFIG SCHEMA
// ============================================

export const serviceConfigSchema = {
  type: 'object',
  required: ['id', 'name', 'description', 'categoryId', 'matchers', 'techniques'],
  properties: {
    // Meta
    id: {
      type: 'string',
      title: 'ID',
      description: 'Unique identifier (kebab-case)',
      pattern: '^[a-z0-9-]+$',
    },
    name: {
      type: 'string',
      title: 'Name',
      description: 'Human-readable service name',
    },
    description: {
      type: 'string',
      title: 'Description',
      description: 'Detailed description of the service',
    },
    categoryId: {
      type: 'string',
      title: 'Category',
      description: 'Service category',
      enum: ['remote-access', 'database', 'web', 'mail', 'directory', 'other'],
      enumNames: ['Remote Access', 'Database', 'Web Services', 'Mail Services', 'Directory Services', 'Other'],
    },
    version: {
      type: 'string',
      title: 'Config Version',
      default: '1.0.0',
    },
    author: {
      type: 'string',
      title: 'Author',
    },
    tags: {
      type: 'array',
      title: 'Tags',
      items: {
        type: 'string',
      },
    },

    // Matchers
    matchers: matchersSchema,
    confidenceThreshold: {
      type: 'integer',
      title: 'Confidence Threshold',
      description: 'Minimum confidence (0-100) to match this service',
      minimum: 0,
      maximum: 100,
      default: 30,
    },

    // Techniques
    techniques: techniquesSchema,
    defaultTechniques: {
      type: 'array',
      title: 'Default Techniques',
      description: 'IDs of techniques to run by default',
      items: {
        type: 'string',
      },
    },

    // Triggers
    triggers: triggersSchema,

    // UI
    ui: uiConfigSchema,

    // References
    references: referencesSchema,
    notes: {
      type: 'string',
      title: 'Notes',
      description: 'Manual analysis notes',
    },
  },
};

// ============================================
// MATCHERS SCHEMA
// ============================================

export const matchersSchema = {
  type: 'object',
  title: 'Matchers',
  description: 'Multi-level matching rules for service detection',
  properties: {
    serviceNames: {
      type: 'array',
      title: 'Service Names',
      description: 'Nmap service names to match (highest priority)',
      items: {
        type: 'string',
      },
    },
    cpePatterns: {
      type: 'array',
      title: 'CPE Patterns',
      description: 'CPE identifier patterns to match',
      items: {
        type: 'string',
      },
    },
    bannerRegex: {
      type: 'array',
      title: 'Banner Regex Patterns',
      description: 'Regex patterns to match against service banners',
      items: {
        type: 'string',
      },
    },
    productPatterns: {
      type: 'array',
      title: 'Product Patterns',
      description: 'Product name patterns to match',
      items: {
        type: 'string',
      },
    },
    versionPatterns: {
      type: 'array',
      title: 'Version Patterns',
      description: 'Version string patterns to match',
      items: {
        type: 'string',
      },
    },
    standardPorts: {
      type: 'array',
      title: 'Standard Ports',
      description: 'Standard port numbers (fallback matching)',
      items: {
        type: 'integer',
        minimum: 1,
        maximum: 65535,
      },
    },
    nseScriptMatchers: {
      type: 'array',
      title: 'NSE Script Matchers',
      description: 'NSE scripts that indicate this service',
      items: {
        type: 'object',
        required: ['scriptName'],
        properties: {
          scriptName: {
            type: 'string',
            title: 'Script Name',
          },
          outputPattern: {
            type: 'string',
            title: 'Output Pattern',
            description: 'Regex pattern to match in script output',
          },
        },
      },
    },
  },
};

// ============================================
// TECHNIQUES SCHEMA
// ============================================

export const techniquesSchema = {
  type: 'array',
  title: 'Attack Techniques',
  items: {
    type: 'object',
    required: ['id', 'name', 'description'],
    properties: {
      id: {
        type: 'string',
        title: 'Technique ID',
      },
      name: {
        type: 'string',
        title: 'Name',
      },
      mitreId: {
        type: 'string',
        title: 'MITRE ATT&CK ID',
      },
      description: {
        type: 'string',
        title: 'Description',
      },
      commands: {
        type: 'array',
        title: 'Commands',
        items: {
          type: 'object',
          required: ['tool', 'command'],
          properties: {
            tool: {
              type: 'string',
              title: 'Tool',
            },
            command: {
              type: 'string',
              title: 'Command',
            },
            description: {
              type: 'string',
              title: 'Description',
            },
          },
        },
      },
      cves: {
        type: 'array',
        title: 'CVE References',
        items: {
          type: 'object',
          required: ['cveId'],
          properties: {
            cveId: {
              type: 'string',
              title: 'CVE ID',
              pattern: '^CVE-\\d{4}-\\d+$',
            },
            cvss: {
              type: 'number',
              title: 'CVSS Score',
              minimum: 0,
              maximum: 10,
            },
            description: {
              type: 'string',
              title: 'Description',
            },
            exploitAvailable: {
              type: 'boolean',
              title: 'Exploit Available',
            },
            referenceUrl: {
              type: 'string',
              title: 'Reference URL',
              format: 'uri',
            },
          },
        },
      },
      nseScripts: {
        type: 'array',
        title: 'NSE Scripts',
        items: {
          type: 'object',
          required: ['name', 'description'],
          properties: {
            name: {
              type: 'string',
              title: 'Script Name',
            },
            args: {
              type: 'object',
              title: 'Arguments',
              additionalProperties: {
                type: 'string',
              },
            },
            description: {
              type: 'string',
              title: 'Description',
            },
            safe: {
              type: 'boolean',
              title: 'Safe',
              default: true,
            },
            estimatedTime: {
              type: 'string',
              title: 'Estimated Time',
            },
          },
        },
      },
      requiredTools: {
        type: 'array',
        title: 'Required Tools',
        items: {
          type: 'string',
        },
      },
      difficulty: {
        type: 'string',
        title: 'Difficulty',
        enum: ['easy', 'medium', 'hard', 'expert'],
        enumNames: ['Easy', 'Medium', 'Hard', 'Expert'],
      },
      prerequisites: {
        type: 'array',
        title: 'Prerequisites',
        items: {
          type: 'string',
        },
      },
      tags: {
        type: 'array',
        title: 'Tags',
        items: {
          type: 'string',
        },
      },
    },
  },
};

// ============================================
// TRIGGERS SCHEMA
// ============================================

export const triggersSchema = {
  type: 'array',
  title: 'Triggers',
  description: 'Conditions that activate specific techniques',
  items: {
    type: 'object',
    required: ['techniqueId', 'conditions'],
    properties: {
      techniqueId: {
        type: 'string',
        title: 'Technique ID',
      },
      conditions: {
        type: 'array',
        title: 'Conditions',
        items: {
          type: 'object',
          required: ['type', 'operator', 'value'],
          properties: {
            type: {
              type: 'string',
              title: 'Type',
              enum: ['port', 'service', 'version', 'banner', 'cve', 'nse_output', 'os', 'hostname', 'custom'],
            },
            operator: {
              type: 'string',
              title: 'Operator',
              enum: ['equals', 'contains', 'regex', 'exists', 'greater_than', 'less_than', 'in_list'],
            },
            value: {
              type: 'string',
              title: 'Value',
            },
            field: {
              type: 'string',
              title: 'Field',
              description: 'Specific field to check (optional)',
            },
          },
        },
      },
    },
  },
};

// ============================================
// UI CONFIG SCHEMA
// ============================================

export const uiConfigSchema = {
  type: 'object',
  title: 'UI Configuration',
  properties: {
    icon: {
      type: 'string',
      title: 'Icon Name',
      description: 'Lucide icon name',
    },
    color: {
      type: 'string',
      title: 'Color',
      description: 'Color theme (hex or CSS color)',
    },
    displayPriority: {
      type: 'integer',
      title: 'Display Priority',
      description: 'Higher = shown first',
      default: 50,
    },
    customComponent: {
      type: 'string',
      title: 'Custom Component',
      description: 'Custom React component name for specialized rendering',
    },
    sections: {
      type: 'array',
      title: 'Collapsible Sections',
      items: {
        type: 'object',
        required: ['id', 'title'],
        properties: {
          id: {
            type: 'string',
            title: 'Section ID',
          },
          title: {
            type: 'string',
            title: 'Section Title',
          },
          defaultExpanded: {
            type: 'boolean',
            title: 'Default Expanded',
            default: false,
          },
        },
      },
    },
  },
};

// ============================================
// REFERENCES SCHEMA
// ============================================

export const referencesSchema = {
  type: 'array',
  title: 'External References',
  items: {
    type: 'object',
    required: ['title', 'url'],
    properties: {
      title: {
        type: 'string',
        title: 'Title',
      },
      url: {
        type: 'string',
        title: 'URL',
        format: 'uri',
      },
    },
  },
};

// ============================================
// UI SCHEMA (for react-jsonschema-form layout)
// ============================================

export const serviceConfigUISchema = {
  'ui:order': [
    'id',
    'name',
    'description',
    'categoryId',
    'version',
    'author',
    'tags',
    'matchers',
    'confidenceThreshold',
    'techniques',
    'defaultTechniques',
    'triggers',
    'ui',
    'references',
    'notes',
  ],
  id: {
    'ui:help': 'Unique identifier in kebab-case (e.g., "my-custom-service")',
  },
  description: {
    'ui:widget': 'textarea',
    'ui:options': {
      rows: 3,
    },
  },
  tags: {
    'ui:options': {
      orderable: false,
    },
  },
  matchers: {
    'ui:options': {
      collapsible: true,
      collapsed: false,
    },
    serviceNames: {
      'ui:help': 'Nmap service names (from -sV scan)',
    },
    bannerRegex: {
      'ui:help': 'Regular expressions to match service banners',
    },
    standardPorts: {
      'ui:help': 'Port numbers for fallback matching',
    },
  },
  techniques: {
    'ui:options': {
      orderable: true,
      collapsible: true,
      collapsed: false,
    },
  },
  triggers: {
    'ui:options': {
      orderable: false,
    },
  },
  ui: {
    'ui:options': {
      collapsible: true,
      collapsed: true,
    },
  },
  references: {
    'ui:options': {
      orderable: false,
    },
  },
  notes: {
    'ui:widget': 'textarea',
    'ui:options': {
      rows: 4,
    },
  },
};

// ============================================
// VALIDATOR
// ============================================

/**
 * Validate a ServiceConfig object
 * Returns array of error messages
 */
export function validateServiceConfig(config: unknown): string[] {
  const errors: string[] = [];
  
  if (!config || typeof config !== 'object') {
    errors.push('Config must be an object');
    return errors;
  }

  const c = config as Partial<ServiceConfig>;

  // Required fields
  if (!c.id || typeof c.id !== 'string') {
    errors.push('ID is required and must be a string');
  } else if (!/^[a-z0-9-]+$/.test(c.id)) {
    errors.push('ID must be lowercase kebab-case (letters, numbers, hyphens only)');
  }

  if (!c.name || typeof c.name !== 'string') {
    errors.push('Name is required');
  }

  if (!c.description || typeof c.description !== 'string') {
    errors.push('Description is required');
  }

  if (!c.categoryId || typeof c.categoryId !== 'string') {
    errors.push('Category is required');
  }

  if (!c.matchers || typeof c.matchers !== 'object') {
    errors.push('Matchers configuration is required');
  }

  if (!Array.isArray(c.techniques)) {
    errors.push('Techniques must be an array');
  }

  // Confidence threshold
  if (c.confidenceThreshold !== undefined) {
    if (typeof c.confidenceThreshold !== 'number' || c.confidenceThreshold < 0 || c.confidenceThreshold > 100) {
      errors.push('Confidence threshold must be between 0 and 100');
    }
  }

  return errors;
}
