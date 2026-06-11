import * as THREE from 'three';
import { BRIDGE_DIMENSIONS } from '../types';

export function calculateCutPlane(
  positionPercent: number,
  bridgeWidth: number = BRIDGE_DIMENSIONS.archWidth
): THREE.Plane {
  const zPosition = bridgeWidth * (positionPercent / 100) - bridgeWidth / 2;
  return new THREE.Plane(new THREE.Vector3(0, 0, 1), -zPosition);
}

export function getCutPositionZ(
  positionPercent: number,
  bridgeWidth: number = BRIDGE_DIMENSIONS.archWidth
): number {
  return bridgeWidth * (positionPercent / 100) - bridgeWidth / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpArray(arr: number[], index: number): number {
  const lower = Math.floor(index);
  const upper = Math.min(Math.ceil(index), arr.length - 1);
  const t = index - lower;
  return lerp(arr[lower], arr[upper], t);
}

export function getStressRatioAtPosition(
  positionPercent: number,
  stressRatios: number[],
  positions: number[]
): number {
  if (positionPercent <= positions[0]) return stressRatios[0];
  if (positionPercent >= positions[positions.length - 1]) return stressRatios[stressRatios.length - 1];
  
  for (let i = 0; i < positions.length - 1; i++) {
    if (positionPercent >= positions[i] && positionPercent <= positions[i + 1]) {
      const t = (positionPercent - positions[i]) / (positions[i + 1] - positions[i]);
      return lerp(stressRatios[i], stressRatios[i + 1], t);
    }
  }
  return stressRatios[0];
}

export function calculateArchY(centeredX: number, radius: number): number {
  const dy = Math.sqrt(Math.max(0, radius * radius - centeredX * centeredX));
  return radius - dy;
}

export function createArchPath(
  span: number,
  radius: number,
  thickness: number,
  segments: number = 50
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * span - span / 2;
    const y = calculateArchY(x, radius);
    points.push(new THREE.Vector3(x, y, 0));
  }
  return points;
}

export function trianglePlaneIntersection(
  triangle: THREE.Triangle,
  plane: THREE.Plane
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const vertices = [triangle.a, triangle.b, triangle.c];
  const distances = vertices.map(v => plane.distanceToPoint(v));
  
  for (let i = 0; i < 3; i++) {
    const j = (i + 1) % 3;
    const d1 = distances[i];
    const d2 = distances[j];
    
    if ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) {
      const t = Math.abs(d1) / (Math.abs(d1) + Math.abs(d2));
      const intersection = new THREE.Vector3().lerpVectors(vertices[i], vertices[j], t);
      points.push(intersection);
    } else if (d1 === 0) {
      points.push(vertices[i].clone());
    }
  }
  
  return points;
}
