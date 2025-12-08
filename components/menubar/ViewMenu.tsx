import React from "react";
import MenuDropdown, { MenuItem, MenuSeparator } from "./MenuDropdown";

interface ViewMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
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
}

const ViewMenu: React.FC<ViewMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
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
}) => {
  return (
    <MenuDropdown
      label="View"
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
    >
      <MenuItem
        label="Zoom In"
        onClick={() => {
          onZoomIn();
          onClose();
        }}
        shortcut="Ctrl++"
      />
      <MenuItem
        label="Zoom Out"
        onClick={() => {
          onZoomOut();
          onClose();
        }}
        shortcut="Ctrl+-"
      />
      <MenuItem
        label="Fit to Screen"
        onClick={() => {
          onFitScreen();
          onClose();
        }}
        shortcut="Ctrl+0"
      />
      <MenuSeparator />
      <MenuItem
        label={gridVisible ? "Hide Grid" : "Show Grid"}
        onClick={() => {
          onToggleGrid();
          onClose();
        }}
        shortcut="Ctrl+'"
      />
      {panels && panels.length > 0 && (
        <>
          <MenuSeparator />
          {panels.map(panel => (
            <MenuItem
              key={panel.id}
              label={panel.label}
              onClick={() => {
                onTogglePanel?.(panel.id);
                onClose();
              }}
              checked={panel.visible}
            />
          ))}
        </>
      )}
      {onResetLayout && (
        <>
          <MenuSeparator />
          <MenuItem
            label="Reset Layout"
            onClick={() => {
              onResetLayout();
              onClose();
            }}
          />
        </>
      )}
      <MenuSeparator />
      <MenuItem
        label={isDarkTheme ? "Switch to Light Theme" : "Switch to Dark Theme"}
        onClick={() => {
          onToggleTheme();
          onClose();
        }}
      />
    </MenuDropdown>
  );
};

export default ViewMenu;
