import { ColorPalette, RGB } from "../types";
import { colorDistance, rgbToHex } from "./shared";

/**
 * K-Means算法
 * @param imageData 图像数据
 * @param k 聚类数量
 * @returns 颜色数组
 *
 * 动态调整逻辑：
 * - 首先根据图像颜色分布计算颜色复杂度。
 * - 如果颜色分布较为单一，迭代次数减少（如 5 次）。
 * - 如果颜色分布复杂，允许更多迭代次数（如 50~100 次）。
 * - 同时结合动态收敛条件，提前终止迭代。
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

  // 计算图像颜色分布复杂度
  const uniqueColors = new Set(pixels.map((pixel) => pixel.join(",")));
  const colorComplexity = uniqueColors.size / pixels.length;

  // 动态设置最大迭代次数
  const maxIterations = colorComplexity > 0.1 ? 20 : 5; // 简单图像5次，复杂图像最多20次
  const convergenceThreshold = 1e-3; // 中心点变化的阈值

  let hasConverged = false;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // 分配像素到最近的中心点
    const clusters: RGB[][] = Array.from({ length: k }, () => []);
    pixels.forEach((pixel) => {
      let minDistance = Infinity;
      let closestCentroidIndex = 0;
      centroids.forEach((centroid, index) => {
        const distance = colorDistance(pixel, centroid);
        if (distance <= minDistance) {
          minDistance = distance;
          closestCentroidIndex = index;
        }
      });
      clusters[closestCentroidIndex].push(pixel);
    });

    // 更新中心点
    const newCentroids: RGB[] = clusters.map((cluster) => {
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
        return [0, 0, 0];
      }
    });

    // 检查收敛,前后两次对比，检查距离是否小于 1e-3，如果中心点几乎不再变化，则代表收敛
    hasConverged = centroids.every((centroid, index) => {
      const distance = colorDistance(centroid, newCentroids[index]);
      return distance < convergenceThreshold;
    });

    centroids = newCentroids;

    if (hasConverged) break;
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
