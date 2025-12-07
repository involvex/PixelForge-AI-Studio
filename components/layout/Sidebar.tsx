import React from "react";

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  position?: "left" | "right";
  width?: number; // Optional controlled width
}

const Sidebar: React.FC<SidebarProps> = ({
  children,
  className = "",
  position = "left",
  width,
}) => {
  const borderClass =
    position === "left"
      ? "border-r border-gray-750"
      : "border-l border-gray-750";

  return (
    <div
      className={`bg-gray-850 ${borderClass} flex flex-col items-center py-4 gap-4 z-10 overflow-y-auto scrollbar-none ${className}`}
      style={width ? { width: `${width}px` } : {}}
    >
      {children}
    </div>
  );
};

export default Sidebar;
