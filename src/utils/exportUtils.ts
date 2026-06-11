import html2canvas from 'html2canvas';
import { LoadCaseType, StressTables } from '../types';
import stressTablesData from '../data/stressTables.json';

const stressTables = stressTablesData as StressTables;

export async function captureScreenshot(
  elementId: string,
  filename?: string
): Promise<string> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with id ${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    backgroundColor: '#1a1a2e',
    scale: 2,
    useCORS: true,
    logging: false,
  });

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename || `section_screenshot_${Date.now()}.png`;
  link.href = dataUrl;
  link.click();

  return dataUrl;
}

export function generateStressComparisonCSV(
  cutPosition: number,
  currentCase: LoadCaseType
): string {
  const positions = stressTables.daily.positions;
  const cases: LoadCaseType[] = ['daily', 'festival', 'emergency'];
  const caseNames: Record<LoadCaseType, string> = {
    daily: '日常通行',
    festival: '庙会集中',
    emergency: '应急戒严',
  };

  const headers = ['剖切位置(%)', ...cases.map(c => caseNames[c] + '应力比')];
  const rows: string[][] = [];

  for (let i = 0; i < positions.length; i++) {
    const row = [
      positions[i].toString(),
      stressTables.daily.stressRatios[i].toFixed(4),
      stressTables.festival.stressRatios[i].toFixed(4),
      stressTables.emergency.stressRatios[i].toFixed(4),
    ];
    rows.push(row);
  }

  rows.push([]);
  rows.push(['当前切位', cutPosition.toString() + '%']);
  rows.push(['当前工况', caseNames[currentCase]]);
  rows.push(['当前切位应力比']);
  for (const c of cases) {
    const data = stressTables[c];
    const idx = positions.findIndex(p => p === Math.round(cutPosition / 10) * 10);
    if (idx >= 0) {
      rows.push([caseNames[c], data.stressRatios[idx].toFixed(4)]);
    }
  }

  const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
  return '\uFEFF' + csvContent;
}

export function downloadCSV(
  csvContent: string,
  filename: string
): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportSectionData(
  cutPosition: number,
  currentCase: LoadCaseType,
  canvasElementId: string
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const positionStr = Math.round(cutPosition).toString().padStart(3, '0');

  await captureScreenshot(
    canvasElementId,
    `section_${positionStr}pct_${timestamp}.png`
  );

  const csvContent = generateStressComparisonCSV(cutPosition, currentCase);
  downloadCSV(csvContent, `stress_comparison_${positionStr}pct_${timestamp}.csv`);
}

export interface ComparisonTableRow {
  position: number;
  daily: number;
  festival: number;
  emergency: number;
}

export function getComparisonTableData(): ComparisonTableRow[] {
  const positions = stressTables.daily.positions;
  return positions.map((pos, i) => ({
    position: pos,
    daily: stressTables.daily.stressRatios[i],
    festival: stressTables.festival.stressRatios[i],
    emergency: stressTables.emergency.stressRatios[i],
  }));
}
