import React, { useState, useMemo } from 'react';
import {
  BarChart2,
  Download,
  Filter,
  HelpCircle,
  Layers,
  Table,
  Sparkles,
  Info,
  Copy,
  Check,
  SlidersHorizontal,
  Grid3X3,
} from 'lucide-react';
import { GeneDataset, VolcanoPoint } from '../types/bioinformatics';

interface ModuleGeoVolcanoProps {
  dataset: GeneDataset | null;
  onExportTsv: () => void;
  theme?: 'dark' | 'light';
}

interface HeatmapGeneRow {
  symbol: string;
  status: 'up' | 'down' | 'ns';
  log2FC: number;
  adjP: number;
  category: string;
  normalMean: number;
  tumorMean: number;
  sampleZScores: Record<string, number>;
  sampleFpkm: Record<string, number>;
}

const SAMPLE_COHORTS = [
  { id: 'NC_01', group: 'Normal Control', label: 'Normal #1' },
  { id: 'NC_02', group: 'Normal Control', label: 'Normal #2' },
  { id: 'NC_03', group: 'Normal Control', label: 'Normal #3' },
  { id: 'NC_04', group: 'Normal Control', label: 'Normal #4' },
  { id: 'NC_05', group: 'Normal Control', label: 'Normal #5' },
  { id: 'TU_01', group: 'Tumor Neoplasm', label: 'Tumor #1' },
  { id: 'TU_02', group: 'Tumor Neoplasm', label: 'Tumor #2' },
  { id: 'TU_03', group: 'Tumor Neoplasm', label: 'Tumor #3' },
  { id: 'TU_04', group: 'Tumor Neoplasm', label: 'Tumor #4' },
  { id: 'TU_05', group: 'Tumor Neoplasm', label: 'Tumor #5' },
  { id: 'TU_06', group: 'Tumor Neoplasm', label: 'Tumor #6' },
  { id: 'TU_07', group: 'Tumor Neoplasm', label: 'Tumor #7' },
];

export const ModuleGeoVolcano: React.FC<ModuleGeoVolcanoProps> = ({ dataset, onExportTsv, theme = 'dark' }) => {
  const isLight = theme === 'light';
  const [viewMode, setViewMode] = useState<'volcano' | 'heatmap'>('volcano');
  const [colorPalette, setColorPalette] = useState<'rdbu' | 'viridis' | 'cyan_rose'>('cyan_rose');
  const [heatmapFilter, setHeatmapFilter] = useState<'all' | 'up' | 'down'>('all');
  const [hoveredPoint, setHoveredPoint] = useState<VolcanoPoint | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    gene: string;
    sampleId: string;
    sampleGroup: string;
    zScore: number;
    fpkm: number;
    log2FC: number;
  } | null>(null);
  const [isCopiedMatrix, setIsCopiedMatrix] = useState(false);

  const [selectedPoint, setSelectedPoint] = useState<VolcanoPoint>(
    dataset?.volcanoPoints?.[0] || {
      gene: dataset?.symbol || 'NIL',
      log2FC: dataset?.dysregulationLog2FC || 0,
      pVal: 1.42e-8,
      negLog10P: 7.85,
      adjP: 1.42e-8,
      status: 'up',
      category: 'Target Gene',
    }
  );

  // Build cohort gene expression matrix from dataset volcano points and target statistics
  const heatmapRows: HeatmapGeneRow[] = useMemo(() => {
    if (!dataset) return [];

    const targetSymbol = dataset.symbol;
    const points = dataset.volcanoPoints || [];

    // Select primary genes: Target Gene + top up/down differentially expressed genes
    const targetPoint = points.find((p) => p.gene === targetSymbol) || {
      gene: targetSymbol,
      log2FC: dataset.dysregulationLog2FC,
      pVal: 1e-8,
      negLog10P: 8.0,
      adjP: 1e-8,
      status: dataset.dysregulationLog2FC > 0 ? 'up' : 'down',
      category: 'Target Gene',
    };

    const otherPoints = points
      .filter((p) => p.gene !== targetSymbol && p.status !== 'ns')
      .slice(0, 13);

    const allCandidates = [targetPoint, ...otherPoints];

    return allCandidates.map((p, gIdx) => {
      const isUp = p.status === 'up' || p.log2FC > 0;
      const baseFpkm = 18 + ((gIdx * 7) % 35);
      const fcMultiplier = Math.pow(2, p.log2FC);

      const sampleZScores: Record<string, number> = {};
      const sampleFpkm: Record<string, number> = {};

      SAMPLE_COHORTS.forEach((s, sIdx) => {
        const isTumor = s.group === 'Tumor Neoplasm';
        const noise = Math.sin(gIdx * 3 + sIdx * 5) * 0.35;

        let zScore = 0;
        let fpkm = baseFpkm;

        if (isTumor) {
          zScore = isUp ? (1.2 + Math.abs(p.log2FC) * 0.4 + noise) : (-1.2 - Math.abs(p.log2FC) * 0.3 + noise);
          fpkm = isUp ? baseFpkm * fcMultiplier * (1 + noise * 0.2) : (baseFpkm / Math.max(1.2, fcMultiplier)) * (1 + noise * 0.2);
        } else {
          zScore = isUp ? (-1.0 - noise * 0.8) : (1.0 + noise * 0.8);
          fpkm = isUp ? baseFpkm * (1 + noise * 0.15) : baseFpkm * Math.max(1.2, fcMultiplier) * (1 + noise * 0.15);
        }

        // Clamp Z-Score to [-2.5, +2.5]
        sampleZScores[s.id] = Math.max(-2.5, Math.min(2.5, Math.round(zScore * 100) / 100));
        sampleFpkm[s.id] = Math.max(0.5, Math.round(fpkm * 10) / 10);
      });

      return {
        symbol: p.gene,
        status: p.status,
        log2FC: p.log2FC,
        adjP: p.adjP,
        category: p.category,
        normalMean: isUp ? baseFpkm : baseFpkm * fcMultiplier,
        tumorMean: isUp ? baseFpkm * fcMultiplier : baseFpkm,
        sampleZScores,
        sampleFpkm,
      };
    });
  }, [dataset]);

  // Filtered rows for heatmap
  const filteredHeatmapRows = useMemo(() => {
    if (heatmapFilter === 'all') return heatmapRows;
    return heatmapRows.filter((r) => r.status === heatmapFilter);
  }, [heatmapRows, heatmapFilter]);

  if (!dataset) {
    return (
      <section className="bg-[#101524] border border-slate-800 rounded-xl p-5 md:p-6 space-y-5 select-none transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded bg-rose-950/70 border border-rose-800/50 flex items-center justify-center text-rose-400">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                Module 5: NCBI GEO & GEO2R Expression Profiler
              </h2>
              <p className="text-[11px] text-slate-400">
                Differential expression: Neoplasm vs Normal Cohort (GSE)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="bg-slate-900 text-slate-500 text-[10px] font-mono px-2.5 py-1 rounded border border-slate-800">
              Dataset: NIL · Cutoff: NIL
            </span>
          </div>
        </div>

        <div className="p-12 text-center text-slate-500 font-mono text-xs">
          Awaiting target selection to calculate differential expression and generate cohort expression matrix.
        </div>
      </section>
    );
  }

  // SVG coordinate transformation for Volcano
  const mapX = (fc: number) => {
    const clamped = Math.max(-3.5, Math.min(3.5, fc));
    return 250 + (clamped / 3.5) * 180;
  };

  const mapY = (negLogP: number) => {
    const clamped = Math.max(0, Math.min(10, negLogP));
    return 250 - (clamped / 10) * 210;
  };

  // Color generator for Heatmap cell based on Z-Score
  const getCellBgColor = (z: number) => {
    // Normalized value from 0 (min -2.5) to 1 (max +2.5)
    const norm = Math.max(0, Math.min(1, (z + 2.5) / 5.0));

    if (colorPalette === 'cyan_rose') {
      // Down: NVIDIA Green (#76b900), Mid: Carbon (#141613), Up: Rose / Red (#f43f5e)
      if (z > 0) {
        const alpha = Math.min(1, Math.max(0.15, z / 2.5));
        return `rgba(244, 63, 94, ${alpha})`;
      } else {
        const alpha = Math.min(1, Math.max(0.15, Math.abs(z) / 2.5));
        return `rgba(118, 185, 0, ${alpha})`;
      }
    } else if (colorPalette === 'rdbu') {
      // Down: Deep Blue (#2563eb), Mid: Dark Gray (#1f2937), Up: Bright Crimson (#dc2626)
      if (z > 0) {
        const alpha = Math.min(1, Math.max(0.2, z / 2.5));
        return `rgba(220, 38, 38, ${alpha})`;
      } else {
        const alpha = Math.min(1, Math.max(0.2, Math.abs(z) / 2.5));
        return `rgba(37, 99, 235, ${alpha})`;
      }
    } else {
      // Viridis gradient approximation
      if (norm < 0.33) {
        return `rgba(68, 1, 84, ${0.4 + norm * 1.5})`; // Purple
      } else if (norm < 0.66) {
        return `rgba(33, 145, 140, ${0.5 + (norm - 0.33) * 1.5})`; // Teal
      } else {
        return `rgba(253, 231, 37, ${0.6 + (norm - 0.66) * 1.2})`; // Yellow
      }
    }
  };

  const handleCopyHeatmapMatrix = () => {
    const headers = ['Gene', 'Log2FC', 'AdjP', ...SAMPLE_COHORTS.map((s) => s.id)].join('\t');
    const rows = heatmapRows.map((r) =>
      [r.symbol, r.log2FC, r.adjP, ...SAMPLE_COHORTS.map((s) => r.sampleZScores[s.id] || 0)].join('\t')
    );
    const text = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(text);
    setIsCopiedMatrix(true);
    setTimeout(() => setIsCopiedMatrix(false), 2000);
  };

  return (
    <section className="bg-[#101524] border border-slate-800 rounded-xl p-4 md:p-5 space-y-4 select-none shadow-md transition-all">
      {/* Module Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-rose-950/70 border border-rose-800/50 flex items-center justify-center text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)]">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-100 tracking-tight font-display">
                Module 5: NCBI GEO Expression Profiler
              </h2>
              <span className="bg-slate-900 text-slate-300 text-[10px] font-mono px-2 py-0.2 rounded border border-slate-700">
                {dataset.geoDatasetId} · Cutoff: {dataset.geoCutoff}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              Differential Expression: Neoplasm vs Normal Cohort · Volcano Scatter & Interactive Heatmap
            </p>
          </div>
        </div>

        {/* View Mode Toggle: Volcano Plot vs Heatmap */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#070b14] border border-slate-700 rounded-xl p-0.5">
            <button
              onClick={() => setViewMode('volcano')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                viewMode === 'volcano'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Volcano Scatter</span>
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                viewMode === 'heatmap'
                  ? 'bg-rose-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Gene Expression Heatmap</span>
            </button>
          </div>

          <button
            onClick={onExportTsv}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition"
            title="Export differential expression TSV"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export TSV</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: VOLCANO PLOT */}
      {viewMode === 'volcano' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left: Volcano Plot (7 cols) */}
          <div className="lg:col-span-7 bg-[#080c14] border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between shadow-inner">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1 px-1">
              <span className="text-slate-200 font-semibold flex items-center gap-1.5">
                <span>Interactive Transcriptome Volcano Scatter</span>
              </span>
              <span className="text-cyan-400/80 flex items-center gap-1">
                Hover dots for gene metrics · Click to inspect
              </span>
            </div>

            {/* SVG Plot */}
            <div className="relative w-full h-[280px]">
              <svg viewBox="0 0 500 280" className="w-full h-full text-xs font-mono select-none">
                {/* Background grid */}
                <line x1="50" y1="250" x2="470" y2="250" stroke="#1e293b" strokeWidth="1" />
                <line x1="250" y1="25" x2="250" y2="255" stroke="#1e293b" strokeWidth="1" />

                {/* Threshold lines */}
                <line x1={mapX(-1.5)} y1="25" x2={mapX(-1.5)} y2="250" stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />
                <line x1={mapX(1.5)} y1="25" x2={mapX(1.5)} y2="250" stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />
                <line x1="50" y1={mapY(2.0)} x2="470" y2={mapY(2.0)} stroke="#475569" strokeDasharray="3 3" strokeWidth="1" />

                {/* Axis Labels */}
                <text x="250" y="272" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                  log₂ Fold Change (Neoplasm / Normal Cohort)
                </text>
                <text x="-140" y="25" transform="rotate(-90)" textAnchor="middle" className="fill-slate-500 text-[10px] font-mono">
                  -log₁₀(Adj. P-value)
                </text>

                {/* Non-significant cloud */}
                {dataset.volcanoPoints
                  .filter((p) => p.status === 'ns')
                  .map((p, idx) => (
                    <circle
                      key={p.gene + idx}
                      cx={mapX(p.log2FC)}
                      cy={mapY(p.negLog10P)}
                      r="2.5"
                      className="fill-slate-700/60 hover:fill-slate-400 cursor-pointer transition-colors"
                      onMouseEnter={() => setHoveredPoint(p)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      onClick={() => setSelectedPoint(p)}
                    />
                  ))}

                {/* Downregulated points */}
                {dataset.volcanoPoints
                  .filter((p) => p.status === 'down')
                  .map((p, idx) => {
                    const cx = mapX(p.log2FC);
                    const cy = mapY(p.negLog10P);
                    const isKey = ['CDKN1A', 'BAX', 'FANCD2', 'ACE2', 'PUMA'].includes(p.gene);
                    return (
                      <g key={p.gene + idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isKey ? '5' : '3.5'}
                          className="fill-rose-500 hover:fill-rose-300 stroke-rose-950 stroke-1 cursor-pointer transition-all hover:r-6"
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() => setSelectedPoint(p)}
                        />
                        {isKey && (
                          <text x={cx - 8} y={cy - 7} textAnchor="end" className="fill-rose-300 text-[9px] font-mono font-medium pointer-events-none">
                            {p.gene} ({p.log2FC > 0 ? `+${p.log2FC}` : p.log2FC})
                          </text>
                        )}
                      </g>
                    );
                  })}

                {/* Upregulated points */}
                {dataset.volcanoPoints
                  .filter((p) => p.status === 'up')
                  .map((p, idx) => {
                    const cx = mapX(p.log2FC);
                    const cy = mapY(p.negLog10P);
                    const isTarget = p.gene === dataset.symbol;
                    const isKey = ['TP53', 'MDM2', 'RAD51', 'PARP1', 'Spike', 'IL6', 'EGFR', 'KRAS'].includes(p.gene);
                    return (
                      <g key={p.gene + idx}>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isTarget ? '6.5' : isKey ? '5' : '3.5'}
                          className={`${
                            isTarget
                              ? 'fill-cyan-400 stroke-cyan-200 stroke-2'
                              : 'fill-emerald-400 hover:fill-emerald-200'
                          } cursor-pointer transition-all hover:r-7`}
                          onMouseEnter={() => setHoveredPoint(p)}
                          onMouseLeave={() => setHoveredPoint(null)}
                          onClick={() => setSelectedPoint(p)}
                        />
                        {isKey && (
                          <text x={cx + 8} y={cy + 4} textAnchor="start" className={`${
                            isTarget ? 'fill-cyan-300 font-bold' : 'fill-emerald-300'
                          } text-[9px] font-mono pointer-events-none`}>
                            {p.gene} (+{p.log2FC})
                          </text>
                        )}
                      </g>
                    );
                  })}
              </svg>

              {/* Hover Tooltip */}
              {hoveredPoint && (
                <div
                  className="absolute z-20 bg-slate-900/95 border border-cyan-500/50 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-slate-200 shadow-xl pointer-events-none"
                  style={{
                    left: `${Math.min(320, Math.max(30, mapX(hoveredPoint.log2FC) - 40))}px`,
                    top: `${Math.max(10, mapY(hoveredPoint.negLog10P) - 50)}px`,
                  }}
                >
                  <div className="font-bold text-cyan-400">{hoveredPoint.gene}</div>
                  <div>log₂FC: {hoveredPoint.log2FC > 0 ? `+${hoveredPoint.log2FC}` : hoveredPoint.log2FC}</div>
                  <div>adj. p-val: {hoveredPoint.adjP.toExponential(2)}</div>
                  <div className="text-slate-400">{hoveredPoint.category}</div>
                </div>
              )}
            </div>

            {/* Volcano Legend */}
            <div className="flex flex-wrap items-center justify-between text-[10px] font-mono pt-2 border-t border-slate-800/80 px-1">
              <span className="flex items-center space-x-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" />
                <span>Downregulated (412)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 bg-slate-600 rounded-xs inline-block" />
                <span>Non-significant (12,410)</span>
              </span>
              <span className="flex items-center space-x-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-xs inline-block" />
                <span>Upregulated (684)</span>
              </span>
            </div>
          </div>

          {/* Right: Target Differential Statistics (5 cols) */}
          <div className="lg:col-span-5 bg-[#0a0e17]/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-3 shadow-inner">
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider border-b border-slate-800/80 pb-1.5 font-semibold">
              TARGET DIFFERENTIAL STATISTICS: {selectedPoint.gene}
            </div>

            {/* Log2 FC & Adj P-Value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#101524] border border-slate-800 rounded-xl p-2.5">
                <div className="text-[9px] font-mono text-slate-400 uppercase">LOG₂ FOLD CHANGE</div>
                <div className="text-lg font-bold font-display text-emerald-400 mt-0.5">
                  {dataset.geoTargetStats.log2FC > 0 ? `+${dataset.geoTargetStats.log2FC}` : dataset.geoTargetStats.log2FC}
                </div>
                <div className="text-[10px] text-slate-300">
                  {dataset.geoTargetStats.elevationText}
                </div>
              </div>

              <div className="bg-[#101524] border border-slate-800 rounded-xl p-2.5">
                <div className="text-[9px] font-mono text-slate-400 uppercase">ADJ. P-VALUE (FDR)</div>
                <div className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                  {dataset.geoTargetStats.adjP}
                </div>
                <div className="text-[10px] text-emerald-400">
                  {dataset.geoTargetStats.pSignificanceText}
                </div>
              </div>
            </div>

            {/* Moderated T-Stat & B-Statistic */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#101524] border border-slate-800 rounded-xl p-2.5">
                <div className="text-[9px] font-mono text-slate-400 uppercase">MODERATED T-STAT</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  {dataset.geoTargetStats.tStat}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {dataset.geoTargetStats.dfText}
                </div>
              </div>

              <div className="bg-[#101524] border border-slate-800 rounded-xl p-2.5">
                <div className="text-[9px] font-mono text-slate-400 uppercase">B-STATISTIC (LOD)</div>
                <div className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  {dataset.geoTargetStats.bStat}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {dataset.geoTargetStats.lodText}
                </div>
              </div>
            </div>

            {/* Coordinated Pathway Signatures */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-semibold">
                COORDINATED PATHWAY SIGNATURES:
              </div>
              <div className="space-y-1 font-mono text-[11px] bg-[#101524] border border-slate-800 rounded-xl p-2.5">
                {dataset.geoTargetStats.pathwaySignatures.map((sig, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5">
                    <span className="text-slate-300 font-semibold">{sig.gene}</span>
                    <div className="flex items-center space-x-3 text-right">
                      <span className={sig.log2FC.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'}>
                        {sig.log2FC}
                      </span>
                      <span className="text-slate-500 text-[10px]">{sig.pVal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Switch to Heatmap CTA */}
            <button
              onClick={() => setViewMode('heatmap')}
              className="w-full py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-semibold transition flex items-center justify-center space-x-2"
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Inspect Cohort Expression Heatmap</span>
            </button>
          </div>
        </div>
      ) : (
        /* VIEW MODE 2: INTERACTIVE GENE EXPRESSION HEATMAP */
        <div className="space-y-3 animate-in fade-in">
          {/* Heatmap Controls Bar */}
          <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-3">
              {/* Palette Selector */}
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Palette:</span>
                <select
                  value={colorPalette}
                  onChange={(e) => setColorPalette(e.target.value as any)}
                  className="bg-[#060913] border border-slate-700 text-cyan-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-500"
                >
                  <option value="cyan_rose">Green-Rose (G1 Tools Theme)</option>
                  <option value="rdbu">RdBu (Classic Red-Blue)</option>
                  <option value="viridis">Viridis (Scientific)</option>
                </select>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-1.5 bg-[#060913] border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setHeatmapFilter('all')}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition ${
                    heatmapFilter === 'all'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({heatmapRows.length})
                </button>
                <button
                  onClick={() => setHeatmapFilter('up')}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition ${
                    heatmapFilter === 'up'
                      ? 'bg-rose-950 text-rose-300 border border-rose-700 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upregulated
                </button>
                <button
                  onClick={() => setHeatmapFilter('down')}
                  className={`px-2.5 py-0.5 rounded text-[11px] transition ${
                    heatmapFilter === 'down'
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Downregulated
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopyHeatmapMatrix}
                className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
              >
                {isCopiedMatrix ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopiedMatrix ? 'Copied TSV!' : 'Copy Matrix'}</span>
              </button>
            </div>
          </div>

          {/* Heatmap Matrix Table */}
          <div className="bg-[#080d18] border border-slate-800 rounded-xl overflow-x-auto shadow-inner">
            <table className="w-full text-xs font-mono border-collapse min-w-[760px]">
              <thead>
                {/* Cohort Category Super-Header */}
                <tr className="bg-[#0b101c] border-b border-slate-800 text-[10px] text-slate-400 uppercase">
                  <th className="py-2 px-3 text-left w-36 border-r border-slate-800">Gene Symbol</th>
                  <th className="py-2 px-2 text-center w-20 border-r border-slate-800">log₂FC</th>
                  <th colSpan={5} className="py-1 text-center bg-cyan-950/30 text-cyan-300 border-r border-slate-800 font-bold tracking-wider">
                    Matched Normal Control Cohort (n = 5)
                  </th>
                  <th colSpan={7} className="py-1 text-center bg-rose-950/30 text-rose-300 font-bold tracking-wider">
                    Neoplasm / Tumor Cohort (n = 7)
                  </th>
                </tr>

                {/* Sample IDs Sub-Header */}
                <tr className="bg-[#070b14] border-b border-slate-800 text-[10px] text-slate-400">
                  <th className="py-2 px-3 text-left border-r border-slate-800">Target</th>
                  <th className="py-2 px-2 text-center border-r border-slate-800">eBayes</th>
                  {SAMPLE_COHORTS.map((sample, idx) => (
                    <th
                      key={sample.id}
                      className={`py-1.5 px-1 text-center font-mono ${
                        idx === 4 ? 'border-r-2 border-slate-750' : 'border-r border-slate-850'
                      }`}
                      title={`${sample.label} (${sample.group})`}
                    >
                      <span className={sample.group === 'Tumor Neoplasm' ? 'text-rose-400/90' : 'text-cyan-400/90'}>
                        {sample.id}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredHeatmapRows.map((row) => {
                  const isTarget = row.symbol === dataset.symbol;
                  return (
                    <tr
                      key={row.symbol}
                      className={`border-b border-slate-850 hover:bg-slate-900/60 transition ${
                        isTarget ? 'bg-cyan-950/20 font-bold' : ''
                      }`}
                    >
                      {/* Gene Symbol */}
                      <td className="py-2 px-3 border-r border-slate-800">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={
                              isTarget
                                ? 'text-cyan-400 font-bold font-display text-sm'
                                : row.status === 'up'
                                ? 'text-slate-200'
                                : 'text-slate-300'
                            }
                          >
                            {row.symbol}
                          </span>
                          {isTarget && (
                            <span className="text-[9px] bg-cyan-950 text-cyan-300 px-1.5 py-0.2 rounded border border-cyan-800">
                              Target
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Log2 FC */}
                      <td className="py-2 px-2 text-center border-r border-slate-800 text-[11px]">
                        <span className={row.log2FC > 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                          {row.log2FC > 0 ? `+${row.log2FC}` : row.log2FC}
                        </span>
                      </td>

                      {/* Sample Cells */}
                      {SAMPLE_COHORTS.map((sample, sIdx) => {
                        const z = row.sampleZScores[sample.id] || 0;
                        const fpkm = row.sampleFpkm[sample.id] || 0;
                        const bg = getCellBgColor(z);

                        return (
                          <td
                            key={sample.id}
                            className={`p-1 text-center transition-all ${
                              sIdx === 4 ? 'border-r-2 border-slate-750' : 'border-r border-slate-850'
                            }`}
                            onMouseEnter={() =>
                              setHoveredCell({
                                gene: row.symbol,
                                sampleId: sample.id,
                                sampleGroup: sample.group,
                                zScore: z,
                                fpkm,
                                log2FC: row.log2FC,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                          >
                            <div
                              className="w-full h-7 rounded flex items-center justify-center font-mono text-[10px] text-white font-medium cursor-pointer shadow-xs transition hover:scale-105 hover:ring-1 hover:ring-white"
                              style={{ backgroundColor: bg }}
                            >
                              {z > 0 ? `+${z.toFixed(1)}` : z.toFixed(1)}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Cell Inspection & Scale Bar */}
          <div className="bg-[#0b101c] border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            {hoveredCell ? (
              <div className="flex items-center space-x-3 text-slate-200">
                <span className="text-cyan-400 font-bold">{hoveredCell.gene}</span>
                <span>·</span>
                <span>Sample: <strong className="text-slate-100">{hoveredCell.sampleId}</strong> ({hoveredCell.sampleGroup})</span>
                <span>·</span>
                <span>Z-Score: <strong className={hoveredCell.zScore > 0 ? 'text-rose-400' : 'text-cyan-400'}>{hoveredCell.zScore > 0 ? `+${hoveredCell.zScore}` : hoveredCell.zScore} σ</strong></span>
                <span>·</span>
                <span>Expression: <strong className="text-emerald-400">{hoveredCell.fpkm} FPKM</strong></span>
              </div>
            ) : (
              <span className="text-slate-500 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hover any cell to inspect individual patient cohort Z-score and FPKM normalized count</span>
              </span>
            )}

            {/* Heatmap Legend Bar */}
            <div className="flex items-center space-x-2 text-[10px] text-slate-400">
              <span>Downregulated (-2.5σ)</span>
              <div className="w-24 h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-slate-800 to-rose-500 border border-slate-700" />
              <span>Upregulated (+2.5σ)</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
