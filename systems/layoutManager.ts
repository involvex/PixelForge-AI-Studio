import type React from "react";

export interface PanelConfig {
  id: string;
  title: string;
  component: React.ComponentType<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  icon?: string;
  defaultVisible: boolean;
  defaultPosition: "left" | "right" | "bottom" | "floating";
  minWidth?: number;
  minHeight?: number;
  props?: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
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

/**
 * Save the current panel layout to localStorage
 */
export function savePanelLayout(layoutState: LayoutState): void {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layoutState));
  } catch (error) {
    console.error("Failed to save panel layout:", error);
  }
}

/**
 * Load the panel layout from localStorage
 */
export function loadPanelLayout(): LayoutState | null {
  try {
    const stored = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (!stored) return null;

    const layout = JSON.parse(stored) as LayoutState;

    // Version check - if version mismatch, return null to use defaults
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

/**
 * Reset layout to default based on panel registry
 */
export function createDefaultLayout(panels: PanelConfig[]): LayoutState {
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

  return {
    panels: panelStates,
    version: LAYOUT_VERSION,
  };
}

/**
 * Toggle a panel's visibility
 */
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
      [panelId]: {
        ...panel,
        visible: !panel.visible,
      },
    },
  };
}

/**
 * Update a panel's state
 */
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
      [panelId]: {
        ...panel,
        ...updates,
      },
    },
  };
}

/**
 * Check if a panel is visible
 */
export function isPanelVisible(
  layoutState: LayoutState,
  panelId: string,
): boolean {
  return layoutState.panels[panelId]?.visible ?? false;
}
