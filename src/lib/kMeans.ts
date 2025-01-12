import { ColorPalette, RGB } from "../types";
import { colorDistance, rgbToHex } from "./shared";

/**
 *  K-Means算法
 * @param imageData  图像数据
 * @param k  聚类数量
 * @returns  颜色数组
 * 算法描述：
 * 1.随机选择初始中心点
 * 2.计算每个像素到中心点的距离，将像素分配到距离最近的中心点
 * 3.更新中心点，将每个簇的中心点设置为簇中所有像素的平均值
 * 4.重复步骤2和步骤3，直到中心点不再变化或者达到最大迭代次数
 */
export function kMeans(imageData: ImageData, k: number): ColorPalette {
  const pixels: RGB[] = [];
  for (let i = 0; i < imageData.data.length; i += 4) {
    pixels.push([
      imageData.data[i],
      imageData.data[i + 1],
      imageData.data[i + 2],
    ]);
  }

  // 随机选择初始中心点
  let centroids: RGB[] = Array.from(
    { length: k },
    () => pixels[Math.floor(Math.random() * pixels.length)]
  );

  for (let iteration = 0; iteration < 10; iteration++) {
    // 分配像素到最近的中心点
    const clusters: RGB[][] = Array.from({ length: k }, () => []);
    pixels.forEach((pixel) => {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;
      centroids.forEach((centroid, index) => {
        const distance = colorDistance(pixel, centroid);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = index;
        }
      });
      clusters[closestCentroidIndex].push(pixel);
    });

    // 更新中心点
    centroids = clusters.map((cluster) => {
      if (cluster.length > 0) {
        const sum = cluster.reduce(
          (acc, pixel) => [
            acc[0] + pixel[0],
            acc[1] + pixel[1],
            acc[2] + pixel[2],
          ],
          [0, 0, 0]
        );
        return sum.map((v) => Math.round(v / cluster.length)) as RGB;
      } else {
        // 如果没有像素分配给这个簇，保持原来的中心点不变
        return [0, 0, 0]; // 这里可以选择适当的默认值
      }
    });
  }

  // 计算每个中心点的百分比
  const totalPixels = pixels.length;
  return centroids.map((centroid) => {
    const count = pixels.filter(
      (pixel) => colorDistance(pixel, centroid) < 50
    ).length;
    return {
      hex: rgbToHex(centroid),
      rgb: centroid,
      percentage: (count / totalPixels) * 100,
    };
  });
}
