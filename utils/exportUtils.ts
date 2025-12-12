import * as _gifenc from "gifenc";
import type { Frame, Layer } from "../types.ts";

// Fix for gifenc import if needed (copying from App.tsx)
const gifenc =
  (_gifenc as unknown as typeof _gifenc & { default?: typeof _gifenc })
    .default ?? _gifenc;
const { GIFEncoder, quantize, applyPalette } = gifenc;

export const renderFrameToCanvas = (
  frame: Frame,
  layers: Layer[],
  width: number,
  height: number,
  scale: number = 1,
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = false;

  // Clear
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  layers.forEach(layer => {
    if (!layer.visible) return;
    const pixels = frame.layers[layer.id];
    if (!pixels) return;

    ctx.globalAlpha = layer.opacity;
    pixels.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      });
    });
  });
  ctx.globalAlpha = 1.0;
  return canvas;
};

export const createGif = (
  frames: Frame[],
  layers: Layer[],
  width: number,
  height: number,
  fps: number,
  scale: number = 1,
  loop: number = 0,
) => {
  if (frames.length === 0) return;
  const gif = new GIFEncoder();

  for (const frame of frames) {
    // Render frame
    // Render frame
    // Quantize needs 1x usually, then we scale?
    // Wait, gifenc handles pixels. If we want SCALED gif, we should render scaled.
    // Let's render scaled.
    const scaledCanvas = renderFrameToCanvas(
      frame,
      layers,
      width,
      height,
      scale,
    );

    const ctx = scaledCanvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) continue;

    const imageData = ctx.getImageData(0, 0, width * scale, height * scale);
    const { data } = imageData;

    const palette = quantize(new Uint8Array(data.buffer), 256, {
      format: "rgba4444",
    });
    const index = applyPalette(
      new Uint8Array(data.buffer),
      palette,
      "rgba4444",
    );
    const delay = Math.round(1000 / fps / 10); // gifenc uses 10ms units? No, standard is 1/100s usually?
    // App.tsx: Math.round(1000 / fps / 10); -> 1000ms / 12fps = 83ms. / 10 = 8.3 -> 8.
    // GIF delay is in 100ths of a second (cs). 8 * 10ms = 80ms. Correct.

    gif.writeFrame(index, width * scale, height * scale, {
      palette,
      delay,
      transparent: true,
      repeat: loop,
    });
  }

  gif.finish();
  const buffer = gif.bytes();
  const blob = new Blob([buffer as unknown as BlobPart], {
    type: "image/gif",
  });
  const url = URL.createObjectURL(blob);
  downloadBlob(url, "animation.gif");
};

export const createSpriteSheet = (
  frames: Frame[],
  layers: Layer[],
  width: number,
  height: number,
  columns: number,
  padding: number = 0,
  format: "png" | "data-uri",
) => {
  const rows = Math.ceil(frames.length / columns);
  const sheetWidth = columns * width + (columns - 1) * padding;
  const sheetHeight = rows * height + (rows - 1) * padding;

  const canvas = document.createElement("canvas");
  canvas.width = sheetWidth;
  canvas.height = sheetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  frames.forEach((frame, idx) => {
    const col = idx % columns;
    const row = Math.floor(idx / columns);
    const x = col * (width + padding);
    const y = row * (height + padding);

    const fCanvas = renderFrameToCanvas(frame, layers, width, height);
    ctx.drawImage(fCanvas, x, y);
  });

  if (format === "png") {
    const url = canvas.toDataURL("image/png");
    downloadBlob(url, "spritesheet.png");
  } else {
    const url = canvas.toDataURL("image/png");
    const win = window.open();
    win?.document.write(`<img src="${url}"/>`);
  }
};

export const framesToDataURL = async (
  frames: Frame[],
  layers: Layer[],
  width: number,
  height: number,
): Promise<string[]> => {
  return frames.map(frame => {
    const canvas = renderFrameToCanvas(frame, layers, width, height);
    return canvas.toDataURL("image/png");
  });
};

export const downloadBlob = (dataUrlOrBlobUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataUrlOrBlobUrl; // Can be data URI or Blob URL
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (dataUrlOrBlobUrl.startsWith("blob:")) {
    URL.revokeObjectURL(dataUrlOrBlobUrl);
  }
};
