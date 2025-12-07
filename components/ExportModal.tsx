import { Download, X } from "lucide-react";
import React, { useState } from "react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportGIF: (scale: number, FPS: number, loop: boolean) => void;
  onExportSpritesheet: (
    columns: number,
    padding: number,
    format: "png" | "data-uri",
  ) => void;
  onExportFrame: (scale: number) => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportGIF,
  onExportSpritesheet,
  onExportFrame,
}) => {
  const [activeTab, setActiveTab] = useState<"gif" | "sheet" | "frame">("gif");

  // GIF State
  const [gifScale, setGifScale] = useState(1);
  const [gifFps, setGifFps] = useState(12);
  const [gifLoop, setGifLoop] = useState(true);

  // Sheet State
  const [sheetCols, setSheetCols] = useState(1);
  const [sheetPadding, setSheetPadding] = useState(0);
  const [sheetFormat, setSheetFormat] = useState<"png" | "data-uri">("png");

  // Frame State
  const [frameScale, setFrameScale] = useState(1);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg shadow-2xl border border-gray-700 w-[500px] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-900">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download size={20} className="text-indigo-400" /> Export
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-700 bg-gray-850">
          <button
            onClick={() => setActiveTab("gif")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "gif" ? "text-indigo-400 border-b-2 border-indigo-500 bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
          >
            Animated GIF
          </button>
          <button
            onClick={() => setActiveTab("sheet")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "sheet" ? "text-indigo-400 border-b-2 border-indigo-500 bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
          >
            Spritesheet
          </button>
          <button
            onClick={() => setActiveTab("frame")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === "frame" ? "text-indigo-400 border-b-2 border-indigo-500 bg-gray-800" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
          >
            Single Frame
          </button>
        </div>

        <div className="p-6">
          {activeTab === "gif" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    Scale
                  </label>
                  <select
                    value={gifScale}
                    onChange={e => setGifScale(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                  >
                    <option value={1}>1x (Original)</option>
                    <option value={2}>2x</option>
                    <option value={4}>4x</option>
                    <option value={8}>8x</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">
                    FPS (Speed)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={gifFps}
                    onChange={e => setGifFps(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={gifLoop}
                  onChange={e => setGifLoop(e.target.checked)}
                  className="rounded border-gray-600 bg-gray-900 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-300 group-hover:text-white">
                  Loop Forever
                </span>
              </label>

              <button
                onClick={() => onExportGIF(gifScale, gifFps, gifLoop)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98] mt-4"
              >
                Download GIF
              </button>
            </div>
          )}

          {activeTab === "sheet" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Columns
                </label>
                <input
                  type="number"
                  min="1"
                  value={sheetCols}
                  onChange={e => setSheetCols(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                />
                <p className="text-[10px] text-gray-500 mt-1">
                  Rows will be calculated automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Padding (px)
                </label>
                <input
                  type="number"
                  min="0"
                  value={sheetPadding}
                  onChange={e => setSheetPadding(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  Output Format
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSheetFormat("png")}
                    className={`flex-1 py-2 rounded text-sm border ${sheetFormat === "png" ? "bg-indigo-600/20 border-indigo-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}
                  >
                    PNG File
                  </button>
                  <button
                    onClick={() => setSheetFormat("data-uri")}
                    className={`flex-1 py-2 rounded text-sm border ${sheetFormat === "data-uri" ? "bg-indigo-600/20 border-indigo-500 text-white" : "bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700"}`}
                  >
                    Data URI
                  </button>
                </div>
              </div>

              <button
                onClick={() =>
                  onExportSpritesheet(sheetCols, sheetPadding, sheetFormat)
                }
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98] mt-4"
              >
                {sheetFormat === "png"
                  ? "Download Spritesheet"
                  : "Open Data URI"}
              </button>
            </div>
          )}

          {activeTab === "frame" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">
                  Scale
                </label>
                <select
                  value={frameScale}
                  onChange={e => setFrameScale(Number(e.target.value))}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                >
                  <option value={1}>1x (Original)</option>
                  <option value={2}>2x</option>
                  <option value={4}>4x</option>
                  <option value={8}>8x</option>
                  <option value={16}>16x</option>
                </select>
              </div>

              <button
                onClick={() => onExportFrame(frameScale)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98] mt-4"
              >
                Download PNG
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
