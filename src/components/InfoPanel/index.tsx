import React from 'react';
import { Activity, TrendingUp, AlertCircle, Gauge } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { compareAllCases, getCaseDisplayName } from '../../core/loadCases';
import { OVER_LIMIT_THRESHOLD } from '../../types';
import { mapStressToColorHex } from '../../utils/colorMapping';

export const InfoPanel: React.FC = () => {
  const { 
    cutPosition, 
    currentLoadCase, 
    maxStressRatio, 
    isOverLimit,
    settlementValues,
    selectedPier,
  } = useBridgeStore();

  const comparison = compareAllCases(cutPosition);

  const getStatusColor = (ratio: number) => {
    if (ratio > OVER_LIMIT_THRESHOLD) return 'text-orange-400';
    if (ratio > 0.6) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getStatusBg = (ratio: number) => {
    if (ratio > OVER_LIMIT_THRESHOLD) return 'bg-orange-900/30 border-orange-600/50';
    if (ratio > 0.6) return 'bg-yellow-900/30 border-yellow-600/50';
    return 'bg-green-900/30 border-green-600/50';
  };

  return (
    <div className="fixed right-0 top-16 bottom-0 w-80 z-40 bg-slate-900/80 backdrop-blur-md border-l border-slate-700/50 p-5 overflow-y-auto">
      <div className="space-y-5">
        <div className={`rounded-xl p-4 border ${getStatusBg(maxStressRatio)}`}>
          <div className="flex items-center gap-2 mb-3">
            {isOverLimit ? (
              <AlertCircle className="text-orange-400" size={20} />
            ) : (
              <Activity className="text-green-400" size={20} />
            )}
            <h3 className="text-white font-semibold">
              {isOverLimit ? '应力超限预警' : '应力状态正常'}
            </h3>
          </div>
          
          <div className="text-center py-3">
            <div className={`text-5xl font-bold font-mono ${getStatusColor(maxStressRatio)}`}>
              {(maxStressRatio * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-slate-400 mt-1">
              最大应力比 / 阈值 {OVER_LIMIT_THRESHOLD * 100}%
            </div>
          </div>

          <div className="w-full h-3 bg-slate-700/50 rounded-full overflow-hidden relative">
            <div 
              className="h-full rounded-full transition-all duration-700"
              style={{ 
                width: `${Math.min(100, maxStressRatio * 100)}%`,
                backgroundColor: mapStressToColorHex(maxStressRatio),
              }}
            />
            <div 
              className="absolute top-0 h-full w-0.5 bg-white/70 z-10"
              style={{ left: `${OVER_LIMIT_THRESHOLD * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="text-amber-400" size={18} />
            <h3 className="text-amber-100 font-semibold">当前截面信息</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">剖切位置</span>
              <span className="text-white font-mono">{cutPosition.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">荷载工况</span>
              <span className="text-amber-300 font-medium">{getCaseDisplayName(currentLoadCase)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">超限状态</span>
              <span className={`font-medium ${isOverLimit ? 'text-orange-400' : 'text-green-400'}`}>
                {isOverLimit ? '超限' : '正常'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-amber-400" size={18} />
            <h3 className="text-amber-100 font-semibold">三工况对比</h3>
          </div>
          
          <div className="space-y-3">
            {(['daily', 'festival', 'emergency'] as const).map((caseType) => {
              const ratio = comparison[caseType];
              const isActive = caseType === currentLoadCase;
              const isOver = ratio > OVER_LIMIT_THRESHOLD;
              
              return (
                <div 
                  key={caseType}
                  className={`p-3 rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-amber-900/30 border-amber-600/50' 
                      : 'bg-slate-700/30 border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-sm ${isActive ? 'text-amber-200' : 'text-slate-300'}`}>
                      {getCaseDisplayName(caseType)}
                    </span>
                    <span className={`font-mono font-bold text-sm ${getStatusColor(ratio)}`}>
                      {ratio.toFixed(4)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        isOver ? 'bg-orange-500' : 'bg-slate-400'
                      }`}
                      style={{ 
                        width: `${ratio * 100}%`,
                        backgroundColor: isActive ? mapStressToColorHex(ratio) : undefined,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {selectedPier && (
          <div className="bg-slate-800/60 rounded-xl p-4 border border-amber-600/50">
            <h3 className="text-amber-100 font-semibold mb-3">
              {selectedPier === 'left' ? '左侧' : '右侧'}墩台沉降
            </h3>
            <div className="text-center py-2">
              <div className="text-4xl font-bold text-amber-300 font-mono">
                {settlementValues[selectedPier].toFixed(1)}
                <span className="text-lg text-slate-400 ml-1">mm</span>
              </div>
              <div className="text-sm text-slate-400 mt-1">累计沉降量</div>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700/50 text-xs text-slate-500">
              <p>箭头方向：↓ 向下沉降</p>
              <p>箭头长度：与沉降量成正比</p>
            </div>
          </div>
        )}

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-amber-100 font-semibold mb-3">桥体参数</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-700/40 rounded-lg p-2">
              <div className="text-slate-500 text-xs">跨度</div>
              <div className="text-white font-mono">20 m</div>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-2">
              <div className="text-slate-500 text-xs">拱半径</div>
              <div className="text-white font-mono">12 m</div>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-2">
              <div className="text-slate-500 text-xs">拱厚</div>
              <div className="text-white font-mono">1.2 m</div>
            </div>
            <div className="bg-slate-700/40 rounded-lg p-2">
              <div className="text-slate-500 text-xs">桥宽</div>
              <div className="text-white font-mono">8 m</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
