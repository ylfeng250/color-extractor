import { ColorPalette, RGB } from "../types";
import { hexToRgb, rgbToHex } from "./shared";

/**
 * 流行色值算法
 * @param imageData   图片数据
 * @param colorCount  颜色数量
 * @returns           颜色数组
 * 流行色值算法是一种颜色量化算法，它根据像素出现的次数来选择颜色。
 */
export function popularityQuantization(
  imageData: ImageData,
  colorCount: number
): ColorPalette {
  const colorMap = new Map<string, number>();

  // 统计每个颜色出现的次数
  for (let i = 0; i < imageData.data.length; i += 4) {
    const rgb: RGB = [
      imageData.data[i],
      imageData.data[i + 1],
      imageData.data[i + 2],
    ];
    const hex = rgbToHex(rgb);
    colorMap.set(hex, (colorMap.get(hex) || 0) + 1);
  }

  // 按出现次数排序并选择最常见的颜色
  const sortedColors = Array.from(colorMap.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, colorCount);

  const totalPixels = imageData.data.length / 4;

  return sortedColors.map(([hex, count]) => ({
    hex,
    rgb: hexToRgb(hex),
    percentage: (count / totalPixels) * 100,
  }));
}
