import React, { useRef, useEffect, useState } from 'react';
import { ToolType, Coordinates, Layer } from '../types';
import { getCoordinates, floodFill, magicWandSelect, extractSelectedPixels, mergePixels, shiftMask, rasterizeTransform, rasterizeTransformMask, createEmptyGrid } from '../utils/drawingUtils';

interface EditorCanvasProps {
  width: number;
  height: number;
  zoom: number;
  layers: Layer[]; // Metadata for layers
  // Map of layerId -> pixel grid for current frame
  layerPixels: Record<string, (string | null)[][]>; 
  activeLayerId: string;
  onUpdateLayerPixels: (layerId: string, newPixels: (string | null)[][]) => void;
  selectedTool: ToolType;
  primaryColor: string;
  secondaryColor: string;
  gridVisible: boolean;
  setPrimaryColor: (color: string) => void;
  selectionMask: boolean[][] | null;
  setSelectionMask: (mask: boolean[][] | null) => void;
}

interface TransformState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // Radians
  scaleX: number;
  scaleY: number;
  // Source data for the transform
  sourcePixels: (string | null)[][]; 
  sourceMask: boolean[][];
  sourceWidth: number;
  sourceHeight: number;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  width,
  height,
  zoom,
  layers,
  layerPixels,
  activeLayerId,
  onUpdateLayerPixels,
  selectedTool,
  primaryColor,
  secondaryColor,
  gridVisible,
  setPrimaryColor,
  selectionMask,
  setSelectionMask
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewPixel, setPreviewPixel] = useState<Coordinates | null>(null);

  // Move Tool State
  const [dragStart, setDragStart] = useState<Coordinates | null>(null);
  const [floatingBuffer, setFloatingBuffer] = useState<(string | null)[][] | null>(null);
  const [floatingOffset, setFloatingOffset] = useState<Coordinates>({ x: 0, y: 0 });

  // Transform Tool State
  const [transformState, setTransformState] = useState<TransformState | null>(null);
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [transformStart, setTransformStart] = useState<{mouse: Coordinates, state: TransformState} | null>(null);

  // Commit function for Transform
  const commitTransform = () => {
    if (!transformState) return;

    const currentPixels = layerPixels[activeLayerId]; // This should be the version with cut pixels
    const newPixels = rasterizeTransform(
      currentPixels,
      transformState.sourcePixels,
      transformState,
      width,
      height,
      transformState.sourceWidth,
      transformState.sourceHeight
    );

    const newMask = rasterizeTransformMask(
      null, // Start with empty mask
      transformState.sourceMask,
      transformState,
      width,
      height,
      transformState.sourceWidth,
      transformState.sourceHeight
    );

    onUpdateLayerPixels(activeLayerId, newPixels);
    setSelectionMask(newMask);
    setTransformState(null);
  };

  // Reset transform when tool changes away from TRANSFORM
  useEffect(() => {
    if (selectedTool !== ToolType.TRANSFORM && transformState) {
        commitTransform();
    }
  }, [selectedTool]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width * zoom, height * zoom);
    
    // 1. Render all Visible Layers from bottom to top
    layers.forEach(layer => {
      if (!layer.visible) return;

      const pixels = layerPixels[layer.id];
      if (!pixels) return;

      ctx.save();
      ctx.globalAlpha = layer.opacity;

      pixels.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * zoom, y * zoom, zoom, zoom);
          }
        });
      });

      // Move Tool Preview
      if (layer.id === activeLayerId && floatingBuffer) {
        floatingBuffer.forEach((row, y) => {
          row.forEach((color, x) => {
            if (color) {
              const drawX = (x + floatingOffset.x) * zoom;
              const drawY = (y + floatingOffset.y) * zoom;
              ctx.fillStyle = color;
              ctx.fillRect(drawX, drawY, zoom, zoom);
            }
          });
        });
      }

      ctx.restore();

      // Transform Tool Preview
      if (layer.id === activeLayerId && selectedTool === ToolType.TRANSFORM && transformState) {
         ctx.save();
         
         // Calculate center of transformation
         const cx = (transformState.x + (transformState.width * transformState.scaleX) / 2) * zoom;
         const cy = (transformState.y + (transformState.height * transformState.scaleY) / 2) * zoom;
         
         ctx.translate(cx, cy);
         ctx.rotate(transformState.rotation);
         ctx.scale(transformState.scaleX, transformState.scaleY);
         
         // Draw the source buffer centered at (0,0) in local transformed space
         // Source buffer size:
         const sw = transformState.sourceWidth * zoom;
         const sh = transformState.sourceHeight * zoom;
         
         // Iterate the small source buffer
         // Optimization: Pre-render source buffer to an offscreen canvas if performance lags,
         // but for 32x32 or 64x64 pixel art, iteration is instant.
         transformState.sourcePixels.forEach((row, y) => {
             row.forEach((color, x) => {
                 if (color) {
                     ctx.fillStyle = color;
                     // Offset by half width/height to center
                     ctx.fillRect(x * zoom - sw/2, y * zoom - sh/2, zoom, zoom);
                 }
             });
         });

         // Draw Border in Local Space
         ctx.strokeStyle = '#00ffcc';
         ctx.lineWidth = 1 / Math.max(transformState.scaleX, transformState.scaleY); // Keep line width consistent visually
         ctx.strokeRect(-sw/2, -sh/2, sw, sh);

         ctx.restore();

         // Draw Handles (In Global Screen Space to prevent them from scaling/rotating weirdly)
         // We need to project the local corners to global space
         const corners = [
            { x: -transformState.sourceWidth/2, y: -transformState.sourceHeight/2, cursor: 'nw-resize', id: 'nw' },
            { x: transformState.sourceWidth/2, y: -transformState.sourceHeight/2, cursor: 'ne-resize', id: 'ne' },
            { x: transformState.sourceWidth/2, y: transformState.sourceHeight/2, cursor: 'se-resize', id: 'se' },
            { x: -transformState.sourceWidth/2, y: transformState.sourceHeight/2, cursor: 'sw-resize', id: 'sw' }
         ];
         
         const cos = Math.cos(transformState.rotation);
         const sin = Math.sin(transformState.rotation);

         ctx.save();
         ctx.fillStyle = 'white';
         ctx.strokeStyle = '#00ffcc';
         
         // Rotation Handle (Stick sticking out top)
         const topY = -transformState.sourceHeight/2 - 2; // 2 units above top
         const rX = topY * -sin * transformState.scaleY + cx;
         const rY = topY * cos * transformState.scaleY + cy;
         
         // Draw line to rotation handle
         const topMidX = (-transformState.sourceHeight/2) * -sin * transformState.scaleY + cx;
         const topMidY = (-transformState.sourceHeight/2) * cos * transformState.scaleY + cy;
         ctx.beginPath();
         ctx.moveTo(topMidX, topMidY);
         ctx.lineTo(rX, rY);
         ctx.stroke();
         
         ctx.beginPath();
         ctx.arc(rX, rY, 5, 0, Math.PI*2);
         ctx.fill();
         ctx.stroke();

         corners.forEach(c => {
             // Apply scale then rotation then translation
             // Local scaled
             const lx = c.x * transformState.scaleX * zoom;
             const ly = c.y * transformState.scaleY * zoom;
             
             // Rotated
             const rx = lx * cos - ly * sin;
             const ry = lx * sin + ly * cos;
             
             // Translated
             const finalX = rx + cx;
             const finalY = ry + cy;

             ctx.fillRect(finalX - 4, finalY - 4, 8, 8);
             ctx.strokeRect(finalX - 4, finalY - 4, 8, 8);
         });
         ctx.restore();
      }
    });

    ctx.globalAlpha = 1.0; 

    // 2. Draw Grid Lines
    if (gridVisible && zoom > 4) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= width; x++) {
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, height * zoom);
      }
      for (let y = 0; y <= height; y++) {
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(width * zoom, y * zoom);
      }
      ctx.stroke();
    }

    // 3. Draw Selection Overlay (Only if NOT transforming, as transform renders its own border)
    if (selectionMask && selectedTool !== ToolType.TRANSFORM) {
      ctx.fillStyle = 'rgba(100, 150, 255, 0.2)';
      ctx.strokeStyle = '#fff';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      
      const offsetX = floatingBuffer ? floatingOffset.x : 0;
      const offsetY = floatingBuffer ? floatingOffset.y : 0;

      selectionMask.forEach((row, y) => {
        row.forEach((selected, x) => {
          if (selected) {
             const drawX = (x + offsetX) * zoom;
             const drawY = (y + offsetY) * zoom;
             ctx.fillRect(drawX, drawY, zoom, zoom);
             ctx.strokeRect(drawX, drawY, zoom, zoom);
          }
        });
      });
      ctx.setLineDash([]);
    }

    // 4. Draw Preview Pixel
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (activeLayer && activeLayer.visible && !activeLayer.locked && previewPixel && !floatingBuffer && !transformState) {
      ctx.strokeStyle = selectedTool === ToolType.ERASER ? 'red' : 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(previewPixel.x * zoom, previewPixel.y * zoom, zoom, zoom);
    }

  }, [layers, layerPixels, activeLayerId, width, height, zoom, gridVisible, previewPixel, selectedTool, selectionMask, floatingBuffer, floatingOffset, transformState]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCoordinates(e, canvas, zoom, width);
    
    // Check for Transform Handle Hits
    if (selectedTool === ToolType.TRANSFORM && transformState) {
         // Logic to detect handle clicks needs screen coordinates, not grid coordinates
         const rect = canvas.getBoundingClientRect();
         let clientX, clientY;
         if ('touches' in e) {
            if(e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
            else return;
         } else {
            clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
         }
         const mx = clientX - rect.left;
         const my = clientY - rect.top;

         // Re-calculate handle positions
         const cx = (transformState.x + (transformState.width * transformState.scaleX) / 2) * zoom;
         const cy = (transformState.y + (transformState.height * transformState.scaleY) / 2) * zoom;
         const cos = Math.cos(transformState.rotation);
         const sin = Math.sin(transformState.rotation);

         // Check Rotate Handle
         const topY = -transformState.sourceHeight/2 - 2;
         const rX = topY * -sin * transformState.scaleY * zoom + cx;
         const rY = topY * cos * transformState.scaleY * zoom + cy;
         
         if (Math.hypot(mx - rX, my - rY) < 10) {
             setActiveHandle('rotate');
             setTransformStart({ mouse: {x: mx, y: my}, state: {...transformState} });
             setIsDrawing(true);
             return;
         }

         const corners = [
            { x: -transformState.sourceWidth/2, y: -transformState.sourceHeight/2, id: 'nw' },
            { x: transformState.sourceWidth/2, y: -transformState.sourceHeight/2, id: 'ne' },
            { x: transformState.sourceWidth/2, y: transformState.sourceHeight/2, id: 'se' },
            { x: -transformState.sourceWidth/2, y: transformState.sourceHeight/2, id: 'sw' }
         ];

         for (const c of corners) {
             const lx = c.x * transformState.scaleX * zoom;
             const ly = c.y * transformState.scaleY * zoom;
             const rx = lx * cos - ly * sin;
             const ry = lx * sin + ly * cos;
             const finalX = rx + cx;
             const finalY = ry + cy;

             if (Math.hypot(mx - finalX, my - finalY) < 10) {
                 setActiveHandle(c.id);
                 setTransformStart({ mouse: {x: mx, y: my}, state: {...transformState} });
                 setIsDrawing(true);
                 return;
             }
         }
         
         // Check for Body Drag (Move)
         // Simple check: distance from center < max dimension * zoom
         if (Math.hypot(mx - cx, my - cy) < (Math.max(transformState.width, transformState.height) * zoom / 2)) {
             setActiveHandle('move');
             setTransformStart({ mouse: {x: mx, y: my}, state: {...transformState} });
             setIsDrawing(true);
             return;
         }
         
         // Clicked outside -> Commit?
         commitTransform();
         return;
    }

    if (!coords) return;

    if (selectedTool === ToolType.TRANSFORM && !transformState) {
        // Initialize Transform
        // If selection exists, grab that. If not, grab whole layer.
        let bounds = { minX: 0, minY: 0, maxX: width, maxY: height };
        let mask = selectionMask;
        
        if (selectionMask) {
             // Find bounds
             let minX = width, minY = height, maxX = 0, maxY = 0;
             let hasSelection = false;
             for(let y=0; y<height; y++) {
                 for(let x=0; x<width; x++) {
                     if(selectionMask[y][x]) {
                         hasSelection = true;
                         minX = Math.min(minX, x);
                         minY = Math.min(minY, y);
                         maxX = Math.max(maxX, x);
                         maxY = Math.max(maxY, y);
                     }
                 }
             }
             if(hasSelection) {
                 bounds = { minX, minY, maxX: maxX + 1, maxY: maxY + 1 };
             } else {
                 mask = null; // Empty selection, fallback to whole layer
             }
        } else {
            // Implicitly select whole layer content bounds? Or just canvas size.
            // Let's stick to canvas size for simplicity.
            mask = Array(height).fill(true).map(() => Array(width).fill(true));
        }

        const w = bounds.maxX - bounds.minX;
        const h = bounds.maxY - bounds.minY;
        
        // Extract pixels
        const currentPixels = layerPixels[activeLayerId];
        const { cutPixels, floatingPixels } = extractSelectedPixels(currentPixels, mask!, width, height);

        // Crop floating pixels to the bounds
        const croppedPixels = Array(h).fill(null).map(() => Array(w).fill(null));
        const croppedMask = Array(h).fill(false).map(() => Array(w).fill(false));
        
        for(let y=0; y<h; y++) {
            for(let x=0; x<w; x++) {
                croppedPixels[y][x] = floatingPixels[y + bounds.minY][x + bounds.minX];
                croppedMask[y][x] = mask![y + bounds.minY][x + bounds.minX];
            }
        }
        
        // Update layer to cut pixels
        onUpdateLayerPixels(activeLayerId, cutPixels);
        setSelectionMask(null); // Hide standard selection mask overlay

        setTransformState({
            x: bounds.minX,
            y: bounds.minY,
            width: w,
            height: h,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            sourcePixels: croppedPixels,
            sourceMask: croppedMask,
            sourceWidth: w,
            sourceHeight: h
        });
        return;
    }

    if (selectedTool === ToolType.MOVE) {
       if (selectionMask) {
          setDragStart(coords);
          const currentPixels = layerPixels[activeLayerId];
          const { cutPixels, floatingPixels } = extractSelectedPixels(currentPixels, selectionMask, width, height);
          setFloatingBuffer(floatingPixels);
          setFloatingOffset({ x: 0, y: 0 });
          onUpdateLayerPixels(activeLayerId, cutPixels);
       }
       return;
    }

    setIsDrawing(true);
    handleDraw(e);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle Transform Drag
    if (isDrawing && selectedTool === ToolType.TRANSFORM && transformState && activeHandle && transformStart) {
         const rect = canvas.getBoundingClientRect();
         let clientX, clientY;
         if ('touches' in e) {
            if(e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
            else return;
         } else {
            clientX = (e as React.MouseEvent).clientX; clientY = (e as React.MouseEvent).clientY;
         }
         const mx = clientX - rect.left;
         const my = clientY - rect.top;

         // Delta in screen pixels
         const dx = (mx - transformStart.mouse.x) / zoom;
         const dy = (my - transformStart.mouse.y) / zoom;

         if (activeHandle === 'move') {
             setTransformState({
                 ...transformState,
                 x: transformStart.state.x + dx,
                 y: transformStart.state.y + dy
             });
         } else if (activeHandle === 'rotate') {
             // Calculate angle
             const cx = (transformState.x + (transformState.width * transformState.scaleX) / 2) * zoom;
             const cy = (transformState.y + (transformState.height * transformState.scaleY) / 2) * zoom;
             
             const angleStart = Math.atan2(transformStart.mouse.y - cy, transformStart.mouse.x - cx);
             const angleCurr = Math.atan2(my - cy, mx - cx);
             
             setTransformState({
                 ...transformState,
                 rotation: transformStart.state.rotation + (angleCurr - angleStart)
             });
         } else {
             // Scaling handles
             // This is simplified symmetric scaling logic for robustness.
             // Usually scaling happens relative to the *opposite* anchor.
             // For this prompt, let's implement center-based scaling or simplified ratio scaling.
             
             // Simplest: Modify scaleX/scaleY based on drag distance relative to center
             // NOTE: Real implementation requires projecting mouse to local space.
             // Hack: Just use distance from center compared to start.
             
             const scaleSpeed = 0.05; // Sensitivity
             
             let sx = transformStart.state.scaleX;
             let sy = transformStart.state.scaleY;
             
             // Determine directionality
             const isRight = activeHandle.includes('e');
             const isBottom = activeHandle.includes('s');
             
             // Project dx/dy onto local axis? Complex.
             // Simple: If moving right handle right, increase X.
             // We need to account for rotation to know what "right" is.
             
             // Let's do simple uniform scaling for handles for now, or assume unrotated for scale calculation?
             // Scaling rotated objects is mathematically heavy for this space.
             // Fallback: Uniform scaling based on radial distance.
             
             const cx = transformStart.state.x * zoom + (transformStart.state.width * zoom * sx)/2;
             const cy = transformStart.state.y * zoom + (transformStart.state.height * zoom * sy)/2;
             
             const startDist = Math.hypot(transformStart.mouse.x - cx, transformStart.mouse.y - cy);
             const currDist = Math.hypot(mx - cx, my - cy);
             const ratio = currDist / startDist;
             
             setTransformState({
                 ...transformState,
                 scaleX: sx * ratio,
                 scaleY: sy * ratio
             });
         }
         return;
    }
    
    const coords = getCoordinates(e, canvas, zoom, width);
    
    if (coords && coords.x >= 0 && coords.x < width && coords.y >= 0 && coords.y < height) {
      setPreviewPixel(coords);
    } else {
      setPreviewPixel(null);
    }

    if (isDrawing) {
      if (selectedTool === ToolType.MOVE && dragStart && floatingBuffer && coords) {
          const dx = coords.x - dragStart.x;
          const dy = coords.y - dragStart.y;
          setFloatingOffset({ x: dx, y: dy });
          return;
      }
      handleDraw(e);
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (selectedTool === ToolType.MOVE && floatingBuffer) {
        const currentPixels = layerPixels[activeLayerId]; 
        const mergedPixels = mergePixels(currentPixels, floatingBuffer, floatingOffset.x, floatingOffset.y, width, height);
        onUpdateLayerPixels(activeLayerId, mergedPixels);
        if (selectionMask) {
            const newMask = shiftMask(selectionMask, floatingOffset.x, floatingOffset.y, width, height);
            setSelectionMask(newMask);
        }
        setFloatingBuffer(null);
        setFloatingOffset({ x: 0, y: 0 });
        setDragStart(null);
    }

    if (selectedTool === ToolType.TRANSFORM) {
        setActiveHandle(null);
        setTransformStart(null);
    }

    setIsDrawing(false);
  };

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check active layer constraints
    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) return;

    const coords = getCoordinates(e, canvas, zoom, width);
    if (!coords) return;
    const { x, y } = coords;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    // Get current pixels for active layer
    const currentPixels = layerPixels[activeLayerId] || [];
    if (!currentPixels.length) return;

    // Handle Selection Interactions
    if (selectedTool === ToolType.MAGIC_WAND) {
       if (isDrawing && (e.type === 'mousedown' || e.type === 'touchstart')) {
           const mask = magicWandSelect(currentPixels, x, y, width, height);
           setSelectionMask(mask);
           setIsDrawing(false);
       }
       return;
    }

    // Selection Constraint
    if (selectionMask && !selectionMask[y][x]) {
        if (selectedTool === ToolType.SELECT) {
             if (e.type === 'mousedown' || e.type === 'touchstart') {
                 setSelectionMask(null);
                 setIsDrawing(false);
             }
        }
        return;
    }

    if (selectedTool === ToolType.PICKER) {
      const pickedColor = currentPixels[y][x];
      if (pickedColor) setPrimaryColor(pickedColor);
      setIsDrawing(false);
      return;
    }

    if (selectedTool === ToolType.BUCKET) {
      const newPixels = floodFill(currentPixels, x, y, primaryColor, width, height, selectionMask || undefined);
      onUpdateLayerPixels(activeLayerId, newPixels);
      setIsDrawing(false);
      return;
    }

    // Pencil or Eraser
    const currentColor = currentPixels[y][x];
    const targetColor = selectedTool === ToolType.ERASER ? null : primaryColor;

    if (currentColor !== targetColor) {
      const newPixels = currentPixels.map(row => [...row]);
      newPixels[y][x] = targetColor;
      onUpdateLayerPixels(activeLayerId, newPixels);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={width * zoom}
      height={height * zoom}
      className={`bg-transparent touch-none ${selectedTool === ToolType.TRANSFORM || selectedTool === ToolType.MOVE ? 'cursor-default' : 'cursor-crosshair'}`}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={() => {
        if (selectedTool !== ToolType.MOVE && selectedTool !== ToolType.TRANSFORM) {
            setIsDrawing(false);
        }
        setPreviewPixel(null);
      }}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    />
  );
};

export default EditorCanvas;