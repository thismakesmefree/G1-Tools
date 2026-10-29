import React, { useState } from 'react';
import { X, Copy, Check, Download, FileText } from 'lucide-react';
import { GeneDataset } from '../types/bioinformatics';

interface RawFastaModalProps {
  dataset: GeneDataset | null;
  isOpen: boolean;
  onClose: () => void;
}

export const RawFastaModal: React.FC<RawFastaModalProps> = ({ dataset, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !dataset) return null;

  const fullFasta = `${dataset.fastaHeader}\n${dataset.fastaSequence}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullFasta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullFasta], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${dataset.symbol}_canonical.fasta`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-[#0d1320] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Raw FASTA Sequence - {dataset.symbol}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-3 text-xs font-mono">
          <div className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded border border-slate-800 text-[11px] text-slate-400">
            <div>Length: <strong className="text-slate-200">{dataset.lengthAa} aa</strong></div>
            <div>Mol Weight: <strong className="text-slate-200">{dataset.molWeightKDa} kDa</strong></div>
            <div>Isoform: <strong className="text-cyan-400">{dataset.refSeqProtein}</strong></div>
          </div>

          <div className="bg-[#070b12] border border-slate-800 rounded p-3 text-slate-300 overflow-x-auto whitespace-pre font-mono text-xs leading-relaxed select-text">
            {fullFasta}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 bg-[#101726] border-t border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Sequence'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .FASTA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
