export interface WaveTiming {
  periodSeconds: number;
  frequencyHertz: number;
}

export function calculateWaveTiming(
  wavelengthCells: number,
  waveSpeedCellsPerSecond: number,
): WaveTiming {
  if (wavelengthCells <= 0 || waveSpeedCellsPerSecond <= 0) {
    throw new Error("Wavelength and wave speed must be positive.");
  }

  return {
    periodSeconds: wavelengthCells / waveSpeedCellsPerSecond,
    frequencyHertz: waveSpeedCellsPerSecond / wavelengthCells,
  };
}
