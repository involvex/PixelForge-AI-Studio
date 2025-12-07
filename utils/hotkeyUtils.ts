export type HotkeyAction =
  | "UNDO"
  | "REDO"
  | "SAVE"
  | "EXPORT"
  | "TOOL_PENCIL"
  | "TOOL_ERASER"
  | "TOOL_BUCKET"
  | "TOOL_PICKER"
  | "TOOL_SELECT"
  | "TOOL_WAND"
  | "TOOL_LASSO"
  | "TOOL_MOVE"
  | "TOOL_TRANSFORM"
  | "TOOL_HAND"
  | "COPY"
  | "PASTE"
  | "CUT"
  | "SELECT_ALL"
  | "DESELECT"
  | "INVERT_SELECTION"
  | "DELETE_SELECTION"
  | "TOGGLE_GRID"
  | "ZOOM_IN"
  | "ZOOM_OUT";

export interface HotkeyMap {
  [key: string]: HotkeyAction;
}

export const DEFAULT_HOTKEYS: HotkeyMap = {
  "mod+z": "UNDO",
  "mod+shift+z": "REDO",
  "mod+y": "REDO",
  "mod+s": "SAVE",
  "mod+e": "EXPORT",
  p: "TOOL_PENCIL",
  e: "TOOL_ERASER",
  b: "TOOL_BUCKET",
  i: "TOOL_PICKER",
  m: "TOOL_MOVE",
  t: "TOOL_TRANSFORM",
  h: "TOOL_HAND",
  s: "TOOL_SELECT",
  w: "TOOL_WAND",
  l: "TOOL_LASSO",
  "mod+c": "COPY",
  "mod+v": "PASTE",
  "mod+x": "CUT",
  "mod+a": "SELECT_ALL",
  "mod+d": "DESELECT",
  "mod+shift+i": "INVERT_SELECTION",
  delete: "DELETE_SELECTION",
  backspace: "DELETE_SELECTION",
  "mod+'": "TOGGLE_GRID",
  "mod+=": "ZOOM_IN",
  "mod+-": "ZOOM_OUT",
};

export const getHotkeys = (): HotkeyMap => {
  const saved = localStorage.getItem("pf_hotkeys");
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_HOTKEYS, ...parsed };
    } catch (e) {
      console.error("Failed to parse hotkeys", e);
    }
  }
  return DEFAULT_HOTKEYS;
};

export const saveHotkeys = (hotkeys: HotkeyMap) => {
  localStorage.setItem("pf_hotkeys", JSON.stringify(hotkeys));
};

export const getActionFromEvent = (
  e: KeyboardEvent,
  hotkeys: HotkeyMap,
): HotkeyAction | null => {
  const parts = [];
  if (e.metaKey || e.ctrlKey) parts.push("mod");
  if (e.altKey) parts.push("alt");
  if (e.shiftKey) parts.push("shift");

  const key = e.key.toLowerCase();

  // Handle modifiers
  if (["control", "shift", "alt", "meta"].includes(key)) return null;

  parts.push(key);
  const combo = parts.join("+");

  return hotkeys[combo] || null;
};
