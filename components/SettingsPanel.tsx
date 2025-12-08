import { Grid3X3, Minus, Plus } from "lucide-react";
import type React from "react";

interface SettingsPanelProps {
  gridVisible: boolean;
  setGridVisible: (visible: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  gridColor?: string;
  setGridColor?: (color: string) => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  gridVisible,
  setGridVisible,
  gridSize,
  setGridSize,
  gridColor,
  setGridColor,
}) => {
  return (
    <div className="flex items-center gap-4 bg-gray-800 p-2 rounded-lg border border-gray-700 shadow-sm">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setGridVisible(!gridVisible)}
          className={`p-1.5 rounded transition-colors ${
            gridVisible
              ? "bg-indigo-600 text-white"
              : "bg-gray-700 text-gray-400 hover:text-white"
          }`}
          title="Toggle Grid"
        >
          <Grid3X3 size={16} />
        </button>
        <span className="text-xs text-gray-400 font-medium">Grid</span>
      </div>

      <div className="h-4 w-px bg-gray-700" />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setGridSize(Math.max(1, gridSize - 1))}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          disabled={gridSize <= 1}
        >
          <Minus size={14} />
        </button>

        <input
          id="gridSizeInput"
          type="number"
          min={1}
          max={64}
          value={gridSize}
          onChange={e => {
            const val = parseInt(e.target.value, 10);
            if (!Number.isNaN(val)) setGridSize(Math.max(1, Math.min(64, val)));
          }}
          className="w-12 bg-transparent text-center text-xs text-gray-200 border-b border-transparent hover:border-gray-500 focus:border-indigo-500 focus:outline-none"
        />
        <span className="text-xs text-gray-500 -ml-1">px</span>

        <button
          type="button"
          onClick={() => setGridSize(Math.min(64, gridSize + 1))}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          disabled={gridSize >= 64}
        >
          <Plus size={14} />
        </button>
      </div>

      {setGridColor && (
        <>
          <div className="h-4 w-px bg-gray-700" />
          <div className="flex items-center gap-2" title="Grid Color">
            <input
              id="grid-color-input"
              type="color"
              value={gridColor?.startsWith("#") ? gridColor : "#ffffff"}
              onChange={e => setGridColor(e.target.value)}
              className="w-5 h-5 bg-transparent cursor-pointer rounded border-none p-0 overflow-hidden"
            />
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsPanel;
