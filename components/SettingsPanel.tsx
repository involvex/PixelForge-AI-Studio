import { Grid3X3, Minus, Plus } from "lucide-react";
import React from "react";

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
          onClick={() => setGridSize(Math.max(1, gridSize - 1))}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
          disabled={gridSize <= 1}
        >
          <Minus size={14} />
        </button>

        <span className="text-xs text-gray-200 min-w-[20px] text-center">
          {gridSize}px
        </span>

        <button
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
