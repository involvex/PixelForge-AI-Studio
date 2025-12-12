import {
  Bot,
  Film,
  Grid,
  Layers,
  Palette as PaletteIcon,
  Wrench,
} from "lucide-react";

import { DockLayout, type LayoutData, type TabData } from "rc-dock";
import type React from "react";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
// Components - using context-aware wrappers for dock panels
import {
  AIPanelWrapper,
  AnimationPanelWrapper,
  CanvasWrapper,
  LayerPanelWrapper,
  PalettePanelWrapper,
  ToolbarWrapper,
} from "../contexts/DockPanelWrappers.tsx";
import { getAllPanelIds, getPanelConfig } from "../config/panelRegistry.ts";
import {
  DockPanelContext,
  type DockPanelContextValue,
} from "../contexts/DockPanelContext.tsx";
import {
  defaultLayout,
  loadLayout,
  saveLayout,
} from "../systems/layoutManager.ts";
import type { Frame, Layer, Palette, SelectMode, ToolType } from "../types.ts";

export interface MainDockLayoutHandle {
  togglePanel: (panelId: string) => void;
  resetLayout: () => void;
}

// Props interface - passing down all app state needed by panels
export interface MainDockLayoutProps {
  // Canvas State & Refs
  width: number;
  height: number;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  // Layers
  layers: Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (id: string, updates: Partial<Layer>) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onMergeLayer: (id: string) => void;
  onToggleLayerVisibility: (id: string) => void;
  onToggleLayerLock: (id: string) => void;
  // Palettes
  palettes: Palette[];
  activePaletteId: string;
  primaryColor: string;
  secondaryColor: string;
  onSelectPalette: (id: string) => void;
  onCreatePalette: (name: string) => void;
  onDeletePalette: (id: string) => void;
  onUpdatePalette: (id: string, colors: string[]) => void;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
  selectMode?: SelectMode;
  setSelectMode?: (mode: SelectMode) => void;
  wandTolerance?: number;
  setWandTolerance?: (tol: number) => void;
  onReplaceColor?: () => void;
  // Animation
  frames: Frame[];
  currentFrameIndex: number;
  isPlaying: boolean;
  fps: number;
  setCurrentFrameIndex: (index: number) => void;
  onAddFrame: () => void;
  onDeleteFrame: (index: number) => void;
  onDuplicateFrame: (index: number) => void;
  onTogglePlay: () => void;
  setFps: (fps: number) => void;
  // Tools
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  // AI
  onApplyAIImage: (base64: string) => void;
  getCanvasImage: () => string;
  // Canvas Props
  layerPixels: Record<string, (string | null)[][]>;
  onUpdateLayerPixels: (
    layerId: string,
    newPixels: (string | null)[][],
  ) => void;
  gridVisible: boolean;
  selectionMask: boolean[][] | null;
  setSelectionMask: (mask: boolean[][] | null) => void;
  onDrawStart: () => void;
  historyVersion: number;
  onPanelVisibilityChange: (visiblePanels: string[]) => void;
}

const MainDockLayout = forwardRef<MainDockLayoutHandle, MainDockLayoutProps>(
  (props, ref) => {
    const dockLayoutRef = useRef<DockLayout>(null);

    // Validate and clean layout data to prevent corrupted panel errors
    const validateLayout = (layout: LayoutData): LayoutData => {
      try {
        // Check if layout has required structure
        if (!layout || typeof layout !== "object") {
          console.warn("Invalid layout structure, using default");
          return defaultLayout;
        }

        // Clean function to remove invalid tabs
        const cleanTabs = (tabs: TabData[] = []): TabData[] => {
          return tabs.filter(tab => {
            // Ensure tab has valid ID
            if (!tab.id || typeof tab.id !== "string" || tab.id.trim() === "") {
              console.warn("Removing tab with invalid ID:", tab);
              return false;
            }
            // Allow known panel IDs, core components, or temporary IDs (for dock operations)
            const coreComponentIds = ["canvas", "tools"];
            const panelRegistryIds = getAllPanelIds();
            const allValidIds = [...coreComponentIds, ...panelRegistryIds];

            // Allow temporary IDs that are generated during dock operations
            const isTemporaryId =
              tab.id.startsWith("temp_") && tab.id.length > 10;

            if (!allValidIds.includes(tab.id) && !isTemporaryId) {
              console.warn("Removing tab with unknown ID:", tab.id);
              return false;
            }
            return true;
          });
        };

        // Recursively clean layout
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cleanLayout = (item: any) => {
          if (item.tabs) {
            item.tabs = cleanTabs(item.tabs);
          }
          if (item.children) {
            item.children = item.children.map(cleanLayout).filter(Boolean);
          }
          return item;
        };

        const cleanedLayout = { ...layout };
        if (cleanedLayout.dockbox) {
          cleanedLayout.dockbox = cleanLayout(cleanedLayout.dockbox);
        }
        if (cleanedLayout.floatbox) {
          cleanedLayout.floatbox = cleanLayout(cleanedLayout.floatbox);
        }

        return cleanedLayout;
      } catch (error) {
        console.error("Error validating layout:", error);
        return defaultLayout;
      }
    };

    // Load and validate initial layout
    const rawLayout = loadLayout();
    const layout = validateLayout(rawLayout);

    useImperativeHandle(ref, () => ({
      togglePanel: (panelId: string) => {
        console.log("[PANEL TOGGLE] Toggling panel:", panelId);
        const dock = dockLayoutRef.current;
        if (!dock || !panelId) {
          console.warn("[PANEL TOGGLE] No dock or panelId");
          return;
        }

        const existingTab = dock.find(panelId);
        console.log(
          "[PANEL TOGGLE] Existing tab:",
          existingTab ? "found" : "not found",
        );

        if (existingTab) {
          // Panel is currently visible - remove it (toggle OFF)
          // Type guard: ensure it's a TabData or PanelData (not BoxData)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((existingTab as any).tabs !== undefined) {
            // It's a BoxData, not a tab - skip removal
            console.warn(
              `[PANEL TOGGLE] Cannot toggle panel ${panelId}: found BoxData instead of TabData`,
            );
            return;
          }
          console.log("[PANEL TOGGLE] Removing panel:", panelId);
          // Safe to cast here after type guard
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dock.dockMove(existingTab as any, null, "remove" as any);
        } else {
          // Panel is not visible - add it back (toggle ON)
          let direction = "right";
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let target: any = dock.find("canvas");

          if (panelId === "tools") direction = "left";
          if (panelId === "animation") direction = "bottom";
          if (panelId === "canvas") direction = "middle";

          // If fallback target needed, ensure it exists and valid
          if (!target) {
            target = dock.getLayout().dockbox;
            direction = "right";
          }

          if (!target) {
            console.error("[PANEL TOGGLE] No valid target found for docking");
            return;
          }

          console.log(
            `[PANEL TOGGLE] Docking ${panelId} ${direction} of`,
            target,
          );

          // Provide minimal tab data - loadTab will be called to fill in actual content
          dock.dockMove(
            {
              id: panelId,
              title: panelId,
              content: <></>, // Empty fragment, loadTab will populate
              closable: true,
            },
            target,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            direction as any,
          );
        }
      },
      resetLayout: () => {
        console.log("[PANEL TOGGLE] Resetting layout");
        const dock = dockLayoutRef.current;
        if (dock) dock.loadLayout(defaultLayout);
      },
    }));

    const handleLayoutChange = (newLayout: LayoutData) => {
      const validatedLayout = validateLayout(newLayout);
      saveLayout(validatedLayout);

      // Traverse to find all panel IDs
      const visibleIds: string[] = [];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const traverse = (item: any) => {
        if (item.tabs) {
          item.tabs.forEach((tab: TabData) => {
            if (tab.id) visibleIds.push(tab.id);
          });
        }
        if (item.children) {
          item.children.forEach(traverse);
        }
      };

      if (validatedLayout.dockbox) traverse(validatedLayout.dockbox);
      if (validatedLayout.floatbox) traverse(validatedLayout.floatbox);

      props.onPanelVisibilityChange(visibleIds);
    };

    const loadTab = (tab: TabData): TabData => {
      // DEBUG: Log the tab being loaded (without JSON.stringify to avoid circular reference errors)
      console.log("loadTab called for:", tab.id, tab);

      // Ensure content is always populated - this fixes the "Loading..." issue
      if (!tab.content || tab.content === null) {
        console.log(
          "loadTab: Content is null, will be populated by loadTab logic",
        );
      }

      // Handle case where tab might be created without proper ID during dock operations
      const currentTab = { ...tab };

      // If tab has no ID, try to recover from other properties
      if (
        !currentTab.id ||
        typeof currentTab.id !== "string" ||
        currentTab.id.trim() === ""
      ) {
        console.warn("Tab missing valid ID, attempting to recover:", tab);

        // Try multiple recovery strategies
        let recoveredId: string | null = null;

        // Strategy 1: Recover from title
        if (currentTab.title && typeof currentTab.title === "string") {
          recoveredId = currentTab.title.toLowerCase().replace(/\s+/g, "");
        }
        // Strategy 2: Recover from content props or other properties
        else if (currentTab.content && typeof currentTab.content === "object") {
          // Try to extract ID from content if it's a React element
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const content = currentTab.content as any;
          if (content?.props?.id || content?.id) {
            recoveredId = content.props?.id || content.id;
          }
        }
        // Strategy 3: Generate based on closable status and position
        else if (currentTab.closable === true) {
          recoveredId = "unknown";
        }

        // If recovery failed, create a unique temporary ID
        if (!recoveredId || recoveredId.trim() === "") {
          recoveredId =
            "temp_" +
            Date.now() +
            "_" +
            Math.random().toString(36).substr(2, 9);
        }

        console.log("Attempting to recover tab ID:", recoveredId);

        currentTab.id = recoveredId;

        // If we still don't have a valid ID, show error but don't crash
        if (!recoveredId || recoveredId === "unknown") {
          console.warn("Could not recover tab ID, showing error state");
          currentTab.title = "Error";
          currentTab.content = (
            <div className="p-4 text-center text-red-400">
              <div className="font-semibold mb-2">Error: Tab ID missing</div>
              <div className="text-sm text-gray-400">
                This panel could not be loaded properly. Please reset the layout
                to fix this issue.
              </div>
            </div>
          );
        }
      }

      // Map tab IDs to components using registry and fallback handlers
      let content: React.ReactNode;

      // Use context-aware wrapper components for live state updates
      // This fixes the stale closure problem where rc-dock caches tab content
      if (tab.id === "canvas") {
        content = <CanvasWrapper />;
      } else if (tab.id === "tools") {
        content = <ToolbarWrapper />;
      } else {
        // Use panel registry for registered panels
        const panelConfig = getPanelConfig(currentTab.id);
        if (panelConfig) {
          try {
            // Use context-aware wrapper components for registry panels
            switch (tab.id) {
              case "layers":
                content = <LayerPanelWrapper />;
                break;
              case "palettes":
                content = <PalettePanelWrapper />;
                break;
              case "animation":
                content = <AnimationPanelWrapper />;
                break;
              case "ai":
                content = <AIPanelWrapper />;
                break;
              default: {
                // Use registry component for other panels
                const Component = panelConfig.component;
                content = <Component />;
                break;
              }
            }
          } catch (error) {
            console.error(`Error loading panel ${currentTab.id}:`, error);
            content = (
              <div className="p-4 text-center text-red-400">
                <div className="font-semibold mb-2">Panel Error</div>
                <div className="text-sm text-gray-400">
                  Failed to load {panelConfig.title}: {(error as Error).message}
                </div>
              </div>
            );
          }
        } else {
          // Unknown panel ID
          console.warn("Unknown panel ID:", currentTab.id);
          content = (
            <div className="p-4 text-center text-yellow-400">
              <div className="font-semibold mb-2">Unknown Panel</div>
              <div className="text-sm text-gray-400">
                Panel &quot;{currentTab.id}&quot; is not recognized. This might
                be from a plugin or corrupted layout.
              </div>
            </div>
          );
        }
      }

      const getIcon = (id?: string) => {
        switch (id) {
          case "layers":
            return <Layers size={14} className="mr-2" />;
          case "palettes":
            return <PaletteIcon size={14} className="mr-2" />;
          case "animation":
            return <Film size={14} className="mr-2" />;
          case "ai":
            return <Bot size={14} className="mr-2" />;
          case "tools":
            return <Wrench size={14} className="mr-2" />;
          case "canvas":
            return <Grid size={14} className="mr-2" />;
          default:
            return null;
        }
      };

      // Define static titles to prevent recursive wrapping
      const titles: Record<string, string> = {
        canvas: "Canvas",
        layers: "Layers",
        palettes: "Palettes",
        animation: "Animation",
        ai: "AI Generation",
        tools: "Tools",
      };

      // Ensure content is never null to prevent "Loading..." stuck state
      if (!content) {
        console.warn("loadTab: Content is still null, providing fallback");
        content = (
          <div className="p-4 text-center text-gray-400">
            <div className="font-semibold mb-2">Loading...</div>
            <div className="text-sm text-gray-500">
              Panel &quot;{currentTab.id}&quot; is loading...
            </div>
          </div>
        );
      }

      return {
        id: currentTab.id,
        title: (
          <span className="flex items-center">
            {getIcon(currentTab.id)}
            {titles[currentTab.id || ""] || currentTab.title}
          </span>
        ),
        closable: currentTab.closable,
        content: content,
        group: currentTab.group,
        key: currentTab.id,
      };
    };

    // Create context value that updates when props change
    const contextValue = useMemo<DockPanelContextValue>(
      () => ({
        width: props.width,
        height: props.height,
        zoom: props.zoom,
        pan: props.pan,
        onZoomChange: props.onZoomChange,
        onPanChange: props.onPanChange,
        layers: props.layers,
        activeLayerId: props.activeLayerId,
        onAddLayer: props.onAddLayer,
        onRemoveLayer: props.onRemoveLayer,
        onSelectLayer: props.onSelectLayer,
        onUpdateLayer: props.onUpdateLayer,
        onMoveLayer: props.onMoveLayer,
        onMergeLayer: props.onMergeLayer,
        onToggleLayerVisibility: props.onToggleLayerVisibility,
        onToggleLayerLock: props.onToggleLayerLock,
        palettes: props.palettes,
        activePaletteId: props.activePaletteId,
        primaryColor: props.primaryColor,
        secondaryColor: props.secondaryColor,
        onSelectPalette: props.onSelectPalette,
        onCreatePalette: props.onCreatePalette,
        onDeletePalette: props.onDeletePalette,
        onUpdatePalette: props.onUpdatePalette,
        setPrimaryColor: props.setPrimaryColor,
        setSecondaryColor: props.setSecondaryColor,
        selectMode: props.selectMode,
        setSelectMode: props.setSelectMode,
        wandTolerance: props.wandTolerance,
        setWandTolerance: props.setWandTolerance,
        onReplaceColor: props.onReplaceColor,
        frames: props.frames,
        currentFrameIndex: props.currentFrameIndex,
        isPlaying: props.isPlaying,
        fps: props.fps,
        setCurrentFrameIndex: props.setCurrentFrameIndex,
        onAddFrame: props.onAddFrame,
        onDeleteFrame: props.onDeleteFrame,
        onDuplicateFrame: props.onDuplicateFrame,
        onTogglePlay: props.onTogglePlay,
        setFps: props.setFps,
        selectedTool: props.selectedTool,
        onSelectTool: props.onSelectTool,
        brushSize: props.brushSize,
        setBrushSize: props.setBrushSize,
        onApplyAIImage: props.onApplyAIImage,
        getCanvasImage: props.getCanvasImage,
        layerPixels: props.layerPixels,
        onUpdateLayerPixels: props.onUpdateLayerPixels,
        gridVisible: props.gridVisible,
        selectionMask: props.selectionMask,
        setSelectionMask: props.setSelectionMask,
        onDrawStart: props.onDrawStart,
        historyVersion: props.historyVersion,
      }),
      [
        props.width,
        props.height,
        props.zoom,
        props.pan,
        props.onZoomChange,
        props.onPanChange,
        props.layers,
        props.activeLayerId,
        props.onAddLayer,
        props.onRemoveLayer,
        props.onSelectLayer,
        props.onUpdateLayer,
        props.onMoveLayer,
        props.onMergeLayer,
        props.onToggleLayerVisibility,
        props.onToggleLayerLock,
        props.palettes,
        props.activePaletteId,
        props.primaryColor,
        props.secondaryColor,
        props.onSelectPalette,
        props.onCreatePalette,
        props.onDeletePalette,
        props.onUpdatePalette,
        props.setPrimaryColor,
        props.setSecondaryColor,
        props.selectMode,
        props.setSelectMode,
        props.wandTolerance,
        props.setWandTolerance,
        props.onReplaceColor,
        props.frames,
        props.currentFrameIndex,
        props.isPlaying,
        props.fps,
        props.setCurrentFrameIndex,
        props.onAddFrame,
        props.onDeleteFrame,
        props.onDuplicateFrame,
        props.onTogglePlay,
        props.setFps,
        props.selectedTool,
        props.onSelectTool,
        props.brushSize,
        props.setBrushSize,
        props.onApplyAIImage,
        props.getCanvasImage,
        props.layerPixels,
        props.onUpdateLayerPixels,
        props.gridVisible,
        props.selectionMask,
        props.setSelectionMask,
        props.onDrawStart,
        props.historyVersion,
      ],
    );

    return (
      <DockPanelContext.Provider value={contextValue}>
        <DockLayout
          ref={dockLayoutRef}
          defaultLayout={layout || defaultLayout}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            right: 0,
            bottom: 0,
          }}
          loadTab={loadTab}
          onLayoutChange={handleLayoutChange}
        />
      </DockPanelContext.Provider>
    );
  },
);

MainDockLayout.displayName = "MainDockLayout";

export default MainDockLayout;
