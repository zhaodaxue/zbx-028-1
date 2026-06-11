import * as THREE from 'three';
import { BRIDGE_DIMENSIONS, OVER_LIMIT_THRESHOLD, IntersectionResult } from '../types';
import { calculateCutPlane, getCutPositionZ, calculateArchY, trianglePlaneIntersection } from '../utils/geometryUtils';
import { mapStressToColor } from '../utils/colorMapping';

export function calculateCutPlanePosition(
  positionPercent: number,
  bridgeWidth: number = BRIDGE_DIMENSIONS.archWidth
): THREE.Plane {
  return calculateCutPlane(positionPercent, bridgeWidth);
}

export function intersectArchWithPlane(
  archGeometry: THREE.BufferGeometry,
  plane: THREE.Plane,
  archOffsetY: number = BRIDGE_DIMENSIONS.pierHeight
): IntersectionResult {
  const positionAttr = archGeometry.getAttribute('position');
  const indexAttr = archGeometry.getIndex();
  
  if (!indexAttr) {
    return { points: [], stressRatios: [], maxStressRatio: 0 };
  }

  const allIntersectionPoints: THREE.Vector3[] = [];
  const triangle = new THREE.Triangle();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const v3 = new THREE.Vector3();

  for (let i = 0; i < indexAttr.count; i += 3) {
    v1.fromBufferAttribute(positionAttr, indexAttr.getX(i));
    v2.fromBufferAttribute(positionAttr, indexAttr.getX(i + 1));
    v3.fromBufferAttribute(positionAttr, indexAttr.getX(i + 2));
    
    v1.y += archOffsetY;
    v2.y += archOffsetY;
    v3.y += archOffsetY;
    
    triangle.set(v1, v2, v3);
    
    const intersections = trianglePlaneIntersection(triangle, plane);
    allIntersectionPoints.push(...intersections);
  }

  const uniquePoints = deduplicatePoints(allIntersectionPoints, 0.001);
  const sortedPoints = sortPointsByX(uniquePoints);
  
  const zPos = -plane.constant;
  const positionPercent = ((zPos + BRIDGE_DIMENSIONS.archWidth / 2) / BRIDGE_DIMENSIONS.archWidth) * 100;
  
  const stressRatios = sortedPoints.map(point => {
    const xPercent = ((point.x + BRIDGE_DIMENSIONS.span / 2) / BRIDGE_DIMENSIONS.span) * 100;
    return calculateStressRatioAtX(xPercent, positionPercent);
  });

  const maxStressRatio = stressRatios.length > 0 ? Math.max(...stressRatios) : 0;

  return {
    points: sortedPoints,
    stressRatios,
    maxStressRatio,
  };
}

function deduplicatePoints(points: THREE.Vector3[], tolerance: number): THREE.Vector3[] {
  const unique: THREE.Vector3[] = [];
  
  for (const point of points) {
    const isDuplicate = unique.some(p => p.distanceTo(point) < tolerance);
    if (!isDuplicate) {
      unique.push(point.clone());
    }
  }
  
  return unique;
}

function sortPointsByX(points: THREE.Vector3[]): THREE.Vector3[] {
  return [...points].sort((a, b) => a.x - b.x);
}

function calculateStressRatioAtX(xPercent: number, zPercent: number): number {
  const baseStress = 0.3 + 0.5 * Math.sin((xPercent / 100) * Math.PI);
  const zFactor = 1 + 0.1 * Math.sin((zPercent / 100) * Math.PI * 2);
  return Math.min(1, Math.max(0, baseStress * zFactor));
}

export function createSectionGeometry(
  intersectionResult: IntersectionResult,
  thickness: number = BRIDGE_DIMENSIONS.archThickness
): THREE.BufferGeometry {
  const { points, stressRatios } = intersectionResult;
  
  if (points.length < 2) {
    return new THREE.BufferGeometry();
  }

  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];

  const zOffset = points.length > 0 ? points[0].z : 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const stressRatio = stressRatios[i];
    const color = mapStressToColor(stressRatio);
    
    const innerY = calculateArchY(point.x, BRIDGE_DIMENSIONS.archRadius - thickness);
    
    vertices.push(point.x, point.y, zOffset - 0.01);
    vertices.push(point.x, innerY + BRIDGE_DIMENSIONS.pierHeight, zOffset - 0.01);
    
    colors.push(color.r, color.g, color.b);
    colors.push(color.r, color.g, color.b);
  }

  for (let i = 0; i < points.length - 1; i++) {
    const base = i * 2;
    indices.push(base, base + 1, base + 3);
    indices.push(base, base + 3, base + 2);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createSectionOutline(
  intersectionResult: IntersectionResult,
  thickness: number = BRIDGE_DIMENSIONS.archThickness
): THREE.BufferGeometry {
  const { points } = intersectionResult;
  
  if (points.length < 2) {
    return new THREE.BufferGeometry();
  }

  const vertices: number[] = [];
  const zOffset = points.length > 0 ? points[0].z : 0;

  for (let i = 0; i < points.length; i++) {
    const point = points[i];
    const innerY = calculateArchY(point.x, BRIDGE_DIMENSIONS.archRadius - thickness);
    
    vertices.push(point.x, point.y, zOffset);
    vertices.push(point.x, innerY + BRIDGE_DIMENSIONS.pierHeight, zOffset);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  
  return geometry;
}

export function checkOverLimit(stressRatio: number): boolean {
  return stressRatio > OVER_LIMIT_THRESHOLD;
}

export function updateSectionColors(
  sectionGeometry: THREE.BufferGeometry,
  stressRatios: number[]
): void {
  const colorAttr = sectionGeometry.getAttribute('color') as THREE.BufferAttribute;
  
  if (!colorAttr) return;

  for (let i = 0; i < stressRatios.length; i++) {
    const color = mapStressToColor(stressRatios[i]);
    const baseIndex = i * 2 * 3;
    colorAttr.setXYZ(baseIndex / 3, color.r, color.g, color.b);
    colorAttr.setXYZ(baseIndex / 3 + 1, color.r, color.g, color.b);
  }
  
  colorAttr.needsUpdate = true;
}

export function getSectionZPosition(
  positionPercent: number
): number {
  return getCutPositionZ(positionPercent);
}

export function createCutPlaneHelper(
  positionPercent: number,
  size: number = 25
): THREE.Mesh {
  const zPos = getCutPositionZ(positionPercent);
  
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.15,
    side: THREE.DoubleSide,
  });
  
  const plane = new THREE.Mesh(geometry, material);
  plane.position.z = zPos;
  plane.rotation.y = Math.PI / 2;
  
  return plane;
}
