import * as THREE from 'three';

export type LoadCaseType = 'daily' | 'festival' | 'emergency';

export interface LoadCaseInfo {
  id: LoadCaseType;
  name: string;
  description: string;
  icon: string;
}

export interface StressDataPoint {
  position: number;
  stressRatio: number;
}

export interface LoadCaseStressData {
  positions: number[];
  stressRatios: number[];
  maxStress: number;
}

export interface StressTables {
  daily: LoadCaseStressData;
  festival: LoadCaseStressData;
  emergency: LoadCaseStressData;
}

export interface SettlementData {
  leftPier: {
    settlementMm: number;
    direction: 'down' | 'up';
    lastUpdated: string;
  };
  rightPier: {
    settlementMm: number;
    direction: 'down' | 'up';
    lastUpdated: string;
  };
}

export interface BridgeDimensions {
  span: number;
  archRadius: number;
  archThickness: number;
  archWidth: number;
  pierWidth: number;
  pierHeight: number;
  pierDepth: number;
  deckThickness: number;
  deckWidth: number;
}

export interface SectionVertex {
  x: number;
  y: number;
  z: number;
  stressRatio: number;
}

export interface IntersectionResult {
  points: THREE.Vector3[];
  stressRatios: number[];
  maxStressRatio: number;
}

export interface BridgeState {
  cutPosition: number;
  currentLoadCase: LoadCaseType;
  stressRatios: number[];
  maxStressRatio: number;
  isOverLimit: boolean;
  selectedPier: 'left' | 'right' | null;
  settlementValues: { left: number; right: number };
  showSection: boolean;
  showSettlementArrows: boolean;
  setCutPosition: (pos: number) => void;
  setLoadCase: (caseType: LoadCaseType) => void;
  selectPier: (pier: 'left' | 'right' | null) => void;
  recalculateStress: () => void;
  toggleSettlementArrows: () => void;
}

export const LOAD_CASES: LoadCaseInfo[] = [
  {
    id: 'daily',
    name: '日常通行',
    description: '车辆与行人混合通行，标准荷载分布',
    icon: 'car',
  },
  {
    id: 'festival',
    name: '庙会集中',
    description: '密集人群荷载，桥面积载率高',
    icon: 'users',
  },
  {
    id: 'emergency',
    name: '应急戒严',
    description: '仅允许步行通过，荷载最轻',
    icon: 'footprints',
  },
];

export const BRIDGE_DIMENSIONS: BridgeDimensions = {
  span: 20,
  archRadius: 12,
  archThickness: 1.2,
  archWidth: 8,
  pierWidth: 3,
  pierHeight: 6,
  pierDepth: 4,
  deckThickness: 0.5,
  deckWidth: 8,
};

export const OVER_LIMIT_THRESHOLD = 0.85;
