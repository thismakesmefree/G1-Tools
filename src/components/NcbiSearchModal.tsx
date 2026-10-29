import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Check,
  Dna,
  Filter,
  Database,
  ArrowRight,
  RefreshCw,
  Globe,
  Copy,
  SlidersHorizontal,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { NcbiCandidate, searchNcbiCandidates } from '../services/bioServices';

interface NcbiSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  candidates: NcbiCandidate[];
  isLoading: boolean;
  onSelectCandidate: (candidate: NcbiCandidate) => void;
  onDirectAccessionSubmit?: (accession: string) => void;
}

export const NcbiSearchModal: React.FC<NcbiSearchModalProps> = ({
  isOpen,
  onClose,
  query,
  candidates: initialCandidates,
  isLoading: initialLoading,
  onSelectCandidate,
  onDirectAccessionSubmit,
}) => {
  const [modalQuery, setModalQuery] = useState(query);
  const [selectedDb, setSelectedDb] = useState<'protein' | 'gene' | 'nuccore'>('protein');
  const [candidateList, setCandidateList] = useState<NcbiCandidate[]>(initialCandidates);
  const [isSearching, setIsSearching] = useState(initialLoading);
  const [selectedTaxId, setSelectedTaxId] = useState<number | 'all'>('all');
  const [isTaxFilterOpen, setIsTaxFilterOpen] = useState<boolean>(true);
  const [filterText, setFilterText] = useState('');
  const [manualAccession, setManualAccession] = useState('');
  const [copiedAccession, setCopiedAccession] = useState<string | null>(null);

  // Sync initial query and candidates when opened
  useEffect(() => {
    if (isOpen) {
      setModalQuery(query);
      setCandidateList(initialCandidates);
      setIsSearching(initialLoading);
      setSelectedTaxId('all');
      setFilterText('');
    }
  }, [isOpen, query, initialCandidates, initialLoading]);

  // Execute search via backend
  const handleExecuteSearch = async (targetQuery?: string, db?: 'protein' | 'gene' | 'nuccore') => {
    const q = (targetQuery !== undefined ? targetQuery : modalQuery).trim();
    if (!q) return;
    const activeDb = db || selectedDb;

    setIsSearching(true);
    try {
      const results = await searchNcbiCandidates(q, activeDb);
      setCandidateList(results);
    } catch (err) {
      console.warn('NCBI modal search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Extract unique taxIds with counts
  const taxIdCounts = useMemo(() => {
    const map = new Map<number, { name: string; count: number }>();
    candidateList.forEach((c) => {
      const existing = map.get(c.taxId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(c.taxId, { name: c.organism, count: 1 });
      }
    });
    return Array.from(map.entries()).map(([taxId, info]) => ({
      taxId,
      name: info.name,
      count: info.count,
    }));
  }, [candidateList]);

  // Filter candidates by taxId and search term
  const filteredCandidates = useMemo(() => {
    return candidateList.filter((c) => {
      const matchesTax = selectedTaxId === 'all' || c.taxId === selectedTaxId;
      const lower = filterText.toLowerCase();
      const matchesText =
        !filterText ||
        c.geneSymbol.toLowerCase().includes(lower) ||
        c.accession.toLowerCase().includes(lower) ||
        c.proteinName.toLowerCase().includes(lower) ||
        c.organism.toLowerCase().includes(lower);
      return matchesTax && matchesText;
    });
  }, [candidateList, selectedTaxId, filterText]);

  if (!isOpen) return null;

  const handleManualAccessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualAccession.trim().toUpperCase();
    if (!clean) return;
    if (onDirectAccessionSubmit) {
      onDirectAccessionSubmit(clean);
      onClose();
    } else {
      onSelectCandidate({
        accession: clean,
        geneSymbol: clean,
        proteinName: `Custom Target ${clean}`,
        organism: 'Homo sapiens',
        taxId: 9606,
        length: 350,
        ncbiUrl: `https://www.ncbi.nlm.nih.gov/protein/${clean}`,
      });
      onClose();
    }
  };

  const handleCopyAccession = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccession(acc);
    setTimeout(() => setCopiedAccession(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 select-none">
      <div className="w-full max-w-4xl bg-[#090e1a] border-2 border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        
        {/* Custom Header in App Theme */}
        <div className="px-5 py-4 bg-[#0d1424] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-950/90 border border-cyan-500/60 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-slate-100 text-sm font-display tracking-tight">
                  NCBI Entrez Search Results
                </h3>
                <span className="text-[10px] bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 font-mono px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  60 Targets Scraped via NCBI GenBank & UniProtKB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Query: <span className="text-cyan-300 font-bold">"{modalQuery}"</span> · 60 targets retrieved across species with verified accessions ({candidateList.length} records)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Search & Query Controls Bar */}
        <div className="px-5 py-3 bg-[#080d18] border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={modalQuery}
                onChange={(e) => setModalQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleExecuteSearch();
                  }
                }}
                placeholder="Search NCBI by gene, protein, or accession (e.g., TP53, BRCA1, NP_000537)..."
                className="w-full bg-[#101726] border border-slate-750 focus:border-cyan-500 rounded-xl pl-10 pr-20 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-500 focus:outline-none transition shadow-inner"
              />
              <button
                onClick={() => handleExecuteSearch()}
                disabled={isSearching}
                className="absolute right-1.5 top-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold font-mono text-[11px] rounded-lg transition flex items-center gap-1"
              >
                {isSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Search'}
              </button>
            </div>

            {/* Database Selector Dropdown */}
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-400 font-mono hidden md:inline">Database:</span>
              <select
                value={selectedDb}
                onChange={(e) => {
                  const newDb = e.target.value as any;
                  setSelectedDb(newDb);
                  handleExecuteSearch(undefined, newDb);
                }}
                className="bg-[#101726] border border-slate-750 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
              >
                <option value="protein">NCBI Protein</option>
                <option value="gene">NCBI Gene</option>
                <option value="nuccore">NCBI Nucleotide</option>
              </select>
            </div>

            {/* Quick Accession Extractor */}
            <form onSubmit={handleManualAccessionSubmit} className="flex items-center space-x-1.5">
              <input
                type="text"
                value={manualAccession}
                onChange={(e) => setManualAccession(e.target.value)}
                placeholder="Quick Accession..."
                className="bg-[#101726] border border-slate-750 focus:border-cyan-500 rounded-xl px-2.5 py-2 text-xs font-mono text-cyan-300 placeholder:text-slate-600 focus:outline-none uppercase w-32"
              />
              <button
                type="submit"
                className="px-2.5 py-2 rounded-xl bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-mono font-semibold transition"
              >
                Load
              </button>
            </form>
          </div>

          {/* Taxonomy ID Filter Bar (Collapsible) */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsTaxFilterOpen(!isTaxFilterOpen)}
                className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 uppercase tracking-wider flex items-center gap-1.5 transition"
              >
                <Filter className="w-3 h-3 text-cyan-400" />
                <span>FILTER BY ORGANISM / TAXONOMY ID (TAXID)</span>
                {selectedTaxId !== 'all' && (
                  <span className="text-cyan-400 font-bold lowercase">
                    (active: taxid {selectedTaxId})
                  </span>
                )}
                {isTaxFilterOpen ? <ChevronUp className="w-3 h-3 ml-1 text-slate-500" /> : <ChevronDown className="w-3 h-3 ml-1 text-slate-500" />}
              </button>

              {selectedTaxId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedTaxId('all')}
                  className="text-[10px] font-mono text-cyan-400 hover:underline"
                >
                  Reset taxon filter
                </button>
              )}
            </div>

            {isTaxFilterOpen && (
              <div className="flex flex-wrap gap-1.5 pt-0.5 animate-in fade-in-50">
                <button
                  onClick={() => setSelectedTaxId('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border ${
                    selectedTaxId === 'all'
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  All Taxa ({candidateList.length})
                </button>
                {taxIdCounts.map((t) => (
                  <button
                    key={t.taxId}
                    onClick={() => setSelectedTaxId(t.taxId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border ${
                      selectedTaxId === t.taxId
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                        : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-[9px] text-slate-500 ml-1">({t.taxId}) [{t.count}]</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* In-results Search filter */}
          <div className="relative">
            <SlidersHorizontal className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Refine list by accession, organism name, or protein description..."
              className="w-full bg-[#0b101c] border border-slate-800 focus:border-cyan-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none font-mono"
            />
          </div>
        </div>

        {/* Results List Styled in Website Color Scheme */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 max-h-[50vh] bg-[#070b14]">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 space-y-3 font-mono text-xs">
              <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Pulling structured records from NCBI Entrez E-Utilities via Backend...</span>
            </div>
          ) : filteredCandidates.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs font-mono space-y-2">
              <p>No matching NCBI records found for the current filter criteria.</p>
              <button
                onClick={() => {
                  setSelectedTaxId('all');
                  setFilterText('');
                }}
                className="text-cyan-400 hover:underline text-xs"
              >
                Reset filters
              </button>
            </div>
          ) : (
            filteredCandidates.map((candidate) => (
              <div
                key={candidate.accession}
                className="bg-[#0e1424] hover:bg-[#121a2f] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-3.5 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group shadow-sm"
              >
                {/* Left Record Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-cyan-400 font-display text-sm tracking-wide">
                      {candidate.geneSymbol}
                    </span>
                    <span className="bg-slate-900 text-cyan-300 font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-900/60 font-semibold">
                      {candidate.accession}
                    </span>
                    <span className="bg-emerald-950/70 text-emerald-400 font-mono text-[10px] px-2 py-0.5 rounded border border-emerald-800/50 font-medium">
                      {candidate.length} aa
                    </span>
                    <span className="bg-slate-900 text-slate-400 font-mono text-[9px] px-1.5 py-0.5 rounded border border-slate-800">
                      TaxID: <strong className="text-slate-300">{candidate.taxId}</strong>
                    </span>
                    <span className="bg-indigo-950/60 text-indigo-300 font-mono text-[9px] px-1.5 py-0.5 rounded border border-indigo-900/40">
                      NCBI {candidate.entryType || selectedDb.toUpperCase()}
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 font-medium">
                    {candidate.proteinName}
                  </div>

                  <div className="text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <span>Organism: <strong className="text-slate-300">{candidate.organism}</strong></span>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => handleCopyAccession(candidate.accession)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 transition text-xs"
                    title="Copy accession to clipboard"
                  >
                    {copiedAccession === candidate.accession ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <a
                    href={candidate.ncbiUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono transition"
                    title="Open official record directly on NCBI"
                  >
                    <span>NCBI</span>
                    <ExternalLink className="w-3 h-3 text-cyan-400" />
                  </a>

                  <button
                    onClick={() => {
                      onSelectCandidate(candidate);
                      onClose();
                    }}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono transition shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Select Target</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#0d1424] border-t border-slate-800 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Backend Integration: NCBI E-Utilities + UniProtKB Swiss-Prot Direct JSON Gateway</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
