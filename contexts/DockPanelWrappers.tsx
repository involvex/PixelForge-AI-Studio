// Wrapper components that consume DockPanelContext
// These components receive live updates through context instead of stale closure props

import React from "react";
import AIPanel from "../components/AIPanel.tsx";
import AnimationPanel from "../components/AnimationPanel.tsx";
import EditorCanvas from "../components/EditorCanvas.tsx";
import LayerPanel from "../components/LayerPanel.tsx";
import PalettePanel from "../components/PalettePanel.tsx";
import Toolbar from "../components/Toolbar.tsx";
import { useDockPanelContext } from "./DockPanelContext.tsx";

// Canvas wrapper - gets live props from context
export const CanvasWrapper: React.FC = () => {
  const ctx = useDockPanelContext();
  return (
    <EditorCanvas
      width={ctx.width}
      height={ctx.height}
      layers={ctx.layers}
      layerPixels={ctx.layerPixels}
      activeLayerId={ctx.activeLayerId}
      onUpdateLayerPixels={ctx.onUpdateLayerPixels}
      selectedTool={ctx.selectedTool}
      primaryColor={ctx.primaryColor}
      secondaryColor={ctx.secondaryColor}
      setPrimaryColor={ctx.setPrimaryColor}
      zoom={ctx.zoom}
      onZoomChange={ctx.onZoomChange}
      gridVisible={ctx.gridVisible}
      selectionMask={ctx.selectionMask}
      setSelectionMask={ctx.setSelectionMask}
      onDrawStart={ctx.onDrawStart}
      historyVersion={ctx.historyVersion}
    />
  );
};

// Toolbar wrapper
export const ToolbarWrapper: React.FC = () => {
  const ctx = useDockPanelContext();

  return (
    <div className="h-full overflow-y-auto bg-gray-900 p-2 text-center flex justify-center">
      <Toolbar
        selectedTool={ctx.selectedTool}
        setTool={tool => {
          console.log(
            "[DOCK WRAPPER] Tool selection changed:",
            tool,
            "Previous:",
            ctx.selectedTool,
          );
          ctx.onSelectTool(tool);
        }}
        primaryColor={ctx.primaryColor}
        secondaryColor={ctx.secondaryColor}
        setPrimaryColor={ctx.setPrimaryColor}
        setSecondaryColor={ctx.setSecondaryColor}
        onReplaceColor={ctx.onReplaceColor || (() => {})}
        selectMode={ctx.selectMode}
        setSelectMode={ctx.setSelectMode}
        wandTolerance={ctx.wandTolerance}
        setWandTolerance={ctx.setWandTolerance}
      />
    </div>
  );
};

// Layer panel wrapper
export const LayerPanelWrapper: React.FC = () => {
  const ctx = useDockPanelContext();
  return (
    <LayerPanel
      layers={ctx.layers}
      activeLayerId={ctx.activeLayerId}
      onAddLayer={ctx.onAddLayer}
      onRemoveLayer={ctx.onRemoveLayer}
      onSelectLayer={ctx.onSelectLayer}
      onUpdateLayer={ctx.onUpdateLayer}
      onMoveLayer={ctx.onMoveLayer}
      onMergeLayer={ctx.onMergeLayer}
    />
  );
};

// Palette panel wrapper
export const PalettePanelWrapper: React.FC = () => {
  const ctx = useDockPanelContext();
  return (
    <PalettePanel
      palettes={ctx.palettes}
      activePaletteId={ctx.activePaletteId}
      onSelectPalette={ctx.onSelectPalette}
      onCreatePalette={ctx.onCreatePalette}
      onDeletePalette={ctx.onDeletePalette}
      onUpdatePalette={ctx.onUpdatePalette}
      primaryColor={ctx.primaryColor}
      setPrimaryColor={ctx.setPrimaryColor}
    />
  );
};

// Animation panel wrapper
export const AnimationPanelWrapper: React.FC = () => {
  const ctx = useDockPanelContext();
  return (
    <AnimationPanel
      frames={ctx.frames}
      layers={ctx.layers}
      currentFrameIndex={ctx.currentFrameIndex}
      setCurrentFrameIndex={ctx.setCurrentFrameIndex}
      addFrame={ctx.onAddFrame}
      deleteFrame={ctx.onDeleteFrame}
      duplicateFrame={ctx.onDuplicateFrame}
      isPlaying={ctx.isPlaying}
      togglePlay={ctx.onTogglePlay}
      fps={ctx.fps}
      setFps={ctx.setFps}
    />
  );
};

// AI panel wrapper
export const AIPanelWrapper: React.FC = () => {
  const ctx = useDockPanelContext();
  return (
    <AIPanel
      onApplyImage={ctx.onApplyAIImage}
      currentCanvasImage={ctx.getCanvasImage}
    />
  );
};
