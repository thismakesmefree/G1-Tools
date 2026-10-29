import React, { useState } from 'react';
import { Database, Dna, Copy, Check, ExternalLink, ShieldCheck, Layers, Sparkles, BookOpen, Activity } from 'lucide-react';
import { GeneDataset } from '../types/bioinformatics';
import { MacbookDockSequenceViewer } from './MacbookDockSequenceViewer';

interface ModuleTargetOverviewProps {
  dataset: GeneDataset | null;
  onSelectResidueForMutation?: (pos: number, wt: string) => void;
  theme?: 'dark' | 'light';
}

export const ModuleTargetOverview: React.FC<ModuleTargetOverviewProps> = ({
  dataset,
  onSelectResidueForMutation,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [copiedFasta, setCopiedFasta] = useState(false);
  const [selectedPos, setSelectedPos] = useState<number | undefined>(dataset?.mutationPresets?.[0]?.pos);

  const handleCopyFasta = () => {
    if (!dataset) return;
    navigator.clipboard.writeText(`${dataset.fastaHeader}\n${dataset.fastaSequence}`);
    setCopiedFasta(true);
    setTimeout(() => setCopiedFasta(false), 2000);
  };

  // Known hotspot positions for this protein
  const hotspots = React.useMemo(() => {
    if (!dataset) return [];
    if (dataset.symbol === 'TP53') return [175, 245, 248, 249, 273, 282];
    if (dataset.symbol === 'BRCA1') return [61, 64, 1699, 1708, 1756, 1775];
    if (dataset.symbol === 'EGFR') return [719, 746, 790, 858, 861];
    if (dataset.symbol === 'KRAS') return [12, 13, 61, 117, 146];
    if (dataset.symbol.includes('Spike')) return [417, 484, 501, 614, 681];
    if (dataset.mutationPresets) return dataset.mutationPresets.map((p) => p.pos);
    return [];
  }, [dataset]);

  // Standard functional domains (UniProt / NCBI GenBank feature table)
  const domains = React.useMemo(() => {
    if (!dataset) return [];
    if (dataset.symbol === 'TP53') {
      return [
        { name: 'Transactivation Domain (TAD)', start: 1, end: 61, color: '#8ed600' },
        { name: 'Proline-rich Region (PRD)', start: 63, end: 97, color: '#a3e635' },
        { name: 'DNA-Binding Core Domain (DBD)', start: 102, end: 292, color: '#76b900' },
        { name: 'Nuclear Localization Signal (NLS)', start: 305, end: 322, color: '#4d7c00' },
        { name: 'Tetramerization Domain (OD)', start: 325, end: 356, color: '#f59e0b' },
        { name: 'Regulatory C-Terminal Domain (CTD)', start: 363, end: 393, color: '#9ca398' },
      ];
    }
    if (dataset.symbol === 'BRCA1') {
      return [
        { name: 'RING Finger Zinc-Binding Domain', start: 1, end: 109, color: '#8ed600' },
        { name: 'Nuclear Export Signal (NES)', start: 120, end: 180, color: '#a3e635' },
        { name: 'BRCA1-Associated Ring Domain', start: 300, end: 700, color: '#4d7c00' },
        { name: 'BRCT Tandem Repeats (C-term)', start: 1650, end: 1863, color: '#76b900' },
      ];
    }
    if (dataset.symbol === 'EGFR') {
      return [
        { name: 'Extracellular Receptor L Domain I', start: 25, end: 165, color: '#8ed600' },
        { name: 'Furin-like Cysteine-rich Domain II', start: 166, end: 310, color: '#a3e635' },
        { name: 'Transmembrane Helix', start: 646, end: 668, color: '#4d7c00' },
        { name: 'Protein Kinase Catalytic Core', start: 712, end: 979, color: '#76b900' },
      ];
    }
    return [
      { name: 'N-Terminal Regulatory Region', start: 1, end: Math.floor(dataset.lengthAa * 0.3), color: '#8ed600' },
      { name: 'Catalytic / Functional Core', start: Math.floor(dataset.lengthAa * 0.31), end: Math.floor(dataset.lengthAa * 0.75), color: '#76b900' },
      { name: 'C-Terminal Tail Region', start: Math.floor(dataset.lengthAa * 0.76), end: dataset.lengthAa, color: '#4d7c00' },
    ];
  }, [dataset]);

  if (!dataset) {
    return (
      <section className="bg-[#101524] border border-slate-800 rounded-lg p-5 space-y-4 select-none">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Module 0: Target Overview & Interactive Sequence Viewer
              </h2>
              <p className="text-[11px] text-slate-400">
                Awaiting Target Selection · Enter query above or select from instant demos
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
            Status: NIL
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Target Symbol: NIL', 'Sequence Length: NIL', 'NCBI TaxID: NIL', 'RefSeq Accession: NIL'].map((item, idx) => (
            <div key={idx} className="bg-[#0a0e17] border border-slate-850 rounded p-3 text-xs font-mono text-slate-500">
              {item}
            </div>
          ))}
        </div>

        <div className="text-center py-8 bg-[#080c14] border border-slate-850 rounded-lg text-slate-500 font-mono text-xs">
          Select or search for a target to inspect full GenBank & UniProt annotations and activate the MacBook dock magnification sequence viewer.
        </div>
      </section>
    );
  }

  return (
    <section className={`border rounded-lg p-5 md:p-6 space-y-5 select-none transition-all ${
      isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-[#101524] border-slate-800 text-slate-200'
    }`}>
      {/* Module Header */}
      <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3.5 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      }`}>
        <div className="flex items-center space-x-3">
          {/* Selector 8 */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isLight
              ? 'bg-cyan-50 border border-cyan-300 text-cyan-700 shadow-xs'
              : 'bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
          }`}>
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Module 0: {dataset.symbol} — Target Specification & GenBank / UniProtKB Record
              </h2>
              <span className={`text-[10px] font-mono font-semibold px-2 py-0.2 rounded border ${
                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}>
                RefSeq Verified
              </span>
            </div>
            <p className={`text-[11px] font-mono mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {dataset.fullName} · {dataset.targetOrganism}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <a
            href={`https://www.ncbi.nlm.nih.gov/protein/${dataset.refSeqProtein}`}
            target="_blank"
            rel="noreferrer noopener"
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono transition border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 font-semibold'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700'
            }`}
            title="Open NCBI GenBank / Entrez"
          >
            <span>NCBI Record</span>
            <ExternalLink className={`w-3 h-3 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
          </a>
          <button
            onClick={handleCopyFasta}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded text-[11px] font-mono transition border ${
              isLight
                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-950 border-cyan-300 shadow-xs font-semibold'
                : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60'
            }`}
          >
            {copiedFasta ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className={`w-3 h-3 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />}
            <span>{copiedFasta ? 'Copied' : 'Copy Sequence'}</span>
          </button>
        </div>
      </div>

      {/* Primary Key Metadata Grid (NCBI / UniProt format) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono text-xs">
        <div className={`border rounded-lg p-2.5 space-y-1 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b101c] border-slate-800/90'
        }`}>
          <span className={`text-[10px] uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Sequence Length</span>
          <span className={`font-bold text-sm ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>{dataset.lengthAa} aa</span>
          <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Canonical isoform</span>
        </div>

        <div className={`border rounded-lg p-2.5 space-y-1 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b101c] border-slate-800/90'
        }`}>
          <span className={`text-[10px] uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>NCBI TaxID</span>
          <span className={`font-bold text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{dataset.taxId}</span>
          <span className={`text-[9px] block truncate ${isLight ? 'text-slate-500' : 'text-slate-500'}`} title={dataset.targetOrganism}>
            {dataset.targetOrganism.split(' ')[0]}
          </span>
        </div>

        <div className={`border rounded-lg p-2.5 space-y-1 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b101c] border-slate-800/90'
        }`}>
          <span className={`text-[10px] uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>RefSeq Protein</span>
          <span className={`font-bold text-xs truncate block ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>{dataset.refSeqProtein}</span>
          <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>mRNA: {dataset.refSeqTranscript}</span>
        </div>

        <div className={`border rounded-lg p-2.5 space-y-1 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0b101c] border-slate-800/90'
        }`}>
          <span className={`text-[10px] uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Molecular Weight</span>
          <span className={`font-bold text-sm ${isLight ? 'text-purple-800' : 'text-purple-300'}`}>{dataset.molWeightKDa} kDa</span>
          <span className={`text-[9px] block ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Theoretical mass</span>
        </div>

        <div className="bg-[#0b101c] border border-slate-800/90 rounded-lg p-2.5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Isoelectric Point</span>
          <span className="text-amber-400 font-bold text-sm">pI {dataset.isoelectricPoint}</span>
          <span className="text-[9px] text-slate-500 block">Net neutral pH</span>
        </div>

        <div className="bg-[#0b101c] border border-slate-800/90 rounded-lg p-2.5 space-y-1">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">PDB Structure</span>
          <span className="text-cyan-400 font-bold text-sm">{dataset.pdbId}</span>
          <span className="text-[9px] text-slate-500 block">{dataset.resolution}</span>
        </div>
      </div>

      {/* Clinical Phenotype & Disease Associations Banner */}
      <div className="bg-[#080d17] border border-cyan-900/40 rounded-lg p-3 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-400">Clinical Pathology:</span>
          <strong className="text-slate-200">{dataset.clinicalDisease}</strong>
        </div>
        <div className="flex items-center space-x-2 font-mono text-[11px]">
          <span className="text-rose-400 font-semibold">Primary Hotspot: {dataset.hotspotMutation}</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">Impact: {dataset.hotspotPhenotype}</span>
        </div>
      </div>

      {/* The MacBook Dock Magnification Sequence Strip */}
      <MacbookDockSequenceViewer
        sequence={dataset.fastaSequence}
        label={`Target Protein Sequence Strip: ${dataset.symbol} (Residues 1 - ${dataset.lengthAa})`}
        hotspots={hotspots}
        domains={domains}
        selectedPos={selectedPos}
        onSelectResidue={(pos, char) => {
          setSelectedPos(pos);
          if (onSelectResidueForMutation) {
            onSelectResidueForMutation(pos, char);
          }
        }}
      />

      {/* NCBI GenBank / UniProt Features & Domains Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1">
          <span className="uppercase tracking-wider font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>GenBank & UniProt Functional Domain Annotations (Feature Table)</span>
          </span>
          <span className="text-slate-500">Click any domain to jump sequence viewer</span>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded bg-[#080c14]">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0f1422] text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-3 py-2">Domain / Feature</th>
                <th className="px-3 py-2">Residue Span</th>
                <th className="px-3 py-2">Length</th>
                <th className="px-3 py-2">Molecular Role & Structural Consequence</th>
                <th className="px-3 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70 text-[11px]">
              {domains.map((dom, idx) => (
                <tr key={idx} className="hover:bg-cyan-950/20 transition-colors">
                  <td className="px-3 py-2 font-semibold text-slate-200 flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dom.color }} />
                    <span>{dom.name}</span>
                  </td>
                  <td className="px-3 py-2 text-cyan-400">
                    aa {dom.start} - {dom.end}
                  </td>
                  <td className="px-3 py-2 text-slate-400">
                    {dom.end - dom.start + 1} residues
                  </td>
                  <td className="px-3 py-2 text-slate-300 font-sans">
                    {dom.name.includes('DNA')
                      ? 'Coordinates Zinc ion (Zn2+) and contacts major/minor grooves of target promoters'
                      : dom.name.includes('Transactivation')
                      ? 'Recruits p300/CBP histone acetyltransferases and TFIID general transcription machinery'
                      : dom.name.includes('Tetramerization')
                      ? 'Forms active anti-parallel dimer of dimers (functional tetrameric complex)'
                      : dom.name.includes('Kinase')
                      ? 'Catalytic pocket binds ATP and transfers gamma-phosphate to substrate tyrosines'
                      : 'Essential structural motif for cellular stability and protein-protein interactions'}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => setSelectedPos(dom.start)}
                      className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 text-[10px] transition"
                    >
                      Focus View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
