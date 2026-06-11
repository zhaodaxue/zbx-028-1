import * as THREE from 'three';
import { BRIDGE_DIMENSIONS, BridgeDimensions } from '../types';
import { calculateArchY } from '../utils/geometryUtils';

export function createArchGeometry(
  radius: number = BRIDGE_DIMENSIONS.archRadius,
  span: number = BRIDGE_DIMENSIONS.span,
  thickness: number = BRIDGE_DIMENSIONS.archThickness,
  width: number = BRIDGE_DIMENSIONS.archWidth,
  segments: number = 50,
  radialSegments: number = 8
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const indices: number[] = [];
  const uvs: number[] = [];

  for (let z = 0; z <= radialSegments; z++) {
    const zPos = (z / radialSegments) * thickness - thickness / 2;
    
    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * span - span / 2;
      const yOuter = calculateArchY(x, radius);
      const yInner = calculateArchY(x, radius - thickness);
      
      vertices.push(x, yOuter, zPos - width / 2);
      vertices.push(x, yInner, zPos - width / 2);
      vertices.push(x, yOuter, zPos + width / 2);
      vertices.push(x, yInner, zPos + width / 2);
      
      uvs.push(i / segments, z / radialSegments);
      uvs.push(i / segments, z / radialSegments);
      uvs.push(i / segments, z / radialSegments);
      uvs.push(i / segments, z / radialSegments);
    }
  }

  const vertsPerSegment = 4;
  for (let z = 0; z < radialSegments; z++) {
    for (let i = 0; i < segments; i++) {
      const base = (z * (segments + 1) + i) * vertsPerSegment;
      const nextBase = base + vertsPerSegment;
      const nextZBase = ((z + 1) * (segments + 1) + i) * vertsPerSegment;
      const nextZNextBase = nextZBase + vertsPerSegment;

      indices.push(base, base + 2, nextBase + 2);
      indices.push(base, nextBase + 2, nextBase);
      
      indices.push(base + 1, nextBase + 1, nextBase + 3);
      indices.push(base + 1, nextBase + 3, base + 3);
      
      indices.push(base, nextBase, nextZBase);
      indices.push(nextBase, nextZNextBase, nextZBase);
      
      indices.push(base + 2, nextZBase + 2, nextBase + 2);
      indices.push(nextBase + 2, nextZBase + 2, nextZNextBase + 2);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

export function createPierGeometry(
  width: number = BRIDGE_DIMENSIONS.pierWidth,
  height: number = BRIDGE_DIMENSIONS.pierHeight,
  depth: number = BRIDGE_DIMENSIONS.pierDepth
): THREE.BoxGeometry {
  return new THREE.BoxGeometry(width, height, depth);
}

export function createDeckGeometry(
  span: number = BRIDGE_DIMENSIONS.span,
  width: number = BRIDGE_DIMENSIONS.deckWidth,
  thickness: number = BRIDGE_DIMENSIONS.deckThickness
): THREE.BoxGeometry {
  return new THREE.BoxGeometry(span + 2, thickness, width);
}

export function generateArchVertices(
  radius: number = BRIDGE_DIMENSIONS.archRadius,
  span: number = BRIDGE_DIMENSIONS.span,
  segments: number = 50
): THREE.Vector3[] {
  const vertices: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const x = (i / segments) * span - span / 2;
    const y = calculateArchY(x, radius);
    vertices.push(new THREE.Vector3(x, y, 0));
  }
  return vertices;
}

export interface BridgeMeshGroup {
  arch: THREE.Mesh;
  leftPier: THREE.Mesh;
  rightPier: THREE.Mesh;
  deck: THREE.Mesh;
  group: THREE.Group;
}

export function createBridgeMesh(
  dimensions: BridgeDimensions = BRIDGE_DIMENSIONS
): BridgeMeshGroup {
  const group = new THREE.Group();

  const stoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.9,
    metalness: 0.1,
  });

  const deckMaterial = new THREE.MeshStandardMaterial({
    color: 0x696969,
    roughness: 0.8,
    metalness: 0.1,
  });

  const archGeometry = createArchGeometry(
    dimensions.archRadius,
    dimensions.span,
    dimensions.archThickness,
    dimensions.archWidth
  );
  const arch = new THREE.Mesh(archGeometry, stoneMaterial);
  arch.position.y = dimensions.pierHeight;
  arch.castShadow = true;
  arch.receiveShadow = true;

  const pierGeometry = createPierGeometry(
    dimensions.pierWidth,
    dimensions.pierHeight,
    dimensions.pierDepth
  );
  
  const leftPier = new THREE.Mesh(pierGeometry, stoneMaterial);
  leftPier.position.set(
    -dimensions.span / 2 + dimensions.pierWidth / 2,
    dimensions.pierHeight / 2,
    0
  );
  leftPier.castShadow = true;
  leftPier.receiveShadow = true;
  leftPier.userData = { type: 'pier', side: 'left' };

  const rightPier = new THREE.Mesh(pierGeometry, stoneMaterial);
  rightPier.position.set(
    dimensions.span / 2 - dimensions.pierWidth / 2,
    dimensions.pierHeight / 2,
    0
  );
  rightPier.castShadow = true;
  rightPier.receiveShadow = true;
  rightPier.userData = { type: 'pier', side: 'right' };

  const deckGeometry = createDeckGeometry(
    dimensions.span,
    dimensions.deckWidth,
    dimensions.deckThickness
  );
  const deck = new THREE.Mesh(deckGeometry, deckMaterial);
  deck.position.set(
    0,
    dimensions.pierHeight + dimensions.archRadius + dimensions.deckThickness / 2,
    0
  );
  deck.castShadow = true;
  deck.receiveShadow = true;

  group.add(arch);
  group.add(leftPier);
  group.add(rightPier);
  group.add(deck);

  return { arch, leftPier, rightPier, deck, group };
}

export function getPierTopPosition(
  side: 'left' | 'right',
  dimensions: BridgeDimensions = BRIDGE_DIMENSIONS
): THREE.Vector3 {
  const x = side === 'left' 
    ? -dimensions.span / 2 + dimensions.pierWidth / 2
    : dimensions.span / 2 - dimensions.pierWidth / 2;
  return new THREE.Vector3(x, dimensions.pierHeight, 0);
}
