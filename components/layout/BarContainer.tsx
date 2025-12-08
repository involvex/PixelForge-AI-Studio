import type React from "react";

interface BarContainerProps {
  children: React.ReactNode;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

const BarContainer: React.FC<BarContainerProps> = ({
  children,
  orientation = "horizontal",
  className = "",
}) => {
  const baseClasses = "flex gap-2 items-center";
  const orientClasses =
    orientation === "horizontal"
      ? "flex-row w-full flex-wrap"
      : "flex-col h-full";

  return (
    <div className={`${baseClasses} ${orientClasses} ${className}`}>
      {children}
    </div>
  );
};

export default BarContainer;
