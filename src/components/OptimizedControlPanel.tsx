import React, { memo, useCallback, useState } from 'react';
import {
  Settings,
  Database,
  Expand,
  Minimize2,
  Layers,
  Zap,
  BarChart3,
  Type,
  Palette,
  Filter,
  Eye,
  EyeOff,
  Search
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useHierarchyStore } from '../store/hierarchyStore';
import { sampleHierarchy, largeSampleHierarchy, createMassiveDataset } from '../utils/sampleData';
import PerformanceMonitor from './PerformanceMonitor';

interface Props {
  nodeCount: number;
}

const OptimizedControlPanel = memo(({ nodeCount }: Props) => {
  const { 
    setHierarchyData, 
    expandToDepth, 
    collapseAll, 
    expandedNodes,
    isCalculating,
    calculationProgress,
    uiSettings,
    updateUiSettings,
  } = useHierarchyStore();
  
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['datasets', 'tree-controls'])
  );
  
  const handleLoadSmallDataset = useCallback(() => {
    setHierarchyData(sampleHierarchy);
  }, [setHierarchyData]);
  
  const handleLoadLargeDataset = useCallback(() => {
    setHierarchyData(largeSampleHierarchy);
  }, [setHierarchyData]);
  
  const handleLoadMassiveDataset = useCallback(() => {
    const massiveData = createMassiveDataset();
    setHierarchyData(massiveData);
  }, [setHierarchyData]);
  
  const handleExpandToDepth = useCallback((depth: number) => {
    expandToDepth(depth);
  }, [expandToDepth]);
  
  const toggleSection = useCallback((section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  }, []);
  
  const updateSetting = useCallback((key: string, value: any) => {
    updateUiSettings({ [key]: value });
  }, [updateUiSettings]);
  
  const ControlSection = ({ 
    id, 
    title, 
    icon: Icon, 
    children
  }: {
    id: string;
    title: string;
    icon: LucideIcon;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }) => {
    const isExpanded = expandedSections.has(id);
    
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <Icon className="text-blue-600" size={20} />
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded ? (
              <Minimize2 size={16} className="text-gray-500" />
            ) : (
              <Expand size={16} className="text-gray-500" />
            )}
          </div>
        </button>
        
        {isExpanded && (
          <div className="p-4 border-t border-gray-200">
            {children}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="space-y-4">
      {/* Performance Monitor */}
      <PerformanceMonitor />
      
      {/* Dataset Controls */}
      <ControlSection id="datasets" title="Dataset Controls" icon={Database}>
        <div className="space-y-3">
          <button
            onClick={handleLoadSmallDataset}
            className="w-full flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <BarChart3 size={16} />
            <span>Small Dataset (6 nodes)</span>
          </button>
          
          <button
            onClick={handleLoadLargeDataset}
            className="w-full flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Database size={16} />
            <span>Large Dataset (1,800 nodes)</span>
          </button>
          
          <button
            onClick={handleLoadMassiveDataset}
            className="w-full flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Zap size={16} />
            <span>Massive Dataset (10,000+ nodes)</span>
          </button>
        </div>
      </ControlSection>
      
      {/* Tree Controls */}
      <ControlSection id="tree-controls" title="Tree Controls" icon={Layers}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExpandToDepth(1)}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
            >
              <Expand size={14} />
              <span>Level 1</span>
            </button>
            
            <button
              onClick={() => handleExpandToDepth(2)}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
            >
              <Expand size={14} />
              <span>Level 2</span>
            </button>
            
            <button
              onClick={() => handleExpandToDepth(3)}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
            >
              <Expand size={14} />
              <span>Level 3</span>
            </button>
            
            <button
              onClick={collapseAll}
              className="flex items-center justify-center space-x-1 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm transition-colors"
            >
              <Minimize2 size={14} />
              <span>Collapse</span>
            </button>
          </div>
        </div>
      </ControlSection>
      
      {/* Display Settings */}
      <ControlSection id="display" title="Display Settings" icon={Type}>
        <div className="space-y-4">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Font Size</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateSetting('fontSize', Math.max(10, uiSettings.fontSize - 1))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
              >
                -
              </button>
              <span className="text-sm text-gray-900 w-8 text-center font-mono">
                {uiSettings.fontSize}
              </span>
              <button
                onClick={() => updateSetting('fontSize', Math.min(24, uiSettings.fontSize + 1))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Node Height */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Node Height</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateSetting('nodeHeight', Math.max(32, uiSettings.nodeHeight - 4))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
              >
                -
              </button>
              <span className="text-sm text-gray-900 w-12 text-center font-mono">
                {uiSettings.nodeHeight}px
              </span>
              <button
                onClick={() => updateSetting('nodeHeight', Math.min(80, uiSettings.nodeHeight + 4))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Indentation */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Indentation</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => updateSetting('indentSize', Math.max(12, uiSettings.indentSize - 4))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
              >
                -
              </button>
              <span className="text-sm text-gray-900 w-12 text-center font-mono">
                {uiSettings.indentSize}px
              </span>
              <button
                onClick={() => updateSetting('indentSize', Math.min(48, uiSettings.indentSize + 4))}
                className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 border border-gray-200"
              >
                +
              </button>
            </div>
          </div>
          
          {/* Show Values Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Values</span>
            <button
              onClick={() => updateSetting('showValues', !uiSettings.showValues)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                uiSettings.showValues 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {uiSettings.showValues ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="text-sm">{uiSettings.showValues ? 'On' : 'Off'}</span>
            </button>
          </div>
          
          {/* Show Node Count */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Show Child Count</span>
            <button
              onClick={() => updateSetting('showChildCount', !uiSettings.showChildCount)}
              className={`flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors ${
                uiSettings.showChildCount 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {uiSettings.showChildCount ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="text-sm">{uiSettings.showChildCount ? 'On' : 'Off'}</span>
            </button>
          </div>
        </div>
      </ControlSection>
      
      {/* Color Scheme */}
      <ControlSection id="colors" title="Color Scheme" icon={Palette}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {(['default', 'dark', 'colorful', 'minimal'] as const).map((scheme) => (
              <button
                key={scheme}
                onClick={() => updateSetting('colorScheme', scheme)}
                className={`px-3 py-2 rounded-lg text-sm transition-colors text-left ${
                  uiSettings.colorScheme === scheme
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
              >
                {scheme.charAt(0).toUpperCase() + scheme.slice(1)} Theme
              </button>
            ))}
          </div>
        </div>
      </ControlSection>
      
      {/* Search & Filter */}
      <ControlSection id="search" title="Search & Filter" icon={Filter}>
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search nodes..."
              value={uiSettings.searchTerm}
              onChange={(e) => updateSetting('searchTerm', e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'normal', 'skip', 'invert'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => updateSetting('statusFilter', status)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    uiSettings.statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </ControlSection>
      
      {/* Statistics */}
      <ControlSection id="stats" title="Statistics" icon={Settings}>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Nodes:</span>
            <span className="text-gray-900 font-medium">{nodeCount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Expanded Nodes:</span>
            <span className="text-gray-900 font-medium">{expandedNodes.size.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Visible Nodes:</span>
            <span className="text-gray-900 font-medium">{expandedNodes.size.toLocaleString()}</span>
          </div>
        </div>
        
        {isCalculating && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">Calculating...</span>
              <span className="text-gray-900">{calculationProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculationProgress}%` }}
              />
            </div>
          </div>
        )}
      </ControlSection>
      
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-lg font-semibold text-blue-900 mb-3">Performance Features</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• <strong>Virtual Rendering:</strong> Only visible nodes are in DOM</p>
          <p>• <strong>Lazy Expansion:</strong> Children load on demand</p>
          <p>• <strong>Optimized Calculations:</strong> Batched and cached</p>
          <p>• <strong>Memory Efficient:</strong> Minimal re-renders</p>
          <p>• <strong>Smooth Scrolling:</strong> 60fps with large datasets</p>
          <p>• <strong>Right-click:</strong> Context menu for bulk operations</p>
        </div>
      </div>
    </div>
  );
});

OptimizedControlPanel.displayName = 'OptimizedControlPanel';

export default OptimizedControlPanel;