import React, { useState } from 'react';
import { Download, Info, X } from 'lucide-react';
import { useBridgeStore } from '../../store/useBridgeStore';
import { LoadCaseType, LOAD_CASES } from '../../types';
import { exportSectionData } from '../../utils/exportUtils';

export const Header: React.FC = () => {
  const { currentLoadCase, setLoadCase, cutPosition } = useBridgeStore();
  const [showInfo, setShowInfo] = useState(false);

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

          <button 
            onClick={() => setShowInfo(true)}
            className="p-2 text-slate-400 hover:text-amber-400 transition-colors"
            title="系统说明"
          >
            <Info size={20} />
          </button>
        </div>
      </div>

      {showInfo && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowInfo(false)}
        >
          <div 
            className="bg-slate-800 rounded-2xl border border-slate-600/50 shadow-2xl max-w-lg w-full mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50 bg-gradient-to-r from-amber-900/30 to-transparent">
              <h2 className="text-lg font-bold text-amber-100" style={{ fontFamily: 'Noto Serif SC, serif' }}>
                系统说明
              </h2>
              <button 
                onClick={() => setShowInfo(false)}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-amber-300 font-semibold mb-2 text-sm">关于本系统</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  石拱桥拱圈应力剖切分析系统是文物保护中心专为古桥修缮研判开发的三维沙盒工具。
                  通过直观的应力色带可视化，辅助文保人员快速评估不同荷载工况下的拱圈受力状态。
                </p>
              </div>
              <div>
                <h3 className="text-amber-300 font-semibold mb-2 text-sm">荷载工况</h3>
                <ul className="text-slate-300 text-sm space-y-1.5">
                  <li><span className="text-green-400 font-medium">日常通行：</span>车辆与行人混合通行，标准荷载分布</li>
                  <li><span className="text-orange-400 font-medium">庙会集中：</span>密集人群荷载，桥面积载率高</li>
                  <li><span className="text-blue-400 font-medium">应急戒严：</span>仅允许步行通过，荷载最轻</li>
                </ul>
              </div>
              <div>
                <h3 className="text-amber-300 font-semibold mb-2 text-sm">操作指南</h3>
                <ul className="text-slate-300 text-sm space-y-1.5">
                  <li>• 左键拖动：旋转三维视角</li>
                  <li>• 右键拖动：平移视图</li>
                  <li>• 滚轮：缩放视图</li>
                  <li>• 左侧滑块：调整剖切平面位置</li>
                  <li>• 点击墩台顶面：查看沉降量</li>
                  <li>• 顶部按钮：切换荷载工况</li>
                </ul>
              </div>
              <div>
                <h3 className="text-amber-300 font-semibold mb-2 text-sm">应力色带</h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  采用蓝→黄→红连续色带映射应力比。当截面最大应力比超过 85% 阈值时，
                  截面外轮廓将显示橙色闪烁预警边框。
                </p>
              </div>
              <div className="pt-2 border-t border-slate-700/50">
                <p className="text-slate-500 text-xs text-center">
                  文物保护中心 · 古桥修缮研判系统 v1.0.0
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
