import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { type Coordinates, type Layer, SelectMode, ToolType } from "../types";
import {
  drawOnMask,
  extractSelectedPixels,
  floodFill,
  getCoordinates,
  magicWandSelect,
  mergePixels,
  rasterizePolygon,
  shiftMask,
} from "../utils/drawingUtils";
import {
  rasterizeTransform,
  rasterizeTransformMask,
  type TransformState,
} from "../utils/transform";

interface EditorCanvasProps {
  width: number;
  height: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  layers: Layer[]; // Metadata for layers
  // Map of layerId -> pixel grid for current frame
  layerPixels: Record<string, (string | null)[][]>;
  activeLayerId: string;
  onUpdateLayerPixels: (
    layerId: string,
    newPixels: (string | null)[][],
  ) => void;
  selectedTool: ToolType;
  primaryColor: string;
  secondaryColor: string;
  gridVisible: boolean;
  gridColor?: string;
  setPrimaryColor: (color: string) => void;
  selectionMask: boolean[][] | null;
  setSelectionMask: (mask: boolean[][] | null) => void;
  onDrawStart: () => void;
  historyVersion: number;
  gridSize?: number;
  onContextMenu?: (e: React.MouseEvent) => void;
  selectMode?: SelectMode;
  wandTolerance?: number;
  onCursorMove?: (x: number | null, y: number | null) => void;
}

const EditorCanvas: React.FC<EditorCanvasProps> = ({
  width,
  height,
  zoom,
  onZoomChange,
  layers,
  layerPixels,
  activeLayerId,
  onUpdateLayerPixels,
  selectedTool,
  primaryColor,
  gridVisible,
  setPrimaryColor,
  selectionMask,
  setSelectionMask,
  onDrawStart,
  gridSize = 1,
  gridColor,
  // historyVersion,
  onContextMenu,
  selectMode,
  wandTolerance = 0,
  onCursorMove,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [previewPixel, setPreviewPixel] = useState<Coordinates | null>(null);
  const [lassoPoints, setLassoPoints] = useState<Coordinates[]>([]);

  // Move Tool State
  const [dragStart, setDragStart] = useState<Coordinates | null>(null);
  const [floatingBuffer, setFloatingBuffer] = useState<
    (string | null)[][] | null
  >(null);
  const [floatingOffset, setFloatingOffset] = useState<Coordinates>({
    x: 0,
    y: 0,
  });

  // Hand Tool State
  const [panOffset, setPanOffset] = useState<Coordinates>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Coordinates>({ x: 0, y: 0 });

  // Transform Tool State
  const [transformState, setTransformState] = useState<TransformState | null>(
    null,
  );
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const [transformStart, setTransformStart] = useState<{
    mouse: Coordinates;
    state: TransformState;
  } | null>(null);

  const [selectionStart, setSelectionStart] = useState<Coordinates | null>(
    null,
  );
  const [selectionEnd, setSelectionEnd] = useState<Coordinates | null>(null);

  // Reset transient states when history changes (e.g. undo/redo)
  useEffect(() => {
    setTransformState(null);
    setFloatingBuffer(null);
    setFloatingBuffer(null);
    setFloatingOffset({ x: 0, y: 0 });
    // Keep panOffset!
    setIsPanning(false);
    setDragStart(null);
    setDragStart(null);
    setIsDrawing(false);
    setActiveHandle(null);
    setTransformStart(null);
    setSelectionStart(null);
    setSelectionEnd(null);
  }, []);

  // Zoom Interaction (Ctrl + Wheel) - REMOVED: Canvas wheel handler to prevent interference with container handler
  // The container (div) will handle wheel events for zoom functionality

  // Initialize Transform when tool is selected
  useEffect(() => {
    if (
      selectedTool === ToolType.TRANSFORM &&
      !transformState &&
      activeLayerId &&
      layerPixels[activeLayerId]
    ) {
      const currentPixels = layerPixels[activeLayerId];
      // Use selection mask if available, otherwise full layer
      const mask = selectionMask
        ? selectionMask
        : Array(height)
            .fill(true)
            .map(() => Array(width).fill(true));

      // Calculate bounds
      let minX = width;
      let minY = height;
      let maxX = 0;
      let maxY = 0;
      let hasContent = false;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (mask[y][x] && currentPixels[y][x]) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            hasContent = true;
          }
        }
      }

      if (!hasContent) return;

      const { cutPixels, floatingPixels } = extractSelectedPixels(
        currentPixels,
        mask,
        width,
        height,
      );

      // Crop floating pixels to bounds for sourcePixels
      const sourceWidth = maxX - minX + 1;
      const sourceHeight = maxY - minY + 1;
      const sourcePixels = Array(sourceHeight)
        .fill(null)
        .map(() => Array(sourceWidth).fill(null));
      const sourceMask = Array(sourceHeight)
        .fill(false)
        .map(() => Array(sourceWidth).fill(false));

      for (let y = 0; y < sourceHeight; y++) {
        for (let x = 0; x < sourceWidth; x++) {
          const sx = x + minX;
          const sy = y + minY;
          sourcePixels[y][x] = floatingPixels[sy][sx];
          sourceMask[y][x] = !!floatingPixels[sy][sx];
        }
      }

      onUpdateLayerPixels(activeLayerId, cutPixels);

      setTransformState({
        x: minX,
        y: minY,
        width: sourceWidth,
        height: sourceHeight,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        sourcePixels,
        sourceMask,
        sourceWidth,
        sourceHeight,
      });
    }
  }, [
    selectedTool,
    transformState,
    activeLayerId,
    layerPixels,
    selectionMask,
    width,
    height,
    onUpdateLayerPixels,
  ]);

  // Commit function for Transform
  const commitTransform = useCallback(() => {
    if (!transformState) return;

    // History is recorded at start of transform tool usage (when pixels are extracted),
    // OR should be recorded here?
    // We already recorded history when we extracted the pixels (pointerDown).
    // So committing just updates the pixels for the *current* state.

    const currentPixels = layerPixels[activeLayerId]; // This should be the version with cut pixels
    const newPixels = rasterizeTransform(
      currentPixels,
      transformState.sourcePixels,
      transformState,
      width,
      height,
      transformState.sourceWidth,
      transformState.sourceHeight,
    );

    const newMask = rasterizeTransformMask(
      null, // Start with empty mask
      transformState.sourceMask,
      transformState,
      width,
      height,
      transformState.sourceWidth,
      transformState.sourceHeight,
    );

    onUpdateLayerPixels(activeLayerId, newPixels);
    setSelectionMask(newMask);
    setTransformState(null);
  }, [
    transformState,
    layerPixels,
    activeLayerId,
    width,
    height,
    onUpdateLayerPixels,
    setSelectionMask,
  ]);

  // Reset transform when tool changes away from TRANSFORM
  useEffect(() => {
    if (selectedTool !== ToolType.TRANSFORM && transformState) {
      commitTransform();
    }
  }, [selectedTool, transformState, commitTransform]);

  // Draw the canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear
    ctx.clearRect(0, 0, width * zoom, height * zoom);

    // Apply Pan Offset
    ctx.save(); // Save 1 (Pan Transform)
    ctx.translate(panOffset.x, panOffset.y);

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
      if (
        layer.id === activeLayerId &&
        selectedTool === ToolType.TRANSFORM &&
        transformState
      ) {
        ctx.save();

        // Calculate center of transformation
        const cx =
          (transformState.x +
            (transformState.width * transformState.scaleX) / 2) *
          zoom;
        const cy =
          (transformState.y +
            (transformState.height * transformState.scaleY) / 2) *
          zoom;

        ctx.translate(cx, cy);
        ctx.rotate(transformState.rotation);
        ctx.scale(transformState.scaleX, transformState.scaleY);

        // Draw the source buffer centered at (0,0) in local transformed space
        const sw = transformState.sourceWidth * zoom;
        const sh = transformState.sourceHeight * zoom;

        transformState.sourcePixels.forEach((row, y) => {
          row.forEach((color, x) => {
            if (color) {
              ctx.fillStyle = color;
              // Offset by half width/height to center
              ctx.fillRect(x * zoom - sw / 2, y * zoom - sh / 2, zoom, zoom);
            }
          });
        });

        // Draw Border in Local Space
        ctx.strokeStyle = "#00ffcc";
        ctx.lineWidth =
          1 / Math.max(transformState.scaleX, transformState.scaleY); // Keep line width consistent visually
        ctx.strokeRect(-sw / 2, -sh / 2, sw, sh);

        ctx.restore();

        // Draw Handles (In Global Screen Space to prevent them from scaling/rotating weirdly)
        const corners = [
          {
            x: -transformState.sourceWidth / 2,
            y: -transformState.sourceHeight / 2,
            cursor: "nw-resize",
            id: "nw",
          },
          {
            x: transformState.sourceWidth / 2,
            y: -transformState.sourceHeight / 2,
            cursor: "ne-resize",
            id: "ne",
          },
          {
            x: transformState.sourceWidth / 2,
            y: transformState.sourceHeight / 2,
            cursor: "se-resize",
            id: "se",
          },
          {
            x: -transformState.sourceWidth / 2,
            y: transformState.sourceHeight / 2,
            cursor: "sw-resize",
            id: "sw",
          },
        ];

        const cos = Math.cos(transformState.rotation);
        const sin = Math.sin(transformState.rotation);

        ctx.save();
        ctx.fillStyle = "white";
        ctx.strokeStyle = "#00ffcc";

        // Rotation Handle
        const topY = -transformState.sourceHeight / 2 - 2; // 2 units above top
        const rX = topY * -sin * transformState.scaleY + cx;
        const rY = topY * cos * transformState.scaleY + cy;

        const topMidX =
          (-transformState.sourceHeight / 2) * -sin * transformState.scaleY +
          cx;
        const topMidY =
          (-transformState.sourceHeight / 2) * cos * transformState.scaleY + cy;
        ctx.beginPath();
        ctx.moveTo(topMidX, topMidY);
        ctx.lineTo(rX, rY);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rX, rY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        corners.forEach(c => {
          const lx = c.x * transformState.scaleX * zoom;
          const ly = c.y * transformState.scaleY * zoom;

          const rx = lx * cos - ly * sin;
          const ry = lx * sin + ly * cos;

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
      ctx.strokeStyle = gridColor || "rgba(255, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      const gSize = gridSize || 1;

      for (let x = 0; x <= width; x += gSize) {
        ctx.moveTo(x * zoom, 0);
        ctx.lineTo(x * zoom, height * zoom);
      }
      for (let y = 0; y <= height; y += gSize) {
        ctx.moveTo(0, y * zoom);
        ctx.lineTo(width * zoom, y * zoom);
      }
      ctx.stroke();
    }

    ctx.restore(); // Restore 1 (Pan Transform)

    // 3. Draw Selection Overlay
    if (selectionMask && selectedTool !== ToolType.TRANSFORM) {
      ctx.fillStyle = "rgba(100, 150, 255, 0.2)";
      ctx.strokeStyle = "#fff";
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
    if (
      activeLayer?.visible &&
      !activeLayer.locked &&
      previewPixel &&
      !floatingBuffer &&
      !transformState
    ) {
      ctx.strokeStyle =
        selectedTool === ToolType.ERASER ? "red" : "rgba(255,255,255,0.8)";
      ctx.lineWidth = 2;
      ctx.strokeRect(previewPixel.x * zoom, previewPixel.y * zoom, zoom, zoom);
    }

    // 5. Draw Lasso Path
    if (selectedTool === ToolType.LASSO && lassoPoints.length > 0) {
      ctx.strokeStyle = "#00ffcc";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(lassoPoints[0].x * zoom, lassoPoints[0].y * zoom);
      for (let i = 1; i < lassoPoints.length; i++) {
        ctx.lineTo(lassoPoints[i].x * zoom, lassoPoints[i].y * zoom);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 6. Draw Rectangle Selection Preview
    if (
      selectedTool === ToolType.SELECT &&
      isDrawing &&
      selectionStart &&
      selectionEnd
    ) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const w = Math.abs(selectionEnd.x - selectionStart.x) + 1;
      const h = Math.abs(selectionEnd.y - selectionStart.y) + 1;

      ctx.strokeStyle = "#fff";
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeRect(minX * zoom, minY * zoom, w * zoom, h * zoom);

      ctx.fillStyle = "rgba(100, 150, 255, 0.2)";
      ctx.fillRect(minX * zoom, minY * zoom, w * zoom, h * zoom);

      ctx.setLineDash([]);
    }
  }, [
    layers,
    layerPixels,
    activeLayerId,
    width,
    height,
    zoom,
    gridVisible,
    previewPixel,
    selectedTool,
    selectionMask,
    floatingBuffer,
    floatingOffset,
    transformState,
    panOffset,
    selectionStart,
    selectionEnd,
    gridColor,
    gridSize,
    isDrawing,
    lassoPoints.length,
    lassoPoints[0]?.x,
    lassoPoints[0]?.y,
  ]);

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Adjust coordinates for Pan
    const rect = canvas.getBoundingClientRect();

    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    const coords = {
      x: Math.floor((rawX - panOffset.x) / zoom),
      y: Math.floor((rawY - panOffset.y) / zoom),
    };

    // Check for Transform Handle Hits
    if (selectedTool === ToolType.TRANSFORM && transformState) {
      // Transform interaction logic remains same...
      // [Omitted redundant hit test logic for brevity, keeping structure]
      // Logic to detect handle clicks:
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else return;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      // Re-calculate handle positions and check hits...
      const cx =
        (transformState.x +
          (transformState.width * transformState.scaleX) / 2) *
        zoom;
      const cy =
        (transformState.y +
          (transformState.height * transformState.scaleY) / 2) *
        zoom;
      const cos = Math.cos(transformState.rotation);
      const sin = Math.sin(transformState.rotation);

      const topY = -transformState.sourceHeight / 2 - 2;
      const rX = topY * -sin * transformState.scaleY * zoom + cx;
      const rY = topY * cos * transformState.scaleY * zoom + cy;

      if (Math.hypot(mx - rX, my - rY) < 10) {
        setActiveHandle("rotate");
        setTransformStart({
          mouse: { x: mx, y: my },
          state: { ...transformState },
        });
        setIsDrawing(true);
        return;
      }

      const corners = [
        {
          x: -transformState.sourceWidth / 2,
          y: -transformState.sourceHeight / 2,
          id: "nw",
        },
        {
          x: transformState.sourceWidth / 2,
          y: -transformState.sourceHeight / 2,
          id: "ne",
        },
        {
          x: transformState.sourceWidth / 2,
          y: transformState.sourceHeight / 2,
          id: "se",
        },
        {
          x: -transformState.sourceWidth / 2,
          y: transformState.sourceHeight / 2,
          id: "sw",
        },
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
          setTransformStart({
            mouse: { x: mx, y: my },
            state: { ...transformState },
          });
          setIsDrawing(true);
          return;
        }
      }

      if (
        Math.hypot(mx - cx, my - cy) <
        (Math.max(transformState.width, transformState.height) * zoom) / 2
      ) {
        setActiveHandle("move");
        setTransformStart({
          mouse: { x: mx, y: my },
          state: { ...transformState },
        });
        setIsDrawing(true);
        return;
      }

      commitTransform();
      return;
    }

    if (!coords) return;

    if (selectedTool === ToolType.TRANSFORM && !transformState) {
      // Record history before cutting pixels for transform
      onDrawStart();

      // Initialize Transform logic
      let bounds = { minX: 0, minY: 0, maxX: width, maxY: height };
      let mask = selectionMask;

      if (selectionMask) {
        let minX = width,
          minY = height,
          maxX = 0,
          maxY = 0;
        let hasSelection = false;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            if (selectionMask[y][x]) {
              hasSelection = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        if (hasSelection) {
          bounds = { minX, minY, maxX: maxX + 1, maxY: maxY + 1 };
        } else {
          mask = null;
        }
      } else {
        mask = Array(height)
          .fill(true)
          .map(() => Array(width).fill(true));
      }

      const w = bounds.maxX - bounds.minX;
      const h = bounds.maxY - bounds.minY;

      const currentPixels = layerPixels[activeLayerId];
      if (!mask) {
        return;
      }
      const { cutPixels, floatingPixels } = extractSelectedPixels(
        currentPixels,
        mask,
        width,
        height,
      );

      const croppedPixels = Array(h)
        .fill(null)
        .map(() => Array(w).fill(null));
      const croppedMask = Array(h)
        .fill(false)
        .map(() => Array(w).fill(false));

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          croppedPixels[y][x] =
            floatingPixels[y + bounds.minY][x + bounds.minX];
          croppedMask[y][x] = mask?.[y + bounds.minY][x + bounds.minX];
        }
      }

      onUpdateLayerPixels(activeLayerId, cutPixels);
      setSelectionMask(null);

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
        sourceHeight: h,
      });
      return;
    }

    if (selectedTool === ToolType.HAND) {
      setIsPanning(true);
      setPanStart({ x: clientX, y: clientY });
      return;
    }

    if (selectedTool === ToolType.MOVE) {
      if (selectionMask) {
        // Record history before move starts
        onDrawStart();
        setDragStart(coords);
        const currentPixels = layerPixels[activeLayerId];
        const { cutPixels, floatingPixels } = extractSelectedPixels(
          currentPixels,
          selectionMask,
          width,
          height,
        );
        setFloatingBuffer(floatingPixels);
        setFloatingOffset({ x: 0, y: 0 });
        onUpdateLayerPixels(activeLayerId, cutPixels);
      }
      return;
    }

    if (selectedTool === ToolType.LASSO) {
      setLassoPoints([coords]);
      setIsDrawing(true);
      return;
    }

    if (selectedTool === ToolType.SELECT) {
      if (selectMode === SelectMode.BRUSH) {
        // Selection Brush Logic
        onDrawStart(); // Record history
        setIsDrawing(true);
        handleDraw(e);
        return;
      }
      setSelectionStart(coords);
      setSelectionEnd(coords);
      setSelectionMask(null);
      setIsDrawing(true);
      return;
    }

    // Standard Drawing Tools
    // Don't record history for PICKER or SELECT since they don't modify pixels directly/destructively in a way we want to revert stroke-by-stroke usually?
    // Wait, SELECT modifies selection mask. We do want undo for selection changes.
    // PICKER modifies color state in App, not pixels. App handles that? No, Toolbar passes setPrimaryColor.
    // If we want undo for color picking, we'd need to record history on setPrimaryColor.
    // Usually undo is for canvas changes.

    if (selectedTool !== ToolType.PICKER) {
      onDrawStart();
    }

    setIsDrawing(true);
    handleDraw(e);
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Handle Transform Drag
    if (
      isDrawing &&
      selectedTool === ToolType.TRANSFORM &&
      transformState &&
      activeHandle &&
      transformStart
    ) {
      // [Omitted redundant handle logic, keeping structure]
      // Handle move/rotate/scale updates to setTransformState...
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        if (e.touches.length > 0) {
          clientX = e.touches[0].clientX;
          clientY = e.touches[0].clientY;
        } else return;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      const mx = clientX - rect.left;
      const my = clientY - rect.top;

      const dx = (mx - transformStart.mouse.x) / zoom;
      const dy = (my - transformStart.mouse.y) / zoom;

      if (activeHandle === "move") {
        setTransformState({
          ...transformState,
          x: transformStart.state.x + dx,
          y: transformStart.state.y + dy,
        });
      } else if (activeHandle === "rotate") {
        const cx =
          (transformState.x +
            (transformState.width * transformState.scaleX) / 2) *
          zoom;
        const cy =
          (transformState.y +
            (transformState.height * transformState.scaleY) / 2) *
          zoom;

        const angleStart = Math.atan2(
          transformStart.mouse.y - cy,
          transformStart.mouse.x - cx,
        );
        const angleCurr = Math.atan2(my - cy, mx - cx);

        setTransformState({
          ...transformState,
          rotation: transformStart.state.rotation + (angleCurr - angleStart),
        });
      } else {
        const sx = transformStart.state.scaleX;
        const sy = transformStart.state.scaleY;
        const cx =
          transformStart.state.x * zoom +
          (transformStart.state.width * zoom * sx) / 2;
        const cy =
          transformStart.state.y * zoom +
          (transformStart.state.height * zoom * sy) / 2;
        const startDist = Math.hypot(
          transformStart.mouse.x - cx,
          transformStart.mouse.y - cy,
        );
        const currDist = Math.hypot(mx - cx, my - cy);
        const ratio = currDist / startDist;

        setTransformState({
          ...transformState,
          scaleX: sx * ratio,
          scaleY: sy * ratio,
        });
      }
      return;
    }

    // Hand Tool Panning
    if (isPanning && selectedTool === ToolType.HAND) {
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
      const clientY =
        "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

      const dx = clientX - panStart.x;
      const dy = clientY - panStart.y;

      setPanOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: clientX, y: clientY });
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const rawX =
      ("touches" in e
        ? e.touches[0].clientX
        : (e as React.MouseEvent).clientX) - rect.left;
    const rawY =
      ("touches" in e
        ? e.touches[0].clientY
        : (e as React.MouseEvent).clientY) - rect.top;

    const coords = {
      x: Math.floor((rawX - panOffset.x) / zoom),
      y: Math.floor((rawY - panOffset.y) / zoom),
    };

    if (onCursorMove) {
      onCursorMove(coords.x, coords.y);
    }

    if (
      coords &&
      coords.x >= 0 &&
      coords.x < width &&
      coords.y >= 0 &&
      coords.y < height
    ) {
      setPreviewPixel(coords);
    } else {
      setPreviewPixel(null);
    }

    if (isDrawing) {
      if (
        selectedTool === ToolType.MOVE &&
        dragStart &&
        floatingBuffer &&
        coords
      ) {
        const dx = coords.x - dragStart.x;
        const dy = coords.y - dragStart.y;
        setFloatingOffset({ x: dx, y: dy });
        return;
      }
      handleDraw(e);
    }

    if (isDrawing && (selectedTool as ToolType) === ToolType.LASSO && coords) {
      // Debounce? No, just add point if different
      setLassoPoints(prev => {
        const last = prev[prev.length - 1];
        if (last && last.x === coords.x && last.y === coords.y) return prev;
        return [...prev, coords];
      });
    }

    if (isDrawing && selectedTool === ToolType.SELECT && coords) {
      setSelectionEnd(coords);
    }
  };

  const handlePointerUp = () => {
    if (selectedTool === ToolType.MOVE && floatingBuffer) {
      const currentPixels = layerPixels[activeLayerId];
      const mergedPixels = mergePixels(
        currentPixels,
        floatingBuffer,
        floatingOffset.x,
        floatingOffset.y,
        width,
        height,
      );
      onUpdateLayerPixels(activeLayerId, mergedPixels);
      if (selectionMask) {
        const newMask = shiftMask(
          selectionMask,
          floatingOffset.x,
          floatingOffset.y,
          width,
          height,
        );
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

    if (selectedTool === ToolType.HAND) {
      setIsPanning(false);
    }

    if (selectedTool === ToolType.LASSO) {
      if (lassoPoints.length > 2) {
        const mask = rasterizePolygon(lassoPoints, width, height);
        setSelectionMask(mask);
      }
      setLassoPoints([]);
      setIsDrawing(false);
      return;
    }

    if (
      selectedTool === ToolType.SELECT &&
      isDrawing &&
      selectionStart &&
      selectionEnd
    ) {
      const minX = Math.min(selectionStart.x, selectionEnd.x);
      const minY = Math.min(selectionStart.y, selectionEnd.y);
      const maxX = Math.max(selectionStart.x, selectionEnd.x);
      const maxY = Math.max(selectionStart.y, selectionEnd.y);

      const newMask = Array(height)
        .fill(false)
        .map(() => Array(width).fill(false));
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            newMask[y][x] = true;
          }
        }
      }
      setSelectionMask(newMask);
      setSelectionStart(null);
      setSelectionEnd(null);
      setIsDrawing(false);
      return;
    }

    setIsDrawing(false);
  };

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const coords = getCoordinates(e, canvas, zoom);
    if (!coords) return;
    const { x, y } = coords;

    // Selection Brush Logic (Bypasses layer locks)
    if (selectedTool === ToolType.SELECT && selectMode === SelectMode.BRUSH) {
      // Use primary color? No, use boolean true.
      // Maybe use Alt key to subtract? (value = !e.altKey)
      // For now simple additive brush.
      const newMask = drawOnMask(
        selectionMask,
        x,
        y,
        3, // Brush size
        true, // Add
        width,
        height,
      );
      setSelectionMask(newMask);
      return;
    }

    const activeLayer = layers.find(l => l.id === activeLayerId);
    if (!activeLayer || !activeLayer.visible || activeLayer.locked) return;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const currentPixels = layerPixels[activeLayerId] || [];
    if (!currentPixels.length) return;

    // Handle Selection Interactions
    if (selectedTool === ToolType.MAGIC_WAND) {
      if (isDrawing && (e.type === "mousedown" || e.type === "touchstart")) {
        const mask = magicWandSelect(
          currentPixels,
          x,
          y,
          width,
          height,
          wandTolerance,
        );
        setSelectionMask(mask);
        setIsDrawing(false);
      }
      return;
    }

    if (selectionMask && !selectionMask[y][x]) {
      if (selectedTool === ToolType.SELECT) {
        if (e.type === "mousedown" || e.type === "touchstart") {
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
      const newPixels = floodFill(
        currentPixels,
        x,
        y,
        primaryColor,
        width,
        height,
        selectionMask || undefined,
      );
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

  // Container ref for wheel event handling
  const containerRef = useRef<HTMLDivElement>(null);

  // Add container wheel handler for zoom using ref
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();

        const direction = e.deltaY < 0 ? 1 : -1;
        const currentZoom = zoom;
        let newZoom = currentZoom + direction * 0.1;

        // Apply acceleration for higher zoom levels
        if (currentZoom >= 16) newZoom = currentZoom + direction * 0.2;
        if (currentZoom >= 32) newZoom = currentZoom + direction * 0.4;

        // Apply bounds
        newZoom = Math.max(0.1, Math.min(64, newZoom));

        if (Math.abs(newZoom - currentZoom) > 0.01) {
          console.log(
            "[ZOOM WHEEL] Changing zoom from",
            currentZoom,
            "to",
            newZoom,
          );
          onZoomChange(newZoom);
        }
      }
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [zoom, onZoomChange]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-auto flex items-center justify-center bg-gray-900 checkerboard editor-canvas-container"
    >
      <canvas
        ref={canvasRef}
        width={width * zoom}
        height={height * zoom}
        className={`bg-transparent touch-none ${selectedTool === ToolType.TRANSFORM || selectedTool === ToolType.MOVE ? "cursor-default" : "cursor-crosshair"}`}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => {
          if (onCursorMove) onCursorMove(null, null);
          if (
            selectedTool !== ToolType.MOVE &&
            selectedTool !== ToolType.TRANSFORM
          ) {
            setIsDrawing(false);
          }
          setPreviewPixel(null);
        }}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        onContextMenu={onContextMenu}
      />
    </div>
  );
};

export default EditorCanvas;
