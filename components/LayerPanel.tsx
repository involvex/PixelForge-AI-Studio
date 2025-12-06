import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Unlock, Trash2, Plus, GripVertical, Edit2 } from 'lucide-react';
import { Layer } from '../types';

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
}

const LayerPanel: React.FC<LayerPanelProps> = ({
  layers,
  activeLayerId,
  onAddLayer,
  onRemoveLayer,
  onSelectLayer,
  onUpdateLayer,
  onMoveLayer
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const startEditing = (layer: Layer) => {
    setEditingId(layer.id);
    setEditName(layer.name);
  };

  const saveName = () => {
    if (editingId && editName.trim()) {
      onUpdateLayer(editingId, { name: editName });
    }
    setEditingId(null);
  };

  // UI renders layers Top-Down, but array is typically Bottom-Up in render logic (0 is background).
  // However, for list management, it's easier if index 0 is top or bottom.
  // In `App.tsx` render loop: `layers.forEach` renders 0 first (bottom).
  // So `layers[0]` is Background. `layers[length-1]` is Top.
  // In UI, we usually want Top layer at the top of the list.
  // So we map in reverse order.
  
  const reversedLayers = [...layers].reverse();

  const handleDragStart = (e: React.DragEvent, index: number) => {
     // Store the *original* index (from the reversed array, or actual array? Let's use actual array index)
     // reversedLayers[i] corresponds to layers[layers.length - 1 - i]
     const actualIndex = layers.length - 1 - index;
     e.dataTransfer.setData('layerIndex', actualIndex.toString());
     e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
     e.preventDefault();
     setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
     e.preventDefault();
     const dragIndexStr = e.dataTransfer.getData('layerIndex');
     if (!dragIndexStr) return;
     
     const fromIndex = parseInt(dragIndexStr, 10);
     const toIndex = layers.length - 1 - dropIndex; // Convert UI index back to array index

     if (fromIndex !== toIndex) {
         onMoveLayer(fromIndex, toIndex);
     }
     setDragOverIndex(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white border-l border-gray-750">
      <div className="p-3 border-b border-gray-750 flex items-center justify-between bg-gray-850">
        <h3 className="text-sm font-bold text-gray-200">Layers</h3>
        <button 
          onClick={onAddLayer}
          className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors"
          title="Add Layer"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-1">
        {reversedLayers.map((layer, index) => (
          <div 
            key={layer.id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
            onDragLeave={() => setDragOverIndex(null)}
            onClick={() => onSelectLayer(layer.id)}
            className={`
              relative flex flex-col p-2 rounded cursor-pointer transition-all border border-transparent
              ${activeLayerId === layer.id ? 'bg-indigo-900/40 border-indigo-500/50' : 'bg-gray-800 hover:bg-gray-750'}
              ${dragOverIndex === index ? 'border-t-2 border-t-indigo-400' : ''}
            `}
          >
            {/* Header Row */}
            <div className="flex items-center gap-2">
              <div className="cursor-grab text-gray-500 hover:text-gray-300"><GripVertical size={14} /></div>
              
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { visible: !layer.visible }); }}
                className={`p-1 rounded ${layer.visible ? 'text-gray-300 hover:text-white' : 'text-gray-600'}`}
              >
                {layer.visible ? <Eye size={14} /> : <EyeOff size={14} />}
              </button>
              
              <button 
                onClick={(e) => { e.stopPropagation(); onUpdateLayer(layer.id, { locked: !layer.locked }); }}
                className={`p-1 rounded ${layer.locked ? 'text-red-400' : 'text-gray-600 hover:text-gray-400'}`}
              >
                {layer.locked ? <Lock size={14} /> : <Unlock size={14} />}
              </button>

              {editingId === layer.id ? (
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={saveName}
                  onKeyDown={(e) => e.key === 'Enter' && saveName()}
                  autoFocus
                  className="flex-1 bg-gray-950 border border-indigo-500 rounded px-1 py-0.5 text-xs text-white outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="flex-1 text-sm truncate font-medium select-none"
                  onDoubleClick={() => startEditing(layer)}
                >
                  {layer.name}
                </span>
              )}

               <div className={`flex items-center gap-1 ${activeLayerId === layer.id ? 'opacity-100' : 'opacity-0 hover:opacity-100'}`}>
                   <button 
                     onClick={(e) => { e.stopPropagation(); startEditing(layer); }}
                     className="p-1 hover:bg-gray-700 rounded text-blue-400"
                     title="Rename"
                   >
                     <Edit2 size={12} />
                   </button>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                     className="p-1 hover:bg-red-900/50 rounded text-red-400"
                     title="Delete"
                     disabled={layers.length <= 1}
                   >
                     <Trash2 size={12} />
                   </button>
               </div>
            </div>

            {/* Opacity Slider */}
            {activeLayerId === layer.id && (
                <div className="flex items-center gap-2 mt-2 px-1">
                   <span className="text-[10px] text-gray-500 w-6">{Math.round(layer.opacity * 100)}%</span>
                   <input 
                     type="range" 
                     min="0" 
                     max="1" 
                     step="0.01"
                     value={layer.opacity}
                     onChange={(e) => onUpdateLayer(layer.id, { opacity: parseFloat(e.target.value) })}
                     onClick={(e) => e.stopPropagation()}
                     className="flex-1 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                   />
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerPanel;