import { createEmptyGrid } from "./drawingUtils.ts";

export interface TransformOptions {
  scaleX: number;
  scaleY: number;
  rotation: number; // Degrees
  offsetX: number;
  offsetY: number;
  interpolation: "nearest" | "bicubic"; // Placeholder for future
}

export const transformLayer = (
  pixels: (string | null)[][],
  width: number,
  height: number,
  options: TransformOptions,
): (string | null)[][] => {
  const newGrid = createEmptyGrid(width, height);
  const cx = width / 2;
  const cy = height / 2;
  const rads = (options.rotation * Math.PI) / 180;
  const cos = Math.cos(-rads); // Inverse rotation for mapping
  const sin = Math.sin(-rads);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // 1. Translation (Inverse)
      let srcX = x - options.offsetX;
      let srcY = y - options.offsetY;

      // 2. Rotation (Inverse) around center
      // Translate to center
      srcX -= cx;
      srcY -= cy;
      // Rotate
      const rx = srcX * cos - srcY * sin;
      const ry = srcX * sin + srcY * cos;
      // Translate back
      srcX = rx + cx;
      srcY = ry + cy;

      // 3. Scaling (Inverse)
      // Scale relative to center?
      srcX = (srcX - cx) / options.scaleX + cx;
      srcY = (srcY - cy) / options.scaleY + cy;

      // Nearest Neighbor
      const ix = Math.round(srcX);
      const iy = Math.round(srcY);

      if (ix >= 0 && ix < width && iy >= 0 && iy < height) {
        newGrid[y][x] = pixels[iy][ix];
      }
    }
  }

  return newGrid;
};

// Interface for the interactive transform tool state
export interface TransformState {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // Radians
  scaleX: number;
  scaleY: number;
  sourcePixels: (string | null)[][];
  sourceMask: boolean[][];
  sourceWidth: number;
  sourceHeight: number;
}

// Rasterize the transient transform state onto the canvas grid
export const rasterizeTransform = (
  basePixels: (string | null)[][],
  sourcePixels: (string | null)[][],
  transform: TransformState,
  gridWidth: number,
  gridHeight: number,
  sourceWidth: number,
  sourceHeight: number,
): (string | null)[][] => {
  const output = basePixels.map(row => [...row]);

  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);

  // Center of the transformed box
  const centerX = transform.x + (transform.width * transform.scaleX) / 2;
  const centerY = transform.y + (transform.height * transform.scaleY) / 2;

  for (let y = 0; y < gridHeight; y++) {
    for (let x = 0; x < gridWidth; x++) {
      // Inverse Mapping
      const dx = x - centerX;
      const dy = y - centerY;

      // Rotate backwards
      const rx = dx * cos + dy * sin;
      const ry = -dx * sin + dy * cos;

      // Scale backwards
      const sx = rx / transform.scaleX;
      const sy = ry / transform.scaleY;

      // Translate back to source local coords
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

export const rasterizeTransformMask = (
  baseMask: boolean[][] | null,
  sourceMask: boolean[][],
  transform: TransformState,
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
