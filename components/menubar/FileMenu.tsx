import isElectron from "is-electron";
import React from "react";
import MenuDropdown, { MenuItem, MenuSeparator } from "./MenuDropdown";

interface FileMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onNew: () => void;
  onOpen: () => void;
  onSave: () => void;
  onExport: () => void;
}

const FileMenu: React.FC<FileMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  onNew,
  onOpen,
  onSave,
  onExport,
}) => {
  const handleNotImplemented = (feature: string) => {
    alert(`${feature} is coming soon!`);
    onClose();
  };

  return (
    <MenuDropdown
      label="File"
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
    >
      {/* 1. New, Open, Open as Layers, Open Location, Open Recent */}
      <MenuItem
        label="New Project..."
        onClick={() => {
          onNew();
          onClose();
        }}
        shortcut="Ctrl+N"
      />
      <MenuItem
        label="Open Project..."
        onClick={() => {
          onOpen();
          onClose();
        }}
        shortcut="Ctrl+O"
      />
      <MenuItem
        label="Open as Layers..."
        onClick={() => handleNotImplemented("Open as Layers")}
      />
      {isElectron() && (
        <MenuItem
          label="Open Location..."
          onClick={() => handleNotImplemented("Open Location")}
        />
      )}
      <MenuItem
        label="Open Recent"
        onClick={() => handleNotImplemented("Open Recent")}
      />

      <MenuSeparator />

      {/* 2. Save, Save As, Save Copy, Revert */}
      <MenuItem
        label="Save Project"
        onClick={() => {
          onSave();
          onClose();
        }}
        shortcut="Ctrl+S"
      />
      <MenuItem
        label="Save As..."
        onClick={() => handleNotImplemented("Save As")}
        shortcut="Ctrl+Shift+S"
      />
      <MenuItem
        label="Save Copy..."
        onClick={() => handleNotImplemented("Save Copy")}
      />
      <MenuItem label="Revert" onClick={() => handleNotImplemented("Revert")} />

      <MenuSeparator />

      {/* 3. Export, Export As */}
      <MenuItem
        label="Export..."
        onClick={() => {
          onExport();
          onClose();
        }}
        shortcut="Ctrl+E"
      />
      <MenuItem
        label="Export As..."
        onClick={() => handleNotImplemented("Export As")}
      />

      <MenuSeparator />

      {/* 4. Create Template */}
      <MenuItem
        label="Create Template..."
        onClick={() => handleNotImplemented("Create Template")}
      />

      <MenuSeparator />

      {/* 5. Copy Image Location */}
      <MenuItem
        label="Copy Image Location"
        onClick={() => handleNotImplemented("Copy Image Location")}
      />

      <MenuSeparator />

      {/* 6. Show in File Manager */}
      {isElectron() && (
        <>
          <MenuItem
            label="Show in File Manager"
            onClick={() => handleNotImplemented("Show in File Manager")}
          />
          <MenuSeparator />
        </>
      )}

      {/* 7. Close View, Close All, Quit */}
      <MenuItem
        label="Close View"
        onClick={() => handleNotImplemented("Close View")}
      />
      <MenuItem
        label="Close All"
        onClick={() => handleNotImplemented("Close All")}
      />
      <MenuItem
        label="Quit"
        onClick={() => {
          if (isElectron()) {
            window.close();
          } else {
            if (confirm("Are you sure you want to quit?")) {
              window.close();
            }
          }
        }}
        danger
      />
    </MenuDropdown>
  );
};

export default FileMenu;
