/**
 * Config Editor Component
 * Visual form editor using react-jsonschema-form
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { useMemo } from 'react';
import Form, { IChangeEvent, ISubmitEvent, FormProps, WidgetProps } from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { ServiceConfig } from '../../configs/types';
import { serviceConfigSchema, serviceConfigUISchema } from '../../lib/storage/jsonSchema';
import { Loader2, Save, RotateCcw, AlertCircle, Plus, Trash2 } from 'lucide-react';

// ============================================
// CUSTOM WIDGETS
// ============================================

/**
 * Custom textarea widget with dark theme
 */
function DarkTextareaWidget(props: WidgetProps) {
  const { id, value, onChange, placeholder, readonly, disabled, required } = props;
  
  return (
    <textarea
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readonly}
      disabled={disabled}
      required={required}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 resize-y min-h-[80px]"
      rows={3}
    />
  );
}

/**
 * Custom text widget with dark theme
 */
function DarkTextWidget(props: WidgetProps) {
  const { id, value, onChange, placeholder, readonly, disabled, required, type } = props;
  
  return (
    <input
      id={id}
      type={type || 'text'}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={readonly}
      disabled={disabled}
      required={required}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
    />
  );
}

/**
 * Custom select widget with dark theme
 */
function DarkSelectWidget(props: WidgetProps) {
  const { id, value, onChange, options, readonly, disabled, required } = props;
  const { enumOptions = [] } = options as { enumOptions: { value: string; label: string }[] };
  
  return (
    <select
      id={id}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      readOnly={readonly}
      disabled={disabled}
      required={required}
      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
    >
      {enumOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Custom checkbox widget with dark theme
 */
function DarkCheckboxWidget(props: WidgetProps) {
  const { id, value, onChange, label, readonly, disabled } = props;
  
  return (
    <label htmlFor={id} className="flex items-center gap-2 cursor-pointer">
      <input
        id={id}
        type="checkbox"
        checked={value || false}
        onChange={(e) => onChange(e.target.checked)}
        readOnly={readonly}
        disabled={disabled}
        className="w-4 h-4 bg-gray-800 border border-gray-700 rounded text-green-500 focus:ring-1 focus:ring-green-500 focus:ring-offset-0"
      />
      <span className="text-sm text-gray-300">{label}</span>
    </label>
  );
}

/**
 * Color input widget
 */
function ColorWidget(props: WidgetProps) {
  const { id, value, onChange } = props;
  
  return (
    <div className="flex items-center gap-2">
      <input
        id={id}
        type="color"
        value={value || '#6b7280'}
        onChange={(e) => onChange(e.target.value)}
        className="w-8 h-8 bg-transparent border-0 cursor-pointer"
      />
      <input
        type="text"
        value={value || '#6b7280'}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-gray-100 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
        placeholder="#6b7280"
      />
    </div>
  );
}

// ============================================
// CUSTOM FIELDS
// ============================================

/**
 * Custom array field for better UX
 */
function DarkArrayFieldTemplate(props: any) {
  const { items, onAddClick, title, required } = props;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400 uppercase tracking-wide">
          {title}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
        <button
          type="button"
          onClick={onAddClick}
          className="flex items-center gap-1 px-2 py-1 text-xs text-green-400 hover:text-green-300 hover:bg-gray-800 rounded transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>
      <div className="space-y-2">
        {items.map((item: any, index: number) => (
          <div key={item.key} className="flex items-start gap-2">
            <div className="flex-1">{item.children}</div>
            {item.hasRemove && (
              <button
                type="button"
                onClick={item.onDropIndexClick(index)}
                className="mt-2 p-1 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-xs text-gray-500 italic py-2">No items added</div>
      )}
    </div>
  );
}

/**
 * Custom object field template
 */
function DarkObjectFieldTemplate(props: any) {
  const { properties, title, description } = props;
  
  return (
    <div className="space-y-4">
      {title && (
        <div className="text-sm font-medium text-gray-300">{title}</div>
      )}
      {description && (
        <div className="text-xs text-gray-500">{description}</div>
      )}
      <div className="grid gap-4">
        {properties.map((prop: any) => (
          <div key={prop.key} className="space-y-1">
            {prop.content}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Custom field template
 */
function DarkFieldTemplate(props: any) {
  const { id, label, children, errors, help, hidden, required, displayLabel } = props;
  
  if (hidden) return children;
  
  return (
    <div className="space-y-1">
      {displayLabel && label && (
        <label htmlFor={id} className="block text-xs text-gray-400 uppercase tracking-wide">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      {children}
      {errors && <div className="text-xs text-red-400">{errors}</div>}
      {help && <div className="text-xs text-gray-500">{help}</div>}
    </div>
  );
}

// ============================================
// WIDGET REGISTRY
// ============================================

const widgets = {
  TextWidget: DarkTextWidget,
  TextareaWidget: DarkTextareaWidget,
  SelectWidget: DarkSelectWidget,
  CheckboxWidget: DarkCheckboxWidget,
  ColorWidget: ColorWidget,
};

const templates = {
  ArrayFieldTemplate: DarkArrayFieldTemplate,
  ObjectFieldTemplate: DarkObjectFieldTemplate,
  FieldTemplate: DarkFieldTemplate,
};

// ============================================
// CONFIG EDITOR COMPONENT
// ============================================

interface ConfigEditorProps {
  config: ServiceConfig | null;
  onSave: (config: ServiceConfig) => Promise<void>;
  onCancel: () => void;
  isCreating?: boolean;
  isLoading?: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}

export default function ConfigEditor({
  config,
  onSave,
  onCancel,
  isCreating = false,
  isLoading = false,
  onDirtyChange,
}: ConfigEditorProps) {
  const [formData, setFormData] = React.useState<Partial<ServiceConfig> | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [localErrors, setLocalErrors] = React.useState<string[]>([]);
  const originalDataRef = useRef<string>('');

  // Initialize form data
  useEffect(() => {
    if (config) {
      setFormData(config);
      originalDataRef.current = JSON.stringify(config);
    } else {
      setFormData(null);
      originalDataRef.current = '';
    }
    setLocalErrors([]);
  }, [config]);

  // Track dirty state
  useEffect(() => {
    if (formData && onDirtyChange) {
      const isDirty = JSON.stringify(formData) !== originalDataRef.current;
      onDirtyChange(isDirty);
    }
  }, [formData, onDirtyChange]);

  // Handle form change
  const handleChange = useCallback((e: IChangeEvent) => {
    setFormData(e.formData as Partial<ServiceConfig>);
    setLocalErrors([]);
  }, []);

  // Handle form submit
  const handleSubmit = useCallback(async (e: ISubmitEvent<ServiceConfig>) => {
    if (!e.formData) return;
    
    setIsSaving(true);
    setLocalErrors([]);
    
    try {
      await onSave(e.formData);
      originalDataRef.current = JSON.stringify(e.formData);
    } catch (error) {
      setLocalErrors([(error as Error).message]);
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  // Handle reset
  const handleReset = useCallback(() => {
    if (config) {
      setFormData(config);
      setLocalErrors([]);
    }
  }, [config]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (formData && JSON.stringify(formData) !== originalDataRef.current) {
      if (!confirm('Discard unsaved changes?')) return;
    }
    onCancel();
  }, [formData, onCancel]);

  // Custom error transformer for better messages
  const transformErrors = (errors: any[]) => {
    return errors.map((error) => {
      if (error.name === 'required') {
        return {
          ...error,
          message: `${error.property} is required`,
        };
      }
      if (error.name === 'pattern') {
        return {
          ...error,
          message: 'Invalid format',
        };
      }
      return error;
    });
  };

  // Live validation toggle
  const liveValidate = false; // Disable live validation to avoid spam

  if (!config || !formData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <p>Select a configuration to edit</p>
          <p className="text-sm mt-2">or create a new one</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-100">
            {isCreating ? 'Create New Service' : 'Edit Service'}
          </h2>
          <span className="text-xs text-gray-500 font-mono">({config.id})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading || isSaving}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            form="config-form"
            type="submit"
            disabled={isLoading || isSaving}
            className="flex items-center gap-1 px-4 py-1.5 text-xs text-gray-950 bg-green-500 hover:bg-green-400 rounded font-medium transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                Save
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error display */}
      {localErrors.length > 0 && (
        <div className="px-4 py-2 bg-red-900/20 border-b border-red-900">
          {localErrors.map((error, i) => (
            <div key={i} className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ))}
        </div>
      )}

      {/* Form container */}
      <div className="flex-1 overflow-auto p-4">
        <Form
          id="config-form"
          schema={serviceConfigSchema as any}
          uiSchema={serviceConfigUISchema as any}
          formData={formData}
          onChange={handleChange}
          onSubmit={handleSubmit}
          validator={validator}
          widgets={widgets}
          templates={templates}
          liveValidate={liveValidate}
          transformErrors={transformErrors}
          showErrorList="bottom"
          noHtml5Validate
          className="space-y-6"
        >
          {/* Hide default submit button */}
          <div className="hidden">
            <button type="submit">Submit</button>
          </div>
        </Form>
      </div>
    </div>
  );
}
