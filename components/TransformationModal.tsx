import type React from "react";
import { useState } from "react";
import { X, Move, RotateCw, Maximize, ArrowRight } from "lucide-react";

interface TransformationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (options: {
    scaleX: number;
    scaleY: number;
    rotate: number;
  }) => void;
}

const TransformationModal: React.FC<TransformationModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const [scaleX, setScaleX] = useState(100);
  const [scaleY, setScaleY] = useState(100);
  const [rotate, setRotate] = useState(0);
  const [locked, setLocked] = useState(true);

  if (!isOpen) return null;

  const handleScaleXChange = (val: number) => {
    setScaleX(val);
    if (locked) setScaleY(val);
  };

  const handleApply = () => {
    onApply({ scaleX, scaleY, rotate });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in md:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Move size={18} className="text-indigo-400" />
            Transform Selection
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Scale Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <Maximize size={16} />
              Scale (%)
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="transform-scale-x"
                  className="text-xs text-gray-500 uppercase font-bold"
                >
                  W
                </label>
                <input
                  id="transform-scale-x"
                  type="number"
                  value={scaleX}
                  onChange={e => handleScaleXChange(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="pt-5 text-gray-500">{locked ? "=" : "x"}</div>
              <div className="flex-1 space-y-1">
                <label
                  htmlFor="transform-scale-y"
                  className="text-xs text-gray-500 uppercase font-bold"
                >
                  H
                </label>
                <input
                  id="transform-scale-y"
                  type="number"
                  value={scaleY}
                  onChange={e => setScaleY(Number(e.target.value))}
                  disabled={locked}
                  className={`w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none ${locked ? "opacity-50 cursor-not-allowed" : ""}`}
                />
              </div>
              <button
                type="button"
                onClick={() => setLocked(!locked)}
                className={`mt-5 p-1.5 rounded transition-colors ${locked ? "bg-indigo-600 text-white" : "bg-gray-700 text-gray-400"}`}
                title="Lock Aspect Ratio"
              >
                <span className="text-xs font-bold">🔒</span>
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-700" />

          {/* Rotate Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-300">
              <RotateCw size={16} />
              Rotate (Degrees)
            </div>
            <div className="flex items-center gap-4">
              <label htmlFor="transform-rotate-range" className="sr-only">
                Rotate Range
              </label>
              <input
                id="transform-rotate-range"
                type="range"
                min="-180"
                max="180"
                value={rotate}
                onChange={e => setRotate(Number(e.target.value))}
                className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <div className="w-20 group relative">
                <label htmlFor="transform-rotate-number" className="sr-only">
                  Rotate Degrees
                </label>
                <input
                  id="transform-rotate-number"
                  type="number"
                  value={rotate}
                  onChange={e => setRotate(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1.5 text-white focus:border-indigo-500 focus:outline-none text-right pr-6"
                />
                <span className="absolute right-2 top-2 text-gray-500 text-xs">
                  °
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-300 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            Apply <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransformationModal;
