import React from 'react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { X } from 'lucide-react';

interface SettlementLabelProps {
  pierSide: 'left' | 'right';
  position: { x: number; y: number };
}

export const SettlementLabel: React.FC<SettlementLabelProps> = ({ pierSide, position }) => {
  const { settlementValues, selectPier } = useBridgeStore();
  const value = settlementValues[pierSide];

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <div className="relative bg-slate-900/95 backdrop-blur-md border border-amber-600/60 rounded-xl p-4 shadow-2xl shadow-amber-900/30 min-w-[180px]">
        <button
          onClick={() => selectPier(null)}
          className="absolute top-2 right-2 p-1 text-slate-400 hover:text-white transition-colors rounded hover:bg-slate-700/50"
        >
          <X size={14} />
        </button>
        
        <div className="text-center">
          <div className="text-xs text-amber-400 font-medium mb-1">
            {pierSide === 'left' ? '左侧' : '右侧'}墩台
          </div>
          <div className="text-3xl font-bold text-amber-200 font-mono">
            {value.toFixed(1)}
            <span className="text-sm text-slate-400 ml-1">mm</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">累计沉降量</div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">方向</span>
            <span className="text-slate-300 flex items-center gap-1">
              <span className="text-lg">↓</span> 向下沉降
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-slate-500">监测日期</span>
            <span className="text-slate-300">2026-06-01</span>
          </div>
        </div>

        <div 
          className="absolute left-1/2 -bottom-2 w-4 h-4 bg-slate-900/95 border-r border-b border-amber-600/60 transform -translate-x-1/2 rotate-45"
        />
      </div>
    </div>
  );
};
