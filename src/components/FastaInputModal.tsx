import React, { useState } from 'react';
import { X, Dna, Upload, ArrowRight, Sparkles, Check, AlertCircle } from 'lucide-react';

interface FastaInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: string) => void;
  isLoading: boolean;
}

const SAMPLE_PRESETS = [
  {
    name: 'EGFR',
    desc: 'Epidermal growth factor receptor (P00533)',
    query: 'EGFR',
  },
  {
    name: 'KRAS',
    desc: 'GTPase KRas oncogene (P01116)',
    query: 'KRAS',
  },
  {
    name: 'INS (Insulin)',
    desc: 'Human insulin hormone (P01308)',
    query: 'INS',
  },
  {
    name: 'MYC',
    desc: 'Myc proto-oncogene protein (P01106)',
    query: 'MYC',
  },
  {
    name: 'PTEN',
    desc: 'Phosphatase and tensin homolog (P60484)',
    query: 'PTEN',
  },
  {
    name: 'Custom FASTA',
    desc: 'Synthetic GFP Fluorophore sequence',
    query: `>GFP_Aequorea_victoria green fluorescent protein
MSKGEELFTGVVPILVELDGDVNGHKFSVSGEGEGDATYGKLTLKFICTTGKLPVPWPTL
VTTFSYGVQCFSRYPDHMKQHDFFKSAMPEGYVQERTIFFKDDGNYKTRAEVKFEGDTLV
NRIELKGIDFKEDGNILGHKLEYNYNSHNVYIMADKQKNGIKVNFKIRHNIEDGSVQLAD
HYQQNTPIGDGPVLLPDNHYLSTQSALSKDPNEKRDHMVLLEFVTAAGITHGMDELYK`,
  },
];

export const FastaInputModal: React.FC<FastaInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (val?: string) => {
    const q = (val || text).trim();
    if (!q) {
      setError('Please enter a gene symbol, accession number, or paste a FASTA sequence.');
      return;
    }
    setError(null);
    onSubmit(q);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-2xl bg-[#0d1320] border border-cyan-500/50 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Dna className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 text-sm">
                Custom Target Input: Name, Accession or Raw FASTA
              </h3>
              <p className="text-[11px] text-slate-400">
                Supports Gene Symbols (EGFR, KRAS), UniProt/RefSeq Accessions (P00533, NP_005219.2), or Multi-line FASTA
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Quick Presets */}
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2">
              QUICK TEST PRESETS (CLICK TO LOAD IMMEDIATELY):
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SAMPLE_PRESETS.map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => {
                    setText(sample.query);
                    handleSubmit(sample.query);
                  }}
                  className="p-2.5 rounded bg-[#101524] border border-slate-800 hover:border-cyan-500/60 hover:bg-cyan-950/20 text-left transition"
                >
                  <div className="font-bold text-cyan-300 text-xs font-mono">{sample.name}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{sample.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Textarea for input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Enter Gene Name, Accession Number, or Paste FASTA Sequence:
            </label>
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setError(null);
              }}
              rows={6}
              placeholder={`Examples:\n• Gene Symbol: EGFR or KRAS or MYC\n• Accession: P00533 or NP_005219.2\n• Raw FASTA:\n>custom_protein\nMEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGP...`}
              className="w-full bg-[#070b12] border border-slate-700 focus:border-cyan-500 rounded p-3 font-mono text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none select-text leading-relaxed"
            />
          </div>

          {error && (
            <div className="p-2.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-[#101726] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setText('')}
            className="text-xs text-slate-400 hover:text-slate-200 font-mono"
          >
            Clear Text
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !text.trim()}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            >
              {isLoading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Resolving from UniProt/NCBI...</span>
                </>
              ) : (
                <>
                  <span>Load Target & Run Pipeline</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
