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
import React from "react";
import { ToolType } from "../types";

interface ToolbarProps {
  selectedTool: ToolType;
  setTool: (tool: ToolType) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  secondaryColor: string;
  setSecondaryColor: (color: string) => void;
  onReplaceColor: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  selectedTool,
  setTool,
  primaryColor,
  setPrimaryColor,
  secondaryColor,
  setSecondaryColor,
  onReplaceColor,
}) => {
  const tools = [
    { type: ToolType.PENCIL, icon: <Pencil size={20} />, label: "Pencil (P)" },
    { type: ToolType.ERASER, icon: <Eraser size={20} />, label: "Eraser (E)" },
    {
      type: ToolType.BUCKET,
      icon: <PaintBucket size={20} />,
      label: "Fill (B)",
    },
    { type: ToolType.PICKER, icon: <Pipette size={20} />, label: "Picker (I)" },
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
  ];

  return (
    <div className="flex flex-col items-center w-full gap-4">
      {tools.map(tool => (
        <button
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

      <div className="mt-auto flex flex-col items-center gap-3 mb-2 pt-4 border-t border-gray-800 w-full">
        <div className="relative group">
          <label className="block text-[10px] text-gray-500 mb-1 text-center font-bold">
            PRI
          </label>
          <input
            type="color"
            value={primaryColor}
            onChange={e => setPrimaryColor(e.target.value)}
            className="w-10 h-10 rounded cursor-pointer border-2 border-gray-600 bg-transparent p-0 overflow-hidden"
          />
        </div>

        <button
          onClick={onReplaceColor}
          className="p-1.5 rounded-full bg-gray-800 hover:bg-indigo-600 hover:text-white text-gray-400 transition-colors"
          title="Replace Primary with Secondary on current frame"
        >
          <RefreshCw size={14} />
        </button>

        <div className="relative group">
          <label className="block text-[10px] text-gray-500 mb-1 text-center font-bold">
            SEC
          </label>
          <input
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
