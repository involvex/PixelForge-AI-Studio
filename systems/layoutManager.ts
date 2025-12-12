// Layout Manager for rc-dock
import type { LayoutData } from "rc-dock";
import React from "react";

const LAYOUT_STORAGE_KEY = "pixelforge_dock_layout_v1";

export interface PanelConfig<T = unknown> {
  id: string;
  title: string;
  component: React.ComponentType<T>;
  icon: string;
  defaultVisible: boolean;
  defaultPosition: "left" | "right" | "bottom" | "floating";
  minWidth?: number;
  minHeight?: number;
}

export const defaultLayout: LayoutData = {
  dockbox: {
    mode: "horizontal",
    children: [
      {
        mode: "vertical",
        size: 200, // Left Sidebar
        children: [
          {
            tabs: [
              {
                id: "tools",
                title: "Tools",
                content: React.createElement("div"),
                key: "tools",
              },
            ],
          },
        ],
      },
      {
        mode: "vertical",
        size: 1000, // Main Area
        children: [
          {
            id: "main_canvas",
            tabs: [
              {
                id: "canvas",
                title: "Canvas",
                closable: false,
                content: React.createElement("div"), // Will be rendered by renderer
                key: "canvas",
              },
            ],
            panelLock: { panelStyle: "main" }, // Lock canvas panel
          },
          {
            size: 200, // Bottom Area
            tabs: [
              {
                id: "animation",
                title: "Animation",
                content: React.createElement("div"),
                key: "animation",
              },
            ],
          },
        ],
      },
      {
        mode: "vertical",
        size: 300, // Right Sidebar
        children: [
          {
            tabs: [
              {
                id: "layers",
                title: "Layers",
                content: React.createElement("div"),
                key: "layers",
              },
              {
                id: "palettes",
                title: "Palettes",
                content: React.createElement("div"),
                key: "palettes",
              },
            ],
          },
          {
            tabs: [
              {
                id: "ai",
                title: "AI Generation",
                content: React.createElement("div"),
                key: "ai",
              },
            ],
          },
        ],
      },
    ],
  },
};

export const saveLayout = (layout: LayoutData) => {
  try {
    localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error("Failed to save layout", e);
  }
};

export const loadLayout = (): LayoutData => {
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load layout", e);
  }
  return defaultLayout;
};

export const resetLayout = (): LayoutData => {
  localStorage.removeItem(LAYOUT_STORAGE_KEY);
  return defaultLayout;
};
