import {
  ArrowLeftRight,
  Copy,
  FlipHorizontal,
  Maximize2,
  Minimize2,
  MousePointer2,
  Redo,
  Save,
  Sliders,
  Sparkles,
  Undo,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import AnimationPanel from "./components/AnimationPanel";
import AppLoader from "./components/AppLoader";
import ContextMenu from "./components/ContextMenu";
import CreateTemplateModal from "./components/CreateTemplateModal";
import EditorCanvas from "./components/EditorCanvas";
import ExportModal from "./components/ExportModal";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import MenuBar from "./components/MenuBar";
import NetworkStatus from "./components/NetworkStatus";
import PanelContainer from "./components/PanelContainer";
import SettingsModal from "./components/SettingsModal";
import SettingsPanel from "./components/SettingsPanel";
import StatusBar from "./components/StatusBar";
import TemplateEditor from "./components/TemplateEditor";
import Toolbar from "./components/Toolbar";
import TransformationModal from "./components/TransformationModal";
import { PANEL_REGISTRY } from "./config/panelRegistry";
import {
  createDefaultLayout,
  isPanelVisible,
  type LayoutState,
  loadPanelLayout,
  savePanelLayout,
  togglePanel,
} from "./systems/layoutManager";
import { transformLayer, type TransformOptions } from "./systems/transform";
import {
  createProjectFromTemplate,
  createTemplate,
  type ProjectTemplate,
} from "./templates/templateManager";
import {
  type Frame,
  type Layer,
  type Palette,
  SelectMode,
  ToolType,
} from "./types";
import {
  contractMask,
  createEmptyGrid,
  expandMask,
  invertMask,
  mergePixels,
  replaceColor,
} from "./utils/drawingUtils";
import {
  createGif,
  createSpriteSheet,
  downloadBlob,
  renderFrameToCanvas,
} from "./utils/exportUtils.ts";
import {
  getActionFromEvent,
  getHotkeys,
  type HotkeyMap,
} from "./utils/hotkeyUtils";
import { applyTheme, defaultTheme, themes } from "./utils/themeUtils";

// import isElectron from "is-electron";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [selectMode, setSelectMode] = useState<SelectMode>(SelectMode.BOX);
  const [wandTolerance, setWandTolerance] = useState(32);
  const [primaryColor, setPrimaryColor] = useState("#ffffff");
  const [secondaryColor, setSecondaryColor] = useState("#000000");
  const [cursorPos, setCursorPos] = useState<{
    x: number | null;
    y: number | null;
  }>({ x: null, y: null });

  const [fps, setFps] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- Modals ---
  const [showExport, setShowExport] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<
    "general" | "themes" | "api" | "plugins" | "about" | "repo" | "hotkeys"
  >("general");
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showTransformModal, setShowTransformModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);

  // --- Panels ---
  const [activeRightTab, setActiveRightTab] = useState<
    "layers" | "ai" | "palettes"
  >("layers");

  const [gridVisible, setGridVisible] = useState(true);
  const [gridSize, setGridSize] = useState(1);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

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

  // Settings State
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

  const [hotkeys, setHotkeys] = useState<HotkeyMap>(getHotkeys());

  const onZoomChange = (newZoom: number | ((prev: number) => number)) => {
    if (typeof newZoom === "function") {
      setZoom(prev => {
        const res = newZoom(prev);
        return Math.max(1, Math.min(64, res));
      });
    } else {
      setZoom(Math.max(1, Math.min(64, newZoom)));
    }
  };

  // Panel Layout State
  const [panelLayout, setPanelLayout] = useState<LayoutState>(() => {
    const saved = loadPanelLayout();
    return saved || createDefaultLayout(PANEL_REGISTRY);
  });

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

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem("pf_apiKey", apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem("pf_themeId", currentThemeId);
    const theme = themes.find(t => t.id === currentThemeId) || defaultTheme;
    applyTheme(theme);
  }, [currentThemeId]);

  useEffect(() => {
    localStorage.setItem("pf_minimizeToTray", String(minimizeToTray));
  }, [minimizeToTray]);

  useEffect(() => {
    savePanelLayout(panelLayout);
  }, [panelLayout]);

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

  // --- Helpers ---

  // Updates the pixels of the SPECIFIC layer in the CURRENT frame
  const updateActiveLayerPixels = useCallback(
    (layerId: string, newPixels: (string | null)[][]) => {
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
    },
    [currentFrameIndex],
  );

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

  // --- Project Actions ---
  const handleNewProject = () => {
    setShowNewProjectModal(true);
  };

  const handleCreateFromTemplate = (template: ProjectTemplate) => {
    if (
      confirm(
        "Are you sure you want to create a new project? Unsaved changes will be lost.",
      )
    ) {
      const {
        width: newW,
        height: newH,
        fps: newFps,
        layers: newLayers,
        frames: newFrames,
      } = createProjectFromTemplate(template);

      setWidth(newW);
      setHeight(newH);
      setFps(newFps);
      setLayers(newLayers);
      setFrames(newFrames);
      setActiveLayerId(newLayers[0].id);
      setCurrentFrameIndex(0);
      setPast([]);
      setFuture([]);
      setSelectionMask(null);
      setShowNewProjectModal(false);
    }
  };

  const handleSaveTemplate = (name: string, description: string) => {
    try {
      createTemplate({
        id: `tpl-${Date.now()}`,
        name,
        comment: description,
        width,
        height,
        fps,
        layers: layers.map(l => ({ ...l })), // Deep copy layers/frames if needed for safety
        frames: JSON.parse(JSON.stringify(frames)), // Deep copy frames to avoid ref issues
        fillWith: "Transparency", // Default for now
      });
      alert(`Template "${name}" saved successfully!`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to save template");
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = currentThemeId === "light" ? "default" : "light";
    setCurrentThemeId(nextTheme);
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

  const handleApplyTransform = (options: TransformOptions) => {
    recordHistory();
    const currentFrame = frames[currentFrameIndex];
    const currentLayerGrid = currentFrame.layers[activeLayerId];
    const layerObj = layers.find(l => l.id === activeLayerId);

    if (currentLayerGrid && layerObj) {
      const newGrid = transformLayer(currentLayerGrid, options, width, height);
      updateActiveLayerPixels(activeLayerId, newGrid);
    }
    setShowTransformModal(false);
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

  const handleMergeDown = (layerId: string) => {
    const layerIndex = layers.findIndex(l => l.id === layerId);
    if (layerIndex <= 0) return; // Cannot merge bottom layer

    const topLayer = layers[layerIndex];
    if (!topLayer) return;
    const belowLayer = layers[layerIndex - 1];

    // History
    const current = {
      width,
      height,
      frames,
      layers,
      activeLayerId,
      currentFrameIndex,
      selectionMask,
    };
    setPast(prev => [...prev, current]);
    setFuture([]);

    // For ALL frames, merge pixels
    const newFrames = frames.map(frame => {
      const topPixels = frame.layers[topLayer.id];
      const belowPixels = frame.layers[belowLayer.id];
      if (!topPixels || !belowPixels) return frame;

      const merged = mergePixels(belowPixels, topPixels, 0, 0, width, height);

      const newLayers = { ...frame.layers };
      newLayers[belowLayer.id] = merged;
      delete newLayers[topLayer.id];

      return { ...frame, layers: newLayers };
    });

    setFrames(newFrames);
    setLayers(prev => prev.filter(l => l.id !== topLayer.id));
    setActiveLayerId(belowLayer.id);
    setHistoryVersion(v => v + 1);
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

  const invertSelection = useCallback(() => {
    if (!selectionMask) return;
    recordHistory();
    setSelectionMask(invertMask(selectionMask));
  }, [selectionMask, recordHistory]);

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
    const name = `Selection ${Object.keys(savedSelections).length + 1}`;
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
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

  const saveProject = useCallback(() => {
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
  }, [
    width,
    height,
    fps,
    layers,
    frames,
    activeLayerId,
    savedSelections,
    palettes,
    activePaletteId,
  ]);

  // --- Panel Management ---
  const handleTogglePanel = useCallback((panelId: string) => {
    setPanelLayout(prev => togglePanel(prev, panelId));
  }, []);

  // TODO: Will be used when integrating PanelContainer
  // const handleFloatPanel = useCallback((panelId: string) => {
  //   setPanelLayout(prev =>
  //     updatePanelState(prev, panelId, { position: "floating" }),
  //   );
  // }, []);

  // const handleDockPanel = useCallback((panelId: string) => {
  //   setPanelLayout(prev => {
  //     const panel = PANEL_REGISTRY.find(p => p.id === panelId);
  //     if (!panel) return prev;
  //     return updatePanelState(prev, panelId, {
  //       position: panel.defaultPosition,
  //     });
  //   });
  // }, []);

  const handleResetLayout = useCallback(() => {
    setPanelLayout(createDefaultLayout(PANEL_REGISTRY));
  }, []);

  const handleImportSpritesheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      const img = new Image();
      img.onload = () => {
        // Auto-scale if canvas is at default size (32x32) or user explicitly requests it (future feature).
        // For now, if it matches default dimensions, we assume it's a fresh project and resize.
        if (width === 32 && height === 32) {
          const newW = img.width;
          const newH = img.height;
          setWidth(newW);
          setHeight(newH);
        }

        recordHistory();
        // cols/rows removed, using effectiveCols/effectiveRows

        // If we resized, width/height might not have updated in this closure yet?
        // Actually, state updates are async.
        // We should use the values we JUST set if we entered the block.
        const effectiveWidth =
          width === 32 && height === 32 ? img.width : width;
        const effectiveHeight =
          width === 32 && height === 32 ? img.height : height;

        const effectiveCols = Math.floor(img.width / effectiveWidth);
        const effectiveRows = Math.floor(img.height / effectiveHeight);

        const newFrames: Frame[] = [];

        const canvas = document.createElement("canvas");
        canvas.width = effectiveWidth;
        canvas.height = effectiveHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const importLayerId = "layer-import";
        // If we resized, maybe we should wipe existing layers?
        // Or just add new one.
        // existing logic adds new layer.

        setLayers(prev => [
          ...prev,
          {
            id: importLayerId,
            name: "Imported",
            visible: true,
            locked: false,
            opacity: 1.0,
          },
        ]);
        setActiveLayerId(importLayerId);

        for (let r = 0; r < effectiveRows; r++) {
          for (let c = 0; c < effectiveCols; c++) {
            ctx.clearRect(0, 0, effectiveWidth, effectiveHeight);
            ctx.drawImage(
              img,
              c * effectiveWidth,
              r * effectiveHeight,
              effectiveWidth,
              effectiveHeight,
              0,
              0,
              effectiveWidth,
              effectiveHeight,
            );

            const imageData = ctx.getImageData(
              0,
              0,
              effectiveWidth,
              effectiveHeight,
            );
            const data = imageData.data;
            const grid = createEmptyGrid(effectiveWidth, effectiveHeight);

            let hasContent = false;
            for (let y = 0; y < effectiveHeight; y++) {
              for (let x = 0; x < effectiveWidth; x++) {
                const i = (y * effectiveWidth + x) * 4;
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

            if (hasContent || (effectiveCols === 1 && effectiveRows === 1)) {
              // Always add if single frame, even if empty?
              newFrames.push({
                id: Date.now().toString() + Math.random(),
                layers: { [importLayerId]: grid },
                delay: 100,
              });
            }
          }
        }

        if (newFrames.length > 0) {
          // If we are replacing the project (resized), maybe replace frames?
          // If we resized, we should probably RESET frames to these new ones.
          if (width === 32 && height === 32) {
            setFrames(newFrames);
          } else {
            setFrames(prev => [...prev, ...newFrames]);
          }
          setCurrentFrameIndex(0);
        }
      };
      img.src = evt.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const action = getActionFromEvent(e, hotkeys);
      if (!action) return;

      e.preventDefault();

      switch (action) {
        case "UNDO":
          performUndo();
          break;
        case "REDO":
          performRedo();
          break;
        case "SAVE":
          saveProject();
          break;
        case "EXPORT":
          setShowExport(true);
          break;
        case "TOOL_PENCIL":
          setSelectedTool(ToolType.PENCIL);
          break;
        case "TOOL_ERASER":
          setSelectedTool(ToolType.ERASER);
          break;
        case "TOOL_BUCKET":
          setSelectedTool(ToolType.BUCKET);
          break;
        case "TOOL_PICKER":
          setSelectedTool(ToolType.PICKER);
          break;
        case "TOOL_SELECT":
          setSelectedTool(ToolType.SELECT);
          break;
        case "TOOL_WAND":
          setSelectedTool(ToolType.MAGIC_WAND);
          break;
        case "TOOL_LASSO":
          setSelectedTool(ToolType.LASSO);
          break;
        case "TOOL_MOVE":
          setSelectedTool(ToolType.MOVE);
          break;
        case "TOOL_TRANSFORM":
          setShowTransformModal(true);
          // setSelectedTool(ToolType.TRANSFORM);
          break;
        case "TOOL_HAND":
          setSelectedTool(ToolType.HAND);
          break;
        case "ZOOM_IN":
          setZoom(z => Math.min(64, z + 1));
          break;
        case "ZOOM_OUT":
          setZoom(z => Math.max(1, z - 1));
          break;
        case "TOGGLE_GRID":
          setGridVisible(v => !v);
          break;
        case "INVERT_SELECTION":
          invertSelection();
          break;
        case "DELETE_SELECTION":
          if (selectionMask) {
            const currentFrame = frames[currentFrameIndex];
            const layerGrid = currentFrame.layers[activeLayerId];
            if (layerGrid) {
              // Create new grid with selected pixels cleared
              const newGrid = layerGrid.map((row, y) =>
                row.map((cell, x) => (selectionMask[y][x] ? null : cell)),
              );
              updateActiveLayerPixels(activeLayerId, newGrid);
            }
          }
          break;
        case "DESELECT":
          setSelectionMask(null);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    performUndo,
    performRedo,
    hotkeys,
    invertSelection,
    saveProject,
    activeLayerId,
    currentFrameIndex,
    frames[currentFrameIndex],
    selectionMask,
    updateActiveLayerPixels,
  ]);

  return (
    <div
      role="application"
      aria-label="PixelForge AI Studio"
      className="flex flex-col h-screen bg-gray-950 text-white font-sans"
      onDragOver={e => e.preventDefault()}
      onDrop={e => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;

        if (file.name.endsWith(".json")) {
          const reader = new FileReader();
          reader.onload = evt => {
            try {
              const json = JSON.parse(evt.target?.result as string);
              // Basic validation
              if (json.width && json.height && json.frames && json.layers) {
                if (
                  confirm(
                    "Load project from " +
                      file.name +
                      "? Unsaved changes will be lost.",
                  )
                ) {
                  setWidth(json.width);
                  setHeight(json.height);
                  setFrames(json.frames);
                  setLayers(json.layers);
                  setActiveLayerId(json.activeLayerId || json.layers[0]?.id);
                  setCurrentFrameIndex(0);
                }
              }
            } catch {
              alert("Invalid project file");
            }
          };
          reader.readAsText(file);
        } else if (file.type.startsWith("image/")) {
          // Cast to unknown first to avoid "EventTarget is not ... InputElement" constraint issues if we just cast to ChangeEvent
          handleImportSpritesheet({
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>);
        }
      }}
    >
      <MenuBar
        onNew={handleNewProject}
        onOpen={() => fileInputRef.current?.click()}
        onSave={saveProject}
        onExport={() => setShowExport(true)}
        onUndo={performUndo}
        onRedo={performRedo}
        onCut={() => {}}
        onCopy={() => {}}
        onPaste={() => {}}
        onPreference={() => {
          setSettingsTab("general");
          setIsSettingsOpen(true);
        }}
        onCreateTemplate={() => setShowCreateTemplateModal(true)}
        onZoomIn={() => onZoomChange(z => Math.min(64, z + 1))}
        onZoomOut={() => onZoomChange(z => Math.max(1, z - 1))}
        onFitScreen={() => {
          const fitW = Math.floor(window.innerWidth / width);
          const fitH = Math.floor(window.innerHeight / height);
          onZoomChange(Math.max(1, Math.min(fitW, fitH, 64)));
        }}
        onToggleGrid={() => setGridVisible(v => !v)}
        gridVisible={gridVisible}
        onToggleTheme={handleToggleTheme}
        isDarkTheme={currentThemeId !== "light"}
        panels={PANEL_REGISTRY.map(panel => ({
          id: panel.id,
          label: panel.title,
          visible: isPanelVisible(panelLayout, panel.id),
        }))}
        onTogglePanel={handleTogglePanel}
        onResetLayout={handleResetLayout}
      />
      <Header
        left={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 flex items-center justify-center font-bold text-sm ">
              <button
                type="button"
                onClick={() => {
                  setSettingsTab("about");
                  setIsSettingsOpen(true);
                }}
                className="w-full h-full flex items-center justify-center cursor-pointer transition-colors"
              >
                <img
                  src={"favicon.png"}
                  alt="Logo"
                  title="PixelForge"
                  aria-label="PixelForge"
                  className="w-full h-full object-contain border border-gray-800 shadow-lg hover:bg-indigo-600 hover:text-white transition-colors hover:border-indigo-600"
                />
              </button>
            </div>
            <span className="font-bold text-gray-100 hidden sm:block">
              PixelForge
            </span>
          </div>
        }
        center={
          <>
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
            <div className="h-4 w-px bg-gray-700 mx-2" />
            <div className="h-4 w-px bg-gray-700 mx-2" />

            {/* Grid Settings */}
            <SettingsPanel
              gridVisible={gridVisible}
              setGridVisible={setGridVisible}
              gridSize={gridSize}
              setGridSize={setGridSize}
              gridColor={gridColor}
              setGridColor={setGridColor}
              idPrefix="header-"
            />
            <div className="h-4 w-px bg-gray-700 mx-2" />

            {/* Resize */}
            <div className="flex items-center gap-2 bg-gray-800 p-0.5 rounded border border-gray-700">
              <input
                title="Width"
                type="number"
                value={width}
                onChange={e => handleResize(Number(e.target.value), height)}
                className="w-16 bg-gray-900 border border-gray-600 rounded text-xs px-1 text-center text-white focus:border-indigo-500 focus:outline-none"
              />
              <span className="text-xs text-gray-500">x</span>
              <input
                title="Height"
                type="number"
                value={height}
                onChange={e => handleResize(width, Number(e.target.value))}
                className="w-16 bg-gray-900 border border-gray-600 rounded text-xs px-1 text-center text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="h-4 w-px bg-gray-700 mx-2" />

            {/* Zoom */}
            <div className="flex items-center gap-1 bg-gray-800 p-0.5 rounded border border-gray-700">
              <button
                title="Zoom Out (Ctrl+-)"
                type="button"
                onClick={() => setZoom(Math.max(1, zoom - 1))}
                className="p-1 text-gray-400 hover:text-white"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-xs text-gray-300 w-6 text-center">
                {zoom}x
              </span>
              <button
                title="Zoom In (Ctrl++)"
                type="button"
                onClick={() => setZoom(Math.min(64, zoom + 1))}
                className="p-1 text-gray-400 hover:text-white"
              >
                <ZoomIn size={14} />
              </button>
            </div>
          </>
        }
        right={
          <>
            <div className="flex bg-gray-800 rounded p-0.5 border border-gray-700">
              <button
                title="Layers"
                type="button"
                className={`px-3 py-1 text-xs rounded ${activeRightTab === "layers" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveRightTab("layers")}
              >
                Layers
              </button>
              <button
                title="Palettes"
                type="button"
                className={`px-3 py-1 text-xs rounded ${activeRightTab === "palettes" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveRightTab("palettes")}
              >
                Palettes
              </button>
              <button
                title="AI"
                type="button"
                className={`px-3 py-1 text-xs rounded flex items-center gap-1.5 ${activeRightTab === "ai" ? "bg-indigo-600 text-white shadow-sm" : "text-gray-400 hover:text-white"}`}
                onClick={() => setActiveRightTab("ai")}
              >
                <Sparkles size={10} />
                <span>AI</span>
              </button>
            </div>

            {/* Load Selection Dropdown */}
            {Object.keys(savedSelections).length > 0 && (
              <div className="relative group mx-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white px-2 py-1.5 rounded hover:bg-gray-700 border border-gray-700"
                >
                  <MousePointer2 size={14} />
                  <span className="hidden sm:inline">Load Select</span>
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
            {/* Project/File Ops moved to Menubar */}
          </>
        }
      />

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
        {/* Left Toolbar */}
        <Sidebar className="w-16 shrink-0">
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
            selectMode={selectMode}
            setSelectMode={setSelectMode}
            wandTolerance={wandTolerance}
            setWandTolerance={setWandTolerance}
          />
          <div className="w-10 h-px bg-gray-700 my-2" />
          <button
            type="button"
            onClick={() => handleTogglePanel("adjustments")}
            className={`p-1.5 rounded ${isPanelVisible(panelLayout, "adjustments") ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white hover:bg-gray-800"}`}
            title="Adjustments"
          >
            <Sliders size={20} />
          </button>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
            title="Flip Horizontal"
          >
            <FlipHorizontal size={20} />
          </button>
          <button
            type="button"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded"
            title="Clone to All Frames"
          >
            <Copy size={20} />
          </button>
        </Sidebar>

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
                onZoomChange={setZoom}
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
                selectMode={selectMode}
                wandTolerance={wandTolerance}
                selectionMask={selectionMask}
                setSelectionMask={setSelectionMask}
                onDrawStart={recordHistory}
                historyVersion={historyVersion}
                onContextMenu={e => {
                  e.preventDefault();
                  setContextMenu({ x: e.clientX, y: e.clientY });
                }}
                onCursorMove={(x, y) => setCursorPos({ x, y })}
              />

              {contextMenu && (
                <ContextMenu
                  x={contextMenu.x}
                  y={contextMenu.y}
                  onClose={() => setContextMenu(null)}
                  items={[
                    {
                      label: "Undo",
                      action: performUndo,
                      shortcut: "Ctrl+Z",
                      disabled: future.length === 0,
                    }, // Checking history usually inverse
                    {
                      label: "Redo",
                      action: performRedo,
                      shortcut: "Ctrl+Y",
                      disabled: future.length === 0,
                    },
                    { separator: true, label: "" },
                    {
                      label: "Cut",
                      action: () => {
                        /* Implement Cut */
                      },
                      shortcut: "Ctrl+X",
                      disabled: true,
                    },
                    {
                      label: "Copy",
                      action: () => {
                        /* Implement Copy */
                      },
                      shortcut: "Ctrl+C",
                      disabled: true,
                    },
                    {
                      label: "Paste",
                      action: () => {
                        /* Implement Paste */
                      },
                      shortcut: "Ctrl+V",
                      disabled: true,
                    },
                    { separator: true, label: "" },
                    { label: "Invert Selection", action: invertSelection },
                    {
                      label: "Remove Background",
                      action: () => {
                        // Simple logic: Clear transparent pixels? Or use magic wand on corner?
                        // For now, let's just create a placeholder action or clear the layer
                        alert(
                          "Background removal requires advanced logic (magic wand). WIP.",
                        );
                      },
                    },
                  ]}
                />
              )}
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
            idPrefix="main-"
          />
          <StatusBar
            cursorX={cursorPos.x}
            cursorY={cursorPos.y}
            width={width}
            height={height}
            zoom={zoom}
          />
        </div>

        {/* Panel Container - Replaces hardcoded sidebar */}
        <PanelContainer
          layout={panelLayout}
          panels={PANEL_REGISTRY.map(panel => ({
            ...panel,
            props:
              panel.id === "layers"
                ? {
                    layers,
                    activeLayerId,
                    onAddLayer: handleAddLayer,
                    onRemoveLayer: handleRemoveLayer,
                    onSelectLayer: setActiveLayerId,
                    onUpdateLayer: handleUpdateLayer,
                    onMoveLayer: handleMoveLayer,
                    onMergeLayer: handleMergeDown,
                  }
                : panel.id === "palettes"
                  ? {
                      palettes,
                      activePaletteId,
                      onSelectPalette: setActivePaletteId,
                      onCreatePalette: handleCreatePalette,
                      onDeletePalette: handleDeletePalette,
                      onUpdatePalette: handleUpdatePalette,
                      primaryColor,
                      setPrimaryColor,
                    }
                  : panel.id === "ai"
                    ? {
                        onApplyImage: handleApplyAIImage,
                        currentCanvasImage: getCompositeDataURL,
                      }
                    : panel.id === "animation"
                      ? {
                          frames,
                          layers,
                          currentFrameIndex,
                          setCurrentFrameIndex,
                          addFrame,
                          deleteFrame,
                          duplicateFrame,
                          isPlaying,
                          togglePlay: () => setIsPlaying(!isPlaying),
                          fps,
                          setFps,
                          idPrefix: "panel-",
                        }
                      : panel.id === "adjustments"
                        ? {
                            onApply: (b: number, c: number, g: number) => {
                              console.log("Adjustments applied:", b, c, g);
                              // TODO: Implement actual image adjustment logic here
                              handleTogglePanel("adjustments");
                            },
                            onClose: () => handleTogglePanel("adjustments"),
                          }
                        : panel.id === "settings"
                          ? {
                              gridVisible,
                              setGridVisible,
                              gridSize,
                              setGridSize,
                              gridColor,
                              setGridColor,
                              idPrefix: "panel-",
                            }
                          : {},
          }))}
          onTogglePanel={handleTogglePanel}
        />
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
        hotkeys={hotkeys}
        setHotkeys={setHotkeys}
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
        onExportFrame={(scale, format) => {
          const canvas = renderFrameToCanvas(
            frames[currentFrameIndex],
            layers,
            width,
            height,
            scale,
          );
          const url = canvas.toDataURL(`image/${format}`);
          downloadBlob(url, `frame-${currentFrameIndex + 1}.${format}`);
          setShowExport(false);
        }}
      />

      {showNewProjectModal && (
        <TemplateEditor
          onSelect={handleCreateFromTemplate}
          onCancel={() => setShowNewProjectModal(false)}
        />
      )}

      <TransformationModal
        isOpen={showTransformModal}
        onClose={() => setShowTransformModal(false)}
        onApply={handleApplyTransform}
      />

      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}

const AppWithErrorBoundary: React.FC = () => (
  <AppLoader>
    <App />
  </AppLoader>
);

export default AppWithErrorBoundary;
