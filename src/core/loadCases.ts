import { LoadCaseType, LoadCaseStressData, StressTables, OVER_LIMIT_THRESHOLD } from '../types';
import stressTablesData from '../data/stressTables.json';
import { getStressRatioAtPosition } from '../utils/geometryUtils';

const stressTables = stressTablesData as StressTables;

export const CASE_DAILY: LoadCaseType = 'daily';
export const CASE_FESTIVAL: LoadCaseType = 'festival';
export const CASE_EMERGENCY: LoadCaseType = 'emergency';

export const LOAD_CASE_MULTIPLIERS: Record<LoadCaseType, number> = {
  [CASE_DAILY]: 1.0,
  [CASE_FESTIVAL]: 1.35,
  [CASE_EMERGENCY]: 0.65,
};

export function getLoadCaseData(caseType: LoadCaseType): LoadCaseStressData {
  return stressTables[caseType];
}

export function recalculateStressRatios(
  caseType: LoadCaseType,
  segments: number = 101
): number[] {
  const data = getLoadCaseData(caseType);
  const ratios: number[] = [];
  const multiplier = LOAD_CASE_MULTIPLIERS[caseType];

  for (let i = 0; i < segments; i++) {
    const position = (i / (segments - 1)) * 100;
    const baseRatio = getStressRatioAtPosition(
      position,
      data.stressRatios,
      data.positions
    );
    const adjustedRatio = Math.min(1, baseRatio * multiplier);
    ratios.push(adjustedRatio);
  }

  return ratios;
}

export function getMaxStressRatioAtPosition(
  positionPercent: number,
  caseType: LoadCaseType
): number {
  const data = getLoadCaseData(caseType);
  const multiplier = LOAD_CASE_MULTIPLIERS[caseType];
  const baseRatio = getStressRatioAtPosition(
    positionPercent,
    data.stressRatios,
    data.positions
  );
  return Math.min(1, baseRatio * multiplier);
}

export function getStressRatioForSection(
  positionPercent: number,
  xPercent: number,
  caseType: LoadCaseType
): number {
  const baseData = getLoadCaseData(caseType);
  const multiplier = LOAD_CASE_MULTIPLIERS[caseType];
  
  const baseRatio = getStressRatioAtPosition(
    positionPercent,
    baseData.stressRatios,
    baseData.positions
  );
  
  const archFactor = 0.8 + 0.4 * Math.sin((xPercent / 100) * Math.PI);
  const adjustedRatio = baseRatio * archFactor * multiplier;
  
  return Math.min(1, Math.max(0, adjustedRatio));
}

export function compareAllCases(
  positionPercent: number
): Record<LoadCaseType, number> {
  const result: Record<LoadCaseType, number> = {
    daily: 0,
    festival: 0,
    emergency: 0,
  };
  result[CASE_DAILY] = getMaxStressRatioAtPosition(positionPercent, CASE_DAILY);
  result[CASE_FESTIVAL] = getMaxStressRatioAtPosition(positionPercent, CASE_FESTIVAL);
  result[CASE_EMERGENCY] = getMaxStressRatioAtPosition(positionPercent, CASE_EMERGENCY);
  return result;
}

export interface SectionStressAnalysis {
  position: number;
  maxStressRatio: number;
  isOverLimit: boolean;
  loadCase: LoadCaseType;
  comparison: Record<LoadCaseType, number>;
}

export function analyzeSectionAtPosition(
  positionPercent: number,
  caseType: LoadCaseType
): SectionStressAnalysis {
  const maxStressRatio = getMaxStressRatioAtPosition(positionPercent, caseType);
  const comparison = compareAllCases(positionPercent);
  
  return {
    position: positionPercent,
    maxStressRatio,
    isOverLimit: maxStressRatio > OVER_LIMIT_THRESHOLD,
    loadCase: caseType,
    comparison,
  };
}

export function generateSectionStressProfile(
  positionPercent: number,
  caseType: LoadCaseType,
  xSegments: number = 20
): { x: number; stressRatio: number }[] {
  const profile: { x: number; stressRatio: number }[] = [];
  
  for (let i = 0; i <= xSegments; i++) {
    const xPercent = (i / xSegments) * 100;
    profile.push({
      x: xPercent,
      stressRatio: getStressRatioForSection(positionPercent, xPercent, caseType),
    });
  }
  
  return profile;
}

export function recalculateAllSections(
  caseType: LoadCaseType,
  zSegments: number = 11
): { position: number; maxStress: number; isOverLimit: boolean }[] {
  const results: { position: number; maxStress: number; isOverLimit: boolean }[] = [];
  
  for (let i = 0; i < zSegments; i++) {
    const position = (i / (zSegments - 1)) * 100;
    const maxStress = getMaxStressRatioAtPosition(position, caseType);
    results.push({
      position,
      maxStress,
      isOverLimit: maxStress > OVER_LIMIT_THRESHOLD,
    });
  }
  
  return results;
}

export function getOverLimitSections(caseType: LoadCaseType): number[] {
  const allSections = recalculateAllSections(caseType);
  return allSections.filter(s => s.isOverLimit).map(s => s.position);
}

export function getCaseDisplayName(caseType: LoadCaseType): string {
  const names: Record<LoadCaseType, string> = {
    daily: '日常通行',
    festival: '庙会集中',
    emergency: '应急戒严',
  };
  return names[caseType];
}

export function getCaseDescription(caseType: LoadCaseType): string {
  const descriptions: Record<LoadCaseType, string> = {
    daily: '车辆与行人混合通行，标准荷载分布',
    festival: '密集人群荷载，桥面积载率高，应力水平显著提升',
    emergency: '仅允许步行通过，荷载最轻，应力水平最低',
  };
  return descriptions[caseType];
}

export function interpolateStressRatios(
  targetPositions: number[],
  sourceData: LoadCaseStressData
): number[] {
  return targetPositions.map(pos => 
    getStressRatioAtPosition(pos, sourceData.stressRatios, sourceData.positions)
  );
}

export function calculateStressDistribution(
  cutPosition: number,
  caseType: LoadCaseType,
  archSpan: number,
  numPoints: number = 50
): { x: number; y: number; stressRatio: number }[] {
  const data = getLoadCaseData(caseType);
  const multiplier = LOAD_CASE_MULTIPLIERS[caseType];
  const results: { x: number; y: number; stressRatio: number }[] = [];
  
  const baseStress = getStressRatioAtPosition(
    cutPosition,
    data.stressRatios,
    data.positions
  );
  
  for (let i = 0; i <= numPoints; i++) {
    const x = (i / numPoints) * archSpan;
    const xPercent = (x / archSpan) * 100;
    const archFactor = 0.7 + 0.6 * Math.sin((xPercent / 100) * Math.PI);
    const stressRatio = Math.min(1, baseStress * archFactor * multiplier);
    
    results.push({ x, y: 0, stressRatio });
  }
  
  return results;
}
