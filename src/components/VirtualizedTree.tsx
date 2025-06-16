import React, {  useCallback, useMemo, useRef, useEffect } from 'react';
import { FixedSizeList as List } from 'react-window';
import VirtualizedTreeNode from './VirtualizedTreeNode';
import { HierarchyNode } from '../types/hierarchy';
import { useHierarchyStore } from '../store/hierarchyStore';

interface FlatNode {
  node: HierarchyNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
}

interface Props {
  onContextMenu: (nodeId: string, x: number, y: number) => void;
  height: number;
}

export default function VirtualizedTree({ onContextMenu, height }: Props) {
  const { hierarchyData, expandedNodes, selectedNode, uiSettings } = useHierarchyStore();
  const listRef = useRef<List>(null);
  
  // Flatten the tree structure for virtualization
  const flattenedNodes = useMemo(() => {
    if (!hierarchyData) return [];
    
    const result: FlatNode[] = [];
    
    const traverse = (node: HierarchyNode, depth: number) => {
      const isExpanded = expandedNodes.has(node.id);
      const isSelected = selectedNode === node.id;
      
      // Apply search and status filters
      const matchesSearch = !uiSettings.searchTerm || 
        node.name.toLowerCase().includes(uiSettings.searchTerm.toLowerCase());
      
      const matchesStatusFilter = uiSettings.statusFilter === 'all' || 
        node.status === uiSettings.statusFilter;
      
      if (matchesSearch && matchesStatusFilter) {
        result.push({
          node,
          depth,
          isExpanded,
          isSelected
        });
      }
      
      // Only include children if node is expanded and matches filters
      if (isExpanded && node.children && (matchesSearch && matchesStatusFilter)) {
        node.children.forEach(child => traverse(child, depth + 1));
      }
    };
    
    traverse(hierarchyData, 0);
    return result;
  }, [hierarchyData, expandedNodes, selectedNode, uiSettings.searchTerm, uiSettings.statusFilter]);
  
  // Row renderer for react-window
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const flatNode = flattenedNodes[index];
    if (!flatNode) return null;
    
    return (
      <VirtualizedTreeNode
        key={flatNode.node.id}
        node={flatNode.node}
        depth={flatNode.depth}
        isExpanded={flatNode.isExpanded}
        isSelected={flatNode.isSelected}
        onContextMenu={onContextMenu}
        style={style}
      />
    );
  }, [flattenedNodes, onContextMenu]);
  
  // Scroll to selected node
  useEffect(() => {
    if (selectedNode && listRef.current) {
      const index = flattenedNodes.findIndex(fn => fn.node.id === selectedNode);
      if (index >= 0) {
        listRef.current.scrollToItem(index, 'center');
      }
    }
  }, [selectedNode, flattenedNodes]);
  
  if (!hierarchyData) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No data loaded</div>
          <div className="text-sm">Load a dataset to begin visualization</div>
        </div>
      </div>
    );
  }
  
  if (flattenedNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-lg font-medium mb-2">No nodes match current filters</div>
          <div className="text-sm">Try adjusting your search or filter settings</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`h-full rounded-lg overflow-hidden shadow-sm border border-gray-200 ${
      uiSettings.colorScheme === 'dark' ? 'bg-gray-800' : 'bg-white'
    }`}>
      <List
        ref={listRef}
        height={height}
        itemCount={flattenedNodes.length}
        itemSize={uiSettings.nodeHeight}
        overscanCount={10}
        className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
      >
        {Row}
      </List>
    </div>
  );
}