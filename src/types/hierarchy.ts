export interface HierarchyNode {
  id: string;
  name: string;
  value?: number; // Only for leaf nodes
  children?: HierarchyNode[];
  status: 'normal' | 'skip' | 'invert';
  calculatedValue: number;
  depth: number;
  parent?: HierarchyNode;
}
export interface VisualizationConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  fontSize: number;
  showValues: boolean;
  colorScheme: 'default' | 'dark' | 'colorful';
}

export interface ContextMenuPosition {
  x: number;
  y: number;
  nodeId: string;
}