/**
 * Rule Builder Page
 * Full page wrapper for the Rule Builder
 */

import React from 'react';
import RuleBuilder from '../components/RuleBuilder/RuleBuilder';

export default function RuleBuilderPage() {
  return (
    <div className="h-full flex flex-col">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-gray-800 bg-gray-900/50">
        <h1 className="text-xl font-semibold text-gray-100">Rule Builder</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create and manage service configurations for detection and attack techniques
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden">
        <RuleBuilder />
      </div>
    </div>
  );
}
