import React, { type ReactNode } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";

interface DockablePanelProps {
  id: string;
  title: string;
  children: ReactNode;
  onClose?: () => void;
  onToggleFloat?: () => void;
  isFloating?: boolean;
  className?: string;
}

const DockablePanel: React.FC<DockablePanelProps> = ({
  id,
  title,
  children,
  onClose,
  onToggleFloat,
  isFloating = false,
  className = "",
}) => {
  return (
    <div
      className={`flex flex-col bg-gray-900 border border-gray-700 rounded ${className}`}
      data-panel-id={id}
    >
      {/* Title Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700 cursor-move select-none">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{title}</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Float/Dock Toggle */}
          {onToggleFloat && (
            <button
              type="button"
              onClick={onToggleFloat}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title={isFloating ? "Dock Panel" : "Float Panel"}
            >
              {isFloating ? (
                <Minimize2 size={14} className="text-gray-400" />
              ) : (
                <Maximize2 size={14} className="text-gray-400" />
              )}
            </button>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Close Panel"
            >
              <X size={14} className="text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-auto p-3">{children}</div>
    </div>
  );
};

export default DockablePanel;
