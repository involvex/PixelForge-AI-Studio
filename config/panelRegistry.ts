import AdjustmentsPanel from "../components/AdjustmentsPanel";
import AIPanel from "../components/AIPanel";
import AnimationPanel from "../components/AnimationPanel";
import LayerPanel from "../components/LayerPanel";
import PalettePanel from "../components/PalettePanel";
import SettingsPanel from "../components/SettingsPanel";
import type { PanelConfig } from "../systems/layoutManager";

/**
 * Central registry of all available panels in the application
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// biome-ignore lint/suspicious/noExplicitAny: Registry must hold heterogeneous components
export const PANEL_REGISTRY: PanelConfig<any>[] = [
  /* eslint-enable @typescript-eslint/no-explicit-any */
  {
    id: "layers",
    title: "Layers",
    component: LayerPanel,
    icon: "Layers",
    defaultVisible: true,
    defaultPosition: "right",
    minWidth: 250,
    minHeight: 200,
  },
  {
    id: "palettes",
    title: "Palettes",
    component: PalettePanel,
    icon: "Palette",
    defaultVisible: true,
    defaultPosition: "right",
    minWidth: 250,
    minHeight: 150,
  },
  {
    id: "ai",
    title: "AI Generation",
    component: AIPanel,
    icon: "Sparkles",
    defaultVisible: false,
    defaultPosition: "right",
    minWidth: 300,
    minHeight: 200,
  },
  {
    id: "animation",
    title: "Animation",
    component: AnimationPanel,
    icon: "Film",
    defaultVisible: true,
    defaultPosition: "bottom",
    minWidth: 200,
    minHeight: 120,
  },
  {
    id: "adjustments",
    title: "Adjustments",
    component: AdjustmentsPanel,
    icon: "Sliders",
    defaultVisible: false,
    defaultPosition: "floating",
    minWidth: 250,
    minHeight: 150,
  },
  {
    id: "settings",
    title: "Settings",
    component: SettingsPanel,
    icon: "Settings",
    defaultVisible: false,
    defaultPosition: "floating",
    minWidth: 300,
    minHeight: 200,
  },
];

/**
 * Get a panel configuration by ID
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
// biome-ignore lint/suspicious/noExplicitAny: Return type varies dynamically
export function getPanelConfig(panelId: string): PanelConfig<any> | undefined {
  /* eslint-enable @typescript-eslint/no-explicit-any */
  return PANEL_REGISTRY.find(p => p.id === panelId);
}

/**
 * Get all panel IDs
 */
export function getAllPanelIds(): string[] {
  return PANEL_REGISTRY.map(p => p.id);
}
