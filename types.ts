export enum ToolType {
  PENCIL = "PENCIL",
  ERASER = "ERASER",
  BUCKET = "BUCKET",
  PICKER = "PICKER",
  SELECT = "SELECT",
  MAGIC_WAND = "MAGIC_WAND",
  LASSO = "LASSO",
  MOVE = "MOVE",
  TRANSFORM = "TRANSFORM",
  HAND = "HAND",
}

export enum SelectMode {
  BOX = "BOX",
  BRUSH = "BRUSH",
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface PixelData {
  color: string; // Hex code or 'transparent'
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number; // 0 to 1
}

export interface Frame {
  id: string;
  // keys are Layer IDs, values are the pixel grids
  layers: Record<string, (string | null)[][]>;
  delay: number; // in ms
}

export interface Palette {
  id: string;
  name: string;
  colors: string[];
}

export interface ProjectState {
  width: number;
  height: number;
  frames: Frame[];
  layers: Layer[];
  currentFrameIndex: number;
  activeLayerId: string;
  primaryColor: string;
  secondaryColor: string;
  selectedTool: ToolType;
  zoom: number;
  isPlaying: boolean;
  name: string;
  palettes: Palette[];
  activePaletteId: string;
}

export enum AspectRatio {
  SQUARE_1_1 = "1:1",
  PORTRAIT_2_3 = "2:3",
  LANDSCAPE_3_2 = "3:2",
  PORTRAIT_3_4 = "3:4",
  LANDSCAPE_4_3 = "4:3",
  PORTRAIT_9_16 = "9:16",
  LANDSCAPE_16_9 = "16:9",
  CINEMATIC_21_9 = "21:9",
}

export enum ImageSize {
  SIZE_1K = "1K",
  SIZE_2K = "2K",
  SIZE_4K = "4K",
}

export interface AIChatMessage {
  role: "user" | "model";
  text: string;
  type?: "text" | "error" | "success";
  groundingUrls?: Array<{ title: string; uri: string }>;
}

export interface AppSettings {
  geminiApiKey: string;
  minimizeToTray: boolean;
}

export interface Favicon {
  favicon: Promise<string>;
}

export default AppSettings;
