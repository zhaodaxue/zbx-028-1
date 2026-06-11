import React, { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useBridgeStore } from '../../store/useBridgeStore';
import { BRIDGE_DIMENSIONS } from '../../types';
import { createPierGeometry, createDeckGeometry, getPierTopPosition } from '../../core/archMesh';
import { getStressRatioForSection } from '../../core/loadCases';
import { calculateArchY } from '../../utils/geometryUtils';
import { mapStressToColor } from '../../utils/colorMapping';

interface BridgeSceneProps {
  onPierClick?: (side: 'left' | 'right', screenPos: { x: number; y: number }) => void;
  onPierScreenUpdate?: (side: 'left' | 'right', screenPos: { x: number; y: number }) => void;
}

const DeckMaterial: React.FC = () => (
  <meshStandardMaterial 
    color={0x696969} 
    roughness={0.8} 
    metalness={0.1}
  />
);

const Arch: React.FC = () => {
  const archRef = useRef<THREE.Mesh>(null);
  
  const geometry = useMemo(() => {
    const vertices: number[] = [];
    const indices: number[] = [];
    const uvs: number[] = [];
    const { archRadius, span, archThickness, archWidth } = BRIDGE_DIMENSIONS;
    const segments = 60;
    const radialSegments = 10;

    for (let z = 0; z <= radialSegments; z++) {
      const zPos = (z / radialSegments) * archThickness - archThickness / 2;
      
      for (let i = 0; i <= segments; i++) {
        const x = (i / segments) * span - span / 2;
        const yOuter = calculateArchY(x, archRadius);
        const yInner = calculateArchY(x, archRadius - archThickness);
        
        vertices.push(x, yOuter, zPos - archWidth / 2);
        vertices.push(x, yInner, zPos - archWidth / 2);
        vertices.push(x, yOuter, zPos + archWidth / 2);
        vertices.push(x, yInner, zPos + archWidth / 2);
        
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

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh
      ref={archRef}
      geometry={geometry}
      position={[0, BRIDGE_DIMENSIONS.pierHeight, 0]}
      castShadow
      receiveShadow
    >
      <meshStandardMaterial 
        color={0x8b7355} 
        roughness={0.9} 
        metalness={0.1}
        clipShadows
      />
    </mesh>
  );
};

const Pier: React.FC<{
  side: 'left' | 'right';
  onClick: (side: 'left' | 'right') => void;
}> = ({ side, onClick }) => {
  const pierRef = useRef<THREE.Mesh>(null);
  const { selectedPier } = useBridgeStore();
  const isSelected = selectedPier === side;

  const xPos = side === 'left'
    ? -BRIDGE_DIMENSIONS.span / 2 + BRIDGE_DIMENSIONS.pierWidth / 2
    : BRIDGE_DIMENSIONS.span / 2 - BRIDGE_DIMENSIONS.pierWidth / 2;

  const geometry = useMemo(() => {
    return createPierGeometry(
      BRIDGE_DIMENSIONS.pierWidth,
      BRIDGE_DIMENSIONS.pierHeight,
      BRIDGE_DIMENSIONS.pierDepth
    );
  }, []);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick(side);
  };

  return (
    <mesh
      ref={pierRef}
      geometry={geometry}
      position={[xPos, BRIDGE_DIMENSIONS.pierHeight / 2, 0]}
      onClick={handleClick}
      castShadow
      receiveShadow
      userData={{ type: 'pier', side }}
    >
      <meshStandardMaterial 
        color={isSelected ? 0xd4a574 : 0x8b7355} 
        roughness={0.9} 
        metalness={0.1}
        emissive={isSelected ? 0x4a3728 : 0x000000}
        emissiveIntensity={isSelected ? 0.3 : 0}
      />
    </mesh>
  );
};

const Deck: React.FC = () => {
  const geometry = useMemo(() => {
    return createDeckGeometry(
      BRIDGE_DIMENSIONS.span,
      BRIDGE_DIMENSIONS.deckWidth,
      BRIDGE_DIMENSIONS.deckThickness
    );
  }, []);

  return (
    <mesh
      geometry={geometry}
      position={[
        0,
        BRIDGE_DIMENSIONS.pierHeight + BRIDGE_DIMENSIONS.archRadius + BRIDGE_DIMENSIONS.deckThickness / 2,
        0
      ]}
      castShadow
      receiveShadow
    >
      <DeckMaterial />
    </mesh>
  );
};

const CutSection: React.FC = () => {
  const { cutPosition, currentLoadCase, isOverLimit } = useBridgeStore();
  const sectionRef = useRef<THREE.Mesh>(null);
  const outlineRef = useRef<THREE.LineSegments>(null);
  const [, setPulseFactor] = useState(1);

  useFrame((state) => {
    if (isOverLimit && outlineRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(state.clock.elapsedTime * 4);
      setPulseFactor(pulse);
      const material = outlineRef.current.material as THREE.LineBasicMaterial;
      material.opacity = 0.3 + 0.7 * pulse;
      material.color.setHSL(0.08, 1, 0.3 + 0.3 * pulse);
    }
  });

  const sectionData = useMemo(() => {
    const zPos = BRIDGE_DIMENSIONS.archWidth * (cutPosition / 100) - BRIDGE_DIMENSIONS.archWidth / 2;
    const segments = 60;
    const vertices: number[] = [];
    const colors: number[] = [];
    const indices: number[] = [];
    const outlineVertices: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const x = (i / segments) * BRIDGE_DIMENSIONS.span - BRIDGE_DIMENSIONS.span / 2;
      const xPercent = ((x + BRIDGE_DIMENSIONS.span / 2) / BRIDGE_DIMENSIONS.span) * 100;
      
      const yOuter = calculateArchY(x, BRIDGE_DIMENSIONS.archRadius) + BRIDGE_DIMENSIONS.pierHeight;
      const yInner = calculateArchY(x, BRIDGE_DIMENSIONS.archRadius - BRIDGE_DIMENSIONS.archThickness) + BRIDGE_DIMENSIONS.pierHeight;
      
      const stressRatio = getStressRatioForSection(cutPosition, xPercent, currentLoadCase);
      const color = mapStressToColor(stressRatio);
      
      const zOffset = zPos + 0.02;
      
      vertices.push(x, yOuter, zOffset);
      vertices.push(x, yInner, zOffset);
      
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
      
      outlineVertices.push(x, yOuter, zOffset + 0.01);
      outlineVertices.push(x, yInner, zOffset + 0.01);
    }

    for (let i = 0; i < segments; i++) {
      const base = i * 2;
      indices.push(base, base + 1, base + 3);
      indices.push(base, base + 3, base + 2);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    const outlineGeometry = new THREE.BufferGeometry();
    outlineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(outlineVertices, 3));

    return { geometry, outlineGeometry };
  }, [cutPosition, currentLoadCase]);

  return (
    <group>
      <mesh ref={sectionRef} geometry={sectionData.geometry}>
        <meshBasicMaterial 
          vertexColors 
          side={THREE.DoubleSide}
          transparent
          opacity={0.95}
        />
      </mesh>
      
      {isOverLimit && (
        <lineSegments ref={outlineRef} geometry={sectionData.outlineGeometry}>
          <lineBasicMaterial 
            color={0xff6d00} 
            linewidth={3}
            transparent
            opacity={0.8}
          />
        </lineSegments>
      )}
      
      <mesh position={[0, BRIDGE_DIMENSIONS.pierHeight + BRIDGE_DIMENSIONS.archRadius / 2, sectionData.geometry.attributes.position.getZ(0)]}>
        <planeGeometry args={[BRIDGE_DIMENSIONS.span + 4, BRIDGE_DIMENSIONS.archRadius * 2]} />
        <meshBasicMaterial 
          color={0x00ff00} 
          transparent 
          opacity={0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

const SettlementArrow: React.FC<{ side: 'left' | 'right' }> = ({ side }) => {
  const { settlementValues, showSettlementArrows, selectedPier } = useBridgeStore();
  const arrowRef = useRef<THREE.Group>(null);
  
  const shouldShow = showSettlementArrows && (selectedPier === null || selectedPier === side);
  
  if (!shouldShow) return null;

  const settlement = settlementValues[side];
  const arrowLength = Math.max(1, settlement / 5);
  const pierTop = getPierTopPosition(side);
  const arrowColor = settlement > 10 ? 0xff6d00 : 0x4caf50;

  return (
    <group ref={arrowRef} position={[pierTop.x, pierTop.y + arrowLength / 2 + 0.5, pierTop.z]}>
      <mesh>
        <cylinderGeometry args={[0.15, 0.15, arrowLength, 8]} />
        <meshBasicMaterial color={arrowColor} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, -arrowLength / 2, 0]}>
        <coneGeometry args={[0.4, 0.8, 8]} />
        <meshBasicMaterial color={arrowColor} transparent opacity={0.9} />
      </mesh>
    </group>
  );
};

const Ground: React.FC = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color={0x2a3a2a} roughness={1} />
    </mesh>
  );
};

const SceneContent: React.FC<{
  onPierClick: (side: 'left' | 'right', screenPos: { x: number; y: number }) => void;
  onPierScreenUpdate?: (side: 'left' | 'right', screenPos: { x: number; y: number }) => void;
}> = ({ onPierClick, onPierScreenUpdate }) => {
  const { camera, gl } = useThree();
  const { selectedPier } = useBridgeStore();

  const computeScreenPos = useCallback((side: 'left' | 'right'): { x: number; y: number } => {
    const pierTop = getPierTopPosition(side);
    const vector = pierTop.clone().project(camera);
    const canvas = gl.domElement;
    const rect = canvas.getBoundingClientRect();
    const x = rect.left + (vector.x * 0.5 + 0.5) * rect.width;
    const y = rect.top + (-vector.y * 0.5 + 0.5) * rect.height;
    return { x, y };
  }, [camera, gl]);

  const handlePierClick = useCallback((side: 'left' | 'right') => {
    const pos = computeScreenPos(side);
    onPierClick(side, pos);
  }, [computeScreenPos, onPierClick]);

  useFrame(() => {
    if (selectedPier && onPierScreenUpdate) {
      const pos = computeScreenPos(selectedPier);
      onPierScreenUpdate(selectedPier, pos);
    }
  });

  return (
    <>
      <perspectiveCamera
        position={[30, 20, 25]}
        fov={50}
      />
      
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={10}
        maxDistance={80}
        maxPolarAngle={Math.PI / 2 - 0.1}
        target={[0, BRIDGE_DIMENSIONS.pierHeight + 3, 0]}
      />

      <ambientLight intensity={0.4} />
      <directionalLight
        position={[20, 30, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <directionalLight position={[-15, 10, -10]} intensity={0.4} />
      <hemisphereLight args={[0x87ceeb, 0x3a5f3a, 0.3]} />

      <fog attach="fog" args={[0x1a1a2e, 50, 120]} />

      <Ground />
      <Arch />
      <Pier side="left" onClick={handlePierClick} />
      <Pier side="right" onClick={handlePierClick} />
      <Deck />
      <CutSection />
      <SettlementArrow side="left" />
      <SettlementArrow side="right" />

      <Grid 
        args={[60, 60]} 
        position={[0, 0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#2a3a4a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#4a5a6a"
        fadeDistance={60}
        fadeStrength={1}
      />
    </>
  );
};

export const BridgeScene: React.FC<BridgeSceneProps> = ({ onPierClick, onPierScreenUpdate }) => {
  return (
    <div id="scene-container" className="w-full h-full">
      <Canvas
        shadows
        gl={{ 
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: true,
        }}
        camera={{ position: [30, 20, 25], fov: 50 }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(0x1a1a2e);
          scene.background = new THREE.Color(0x1a1a2e);
        }}
      >
        <SceneContent 
          onPierClick={onPierClick || (() => {})} 
          onPierScreenUpdate={onPierScreenUpdate}
        />
      </Canvas>
    </div>
  );
};
