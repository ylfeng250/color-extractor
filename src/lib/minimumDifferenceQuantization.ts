import { ColorPalette, RGB } from "../types";
import { colorDistance, rgbToHex } from "./shared";

/**
 * 最小差值算法
 * @param imageData  图像数据
 * @param colorCount  颜色数量
 * @returns  颜色数组
 * 算法描述：
 * 1. 随机选择一些颜色作为种子
 * 2. 迭代优化： 直到不再有颜色改变为止
 *   - 将每个像素分配到最近的调色板颜色
 *   - 更新调色板颜色为每个簇的平均值
 */
export function minimumDifferenceQuantization(
  imageData: ImageData,
  colorCount: number
): ColorPalette {
  const pixels: RGB[] = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push([
      imageData.data[i],
      imageData.data[i + 1],
      imageData.data[i + 2],
    ]);
  }

  // 初始选择一些随机颜色作为种子
  const palette: RGB[] = pixels
    .sort(() => Math.random() - 0.5)
    .slice(0, colorCount);

  // 迭代优化
  for (let iteration = 0; iteration < 10; iteration++) {
    const clusters: RGB[][] = Array(colorCount)
      .fill(0)
      .map(() => []);

    // 将每个像素分配到最近的调色板颜色
    pixels.forEach((pixel) => {
      let minDistance = Infinity;
      let closestIndex = 0;

      palette.forEach((paletteColor, index) => {
        const distance = colorDistance(pixel, paletteColor);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      clusters[closestIndex].push(pixel);
    });

    // 更新调色板颜色为每个簇的平均值
    clusters.forEach((cluster, index) => {
      if (cluster.length > 0) {
        const avg: RGB = [0, 0, 0];
        cluster.forEach((pixel) => {
          avg[0] += pixel[0];
          avg[1] += pixel[1];
          avg[2] += pixel[2];
        });
        palette[index] = [
          Math.round(avg[0] / cluster.length),
          Math.round(avg[1] / cluster.length),
          Math.round(avg[2] / cluster.length),
        ];
      }
    });
  }

  // 计算每个颜色的百分比
  return palette.map((rgb) => {
    const count = pixels.filter((p) => colorDistance(p, rgb) < 50).length;

    return {
      hex: rgbToHex(rgb),
      rgb,
      percentage: (count / pixels.length) * 100,
    };
  });
}
