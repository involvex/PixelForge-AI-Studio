import { Sliders } from "lucide-react";
import React, { useState } from "react";

interface AdjustmentsPanelProps {
  onApply: (brightness: number, contrast: number, gamma: number) => void;
  onClose: () => void;
}

const AdjustmentsPanel: React.FC<AdjustmentsPanelProps> = ({
  onApply,
  onClose,
}) => {
  const [brightness, setBrightness] = useState(0); // -100 to 100
  const [contrast, setContrast] = useState(0); // -100 to 100
  const [gamma, setGamma] = useState(1.0); // 0.1 to 3.0

  return (
    <div className="absolute top-14 left-4 z-30 bg-gray-800 border border-gray-700 p-4 rounded-lg shadow-xl w-64 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h3 className="font-bold text-gray-200 flex items-center gap-2">
          <Sliders size={16} /> Adjustments
        </h3>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Brightness</span>
            <span>{brightness}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={brightness}
            onChange={e => setBrightness(Number(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Contrast</span>
            <span>{contrast}</span>
          </div>
          <input
            type="range"
            min="-100"
            max="100"
            value={contrast}
            onChange={e => setContrast(Number(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Gamma</span>
            <span>{gamma}</span>
          </div>
          <input
            type="range"
            min="0.1"
            max="3.0"
            step="0.1"
            value={gamma}
            onChange={e => setGamma(Number(e.target.value))}
            className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={() => onApply(brightness, contrast, gamma)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-sm font-medium transition-colors"
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default AdjustmentsPanel;
