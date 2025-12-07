import {
  ArrowLeftRight,
  Copy,
  Download,
  FlipHorizontal,
  FolderOpen,
  Layers,
  Maximize2,
  Minimize2,
  MousePointer2,
  Palette as PaletteIcon,
  Redo,
  Save,
  Settings,
  Sliders,
  Sparkles,
  Undo,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import AdjustmentsPanel from "./components/AdjustmentsPanel";
import AIPanel from "./components/AIPanel";
import AnimationPanel from "./components/AnimationPanel";
import AppLoader from "./components/AppLoader";
import EditorCanvas from "./components/EditorCanvas";
import ExportModal from "./components/ExportModal";
import LayerPanel from "./components/LayerPanel";
import NetworkStatus from "./components/NetworkStatus";
import PalettePanel from "./components/PalettePanel";
import SettingsModal from "./components/SettingsModal";
import SettingsPanel from "./components/SettingsPanel";
import Toolbar from "./components/Toolbar";
import { type Frame, type Layer, type Palette, ToolType } from "./types";
import {
  contractMask,
  createEmptyGrid,
  expandMask,
  invertMask,
  replaceColor,
} from "./utils/drawingUtils";
import {
  createGif,
  createSpriteSheet,
  downloadBlob,
  framesToDataURL,
  renderFrameToCanvas,
} from "./utils/exportUtils.ts";
import { defaultTheme } from "./utils/themeUtils";

const DEFAULT_SIZE = 32;

// Default Palette (Pico-8)
const DEFAULT_PALETTE: Palette = {
  id: "default-pico8",
  name: "Default (Pico-8)",
  colors: [
    "#000000",
    "#1D2B53",
    "#7E2553",
    "#008751",
    "#AB5236",
    "#5F574F",
    "#C2C3C7",
    "#FFF1E8",
    "#FF004D",
    "#FFA300",
    "#FFEC27",
    "#00E436",
    "#29ADFF",
    "#83769C",
    "#FF77A8",
    "#FFCCAA",
  ],
};

// History State Interface
interface HistoryState {
  frames: Frame[];
  layers: Layer[];
  width: number;
  height: number;
  activeLayerId: string;
  currentFrameIndex: number;
  selectionMask: boolean[][] | null;
  // We don't typically undo palette changes, but we could. For now, excluding palettes from history.
}

function App() {
  // --- State ---
  const [width, setWidth] = useState(DEFAULT_SIZE);
  const [height, setHeight] = useState(DEFAULT_SIZE);

  // Initialize with one layer
  const initialLayerId = "layer-1";
  const [layers, setLayers] = useState<Layer[]>([
    {
      id: initialLayerId,
      name: "Layer 1",
      visible: true,
      locked: false,
      opacity: 1.0,
    },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>(initialLayerId);

  const [frames, setFrames] = useState<Frame[]>([
    {
      id: "1",
      layers: { [initialLayerId]: createEmptyGrid(DEFAULT_SIZE, DEFAULT_SIZE) },
      delay: 100,
    },
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.PENCIL);
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#000000");

  const [fps, setFps] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  const [gridSize, setGridSize] = useState(1);

  // Selection Mask & Saved Selections
  const [selectionMask, setSelectionMask] = useState<boolean[][] | null>(null);
  const [savedSelections, setSavedSelections] = useState<
    Record<string, boolean[][]>
  >({});

  // Palettes
  const [palettes, setPalettes] = useState<Palette[]>([DEFAULT_PALETTE]);
  const [activePaletteId, setActivePaletteId] = useState<string>(
    DEFAULT_PALETTE.id,
  );

  // History Stacks
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  // Version counter to signal canvas to reset transient states (like transform)
  const [historyVersion, setHistoryVersion] = useState(0);

  // Right Sidebar Tab State
  const [activeRightTab, setActiveRightTab] = useState<
    "layers" | "ai" | "palettes"
  >("layers");

  // Settings State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [zoom, setZoom] = useState(15);
  const [gridColor, setGridColor] = useState("rgba(255, 255, 255, 0.05)");

  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem("pf_apiKey") || "",
  );
  const [currentThemeId, setCurrentThemeId] = useState(
    () => localStorage.getItem("pf_themeId") || defaultTheme.id,
  );
  const [minimizeToTray, setMinimizeToTray] = useState(
    () => localStorage.getItem("pf_minimizeToTray") === "true",
  );
  const [settingsTab, setSettingsTab] = useState<
    "general" | "themes" | "api" | "plugins" | "about" | "repo"
  >("general");

  // Layout State
  const [rightSidebarWidth, setRightSidebarWidth] = useState(320);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

  // Electron Listeners
  useEffect(() => {
    // Check if running in Electron and API is available
    if (window.electronAPI) {
      window.electronAPI.onOpenSettings((tab?: string) => {
        if (tab) setSettingsTab(tab as never);
        setIsSettingsOpen(true);
      });
    }
  }, []);

  // Sidebar Resizing
  const startResizing = useCallback(() => setIsResizingSidebar(true), []);
  const stopResizing = useCallback(() => setIsResizingSidebar(false), []);
  const resize = useCallback(
    (e: MouseEvent) => {
      if (isResizingSidebar) {
        const newWidth = window.innerWidth - e.clientX;
        setRightSidebarWidth(Math.max(200, Math.min(600, newWidth)));
      }
    },
    [isResizingSidebar],
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem("pf_apiKey", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("pf_themeId", currentThemeId);
  }, [currentThemeId]);

  useEffect(() => {
    localStorage.setItem("pf_minimizeToTray", String(minimizeToTray));
  }, [minimizeToTray]);

  // --- Animation Loop ---
  useEffect(() => {
    if (isPlaying) {
      const intervalId = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 1000 / fps);
      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isPlaying, fps, frames.length]);

  // --- History Management ---

  const recordHistory = useCallback(() => {
    // Deep copy current state
    const currentState: HistoryState = {
      frames: JSON.parse(JSON.stringify(frames)),
      layers: JSON.parse(JSON.stringify(layers)),
      width,
      height,
      activeLayerId,
      currentFrameIndex,
      selectionMask: selectionMask
        ? JSON.parse(JSON.stringify(selectionMask))
        : null,
    };

    setPast(prev => {
      // Limit history size to e.g. 50 steps
      const newHistory = [...prev, currentState];
      if (newHistory.length > 50) return newHistory.slice(1);
      return newHistory;
    });
    setFuture([]); // Clear redo stack
  }, [
    frames,
    layers,
    width,
    height,
    activeLayerId,
    currentFrameIndex,
    selectionMask,
  ]);

  const performUndo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    // Save current to future
    const current: HistoryState = {
      frames,
      layers,
      width,
      height,
      activeLayerId,
      currentFrameIndex,
      selectionMask,
    };
    setFuture(prev => [current, ...prev]);
    setPast(newPast);

    // Restore
    setFrames(previous.frames);
    setLayers(previous.layers);
    setWidth(previous.width);
    setHeight(previous.height);
    // Only set active layer if it still exists (it should), but safe to restore
    setActiveLayerId(previous.activeLayerId);
    setCurrentFrameIndex(previous.currentFrameIndex);
    setSelectionMask(previous.selectionMask);

    setHistoryVersion(v => v + 1);
  }, [
    past,
    frames,
    layers,
    width,
    height,
    activeLayerId,
    currentFrameIndex,
    selectionMask,
  ]);

  const performRedo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    // Save current to past
    const current: HistoryState = {
      frames,
      layers,
      width,
      height,
      activeLayerId,
      currentFrameIndex,
      selectionMask,
    };
    setPast(prev => [...prev, current]);
    setFuture(newFuture);

    // Restore
    setFrames(next.frames);
    setLayers(next.layers);
    setWidth(next.width);
    setHeight(next.height);
    setActiveLayerId(next.activeLayerId);
    setCurrentFrameIndex(next.currentFrameIndex);
    setSelectionMask(next.selectionMask);

    setHistoryVersion(v => v + 1);
  }, [
    future,
    frames,
    layers,
    width,
    height,
    activeLayerId,
    currentFrameIndex,
    selectionMask,
  ]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          performRedo();
        } else {
          performUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        performRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [performUndo, performRedo]);

  // --- Helpers ---

  // Updates the pixels of the SPECIFIC layer in the CURRENT frame
  const updateActiveLayerPixels = (
    layerId: string,
    newPixels: (string | null)[][],
  ) => {
    setFrames(prev =>
      prev.map((f, i) => {
        if (i !== currentFrameIndex) return f;
        return {
          ...f,
          layers: {
            ...f.layers,
            [layerId]: newPixels,
          },
        };
      }),
    );
  };

  const handleResize = (newW: number, newH: number) => {
    if (newW < 1 || newH < 1) return;
    recordHistory();
    setWidth(newW);
    setHeight(newH);

    setFrames(prev =>
      prev.map(f => {
        const newLayers: Record<string, (string | null)[][]> = {};

        Object.keys(f.layers).forEach(lid => {
          const oldGrid = f.layers[lid];
          const newGrid = createEmptyGrid(newW, newH);
          // Copy existing
          for (let y = 0; y < Math.min(oldGrid.length, newH); y++) {
            for (let x = 0; x < Math.min(oldGrid[0].length, newW); x++) {
              newGrid[y][x] = oldGrid[y][x];
            }
          }
          newLayers[lid] = newGrid;
        });

        return { ...f, layers: newLayers };
      }),
    );
    setSelectionMask(null);
  };

  const addFrame = () => {
    recordHistory();
    // New frame needs empty grids for all existing layers
    const newLayers: Record<string, (string | null)[][]> = {};
    layers.forEach(l => {
      newLayers[l.id] = createEmptyGrid(width, height);
    });

    setFrames(prev => [
      ...prev,
      { id: Date.now().toString(), layers: newLayers, delay: 100 },
    ]);
    setCurrentFrameIndex(frames.length);
  };

  const duplicateFrame = (index: number) => {
    recordHistory();
    const frameToCopy = frames[index];
    // Deep copy layers
    const newLayers: Record<string, (string | null)[][]> = {};
    Object.keys(frameToCopy.layers).forEach(lid => {
      newLayers[lid] = frameToCopy.layers[lid].map(row => [...row]);
    });

    const newFrame = {
      id: Date.now().toString(),
      layers: newLayers,
      delay: frameToCopy.delay,
    };
    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, newFrame);
    setFrames(newFrames);
    setCurrentFrameIndex(index + 1);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    recordHistory();
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    setCurrentFrameIndex(Math.max(0, index - 1));
  };

  const handleReplaceColor = () => {
    recordHistory();
    // Replaces color on ACTIVE layer
    const currentPixels = frames[currentFrameIndex].layers[activeLayerId];
    if (!currentPixels) return;
    const newPixels = replaceColor(currentPixels, primaryColor, secondaryColor);
    updateActiveLayerPixels(activeLayerId, newPixels);
  };

  // --- Palette Management ---
  const handleCreatePalette = (name: string) => {
    const newPalette: Palette = {
      id: Date.now().toString(),
      name,
      colors: [],
    };
    setPalettes(prev => [...prev, newPalette]);
    setActivePaletteId(newPalette.id);
  };

  const handleDeletePalette = (id: string) => {
    if (palettes.length <= 1) return;
    const newPalettes = palettes.filter(p => p.id !== id);
    setPalettes(newPalettes);
    if (activePaletteId === id) {
      setActivePaletteId(newPalettes[0].id);
    }
  };

  const handleUpdatePalette = (id: string, colors: string[]) => {
    setPalettes(prev => prev.map(p => (p.id === id ? { ...p, colors } : p)));
  };

  // --- Layer Management ---
  const handleAddLayer = () => {
    recordHistory();
    const newId = `layer-${Date.now()}`;
    const newLayer: Layer = {
      id: newId,
      name: `Layer ${layers.length + 1}`,
      visible: true,
      locked: false,
      opacity: 1.0,
    };

    setLayers(prev => [...prev, newLayer]); // Add to top
    setActiveLayerId(newId);

    // Initialize grid for this new layer in ALL frames
    setFrames(prev =>
      prev.map(f => ({
        ...f,
        layers: {
          ...f.layers,
          [newId]: createEmptyGrid(width, height),
        },
      })),
    );
  };

  const handleRemoveLayer = (id: string) => {
    if (layers.length <= 1) return;
    recordHistory();
    const newLayers = layers.filter(l => l.id !== id);
    setLayers(newLayers);

    // Cleanup frames
    setFrames(prev =>
      prev.map(f => {
        const newFrameLayers = { ...f.layers };
        delete newFrameLayers[id];
        return { ...f, layers: newFrameLayers };
      }),
    );

    if (activeLayerId === id) {
      setActiveLayerId(newLayers[newLayers.length - 1].id);
    }
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    // Avoid recording history for opacity slider drag
    if (updates.opacity === undefined) {
      recordHistory();
    }
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleMoveLayer = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      fromIndex >= layers.length ||
      toIndex < 0 ||
      toIndex >= layers.length ||
      fromIndex === toIndex
    ) {
      return;
    }
    recordHistory();
    const newLayers = [...layers];
    const [movedLayer] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, movedLayer);
    setLayers(newLayers);
  };

  // --- Selection Operations ---

  const invertSelection = () => {
    if (!selectionMask) return;
    recordHistory();
    setSelectionMask(invertMask(selectionMask));
  };

  const expandSelection = () => {
    if (!selectionMask) return;
    recordHistory();
    setSelectionMask(expandMask(selectionMask, width, height));
  };

  const contractSelection = () => {
    if (!selectionMask) return;
    recordHistory();
    setSelectionMask(contractMask(selectionMask, width, height));
  };

  const saveSelection = () => {
    if (!selectionMask) return;
    const name = prompt(
      "Enter a name for this selection mask:",
      `Selection ${Object.keys(savedSelections).length + 1}`,
    );
    if (name) {
      setSavedSelections(prev => ({
        ...prev,
        [name]: selectionMask,
      }));
    }
  };

  const loadSelection = (name: string) => {
    if (savedSelections[name]) {
      recordHistory();
      setSelectionMask(savedSelections[name]);
    }
  };

  // Export logic moved to utils/exportUtils.ts
  const getCompositeDataURL = () => {
    const canvas = renderFrameToCanvas(
      frames[currentFrameIndex],
      layers,
      width,
      height,
    );
    return canvas.toDataURL("image/png");
  };

  const handleApplyAIImage = async (base64: string) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      recordHistory();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      const newGrid = createEmptyGrid(width, height);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a > 50) {
            const hex =
              "#" +
              ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
            newGrid[y][x] = hex;
          } else {
            newGrid[y][x] = null;
          }
        }
      }
      updateActiveLayerPixels(activeLayerId, newGrid);
    };
  };

  const saveProject = () => {
    const projectData = {
      version: "1.0",
      width,
      height,
      fps,
      layers,
      frames,
      activeLayerId,
      savedSelections,
      palettes,
      activePaletteId,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `project_${Date.now()}.json`;
    link.click();
  };

  const loadProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const data = JSON.parse(evt.target?.result as string);
        // Basic validation
        if (data.width && data.height && data.frames && data.layers) {
          setWidth(data.width);
          setHeight(data.height);
          setFps(data.fps || 12);
          setLayers(data.layers);
          setFrames(data.frames);

          // Ensure active layer exists
          const activeExists = data.layers.find(
            (l: Layer) => l.id === data.activeLayerId,
          );
          setActiveLayerId(
            activeExists ? data.activeLayerId : data.layers[0].id,
          );

          if (data.savedSelections) {
            setSavedSelections(data.savedSelections);
          }

          // Load palettes if available
          if (data.palettes && Array.isArray(data.palettes)) {
            setPalettes(data.palettes);
            if (data.activePaletteId) {
              setActivePaletteId(data.activePaletteId);
            }
          }

          setCurrentFrameIndex(0);
          // Clear history on new project load
          setPast([]);
          setFuture([]);
          alert("Project loaded successfully!");
        } else {
          alert("Invalid project file format.");
        }
      } catch (err) {
        console.error(err);
        alert("Failed to load project.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImportSpritesheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const img = new Image();
      img.onload = () => {
        recordHistory();
        const cols = Math.floor(img.width / width);
        const rows = Math.floor(img.height / height);
        const newFrames: Frame[] = [];

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const importLayerId = "layer-import";
        setLayers([
          {
            id: importLayerId,
            name: "Imported",
            visible: true,
            locked: false,
            opacity: 1.0,
          },
        ]);
        setActiveLayerId(importLayerId);

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.clearRect(0, 0, width, height);
            ctx.drawImage(
              img,
              c * width,
              r * height,
              width,
              height,
              0,
              0,
              width,
              height,
            );

            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            const grid = createEmptyGrid(width, height);

            let hasContent = false;
            for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                const i = (y * width + x) * 4;
                if (data[i + 3] > 0) {
                  const hex =
                    "#" +
                    (
                      (1 << 24) +
                      (data[i] << 16) +
                      (data[i + 1] << 8) +
                      data[i + 2]
                    )
                      .toString(16)
                      .slice(1);
                  grid[y][x] = hex;
                  hasContent = true;
                }
              }
            }

            if (hasContent) {
              newFrames.push({
                id: Date.now().toString() + Math.random(),
                layers: { [importLayerId]: grid },
                delay: 100,
              });
            }
          }
        }

        if (newFrames.length > 0) {
          setFrames(newFrames);
          setCurrentFrameIndex(0);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 text-white font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-gray-800 bg-gray-900 flex items-center px-4 justify-between z-20 shrink-0 relative">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded flex items-center justify-center font-bold text-sm">
              P
            </div>
            <h1 className="font-pixel text-sm tracking-wide text-gray-200 hidden md:block">
              PixelForge <span className="text-indigo-400">AI</span>
            </h1>
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2"></div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={performUndo}
              disabled={past.length === 0}
              className={`p-1.5 rounded ${past.length === 0 ? "text-gray-600" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              title="Undo (Ctrl+Z)"
            >
              <Undo size={16} />
            </button>
            <button
              type="button"
              onClick={performRedo}
              disabled={future.length === 0}
              className={`p-1.5 rounded ${future.length === 0 ? "text-gray-600" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              title="Redo (Ctrl+Y)"
            >
              <Redo size={16} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2"></div>

          {/* Grid Generator / Resize */}
          <div className="flex items-center gap-2 bg-gray-800 p-1 rounded border border-gray-700">
            <span className="text-xs text-gray-400 px-1">Size</span>
            <input
              title="Width"
              type="number"
              value={width}
              onChange={e => handleResize(Number(e.target.value), height)}
              className="w-10 bg-gray-900 border border-gray-600 rounded text-xs px-1 text-center text-white"
            />
            <span className="text-xs text-gray-500">x</span>
            <input
              title="Height"
              type="number"
              value={height}
              onChange={e => handleResize(width, Number(e.target.value))}
              className="w-10 bg-gray-900 border border-gray-600 rounded text-xs px-1 text-center text-white"
            />
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2"></div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-gray-800 p-1 rounded border border-gray-700">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 1))}
              className="p-1 text-gray-400 hover:text-white"
            >
              <ZoomOut size={14} />
            </button>
            <input
              type="range"
              min="1"
              max="64"
              value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="w-20 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-gray-300 w-8 text-center">
              {zoom}x
            </span>
            <button
              onClick={() => setZoom(Math.min(64, zoom + 1))}
              className="p-1 text-gray-400 hover:text-white"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2"></div>

          {/* Transform & Adjustments */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowAdjustments(!showAdjustments)}
              className={`p-1.5 rounded ${showAdjustments ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
              title="Adjustments"
            >
              <Sliders size={16} />
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              title="Flip Horizontal"
            >
              <FlipHorizontal size={16} />
            </button>
            <button
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
              title="Clone to All Frames"
            >
              <Copy size={16} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-700 mx-2"></div>

          {/* Grid Settings */}
          <SettingsPanel
            gridVisible={gridVisible}
            setGridVisible={setGridVisible}
            gridSize={gridSize}
            setGridSize={setGridSize}
            gridColor={gridColor}
            setGridColor={setGridColor}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Load Selection Dropdown (Only if saved selections exist) */}
          {Object.keys(savedSelections).length > 0 && (
            <div className="relative group">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-gray-700 border border-gray-700"
              >
                <MousePointer2 size={14} /> Load Selection
              </button>
              <div className="absolute right-0 top-full mt-1 w-40 bg-gray-800 border border-gray-700 rounded shadow-lg hidden group-hover:block z-50">
                {Object.keys(savedSelections).map(name => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => loadSelection(name)}
                    className="block w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project Files Group */}
          <div className="flex items-center bg-gray-800 rounded p-1 gap-1 border border-gray-700">
            <label
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded cursor-pointer"
              title="Load Project"
            >
              <FolderOpen size={16} />
              <input
                title="Load Project"
                type="file"
                accept=".json"
                onChange={loadProject}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={saveProject}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded"
              title="Save Project"
            >
              <Save size={16} />
            </button>
          </div>

          {/* Import Group */}
          <label className="flex items-center gap-1 text-xs text-gray-400 hover:text-white cursor-pointer bg-gray-800 px-2 py-1.5 rounded hover:bg-gray-700 transition-colors border border-gray-700">
            <Upload size={14} /> Import Sheet
            <input
              type="file"
              accept="image/*"
              onChange={handleImportSpritesheet}
              className="hidden"
            />
          </label>

          <div className="h-4 w-px bg-gray-700 mx-1"></div>

          {/* Export Group */}
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1.5 rounded text-white font-medium transition-colors ml-1 shadow-lg shadow-indigo-900/40"
          >
            <Download size={14} /> Export
          </button>

          <div className="h-4 w-px bg-gray-700 mx-2"></div>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors"
            title="Settings"
          >
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Selection Control Bar */}
      {selectionMask && (
        <div className="bg-indigo-900/30 border-b border-indigo-500/30 h-10 flex items-center justify-center gap-4 px-4 z-10 animate-in slide-in-from-top duration-200">
          <span className="text-xs text-indigo-300 font-bold uppercase tracking-wider">
            Active Selection
          </span>

          <div className="h-4 w-px bg-indigo-500/30"></div>

          <button
            type="button"
            onClick={invertSelection}
            className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white hover:bg-indigo-500/30 px-2 py-1 rounded"
            title="Invert Selection"
          >
            <ArrowLeftRight size={12} /> Invert
          </button>
          <button
            type="button"
            onClick={expandSelection}
            className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white hover:bg-indigo-500/30 px-2 py-1 rounded"
            title="Expand (Feather)"
          >
            <Maximize2 size={12} /> Expand
          </button>
          <button
            type="button"
            onClick={contractSelection}
            className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white hover:bg-indigo-500/30 px-2 py-1 rounded"
            title="Contract (Shrink)"
          >
            <Minimize2 size={12} /> Contract
          </button>

          <div className="h-4 w-px bg-indigo-500/30"></div>

          <button
            type="button"
            onClick={saveSelection}
            className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white hover:bg-indigo-500/30 px-2 py-1 rounded"
            title="Save Selection"
          >
            <Save size={12} /> Save
          </button>

          <button
            type="button"
            onClick={() => setSelectionMask(null)}
            className="flex items-center gap-1 text-xs text-red-300 hover:text-red-100 hover:bg-red-500/20 px-2 py-1 rounded ml-auto"
            title="Clear Selection"
          >
            <X size={12} /> Clear
          </button>
        </div>
      )}

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Tools */}
        <Toolbar
          selectedTool={selectedTool}
          setTool={t => {
            setSelectedTool(t);
            if (t !== ToolType.MAGIC_WAND) setSelectionMask(null);
          }}
          primaryColor={primaryColor}
          setPrimaryColor={setPrimaryColor}
          secondaryColor={secondaryColor}
          setSecondaryColor={setSecondaryColor}
          onReplaceColor={handleReplaceColor}
        />

        {/* Canvas Area */}
        <div className="flex-1 relative bg-gray-800 overflow-hidden flex flex-col">
          <div className="flex-1 flex items-center justify-center overflow-auto p-10 checkerboard relative">
            <div
              className="shadow-2xl shadow-black relative transition-all duration-200"
              style={{ width: width * zoom, height: height * zoom }}
            >
              <EditorCanvas
                width={width}
                height={height}
                zoom={zoom}
                layers={layers}
                layerPixels={frames[currentFrameIndex].layers}
                activeLayerId={activeLayerId}
                onUpdateLayerPixels={updateActiveLayerPixels}
                selectedTool={selectedTool}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                gridVisible={gridVisible}
                gridSize={gridSize}
                gridColor={gridColor}
                setPrimaryColor={setPrimaryColor}
                selectionMask={selectionMask}
                setSelectionMask={setSelectionMask}
                onDrawStart={recordHistory}
                historyVersion={historyVersion}
              />
            </div>
          </div>

          {/* Animation Timeline */}
          <AnimationPanel
            frames={frames}
            layers={layers}
            currentFrameIndex={currentFrameIndex}
            setCurrentFrameIndex={setCurrentFrameIndex}
            addFrame={addFrame}
            deleteFrame={deleteFrame}
            duplicateFrame={duplicateFrame}
            isPlaying={isPlaying}
            togglePlay={() => setIsPlaying(!isPlaying)}
            fps={fps}
            setFps={setFps}
          />
        </div>

        {/* Resizer Handle */}
        <div
          className={`w-1 hover:bg-indigo-500 cursor-col-resize transition-colors flex items-center justify-center group z-10 ${isResizingSidebar ? "bg-indigo-600" : "bg-gray-800"}`}
          onMouseDown={startResizing}
        >
          <div className="h-8 w-0.5 bg-gray-600 group-hover:bg-indigo-300 rounded-full"></div>
        </div>

        {/* Right Sidebar (Layers, AI, Palettes) */}
        <div
          className="flex flex-col h-full bg-gray-900 border-l border-gray-750 shrink-0"
          style={{ width: rightSidebarWidth }}
        >
          {/* Tabs */}
          <div className="flex border-b border-gray-750 shrink-0">
            <button
              type="button"
              onClick={() => setActiveRightTab("layers")}
              className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors ${activeRightTab === "layers" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
              title="Layers"
            >
              <Layers size={16} />
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("ai")}
              className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors ${activeRightTab === "ai" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
              title="AI Studio"
            >
              <Sparkles size={16} />
            </button>
            <button
              type="button"
              onClick={() => setActiveRightTab("palettes")}
              className={`flex-1 p-3 flex items-center justify-center gap-2 text-sm font-medium hover:bg-gray-800 transition-colors ${activeRightTab === "palettes" ? "text-indigo-400 border-b-2 border-indigo-400" : "text-gray-400"}`}
              title="Palettes"
            >
              <PaletteIcon size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden relative">
            {activeRightTab === "layers" ? (
              <LayerPanel
                layers={layers}
                activeLayerId={activeLayerId}
                onAddLayer={handleAddLayer}
                onRemoveLayer={handleRemoveLayer}
                onSelectLayer={setActiveLayerId}
                onUpdateLayer={handleUpdateLayer}
                onMoveLayer={handleMoveLayer}
              />
            ) : activeRightTab === "ai" ? (
              <AIPanel
                onApplyImage={handleApplyAIImage}
                currentCanvasImage={getCompositeDataURL}
              />
            ) : (
              <PalettePanel
                palettes={palettes}
                activePaletteId={activePaletteId}
                onSelectPalette={setActivePaletteId}
                onCreatePalette={handleCreatePalette}
                onDeletePalette={handleDeletePalette}
                onUpdatePalette={handleUpdatePalette}
                primaryColor={primaryColor}
                setPrimaryColor={setPrimaryColor}
              />
            )}
          </div>
        </div>
      </div>
      <NetworkStatus />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        setApiKey={setApiKey}
        currentThemeId={currentThemeId}
        setCurrentThemeId={setCurrentThemeId}
        minimizeToTray={minimizeToTray}
        setMinimizeToTray={setMinimizeToTray}
        initialTab={settingsTab}
      />
      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExportGIF={(scale, fps, loop) => {
          createGif(frames, layers, width, height, fps, scale, loop ? 0 : 1);
          setShowExport(false);
        }}
        onExportSpritesheet={(cols, padding, format) => {
          createSpriteSheet(
            frames,
            layers,
            width,
            height,
            cols,
            padding,
            format,
          );
          setShowExport(false);
        }}
        onExportFrame={() => {
          framesToDataURL(
            [frames[currentFrameIndex]],
            layers,
            width,
            height,
          ).then((urls: string[]) => {
            if (urls[0]) {
              downloadBlob(urls[0], `frame-${currentFrameIndex}.png`);
            }
          });
          setShowExport(false);
        }}
      />

      {showAdjustments && (
        <AdjustmentsPanel
          onClose={() => setShowAdjustments(false)}
          onApply={(b, c, g) => {
            // Placeholder for logic
            console.log("Adjustments:", b, c, g);
            setShowAdjustments(false);
          }}
        />
      )}
    </div>
  );
}

const AppWithErrorBoundary: React.FC = () => (
  <AppLoader>
    <App />
  </AppLoader>
);

export default AppWithErrorBoundary;
