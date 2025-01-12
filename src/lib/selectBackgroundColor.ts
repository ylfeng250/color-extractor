import { colorDistance } from "./shared";
import { ColorPalette, RGB } from "../types";

// 选择背景色
export function selectBackgroundColor(
  imageData: ImageData,
  palette: ColorPalette
): string {
  const width = imageData.width;
  const height = imageData.height;
  const edgePixels: RGB[] = [];

  // 收集边缘像素
  for (let i = 0; i < width; i++) {
    edgePixels.push([
      imageData.data[i * 4],
      imageData.data[i * 4 + 1],
      imageData.data[i * 4 + 2],
    ]);
    edgePixels.push([
      imageData.data[(height - 1) * width * 4 + i * 4],
      imageData.data[(height - 1) * width * 4 + i * 4 + 1],
      imageData.data[(height - 1) * width * 4 + i * 4 + 2],
    ]);
  }
  for (let i = 0; i < height; i++) {
    edgePixels.push([
      imageData.data[i * width * 4],
      imageData.data[i * width * 4 + 1],
      imageData.data[i * width * 4 + 2],
    ]);
    edgePixels.push([
      imageData.data[i * width * 4 + (width - 1) * 4],
      imageData.data[i * width * 4 + (width - 1) * 4 + 1],
      imageData.data[i * width * 4 + (width - 1) * 4 + 2],
    ]);
  }

  // 找到与边缘像素最接近的调色板颜色
  let bestColor = palette[0];
  let minAvgDistance = Infinity;

  for (const color of palette) {
    const avgDistance =
      edgePixels.reduce(
        (sum, pixel) => sum + colorDistance(pixel, color.rgb),
        0
      ) / edgePixels.length;
    if (avgDistance < minAvgDistance) {
      minAvgDistance = avgDistance;
      bestColor = color;
    }
  }

  return bestColor.hex;
}
