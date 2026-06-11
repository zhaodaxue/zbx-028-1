import React from 'react';
import { Download, Info } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { LoadCaseType, LOAD_CASES } from '../../types';
import { exportSectionData } from '../../utils/exportUtils';

export const Header: React.FC = () => {
  const { currentLoadCase, setLoadCase, cutPosition } = useBridgeStore();

  const handleExport = async () => {
    try {
      await exportSectionData(cutPosition, currentLoadCase, 'scene-container');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-amber-800/30 px-6 py-3">
      <div className="flex items-center justify-between max-w-full">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center">
              <span className="text-white font-bold text-lg">拱</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-amber-100 tracking-wide" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                石拱桥拱圈应力剖切分析系统
              </h1>
              <p className="text-xs text-slate-400">文物保护中心 · 古桥修缮研判工具</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">荷载工况：</span>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
              {LOAD_CASES.map((caseInfo) => (
                <button
                  key={caseInfo.id}
                  onClick={() => setLoadCase(caseInfo.id as LoadCaseType)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 ${
                    currentLoadCase === caseInfo.id
                      ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {caseInfo.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-lg font-medium transition-all duration-300 shadow-lg hover:shadow-amber-600/40 hover:-translate-y-0.5"
          >
            <Download size={18} />
            导出数据
          </button>

          <button className="p-2 text-slate-400 hover:text-amber-400 transition-colors">
            <Info size={20} />
          </button>
        </div>
      </div>
    </header>
  );
};
