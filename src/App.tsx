import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { InfoPanel } from './components/InfoPanel';
import { BridgeScene } from './components/BridgeScene';
import { SettlementLabel } from './components/SettlementLabel';
import { useBridgeStore } from './store/useBridgeStore';

const App: React.FC = () => {
  const { selectedPier, selectPier } = useBridgeStore();
  const [pierScreenPos, setPierScreenPos] = useState<{ x: number; y: number } | null>(null);

  const handlePierClick = useCallback((side: 'left' | 'right', screenPos: { x: number; y: number }) => {
    selectPier(side);
    setPierScreenPos(screenPos);
  }, [selectPier]);

  const handlePierScreenUpdate = useCallback((side: 'left' | 'right', screenPos: { x: number; y: number }) => {
    if (selectedPier === side) {
      setPierScreenPos(screenPos);
    }
  }, [selectedPier]);

  const handleBackgroundClick = useCallback(() => {
    selectPier(null);
    setPierScreenPos(null);
  }, [selectPier]);

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-950 relative" onClick={handleBackgroundClick}>
      <Header />
      <ControlPanel />
      <InfoPanel />
      
      <div 
        className="absolute inset-0 pt-16 pl-72 pr-80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full relative">
          <BridgeScene onPierClick={handlePierClick} onPierScreenUpdate={handlePierScreenUpdate} />
          
          {selectedPier && pierScreenPos && (
            <SettlementLabel 
              pierSide={selectedPier} 
              position={pierScreenPos}
            />
          )}
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-full px-6 py-2 flex items-center gap-4">
          <span className="text-slate-400 text-sm">文物保护中心 · 古桥修缮研判系统</span>
          <span className="text-slate-600">|</span>
          <span className="text-amber-400 text-sm font-mono">v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default App;
