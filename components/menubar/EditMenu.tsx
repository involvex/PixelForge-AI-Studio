import React from "react";
import MenuDropdown, { MenuItem, MenuSeparator } from "./MenuDropdown";

interface EditMenuProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onPreference: () => void;
}

const EditMenu: React.FC<EditMenuProps> = ({
  isOpen,
  onToggle,
  onClose,
  onUndo,
  onRedo,
  onCut,
  onCopy,
  onPaste,
  onPreference,
}) => {
  return (
    <MenuDropdown
      label="Edit"
      isOpen={isOpen}
      onToggle={onToggle}
      onClose={onClose}
    >
      <MenuItem
        label="Undo"
        onClick={() => {
          onUndo();
          onClose();
        }}
        shortcut="Ctrl+Z"
      />
      <MenuItem
        label="Redo"
        onClick={() => {
          onRedo();
          onClose();
        }}
        shortcut="Ctrl+Y"
      />
      <MenuSeparator />
      <MenuItem label="Cut" onClick={onCut} shortcut="Ctrl+X" />
      <MenuItem label="Copy" onClick={onCopy} shortcut="Ctrl+C" />
      <MenuItem label="Paste" onClick={onPaste} shortcut="Ctrl+V" />
      <MenuSeparator />
      <MenuItem
        label="Preferences"
        onClick={() => {
          onPreference();
          onClose();
        }}
      />
    </MenuDropdown>
  );
};

export default EditMenu;
