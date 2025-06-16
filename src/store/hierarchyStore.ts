import { create } from 'zustand';
import { HierarchyNode } from '../types/hierarchy';
import { updateNodeStatus, applyBulkOperation, recalculateTree } from '../utils/hierarchyCalculations';

interface UiSettings {
  fontSize: number;
  nodeHeight: number;
  indentSize: number;
  showValues: boolean;
  showChildCount: boolean;
  colorScheme: 'default' | 'dark' | 'colorful' | 'minimal';
  searchTerm: string;
  statusFilter: 'all' | 'normal' | 'skip' | 'invert';
}

interface HierarchyStore {
  hierarchyData: HierarchyNode | null;
  expandedNodes: Set<string>;
  selectedNode: string | null;
  isCalculating: boolean;
  calculationProgress: number;
  uiSettings: UiSettings;
  
  // Actions
  setHierarchyData: (data: HierarchyNode) => void;
  updateNodeStatus: (nodeId: string, status: 'normal' | 'skip' | 'invert') => void;
  applyBulkOperation: (nodeId: string, operation: 'normal' | 'skip' | 'invert') => void;
  toggleNodeExpansion: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  expandToDepth: (depth: number) => void;
  collapseAll: () => void;
  updateUiSettings: (settings: Partial<UiSettings>) => void;
}

const defaultUiSettings: UiSettings = {
  fontSize: 14,
  nodeHeight: 48,
  indentSize: 24,
  showValues: true,
  showChildCount: true,
  colorScheme: 'default',
  searchTerm: '',
  statusFilter: 'all'
};

export const useHierarchyStore = create<HierarchyStore>((set, get) => ({
  hierarchyData: null,
  expandedNodes: new Set(),
  selectedNode: null,
  isCalculating: false,
  calculationProgress: 0,
  uiSettings: defaultUiSettings,

  setHierarchyData: (data: HierarchyNode) => {
    set({ 
      hierarchyData: recalculateTree(data),
      expandedNodes: new Set([data.id]), // Only expand root by default
      selectedNode: null 
    });
  },

  updateNodeStatus: (nodeId: string, status: 'normal' | 'skip' | 'invert') => {
    const { hierarchyData } = get();
    if (!hierarchyData) return;
    
    set({ isCalculating: true, calculationProgress: 0 });
    
    // Use requestAnimationFrame to avoid blocking UI
    requestAnimationFrame(() => {
      const updatedData = updateNodeStatus(hierarchyData, nodeId, status);
      set({ 
        hierarchyData: updatedData, 
        isCalculating: false, 
        calculationProgress: 100 
      });
    });
  },

  applyBulkOperation: (nodeId: string, operation: 'normal' | 'skip' | 'invert') => {
    const { hierarchyData } = get();
    if (!hierarchyData) return;
    
    set({ isCalculating: true, calculationProgress: 0 });
    
    requestAnimationFrame(() => {
      const updatedData = applyBulkOperation(hierarchyData, nodeId, operation);
      set({ 
        hierarchyData: updatedData, 
        isCalculating: false, 
        calculationProgress: 100 
      });
    });
  },

  toggleNodeExpansion: (nodeId: string) => {
    const { expandedNodes } = get();
    const newExpanded = new Set(expandedNodes);
    
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    
    set({ expandedNodes: newExpanded });
  },

  setSelectedNode: (nodeId: string | null) => {
    set({ selectedNode: nodeId });
  },

  expandToDepth: (depth: number) => {
    const { hierarchyData } = get();
    if (!hierarchyData) return;
    
    const newExpanded = new Set<string>();
    
    const traverse = (node: HierarchyNode, currentDepth: number) => {
      if (currentDepth < depth) {
        newExpanded.add(node.id);
        node.children?.forEach(child => traverse(child, currentDepth + 1));
      }
    };
    
    traverse(hierarchyData, 0);
    set({ expandedNodes: newExpanded });
  },

  collapseAll: () => {
    const { hierarchyData } = get();
    if (!hierarchyData) return;
    
    set({ expandedNodes: new Set([hierarchyData.id]) });
  },

  updateUiSettings: (settings: Partial<UiSettings>) => {
    set(state => ({
      uiSettings: { ...state.uiSettings, ...settings }
    }));
  }
}));