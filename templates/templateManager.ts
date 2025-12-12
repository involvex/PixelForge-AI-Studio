import type { Frame, Layer } from "../types.ts";
import { createEmptyGrid } from "../utils/drawingUtils.ts";

export interface ProjectTemplate {
  id: string;
  name: string;
  description?: string;
  category?: "built-in" | "custom";
  icon?: string;
  width: number;
  height: number;
  resolutionX?: number; // ppi
  resolutionY?: number; // ppi
  colorSpace?: "RGB" | "CMYK";
  bitDepth?: number;
  gamma?: number;
  comment?: string;
  fillWith?:
    | "Transparency"
    | "Foreground"
    | "Background"
    | "Gray"
    | "White"
    | "Pattern";
  fps?: number;
  layers?: Layer[];
  frames?: Frame[];
}

export const builtInTemplates: ProjectTemplate[] = [
  {
    id: "empty-32",
    name: "Empty 32x32",
    width: 32,
    height: 32,
    fillWith: "Transparency",
    colorSpace: "RGB",
    bitDepth: 8,
  },
  {
    id: "empty-64",
    name: "Empty 64x64",
    width: 64,
    height: 64,
    fillWith: "Transparency",
    colorSpace: "RGB",
    bitDepth: 8,
  },
  {
    id: "game-sprite-16",
    name: "Game Sprite 16x16",
    width: 16,
    height: 16,
    fps: 8,
    fillWith: "Transparency",
    colorSpace: "RGB",
    bitDepth: 8,
  },
  {
    id: "ico-128",
    name: "Icon 128x128",
    width: 128,
    height: 128,
    fillWith: "Transparency",
    colorSpace: "RGB",
    bitDepth: 8,
  },
  {
    id: "social-post",
    name: "Social Post (Generic)",
    width: 256,
    height: 256,
    fillWith: "White",
    colorSpace: "RGB",
    bitDepth: 8,
  },
];

const STORAGE_KEY = "pf_custom_templates";

// In-memory store for custom templates (backed by localStorage)
const loadCustomTemplates = (): ProjectTemplate[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to load custom templates", e);
    return [];
  }
};

const customTemplates: ProjectTemplate[] = loadCustomTemplates();

const saveCustomTemplates = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));
  } catch (e) {
    console.error("Failed to save custom templates", e);
  }
};

export const createTemplate = (template: ProjectTemplate): void => {
  if (
    builtInTemplates.find(t => t.id === template.id) ||
    customTemplates.find(t => t.id === template.id)
  ) {
    throw new Error(`Template with ID ${template.id} already exists.`);
  }
  customTemplates.push(template);
  saveCustomTemplates();
};

export const loadTemplate = (id: string): ProjectTemplate | undefined => {
  return [...builtInTemplates, ...customTemplates].find(t => t.id === id);
};

export const editTemplate = (
  id: string,
  updates: Partial<ProjectTemplate>,
): void => {
  const customIndex = customTemplates.findIndex(t => t.id === id);
  if (customIndex !== -1) {
    customTemplates[customIndex] = {
      ...customTemplates[customIndex],
      ...updates,
    };
    saveCustomTemplates();
    return;
  }
  throw new Error("Cannot edit built-in templates or template not found.");
};

export const getAllTemplates = (): ProjectTemplate[] => {
  return [...builtInTemplates, ...customTemplates];
};

export const deleteTemplate = (id: string): void => {
  const index = customTemplates.findIndex(t => t.id === id);
  if (index !== -1) {
    customTemplates.splice(index, 1);
    saveCustomTemplates();
    return;
  }
  throw new Error("Cannot delete built-in templates or template not found.");
};

export const createProjectFromTemplate = (
  template: ProjectTemplate,
): {
  width: number;
  height: number;
  fps: number;
  layers: Layer[];
  frames: Frame[];
} => {
  const width = template.width;
  const height = template.height;
  const fps = template.fps || 12;

  const initialLayerId = `layer-${Date.now()}`;
  const layers: Layer[] = template.layers || [
    {
      id: initialLayerId,
      name: "Layer 1",
      visible: true,
      locked: false,
      opacity: 1.0,
    },
  ];

  /* 
    TODO: Handle 'fillWith' logic here. 
    If fillWith === 'White', we should fill the grid with white color.
    Currently defaulting to transparent (createEmptyGrid).
  */

  const frames: Frame[] = template.frames || [
    {
      id: "1",
      layers: {
        [initialLayerId]: createEmptyGrid(width, height),
      },
      delay: 100,
    },
  ];

  return { width, height, fps, layers, frames };
};
