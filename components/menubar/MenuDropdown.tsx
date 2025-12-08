import type React from "react";
import { useEffect, useRef } from "react";

interface MenuDropdownProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  children: React.ReactNode;
}

const MenuDropdown: React.FC<MenuDropdownProps> = ({
  label,
  isOpen,
  onToggle,
  onClose,
  children,
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={onToggle}
        className={`px-3 py-1 flex items-center space-x-1 hover:bg-slate-700 rounded text-sm transition-colors ${
          isOpen ? "bg-slate-700 text-white" : "text-slate-300"
        }`}
      >
        <span>{label}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[200px] bg-slate-800 border border-slate-700 rounded-md shadow-2xl z-50 py-1">
          {children}
        </div>
      )}
    </div>
  );
};

export const MenuItem: React.FC<{
  label: string;
  onClick: () => void;
  shortcut?: string;
  danger?: boolean;
  checked?: boolean;
}> = ({ label, onClick, shortcut, danger, checked }) => (
  <button
    type="button"
    onClick={() => {
      onClick();
    }}
    className={`w-full text-left px-4 py-2 text-sm flex justify-between items-center hover:bg-slate-700 transition-colors ${
      danger ? "text-red-400 hover:text-red-300" : "text-slate-200"
    }`}
  >
    <span className="flex items-center gap-2">
      {checked !== undefined && (
        <span className="w-4 text-center">{checked ? "✓" : ""}</span>
      )}
      <span>{label}</span>
    </span>
    {shortcut && <span className="text-xs text-slate-500">{shortcut}</span>}
  </button>
);

export const MenuSeparator = () => (
  <div className="h-px bg-slate-700 my-1 mx-2" />
);

export default MenuDropdown;
