import type React from "react";
import { useEffect, useRef } from "react";

export interface ContextMenuItem {
  label: string;
  action?: () => void;
  shortcut?: string;
  separator?: boolean;
  disabled?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Prevent menu from going off-screen
  const style: React.CSSProperties = {
    top: y,
    left: x,
  };

  // Adjust if close to right/bottom edge (basic logic)
  if (x > window.innerWidth - 200) style.left = x - 200;
  if (y > window.innerHeight - 300) style.top = y - 300;

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-gray-800 border border-gray-700 rounded shadow-xl py-1 transform transition-opacity duration-75 min-w-[160px]"
      style={style}
      onContextMenu={e => e.preventDefault()} // Prevent native menu inside our menu
      role="menu"
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <hr
              key={`sep-${item.label || index}`}
              className="h-px bg-gray-700 my-1 border-none"
            />
          );
        }

        return (
          <button
            key={item.label || index}
            type="button"
            onClick={() => {
              if (!item.disabled && item.action) {
                item.action();
                onClose();
              }
            }}
            disabled={item.disabled}
            className={`w-full text-left px-4 py-1.5 text-xs flex items-center justify-between group ${
              item.disabled
                ? "text-gray-500 cursor-not-allowed"
                : "text-gray-200 hover:bg-indigo-600 hover:text-white"
            }`}
            role="menuitem"
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span
                className={`text-[10px] ${item.disabled ? "text-gray-600" : "text-gray-500 group-hover:text-indigo-200"}`}
              >
                {item.shortcut}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ContextMenu;
