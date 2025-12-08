import { type Frame } from "../types";
import { createEmptyGrid } from "../utils/drawingUtils";

export interface TransformOptions {
  scaleX?: number; // percentage (e.g., 100 = 1x)
  scaleY?: number; // percentage
  rotate?: number; // degrees
  width?: number; // explicit pixel width
  height?: number; // explicit pixel height
  maintainAspectRatio?: boolean;
}

/**
 * Rotates a point (x, y) around a center (cx, cy) by angle degrees.
 */
const rotatePoint = (
  x: number,
  y: number,
  cx: number,
  cy: number,
  angleRad: number,
) => {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const nx = cos * (x - cx) - sin * (y - cy) + cx;
  const ny = sin * (x - cx) + cos * (y - cy) + cy;
  return { x: nx, y: ny };
};

/**
 * Transforms a specific layer's pixel data using Nearest Neighbor interpolation.
 */
export const transformLayer = (
  currentGrid: (string | null)[][], // We need the grid data, not just the layer metadata
  options: TransformOptions,
  canvasWidth: number,
  canvasHeight: number,
): (string | null)[][] => {
  // 1. Calculate new dimensions if scaling
  const scaleX = (options.scaleX ?? 100) / 100;
  const scaleY = (options.scaleY ?? 100) / 100;
  const angleDeg = options.rotate ?? 0;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Create new empty grid
  const newGrid = createEmptyGrid(canvasWidth, canvasHeight);

  // We perform backward mapping: for each pixel in the destination (newGrid),
  // we find which pixel in the source (currentGrid) it corresponds to.

  // Center of image for rotation
  const cx = canvasWidth / 2;
  const cy = canvasHeight / 2;

  for (let destY = 0; destY < canvasHeight; destY++) {
    for (let destX = 0; destX < canvasWidth; destX++) {
      // 1. Inverse Rotation
      // To find the source point, we rotate -angle around center
      // However, we normally rotate around center of the image.
      // If we want to rotate around center of selection, that's different.
      // Assuming full layer rotation around canvas center for now.

      let srcX = destX;
      let srcY = destY;

      // Translate to center, rotate, translate back
      const rotated = rotatePoint(destX, destY, cx, cy, -angleRad);
      srcX = rotated.x;
      srcY = rotated.y;

      // 2. Inverse Scaling
      // Scale is applied relative to center as well usually, or top-left.
      // Let's do center-based scaling to feel natural in a full-canvas transform.
      srcX = (srcX - cx) / scaleX + cx;
      srcY = (srcY - cy) / scaleY + cy;

      // Nearest Neighbor: Round to nearest integer
      const nearestX = Math.round(srcX);
      const nearestY = Math.round(srcY);

      // Check bounds
      if (
        nearestX >= 0 &&
        nearestX < canvasWidth &&
        nearestY >= 0 &&
        nearestY < canvasHeight
      ) {
        newGrid[destY][destX] = currentGrid[nearestY][nearestX];
      }
    }
  }

  return newGrid;
};

/**
 * Transforms an entire frame (all layers).
 */
export const transformFrame = (
  frame: Frame,
  options: TransformOptions,
  width: number,
  height: number,
): Frame => {
  const newLayers: Record<string, (string | null)[][]> = {};

  Object.entries(frame.layers).forEach(([layerId, grid]) => {
    // metadata layer object is not strictly needed for the transform logic itself,
    // passing a dummy or minimal object if we refactor transformLayer signature,
    // but here we just need the grid.
    // Let's adjust transformLayer to take grid directly in future refactors,
    // but for now we fit the signature by passing a dummy layer or modifying signature.
    // Actually, let's just pass the grid to the function we wrote above.

    // We reuse the transformLayer logic but we need to satisfy the types if we were strictly following the interface.
    // But since I implemented transformLayer above to take 'currentGrid' as 2nd arg, we use that.

    newLayers[layerId] = transformLayer(grid, options, width, height);
  });

  return {
    ...frame,
    layers: newLayers,
  };
};

/**
 * Transforms the current selection (if any).
 */
export const transformSelection = (
  selectionId: string,
  options: TransformOptions,
): void => {
  console.log(`Transforming Selection ${selectionId}:`, options);
  // Todo: Apply transform to the active selection buffer
};
