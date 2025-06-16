import React from 'react';
import { Settings, Eye, EyeOff, RotateCcw, Database, Search } from 'lucide-react';
import { VisualizationConfig } from '../types/hierarchy';

interface Props {
  config: VisualizationConfig;
  onConfigChange: (config: VisualizationConfig) => void;
  onDataReset: () => void;
  onLoadLargeDataset: () => void;
  nodeCount: number;
}

export default function ControlPanel({ 
  config, 
  onConfigChange, 
  onDataReset, 
  onLoadLargeDataset,
  nodeCount 
}: Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const updateConfig = (updates: Partial<VisualizationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="text-blue-600" size={20} />
          <h3 className="text-lg font-semibold text-gray-900">Control Panel</h3>
          <span className="text-sm text-gray-500">({nodeCount} nodes)</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-gray-500 hover:text-gray-700 transition-colors text-sm font-medium"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {isExpanded && (
        <div className="space-y-4 pt-4 border-t border-gray-200">
          {/* Display Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Display Settings</h4>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Show Values</span>
              <button
                onClick={() => updateConfig({ showValues: !config.showValues })}
                className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                  config.showValues 
                    ? 'bg-green-100 text-green-800 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                }`}
              >
                {config.showValues ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="text-sm">{config.showValues ? 'On' : 'Off'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Font Size</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateConfig({ fontSize: Math.max(8, config.fontSize - 1) })}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
                >
                  -
                </button>
                <span className="text-sm text-gray-900 w-8 text-center">{config.fontSize}</span>
                <button
                  onClick={() => updateConfig({ fontSize: Math.min(20, config.fontSize + 1) })}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
                >
                  +
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Node Size</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateConfig({ 
                    nodeWidth: Math.max(80, config.nodeWidth - 10),
                    nodeHeight: Math.max(40, config.nodeHeight - 5)
                  })}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
                >
                  -
                </button>
                <span className="text-sm text-gray-900 w-16 text-center">
                  {config.nodeWidth}×{config.nodeHeight}
                </span>
                <button
                  onClick={() => updateConfig({ 
                    nodeWidth: Math.min(200, config.nodeWidth + 10),
                    nodeHeight: Math.min(100, config.nodeHeight + 5)
                  })}
                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Data Actions */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Data Actions</h4>
            
            <div className="flex space-x-2">
              <button
                onClick={onDataReset}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                <RotateCcw size={16} />
                <span>Reset Data</span>
              </button>
              
              <button
                onClick={onLoadLargeDataset}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                <Database size={16} />
                <span>Load Large Dataset</span>
              </button>
            </div>
          </div>

          {/* Color Scheme */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Color Scheme</h4>
            <div className="flex space-x-2">
              {(['default', 'dark', 'colorful'] as const).map((scheme) => (
                <button
                  key={scheme}
                  onClick={() => updateConfig({ colorScheme: scheme })}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    config.colorScheme === scheme
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {scheme.charAt(0).toUpperCase() + scheme.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}