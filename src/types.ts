export type RGB = [number, number, number];
export interface Color {
  hex: string;
  rgb: [number, number, number];
  percentage: number;
}
export type ColorPalette = Array<Color>;
