import * as THREE from 'three';

export function mapStressToColor(stressRatio: number): THREE.Color {
  const clampedRatio = Math.max(0, Math.min(1, stressRatio));
  
  const h1 = 210;
  const h2 = 60;
  const h3 = 0;
  
  let hue: number;
  if (clampedRatio < 0.5) {
    const t = clampedRatio / 0.5;
    hue = h1 + (h2 - h1) * t;
  } else {
    const t = (clampedRatio - 0.5) / 0.5;
    hue = h2 + (h3 - h2) * t;
  }
  
  return new THREE.Color().setHSL(hue / 360, 0.9, 0.5);
}

export function mapStressToColorHex(stressRatio: number): string {
  const color = mapStressToColor(stressRatio);
  return '#' + color.getHexString();
}

export function createColorLegend(segments: number = 20): { ratio: number; color: string }[] {
  const legend: { ratio: number; color: string }[] = [];
  for (let i = 0; i <= segments; i++) {
    const ratio = i / segments;
    legend.push({
      ratio,
      color: mapStressToColorHex(ratio),
    });
  }
  return legend;
}

export const STRESS_COLORS = {
  min: '#1e88e5',
  mid: '#ffeb3b',
  max: '#e53935',
  warning: '#ff6d00',
  safe: '#4caf50',
};
