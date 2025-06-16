import  { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { HierarchyNode } from '../types/hierarchy';
import { useHierarchyStore } from '../store/hierarchyStore';

interface Props {
  data: HierarchyNode;
  onNodeStatusChange: (nodeId: string, status: 'normal' | 'skip' | 'invert') => void;
  showWaterfall: boolean;
}

export default function QuarterlyView({ data, onNodeStatusChange, showWaterfall }: Props) {
  const { uiSettings } = useHierarchyStore();
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(new Set(['q3', 'q4']));

  const toggleQuarter = (quarterId: string) => {
    const newExpanded = new Set(expandedQuarters);
    if (newExpanded.has(quarterId)) {
      newExpanded.delete(quarterId);
    } else {
      newExpanded.add(quarterId);
    }
    setExpandedQuarters(newExpanded);
  };

  const getStatusDisplay = (node: HierarchyNode) => {
    if (node.status === 'skip') return { text: 'skipped', style: 'line-through text-red-500' };
    if (node.status === 'invert') return { text: 'inverted', style: 'text-yellow-600' };
    return { text: '', style: '' };
  };

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(1);
  };

  // Component for individual horizontal bar with improved spacing
  const HorizontalBar = ({ value, maxValue }: { value: number; maxValue: number }) => {
    const barWidth = Math.min(Math.abs(value) / maxValue * 80, 80); // Max 80px width
    const isNegative = value < 0;
    
    return (
      <div className="flex items-center justify-center w-40 h-8 relative bg-gray-50 rounded border">
        {/* Center line */}
        <div className="absolute w-px h-6 bg-gray-400 left-1/2 transform -translate-x-1/2"></div>
        
        {/* Bar */}
        <div
          className={`absolute h-5 rounded ${
            isNegative 
              ? 'bg-red-500 right-1/2' 
              : 'bg-green-500 left-1/2'
          }`}
          style={{
            width: `${barWidth}px`,
          }}
        ></div>
        
        {/* Value label with proper spacing */}
        <div
          className={`absolute text-xs font-bold z-10 px-1 py-0.5 rounded ${
            isNegative 
              ? 'right-1/2 mr-1 text-red-800 bg-red-100' 
              : 'left-1/2 ml-1 text-green-800 bg-green-100'
          }`}
          style={{
            transform: isNegative ? 'translateX(100%)' : 'translateX(-100%)',
            minWidth: '40px',
            textAlign: 'center'
          }}
        >
          {isNegative ? '' : '+'}{formatValue(value)}
        </div>
      </div>
    );
  };

  // Filter nodes based on search and status
  const filterNode = (node: HierarchyNode): boolean => {
    const matchesSearch = !uiSettings.searchTerm || 
      node.name.toLowerCase().includes(uiSettings.searchTerm.toLowerCase());
    
    const matchesStatusFilter = uiSettings.statusFilter === 'all' || 
      node.status === uiSettings.statusFilter;
    
    return matchesSearch && matchesStatusFilter;
  };

  const renderScenario = (title: string, modifiedNodeId?: string, modifiedStatus?: 'skip' | 'invert') => {
    // Calculate values for this scenario
    const calculateScenarioValue = (node: HierarchyNode): number => {
      if (node.id === modifiedNodeId && modifiedStatus) {
        if (modifiedStatus === 'skip') return 0;
        if (modifiedStatus === 'invert') return -(node.value || 0);
      }
      
      if (!node.children) {
        if (node.status === 'skip') return 0;
        if (node.status === 'invert') return -(node.value || 0);
        return node.value || 0;
      }
      
      const childrenSum = node.children.reduce((sum, child) => sum + calculateScenarioValue(child), 0);
      if (node.status === 'skip') return 0;
      if (node.status === 'invert') return -childrenSum;
      return childrenSum;
    };

    const totalValue = calculateScenarioValue(data);

    // Find max value for scaling bars
    const allMonthValues = data.children?.flatMap(quarter => 
      quarter.children?.map(month => Math.abs(calculateScenarioValue(month))) || []
    ) || [];
    const maxValue = Math.max(...allMonthValues, 1);

    // Filter quarters based on search and status
    const filteredQuarters = data.children?.filter(filterNode) || [];

    if (filteredQuarters.length === 0 && uiSettings.searchTerm) {
      return null; // Don't render scenario if no quarters match
    }

    return (
      <div className={`rounded-lg shadow-sm border overflow-hidden ${
        uiSettings.colorScheme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className={`text-lg font-semibold mb-2 ${
              uiSettings.colorScheme === 'dark' ? 'text-white' : 'text-gray-800'
            }`} style={{ fontSize: uiSettings.fontSize + 2 }}>
              {title}
            </h3>
            <div className={`border-b-2 pb-2 mb-4 ${
              uiSettings.colorScheme === 'dark' ? 'border-gray-600' : 'border-gray-800'
            }`}>
              <span className={`text-sm ${
                uiSettings.colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>AC</span>
            </div>
          </div>

          {filteredQuarters.map((quarter) => {
            const quarterValue = calculateScenarioValue(quarter);
            const isExpanded = expandedQuarters.has(quarter.id);
            
            return (
              <div key={quarter.id} className="mb-6">
                {/* Quarter Row */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleQuarter(quarter.id)}
                      className={`flex items-center space-x-2 hover:bg-gray-50 p-2 rounded cursor-pointer ${
                        uiSettings.colorScheme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      <span className={`font-medium ${
                        uiSettings.colorScheme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                      }`} style={{ fontSize: uiSettings.fontSize }}>
                        {quarter.name}
                      </span>
                    </button>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className={`font-semibold w-20 text-right ${
                      uiSettings.colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                    }`} style={{ fontSize: uiSettings.fontSize }}>
                      {formatValue(quarterValue)}
                    </span>
                    {showWaterfall && (
                      <HorizontalBar value={quarterValue} maxValue={maxValue * 2} />
                    )}
                  </div>
                </div>
                
                {isExpanded && quarter.children && (
                  <div className="ml-6 space-y-1">
                    {quarter.children
                      .filter(filterNode)
                      .map((month) => {
                        const monthValue = calculateScenarioValue(month);
                        const isModified = month.id === modifiedNodeId;
                        const statusDisplay = getStatusDisplay(month);
                        
                        return (
                          <div 
                            key={month.id} 
                            className={`flex items-center justify-between py-2 px-2 rounded cursor-pointer transition-colors ${
                              uiSettings.colorScheme === 'dark' 
                                ? 'hover:bg-gray-700' 
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              if (month.status === 'normal') {
                                onNodeStatusChange(month.id, 'skip');
                              } else if (month.status === 'skip') {
                                onNodeStatusChange(month.id, 'invert');
                              } else {
                                onNodeStatusChange(month.id, 'normal');
                              }
                            }}
                          >
                            <span className={`${statusDisplay.style} ${isModified ? 'font-medium' : ''} ${
                              uiSettings.colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                            }`} style={{ fontSize: uiSettings.fontSize - 1 }}>
                              {isModified && modifiedStatus === 'invert' ? '- ' : ''}
                              {month.name}
                            </span>
                            <div className="flex items-center space-x-6">
                              <span className={`${statusDisplay.style} ${isModified ? 'font-medium' : ''} w-20 text-right ${
                                uiSettings.colorScheme === 'dark' ? 'text-gray-100' : 'text-gray-800'
                              }`} style={{ fontSize: uiSettings.fontSize - 1 }}>
                                {formatValue(monthValue)}
                              </span>
                              {showWaterfall && (
                                <HorizontalBar value={monthValue} maxValue={maxValue} />
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            );
          })}

          <div className={`border-t pt-3 mt-4 ${
            uiSettings.colorScheme === 'dark' ? 'border-gray-600' : 'border-gray-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold ${
                uiSettings.colorScheme === 'dark' ? 'text-white' : 'text-gray-800'
              }`} style={{ fontSize: uiSettings.fontSize + 1 }}>
                Total
              </span>
              <div className="flex items-center space-x-6">
                <span className={`font-bold text-xl w-20 text-right ${
                  uiSettings.colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
                }`} style={{ fontSize: uiSettings.fontSize + 4 }}>
                  {formatValue(totalValue)}
                </span>
                {showWaterfall && (
                  <HorizontalBar value={totalValue} maxValue={maxValue * 2} />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Check if any data matches current filters
  const hasMatchingData = data.children?.some(quarter => 
    filterNode(quarter) || quarter.children?.some(filterNode)
  );

  if (!hasMatchingData && (uiSettings.searchTerm || uiSettings.statusFilter !== 'all')) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No data matches current filters</div>
          <div className="text-sm">Try adjusting your search or filter settings</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quarterly Breakdown with Horizontal Bars */}
      <div className="space-y-6">
        {renderScenario('Unaltered')}
        {renderScenario('Aug Skipped', 'aug', 'skip')}
        {renderScenario('Aug Inverted', 'aug', 'invert')}
      </div>
    </div>
  );
}