import {
  ChevronRight,
  Copy,
  CornerUpLeft,
  CornerUpRight,
  Scissors,
  Settings,
  Type,
  ZoomIn,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { ToolType } from "../types";

interface MenuBarProps {
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onOpenSettings: () => void;
  setTool: (tool: ToolType) => void;
  setZoom: (fn: (z: number) => number) => void;
  // Placeholders/Extra
  onFill?: () => void;
  onStroke?: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onClear,
  onOpenSettings,
  setTool,
  setZoom,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = (action: () => void) => {
    action();
    setActiveMenu(null);
  };

  const MenuItem = ({
    label,
    shortcut,
    icon: Icon,
    onClick,
    disabled = false,
    hasSubmenu = false,
  }: {
    label: string;
    shortcut?: string;
    icon?: React.ComponentType<{ size?: number; className?: string }>;
    onClick?: () => void;
    disabled?: boolean;
    hasSubmenu?: boolean;
  }) => (
    <button
      className={`w-full text-left px-4 py-1.5 text-sm flex items-center justify-between hover:bg-indigo-600 hover:text-white group ${disabled ? "opacity-50 cursor-not-allowed" : "text-gray-200"}`}
      onClick={e => {
        if (disabled) return;
        if (onClick) {
          e.stopPropagation();
          handleAction(onClick);
        }
      }}
      disabled={disabled}
    >
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon size={14} className="text-gray-400 group-hover:text-white" />
        )}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-4">
        {shortcut && (
          <span className="text-xs text-gray-500 group-hover:text-indigo-200 font-mono">
            {shortcut}
          </span>
        )}
        {hasSubmenu && <ChevronRight size={14} />}
      </div>
    </button>
  );

  const Separator = () => <div className="h-px bg-gray-700 my-1 mx-2" />;

  return (
    <div className="flex items-center h-full ml-4" ref={menuRef}>
      {/* Edit Menu */}
      <div className="relative">
        <button
          className={`px-3 py-1 text-sm rounded hover:bg-gray-800 ${activeMenu === "edit" ? "bg-gray-800 text-white" : "text-gray-300"}`}
          onClick={() => setActiveMenu(activeMenu === "edit" ? null : "edit")}
          onMouseEnter={() => activeMenu && setActiveMenu("edit")}
        >
          Edit
        </button>
        {activeMenu === "edit" && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded shadow-xl py-1 z-50">
            <MenuItem
              label="Undo"
              shortcut="Ctrl+Z"
              icon={CornerUpLeft}
              onClick={onUndo}
            />
            <MenuItem
              label="Redo"
              shortcut="Ctrl+Y"
              icon={CornerUpRight}
              onClick={onRedo}
            />
            <MenuItem label="Undo History" disabled />
            <Separator />
            <MenuItem
              label="Cut"
              shortcut="Ctrl+X"
              icon={Scissors}
              onClick={onCut}
            />
            <MenuItem
              label="Copy"
              shortcut="Ctrl+C"
              icon={Copy}
              onClick={onCopy}
            />
            <MenuItem label="Copy Visible" disabled />
            <MenuItem label="Paste" shortcut="Ctrl+V" onClick={onPaste} />
            <MenuItem label="Paste In Place" disabled />
            <MenuItem label="Paste as..." disabled hasSubmenu />
            <Separator />
            <MenuItem label="Clear" shortcut="Del" onClick={onClear} />
            <MenuItem label="Fill with FG Color" disabled />
            <MenuItem label="Fill with BG Color" disabled />
            <MenuItem label="Fill with Pattern" disabled />
            <MenuItem label="Fill Selection Outline..." disabled />
            <MenuItem label="Fill Paths..." disabled />
            <MenuItem label="Stroke Selection..." disabled />
            <MenuItem label="Stroke Paths..." disabled />
            <Separator />
            <MenuItem
              label="Preferences"
              icon={Settings}
              onClick={onOpenSettings}
            />
          </div>
        )}
      </div>

      {/* Tools Menu */}
      <div className="relative">
        <button
          className={`px-3 py-1 text-sm rounded hover:bg-gray-800 ${activeMenu === "tools" ? "bg-gray-800 text-white" : "text-gray-300"}`}
          onClick={() => setActiveMenu(activeMenu === "tools" ? null : "tools")}
          onMouseEnter={() => activeMenu && setActiveMenu("tools")}
        >
          Tools
        </button>
        {activeMenu === "tools" && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-gray-900 border border-gray-700 rounded shadow-xl py-1 z-50">
            <div className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Selection Tools
            </div>
            <MenuItem
              label="Rectangle Select"
              onClick={() => setTool(ToolType.SELECT)}
            />
            <MenuItem label="Ellipse Select" disabled />
            <MenuItem
              label="Free Select"
              onClick={() => setTool(ToolType.LASSO)}
            />
            <MenuItem label="Foreground Select" disabled />
            <MenuItem
              label="Fuzzy Select"
              onClick={() => setTool(ToolType.MAGIC_WAND)}
            />
            <MenuItem label="By Color Select" disabled />
            <MenuItem label="Scissors Select" disabled />
            <Separator />
            <div className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Paint Tools
            </div>
            <MenuItem
              label="Bucket Fill"
              onClick={() => setTool(ToolType.BUCKET)}
            />
            <MenuItem
              label="Paintbrush"
              onClick={() => setTool(ToolType.PENCIL)}
            />
            <MenuItem label="Eraser" onClick={() => setTool(ToolType.ERASER)} />
            <MenuItem label="Airbrush" disabled />
            <MenuItem label="Ink" disabled />
            <MenuItem label="MyPaint Brush" disabled />
            <Separator />
            <div className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Transform Tools
            </div>
            <MenuItem label="Move" onClick={() => setTool(ToolType.MOVE)} />
            <MenuItem label="Align" disabled />
            <MenuItem label="Scale" disabled />
            <MenuItem label="Rotate" disabled />
            <MenuItem label="3D Transform" disabled />
            <MenuItem
              label="Handle Transform"
              onClick={() => setTool(ToolType.TRANSFORM)}
            />
            <Separator />
            <MenuItem label="Paths" disabled />
            <MenuItem label="Text" icon={Type} disabled />
            <MenuItem
              label="Color Picker"
              onClick={() => setTool(ToolType.PICKER)}
            />
            <MenuItem label="Measure" disabled />
            <MenuItem
              label="Zoom In"
              icon={ZoomIn}
              onClick={() => setZoom(z => Math.min(64, z + 1))}
            />
            <MenuItem
              label="Zoom Out"
              onClick={() => setZoom(z => Math.max(1, z - 1))}
            />
            <Separator />
            <MenuItem label="GEGL Operation..." disabled />
            <MenuItem label="New Toolbox" disabled />
            <MenuItem label="Default Colors" disabled />
            <MenuItem label="Swap Colors" disabled />
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuBar;
