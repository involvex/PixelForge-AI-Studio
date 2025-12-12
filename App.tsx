import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import CreateTemplateModal from "./components/CreateTemplateModal.tsx";
import ExportModal from "./components/ExportModal.tsx";
import MainDockLayout, {
  type MainDockLayoutHandle,
} from "./components/MainDockLayout.tsx";
import MenuBar from "./components/MenuBar.tsx";
import NetworkStatus from "./components/NetworkStatus.tsx";
import SettingsModal from "./components/SettingsModal.tsx";
import TemplateEditor from "./components/TemplateEditor.tsx";
import TransformationModal from "./components/TransformationModal.tsx";
import WelcomeModal from "./components/WelcomeModal.tsx";

import { type HistoryState, useHistory } from "./systems/history.ts";
import { type TransformOptions, transformLayer } from "./systems/transform.ts";
import {
  createProjectFromTemplate,
  createTemplate,
  type ProjectTemplate,
} from "./templates/templateManager.ts";
import {
  type Frame,
  type Layer,
  type Palette,
  SelectMode,
  ToolType,
} from "./types.ts";
import { createEmptyGrid, mergePixels } from "./utils/drawingUtils.ts";
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
} from "./utils/hotkeyUtils.ts";
import { logger } from "./utils/logger.ts";
import { applyTheme, defaultTheme, themes } from "./utils/themeUtils.ts";

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

function App() {
  // Use a ref to track initial mount for logging
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      logger.info("PxelForge Application Mounted");
      mountedRef.current = true;
    }
  }, []);

  // --- State ---
  const [projectVersion, setProjectVersion] = useState(0);
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
      id: "frame-1",
      layers: {
        [initialLayerId]: createEmptyGrid(DEFAULT_SIZE, DEFAULT_SIZE),
      },
      delay: 100,
    },
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  // Tools & Selection
  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.PENCIL);

  // Debug tool selection state changes
  useEffect(() => {
    console.log("[APP] selectedTool changed:", selectedTool);
  }, [selectedTool]);
  const [primaryColor, setPrimaryColor] = useState<string>("#000000");
  const [secondaryColor, setSecondaryColor] = useState<string>("#FFFFFF");
  const [selectionMask, setSelectionMask] = useState<boolean[][] | null>(null);
  const [selectMode, setSelectMode] = useState<SelectMode>(SelectMode.BOX);
  const [wandTolerance, setWandTolerance] = useState<number>(0);

  // Palettes
  const [palettes, setPalettes] = useState<Palette[]>([DEFAULT_PALETTE]);
  const [activePaletteId, setActivePaletteId] = useState<string>(
    DEFAULT_PALETTE.id,
  );

  // Animation
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(12);

  // UI State
  const [showExport, setShowExport] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showTransformModal, setShowTransformModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [welcomeModalOpen, setWelcomeModalOpen] = useState(true);

  const [gridVisible, setGridVisible] = useState(true);

  const [apiKey, setApiKey] = useState("");
  const [currentThemeId, setCurrentThemeId] = useState(defaultTheme.id);
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [hotkeys, setHotkeys] = useState<HotkeyMap>(() => {
    const loadedHotkeys = getHotkeys();
    console.log("[APP] Initial hotkeys loaded:", loadedHotkeys);
    return loadedHotkeys;
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Define zoom handlers first to avoid circular dependency
  const handleZoomIn = () => {
    console.log("[ZOOM] handleZoomIn called");
    setZoom(prev => {
      const newZoom = Math.min(prev * 1.2, 5);
      console.log("[ZOOM] Zooming in from", prev, "to", newZoom);
      return newZoom;
    });
  };
  const handleZoomOut = () => {
    console.log("[ZOOM] handleZoomOut called");
    setZoom(prev => {
      const newZoom = Math.max(prev / 1.2, 0.1);
      console.log("[ZOOM] Zooming out from", prev, "to", newZoom);
      return newZoom;
    });
  };

  // Handlers
  const { recordHistory, performUndo, performRedo, historyVersion } =
    useHistory({
      frames,
      layers,
      width,
      height,
      activeLayerId,
      currentFrameIndex,
      selectionMask,
      onUndoRedo: (state: HistoryState) => {
        setFrames(state.frames);
        setLayers(state.layers);
        setWidth(state.width);
        setHeight(state.height);
        setActiveLayerId(state.activeLayerId);
        setCurrentFrameIndex(state.currentFrameIndex);
        setSelectionMask(state.selectionMask);
      },
    });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const openFileInputRef = useRef<HTMLInputElement>(null); // New ref for "Open File"
  const importLayerInputRef = useRef<HTMLInputElement>(null);
  const mainDockLayoutRef = useRef<MainDockLayoutHandle>(null);
  const [visiblePanels, setVisiblePanels] = useState<string[]>([]);

  // --- Effects ---
  // Handle theme application
  useEffect(() => {
    const theme = themes.find(t => t.id === currentThemeId) || themes[0];
    applyTheme(theme);
  }, [currentThemeId]);

  // Handle Delete Selection - clears pixels in selection mask
  const handleDeleteSelection = useCallback(() => {
    if (!selectionMask) return;
    recordHistory();
    const currentPixels = frames[currentFrameIndex]?.layers[activeLayerId];
    if (!currentPixels) return;

    const newPixels = currentPixels.map((row, y) =>
      row.map((pixel, x) => (selectionMask[y]?.[x] ? null : pixel)),
    );
    updateActiveLayerPixels(activeLayerId, newPixels);
  }, [selectionMask, recordHistory, frames, currentFrameIndex, activeLayerId]);

  // Handle Select All - selects entire canvas
  const handleSelectAll = useCallback(() => {
    console.log(
      "[HOTKEY] SELECT_ALL triggered, creating mask for",
      width,
      "x",
      height,
    );
    // Create a proper 2D boolean array - each row must be a unique array
    const mask: boolean[][] = [];
    for (let y = 0; y < height; y++) {
      const row: boolean[] = [];
      for (let x = 0; x < width; x++) {
        row.push(true);
      }
      mask.push(row);
    }
    console.log("[HOTKEY] Created selection mask:", mask.length, "rows");
    setSelectionMask(mask);
  }, [height, width, setSelectionMask]);

  // Handle Deselect - clears selection
  const handleDeselect = useCallback(() => {
    setSelectionMask(null);
  }, [setSelectionMask]);

  // Handle Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      console.log("[KEYDOWN] Key pressed:", {
        key: e.key,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
        shiftKey: e.shiftKey,
        altKey: e.altKey,
      });

      // Use the hotkey utility function
      const action = getActionFromEvent(e, hotkeys);

      console.log("[KEYDOWN] Action detected:", action);

      if (action) {
        e.preventDefault();
        e.stopPropagation();

        switch (action) {
          case "UNDO":
            performUndo();
            break;
          case "REDO":
            performRedo();
            break;
          case "ZOOM_IN":
            handleZoomIn();
            break;
          case "ZOOM_OUT":
            handleZoomOut();
            break;
          case "TOGGLE_GRID":
            setGridVisible(!gridVisible);
            break;
          // Selection actions
          case "DELETE_SELECTION":
            handleDeleteSelection();
            break;
          case "SELECT_ALL":
            handleSelectAll();
            break;
          case "DESELECT":
            handleDeselect();
            break;
          // Tool shortcuts
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
            setSelectedTool(ToolType.TRANSFORM);
            break;
          case "TOOL_HAND":
            setSelectedTool(ToolType.HAND);
            break;
          // File actions
          case "SAVE":
            handleSaveProject();
            break;
          case "EXPORT":
            setShowExport(true);
            break;
          default:
            console.log("Unhandled hotkey action:", action);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    performUndo,
    performRedo,
    hotkeys,
    handleZoomIn,
    handleZoomOut,
    gridVisible,
    setSelectedTool,
    handleDeleteSelection,
    handleSelectAll,
    handleDeselect,
  ]);

  // Helper: Update Active Layer Pixels
  const updateActiveLayerPixels = (
    layerId: string,
    newPixels: (string | null)[][],
  ) => {
    setFrames(prev => {
      const newFrames = [...prev];
      newFrames[currentFrameIndex] = {
        ...newFrames[currentFrameIndex],
        layers: {
          ...newFrames[currentFrameIndex].layers,
          [layerId]: newPixels,
        },
      };
      return newFrames;
    });
  };

  // --- Handlers (Simplified for brevity, ensuring core logic exists) ---
  const handleAddLayer = () => {
    const newId = `layer-${Date.now()}`;
    setLayers([
      {
        id: newId,
        name: `Layer ${layers.length + 1}`,
        visible: true,
        locked: false,
        opacity: 1,
      },
      ...layers,
    ]);
    // Initialize pixels for new layer in all frames
    setFrames(prev =>
      prev.map(f => ({
        ...f,
        layers: { ...f.layers, [newId]: createEmptyGrid(width, height) },
      })),
    );
    setActiveLayerId(newId);
  };

  const handleRemoveLayer = (id: string) => {
    if (layers.length <= 1) return;
    setLayers(prev => prev.filter(l => l.id !== id));
    setFrames(prev =>
      prev.map(f => {
        const newLayers = { ...f.layers };
        delete newLayers[id];
        return { ...f, layers: newLayers };
      }),
    );
    if (activeLayerId === id) {
      setActiveLayerId(layers.find(l => l.id !== id)?.id || "");
    }
  };

  const handleUpdateLayer = (id: string, updates: Partial<Layer>) => {
    setLayers(prev => prev.map(l => (l.id === id ? { ...l, ...updates } : l)));
  };

  const handleMoveLayer = (fromIndex: number, toIndex: number) => {
    const newLayers = [...layers];
    const [moved] = newLayers.splice(fromIndex, 1);
    newLayers.splice(toIndex, 0, moved);
    setLayers(newLayers);
  };

  const handleMergeDown = (id: string) => {
    const index = layers.findIndex(l => l.id === id);
    if (index >= layers.length - 1) return;

    const layerAbove = layers[index];
    const layerBelow = layers[index + 1];

    // Merge logic (simplified)
    setFrames(prev =>
      prev.map(f => {
        const pixelsAbove = f.layers[layerAbove.id];
        const pixelsBelow = f.layers[layerBelow.id];
        // Assume mergePixels util exists or implement simple merge
        const merged = mergePixels(
          pixelsBelow,
          pixelsAbove,
          0,
          0,
          width,
          height,
        );
        const newLayers = { ...f.layers };
        newLayers[layerBelow.id] = merged;
        delete newLayers[layerAbove.id];
        return { ...f, layers: newLayers };
      }),
    );

    setLayers(prev => prev.filter(l => l.id !== id));
    setActiveLayerId(layerBelow.id);
  };

  const handleCreatePalette = (name: string) => {
    const newPalette: Palette = {
      id: `palette-${Date.now()}`,
      name,
      colors: ["#000000", "#ffffff"],
    };
    setPalettes([...palettes, newPalette]);
    setActivePaletteId(newPalette.id);
  };

  const handleDeletePalette = (id: string) => {
    if (palettes.length <= 1) return;
    setPalettes(prev => prev.filter(p => p.id !== id));
    if (activePaletteId === id) setActivePaletteId(palettes[0].id);
  };

  const handleUpdatePalette = (id: string, colors: string[]) => {
    setPalettes(prev => prev.map(p => (p.id === id ? { ...p, colors } : p)));
  };

  const addFrame = () => {
    const newFrame: Frame = {
      id: `frame-${Date.now()}`,
      layers: {}, // Todo: clone layers from current frame?
      delay: 100,
    };
    // Clone current frame layers
    layers.forEach(l => {
      newFrame.layers[l.id] = frames[currentFrameIndex].layers[l.id].map(
        row => [...row],
      );
    });

    const newFrames = [...frames];
    newFrames.splice(currentFrameIndex + 1, 0, newFrame);
    setFrames(newFrames);
    setCurrentFrameIndex(currentFrameIndex + 1);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    if (currentFrameIndex >= index && currentFrameIndex > 0) {
      setCurrentFrameIndex(currentFrameIndex - 1);
    }
  };

  const duplicateFrame = (index: number) => {
    const frame = frames[index];
    const newFrame: Frame = {
      ...frame,
      id: `frame-${Date.now()}`,
      layers: {},
    };
    // Deep copy layers
    layers.forEach(l => {
      if (frame.layers[l.id]) {
        newFrame.layers[l.id] = frame.layers[l.id].map(row => [...row]);
      }
    });
    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, newFrame);
    setFrames(newFrames);
  };

  // --- External Actions (Import/Export/AI) ---
  const handleApplyAIImage = (base64: string) => {
    // Load base64 into active layer
    // For now, simplify or assume image loading util
    console.log("AI Image applied", base64.substring(0, 20));
    // Need a utility to convert base64 image to grid
  };

  const getCompositeDataURL = () => {
    // Return a data URL of the current canvas state
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";

    // Render layers
    // This logic should probably reuse renderFrameToCanvas from exportUtils
    const tempCanvas = renderFrameToCanvas(
      frames[currentFrameIndex],
      layers,
      width,
      height,
      1,
    );
    return tempCanvas.toDataURL();
  };

  const handleApplyTransform = (options: TransformOptions) => {
    recordHistory();
    // Fix: transformLayer expects (grid, options, width, height)
    const newPixels = transformLayer(
      frames[currentFrameIndex].layers[activeLayerId],
      options,
      width,
      height,
    );
    updateActiveLayerPixels(activeLayerId, newPixels);
    setShowTransformModal(false);
  };

  const handleSaveProject = () => {
    const project = {
      width,
      height,
      frames,
      layers,
      activeLayerId,
      palettes,
    };
    const blob = new Blob([JSON.stringify(project)], {
      type: "application/json",
    });
    downloadBlob(URL.createObjectURL(blob), "project.json");
  };

  const handleSaveTemplate = (name: string, description: string) => {
    const template: ProjectTemplate = {
      id: `template-${Date.now()}`,
      name,
      description,
      width,
      height,
      frames,
      layers,
      category: "custom",
    };
    createTemplate(template);
    setShowCreateTemplateModal(false);
    toast.success("Template saved!");
  };

  const handleCreateFromTemplate = (template: ProjectTemplate) => {
    // Fix: createProjectFromTemplate is synchronous
    const project = createProjectFromTemplate(template);
    setWidth(project.width);
    setHeight(project.height);
    setLayers(project.layers);
    setFrames(project.frames);
    setActiveLayerId(project.layers[0].id); // Fix: project.activeLayerId might not exist on return type
    setCurrentFrameIndex(0);
    setShowNewProjectModal(false);
    setProjectVersion(v => v + 1);
  };

  const handleOpenFile = () => {
    console.log("[FILE OPEN] handleOpenFile called, triggering file input");
    openFileInputRef.current?.click();
  };

  const handleTogglePanel = useCallback((panelId: string) => {
    mainDockLayoutRef.current?.togglePanel(panelId);
  }, []);

  const handleResetLayout = useCallback(() => {
    mainDockLayoutRef.current?.resetLayout();
  }, []);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Debug zoom changes
  useEffect(() => {
    console.log("[APP] Zoom state changed:", zoom);
  }, [zoom]);

  // Debug onZoomChange function
  const debugOnZoomChange = (newZoom: number) => {
    console.log("[APP] onZoomChange called with:", newZoom, "Current:", zoom);
    setZoom(newZoom);
  };

  // Debug pan changes
  useEffect(() => {
    console.log("[APP] Pan state changed:", pan);
  }, [pan]);
  const handleFitScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };
  const handleToggleTheme = () => {
    setCurrentThemeId(prev => (prev === "light" ? "default" : "light"));
  };
  const isDarkTheme = currentThemeId === "default";

  const handleCopyImageLocation = () => {
    // 1. Get current canvas image
    const dataUrl = getCompositeDataURL();
    // 2. Copy to clipboard
    // In browser, we can copy the Data URL string
    // In Electron, usually users want the file path, but if unsaved, Data URL is all we have.
    // Let's copy the Data URL for now.
    navigator.clipboard
      .writeText(dataUrl)
      .then(() => {
        toast.success("Image Data URL copied to clipboard");
      })
      .catch(() => {
        toast.error("Failed to copy image location");
      });
  };

  const handleReplaceColor = () => {
    // Simple implementation: replace all primaryColor pixels with secondaryColor
    const currentPixels = frames[currentFrameIndex]?.layers[activeLayerId];
    if (!currentPixels) return;

    recordHistory();

    const newPixels = currentPixels.map(row =>
      row.map(pixel => (pixel === primaryColor ? secondaryColor : pixel)),
    );

    updateActiveLayerPixels(activeLayerId, newPixels);
  };

  return (
    <div
      className={`flex flex-col h-screen ${
        isDarkTheme
          ? "bg-gray-900 text-white dark"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <NetworkStatus />

      <MenuBar
        onNew={() => setShowNewProjectModal(true)}
        onOpen={() => fileInputRef.current?.click()}
        onSave={handleSaveProject}
        onExport={() => setShowExport(true)}
        onCreateTemplate={() => setShowCreateTemplateModal(true)}
        onCopyImageLocation={handleCopyImageLocation}
        onOpenFile={handleOpenFile}
        onUndo={performUndo}
        onRedo={performRedo}
        onCut={() => {}}
        onCopy={() => {}}
        onPaste={() => {}}
        gridVisible={gridVisible}
        onToggleGrid={() => setGridVisible(!gridVisible)}
        onPreference={() => setIsSettingsOpen(true)}
        onOpenAsLayers={() => importLayerInputRef.current?.click()}
        onSaveAs={handleSaveProject}
        onRevert={() => {
          if (confirm("Revert to saved?")) window.location.reload();
        }}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitScreen={handleFitScreen}
        onToggleTheme={handleToggleTheme}
        isDarkTheme={currentThemeId !== "light"}
        panels={[
          {
            id: "tools",
            label: "Tools",
            visible: visiblePanels.includes("tools"),
          },
          {
            id: "layers",
            label: "Layers",
            visible: visiblePanels.includes("layers"),
          },
          {
            id: "palettes",
            label: "Palettes",
            visible: visiblePanels.includes("palettes"),
          },
          {
            id: "animation",
            label: "Animation",
            visible: visiblePanels.includes("animation"),
          },
          {
            id: "ai",
            label: "AI Generation",
            visible: visiblePanels.includes("ai"),
          },
        ]}
        onTogglePanel={handleTogglePanel}
        onResetLayout={handleResetLayout}
      />

      <div className="flex-1 relative overflow-hidden">
        <MainDockLayout
          key={projectVersion}
          ref={mainDockLayoutRef}
          onPanelVisibilityChange={setVisiblePanels}
          width={width}
          height={height}
          zoom={zoom}
          onZoomChange={debugOnZoomChange}
          pan={pan}
          onPanChange={setPan}
          layers={layers}
          activeLayerId={activeLayerId}
          onAddLayer={handleAddLayer}
          onRemoveLayer={handleRemoveLayer}
          onSelectLayer={setActiveLayerId}
          onUpdateLayer={handleUpdateLayer}
          onMoveLayer={handleMoveLayer}
          onMergeLayer={handleMergeDown}
          onToggleLayerVisibility={id => {
            const layer = layers.find(l => l.id === id);
            if (layer) handleUpdateLayer(id, { visible: !layer.visible });
          }}
          onToggleLayerLock={id => {
            const layer = layers.find(l => l.id === id);
            if (layer) handleUpdateLayer(id, { locked: !layer.locked });
          }}
          palettes={palettes}
          activePaletteId={activePaletteId}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
          onSelectPalette={setActivePaletteId}
          onCreatePalette={handleCreatePalette}
          onDeletePalette={handleDeletePalette}
          onUpdatePalette={handleUpdatePalette}
          setPrimaryColor={setPrimaryColor}
          setSecondaryColor={setSecondaryColor}
          selectMode={selectMode}
          setSelectMode={setSelectMode}
          wandTolerance={wandTolerance}
          setWandTolerance={setWandTolerance}
          onReplaceColor={handleReplaceColor}
          frames={frames}
          currentFrameIndex={currentFrameIndex}
          isPlaying={isPlaying}
          fps={fps}
          setCurrentFrameIndex={setCurrentFrameIndex}
          onAddFrame={addFrame}
          onDeleteFrame={deleteFrame}
          onDuplicateFrame={duplicateFrame}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          setFps={setFps}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
          brushSize={1}
          setBrushSize={() => {}}
          onApplyAIImage={handleApplyAIImage}
          getCanvasImage={getCompositeDataURL}
          layerPixels={(() => {
            const currentLayerPixels = frames[currentFrameIndex]?.layers || {};
            console.log("[DEBUG] App.tsx layerPixels for current frame:", {
              frameIndex: currentFrameIndex,
              layerPixels: currentLayerPixels,
              layerPixelsKeys: Object.keys(currentLayerPixels),
              canvasSize: `${width}x${height}`,
            });
            return currentLayerPixels;
          })()}
          onUpdateLayerPixels={updateActiveLayerPixels}
          gridVisible={gridVisible}
          selectionMask={selectionMask}
          setSelectionMask={setSelectionMask}
          onDrawStart={recordHistory}
          historyVersion={historyVersion}
        />
      </div>

      <ToastContainer position="bottom-right" theme="dark" />

      {/* Modals */}
      <CreateTemplateModal
        isOpen={showCreateTemplateModal}
        onClose={() => setShowCreateTemplateModal(false)}
        onSave={handleSaveTemplate}
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
        initialTab="general"
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExportGIF={(scale, fps, loop) =>
          createGif(frames, layers, width, height, fps, scale, loop ? 0 : 1)
        }
        onExportSpritesheet={(cols, padding, format) =>
          createSpriteSheet(
            frames,
            layers,
            width,
            height,
            cols,
            padding,
            format,
          )
        }
        onExportFrame={(scale, format) => {
          const canvas = renderFrameToCanvas(
            frames[currentFrameIndex],
            layers,
            width,
            height,
            scale,
          );
          downloadBlob(
            canvas.toDataURL(`image/${format}`),
            `frame-${currentFrameIndex + 1}.${format}`,
          );
        }}
      />

      <WelcomeModal
        isOpen={welcomeModalOpen}
        onClose={() => setWelcomeModalOpen(false)}
        onNewProject={() => {
          setWelcomeModalOpen(false);
          setShowNewProjectModal(true);
        }}
        onOpenProject={() => {
          setWelcomeModalOpen(false);
          fileInputRef.current?.click();
        }}
        recentProjects={[]} // Implement recent projects
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = evt => {
            try {
              const json = JSON.parse(evt.target?.result as string);
              if (json.width && json.height && json.frames && json.layers) {
                if (
                  confirm(
                    "Load project from " +
                      file.name +
                      "? Unsaved changes will be lost.",
                  )
                ) {
                  console.log("[FILE OPEN] Loading project data...");
                  setWidth(json.width);
                  setHeight(json.height);
                  setFrames(json.frames);
                  setLayers(json.layers);
                  setActiveLayerId(json.activeLayerId || json.layers[0]?.id);
                  setCurrentFrameIndex(0);
                  // Load palettes if present
                  if (json.palettes) setPalettes(json.palettes);
                  setProjectVersion(v => v + 1);
                  console.log("[FILE OPEN] Project loaded successfully");
                  toast.success("Project loaded successfully");
                }
              }
            } catch {
              console.error("[FILE OPEN] Invalid project file");
              toast.error("Invalid project file");
            }
          };
          reader.readAsText(file);
          e.target.value = "";
        }}
      />

      <input
        type="file"
        ref={openFileInputRef}
        accept=".bmp,.dib,.jpg,.jpeg,.gif,.tiff,.tif,.png,.ico,.heic,.hif,.avif,.webp"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          console.log("[FILE OPEN] File selected:", file?.name, file?.size);
          if (!file) return;

          const reader = new FileReader();
          reader.onload = event => {
            console.log("[FILE OPEN] FileReader loaded, creating image...");
            const img = new Image();
            img.onload = () => {
              console.log(
                "[FILE OPEN] Image loaded:",
                img.width,
                "x",
                img.height,
              );

              try {
                // Resize project to match image
                const newWidth = img.width;
                const newHeight = img.height;

                // Create new project structure with this image
                const newLayerId = "layer-1";

                // Create grid from image with improved error handling
                const canvas = document.createElement("canvas");
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext("2d", {
                  willReadFrequently: true,
                });

                if (!ctx) {
                  console.error("[FILE OPEN] Failed to get canvas context");
                  toast.error("Failed to process image");
                  return;
                }

                // Clear canvas first
                ctx.clearRect(0, 0, newWidth, newHeight);
                ctx.drawImage(img, 0, 0);

                const imageData = ctx.getImageData(0, 0, newWidth, newHeight);

                if (!imageData || !imageData.data) {
                  console.error("[FILE OPEN] Failed to get image data");
                  toast.error("Failed to read image data");
                  return;
                }

                const grid = createEmptyGrid(newWidth, newHeight);

                let visiblePixelCount = 0;
                let checkedPixels = 0;

                // Convert image data to grid with better error handling
                for (let y = 0; y < newHeight; y++) {
                  for (let x = 0; x < newWidth; x++) {
                    const i = (y * newWidth + x) * 4;

                    // Bounds check for image data
                    if (i + 3 >= imageData.data.length) {
                      continue;
                    }

                    const r = imageData.data[i];
                    const g = imageData.data[i + 1];
                    const b = imageData.data[i + 2];
                    const a = imageData.data[i + 3];

                    // Log first few pixels to debug
                    if (checkedPixels < 5) {
                      console.log(
                        `[PIXEL] x:${x}, y:${y} - R:${r} G:${g} B:${b} A:${a}`,
                      );
                      checkedPixels++;
                    }

                    // Only add pixels with some opacity
                    if (a > 10) {
                      // Increased threshold to ignore near-transparent pixels
                      visiblePixelCount++;
                      // Ensure valid color values
                      const validR = Math.max(0, Math.min(255, r));
                      const validG = Math.max(0, Math.min(255, g));
                      const validB = Math.max(0, Math.min(255, b));

                      grid[y][x] =
                        `#${((1 << 24) + (validR << 16) + (validG << 8) + validB).toString(16).slice(1)}`;
                    }
                  }
                }

                console.log(
                  `[FILE OPEN] Found ${visiblePixelCount} visible pixels out of ${newWidth * newHeight} total.`,
                );

                const newLayers: Layer[] = [
                  {
                    id: newLayerId,
                    name: "Background",
                    visible: true,
                    locked: false,
                    opacity: 1,
                  },
                ];

                const newFrames = [
                  {
                    id: "frame-1",
                    layers: { [newLayerId]: grid },
                    delay: 0,
                  },
                ];

                // Update state in specific order to ensure proper rendering
                console.log("[FILE OPEN] Updating project state...");

                // Clear selection and reset view first
                setSelectionMask(null);
                setZoom(1);
                setPan({ x: 0, y: 0 });

                // Update project dimensions and content
                setWidth(newWidth);
                setHeight(newHeight);
                setLayers(newLayers);
                setFrames(newFrames);
                setActiveLayerId(newLayerId);
                setCurrentFrameIndex(0);

                // Force a project version update to trigger re-render
                setProjectVersion(v => v + 1);

                console.log("[FILE OPEN] Project state updated successfully");
                toast.success(`Opened ${file.name} (${newWidth}x${newHeight})`);
              } catch (error) {
                console.error("[FILE OPEN] Error processing image:", error);
                toast.error("Failed to process image file");
              }
            };

            img.onerror = error => {
              console.error("[FILE OPEN] Failed to load image:", error);
              toast.error("Failed to load image file");
            };

            img.src = event.target?.result as string;
          };

          reader.onerror = error => {
            console.error("[FILE OPEN] FileReader error:", error);
            toast.error("Failed to read file");
          };

          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={importLayerInputRef}
        accept="image/*"
        className="hidden"
        onChange={e => {
          // Basic implementation for importing layer
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = event => {
            const img = new Image();
            img.onload = () => {
              // Create new layer with image content
              // For now just add a blank layer or handle logic
              handleAddLayer();
              toast.success("Image imported (as new layer logic placeholder)");
            };
            img.src = event.target?.result as string;
          };
          reader.readAsDataURL(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
export default App;
