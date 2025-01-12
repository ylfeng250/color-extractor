import { colorDistance, rgbToHex } from "./shared";
import { ColorPalette, RGB } from "../types";

/**
 * 中位切分法
 * @param imageData 图像数据
 * @param colorCount 切分的颜色数量，需要是 2 的幂数
 * @returns 颜色数组
 * 算法步骤：
 * 1. 将图像像素数据转换为 RGB 数组
 * 2. 找到区域内颜色通道差值最大的的通道，按照这个通道值进行排序
 * 3. 然后取中间位置的像素作为颜色块的均值颜色，重复这个过程，直到颜色数量达到要求为止。
 */
export function medianCut(
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

  function cut(pixels: RGB[], depth: number): RGB[] {
    if (depth === 0 || pixels.length === 0) {
      // 递归结束，计算颜色块内的均值颜色
      const color = pixels.reduce(
        (avg, pixel) => [
          avg[0] + pixel[0],
          avg[1] + pixel[1],
          avg[2] + pixel[2],
        ],
        [0, 0, 0]
      );
      return [color.map((c) => Math.round(c / pixels.length)) as RGB];
    }

    // 找出色彩跨度最大的颜色通道
    const ranges = pixels.reduce(
      (acc, pixel) => [
        [Math.min(acc[0][0], pixel[0]), Math.max(acc[0][1], pixel[0])],
        [Math.min(acc[1][0], pixel[1]), Math.max(acc[1][1], pixel[1])],
        [Math.min(acc[2][0], pixel[2]), Math.max(acc[2][1], pixel[2])],
      ],
      [
        [255, 0],
        [255, 0],
        [255, 0],
      ]
    );

    const maxRange = ranges.reduce(
      (max, range, i) =>
        range[1] - range[0] > ranges[max][1] - ranges[max][0] ? i : max,
      0
    );

    // 根据色彩跨度对像素进行排序
    pixels.sort((a, b) => a[maxRange] - b[maxRange]);
    // 计算区域的中间长度
    const mid = Math.floor(pixels.length / 2);

    return [
      ...cut(pixels.slice(0, mid), depth - 1),
      ...cut(pixels.slice(mid), depth - 1),
    ];
  }

  const palette = cut(pixels, Math.log2(colorCount));
  const totalPixels = pixels.length;

  return palette.map((rgb) => {
    // 判断颜色的重要程度，这里是根据颜色与原图的距离来判断，有优化空间
    const count = pixels.filter((p) => colorDistance(p, rgb) < 50).length;
    return {
      hex: rgbToHex(rgb),
      rgb,
      percentage: (count / totalPixels) * 100,
    };
  });
}
