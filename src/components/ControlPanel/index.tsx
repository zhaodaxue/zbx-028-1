import React, { useCallback } from 'react';
import { MoveHorizontal, Layers, AlertTriangle } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { createColorLegend, STRESS_COLORS } from '../../utils/colorMapping';
import { LOAD_CASES, OVER_LIMIT_THRESHOLD } from '../../types';

const colorLegend = createColorLegend(20);

export const ControlPanel: React.FC = () => {
  const { 
    cutPosition, 
    setCutPosition, 
    currentLoadCase,
    maxStressRatio,
    isOverLimit,
    showSettlementArrows,
    toggleSettlementArrows,
  } = useBridgeStore();

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCutPosition(Number(e.target.value));
  }, [setCutPosition]);

  const currentCaseInfo = LOAD_CASES.find(c => c.id === currentLoadCase);

  return (
    <div className="fixed left-0 top-16 bottom-0 w-72 z-40 bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50 p-5 overflow-y-auto">
      <div className="space-y-6">
        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <MoveHorizontal className="text-amber-400" size={18} />
            <h3 className="text-amber-100 font-semibold">剖切位置控制</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-slate-400 text-sm">沿桥轴方向</span>
              <span className="text-2xl font-bold text-amber-300 font-mono">
                {cutPosition.toFixed(0)}%
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={cutPosition}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
              style={{
                background: `linear-gradient(to right, #b8860b 0%, #b8860b ${cutPosition}%, #334155 ${cutPosition}%, #334155 100%)`
              }}
            />
            
            <div className="flex justify-between text-xs text-slate-500">
              <span>0% (上游)</span>
              <span>50% (中游)</span>
              <span>100% (下游)</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="text-amber-400" size={18} />
            <h3 className="text-amber-100 font-semibold">应力色带图例</h3>
          </div>
          
          <div className="space-y-3">
            <div className="h-8 rounded-md overflow-hidden flex">
              {colorLegend.map((item, i) => (
                <div
                  key={i}
                  className="flex-1 transition-all duration-300"
                  style={{ backgroundColor: item.color }}
                />
              ))}
            </div>
            
            <div className="flex justify-between text-xs">
              <div className="text-center">
                <span className="block font-mono text-blue-400">0.0</span>
                <span className="text-slate-500">低应力</span>
              </div>
              <div className="text-center">
                <span className="block font-mono text-yellow-400">0.5</span>
                <span className="text-slate-500">中应力</span>
              </div>
              <div className="text-center">
                <span className="block font-mono text-red-400">1.0</span>
                <span className="text-slate-500">高应力</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: STRESS_COLORS.warning }}
                />
                <span className="text-sm text-slate-300">
                  超限阈值: {OVER_LIMIT_THRESHOLD}
                </span>
              </div>
              {isOverLimit && (
                <div className="flex items-center gap-2 p-2 bg-orange-900/30 rounded-lg border border-orange-600/50 animate-pulse">
                  <AlertTriangle className="text-orange-400" size={16} />
                  <span className="text-sm text-orange-300 font-medium">
                    当前截面应力超限！
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-amber-100 font-semibold mb-3">
            {currentCaseInfo?.name}工况说明
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {currentCaseInfo?.description}
          </p>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">当前最大应力比</span>
              <span className={`font-mono font-bold ${
                isOverLimit ? 'text-orange-400' : 'text-amber-300'
              }`}>
                {maxStressRatio.toFixed(4)}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  isOverLimit ? 'bg-orange-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, maxStressRatio * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-amber-100 font-semibold mb-3">显示选项</h3>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={showSettlementArrows}
                onChange={toggleSettlementArrows}
                className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
              />
              <span className="text-slate-300 text-sm group-hover:text-white transition-colors">
                显示沉降箭头
              </span>
            </label>
          </div>
        </div>

        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
          <h4 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            操作提示
          </h4>
          <ul className="text-xs text-slate-500 space-y-1.5">
            <li>• 左键拖动：旋转视角</li>
            <li>• 右键拖动：平移视图</li>
            <li>• 滚轮：缩放视图</li>
            <li>• 点击墩台：查看沉降量</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
