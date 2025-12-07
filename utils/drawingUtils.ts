import type React from "react";
import type { Coordinates } from "../types";

export const getCoordinates = (
  e: React.MouseEvent | React.TouchEvent,
  canvas: HTMLCanvasElement,
  zoom: number,
): Coordinates | null => {
  const rect = canvas.getBoundingClientRect();
  let clientX: number, clientY: number;

  if ("touches" in e) {
    if (e.touches.length === 0) return null;
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = (e as React.MouseEvent).clientX;
    clientY = (e as React.MouseEvent).clientY;
  }

  const x = Math.floor((clientX - rect.left) / zoom);
  const y = Math.floor((clientY - rect.top) / zoom);

  return { x, y };
};

// Flood fill algorithm
export const floodFill = (
  pixels: (string | null)[][],
  startX: number,
  startY: number,
  fillColor: string,
  width: number,
  height: number,
  selectionMask?: boolean[][],
): (string | null)[][] => {
  const targetColor = pixels[startY][startX];
  if (targetColor === fillColor) return pixels;

  const newPixels = pixels.map(row => [...row]);
  const stack: [number, number][] = [[startX, startY]];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const pop = stack.pop();
    if (!pop) continue;
    const [x, y] = pop;
    const key = `${x},${y}`;
    if (seen.has(key)) continue;
    seen.add(key);

    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    // If selection mask is active, only fill within selection
    if (selectionMask && !selectionMask[y][x]) continue;

    if (newPixels[y][x] !== targetColor) continue;

    newPixels[y][x] = fillColor;

    stack.push([x + 1, y]);
    stack.push([x - 1, y]);
    stack.push([x, y + 1]);
    stack.push([x, y - 1]);
  }

  return newPixels;
};

// Magic Wand Selection (returns mask)
export const magicWandSelect = (
  pixels: (string | null)[][],
  startX: number,
  startY: number,
  width: number,
  height: number,
): boolean[][] => {
  const targetColor = pixels[startY][startX];
  const mask = Array(height)
    .fill(false)
    .map(() => Array(width).fill(false));
  const stack: [number, number][] = [[startX, startY]];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const pop = stack.pop();
    if (!pop) continue;
    const [x, y] = pop;
    const key = `${x},${y}`;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (seen.has(key)) continue;
    seen.add(key);

    if (pixels[y][x] === targetColor) {
      mask[y][x] = true;
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }
  }

  return mask;
};

export const replaceColor = (
  pixels: (string | null)[][],
  targetColor: string | null,
  replacementColor: string | null,
): (string | null)[][] => {
  return pixels.map(row =>
    row.map(cell => (cell === targetColor ? replacementColor : cell)),
  );
};

// Helper to initialize empty grid
export const createEmptyGrid = (
  width: number,
  height: number,
): (string | null)[][] => {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));
};

export const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
};

// --- Move Tool Helpers ---

export const extractSelectedPixels = (
  pixels: (string | null)[][],
  mask: boolean[][],
  width: number,
  height: number,
): { cutPixels: (string | null)[][]; floatingPixels: (string | null)[][] } => {
  const cutPixels = pixels.map(row => [...row]);
  const floatingPixels = createEmptyGrid(width, height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x]) {
        floatingPixels[y][x] = pixels[y][x];
        cutPixels[y][x] = null; // Clear from original
      }
    }
  }

  return { cutPixels, floatingPixels };
};

export const mergePixels = (
  basePixels: (string | null)[][],
  floatingPixels: (string | null)[][],
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): (string | null)[][] => {
  const merged = basePixels.map(row => [...row]);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = floatingPixels[y][x];
      if (pixel) {
        const targetX = x + offsetX;
        const targetY = y + offsetY;

        if (
          targetX >= 0 &&
          targetX < width &&
          targetY >= 0 &&
          targetY < height
        ) {
          merged[targetY][targetX] = pixel;
        }
      }
    }
  }
  return merged;
};

export const shiftMask = (
  mask: boolean[][],
  offsetX: number,
  offsetY: number,
  width: number,
  height: number,
): boolean[][] => {
  const newMask = Array(height)
    .fill(false)
    .map(() => Array(width).fill(false));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x]) {
        const targetX = x + offsetX;
        const targetY = y + offsetY;
        if (
          targetX >= 0 &&
          targetX < width &&
          targetY >= 0 &&
          targetY < height
        ) {
          newMask[targetY][targetX] = true;
        }
      }
    }
  }
  return newMask;
};

// --- Transform Logic ---

interface TransformData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // Radians
  scaleX: number;
  scaleY: number;
}

export const rasterizeTransform = (
  basePixels: (string | null)[][],
  sourcePixels: (string | null)[][],
  transform: TransformData,
  gridWidth: number,
  gridHeight: number,
  sourceWidth: number, // Width of buffer/selection bounds
  sourceHeight: number, // Height of buffer/selection bounds
): (string | null)[][] => {
  // We use Inverse Mapping:
  // For every pixel in the DESTINATION grid, we calculate where it came from in the SOURCE grid.
  // If it hits a valid pixel, we paint it.

  const output = basePixels.map(row => [...row]);

  // Precompute Trig
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);

  // Center of the transformed box (Pivot)
  // We treat (x,y) in transform as top-left of the bounding box
  const centerX = transform.x + (transform.width * transform.scaleX) / 2;
  const centerY = transform.y + (transform.height * transform.scaleY) / 2;

  // We only need to iterate over the bounding box of the transformed shape to save performance,
  // but iterating full grid is safer/easier for correct implementation.
  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      // 1. Translate pixel to origin relative to pivot
      const dx = x - centerX;
      const dy = y - centerY;

      // 2. Rotate backwards
      const rx = dx * cos + dy * sin;
      const ry = -dx * sin + dy * cos;

      // 3. Scale backwards
      const sx = rx / transform.scaleX;
      const sy = ry / transform.scaleY;

      // 4. Translate back to local source coordinates (0 to sourceWidth)
      // The source pixels are centered in the source buffer relative to the pivot logic.
      // Source Buffer center is sourceWidth/2, sourceHeight/2
      const srcX = Math.round(sx + sourceWidth / 2);
      const srcY = Math.round(sy + sourceHeight / 2);

      if (srcX >= 0 && srcX < sourceWidth && srcY >= 0 && srcY < sourceHeight) {
        const color = sourcePixels[srcY][srcX];
        if (color) {
          output[y][x] = color;
        }
      }
    }
  }

  return output;
};

// Same logic as above but for boolean mask
export const rasterizeTransformMask = (
  baseMask: boolean[][] | null,
  sourceMask: boolean[][], // The mask cutout
  transform: TransformData,
  gridWidth: number,
  gridHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): boolean[][] => {
  const output = baseMask
    ? baseMask.map(row => [...row])
    : Array(gridHeight)
        .fill(false)
        .map(() => Array(gridWidth).fill(false));

  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  const centerX = transform.x + (transform.width * transform.scaleX) / 2;
  const centerY = transform.y + (transform.height * transform.scaleY) / 2;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const rx = dx * cos + dy * sin;
      const ry = -dx * sin + dy * cos;
      const sx = rx / transform.scaleX;
      const sy = ry / transform.scaleY;
      const srcX = Math.round(sx + sourceWidth / 2);
      const srcY = Math.round(sy + sourceHeight / 2);

      if (srcX >= 0 && srcX < sourceWidth && srcY >= 0 && srcY < sourceHeight) {
        if (sourceMask[srcY][srcX]) {
          output[y][x] = true;
        }
      }
    }
  }
  return output;
};

// --- Selection Mask Helpers ---

export const createEmptyMask = (width: number, height: number): boolean[][] => {
  return Array(height)
    .fill(false)
    .map(() => Array(width).fill(false));
};

export const invertMask = (mask: boolean[][]): boolean[][] => {
  return mask.map(row => row.map(val => !val));
};

export const expandMask = (
  mask: boolean[][],
  width: number,
  height: number,
): boolean[][] => {
  const newMask = mask.map(row => [...row]);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x]) {
        if (x + 1 < width) newMask[y][x + 1] = true;
        if (x - 1 >= 0) newMask[y][x - 1] = true;
        if (y + 1 < height) newMask[y + 1][x] = true;
        if (y - 1 >= 0) newMask[y - 1][x] = true;
      }
    }
  }
  return newMask;
};

export const contractMask = (
  mask: boolean[][],
  width: number,
  height: number,
): boolean[][] => {
  const newMask = createEmptyMask(width, height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y][x]) {
        const n = y > 0 ? mask[y - 1][x] : false;
        const s = y < height - 1 ? mask[y + 1][x] : false;
        const e = x < width - 1 ? mask[y][x + 1] : false;
        const w = x > 0 ? mask[y][x - 1] : false;
        if (n && s && e && w) {
          newMask[y][x] = true;
        }
      }
    }
  }
  return newMask;
};

// --- Lasso / Polygon Logic ---

export const rasterizePolygon = (
  points: Coordinates[],
  width: number,
  height: number,
): boolean[][] => {
  const mask = createEmptyMask(width, height);
  if (points.length < 3) return mask;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  points.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  // Clamp to grid
  minX = Math.max(0, minX);
  minY = Math.max(0, minY);
  maxX = Math.min(width - 1, maxX);
  maxY = Math.min(height - 1, maxY);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon(x, y, points)) {
        mask[y][x] = true;
      }
    }
  }

  return mask;
};

const pointInPolygon = (
  x: number,
  y: number,
  points: Coordinates[],
): boolean => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x,
      yi = points[i].y;
    const xj = points[j].x,
      yj = points[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};
