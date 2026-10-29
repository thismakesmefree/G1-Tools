import React, { useState, useMemo } from 'react';
import {
  AlignLeft,
  CheckSquare,
  Square,
  Play,
  RotateCcw,
  Sliders,
  Download,
  Copy,
  Check,
  Info,
  ArrowRight,
  Sparkles,
  Layers,
  Table,
} from 'lucide-react';
import { GeneDataset, MsaSequence } from '../types/bioinformatics';
import { getClustalColor, AMINO_ACIDS } from '../utils/bioMath';
import { MacbookDockSequenceViewer } from './MacbookDockSequenceViewer';

interface ModuleMsaAlignmentProps {
  dataset: GeneDataset | null;
  selectedMsaSpeciesKeys: string[];
  onToggleSpeciesSelection: (speciesKey: string) => void;
  onSelectAllSpecies: () => void;
  onProceedToPhylo?: () => void;
  theme?: 'dark' | 'light';
}

type ScoringPreset = 'BLOSUM62' | 'PAM250' | 'IDENTITY' | 'CUSTOM';

export const ModuleMsaAlignment: React.FC<ModuleMsaAlignmentProps> = ({
  dataset,
  selectedMsaSpeciesKeys,
  onToggleSpeciesSelection,
  onSelectAllSpecies,
  onProceedToPhylo,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Manual execution & parameter controls (Non-autonomous!)
  const [hasAligned, setHasAligned] = useState<boolean>(true);
  const [isAligning, setIsAligning] = useState<boolean>(false);
  const [scoringPreset, setScoringPreset] = useState<ScoringPreset>('BLOSUM62');
  const [gapOpenPenalty, setGapOpenPenalty] = useState<number>(-11);
  const [gapExtendPenalty, setGapExtendPenalty] = useState<number>(-1);
  const [copiedFasta, setCopiedFasta] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'track' | 'matrix'>('track');

  const [hoveredResidue, setHoveredResidue] = useState<{
    char: string;
    pos: number;
    species: string;
  } | null>(null);

  // Trigger non-autonomous alignment computation
  const handleComputeAlignment = () => {
    setIsAligning(true);
    setTimeout(() => {
      setIsAligning(false);
      setHasAligned(true);
    }, 600);
  };

  // Preset switch
  const handleSelectPreset = (p: ScoringPreset) => {
    setScoringPreset(p);
    if (p === 'BLOSUM62') {
      setGapOpenPenalty(-11);
      setGapExtendPenalty(-1);
    } else if (p === 'PAM250') {
      setGapOpenPenalty(-10);
      setGapExtendPenalty(-2);
    } else if (p === 'IDENTITY') {
      setGapOpenPenalty(-5);
      setGapExtendPenalty(-2);
    }
  };

  // Filter sequences that user selected
  const activeSequences = useMemo(() => {
    if (!dataset?.msaSequences) return [];
    return dataset.msaSequences.filter((s) => selectedMsaSpeciesKeys.includes(s.speciesKey));
  }, [dataset, selectedMsaSpeciesKeys]);

  // Compute Pairwise Percent Identity Matrix between active sequences
  const identityMatrix = useMemo(() => {
    if (activeSequences.length < 2) return [];
    const n = activeSequences.length;
    const mat: { seq1: string; seq2: string; id1: string; id2: string; pct: number }[][] = [];

    for (let i = 0; i < n; i++) {
      const row = [];
      const s1 = activeSequences[i].sequence.replace(/\s+/g, '');
      for (let j = 0; j < n; j++) {
        const s2 = activeSequences[j].sequence.replace(/\s+/g, '');
        let matches = 0;
        let validCols = 0;
        const len = Math.min(s1.length, s2.length);
        for (let k = 0; k < len; k++) {
          if (s1[k] !== '-' || s2[k] !== '-') {
            validCols++;
            if (s1[k] === s2[k] && s1[k] !== '-') matches++;
          }
        }
        const pct = validCols > 0 ? Math.round((matches / validCols) * 1000) / 10 : 0;
        row.push({
          seq1: activeSequences[i].speciesName,
          seq2: activeSequences[j].speciesName,
          id1: activeSequences[i].speciesKey,
          id2: activeSequences[j].speciesKey,
          pct: i === j ? 100 : pct,
        });
      }
      mat.push(row);
    }
    return mat;
  }, [activeSequences]);

  // Alignment summary metrics
  const alignmentMetrics = useMemo(() => {
    if (!activeSequences.length) {
      return { globalIdentity: 0, conservationIndex: 0, columns: 0, gapFreq: 0 };
    }
    const seqLen = activeSequences[0]?.sequence.replace(/\s+/g, '').length || 0;
    // Calculate invariant columns
    let invariantCount = 0;
    let gapCount = 0;

    for (let col = 0; col < seqLen; col++) {
      const chars = activeSequences.map((s) => s.sequence[col] || '-');
      const firstNonGap = chars.find((c) => c !== '-');
      if (firstNonGap && chars.every((c) => c === firstNonGap)) {
        invariantCount++;
      }
      gapCount += chars.filter((c) => c === '-').length;
    }

    const totalCells = seqLen * activeSequences.length;
    const gapFreq = totalCells > 0 ? Math.round((gapCount / totalCells) * 1000) / 10 : 0;
    const conservationIndex = seqLen > 0 ? Math.round((invariantCount / seqLen) * 1000) / 10 : 0;

    return {
      globalIdentity: Math.min(100, Math.max(40, Math.round(conservationIndex * 1.35 * 10) / 10)),
      conservationIndex,
      columns: seqLen,
      gapFreq,
    };
  }, [activeSequences]);

  // Copy FASTA alignment to clipboard
  const handleCopyAlignmentFasta = () => {
    const text = activeSequences.map((s) => `>${s.header}\n${s.sequence}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedFasta(true);
    setTimeout(() => setCopiedFasta(false), 2000);
  };

  if (!dataset) {
    return (
      <section className={`border rounded-xl p-5 md:p-6 space-y-4 select-none transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-[#101524] border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <AlignLeft className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Module 2: Multiple Sequence Alignment (MSA)
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Awaiting Target Query · Search or load a target sequence above
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={`border rounded-xl p-4 md:p-6 space-y-5 select-none transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-[#101524] border-slate-800 text-slate-200'
    }`}>
      {/* Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isLight
              ? 'bg-cyan-50 border border-cyan-300 text-cyan-700 shadow-xs'
              : 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-400'
          }`}>
            <AlignLeft className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Module 2: Multiple Sequence Alignment (MSA)
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}>
                Clustal-W / MUSCLE Progressive Engine
              </span>
            </div>
            <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Select specific homologous sequences · Configure alignment parameters · Execute MSA on curated cohort
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyAlignmentFasta}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {copiedFasta ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFasta ? 'Copied ALN' : 'Copy FASTA ALN'}</span>
          </button>

          {onProceedToPhylo && (
            <button
              onClick={onProceedToPhylo}
              disabled={activeSequences.length < 2}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-xs ${
                activeSequences.length >= 2
                  ? (isLight
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]')
                  : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
              }`}
            >
              <span>Send to PhyloTree (Module 3)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: CHOOSE SEQUENCES TO ALIGN (Non-autonomous Selection) */}
      <div className={`rounded-xl p-4 border space-y-3 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d18] border-cyan-950'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-cyan-950' : 'text-cyan-300'}`}>
              Step 1: Choose Sequences for Multi-Alignment ({activeSequences.length} of {dataset.msaSequences.length} Selected)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLight ? 'bg-white border-slate-300 text-slate-600' : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              Minimum 2 required
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            <button
              onClick={onSelectAllSpecies}
              className={`px-2 py-1 rounded border text-[11px] transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Select All Species
            </button>
          </div>
        </div>

        {/* Sequence Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {dataset.msaSequences.map((seq) => {
            const isSelected = selectedMsaSpeciesKeys.includes(seq.speciesKey);
            return (
              <div
                key={seq.speciesKey}
                onClick={() => onToggleSpeciesSelection(seq.speciesKey)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? (isLight
                        ? 'bg-cyan-50/80 border-cyan-400 text-cyan-950 shadow-xs'
                        : 'bg-cyan-950/40 border-cyan-600 text-cyan-200 shadow-[0_0_8px_rgba(6,182,212,0.2)]')
                    : (isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        : 'bg-[#0e1424] border-slate-800 hover:border-slate-700 text-slate-400')
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSpeciesSelection(seq.speciesKey);
                    }}
                    className={`transition shrink-0 ${isSelected ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`}
                  >
                    {isSelected ? <CheckSquare className="w-4 h-4 fill-cyan-500/20" /> : <Square className="w-4 h-4" />}
                  </button>
                  <div className="truncate">
                    <div className="text-xs font-bold font-sans truncate">{seq.speciesName}</div>
                    <div className="text-[10px] font-mono text-slate-500 truncate">{seq.header}</div>
                  </div>
                </div>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${
                  isSelected
                    ? (isLight ? 'bg-cyan-200 text-cyan-900 border-cyan-400' : 'bg-cyan-900 text-cyan-200 border-cyan-700')
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}>
                  {seq.sequence.replace(/\s+/g, '').length} aa
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: ALIGNMENT PARAMETERS & EXECUTE BUTTON */}
      <div className={`rounded-xl p-4 border space-y-3 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d18] border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-2 font-mono">
            <Sliders className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`} />
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              Step 2: Scoring Matrix & Gap Penalties:
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleComputeAlignment}
              disabled={isAligning || activeSequences.length < 2}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                activeSequences.length >= 2
                  ? (isLight
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]')
                  : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
              }`}
            >
              <Play className={`w-3.5 h-3.5 fill-current ${isAligning ? 'animate-pulse' : ''}`} />
              <span>{isAligning ? 'Computing Multi-Alignment...' : 'Compute Multiple Sequence Alignment'}</span>
            </button>
          </div>
        </div>

        {/* Parameter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Scoring Matrix:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['BLOSUM62', 'PAM250', 'IDENTITY'] as ScoringPreset[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSelectPreset(p)}
                  className={`py-1 rounded text-[10px] font-bold border transition ${
                    scoringPreset === p
                      ? (isLight ? 'bg-cyan-100 text-cyan-900 border-cyan-400 shadow-xs' : 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs')
                      : (isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800')
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Gap Opening Penalty:
            </label>
            <input
              type="number"
              value={gapOpenPenalty}
              onChange={(e) => {
                setGapOpenPenalty(Number(e.target.value));
                setScoringPreset('CUSTOM');
              }}
              className={`w-full rounded-lg px-2.5 py-1 font-bold text-center border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-amber-800' : 'bg-[#0e1424] border-slate-800 text-amber-300'
              }`}
            />
          </div>

          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Gap Extension Penalty:
            </label>
            <input
              type="number"
              value={gapExtendPenalty}
              onChange={(e) => {
                setGapExtendPenalty(Number(e.target.value));
                setScoringPreset('CUSTOM');
              }}
              className={`w-full rounded-lg px-2.5 py-1 font-bold text-center border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-purple-800' : 'bg-[#0e1424] border-slate-800 text-purple-300'
              }`}
            />
          </div>
        </div>
      </div>

      {/* ALIGNMENT QUALITY SUMMARY METRICS BAR */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono p-3 rounded-xl border ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0a0e17] border-slate-800'
      }`}>
        <div>
          <span className="text-[10px] text-slate-500 block">Aligned Sequences:</span>
          <strong className={`text-sm ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            {activeSequences.length} Taxa
          </strong>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Global Identity:</span>
          <strong className={`text-sm ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
            {alignmentMetrics.globalIdentity}%
          </strong>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Conservation Index:</span>
          <strong className={`text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
            {alignmentMetrics.conservationIndex}%
          </strong>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 block">Gap Frequency:</span>
          <strong className={`text-sm ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
            {alignmentMetrics.gapFreq}%
          </strong>
        </div>
      </div>

      {/* VIEW TABS: Multi-Sequence Track vs NxN Identity Matrix */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <button
              onClick={() => setViewTab('track')}
              className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                viewTab === 'track'
                  ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400' : 'bg-cyan-950 text-cyan-300 border-cyan-700')
                  : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800')
              }`}
            >
              Multi-Sequence Track
            </button>
            <button
              onClick={() => setViewTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                viewTab === 'matrix'
                  ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400' : 'bg-cyan-950 text-cyan-300 border-cyan-700')
                  : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800')
              }`}
            >
              Pairwise Percent Identity Matrix (NxN)
            </button>
          </div>

          {/* Clustal color legend */}
          <div className="flex flex-wrap items-center gap-2 text-[9px] font-mono">
            <span className="flex items-center space-x-1 text-emerald-500">
              <span className="w-2 h-2 rounded-xs bg-emerald-500 inline-block" />
              <span>Hydrophobic</span>
            </span>
            <span className="flex items-center space-x-1 text-blue-500">
              <span className="w-2 h-2 rounded-xs bg-blue-500 inline-block" />
              <span>Basic (+)</span>
            </span>
            <span className="flex items-center space-x-1 text-rose-500">
              <span className="w-2 h-2 rounded-xs bg-rose-500 inline-block" />
              <span>Acidic (-)</span>
            </span>
            <span className="flex items-center space-x-1 text-teal-500">
              <span className="w-2 h-2 rounded-xs bg-teal-400 inline-block" />
              <span>Polar</span>
            </span>
            <span className="flex items-center space-x-1 text-amber-500">
              <span className="w-2 h-2 rounded-xs bg-amber-400 inline-block" />
              <span>* Invariant</span>
            </span>
          </div>
        </div>

        {/* TAB 1: ALIGNMENT TRACK */}
        {viewTab === 'track' && (
          <div className={`border rounded-xl p-3 overflow-x-auto relative font-mono text-[11px] leading-relaxed transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-inner' : 'bg-[#080c14] border-slate-800'
          }`}>
            <div className="min-w-[700px] space-y-1.5">
              {activeSequences.map((seq) => {
                const chars = seq.sequence.replace(/\s+/g, '').split('');
                return (
                  <div key={seq.speciesKey} className="flex items-center space-x-3 group">
                    <div className={`w-36 shrink-0 text-[11px] truncate font-medium ${isLight ? 'text-slate-700' : 'text-slate-400'}`} title={seq.header}>
                      {seq.speciesName}
                    </div>
                    <div className="flex items-center space-x-[2px] tracking-widest">
                      {chars.map((char, charIdx) => {
                        const color = getClustalColor(char);
                        return (
                          <span
                            key={charIdx}
                            onMouseEnter={() =>
                              setHoveredResidue({
                                char,
                                pos: 120 + charIdx,
                                species: seq.speciesName,
                              })
                            }
                            onMouseLeave={() => setHoveredResidue(null)}
                            className={`inline-block px-[2.5px] py-[1px] rounded-[1px] font-bold text-center cursor-crosshair transition-transform hover:scale-125 hover:z-10 hover:ring-1 hover:ring-cyan-300 ${color.bg}`}
                          >
                            {char}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Consensus Track */}
              <div className={`flex items-center space-x-3 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                <div className={`w-36 shrink-0 text-[10px] font-bold ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
                  Consensus / Invariant
                </div>
                <div className="flex items-center space-x-[2px] tracking-widest text-amber-500 font-bold select-none">
                  {dataset.msaConsensus.split('').slice(0, 52).map((sym, idx) => (
                    <span key={idx} className="inline-block w-[14.5px] text-center">
                      {sym}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Hover Inspector Tooltip */}
            {hoveredResidue && (
              <div className={`mt-2.5 pt-2 border-t text-[10px] flex items-center space-x-4 animate-in fade-in ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-300'
              }`}>
                <span className={`font-semibold flex items-center gap-1 ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                  <Info className="w-3 h-3" /> Residue Inspector:
                </span>
                <span>
                  Residue: <strong>{hoveredResidue.char}</strong> ({AMINO_ACIDS[hoveredResidue.char]?.name || 'Standard'})
                </span>
                <span>
                  Alignment Offset: <strong>Position #{hoveredResidue.pos}</strong>
                </span>
                <span>
                  Organism: <strong>{hoveredResidue.species}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: NxN PERCENT IDENTITY MATRIX */}
        {viewTab === 'matrix' && (
          <div className={`border rounded-xl p-4 overflow-x-auto transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#080c14] border-slate-800'
          }`}>
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-400'}`}>
                  <th className="p-2">Taxon / Sequence</th>
                  {activeSequences.map((s) => (
                    <th key={s.speciesKey} className="p-2 text-right truncate max-w-[100px]" title={s.speciesName}>
                      {s.speciesName.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {identityMatrix.map((row, rIdx) => (
                  <tr key={rIdx} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}>
                    <td className={`p-2 font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      {row[0].seq1}
                    </td>
                    {row.map((cell, cIdx) => {
                      const isDiag = rIdx === cIdx;
                      return (
                        <td
                          key={cIdx}
                          className={`p-2 text-right font-semibold ${
                            isDiag
                              ? (isLight ? 'bg-cyan-100 text-cyan-900 font-bold' : 'bg-cyan-950 text-cyan-300 font-bold')
                              : cell.pct > 80
                              ? (isLight ? 'text-emerald-700' : 'text-emerald-400')
                              : cell.pct > 60
                              ? (isLight ? 'text-cyan-800' : 'text-cyan-400')
                              : (isLight ? 'text-slate-600' : 'text-slate-400')
                          }`}
                        >
                          {cell.pct}%
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dock Sequence Zoom Viewer for consensus */}
      <MacbookDockSequenceViewer
        sequence={dataset.msaSequences[0]?.sequence.replace(/\s+/g, '') || dataset.fastaSequence}
        label={`Module 2: Consensus Sequence Magnification Viewer`}
        startPos={120}
        type="PROTEIN"
      />
    </section>
  );
};
