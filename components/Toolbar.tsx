import {
  BoxSelect,
  Eraser,
  Hand,
  LassoSelect,
  MousePointer2,
  Move,
  PaintBucket,
  Pencil,
  Pipette,
  RefreshCw,
  Wand,
} from "lucide-react";
import React, { useMemo } from "react";
import { SelectMode, ToolType } from "../types.ts";

interface ToolbarProps {
  selectedTool: ToolType;
  setTool: (tool: ToolType) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  onReplaceColor: () => void;
  selectMode?: SelectMode;
  setSelectMode?: (mode: SelectMode) => void;
  wandTolerance?: number;
  setWandTolerance?: (tol: number) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  setTool,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  onReplaceColor,
  selectMode,
  setSelectMode,
  wandTolerance,
  setWandTolerance,
}) => {
  // Memoize tools array to prevent recreation on every render
  const tools = useMemo(
    () => [
      {
        type: ToolType.PENCIL,
        icon: <Pencil size={20} />,
        label: "Pencil (P)",
      },
      {
        type: ToolType.ERASER,
        icon: <Eraser size={20} />,
        label: "Eraser (E)",
      },
      {
        type: ToolType.BUCKET,
        icon: <PaintBucket size={20} />,
        label: "Fill (B)",
      },
      {
        type: ToolType.PICKER,
        icon: <Pipette size={20} />,
        label: "Picker (I)",
      },
      {
        type: ToolType.MAGIC_WAND,
        icon: <Wand size={20} />,
        label: "Magic Wand (W)",
      },
      {
        type: ToolType.SELECT,
        icon: <MousePointer2 size={20} />,
        label: "Select (S)",
      },
      {
        type: ToolType.LASSO,
        icon: <LassoSelect size={20} />,
        label: "Lasso (L)",
      },
      { type: ToolType.MOVE, icon: <Move size={20} />, label: "Move (M)" },
      {
        type: ToolType.TRANSFORM,
        icon: <BoxSelect size={20} />,
        label: "Transform (T)",
      },
      {
        type: ToolType.HAND,
        icon: <Hand size={20} />,
        label: "Hand (H)",
      },
    ],
    [], // Empty dependency array since tools are static
  );

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {tools.map(tool => (
        <button
          type="button"
          key={tool.type}
          onClick={() => setTool(tool.type)}
          className={`p-3 rounded-xl transition-all ${
            selectedTool === tool.type
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
              : "text-gray-400 hover:bg-gray-750 hover:text-white"
          }`}
          title={tool.label}
        >
          {tool.icon}
        </button>
      ))}

      {/* Select Tool Options */}
      {selectedTool === ToolType.SELECT && selectMode && setSelectMode && (
        <div className="flex flex-col gap-1 mt-2 p-1 bg-gray-900 rounded border border-gray-700 w-[90%]">
          <button
            type="button"
            onClick={() => setSelectMode(SelectMode.BOX)}
            className={`text-[10px] px-1 py-1 rounded ${selectMode === SelectMode.BOX ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Box
          </button>
          <button
            type="button"
            onClick={() => setSelectMode(SelectMode.BRUSH)}
            className={`text-[10px] px-1 py-1 rounded ${selectMode === SelectMode.BRUSH ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"}`}
          >
            Brush
          </button>
        </div>
      )}

      {/* Magic Wand Options */}
      {selectedTool === ToolType.MAGIC_WAND &&
        wandTolerance !== undefined &&
        setWandTolerance && (
          <div className="flex flex-col gap-1 mt-2 p-1 bg-gray-900 rounded border border-gray-700 w-[90%]">
            <label
              htmlFor="toolbar-wand-tolerance"
              className="text-[10px] text-gray-400"
            >
              Tolerance: {wandTolerance}
            </label>
            <input
              id="toolbar-wand-tolerance"
              type="range"
              min="0"
              max="255"
              value={wandTolerance}
              onChange={e => setWandTolerance(Number(e.target.value))}
              className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        )}

      <div className="mt-auto flex flex-col items-center gap-3 mb-2 pt-4 border-t border-gray-800 w-full">
        <div className="relative group">
          <label
            htmlFor="toolbar-primary-color"
            className="block text-[10px] text-gray-500 mb-1 text-center font-bold"
          >
            PRI
          </label>
          <input
            id="toolbar-primary-color"
            type="color"
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-600 bg-transparent p-0 overflow-hidden"
          />
        </div>

        <button
          type="button"
          onClick={onReplaceColor}
          className="p-1.5 rounded-full bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-400 transition-colors"
          title="Replace Primary with Secondary on current frame"
        >
          <RefreshCw size={14} />
        </button>

        <div className="relative group">
          <label
            htmlFor="toolbar-secondary-color"
            className="block text-[10px] text-gray-500 mb-1 text-center font-bold"
          >
            SEC
          </label>
          <input
            id="toolbar-secondary-color"
            type="color"
            value={secondaryColor}
            onChange={e => setSecondaryColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-600 bg-transparent p-0 overflow-hidden"
          />
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
