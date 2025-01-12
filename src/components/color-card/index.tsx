import { Color, ColorPalette } from "../../types";
import styles from "./index.module.css";

export function ColorCard({
  colors,
  onColorSelect,
}: {
  colors: ColorPalette;
  onColorSelect: (color: Color) => void;
}) {
  return (
    <div className={styles["color-card"]}>
      {colors.map((color, index) => (
        <button
          key={index}
          className={styles["color-button"]}
          onClick={() => onColorSelect(color)}
        >
          <div
            className={styles["color-swatch"]}
            style={{ backgroundColor: color.hex }}
          >
            <div className={styles["color-info"]}>
              <div>{color.hex}</div>
              <div>{`${Math.round(color.percentage)}%`}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
