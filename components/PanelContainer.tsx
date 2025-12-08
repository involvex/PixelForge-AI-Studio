/** biome-ignore-all assist/source/organizeImports: biome-ignore lint/style/useImportType: biome-ignore lint/style/useImportType */
import type React from "react";
import type {
  LayoutState,
  PanelConfig,
  PanelProps,
} from "../systems/layoutManager";
import { isPanelVisible } from "../systems/layoutManager";
import DockablePanel from "./DockablePanel";

interface PanelContainerProps {
  layout: LayoutState;
  panels: PanelConfig<PanelProps>[];
  onTogglePanel: (panelId: string) => void;
  onFloatPanel?: (panelId: string) => void;
  onDockPanel?: (panelId: string) => void;
}

const PanelContainer: React.FC<PanelContainerProps> = ({
  layout,
  panels,
  onTogglePanel,
  onFloatPanel,
  onDockPanel,
}) => {
  // Filter panels by position
  const leftPanels = panels.filter(
    p =>
      layout.panels[p.id]?.position === "left" && isPanelVisible(layout, p.id),
  );
  const rightPanels = panels.filter(
    p =>
      layout.panels[p.id]?.position === "right" && isPanelVisible(layout, p.id),
  );
  const bottomPanels = panels.filter(
    p =>
      layout.panels[p.id]?.position === "bottom" &&
      isPanelVisible(layout, p.id),
  );
  const floatingPanels = panels.filter(
    p =>
      layout.panels[p.id]?.position === "floating" &&
      isPanelVisible(layout, p.id),
  );

  const renderPanel = (panel: PanelConfig<PanelProps>) => {
    const PanelComponent = panel.component;
    const panelState = layout.panels[panel.id];
    const isFloating = panelState?.position === "floating";

    return (
      <DockablePanel
        key={panel.id}
        id={panel.id}
        title={panel.title}
        isFloating={isFloating}
        onClose={() => onTogglePanel(panel.id)}
        onToggleFloat={() => {
          if (isFloating && onDockPanel) {
            onDockPanel(panel.id);
          } else if (!isFloating && onFloatPanel) {
            onFloatPanel(panel.id);
          }
        }}
        className={isFloating ? "absolute z-50 shadow-2xl" : ""}
      >
        {/* Pass all necessary props to the panel component */}
        <PanelComponent {...(panel.props || {})} />
      </DockablePanel>
    );
  };

  return (
    <>
      {/* Left Sidebar */}
      {leftPanels.length > 0 && (
        <div className="flex flex-col gap-2 w-64 shrink-0 p-2">
          {leftPanels.map(renderPanel)}
        </div>
      )}

      {/* Right Sidebar */}
      {rightPanels.length > 0 && (
        <div className="flex flex-col gap-2 w-64 shrink-0 p-2">
          {rightPanels.map(renderPanel)}
        </div>
      )}

      {/* Bottom Panel */}
      {bottomPanels.length > 0 && (
        <div className="flex flex-row gap-2 h-32 shrink-0 p-2">
          {bottomPanels.map(renderPanel)}
        </div>
      )}

      {/* Floating Panels */}
      {floatingPanels.map(panel => {
        const panelState = layout.panels[panel.id];
        const position = panelState?.floatingPosition || { x: 100, y: 100 };

        return (
          <div
            key={panel.id}
            style={{
              position: "fixed",
              left: `${position.x}px`,
              top: `${position.y}px`,
              width: panelState?.size?.width || panel.minWidth || 300,
              height: panelState?.size?.height || panel.minHeight || 200,
            }}
          >
            {renderPanel(panel)}
          </div>
        );
      })}
    </>
  );
};

export default PanelContainer;
