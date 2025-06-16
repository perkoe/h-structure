import { useState, useCallback } from 'react';
import { HierarchyNode } from '../types/hierarchy';
import { updateNodeStatus, applyBulkOperation, recalculateTree } from '../utils/hierarchyCalculations';

export function useHierarchy(initialData: HierarchyNode) {
  const [hierarchyData, setHierarchyData] = useState<HierarchyNode>(() => 
    recalculateTree(initialData)
  );

  const updateNodeStatusHandler = useCallback((nodeId: string, status: 'normal' | 'skip' | 'invert') => {
    setHierarchyData(prev => updateNodeStatus(prev, nodeId, status));
  }, []);

  const applyBulkOperationHandler = useCallback((nodeId: string, operation: 'normal' | 'skip' | 'invert') => {
    setHierarchyData(prev => applyBulkOperation(prev, nodeId, operation));
  }, []);

  const resetHierarchy = useCallback((newData: HierarchyNode) => {
    setHierarchyData(recalculateTree(newData));
  }, []);

  const getNodeCount = useCallback((node: HierarchyNode = hierarchyData): number => {
    let count = 1;
    if (node.children) {
      count += node.children.reduce((sum, child) => sum + getNodeCount(child), 0);
    }
    return count;
  }, [hierarchyData]);

  return {
    hierarchyData,
    updateNodeStatus: updateNodeStatusHandler,
    applyBulkOperation: applyBulkOperationHandler,
    resetHierarchy,
    nodeCount: getNodeCount()
  };
}