import { Copy, Pause, Play, Plus, Trash2 } from "lucide-react";
import React from "react";
import type { Frame, Layer } from "../types";

interface AnimationPanelProps {
  frames: Frame[];
  layers: Layer[];
  currentFrameIndex: number;
  setCurrentFrameIndex: (index: number) => void;
  addFrame: () => void;
  deleteFrame: (index: number) => void;
  duplicateFrame: (index: number) => void;
  isPlaying: boolean;
  togglePlay: () => void;
  fps: number;
  setFps: (fps: number) => void;
}

const AnimationPanel: React.FC<AnimationPanelProps> = ({
  frames,
  layers,
  currentFrameIndex,
  setCurrentFrameIndex,
  addFrame,
  deleteFrame,
  duplicateFrame,
  isPlaying,
  togglePlay,
  fps,
  setFps,
}) => {
  return (
    <div className="h-48 bg-gray-900 border-t border-gray-750 flex flex-col">
      {/* Controls Header */}
      <div className="h-10 border-b border-gray-750 flex items-center px-4 gap-4 bg-gray-850">
        <button
          type="button"
          onClick={togglePlay}
          className={`flex items-center gap-1 text-xs font-bold px-3 py-1 rounded ${isPlaying ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}
        >
          {isPlaying ? (
            <>
              <Pause size={12} /> STOP
            </>
          ) : (
            <>
              <Play size={12} /> PLAY
            </>
          )}
        </button>

        <div className="flex items-center gap-2">
          <label htmlFor="fps-input" className="text-xs text-gray-400">
            FPS:
          </label>
          <input
            id="fps-input"
            type="number"
            title="Number"
            min="1"
            max="60"
            value={fps}
            onChange={e => setFps(Number(e.target.value))}
            className="w-12 bg-gray-700 border border-gray-600 rounded text-xs px-1 text-center text-white"
          />
        </div>

        <div className="w-px h-4 bg-gray-700 mx-2"></div>

        <button
          type="button"
          onClick={addFrame}
          className="text-gray-400 hover:text-white"
          title="New Frame"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={() => duplicateFrame(currentFrameIndex)}
          className="text-gray-400 hover:text-white"
          title="Duplicate Frame"
        >
          <Copy size={16} />
        </button>
        <button
          type="button"
          onClick={() => deleteFrame(currentFrameIndex)}
          className="text-gray-400 hover:text-red-400"
          title="Delete Frame"
          disabled={frames.length <= 1}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Frames List */}
      {/* Frames List */}
      <div className="flex-1 overflow-x-auto p-4 flex gap-4 scrollbar-thin">
        {frames.map((frame, index) => (
          <button
            type="button"
            key={frame.id}
            onClick={() => setCurrentFrameIndex(index)}
            className={`
              relative flex-shrink-0 w-24 h-24 bg-gray-800 border-2 rounded cursor-pointer group
              ${
                index === currentFrameIndex
                  ? "border-indigo-500 shadow-lg shadow-indigo-500/20"
                  : "border-gray-700 hover:border-gray-500"
              }
            `}
          >
            <div className="absolute top-1 left-2 text-xs text-gray-500 font-pixel z-10">
              {index + 1}
            </div>

            {/* Mini Preview */}
            <div className="w-full h-full p-2 flex items-center justify-center checkerboard rounded-sm overflow-hidden">
              <MiniCanvas frame={frame} layers={layers} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Helper component for frame thumbnails
const MiniCanvas: React.FC<{ frame: Frame; layers: Layer[] }> = ({
  frame,
  layers,
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    // Determine size from first available layer grid
    // Assumes all grids are same size
    // Fix: Explicitly cast grid to correct type to prevent 'unknown' error
    const firstGrid = Object.values(frame.layers)[0] as (string | null)[][];
    if (!firstGrid) {
      return;
    }

    const size = 64; // Thumbnail size
    const pH = firstGrid.length;
    const pW = firstGrid[0]?.length || 0;

    if (pW === 0 || pH === 0) {
      return;
    }

    const scale = size / Math.max(pW, pH);

    ctx.clearRect(0, 0, size, size);

    // Render visible layers
    layers.forEach(layer => {
      if (!layer.visible) {
        return;
      }
      const pixels = frame.layers[layer.id];
      if (!pixels) {
        return;
      }

      ctx.globalAlpha = layer.opacity;
      pixels.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        });
      });
    });
    ctx.globalAlpha = 1.0;
  }, [frame, layers]);

  return (
    <canvas
      ref={canvasRef}
      width={64}
      height={64}
      className="image-pixelated"
    />
  );
};

export default AnimationPanel;
