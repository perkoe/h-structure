import { X, SkipForward, RotateCcw, CheckCircle, Layers } from 'lucide-react';

interface Props {
  isOpen: boolean;
  position: { x: number; y: number };
  nodeId: string;
  onClose: () => void;
  onStatusChange: (nodeId: string, status: 'normal' | 'skip' | 'invert') => void;
  onBulkOperation: (nodeId: string, operation: 'normal' | 'skip' | 'invert') => void;
}

export default function ContextMenu({ 
  isOpen, 
  position, 
  nodeId, 
  onClose, 
  onStatusChange, 
  onBulkOperation 
}: Props) {
  if (!isOpen) return null;

  const menuItems = [
    {
      icon: CheckCircle,
      label: 'Set Normal',
      action: () => onStatusChange(nodeId, 'normal'),
      color: 'text-green-600 hover:text-green-700',
      description: 'Reset to normal calculation'
    },
    {
      icon: SkipForward,
      label: 'Skip Node',
      action: () => onStatusChange(nodeId, 'skip'),
      color: 'text-red-600 hover:text-red-700',
      description: 'Exclude from calculations (value = 0)'
    },
    {
      icon: RotateCcw,
      label: 'Invert Node',
      action: () => onStatusChange(nodeId, 'invert'),
      color: 'text-yellow-600 hover:text-yellow-700',
      description: 'Invert the value (multiply by -1)'
    },
    { divider: true },
    {
      icon: Layers,
      label: 'Apply to All Children (Normal)',
      action: () => onBulkOperation(nodeId, 'normal'),
      color: 'text-blue-600 hover:text-blue-700',
      description: 'Set all descendants to normal'
    },
    {
      icon: Layers,
      label: 'Apply to All Children (Skip)',
      action: () => onBulkOperation(nodeId, 'skip'),
      color: 'text-red-600 hover:text-red-700',
      description: 'Skip all descendants'
    },
    {
      icon: Layers,
      label: 'Apply to All Children (Invert)',
      action: () => onBulkOperation(nodeId, 'invert'),
      color: 'text-yellow-600 hover:text-yellow-700',
      description: 'Invert all descendants'
    }
  ];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-xl py-2 min-w-[280px] max-w-[320px]"
        style={{
          left: Math.min(position.x, window.innerWidth - 340),
          top: Math.min(position.y, window.innerHeight - 400),
        }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <span className="text-sm font-semibold text-gray-700">Node Actions</span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        
        {menuItems.map((item, index) => {
          if (item.divider) {
            return <hr key={index} className="my-2 border-gray-200" />;
          }
          
          const Icon = item.icon!;
          return (
            <button
              key={index}
              onClick={() => {
                item.action!();
                onClose();
              }}
              className={`w-full flex items-start px-4 py-3 text-left hover:bg-gray-50 transition-colors ${item.color}`}
            >
              <Icon size={18} className="mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-500 mt-1">{item.description}</div>
              </div>
            </button>
          );
        })}
        
        <div className="px-4 py-2 mt-2 border-t border-gray-200">
          <div className="text-xs text-gray-500">
            💡 <strong>Tip:</strong> Bulk operations apply to all child nodes recursively
          </div>
        </div>
      </div>
    </>
  );
}