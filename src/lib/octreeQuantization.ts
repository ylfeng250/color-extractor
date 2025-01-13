import { ColorPalette, RGB } from "../types";
import { colorDistance, rgbToHex } from "./shared";

// 根据图像的宽高确定八叉树的递归层级
function getLevelFromResolution(width: number, height: number): number {
  const pixelCount = width * height;
  if (pixelCount < 1000) return 3; // 小图片用较少层数
  if (pixelCount < 100000) return 4; // 中等分辨率
  return 5; // 高分辨率图片
}

// 确定最终的递归层级，考虑分辨率和颜色复杂度
function determineLevel(imageData: ImageData, maxColors: number): number {
  const width = imageData.width;
  const height = imageData.height;

  // 统计唯一颜色数
  const uniqueColors = new Set();
  for (let i = 0; i < imageData.data.length; i += 4) {
    const rgb = `${imageData.data[i]},${imageData.data[i + 1]},${
      imageData.data[i + 2]
    }`;
    uniqueColors.add(rgb);
  }

  // 颜色复杂度层级
  const colorCount = uniqueColors.size;
  const colorLevel = Math.ceil(Math.log2(colorCount) / 3);

  // 分辨率层级
  const resolutionLevel = getLevelFromResolution(width, height);

  // 最终层级（受目标颜色数限制）
  return Math.min(
    colorLevel,
    resolutionLevel,
    Math.ceil(Math.log2(maxColors) / 3)
  );
}

class OctreeNode {
  children: (OctreeNode | null)[] = new Array(8).fill(null);
  red: number = 0;
  green: number = 0;
  blue: number = 0;
  count: number = 0;

  // 添加颜色到八叉树
  addColor(r: number, g: number, b: number, level: number) {
    if (level === 0) {
      // 达到最底层，累加颜色值
      this.red += r;
      this.green += g;
      this.blue += b;
      this.count++; // 记录该节点的像素数量
      return;
    }

    // 计算每个维度的区间数，划分空间
    const range = 256 / (1 << level); // 即 256 / 2^level

    // 对每个通道按当前层级的划分计算索引
    const index =
      ((Math.floor(r / range) & 1) << 2) | // 对 R 进行划分
      ((Math.floor(g / range) & 1) << 1) | // 对 G 进行划分
      (Math.floor(b / range) & 1); // 对 B 进行划分

    if (!this.children[index]) {
      this.children[index] = new OctreeNode();
    }

    // 递归向子节点添加颜色
    this.children[index]?.addColor(r, g, b, level - 1);
  }

  // 获取该节点下的所有颜色
  getColors(): { rgb: RGB; count: number }[] {
    if (this.count > 0) {
      return [
        {
          rgb: [
            Math.round(this.red / this.count),
            Math.round(this.green / this.count),
            Math.round(this.blue / this.count),
          ],
          count: this.count, // 记录像素数量
        },
      ];
    }

    return this.children
      .filter((child) => child !== null)
      .flatMap((child) => child!.getColors());
  }
}

/**
 * 八叉树算法进行图像颜色量化
 * @param imageData 图像数据
 * @param colorCount 目标颜色数量
 * @returns 颜色调色板
 */
export function octreeQuantization(
  imageData: ImageData,
  colorCount: number
): ColorPalette {
  const octree = new OctreeNode();
  const pixels: RGB[] = [];

  // 根据图像数据和目标颜色数量确定八叉树的层级
  const level = determineLevel(imageData, colorCount);

  // 收集所有像素数据并加入到八叉树
  for (let i = 0; i < imageData.data.length; i += 4) {
    const rgb: RGB = [
      imageData.data[i],
      imageData.data[i + 1],
      imageData.data[i + 2],
    ];
    pixels.push(rgb);
    octree.addColor(rgb[0], rgb[1], rgb[2], level);
  }

  // 获取所有颜色并排序，按出现频率排序
  const colorsWithCount = octree.getColors().sort((a, b) => b.count - a.count); // 根据 count 进行排序，count 高的排前面

  // 取前 colorCount 个颜色
  const colors = colorsWithCount.slice(0, colorCount);

  // 计算每个颜色的百分比
  return colors.map((color) => {
    const { rgb, count } = color;

    // 计算每个颜色的百分比
    const percentage = (count / pixels.length) * 100;

    return {
      hex: rgbToHex(rgb),
      rgb,
      percentage,
    };
  });
}
