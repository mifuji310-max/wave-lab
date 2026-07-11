export interface RgbColor {
  red: number;
  green: number;
  blue: number;
}

const displayAmplitudeRange = 8;
const contourStops: Array<{ position: number; color: RgbColor }> = [
  { position: -1, color: { red: 29, green: 78, blue: 216 } },
  { position: -0.5, color: { red: 6, green: 182, blue: 212 } },
  { position: 0, color: { red: 101, green: 217, blue: 75 } },
  { position: 0.5, color: { red: 250, green: 204, blue: 21 } },
  { position: 1, color: { red: 220, green: 38, blue: 38 } },
];
const lookupLevelCount = 513;
const colorLookupTable = createLookupTable("color");
const monochromeLookupTable = createLookupTable("monochrome");

export function colorForDisplacement(displacement: number): RgbColor {
  return colorForNormalizedDisplacement(normalizeDisplacement(displacement));
}

export function monochromeForDisplacement(displacement: number): RgbColor {
  const normalized = normalizeDisplacement(displacement);
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
    const normalized = normalizeDisplacement(field[index]);
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

function normalizeDisplacement(displacement: number): number {
  return Math.max(-1, Math.min(1, displacement / displayAmplitudeRange));
}

function colorForNormalizedDisplacement(normalized: number): RgbColor {
  for (let index = 1; index < contourStops.length; index += 1) {
    const upperStop = contourStops[index];

    if (normalized <= upperStop.position) {
      const lowerStop = contourStops[index - 1];
      const amount =
        (normalized - lowerStop.position) / (upperStop.position - lowerStop.position);
      return interpolateColor(lowerStop.color, upperStop.color, amount);
    }
  }

  return contourStops[contourStops.length - 1].color;
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
    const color =
      displayMode === "color"
        ? colorForNormalizedDisplacement(normalized)
        : monochromeForDisplacement(normalized * displayAmplitudeRange);
    const offset = index * 4;
    lookupTable[offset] = color.red;
    lookupTable[offset + 1] = color.green;
    lookupTable[offset + 2] = color.blue;
    lookupTable[offset + 3] = 255;
  }

  return lookupTable;
}
