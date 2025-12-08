import { type Frame, type Layer } from "../types";

export interface TransformOptions {
  scaleX?: number; // percentage (e.g., 100 = 1x)
  scaleY?: number; // percentage
  rotate?: number; // degrees
  width?: number; // explicit pixel width
  height?: number; // explicit pixel height
  maintainAspectRatio?: boolean;
}

/**
 * Transforms a specific layer's pixel data.
 * NOTE: This is a robust stub. Actual pixel manipulation (bicubic/bilinear) would go here.
 * For now, it returns the original layer but logs the operation,
 * ready to be connected to the canvas rendering context or a pixel manipulation library.
 */
export const transformLayer = (
  layer: Layer,
  options: TransformOptions,
): Layer => {
  console.log(`Transforming Layer ${layer.id}:`, options);
  // Todo: Implement actual pixel array resizing/rotation
  return layer;
};

/**
 * Transforms an entire frame (all layers).
 */
export const transformFrame = (
  frame: Frame,
  options: TransformOptions,
): Frame => {
  console.log(`Transforming Frame ${frame.id}:`, options);
  // Todo: Iterate all layers in frame and apply transformLayer
  return frame;
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
