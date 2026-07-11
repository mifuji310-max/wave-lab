export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const neutralColor: RgbColor = { red: 226, green: 232, blue: 240 };
const highColor: RgbColor = { red: 239, green: 68, blue: 68 };
const lowColor: RgbColor = { red: 37, green: 99, blue: 235 };

export function colorForDisplacement(displacement: number): RgbColor {
  const normalized = Math.max(-1, Math.min(1, displacement * 0.7));
  return normalized >= 0
    ? interpolateColor(neutralColor, highColor, normalized)
    : interpolateColor(neutralColor, lowColor, Math.abs(normalized));
}

export function monochromeForDisplacement(displacement: number): RgbColor {
  const normalized = Math.max(-1, Math.min(1, displacement * 0.7));
  const lightness = Math.round(180 + normalized * 68);

  return { red: lightness, green: lightness, blue: lightness };
}

function interpolateColor(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return {
    red: Math.round(from.red + (to.red - from.red) * amount),
    green: Math.round(from.green + (to.green - from.green) * amount),
    blue: Math.round(from.blue + (to.blue - from.blue) * amount),
  };
}
