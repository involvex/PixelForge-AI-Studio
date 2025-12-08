import type React from "react";
import { useState } from "react";
import EditMenu from "./menubar/EditMenu";
import FileMenu from "./menubar/FileMenu";
import ViewMenu from "./menubar/ViewMenu";

interface MenuBarProps {
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onPreference: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitScreen: () => void;
  onToggleGrid: () => void;
  gridVisible: boolean;
  onToggleTheme: () => void;
  isDarkTheme: boolean;
  // Panel management
  panels?: Array<{
    id: string;
    label: string;
    visible: boolean;
  }>;
  onTogglePanel?: (panelId: string) => void;
  onResetLayout?: () => void;
  onCreateTemplate: () => void;
}

const MenuBar: React.FC<MenuBarProps> = ({
  onNew,
  onOpen,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onPreference,
  onZoomIn,
  onZoomOut,
  onFitScreen,
  onToggleGrid,
  gridVisible,
  onToggleTheme,
  isDarkTheme,
  panels,
  onTogglePanel,
  onResetLayout,
  onCreateTemplate,
}) => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const closeMenu = () => {
    setActiveMenu(null);
  };

  return (
    <div className="w-full h-8 bg-slate-900 border-b border-slate-700 flex items-center px-2 select-none z-50">
      <div className="mr-4 font-bold text-slate-400 text-xs tracking-wider">
        PIXELFORGE
      </div>
      <div className="flex space-x-1">
        <FileMenu
          isOpen={activeMenu === "file"}
          onToggle={() => toggleMenu("file")}
          onClose={closeMenu}
          onNew={onNew}
          onOpen={onOpen}
          onSave={onSave}
          onExport={onExport}
          onCreateTemplate={onCreateTemplate}
        />
        <EditMenu
          isOpen={activeMenu === "edit"}
          onToggle={() => toggleMenu("edit")}
          onClose={closeMenu}
          onUndo={onUndo}
          onRedo={onRedo}
          onCut={onCut}
          onCopy={onCopy}
          onPaste={onPaste}
          onPreference={onPreference}
        />
        <ViewMenu
          isOpen={activeMenu === "view"}
          onToggle={() => toggleMenu("view")}
          onClose={closeMenu}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onFitScreen={onFitScreen}
          onToggleGrid={onToggleGrid}
          gridVisible={gridVisible}
          onToggleTheme={onToggleTheme}
          isDarkTheme={isDarkTheme}
          panels={panels}
          onTogglePanel={onTogglePanel}
          onResetLayout={onResetLayout}
        />
      </div>
    </div>
  );
};

export default MenuBar;
