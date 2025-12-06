import React, { useState, useEffect, useRef, useCallback } from 'react';
import Toolbar from './components/Toolbar';
import EditorCanvas from './components/EditorCanvas';
import AIPanel from './components/AIPanel';
import AnimationPanel from './components/AnimationPanel';
import LayerPanel from './components/LayerPanel';
import PalettePanel from './components/PalettePanel';
import { ToolType, Frame, Layer, Palette, ProjectState } from './types';
import { createEmptyGrid, replaceColor, invertMask, expandMask, contractMask } from './utils/drawingUtils';
import { Download, Upload, FileJson, Clapperboard, Settings, Image as ImageIcon, Layers, Sparkles, FolderOpen, Save, Archive, FileImage, MousePointer2, Maximize2, Minimize2, ArrowLeftRight, X, Undo, Redo, Palette as PaletteIcon } from 'lucide-react';
import * as _gifenc from 'gifenc';
import JSZip from 'jszip';

// Handle potential ESM/CJS interop issues with CDN
const gifenc = (_gifenc as any).default ?? _gifenc;
const { GIFEncoder, quantize, applyPalette } = gifenc;

const DEFAULT_SIZE = 32;

// Default Palette (Pico-8)
const DEFAULT_PALETTE: Palette = {
  id: 'default-pico8',
  name: 'Default (Pico-8)',
  colors: [
    '#000000', '#1D2B53', '#7E2553', '#008751',
    '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8',
    '#FF004D', '#FFA300', '#FFEC27', '#00E436',
    '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'
  ]
};

// History State Interface
interface HistoryState {
  frames: Frame[];
  layers: Layer[];
  width: number;
  height: number;
  activeLayerId: string;
  currentFrameIndex: number;
  selectionMask: boolean[][] | null;
  // We don't typically undo palette changes, but we could. For now, excluding palettes from history.
}

function App() {
  // --- State ---
  const [width, setWidth] = useState(DEFAULT_SIZE);
  const [height, setHeight] = useState(DEFAULT_SIZE);
  const [zoom, setZoom] = useState(15);
  
  // Initialize with one layer
  const initialLayerId = 'layer-1';
  const [layers, setLayers] = useState<Layer[]>([
    { id: initialLayerId, name: 'Layer 1', visible: true, locked: false, opacity: 1.0 }
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>(initialLayerId);

  const [frames, setFrames] = useState<Frame[]>([
    { 
      id: '1', 
      layers: { [initialLayerId]: createEmptyGrid(DEFAULT_SIZE, DEFAULT_SIZE) }, 
      delay: 100 
    }
  ]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  
  const [selectedTool, setSelectedTool] = useState<ToolType>(ToolType.PENCIL);
  const [primaryColor, setPrimaryColor] = useState('#ffffff');
  const [secondaryColor, setSecondaryColor] = useState('#000000');
  
  const [fps, setFps] = useState(12);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gridVisible, setGridVisible] = useState(true);
  
  // Selection Mask & Saved Selections
  const [selectionMask, setSelectionMask] = useState<boolean[][] | null>(null);
  const [savedSelections, setSavedSelections] = useState<Record<string, boolean[][]>>({});

  // Palettes
  const [palettes, setPalettes] = useState<Palette[]>([DEFAULT_PALETTE]);
  const [activePaletteId, setActivePaletteId] = useState<string>(DEFAULT_PALETTE.id);

  // History Stacks
  const [past, setPast] = useState<HistoryState[]>([]);
  const [future, setFuture] = useState<HistoryState[]>([]);
  // Version counter to signal canvas to reset transient states (like transform)
  const [historyVersion, setHistoryVersion] = useState(0);

  // Right Sidebar Tab State
  const [activeRightTab, setActiveRightTab] = useState<'layers' | 'ai' | 'palettes'>('layers');

  // --- Animation Loop ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % frames.length);
      }, 1000 / fps);
    }
    return () => clearInterval(interval);
  }, [isPlaying, fps, frames.length]);

  // --- History Management ---

  const recordHistory = useCallback(() => {
    // Deep copy current state
    const currentState: HistoryState = {
      frames: JSON.parse(JSON.stringify(frames)),
      layers: JSON.parse(JSON.stringify(layers)),
      width,
      height,
      activeLayerId,
      currentFrameIndex,
      selectionMask: selectionMask ? JSON.parse(JSON.stringify(selectionMask)) : null
    };

    setPast(prev => {
        // Limit history size to e.g. 50 steps
        const newHistory = [...prev, currentState];
        if (newHistory.length > 50) return newHistory.slice(1);
        return newHistory;
    });
    setFuture([]); // Clear redo stack
  }, [frames, layers, width, height, activeLayerId, currentFrameIndex, selectionMask]);

  const performUndo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    // Save current to future
    const current: HistoryState = { 
        frames, layers, width, height, activeLayerId, currentFrameIndex, selectionMask 
    };
    setFuture(prev => [current, ...prev]);
    setPast(newPast);

    // Restore
    setFrames(previous.frames);
    setLayers(previous.layers);
    setWidth(previous.width);
    setHeight(previous.height);
    // Only set active layer if it still exists (it should), but safe to restore
    setActiveLayerId(previous.activeLayerId);
    setCurrentFrameIndex(previous.currentFrameIndex);
    setSelectionMask(previous.selectionMask);
    
    setHistoryVersion(v => v + 1);
  }, [past, frames, layers, width, height, activeLayerId, currentFrameIndex, selectionMask]);

  const performRedo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    // Save current to past
    const current: HistoryState = { 
        frames, layers, width, height, activeLayerId, currentFrameIndex, selectionMask 
    };
    setPast(prev => [...prev, current]);
    setFuture(newFuture);

    // Restore
    setFrames(next.frames);
    setLayers(next.layers);
    setWidth(next.width);
    setHeight(next.height);
    setActiveLayerId(next.activeLayerId);
    setCurrentFrameIndex(next.currentFrameIndex);
    setSelectionMask(next.selectionMask);

    setHistoryVersion(v => v + 1);
  }, [future, frames, layers, width, height, activeLayerId, currentFrameIndex, selectionMask]);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          performRedo();
        } else {
          performUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        performRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [performUndo, performRedo]);

  // --- Helpers ---
  
  // Updates the pixels of the SPECIFIC layer in the CURRENT frame
  const updateActiveLayerPixels = (layerId: string, newPixels: (string | null)[][]) => {
    setFrames(prev => prev.map((f, i) => {
      if (i !== currentFrameIndex) return f;
      return {
        ...f,
        layers: {
          ...f.layers,
          [layerId]: newPixels
        }
      };
    }));
  };

  const handleResize = (newW: number, newH: number) => {
      if (newW < 1 || newH < 1) return;
      recordHistory();
      setWidth(newW);
      setHeight(newH);
      
      setFrames(prev => prev.map(f => {
          const newLayers: Record<string, (string|null)[][]> = {};
          
          Object.keys(f.layers).forEach(lid => {
              const oldGrid = f.layers[lid];
              const newGrid = createEmptyGrid(newW, newH);
              // Copy existing
              for(let y=0; y<Math.min(oldGrid.length, newH); y++) {
                  for(let x=0; x<Math.min(oldGrid[0].length, newW); x++) {
                      newGrid[y][x] = oldGrid[y][x];
                  }
              }
              newLayers[lid] = newGrid;
          });
          
          return { ...f, layers: newLayers };
      }));
      setSelectionMask(null);
  };

  const addFrame = () => {
    recordHistory();
    // New frame needs empty grids for all existing layers
    const newLayers: Record<string, (string|null)[][]> = {};
    layers.forEach(l => {
        newLayers[l.id] = createEmptyGrid(width, height);
    });

    setFrames(prev => [
      ...prev,
      { id: Date.now().toString(), layers: newLayers, delay: 100 }
    ]);
    setCurrentFrameIndex(frames.length);
  };

  const duplicateFrame = (index: number) => {
    recordHistory();
    const frameToCopy = frames[index];
    // Deep copy layers
    const newLayers: Record<string, (string|null)[][]> = {};
    Object.keys(frameToCopy.layers).forEach(lid => {
        newLayers[lid] = frameToCopy.layers[lid].map(row => [...row]);
    });

    const newFrame = {
      id: Date.now().toString(),
      layers: newLayers,
      delay: frameToCopy.delay
    };
    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, newFrame);
    setFrames(newFrames);
    setCurrentFrameIndex(index + 1);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    recordHistory();
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    setCurrentFrameIndex(Math.max(0, index - 1));
  };

  const handleReplaceColor = () => {
      recordHistory();
      // Replaces color on ACTIVE layer
      const currentPixels = frames[currentFrameIndex].layers[activeLayerId];
      if (!currentPixels) return;
      const newPixels