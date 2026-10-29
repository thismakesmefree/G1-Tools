import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckCircle,
  CheckSquare,
  Square,
  ArrowRight,
  Filter,
  Sliders,
  Database,
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GeneDataset, BlastHit } from '../types/bioinformatics';

interface ModuleBlastSearchProps {
  dataset: GeneDataset | null;
  selectedHitAccessions: string[];
  onToggleHitSelection: (accession: string) => void;
  onSelectAllHits: () => void;
  onClearHitSelection: () => void;
  onProceedToMsa?: () => void;
  theme?: 'dark' | 'light';
}

export const ModuleBlastSearch: React.FC<ModuleBlastSearchProps> = ({
  dataset,
  selectedHitAccessions,
  onToggleHitSelection,
  onSelectAllHits,
  onClearHitSelection,
  onProceedToMsa,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // BLAST Search Configuration Parameters (Non-autonomous: User controls execution & params)
  const [databaseChoice, setDatabaseChoice] = useState<'uniprotkb_swissprot' | 'refseq_protein' | 'pdb'>('uniprotkb_swissprot');
  const [matrixChoice, setMatrixChoice] = useState<'BLOSUM62' | 'PAM250' | 'BLOSUM45' | 'PAM30'>('BLOSUM62');
  const [eValueCutoff, setEValueCutoff] = useState<string>('1e-5');
  const [wordSize, setWordSize] = useState<number>(3);
  const [isRunningBlast, setIsRunningBlast] = useState<boolean>(false);
  const [hasExecutedSearch, setHasExecutedSearch] = useState<boolean>(true);
  const [searchFilterText, setSearchFilterText] = useState<string>('');
  const [expandedHitAcc, setExpandedHitAcc] = useState<string | null>(null);

  // Trigger manual non-autonomous BLAST search
  const handleExecuteBlast = () => {
    if (!dataset) return;
    setIsRunningBlast(true);
    setTimeout(() => {
      setIsRunningBlast(false);
      setHasExecutedSearch(true);
    }, 700);
  };

  // Filter hits based on search text
  const filteredHits = useMemo(() => {
    if (!dataset?.blastHits) return [];
    if (!searchFilterText.trim()) return dataset.blastHits;
    const q = searchFilterText.toLowerCase();
    return dataset.blastHits.filter(
      (h) =>
        h.accession.toLowerCase().includes(q) ||
        h.organism.toLowerCase().includes(q) ||
        h.description.toLowerCase().includes(q)
    );
  }, [dataset, searchFilterText]);

  const selectedCount = selectedHitAccessions.length;
  const totalCount = dataset?.blastHits?.length || 0;

  if (!dataset) {
    return (
      <section className={`border rounded-xl p-5 md:p-6 space-y-4 select-none transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-[#101524] border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Module 1: NCBI BLAST+ Sequence Homology Search
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Awaiting Target Query · Search or load a target sequence above
            </p>
          </div>
        </div>
        <div className={`p-10 text-center font-mono text-xs ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
          Select a protein to configure BLASTp parameters, execute search against Swiss-Prot/RefSeq, and curate hit candidates.
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
            <Search className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Module 1: NCBI BLAST+ Homology Search & Hit Selection
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}>
                BLASTp v2.14
              </span>
            </div>
            <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Search protein databases for homologous orthologs · Curate & select candidate sequences before alignment
            </p>
          </div>
        </div>

        {/* Selected Counter & MSA Hand-off */}
        <div className="flex items-center space-x-2.5">
          <div className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${
            selectedCount > 0
              ? (isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-emerald-950/60 text-emerald-300 border-emerald-800')
              : (isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800')
          }`}>
            <span>{selectedCount} of {totalCount} Hits Selected</span>
          </div>

          {onProceedToMsa && (
            <button
              onClick={onProceedToMsa}
              disabled={selectedCount < 2}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-xs ${
                selectedCount >= 2
                  ? (isLight
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                      : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]')
                  : 'opacity-40 cursor-not-allowed bg-slate-800 text-slate-400'
              }`}
            >
              <span>Send to MSA (Module 2)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Query Banner & BLAST Execution Parameter Controls */}
      <div className={`rounded-xl p-4 border space-y-3.5 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d18] border-cyan-950'
      }`}>
        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2 font-mono">
            <span className={`font-bold ${isLight ? 'text-cyan-900' : 'text-cyan-300'}`}>QUERY:</span>
            <span className={`px-2 py-0.5 rounded border text-[11px] font-bold ${
              isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0f1422] border-slate-750 text-cyan-200'
            }`}>
              {dataset.symbol} ({dataset.lengthAa} aa)
            </span>
            <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>·</span>
            <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>{dataset.refSeqProtein}</span>
            <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>·</span>
            <span className={isLight ? 'text-slate-600 italic' : 'text-slate-400 italic'}>{dataset.targetOrganism}</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExecuteBlast}
              disabled={isRunningBlast}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                isLight
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningBlast ? 'animate-spin' : ''}`} />
              <span>{isRunningBlast ? 'Running BLASTp...' : 'Execute BLASTp Search'}</span>
            </button>
          </div>
        </div>

        {/* Parameter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Database:
            </label>
            <select
              value={databaseChoice}
              onChange={(e) => setDatabaseChoice(e.target.value as any)}
              className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0e1424] border-slate-800 text-cyan-300'
              }`}
            >
              <option value="uniprotkb_swissprot">UniProtKB / Swiss-Prot (Curated)</option>
              <option value="refseq_protein">NCBI RefSeq (Non-Redundant nr)</option>
              <option value="pdb">PDB Experimental Structures</option>
            </select>
          </div>

          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Scoring Matrix:
            </label>
            <select
              value={matrixChoice}
              onChange={(e) => setMatrixChoice(e.target.value as any)}
              className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0e1424] border-slate-800 text-cyan-300'
              }`}
            >
              <option value="BLOSUM62">BLOSUM62 (Standard default)</option>
              <option value="PAM250">PAM250 (Divergent homologs)</option>
              <option value="BLOSUM45">BLOSUM45 (Deep ancestry)</option>
              <option value="PAM30">PAM30 (High identity)</option>
            </select>
          </div>

          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Expectation Cutoff (E-value):
            </label>
            <select
              value={eValueCutoff}
              onChange={(e) => setEValueCutoff(e.target.value)}
              className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0e1424] border-slate-800 text-emerald-300'
              }`}
            >
              <option value="1e-3">E &lt; 1e-3 (Permissive)</option>
              <option value="1e-5">E &lt; 1e-5 (Standard)</option>
              <option value="1e-10">E &lt; 1e-10 (Strict)</option>
              <option value="1e-50">E &lt; 1e-50 (Orthologs only)</option>
            </select>
          </div>

          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Word Size:
            </label>
            <select
              value={wordSize}
              onChange={(e) => setWordSize(Number(e.target.value))}
              className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0e1424] border-slate-800 text-slate-200'
              }`}
            >
              <option value={3}>3 (Default for BLASTp)</option>
              <option value={2}>2 (Higher sensitivity)</option>
              <option value={6}>6 (Faster search)</option>
            </select>
          </div>
        </div>
      </div>

      {/* HIT SELECTION CONTROL BAR */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
              Candidate BLAST Homology Hits ({filteredHits.length} Available)
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLight ? 'bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}>
              Check items to include in MSA
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-mono">
            {/* Search Filter input */}
            <input
              type="text"
              value={searchFilterText}
              onChange={(e) => setSearchFilterText(e.target.value)}
              placeholder="Filter by organism / accession..."
              className={`px-2.5 py-1 rounded-lg border text-[11px] focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-slate-800 placeholder:text-slate-400' : 'bg-[#080c14] border-slate-750 text-slate-200'
              }`}
            />

            <button
              onClick={onSelectAllHits}
              className={`px-2 py-1 rounded border text-[11px] transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Select All
            </button>
            <button
              onClick={onClearHitSelection}
              className={`px-2 py-1 rounded border text-[11px] transition ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Clear
            </button>
          </div>
        </div>

        {/* HITS TABLE WITH CHECKBOXES */}
        <div className={`overflow-x-auto rounded-xl border transition-colors ${
          isLight ? 'bg-white border-slate-200 shadow-xs' : 'bg-[#0a0e17]/80 border-slate-800'
        }`}>
          <table className="w-full text-left text-xs">
            <thead className={`text-[10px] font-mono uppercase tracking-wider border-b ${
              isLight ? 'bg-slate-100 text-slate-600 border-slate-200' : 'bg-[#0f1422] text-slate-400 border-slate-800'
            }`}>
              <tr>
                <th className="px-3 py-2.5 w-10 text-center">Select</th>
                <th className="px-3 py-2.5">Accession</th>
                <th className="px-3 py-2.5">Organism / Description</th>
                <th className="px-3 py-2.5 text-right">Bit Score</th>
                <th className="px-3 py-2.5 text-right">Query Cover</th>
                <th className="px-3 py-2.5 text-right">E-Value</th>
                <th className="px-3 py-2.5 text-right">Identity</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y font-mono text-[11px] divide-slate-800/40">
              {filteredHits.map((hit) => {
                const isSelected = selectedHitAccessions.includes(hit.accession);
                const isExpanded = expandedHitAcc === hit.accession;

                return (
                  <React.Fragment key={hit.accession}>
                    <tr
                      onClick={() => onToggleHitSelection(hit.accession)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? (isLight
                              ? 'bg-cyan-50/70 hover:bg-cyan-100/60'
                              : 'bg-cyan-950/30 hover:bg-cyan-900/30')
                          : (isLight
                              ? 'hover:bg-slate-50'
                              : 'hover:bg-slate-900/40')
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => onToggleHitSelection(hit.accession)}
                          className={`p-1 rounded transition ${
                            isSelected
                              ? 'text-cyan-600 dark:text-cyan-400'
                              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 fill-cyan-500/20 text-cyan-600 dark:text-cyan-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Accession */}
                      <td className="px-3 py-2 font-bold font-mono">
                        <span className={isSelected ? (isLight ? 'text-cyan-900 font-bold' : 'text-cyan-300 font-bold') : (isLight ? 'text-slate-800' : 'text-slate-300')}>
                          {hit.accession}
                        </span>
                      </td>

                      {/* Organism & Description */}
                      <td className="px-3 py-2">
                        <div className="font-sans">
                          <span className={`font-semibold ${isSelected ? (isLight ? 'text-slate-900' : 'text-slate-100') : (isLight ? 'text-slate-700' : 'text-slate-300')}`}>
                            {hit.organism}
                          </span>
                          <span className={`text-[10px] ml-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {hit.description}
                          </span>
                        </div>
                      </td>

                      {/* Max Bit Score */}
                      <td className={`px-3 py-2 text-right font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {hit.maxScore}
                      </td>

                      {/* Query Cover */}
                      <td className={`px-3 py-2 text-right ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        {hit.queryCover}
                      </td>

                      {/* E-Value */}
                      <td className={`px-3 py-2 text-right font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                        {hit.eValue}
                      </td>

                      {/* Percent Identity */}
                      <td className={`px-3 py-2 text-right font-bold ${isLight ? 'text-cyan-800' : 'text-cyan-300'}`}>
                        {hit.perIdentity}
                      </td>

                      {/* Status / Check badge */}
                      <td className="px-3 py-2 text-center">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold border inline-block ${
                          isSelected
                            ? (isLight ? 'bg-cyan-100 text-cyan-900 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-700')
                            : (isLight ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-slate-900 text-slate-500 border-slate-800')
                        }`}>
                          {isSelected ? '✓ INCLUDED' : 'OMITTED'}
                        </span>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
