import React, { useState } from 'react';
import { X, Download, FileJson, FileSpreadsheet, Printer, Check, Copy } from 'lucide-react';
import { GeneDataset } from '../types/bioinformatics';

interface ExportModalProps {
  dataset: GeneDataset | null;
  currentDdg: number;
  currentMutation: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  dataset,
  currentDdg,
  currentMutation,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dataset) return null;

  const exportJsonData = {
    app: 'G1 Tools v2.4',
    generatedAt: new Date().toISOString(),
    queryGene: {
      symbol: dataset.symbol,
      fullName: dataset.fullName,
      organism: dataset.targetOrganism,
      refSeqTranscript: dataset.refSeqTranscript,
      refSeqProtein: dataset.refSeqProtein,
      length: `${dataset.lengthAa} aa`,
      molWeight: `${dataset.molWeightKDa} kDa`,
      pdbId: dataset.pdbId,
      expressionDysregulation: `${dataset.dysregulationLog2FC} log2FC`,
    },
    simulatedThermodynamics: {
      mutation: currentMutation,
      ddG_kcal_per_mol: currentDdg,
      interpretation: currentDdg < -1.0 ? 'Significantly Destabilizing' : 'Tolerated',
    },
    blastResults: dataset.blastHits,
    geoExpressionProfile: {
      datasetId: dataset.geoDatasetId,
      moderatedT: dataset.geoModeratedT,
      bStatistic: dataset.geoBStat,
      differentials: dataset.volcanoPoints,
    },
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(exportJsonData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `G1_Tools_${dataset.symbol}_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTsv = () => {
    // Generate TSV for BLAST & GEO
    let tsv = `# G1 TOOLS BIOINFORMATICS PIPELINE EXPORT\n# Target: ${dataset.symbol} (${dataset.targetOrganism})\n\n`;
    tsv += `# MODULE 1: BLASTP HITS\nAccession\tOrganism\tMaxScore\tQueryCover\tEValue\tPerIdentity\tSignificance\n`;
    dataset.blastHits.forEach((h) => {
      tsv += `${h.accession}\t${h.organism}\t${h.maxScore}\t${h.queryCover}\t${h.eValue}\t${h.perIdentity}\t${h.significance}\n`;
    });

    tsv += `\n# MODULE 4: GEO2R DIFFERENTIAL EXPRESSION (${dataset.geoDatasetId})\nGene\tlog2FC\tpValue\tAdjP\tStatus\tCategory\n`;
    dataset.volcanoPoints.forEach((p) => {
      tsv += `${p.gene}\t${p.log2FC}\t${p.pVal}\t${p.adjP}\t${p.status}\t${p.category}\n`;
    });

    const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `G1_Tools_${dataset.symbol}_data.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl bg-[#0d1320] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Export Computational Analysis Report
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-900/60 p-3 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div>Gene Target: <span className="text-cyan-400 font-bold">{dataset.symbol}</span> ({dataset.targetOrganism})</div>
            <div>Analyzed Mutation: <span className="text-rose-400 font-bold">{currentMutation}</span> (ΔΔG {currentDdg} kcal/mol)</div>
            <div>Cohort Dataset: <span className="text-emerald-400">{dataset.geoDatasetId}</span> ({dataset.geoTargetStats.log2FC > 0 ? `+${dataset.geoTargetStats.log2FC}` : dataset.geoTargetStats.log2FC} log₂FC)</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* JSON option */}
            <button
              onClick={handleDownloadJson}
              className="p-3 rounded bg-[#101524] border border-slate-850 hover:border-cyan-500/60 hover:bg-cyan-950/20 text-left transition flex flex-col justify-between group"
            >
              <div>
                <FileJson className="w-5 h-5 text-cyan-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-slate-200">Full JSON Bundle</div>
                <div className="text-[10px] text-slate-400 mt-1">Complete nested pipeline data & metrics</div>
              </div>
              <div className="mt-3 text-[10px] font-mono text-cyan-400 font-semibold">Download .JSON →</div>
            </button>

            {/* TSV option */}
            <button
              onClick={handleDownloadTsv}
              className="p-3 rounded bg-[#101524] border border-slate-850 hover:border-emerald-500/60 hover:bg-emerald-950/20 text-left transition flex flex-col justify-between group"
            >
              <div>
                <FileSpreadsheet className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-slate-200">TSV Matrix</div>
                <div className="text-[10px] text-slate-400 mt-1">BLAST alignments & GEO volcano tables</div>
              </div>
              <div className="mt-3 text-[10px] font-mono text-emerald-400 font-semibold">Download .TSV →</div>
            </button>

            {/* Print / PDF option */}
            <button
              onClick={handlePrintPdf}
              className="p-3 rounded bg-[#101524] border border-slate-850 hover:border-purple-500/60 hover:bg-purple-950/20 text-left transition flex flex-col justify-between group"
            >
              <div>
                <Printer className="w-5 h-5 text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                <div className="font-semibold text-slate-200">Print / PDF</div>
                <div className="text-[10px] text-slate-400 mt-1">Browser print to PDF formatted report</div>
              </div>
              <div className="mt-3 text-[10px] font-mono text-purple-400 font-semibold">Print Report →</div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#101726] border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
