import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeftRight,
  Dna,
  Sparkles,
  Copy,
  Check,
  Download,
  Play,
  RotateCcw,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  translateDnaToProtein,
  translateSixFrames,
  reverseTranslateProtein,
  calculateNucleotideMetrics,
  GENETIC_CODE,
  HUMAN_OPTIMAL_CODONS,
} from '../utils/translationMath';
import { calculateMolWeight, calculateIsoelectricPoint, AMINO_ACIDS } from '../utils/bioMath';
import { GeneDataset } from '../types/bioinformatics';

interface SequenceTranslatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  dataset: GeneDataset | null;
  onApplyTranslatedTarget: (symbol: string, proteinSequence: string, nucleotideSequence?: string) => void;
}

export const SequenceTranslatorModal: React.FC<SequenceTranslatorModalProps> = ({
  isOpen,
  onClose,
  dataset,
  onApplyTranslatedTarget,
}) => {
  // Mode: 'dna_to_protein' or 'protein_to_dna'
  const [mode, setMode] = useState<'dna_to_protein' | 'protein_to_dna'>('dna_to_protein');

  // Inputs
  const [dnaInput, setDnaInput] = useState<string>(
    'ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCAGAT'
  );
  const [proteinInput, setProteinInput] = useState<string>(
    'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPD'
  );

  // Settings
  const [selectedFrame, setSelectedFrame] = useState<1 | 2 | 3>(1);
  const [reverseMode, setReverseMode] = useState<'human_optimal' | 'degenerate'>('human_optimal');
  const [activeTab, setActiveTab] = useState<'translator' | 'genetic_code'>('translator');
  const [copied, setCopied] = useState<string | null>(null);

  // Sync with active target on open
  useEffect(() => {
    if (dataset && isOpen) {
      const cleanProt = dataset.fastaSequence.replace(/[^A-Za-z]/g, '').toUpperCase();
      if (cleanProt.length > 0) {
        setProteinInput(cleanProt);
        const back = reverseTranslateProtein(cleanProt, 'human_optimal');
        setDnaInput(back.dnaSeq);
      }
    }
  }, [dataset, isOpen]);

  if (!isOpen) return null;

  // Real-time calculations
  const dnaMetrics = calculateNucleotideMetrics(dnaInput);
  const translation1 = translateDnaToProtein(dnaInput, selectedFrame);
  const sixFrames = translateSixFrames(dnaInput);

  const backTranslation = reverseTranslateProtein(proteinInput, reverseMode);
  const proteinMw = calculateMolWeight(mode === 'dna_to_protein' ? translation1.proteinSeq : proteinInput);
  const proteinPi = calculateIsoelectricPoint(mode === 'dna_to_protein' ? translation1.proteinSeq : proteinInput);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSwapMode = () => {
    if (mode === 'dna_to_protein') {
      setProteinInput(translation1.proteinSeq);
      setMode('protein_to_dna');
    } else {
      setDnaInput(backTranslation.dnaSeq);
      setMode('dna_to_protein');
    }
  };

  const handleApplyToWorkspace = () => {
    if (mode === 'dna_to_protein') {
      const symbol = dataset?.symbol ? `${dataset.symbol}_TRANS` : 'TRANSLATED_ORF';
      onApplyTranslatedTarget(symbol, translation1.proteinSeq, dnaInput);
    } else {
      const symbol = dataset?.symbol ? `${dataset.symbol}_BACK` : 'BACK_TRANSLATED';
      onApplyTranslatedTarget(symbol, proteinInput, backTranslation.dnaSeq);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none animate-in fade-in">
      <div className="w-full max-w-4xl bg-[#0d1320] border-2 border-cyan-500/60 rounded-xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                <span>Sequence Translation & Codon Engine</span>
                <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800/60">
                  Standard Genetic Code v2.4
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                Bidirectional DNA/RNA ⇄ Protein translator · 6-frame reading frames · Codon optimization
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex bg-slate-900 rounded p-0.5 border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveTab('translator')}
                className={`px-3 py-1 rounded transition ${
                  activeTab === 'translator' ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Translator
              </button>
              <button
                onClick={() => setActiveTab('genetic_code')}
                className={`px-3 py-1 rounded transition flex items-center gap-1 ${
                  activeTab === 'genetic_code' ? 'bg-cyan-600 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                <BookOpen className="w-3 h-3" />
                <span>Codon Chart</span>
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        {activeTab === 'genetic_code' ? (
          /* Genetic Code Reference Tab */
          <div className="p-5 overflow-y-auto space-y-4 max-h-[75vh]">
            <div className="flex items-center justify-between text-xs">
              <div>
                <h3 className="font-bold text-slate-200 text-sm">Standard Genetic Code (64 Codons)</h3>
                <p className="text-slate-400 text-[11px]">Universal triplet codons mapped to 20 standard amino acids</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-1 rounded border border-cyan-800">
                Start: ATG (Met) · Stop: TAA, TAG, TGA
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
              {Object.entries(GENETIC_CODE).map(([codon, info]) => {
                const isStart = codon === 'ATG';
                const isStop = info.aa1 === '*';
                return (
                  <div
                    key={codon}
                    className={`p-2 rounded border text-xs font-mono flex flex-col justify-between ${
                      isStart
                        ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                        : isStop
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                        : 'bg-[#101524] border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold tracking-wider">{codon}</div>
                    <div className="text-[11px] font-bold text-cyan-300">
                      {info.aa1} <span className="text-[9px] text-slate-400">({info.aa3})</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Translator Core View */
          <div className="p-5 overflow-y-auto space-y-5 flex-1">
            {/* Mode Selector & Action Bar */}
            <div className="bg-[#101524] border border-slate-800 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-slate-400">DIRECTION:</span>
                <div className="inline-flex bg-slate-900 border border-slate-700 rounded p-0.5 text-xs font-mono">
                  <button
                    onClick={() => setMode('dna_to_protein')}
                    className={`px-3 py-1 rounded transition ${
                      mode === 'dna_to_protein'
                        ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(6,182,212,0.5)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    DNA / Nucleotide → Protein (Translation)
                  </button>
                  <button
                    onClick={() => setMode('protein_to_dna')}
                    className={`px-3 py-1 rounded transition ${
                      mode === 'protein_to_dna'
                        ? 'bg-purple-500 text-slate-950 font-bold shadow-[0_0_8px_rgba(168,85,247,0.5)]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Protein → DNA (Back-Translation)
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSwapMode}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-mono flex items-center space-x-1.5 transition"
                  title="Swap current output sequence into input"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Swap Direction</span>
                </button>

                {dataset && (
                  <button
                    onClick={() => {
                      const clean = dataset.fastaSequence.replace(/[^A-Za-z]/g, '').toUpperCase();
                      setProteinInput(clean);
                      const back = reverseTranslateProtein(clean, reverseMode);
                      setDnaInput(back.dnaSeq);
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800 text-xs font-mono flex items-center space-x-1 transition"
                  >
                    <Dna className="w-3.5 h-3.5" />
                    <span>Load {dataset.symbol} Target</span>
                  </button>
                )}
              </div>
            </div>

            {/* Translation Layout: Mode 1 (DNA -> Protein) */}
            {mode === 'dna_to_protein' ? (
              <div className="space-y-4">
                {/* Nucleotide Input Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>5' NUCLEOTIDE SEQUENCE (DNA/RNA):</span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {dnaMetrics.length} bp · GC: <strong className="text-cyan-400">{dnaMetrics.gcPercent}%</strong> (A:{dnaMetrics.counts.a} T:{dnaMetrics.counts.t} G:{dnaMetrics.counts.g} C:{dnaMetrics.counts.c})
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={dnaInput}
                    onChange={(e) => setDnaInput(e.target.value.toUpperCase())}
                    placeholder="Enter nucleotide sequence (A, T, C, G)..."
                    className="w-full bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded p-3 text-xs font-mono text-cyan-200 focus:outline-none uppercase tracking-wider"
                  />
                </div>

                {/* Reading Frame Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#101524] border border-slate-800 rounded p-2.5 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">READING FRAME:</span>
                    {([1, 2, 3] as const).map((fr) => (
                      <button
                        key={fr}
                        onClick={() => setSelectedFrame(fr)}
                        className={`px-2.5 py-0.5 rounded border transition ${
                          selectedFrame === fr
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        Frame +{fr}
                      </button>
                    ))}
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Start Codons (ATG): <strong className="text-emerald-400">{translation1.startCodonPositions.length}</strong> · Stop Codons: <strong className="text-rose-400">{translation1.stopCodonPositions.length}</strong>
                  </div>
                </div>

                {/* Translated Protein Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>TRANSLATED AMINO ACID SEQUENCE (PROTEIN):</span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {translation1.proteinSeq.length} aa · Mol Weight: <strong className="text-slate-200">{proteinMw} kDa</strong> · pI: <strong className="text-slate-200">{proteinPi}</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <div className="bg-[#070b14] border border-emerald-900/60 rounded p-3 text-xs font-mono text-emerald-300 tracking-wider break-all max-h-36 overflow-y-auto">
                      {translation1.proteinSeq || 'No valid codons translated'}
                    </div>
                    <button
                      onClick={() => handleCopy(translation1.proteinSeq, 'prot')}
                      className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition"
                    >
                      {copied === 'prot' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copied === 'prot' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* 6-Frame Comparison Card */}
                {sixFrames.longestOrf && (
                  <div className="bg-[#0a0e18] border border-slate-800 rounded p-3 space-y-1 text-xs font-mono">
                    <div className="text-[11px] text-cyan-400 font-bold flex items-center justify-between">
                      <span>LONGEST IDENTIFIED OPEN READING FRAME (ORF):</span>
                      <span className="text-slate-400">Frame {sixFrames.longestOrf.frame} ({sixFrames.longestOrf.lengthAa} aa)</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">
                      {sixFrames.longestOrf.protein}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Translation Layout: Mode 2 (Protein -> DNA) */
              <div className="space-y-4">
                {/* Protein Input Box */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-purple-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>INPUT AMINO ACID SEQUENCE (PROTEIN):</span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {proteinInput.length} aa · Mol Weight: <strong className="text-slate-200">{proteinMw} kDa</strong> · pI: <strong className="text-slate-200">{proteinPi}</strong>
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={proteinInput}
                    onChange={(e) => setProteinInput(e.target.value.toUpperCase().replace(/[^A-Za-z*]/g, ''))}
                    placeholder="Enter amino acid sequence (e.g. MEEPQSDPSVE...)..."
                    className="w-full bg-[#070b14] border border-slate-700 focus:border-purple-500 rounded p-3 text-xs font-mono text-purple-200 focus:outline-none uppercase tracking-wider"
                  />
                </div>

                {/* Reverse Translation Settings */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#101524] border border-slate-800 rounded p-2.5 text-xs font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">CODON SELECTION:</span>
                    <button
                      onClick={() => setReverseMode('human_optimal')}
                      className={`px-2.5 py-0.5 rounded border transition ${
                        reverseMode === 'human_optimal'
                          ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Homo sapiens Optimal Codons
                    </button>
                    <button
                      onClick={() => setReverseMode('degenerate')}
                      className={`px-2.5 py-0.5 rounded border transition ${
                        reverseMode === 'degenerate'
                          ? 'bg-purple-950 text-purple-300 border-purple-500 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      IUPAC Degenerate Consensus
                    </button>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Codon Count: <strong className="text-slate-200">{proteinInput.length}</strong>
                  </div>
                </div>

                {/* Back-Translated DNA Output */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      <span>BACK-TRANSLATED NUCLEOTIDE SEQUENCE (DNA):</span>
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {backTranslation.lengthNt} bp · GC Content: <strong className="text-cyan-400">{backTranslation.gcContent}%</strong>
                    </span>
                  </div>

                  <div className="relative">
                    <div className="bg-[#070b14] border border-cyan-900/60 rounded p-3 text-xs font-mono text-cyan-300 tracking-wider break-all max-h-36 overflow-y-auto">
                      {backTranslation.dnaSeq || 'No sequence generated'}
                    </div>
                    <button
                      onClick={() => handleCopy(backTranslation.dnaSeq, 'dna')}
                      className="absolute top-2 right-2 px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-mono flex items-center gap-1 transition"
                    >
                      {copied === 'dna' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      <span>{copied === 'dna' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-[#101726] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <span className="text-slate-400 text-[11px]">
            Genetic Code Matrix: NCBI Translation Table 1 (Standard)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyToWorkspace}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.4)] transition"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Apply to Active Workspace Pipeline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
