import { create } from 'zustand';
import { LoadCaseType, BridgeState, OVER_LIMIT_THRESHOLD } from '../types';
import settlementData from '../data/settlementData.json';
import { recalculateStressRatios, getMaxStressRatioAtPosition } from '../core/loadCases';

export const useBridgeStore = create<BridgeState>((set, get) => ({
  cutPosition: 50,
  currentLoadCase: 'daily',
  stressRatios: recalculateStressRatios('daily'),
  maxStressRatio: getMaxStressRatioAtPosition(50, 'daily'),
  isOverLimit: getMaxStressRatioAtPosition(50, 'daily') > OVER_LIMIT_THRESHOLD,
  selectedPier: null,
  settlementValues: {
    left: settlementData.leftPier.settlementMm,
    right: settlementData.rightPier.settlementMm,
  },
  showSection: true,
  showSettlementArrows: false,

  setCutPosition: (pos: number) => {
    const clampedPos = Math.max(0, Math.min(100, pos));
    const { currentLoadCase } = get();
    const maxStress = getMaxStressRatioAtPosition(clampedPos, currentLoadCase);
    
    set({
      cutPosition: clampedPos,
      maxStressRatio: maxStress,
      isOverLimit: maxStress > OVER_LIMIT_THRESHOLD,
    });
  },

  setLoadCase: (caseType: LoadCaseType) => {
    const { cutPosition } = get();
    const stressRatios = recalculateStressRatios(caseType);
    const maxStress = getMaxStressRatioAtPosition(cutPosition, caseType);
    
    set({
      currentLoadCase: caseType,
      stressRatios,
      maxStressRatio: maxStress,
      isOverLimit: maxStress > OVER_LIMIT_THRESHOLD,
    });
  },

  selectPier: (pier: 'left' | 'right' | null) => {
    set({ 
      selectedPier: pier,
      showSettlementArrows: pier !== null,
    });
  },

  recalculateStress: () => {
    const { currentLoadCase, cutPosition } = get();
    const stressRatios = recalculateStressRatios(currentLoadCase);
    const maxStress = getMaxStressRatioAtPosition(cutPosition, currentLoadCase);
    
    set({
      stressRatios,
      maxStressRatio: maxStress,
      isOverLimit: maxStress > OVER_LIMIT_THRESHOLD,
    });
  },

  toggleSettlementArrows: () => {
    set(state => ({
      showSettlementArrows: !state.showSettlementArrows,
    }));
  },
}));
