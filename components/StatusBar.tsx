import type React from "react";

interface StatusBarProps {
  cursorX: number | null;
  cursorY: number | null;
  width: number;
  height: number;
  zoom: number;
}

const StatusBar: React.FC<StatusBarProps> = ({
  cursorX,
  cursorY,
  width,
  height,
  zoom,
}) => {
  return (
    <div className="h-6 bg-gray-800 border-t border-gray-700 flex items-center px-2 text-xs text-gray-400 select-none justify-between shrink-0">
      <div className="flex gap-4">
        <span>
          {width} x {height}px
        </span>
        {cursorX !== null && cursorY !== null ? (
          <span>
            {cursorX}, {cursorY}
          </span>
        ) : (
          <span>--</span>
        )}
      </div>
      <div>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
    </div>
  );
};

export default StatusBar;
