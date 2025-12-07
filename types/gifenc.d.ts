declare module "gifenc" {
  export class GIFEncoder {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      options?: {
        palette?: unknown;
        delay?: number;
        transparent?: boolean;
        repeat?: number;
      },
    ): void;
    finish(): void;
    bytes(): Uint8Array;
  }

  export function quantize(
    data: Uint8Array,
    colors: number,
    options?: {
      format?: string;
    },
  ): unknown;

  export function applyPalette(
    data: Uint8Array,
    palette: unknown,
    format?: string,
  ): Uint8Array;
}
