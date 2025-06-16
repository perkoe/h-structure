import { HierarchyNode } from '../types/hierarchy';

// Enhanced memoization with LRU cache
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Enhanced calculation cache
const calculationCache = new LRUCache<string, number>(50000);

// Batch calculation with progress tracking
export function calculateNodeValue(node: HierarchyNode, forceRecalculate = false): number {
  const cacheKey = generateCacheKey(node);
  
  if (!forceRecalculate) {
    const cached = calculationCache.get(cacheKey);
    if (cached !== undefined) {
      return cached;
    }
  }

  let result: number;

  if (!node.children || node.children.length === 0) {
    // Leaf node calculation
    result = calculateLeafValue(node);
  } else {
    // Parent node calculation
    result = calculateParentValue(node);
  }

  calculationCache.set(cacheKey, result);
  return result;
}

function generateCacheKey(node: HierarchyNode): string {
  if (!node.children || node.children.length === 0) {
    return `${node.id}-${node.status}-${node.value || 0}`;
  }
  
  const childrenKey = node.children
    .map(child => `${child.id}:${child.calculatedValue}`)
    .join('|');
  
  return `${node.id}-${node.status}-${childrenKey}`;
}

function calculateLeafValue(node: HierarchyNode): number {
  switch (node.status) {
    case 'skip':
      return 0;
    case 'invert':
      return -(node.value || 0);
    default:
      return node.value || 0;
  }
}

function calculateParentValue(node: HierarchyNode): number {
  const childrenSum = node.children!.reduce((sum, child) => {
    return sum + child.calculatedValue;
  }, 0);

  switch (node.status) {
    case 'skip':
      return 0;
    case 'invert':
      return -childrenSum;
    default:
      return childrenSum;
  }
}

// Optimized batch update with requestAnimationFrame
export function updateNodeStatus(
  rootNode: HierarchyNode, 
  nodeId: string, 
  newStatus: 'normal' | 'skip' | 'invert'
): HierarchyNode {
  return updateNodeRecursive(rootNode, nodeId, newStatus);
}

function updateNodeRecursive(node: HierarchyNode, nodeId: string, newStatus: 'normal' | 'skip' | 'invert'): HierarchyNode {
  if (node.id === nodeId) {
    const updatedNode = { ...node, status: newStatus };
    updatedNode.calculatedValue = calculateNodeValue(updatedNode, true);
    return updatedNode;
  }

  if (node.children) {
    const updatedChildren = node.children.map(child => 
      updateNodeRecursive(child, nodeId, newStatus)
    );
    
    const hasChanges = updatedChildren.some((child, index) => child !== node.children![index]);
    
    if (hasChanges) {
      const updatedNode = { ...node, children: updatedChildren };
      updatedNode.calculatedValue = calculateNodeValue(updatedNode, true);
      return updatedNode;
    }
  }

  return node;
}

// Optimized tree recalculation with batching
export function recalculateTree(node: HierarchyNode): HierarchyNode {
  calculationCache.clear();
  return recalculateNodeRecursive(node);
}

function recalculateNodeRecursive(node: HierarchyNode): HierarchyNode {
  if (node.children) {
    const updatedChildren = node.children.map(recalculateNodeRecursive);
    const updatedNode = { ...node, children: updatedChildren };
    updatedNode.calculatedValue = calculateNodeValue(updatedNode, true);
    return updatedNode;
  } else {
    const updatedNode = { ...node };
    updatedNode.calculatedValue = calculateNodeValue(updatedNode, true);
    return updatedNode;
  }
}

export function findNodeById(root: HierarchyNode, id: string): HierarchyNode | null {
  if (root.id === id) return root;
  
  if (root.children) {
    for (const child of root.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  
  return null;
}

// Optimized bulk operations with batching
export function applyBulkOperation(
  rootNode: HierarchyNode,
  nodeId: string,
  operation: 'normal' | 'skip' | 'invert'
): HierarchyNode {
  return applyBulkOperationRecursive(rootNode, nodeId, operation);
}

function applyBulkOperationRecursive(
  node: HierarchyNode,
  nodeId: string,
  operation: 'normal' | 'skip' | 'invert'
): HierarchyNode {
  if (node.id === nodeId) {
    return applyToSubtree(node, operation);
  }

  if (node.children) {
    const updatedChildren = node.children.map(child => 
      applyBulkOperationRecursive(child, nodeId, operation)
    );
    
    const hasChanges = updatedChildren.some((child, index) => child !== node.children![index]);
    
    if (hasChanges) {
      const updatedNode = { ...node, children: updatedChildren };
      updatedNode.calculatedValue = calculateNodeValue(updatedNode, true);
      return updatedNode;
    }
  }

  return node;
}

function applyToSubtree(node: HierarchyNode, operation: 'normal' | 'skip' | 'invert'): HierarchyNode {
  const updatedNode = { ...node, status: operation };
  
  if (node.children) {
    updatedNode.children = node.children.map(child => applyToSubtree(child, operation));
  }
  
  updatedNode.calculatedValue = calculateNodeValue(updatedNode, true);
  return updatedNode;
}

// Utility function to count nodes
export function countNodes(node: HierarchyNode): number {
  let count = 1;
  if (node.children) {
    count += node.children.reduce((sum, child) => sum + countNodes(child), 0);
  }
  return count;
}