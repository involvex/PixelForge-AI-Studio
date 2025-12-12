// Context for DockLayout panels to receive up-to-date props
// This solves the stale closure problem where rc-dock caches components

import { createContext, useContext } from "react";
import type { Frame, Layer, Palette, SelectMode, ToolType } from "../types";

export interface DockPanelContextValue {
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
}

export const DockPanelContext = createContext<DockPanelContextValue | null>(
  null,
);

export const useDockPanelContext = () => {
  const context = useContext(DockPanelContext);
  if (!context) {
    throw new Error(
      "useDockPanelContext must be used within a DockPanelContext.Provider",
    );
  }
  return context;
};
