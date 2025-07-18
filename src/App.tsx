import  { useState, useEffect, useRef } from 'react';
import { TreePine, BarChart3 } from 'lucide-react';
import HierarchyVisualization from './components/HierarchyVisualization';
import ContextMenu from './components/ContextMenu';
import OptimizedControlPanel from './components/OptimizedControlPanel';
import VirtualizedTree from './components/VirtualizedTree';
import { useHierarchyStore } from './store/hierarchyStore';
import { sampleHierarchy } from './utils/sampleData';
import { countNodes } from './utils/hierarchyCalculations';
import { VisualizationConfig, ContextMenuPosition } from './types/hierarchy';

type ViewMode = 'tree'  | 'virtualized';

function App() {
  const { 
    hierarchyData,
    updateNodeStatus,
    applyBulkOperation,
    setHierarchyData,
    uiSettings
  } = useHierarchyStore();

  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('virtualized');
  
  // Create config that syncs with UI settings
  const config: VisualizationConfig = {
    nodeWidth: 120,
    nodeHeight: uiSettings.nodeHeight,
    horizontalSpacing: 200,
    verticalSpacing: 100,
    fontSize: uiSettings.fontSize,
    showValues: uiSettings.showValues,
    colorScheme: uiSettings.colorScheme === 'default' ? 'default' : 
                 uiSettings.colorScheme === 'dark' ? 'dark' : 'colorful'
  };

  const treeContainerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(600);

  // Initialize with sample data
  useEffect(() => {
    setHierarchyData(sampleHierarchy);
  }, [setHierarchyData]);

  // Handle container resize
  useEffect(() => {
    const updateHeight = () => {
      if (treeContainerRef.current) {
        const rect = treeContainerRef.current.getBoundingClientRect();
        setTreeHeight(rect.height - 20);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const nodeCount = hierarchyData ? countNodes(hierarchyData) : 0;

  const handleNodeClick = (nodeId: string) => {
    console.log('Node clicked:', nodeId);
  };

  const handleNodeRightClick = (nodeId: string, x: number, y: number) => {
    setContextMenu({ x, y, nodeId });
  };

  const handleContextMenuClose = () => {
    setContextMenu(null);
  };

  const handleStatusChange = (nodeId: string, status: 'normal' | 'skip' | 'invert') => {
    updateNodeStatus(nodeId, status);
  };

  const handleBulkOperation = (nodeId: string, operation: 'normal' | 'skip' | 'invert') => {
    applyBulkOperation(nodeId, operation);
  };

  return (
    <div className={`min-h-screen ${uiSettings.colorScheme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`border-b px-6 py-4 shadow-sm ${
        uiSettings.colorScheme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TreePine className="text-blue-600" size={28} />
            <div>
              <h1 className={`text-2xl font-bold ${
                uiSettings.colorScheme === 'dark' ? 'text-white' : 'text-gray-900'
              }`}>
                High-Performance Hierarchical Visualizer
              </h1>
              <p className={`text-sm ${
                uiSettings.colorScheme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Optimized for large datasets with virtual rendering and lazy loading
              </p>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className={`flex items-center space-x-2 rounded-lg p-1 ${
            uiSettings.colorScheme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <button
              onClick={() => setViewMode('virtualized')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === 'virtualized'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : uiSettings.colorScheme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TreePine size={18} />
              <span className="font-medium">Data view</span>
            </button>
            
            <button
              onClick={() => setViewMode('tree')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                viewMode === 'tree'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : uiSettings.colorScheme === 'dark'
                    ? 'text-gray-300 hover:text-white'
                    : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 size={18} />
              <span className="font-medium">D3 Tree</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-84px)]">
        {/* Control Panel */}
        <div className={`w-80 p-4 border-r overflow-y-auto ${
          uiSettings.colorScheme === 'dark' 
            ? 'bg-gray-800 border-gray-700' 
            : 'bg-white border-gray-200'
        }`}>
          <OptimizedControlPanel nodeCount={nodeCount} />
        </div>

        {/* Visualization Area */}
        <div className="flex-1 p-6 overflow-hidden" ref={treeContainerRef}>
          {viewMode === 'virtualized' && (
            <VirtualizedTree
              onContextMenu={handleNodeRightClick}
              height={treeHeight}
            />
          )}

          {viewMode === 'tree' && hierarchyData && (
            <div className="h-full overflow-hidden">
              <HierarchyVisualization
                data={hierarchyData}
                config={config}
                onNodeClick={handleNodeClick}
                onNodeRightClick={handleNodeRightClick}
              />
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        isOpen={!!contextMenu}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : { x: 0, y: 0 }}
        nodeId={contextMenu?.nodeId || ''}
        onClose={handleContextMenuClose}
        onStatusChange={handleStatusChange}
        onBulkOperation={handleBulkOperation}
      />
    </div>
  );
}

export default App;