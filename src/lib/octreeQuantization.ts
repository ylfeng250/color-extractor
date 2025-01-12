import { ColorPalette, RGB } from "../types";
import { colorDistance, rgbToHex } from "./shared";

class OctreeNode {
  children: (OctreeNode | null)[] = new Array(8).fill(null);
  red: number = 0;
  green: number = 0;
  blue: number = 0;
  count: number = 0;

  addColor(r: number, g: number, b: number, level: number) {
    if (level === 0) {
      this.red += r;
      this.green += g;
      this.blue += b;
      this.count++;
      return;
    }

    const index =
      ((r > 127 ? 1 : 0) << 2) | ((g > 127 ? 1 : 0) << 1) | (b > 127 ? 1 : 0);

    if (!this.children[index]) {
      this.children[index] = new OctreeNode();
    }

    this.children[index]?.addColor(r, g, b, level - 1);
  }

  getColors(): RGB[] {
    if (this.count > 0) {
      return [
        [
          Math.round(this.red / this.count),
          Math.round(this.green / this.count),
          Math.round(this.blue / this.count),
        ],
      ];
    }

    return this.children
      .filter((child) => child !== null)
      .flatMap((child) => child!.getColors());
  }
}

/**
 * 八叉树算法
 * @param imageData 图片数据
 * @param colorCount 颜色数量
 * @returns 颜色数组
 * 算法描述：
 * 1. 将图像数据按照八叉树进行划分
 * 2. 递归地划分子节点，直到每个子节点只有一个像素
 * 3. 获取主要颜色
 */
export function octreeQuantization(
  imageData: ImageData,
  colorCount: number
): ColorPalette {
  const octree = new OctreeNode();
  const pixels: RGB[] = [];

  // 收集所有像素
  for (let i = 0; i < imageData.data.length; i += 4) {
    const rgb: RGB = [
      imageData.data[i],
      imageData.data[i + 1],
      imageData.data[i + 2],
    ];
    pixels.push(rgb);
    octree.addColor(rgb[0], rgb[1], rgb[2], 4);
  }

  // 获取主要颜色
  const colors = octree.getColors().slice(0, colorCount);

  // 计算每个颜色的百分比
  return colors.map((rgb) => {
    const count = pixels.filter((p) => colorDistance(p, rgb) < 50).length;

    return {
      hex: rgbToHex(rgb),
      rgb,
      percentage: (count / pixels.length) * 100,
    };
  });
}
