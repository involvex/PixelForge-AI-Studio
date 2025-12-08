// Layout Manager and Panel Types
import type React from "react";

// Define all possible panel prop types
export interface LayerPanelProps {
  layers: import("../types").Layer[];
  activeLayerId: string;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onSelectLayer: (id: string) => void;
  onUpdateLayer: (
    id: string,
    updates: Partial<import("../types").Layer>,
  ) => void;
  onMoveLayer: (fromIndex: number, toIndex: number) => void;
  onMergeLayer: (id: string) => void;
}

export interface PalettePanelProps {
  palettes: import("../types").Palette[];
  activePaletteId: string;
  onSelectPalette: (id: string) => void;
  onCreatePalette: (name: string) => void;
  onDeletePalette: (id: string) => void;
  onUpdatePalette: (id: string, colors: string[]) => void;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
}

export interface AIPanelProps {
  onApplyImage: (base64: string) => void;
  currentCanvasImage: () => string;
}

export interface AnimationPanelProps {
  frames: import("../types").Frame[];
  layers: import("../types").Layer[];
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

export interface AdjustmentsPanelProps {
  onApply: (brightness: number, contrast: number, gamma: number) => void;
  onClose: () => void;
}

export interface SettingsPanelProps {
  gridVisible: boolean;
  setGridVisible: (visible: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;
  gridColor: string;
  setGridColor: (color: string) => void;
}

export type PanelProps =
  | LayerPanelProps
  | PalettePanelProps
  | AIPanelProps
  | AnimationPanelProps
  | AdjustmentsPanelProps
  | SettingsPanelProps
  | Record<string, unknown>;

// Generic panel configuration – allow any props for the component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PanelConfig<P = any> {
  id: string;
  title: string;
  component: React.ComponentType<P>;
  icon?: string;
  defaultVisible: boolean;
  defaultPosition: "left" | "right" | "bottom" | "floating";
  minWidth?: number;
  minHeight?: number;
  props?: P;
}

export interface PanelState {
  id: string;
  visible: boolean;
  position: "left" | "right" | "bottom" | "floating";
  size?: {
    width?: number;
    height?: number;
  };
  floatingPosition?: {
    x: number;
    y: number;
  };
}

export interface LayoutState {
  panels: Record<string, PanelState>;
  version: string;
}

const LAYOUT_STORAGE_KEY = "pixelforge_panel_layout";
const LAYOUT_VERSION = "1.0.0";

/** Save the current panel layout to localStorage */
export function savePanelLayout(layoutState: LayoutState): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutState));
  } catch (error) {
    console.error("Failed to save panel layout:", error);
  }
}

/** Load the panel layout from localStorage */
export function loadPanelLayout(): LayoutState | null {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!stored) return null;
    const layout = JSON.parse(stored) as LayoutState;
    if (layout.version !== LAYOUT_VERSION) {
      console.warn("Layout version mismatch, using defaults");
      return null;
    }
    return layout;
  } catch (error) {
    console.error("Failed to load panel layout:", error);
    return null;
  }
}

/** Get a panel configuration by ID */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getPanelConfig(panelId: string): PanelConfig<any> | undefined {
  // Lazy import to avoid circular dependencies
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PANEL_REGISTRY } = require("../config/panelRegistry");
  return PANEL_REGISTRY.find((p: PanelConfig) => p.id === panelId);
}

/** Create default layout based on a list of panel configs */
export function createDefaultLayout<P = PanelProps>(
  panels: PanelConfig<P>[],
): LayoutState {
  const panelStates: Record<string, PanelState> = {};
  panels.forEach(panel => {
    panelStates[panel.id] = {
      id: panel.id,
      visible: panel.defaultVisible,
      position: panel.defaultPosition,
      size: {
        width: panel.minWidth,
        height: panel.minHeight,
      },
    };
  });
  return { panels: panelStates, version: LAYOUT_VERSION };
}

/** Toggle a panel's visibility */
export function togglePanel(
  layoutState: LayoutState,
  panelId: string,
): LayoutState {
  const panel = layoutState.panels[panelId];
  if (!panel) {
    console.warn(`Panel ${panelId} not found in layout`);
    return layoutState;
  }
  return {
    ...layoutState,
    panels: {
      ...layoutState.panels,
      [panelId]: { ...panel, visible: !panel.visible },
    },
  };
}

/** Update a panel's state */
export function updatePanelState(
  layoutState: LayoutState,
  panelId: string,
  updates: Partial<PanelState>,
): LayoutState {
  const panel = layoutState.panels[panelId];
  if (!panel) {
    console.warn(`Panel ${panelId} not found in layout`);
    return layoutState;
  }
  return {
    ...layoutState,
    panels: {
      ...layoutState.panels,
      [panelId]: { ...panel, ...updates },
    },
  };
}

/** Check if a panel is visible */
export function isPanelVisible(
  layoutState: LayoutState,
  panelId: string,
): boolean {
  return layoutState.panels[panelId]?.visible ?? false;
}
