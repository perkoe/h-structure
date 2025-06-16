import React, { memo, useCallback } from 'react';
import { ChevronDown, ChevronRight, MoreHorizontal } from 'lucide-react';
import { HierarchyNode } from '../types/hierarchy';
import { useHierarchyStore } from '../store/hierarchyStore';

interface Props {
  node: HierarchyNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onContextMenu: (nodeId: string, x: number, y: number) => void;
  style?: React.CSSProperties;
}

const VirtualizedTreeNode = memo(({
                                    node,
                                    depth,
                                    isExpanded,
                                    isSelected,
                                    onContextMenu,
                                    style
                                  }: Props) => {
  const { toggleNodeExpansion, setSelectedNode, uiSettings, hierarchyData } = useHierarchyStore();

  const hasChildren = node.children && node.children.length > 0;
  const indentWidth = depth * uiSettings.indentSize;

  const handleClick = useCallback(() => {
    setSelectedNode(node.id);
  }, [node.id, setSelectedNode]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      toggleNodeExpansion(node.id);
    }
  }, [node.id, hasChildren, toggleNodeExpansion]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(node.id, e.clientX, e.clientY);
  }, [node.id, onContextMenu]);

  // Calculate max value for waterfall scaling
  const getMaxValue = useCallback(() => {
    if (!hierarchyData) return 1;

    const collectAllValues = (n: HierarchyNode): number[] => {
      const values = [Math.abs(n.calculatedValue)];
      if (n.children) {
        n.children.forEach(child => {
          values.push(...collectAllValues(child));
        });
      }
      return values;
    };

    const allValues = collectAllValues(hierarchyData);
    return Math.max(...allValues, 1);
  }, [hierarchyData]);

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toFixed(1);
  };

  // Waterfall chart component
  const WaterfallBar = ({ value, maxValue }: { value: number; maxValue: number }) => {
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

          {/* Value label with proper spacing and margin */}
          <div
              className={`absolute text-xs font-bold z-10 px-2 py-1 rounded ${
                  isNegative
                      ? 'right-1/2 text-red-800 bg-red-100'
                      : 'left-1/2 text-green-800 bg-green-100'
              }`}
              style={{
                transform: isNegative ? 'translateX(calc(100% + 8px))' : 'translateX(calc(-100% - 8px))',
                minWidth: '50px',
                textAlign: 'center',
                marginLeft: isNegative ? '0' : '8px',
                marginRight: isNegative ? '8px' : '0'
              }}
          >
            {isNegative ? '' : '+'}{formatValue(value)}
          </div>
        </div>
    );
  };

  const getStatusColor = () => {
    const { colorScheme } = uiSettings;

    if (colorScheme === 'dark') {
      switch (node.status) {
        case 'skip': return 'bg-red-900 border-red-700 text-red-100';
        case 'invert': return 'bg-yellow-900 border-yellow-700 text-yellow-100';
        default: return isSelected
            ? 'bg-blue-900 border-blue-700 text-blue-100'
            : 'bg-gray-800 border-gray-600 text-gray-100 hover:bg-gray-700';
      }
    } else if (colorScheme === 'colorful') {
      switch (node.status) {
        case 'skip': return 'bg-gradient-to-r from-red-100 to-red-200 border-red-300 text-red-900';
        case 'invert': return 'bg-gradient-to-r from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-900';
        default: return isSelected
            ? 'bg-gradient-to-r from-blue-100 to-blue-200 border-blue-300 text-blue-900'
            : 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 text-gray-800 hover:from-gray-100 hover:to-gray-200';
      }
    } else if (colorScheme === 'minimal') {
      switch (node.status) {
        case 'skip': return 'bg-white border-l-4 border-l-red-500 text-gray-800';
        case 'invert': return 'bg-white border-l-4 border-l-yellow-500 text-gray-800';
        default: return isSelected
            ? 'bg-white border-l-4 border-l-blue-500 text-gray-800'
            : 'bg-white border-l-4 border-l-gray-200 text-gray-800 hover:border-l-gray-300';
      }
    } else {
      // Default theme
      switch (node.status) {
        case 'skip': return 'bg-red-100 border-red-300 text-red-800';
        case 'invert': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        default: return isSelected
            ? 'bg-blue-100 border-blue-300 text-blue-800'
            : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50';
      }
    }
  };

  const getStatusIcon = () => {
    if (node.status === 'skip') return '⏭';
    if (node.status === 'invert') return '↩';
    return null;
  };

  const matchesSearch = !uiSettings.searchTerm ||
      node.name.toLowerCase().includes(uiSettings.searchTerm.toLowerCase());

  const matchesStatusFilter = uiSettings.statusFilter === 'all' ||
      node.status === uiSettings.statusFilter;

  if (!matchesSearch || !matchesStatusFilter) {
    return null;
  }

  const maxValue = getMaxValue();

  return (
      <div
          style={{
            ...style,
            height: uiSettings.nodeHeight,
            fontSize: uiSettings.fontSize
          }}
          className={`flex items-center px-3 border-l-2 cursor-pointer transition-colors group ${getStatusColor()}`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
      >
        {/* Indentation */}
        <div style={{ width: indentWidth }} />

        {/* Expand/Collapse Button */}
        <div className="w-6 h-6 flex items-center justify-center mr-2">
          {hasChildren && (
              <button
                  onClick={handleToggle}
                  className="p-1 rounded hover:bg-gray-200 transition-colors"
              >
                {isExpanded ? (
                    <ChevronDown size={16} className="text-gray-600" />
                ) : (
                    <ChevronRight size={16} className="text-gray-600" />
                )}
              </button>
          )}
        </div>

        {/* Node Content */}
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-2 min-w-0">
          <span className="font-medium truncate" style={{ fontSize: uiSettings.fontSize }}>
            {node.name}
          </span>
            {getStatusIcon() && (
                <span className="text-sm opacity-75">{getStatusIcon()}</span>
            )}
            {hasChildren && uiSettings.showChildCount && (
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {node.children!.length}
            </span>
            )}
          </div>

          <div className="flex items-center space-x-4 ml-4">
            {uiSettings.showValues && (
                <span
                    className="font-mono font-semibold w-20 text-right"
                    style={{ fontSize: uiSettings.fontSize - 1 }}
                >
              {node.calculatedValue.toFixed(1)}
            </span>
            )}
            <WaterfallBar value={node.calculatedValue} maxValue={maxValue} />

            <button
                onClick={handleContextMenu}
                className="p-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={14} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>
  );
});

VirtualizedTreeNode.displayName = 'VirtualizedTreeNode';

export default VirtualizedTreeNode;