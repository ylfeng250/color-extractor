import { Button, Card, Flex, Input, message, Select, Space } from "antd";
import { useEffect, useRef, useState } from "react";
import { ColorCard } from "./components/color-card";
import { medianCut } from "./lib/medianCut";
import { Color, ColorPalette } from "./types";
import { minimumDifferenceQuantization } from "./lib/minimumDifferenceQuantization";
import { octreeQuantization } from "./lib/octreeQuantization";
import { kMeans } from "./lib/kMeans";
import { popularityQuantization } from "./lib/popularityQuantization";

const algorithmOptions = [
  {
    label: "中位切分",
    value: "medianCut",
  },
  {
    label: "最小差值",
    value: "minimumDifference",
  },
  {
    label: "K-Means",
    value: "kMeans",
  },
  {
    label: "八叉树算法",
    value: "octreeQuantization",
  },
  {
    label: "流行色值法",
    value: "popularityQuantization",
  },
];

export default function App() {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [algorithm, setAlgorithm] = useState<string>("medianCut");
  const [backgroundColor, setBackgroundColor] = useState<string>("#ffffff");
  const [colors, setColors] = useState<Color[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [colorCount, setColorCount] = useState(8);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setColors([]);
      setBackgroundColor("#ffffff");
    }
  };
  const handleAlgorithmChange = (value: string) => {
    setAlgorithm(value);
  };

  const handleImageLoad = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置画布大小为固定 300x300
    const canvasSize = 300;
    canvas.width = canvasSize;
    canvas.height = canvasSize;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let drawWidth = img.width;
    let drawHeight = img.height;

    if (img.width > canvasSize || img.height > canvasSize) {
      // 如果图片大于画布，计算缩放比例
      const imgAspectRatio = img.width / img.height;
      const canvasAspectRatio = canvasSize / canvasSize;

      if (imgAspectRatio > canvasAspectRatio) {
        // 图片更宽，宽度铺满画布
        drawWidth = canvasSize;
        drawHeight = canvasSize / imgAspectRatio;
      } else {
        // 图片更高，高度铺满画布
        drawHeight = canvasSize;
        drawWidth = canvasSize * imgAspectRatio;
      }
    }

    // 计算偏移量，使图片居中
    const offsetX = (canvasSize - drawWidth) / 2;
    const offsetY = (canvasSize - drawHeight) / 2;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制图片到画布
    ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };

  const extractColors = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let colors: ColorPalette = [];
    switch (algorithm) {
      case "medianCut":
        colors = medianCut(imageData, colorCount);
        break;
      case "minimumDifference":
        colors = minimumDifferenceQuantization(imageData, colorCount);
        break;
      case "kMeans":
        colors = kMeans(imageData, colorCount);
        break;
      case "octreeQuantization":
        colors = octreeQuantization(imageData, colorCount);
        break;
      case "popularityQuantization":
        colors = popularityQuantization(imageData, colorCount);
        break;
    }
    setColors(colors);
  };

  const handleColorSelect = (color: Color) => {
    setBackgroundColor(color.hex);
    try {
      navigator.clipboard.writeText(color.hex);
      message.success(`复制到剪切板 ${color.hex}`);
    } catch (e) {
      console.log(e);
    }
  };

  useEffect(() => {
    // 监听粘贴事件
    function onPaste(event: ClipboardEvent) {
      const items = event.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith("image")) {
          const blob = item.getAsFile();
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          setImageUrl(url);
          setColors([]);
          setBackgroundColor("#ffffff");
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("paste", onPaste);
    };
  }, []);
  return (
    <Flex
      justify="center"
      align="center"
      style={{
        height: "100%",
        padding: 20,
      }}
    >
      <Card title="颜色提取工具" style={{ width: 900 }}>
        <Flex vertical gap={10}>
          <Flex gap={10} justify="space-between">
            <Input type="file" accept="image/*" onChange={handleImageUpload} />
            <Space>
              <Select
                options={algorithmOptions}
                value={algorithm}
                onChange={handleAlgorithmChange}
              />
              <Input
                type="number"
                value={colorCount}
                onChange={(e) => setColorCount(Number(e.target.value))}
              />
              <Button onClick={extractColors} type="primary">
                提取颜色
              </Button>
            </Space>
          </Flex>

          <Flex style={{ backgroundColor }} justify="center" align="center">
            <canvas ref={canvasRef} />
            <img
              src={imageUrl}
              style={{ display: "none" }}
              onLoad={(e) => handleImageLoad(e.target as HTMLImageElement)}
            />
          </Flex>
          <ColorCard colors={colors} onColorSelect={handleColorSelect} />
        </Flex>
      </Card>
    </Flex>
  );
}
