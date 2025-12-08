import { Palette as PaletteIcon, Plus, Trash2 } from "lucide-react";
import type React from "react";
import { useState } from "react";
import type { Palette as PaletteType } from "../types";

interface PalettePanelProps {
  palettes: PaletteType[];
  activePaletteId: string;
  onSelectPalette: (id: string) => void;
  onCreatePalette: (name: string) => void;
  onDeletePalette: (id: string) => void;
  onUpdatePalette: (id: string, colors: string[]) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

const PalettePanel: React.FC<PalettePanelProps> = ({
  palettes,
  activePaletteId,
  onSelectPalette,
  onCreatePalette,
  onDeletePalette,
  onUpdatePalette,
  primaryColor,
  setPrimaryColor,
}) => {
  const [newPaletteName, setNewPaletteName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const activePalette = palettes.find(p => p.id === activePaletteId);

  const handleCreate = () => {
    if (newPaletteName.trim()) {
      onCreatePalette(newPaletteName.trim());
      setNewPaletteName("");
      setIsCreating(false);
    }
  };

  const addColor = () => {
    if (!activePalette) return;
    if (!activePalette.colors.includes(primaryColor)) {
      onUpdatePalette(activePaletteId, [...activePalette.colors, primaryColor]);
    }
  };

  const removeColor = (colorToRemove: string) => {
    if (!activePalette) return;
    const newColors = activePalette.colors.filter(c => c !== colorToRemove);
    onUpdatePalette(activePaletteId, newColors);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white border-l border-gray-750">
      <div className="p-3 border-b border-gray-750 bg-gray-850">
        <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
          <PaletteIcon size={16} className="text-indigo-400" /> Color Palettes
        </h3>
      </div>

      <div className="p-3 space-y-4 flex-1 overflow-y-auto">
        {/* Palette Selector */}
        <div className="space-y-2">
          <label
            htmlFor="palette-select"
            className="text-xs text-gray-400 font-medium"
          >
            Active Palette
          </label>
          <div className="flex gap-2">
            <select
              id="palette-select"
              title="Active Palette"
              value={activePaletteId}
              onChange={e => onSelectPalette(e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            >
              {palettes.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onDeletePalette(activePaletteId)}
              disabled={palettes.length <= 1}
              className="p-1.5 bg-gray-800 hover:bg-red-900/50 border border-gray-600 rounded text-gray-400 hover:text-red-400 disabled:opacity-50"
              title="Delete Palette"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Colors Grid */}
        <div className="bg-gray-800 rounded p-3 border border-gray-700 min-h-[100px]">
          <div className="grid grid-cols-6 gap-2">
            {activePalette?.colors.map(color => (
              <div
                key={color}
                className="group relative w-full pt-[100%] rounded border border-gray-600 hover:border-white transition-all shadow-sm"
              >
                <button
                  type="button"
                  className="absolute inset-0 w-full h-full rounded cursor-pointer"
                  style={{ backgroundColor: color }}
                  onClick={() => setPrimaryColor(color)}
                  title={color}
                />

                {/* Delete overlay */}
                <button
                  title="Delete Color"
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    removeColor(color);
                  }}
                  className="absolute -top-1 -right-1 z-10 bg-gray-900 rounded-full p-0.5 text-gray-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity border border-gray-700 shadow"
                >
                  <Trash2 size={8} />
                </button>

                {primaryColor === color && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                    <div className="w-1.5 h-1.5 bg-white rounded-full shadow-sm drop-shadow-md" />
                  </div>
                )}
              </div>
            ))}

            {/* Add Current Color Button */}
            <button
              type="button"
              onClick={addColor}
              className="w-full pt-[100%] rounded border border-gray-600 border-dashed hover:border-indigo-400 hover:bg-gray-700/50 flex items-center justify-center relative text-gray-500 hover:text-indigo-400 transition-colors"
              title="Add current primary color"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <Plus size={16} />
              </div>
            </button>
          </div>
        </div>

        {/* Current Color Info */}
        <div className="flex items-center justify-between bg-gray-800 p-2 rounded border border-gray-700">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded border border-gray-600"
              style={{ backgroundColor: primaryColor }}
            ></div>
            <span className="text-xs font-mono text-gray-300">
              {primaryColor.toUpperCase()}
            </span>
          </div>
          <button
            type="button"
            onClick={addColor}
            className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded"
          >
            Add to Palette
          </button>
        </div>

        {/* Create New Section */}
        <div className="border-t border-gray-800 pt-4 mt-4">
          {!isCreating ? (
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded text-gray-300 transition-colors"
            >
              <Plus size={14} /> Create New Palette
            </button>
          ) : (
            <div className="space-y-2 animate-in fade-in duration-200">
              <input
                id="new-palette-name"
                type="text"
                value={newPaletteName}
                onChange={e => setNewPaletteName(e.target.value)}
                placeholder="Palette Name..."
                className="w-full bg-gray-900 border border-indigo-500 rounded px-2 py-1.5 text-xs text-white outline-none"
                onKeyDown={e => e.key === "Enter" && handleCreate()}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PalettePanel;
