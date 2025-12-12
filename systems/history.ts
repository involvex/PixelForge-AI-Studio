import { useCallback, useEffect, useRef, useState } from "react";
import type { Frame, Layer } from "../types.ts";

export interface HistoryState {
  frames: Frame[];
  layers: Layer[];
  width: number;
  height: number;
  activeLayerId: string;
  currentFrameIndex: number;
  selectionMask: boolean[][] | null;
}

interface UseHistoryProps extends HistoryState {
  onUndoRedo: (state: HistoryState) => void;
}

export const useHistory = ({
  frames,
  layers,
  width,
  height,
  activeLayerId,
  currentFrameIndex,
  selectionMask,
  onUndoRedo,
}: UseHistoryProps) => {
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [historyVersion, setHistoryVersion] = useState(0);

  const isUndoRedoAction = useRef(false);

  // Record initial state
  useEffect(() => {
    if (history.length === 0) {
      const initialState: HistoryState = {
        frames: JSON.parse(JSON.stringify(frames)),
        layers: JSON.parse(JSON.stringify(layers)),
        width,
        height,
        activeLayerId,
        currentFrameIndex,
        selectionMask: selectionMask
          ? JSON.parse(JSON.stringify(selectionMask))
          : null,
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, [
    frames,
    layers,
    width,
    height,
    activeLayerId,
    currentFrameIndex,
    selectionMask,
    history.length,
  ]);

  const recordHistory = useCallback(() => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }

    const currentState: HistoryState = {
      frames: JSON.parse(JSON.stringify(frames)),
      layers: JSON.parse(JSON.stringify(layers)),
      width,
      height,
      activeLayerId,
      currentFrameIndex,
      selectionMask: selectionMask
        ? JSON.parse(JSON.stringify(selectionMask))
        : null,
    };

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(currentState);
      if (newHistory.length > 50) {
        newHistory.shift();
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
    setHistoryVersion(prev => prev + 1);
  }, [
    frames,
    layers,
    width,
    height,
    activeLayerId,
    currentFrameIndex,
    selectionMask,
    historyIndex,
  ]);

  const performUndo = useCallback(() => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex - 1;
      const state = history[newIndex];
      if (state) {
        onUndoRedo(state);
      }
      setHistoryIndex(newIndex);
      setHistoryVersion(prev => prev + 1);
    }
  }, [history, historyIndex, onUndoRedo]);

  const performRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = historyIndex + 1;
      const state = history[newIndex];
      if (state) {
        onUndoRedo(state);
      }
      setHistoryIndex(newIndex);
      setHistoryVersion(prev => prev + 1);
    }
  }, [history, historyIndex, onUndoRedo]);

  return {
    recordHistory,
    performUndo,
    performRedo,
    historyVersion,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
};
