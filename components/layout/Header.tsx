import React from "react";

interface HeaderProps {
  left: React.ReactNode;
  center?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
}

const Header: React.FC<HeaderProps> = ({
  left,
  center,
  right,
  className = "",
}) => {
  return (
    <header
      className={`border-b border-gray-800 bg-gray-900 z-20 shrink-0 relative flex flex-wrap items-center justify-between px-4 py-2 gap-y-2 ${className}`}
    >
      <div className="flex items-center gap-4 shrink-0">{left}</div>
      {center && (
        <div className="flex items-center gap-4 shrink-0">{center}</div>
      )}
      {right && (
        <div className="flex items-center gap-4 shrink-0 ml-auto">{right}</div>
      )}
    </header>
  );
};

export default Header;
