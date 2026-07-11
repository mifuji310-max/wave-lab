export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const neutralColor: RgbColor = { red: 226, green: 232, blue: 240 };
const highColor: RgbColor = { red: 239, green: 68, blue: 68 };
const lowColor: RgbColor = { red: 37, green: 99, blue: 235 };
const lookupLevelCount = 512;
const colorLookupTable = createLookupTable("color");
const monochromeLookupTable = createLookupTable("monochrome");

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

export function writeDisplacementColors(
  target: Uint8ClampedArray,
  field: Float32Array,
  displayMode: "color" | "monochrome",
): void {
  const lookupTable = displayMode === "color" ? colorLookupTable : monochromeLookupTable;

  for (let index = 0; index < field.length; index += 1) {
    const normalized = Math.max(-1, Math.min(1, field[index] * 0.7));
    const lookupIndex = Math.min(
      lookupLevelCount - 1,
      Math.max(0, Math.round(((normalized + 1) / 2) * (lookupLevelCount - 1))),
    );
    const lookupOffset = lookupIndex * 4;
    const pixelOffset = index * 4;
    target[pixelOffset] = lookupTable[lookupOffset];
    target[pixelOffset + 1] = lookupTable[lookupOffset + 1];
    target[pixelOffset + 2] = lookupTable[lookupOffset + 2];
    target[pixelOffset + 3] = 255;
  }
}

function interpolateColor(from: RgbColor, to: RgbColor, amount: number): RgbColor {
  return {
    red: Math.round(from.red + (to.red - from.red) * amount),
    green: Math.round(from.green + (to.green - from.green) * amount),
    blue: Math.round(from.blue + (to.blue - from.blue) * amount),
  };
}

function createLookupTable(displayMode: "color" | "monochrome"): Uint8ClampedArray {
  const lookupTable = new Uint8ClampedArray(lookupLevelCount * 4);

  for (let index = 0; index < lookupLevelCount; index += 1) {
    const normalized = (index / (lookupLevelCount - 1)) * 2 - 1;
    const displacement = normalized / 0.7;
    const color =
      displayMode === "color"
        ? colorForDisplacement(displacement)
        : monochromeForDisplacement(displacement);
    const offset = index * 4;
    lookupTable[offset] = color.red;
    lookupTable[offset + 1] = color.green;
    lookupTable[offset + 2] = color.blue;
    lookupTable[offset + 3] = 255;
  }

  return lookupTable;
}
