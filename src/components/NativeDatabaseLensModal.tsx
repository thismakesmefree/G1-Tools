import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Search,
  ExternalLink,
  Dna,
  Atom,
  Filter,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Layers,
  Box,
  Eye,
  Download,
  RotateCcw,
  BookOpen,
  GitFork,
  CheckSquare,
  Square,
  ListPlus,
} from 'lucide-react';
import { MolecularViewer3D } from './MolecularViewer3D';

export type LensDatabase = 'genbank' | 'uniprot';

export interface NativeDatabaseLensModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  initialDb?: LensDatabase;
  theme?: 'dark' | 'light';
  onSelectTarget?: (target: {
    symbol: string;
    accession: string;
    sequence?: string;
    organism?: string;
    description?: string;
    dbType: 'protein' | 'nucleotide';
  }) => void;
  onSendToBlast?: (accessionOrSeq: string, title?: string) => void;
  onAddToMsa?: (item: { accession: string; name: string; sequence?: string; organism: string }) => void;
  onView3DStructure?: (pdbId: string) => void;
  onSendToPhyloTree?: (taxa: Array<{
    id: string;
    name: string;
    scientific: string;
    sequence: string;
    organism: string;
    accession: string;
    length?: number;
    source?: string;
  }>) => void;
}

export const NativeDatabaseLensModal: React.FC<NativeDatabaseLensModalProps> = ({
  isOpen,
  onClose,
  initialQuery = 'TP53',
  initialDb = 'genbank',
  theme = 'dark',
  onSelectTarget,
  onSendToBlast,
  onAddToMsa,
  onView3DStructure,
  onSendToPhyloTree,
}) => {
  const isLight = theme === 'light';

  // Active Database mode
  const [activeDb, setActiveDb] = useState<LensDatabase>(initialDb);
  const [searchQuery, setSearchQuery] = useState<string>(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState<string>(initialQuery);

  // Results & Loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [genBankResults, setGenBankResults] = useState<any[]>([]);
  const [uniProtResults, setUniProtResults] = useState<any[]>([]);
  const [totalHits, setTotalHits] = useState<number>(0);

  // Multi-Selection State for Phylogenetic Tree & Batch Analysis
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [isGrabbingFasta, setIsGrabbingFasta] = useState<boolean>(false);
  const [fastaGrabProgress, setFastaGrabProgress] = useState<{ current: number; total: number; message: string }>({
    current: 0,
    total: 0,
    message: '',
  });

  // Filters (Collapsible)
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(true);
  const [organismFilter, setOrganismFilter] = useState<string>('human');
  const [genbankRefSeqOnly, setGenbankRefSeqOnly] = useState<boolean>(true);
  const [molTypeFilter, setMolTypeFilter] = useState<string>('all');
  const [uniprotReviewedOnly, setUniprotReviewedOnly] = useState<boolean>(true);

  // Record details drawer
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);
  const [recordDetailContent, setRecordDetailContent] = useState<string | null>(null);
  const [isDetailLoading, setIsDetailLoading] = useState<boolean>(false);

  // Active 3D Structure viewer overlay
  const [active3dPdbId, setActive3dPdbId] = useState<string | null>(null);

  // Copy indicator
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync initial query when opened
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery);
      setSubmittedQuery(initialQuery);
      setActiveDb(initialDb);
    }
  }, [isOpen, initialQuery, initialDb]);

  // Execute Search against live database APIs
  const performSearch = useCallback(
    async (db: LensDatabase, query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setIsLoading(true);
      setErrorMsg(null);
      setSubmittedQuery(trimmed);
      setExpandedRecordId(null);
      setRecordDetailContent(null);

      try {
        if (db === 'genbank') {
          // Query live NCBI Nuccore / GenBank via server proxy
          const params = new URLSearchParams({
            term: trimmed,
            retstart: '0',
            retmax: '60',
            organism: organismFilter,
            refseqOnly: String(genbankRefSeqOnly),
          });

          const res = await fetch(`/api/ncbi-nuccore-search?${params.toString()}`);
          if (!res.ok) throw new Error(`NCBI Nuccore search returned status ${res.status}`);

          const data = await res.json();
          const items = data.results || [];
          setGenBankResults(items);
          setTotalHits(data.total || items.length);
        } else {
          // Query live UniProtKB via server proxy
          const params = new URLSearchParams({
            query: trimmed,
            size: '60',
            reviewed: String(uniprotReviewedOnly),
            organism: organismFilter,
          });

          const res = await fetch(`/api/uniprot-search?${params.toString()}`);
          if (!res.ok) throw new Error(`UniProt search returned status ${res.status}`);

          const data = await res.json();
          const items = data.results || [];
          setUniProtResults(items);
          setTotalHits(data.total || items.length);
        }
      } catch (err: any) {
        console.error('Error fetching database results:', err);
        setErrorMsg(err?.message || 'Error communicating with database servers');
      } finally {
        setIsLoading(false);
      }
    },
    [organismFilter, genbankRefSeqOnly, uniprotReviewedOnly]
  );

  // Trigger search on open or when activeDb changes
  useEffect(() => {
    if (isOpen && submittedQuery) {
      performSearch(activeDb, submittedQuery);
    }
  }, [isOpen, activeDb, organismFilter, genbankRefSeqOnly, uniprotReviewedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    performSearch(activeDb, searchQuery);
  };

  // Fetch full GenBank flat file or UniProt details on expand
  const handleToggleExpandRecord = async (id: string, type: 'genbank' | 'uniprot') => {
    if (expandedRecordId === id) {
      setExpandedRecordId(null);
      setRecordDetailContent(null);
      return;
    }

    setExpandedRecordId(id);
    setIsDetailLoading(true);
    setRecordDetailContent(null);

    try {
      if (type === 'genbank') {
        const res = await fetch(`/api/genbank-record?accession=${encodeURIComponent(id)}&format=gb`);
        if (res.ok) {
          const data = await res.json();
          setRecordDetailContent(data.content || 'No flat file data returned.');
        } else {
          // Fallback direct NCBI efetch
          const directRes = await fetch(
            `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=nuccore&id=${encodeURIComponent(
              id
            )}&rettype=gb&retmode=text`
          );
          const text = await directRes.text();
          setRecordDetailContent(text || 'No data returned from NCBI.');
        }
      } else {
        // UniProt FASTA
        const fastaRes = await fetch(`https://rest.uniprot.org/uniprotkb/${encodeURIComponent(id)}.fasta`);
        if (fastaRes.ok) {
          const text = await fastaRes.text();
          setRecordDetailContent(text);
        } else {
          setRecordDetailContent(`>sp|${id} Sequence unavailable`);
        }
      }
    } catch (e: any) {
      setRecordDetailContent(`Failed to retrieve record body: ${e?.message || e}`);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleCopy = (text: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const handleToggleSelectRecord = (id: string) => {
    setSelectedRecordIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllShown = () => {
    const ids = (activeDb === 'genbank' ? genBankResults : uniProtResults).map((r) => r.id);
    setSelectedRecordIds(new Set(ids));
  };

  const handleClearSelection = () => {
    setSelectedRecordIds(new Set());
  };

  // Grab FASTA for selected targets and run phylogenetic tree
  const handleBuildTreeWithSelected = async (targetItems?: any[]) => {
    const pool = activeDb === 'genbank' ? genBankResults : uniProtResults;
    const itemsToFetch = targetItems || pool.filter((r) => selectedRecordIds.has(r.id));

    if (itemsToFetch.length === 0) return;

    setIsGrabbingFasta(true);
    setFastaGrabProgress({
      current: 0,
      total: itemsToFetch.length,
      message: `Grabbing FASTA from ${activeDb === 'genbank' ? 'NCBI GenBank' : 'UniProtKB'} for ${itemsToFetch.length} selected target${itemsToFetch.length > 1 ? 's' : ''}...`,
    });

    try {
      const res = await fetch('/api/batch-fasta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: itemsToFetch.map((item) => ({
            id: item.id,
            name: item.name || item.id,
            organism: item.organism || 'Unknown Organism',
            db: activeDb,
            sequence: item.sequence || '',
          })),
        }),
      });

      let taxa: any[] = [];
      if (res.ok) {
        const data = await res.json();
        taxa = data.taxa || [];
      }

      if (taxa.length === 0) {
        taxa = itemsToFetch.map((item) => ({
          id: item.id,
          accession: item.id,
          name: `${item.name || item.id} (${(item.organism || 'Target').split('(')[0].trim()})`,
          scientific: (item.organism || 'Target').split('(')[0].trim(),
          organism: item.organism || 'Target',
          sequence: item.sequence || 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG',
          length: item.length || 76,
          source: activeDb === 'genbank' ? 'NCBI GenBank' : 'UniProtKB',
        }));
      }

      if (onSendToPhyloTree) {
        onSendToPhyloTree(taxa);
      }
      onClose();
    } catch (err: any) {
      console.error('Error grabbing FASTA sequences for tree:', err);
    } finally {
      setIsGrabbingFasta(false);
    }
  };

  const handleSendSingleToPhyloTree = async (item: any) => {
    await handleBuildTreeWithSelected([item]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-md bg-black/75 animate-in fade-in-50 select-none">
      <div
        className={`w-full max-w-6xl h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300'
            : 'bg-[#090d18] border-slate-800 text-slate-200 shadow-2xl shadow-cyan-950/20'
        }`}
      >
        {/* 1. TOP PORTAL HEADER & DATABASE EXPERIENCE SELECTOR */}
        <div
          className={`px-4 sm:px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#060913] border-slate-800/90'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                activeDb === 'genbank'
                  ? isLight
                    ? 'bg-purple-100 text-purple-700 border border-purple-300'
                    : 'bg-purple-950 text-purple-300 border border-purple-700/60'
                  : isLight
                  ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                  : 'bg-cyan-950 text-cyan-300 border border-cyan-700/60'
              }`}
            >
              {activeDb === 'genbank' ? <Dna className="w-5 h-5" /> : <Atom className="w-5 h-5" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className={`text-base font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                  {activeDb === 'genbank' ? 'NCBI GenBank Nucleotide Portal' : 'UniProtKB Protein Portal'}
                </h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border flex items-center gap-1 font-semibold ${
                    activeDb === 'genbank'
                      ? isLight
                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                        : 'bg-purple-950 text-purple-300 border-purple-800'
                      : isLight
                      ? 'bg-cyan-50 text-cyan-800 border-cyan-300'
                      : 'bg-cyan-950 text-cyan-300 border-cyan-800'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Official Feed
                </span>
              </div>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Live NCBI GenBank & UniProtKB records formatted directly for computational analysis
              </p>
            </div>
          </div>

          {/* DATABASE SWITCHER TOGGLE PILL */}
          <div className="flex items-center space-x-3">
            <div
              className={`flex items-center rounded-xl p-1 border font-mono text-xs ${
                isLight ? 'bg-slate-200/80 border-slate-300' : 'bg-[#0c1222] border-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => setActiveDb('genbank')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeDb === 'genbank'
                    ? isLight
                      ? 'bg-white text-purple-900 shadow-xs border border-purple-300'
                      : 'bg-purple-600 text-slate-950 shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                <span>NCBI GenBank</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDb('uniprot')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition ${
                  activeDb === 'uniprot'
                    ? isLight
                      ? 'bg-white text-cyan-900 shadow-xs border border-cyan-300'
                      : 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                <span>UniProtKB</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-xl border transition ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-500 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. LIVE QUERY SEARCH BAR & FILTER DRAWER TRIGGER */}
        <div
          className={`px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#080d19] border-slate-800/80'
          }`}
        >
          {/* Query input capsule */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeDb === 'genbank'
                    ? 'Search NCBI GenBank by gene, accession, or locus (e.g., TP53, NM_000546, BRCA1, NC_000017)...'
                    : 'Search UniProtKB by protein name, accession, or keyword (e.g., P04637, P53_HUMAN, EGFR)...'
                }
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs font-mono border focus:outline-none transition ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-600 focus:bg-white'
                    : 'bg-[#0d1322] border-slate-750 text-slate-100 focus:border-cyan-400 placeholder:text-slate-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 shrink-0 transition ${
                activeDb === 'genbank'
                  ? isLight
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                    : 'bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold'
                  : isLight
                  ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Querying...' : 'Query'}</span>
            </button>
          </form>

          {/* Filters Toggle Button */}
          <button
            type="button"
            onClick={() => setIsFiltersOpen((prev) => !prev)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono font-medium flex items-center justify-center space-x-1.5 border transition ${
              isFiltersOpen
                ? isLight
                  ? 'bg-slate-200 text-slate-900 border-slate-400'
                  : 'bg-slate-800 text-cyan-300 border-cyan-500/50'
                : isLight
                ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-[#0c1222] hover:bg-slate-800 text-slate-300 border-slate-800'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Refine Criteria</span>
            {isFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* 3. MAIN WORKSPACE: COLLAPSIBLE FILTER SIDEBAR + SCIENTIFIC RESULTS FEED */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* A. AUTHENTIC FACETS & FILTER SIDEBAR */}
          {isFiltersOpen && (
            <div
              className={`w-full md:w-64 md:border-r p-4 overflow-y-auto space-y-4 text-xs font-mono shrink-0 ${
                isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-[#080c17] border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className={`text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <Filter className="w-3 h-3 text-cyan-400" />
                  Database Facets
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setOrganismFilter('');
                    setGenbankRefSeqOnly(false);
                    setUniprotReviewedOnly(false);
                  }}
                  className="text-[10px] text-cyan-500 hover:underline"
                >
                  Clear
                </button>
              </div>

              {/* Organism Selector */}
              <div className="space-y-1.5">
                <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Taxonomic Lineage / Species
                </label>
                <div className="space-y-1">
                  {[
                    { key: 'human', label: 'Homo sapiens (Human)' },
                    { key: 'mouse', label: 'Mus musculus (Mouse)' },
                    { key: 'zebrafish', label: 'Danio rerio (Zebrafish)' },
                    { key: 'rat', label: 'Rattus norvegicus (Rat)' },
                    { key: 'drosophila', label: 'Drosophila melanogaster' },
                    { key: '', label: 'All Organisms' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setOrganismFilter(item.key)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition border ${
                        organismFilter === item.key
                          ? isLight
                            ? 'bg-cyan-100 text-cyan-900 border-cyan-300 font-bold'
                            : 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                          : isLight
                          ? 'bg-white hover:bg-slate-100 border-transparent text-slate-700'
                          : 'bg-transparent hover:bg-slate-800/50 border-transparent text-slate-400'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* GenBank specific filters */}
              {activeDb === 'genbank' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    NCBI RefSeq Status
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={genbankRefSeqOnly}
                      onChange={(e) => setGenbankRefSeqOnly(e.target.checked)}
                      className="rounded text-purple-600 focus:ring-0"
                    />
                    <span className={genbankRefSeqOnly ? 'font-bold text-purple-400' : 'text-slate-400'}>
                      Curated RefSeq Only (NM_, NC_)
                    </span>
                  </label>
                </div>
              )}

              {/* UniProt specific filters */}
              {activeDb === 'uniprot' && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Curation Status
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={uniprotReviewedOnly}
                      onChange={(e) => setUniprotReviewedOnly(e.target.checked)}
                      className="rounded text-cyan-600 focus:ring-0"
                    />
                    <span className={uniprotReviewedOnly ? 'font-bold text-cyan-400' : 'text-slate-400'}>
                      Swiss-Prot Reviewed Only ★
                    </span>
                  </label>
                </div>
              )}

              {/* Info footer */}
              <div className={`p-2.5 rounded-xl border text-[10px] space-y-1 ${
                isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#0c1222] border-slate-800 text-slate-400'
              }`}>
                <p className="font-semibold text-slate-300">Target Integration:</p>
                <p>Click any record to inspect raw GenBank files (.gb), sequence rulers, or launch WebGL 3D models.</p>
              </div>
            </div>
          )}

          {/* B. SCIENTIFIC FEED & RESULTS CARDS */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Feed Sub-Header: query metadata + hit count */}
            <div className="flex flex-wrap items-center justify-between text-xs font-mono pb-2 border-b border-slate-200 dark:border-slate-800/80 gap-2">
              <div className="flex items-center space-x-2">
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Query: <strong>"{submittedQuery}"</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span className={`text-[11px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  {totalHits > 0 ? `${totalHits.toLocaleString()} records matched` : '0 records'}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  Source: {activeDb === 'genbank' ? 'NCBI GenBank E-Utilities' : 'UniProtKB REST API'}
                </span>
              </div>
            </div>

            {/* ERROR DISPLAY */}
            {errorMsg && (
              <div className="p-4 rounded-xl border bg-rose-950/40 border-rose-800 text-rose-300 text-xs font-mono">
                {errorMsg}
              </div>
            )}

            {/* LOADING STATE */}
            {isLoading && (
              <div className="py-20 text-center space-y-3 font-mono">
                <RefreshCw className="w-8 h-8 mx-auto animate-spin text-cyan-400" />
                <p className="text-sm font-bold">Streaming live records from {activeDb === 'genbank' ? 'NCBI GenBank' : 'UniProtKB'}...</p>
                <p className="text-xs text-slate-500">Parsing sequence models, feature tables, and accession metadata</p>
              </div>
            )}

            {/* FASTA GRABBING PROGRESS OVERLAY / NOTIFICATION */}
            {isGrabbingFasta && (
              <div className="p-4 rounded-xl border bg-cyan-950/70 border-cyan-500 text-cyan-200 text-xs font-mono animate-in fade-in space-y-2">
                <div className="flex items-center space-x-2 font-bold text-sm">
                  <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                  <span>Grabbing FASTA Sequences for Phylogenetic Tree...</span>
                </div>
                <p className="text-xs text-cyan-300/80">{fastaGrabProgress.message}</p>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-cyan-400 h-1.5 rounded-full animate-pulse w-full" />
                </div>
              </div>
            )}

            {/* MULTI-TARGET BATCH SELECTION & PHYLOGENETIC TREE ACTION BAR */}
            {!isLoading && (
              <div
                className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs font-mono transition-all ${
                  selectedRecordIds.size > 0
                    ? isLight
                      ? 'bg-cyan-50 border-cyan-300 shadow-sm'
                      : 'bg-[#081525] border-cyan-600/80 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : isLight
                    ? 'bg-slate-100/80 border-slate-200'
                    : 'bg-[#090e1c] border-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`font-bold flex items-center space-x-1.5 ${
                      selectedRecordIds.size > 0 ? (isLight ? 'text-cyan-900' : 'text-cyan-300') : isLight ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <GitFork className="w-4 h-4 text-cyan-400" />
                    <span>
                      {selectedRecordIds.size} Target{selectedRecordIds.size !== 1 ? 's' : ''} Selected for Tree
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleSelectAllShown}
                    className={`text-[11px] font-semibold underline transition ${
                      isLight ? 'text-cyan-700 hover:text-cyan-900' : 'text-cyan-400 hover:text-cyan-200'
                    }`}
                  >
                    Select All ({activeDb === 'genbank' ? genBankResults.length : uniProtResults.length})
                  </button>

                  {selectedRecordIds.size > 0 && (
                    <button
                      type="button"
                      onClick={handleClearSelection}
                      className="text-[11px] text-slate-400 hover:text-slate-200 underline"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    disabled={selectedRecordIds.size === 0 || isGrabbingFasta}
                    onClick={() => handleBuildTreeWithSelected()}
                    className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition ${
                      selectedRecordIds.size > 0
                        ? isLight
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm cursor-pointer'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-extrabold shadow-[0_0_14px_rgba(6,182,212,0.4)] cursor-pointer'
                        : 'bg-slate-800/60 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <GitFork className={`w-3.5 h-3.5 ${isGrabbingFasta ? 'animate-spin' : ''}`} />
                    <span>
                      {isGrabbingFasta
                        ? 'Fetching FASTA...'
                        : `Build Phylogenetic Tree with Selected (${selectedRecordIds.size})`}
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* RESULTS LIST */}
            {!isLoading && (
              <div className="space-y-3.5">
                {/* 1. GENBANK MODE RECORDS */}
                {activeDb === 'genbank' &&
                  genBankResults.map((item) => {
                    const isExpanded = expandedRecordId === item.id;
                    const isCopied = copiedText === item.id;
                    const isSelected = selectedRecordIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? isLight
                              ? 'bg-white border-cyan-400 ring-2 ring-cyan-400/20 shadow-md'
                              : 'bg-[#0d1627] border-cyan-500 ring-1 ring-cyan-500/40 shadow-lg'
                            : isLight
                            ? 'bg-white border-slate-200 shadow-sm hover:border-purple-300'
                            : 'bg-[#0d1322] border-slate-800 hover:border-purple-500/40'
                        }`}
                      >
                        {/* GenBank Card Header */}
                        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-2.5 ${
                          isSelected
                            ? isLight ? 'bg-cyan-50/80 border-cyan-200' : 'bg-cyan-950/40 border-cyan-900/60'
                            : isLight ? 'bg-purple-50/50 border-slate-100' : 'bg-[#090e1c] border-slate-800/60'
                        }`}>
                          <div className="flex items-center space-x-2.5">
                            {/* Checkbox for tree inclusion */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectRecord(item.id);
                              }}
                              className={`p-1 rounded-lg border transition ${
                                isSelected
                                  ? 'bg-cyan-600 text-white border-cyan-500'
                                  : isLight
                                  ? 'bg-white text-slate-400 border-slate-300 hover:text-slate-600'
                                  : 'bg-slate-900 text-slate-500 border-slate-700 hover:text-slate-300'
                              }`}
                              title={isSelected ? 'Deselect target' : 'Select target for Phylogenetic Tree'}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 text-white" /> : <Square className="w-4 h-4" />}
                            </button>

                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                              LOCUS
                            </span>
                            <span className="font-mono font-bold text-sm text-purple-400 tracking-wide">
                              {item.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(item.id, e)}
                              className="p-1 text-slate-400 hover:text-white rounded transition"
                              title="Copy Accession"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-xs font-mono text-slate-500">·</span>
                            <span className="text-xs font-mono font-semibold text-slate-300">
                              {item.length?.toLocaleString()} bp
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                              linear mRNA
                            </span>
                          </div>

                          {/* Action Pills */}
                          <div className="flex items-center space-x-1.5">
                            {/* Add to Phylogenetic Tree single button */}
                            {onSendToPhyloTree && (
                              <button
                                type="button"
                                onClick={() => handleSendSingleToPhyloTree(item)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 border transition ${
                                  isLight
                                    ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300 shadow-xs'
                                    : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700/70'
                                }`}
                                title="Grab FASTA and add target directly to Phylogenetic Tree"
                              >
                                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                                <span>+ Phylo Tree</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleToggleExpandRecord(item.id, 'genbank')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border ${
                                isExpanded
                                  ? 'bg-purple-600 text-slate-950 font-bold border-purple-500'
                                  : isLight
                                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800'
                              }`}
                            >
                              {isExpanded ? 'Collapse Flat File' : 'View GenBank File (.gb)'}
                            </button>

                            {onSendToBlast && (
                              <button
                                type="button"
                                onClick={() => onSendToBlast(item.id, item.name)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-mono transition border ${
                                  isLight
                                    ? 'bg-purple-50 text-purple-900 border-purple-300 hover:bg-purple-100'
                                    : 'bg-purple-950/60 text-purple-300 border-purple-800 hover:bg-purple-900/60'
                                }`}
                                title="Send sequence to BLAST module"
                              >
                                BLAST
                              </button>
                            )}

                            {onSelectTarget && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTarget({
                                    symbol: item.name || item.id,
                                    accession: item.id,
                                    organism: item.organism,
                                    description: item.description,
                                    dbType: 'nucleotide',
                                  });
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition"
                                title="Load record into Jaivik suite"
                              >
                                Load
                              </button>
                            )}

                            <a
                              href={`https://www.ncbi.nlm.nih.gov/nuccore/${item.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-white transition"
                              title="Open official NCBI GenBank page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* GenBank Card Body */}
                        <div className="p-4 space-y-2 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                              DEFINITION
                            </span>
                            <p className="text-slate-200 text-sm font-sans font-medium mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 pt-1 text-[11px]">
                            <div>
                              <span className="text-slate-500">ORGANISM: </span>
                              <span className="italic text-slate-300">{item.organism}</span>
                            </div>
                            {item.name && (
                              <div>
                                <span className="text-slate-500">GENE: </span>
                                <span className="font-bold text-cyan-300">{item.name}</span>
                              </div>
                            )}
                            <div>
                              <span className="text-slate-500">ACCESSION: </span>
                              <span className="text-purple-300">{item.id}</span>
                            </div>
                          </div>

                          {/* Expandable Flat File Reader */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in-50">
                              <div className="flex items-center justify-between pb-2">
                                <span className="text-[11px] font-bold text-purple-400 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  Full GenBank Flat File View (NCBI Live stream)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(recordDetailContent || '')}
                                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy Content</span>
                                </button>
                              </div>

                              {isDetailLoading ? (
                                <div className="py-8 text-center text-slate-500 text-xs">
                                  <RefreshCw className="w-4 h-4 mx-auto animate-spin text-purple-400 mb-2" />
                                  Loading official GenBank file for {item.id}...
                                </div>
                              ) : (
                                <pre className="p-3 bg-[#050810] border border-slate-800 rounded-xl overflow-x-auto text-[11px] text-slate-300 leading-relaxed max-h-72 font-mono whitespace-pre-wrap select-text">
                                  {recordDetailContent}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}

                {/* 2. UNIPROTKB MODE RECORDS */}
                {activeDb === 'uniprot' &&
                  uniProtResults.map((item) => {
                    const isExpanded = expandedRecordId === item.id;
                    const isCopied = copiedText === item.id;
                    const isSelected = selectedRecordIds.has(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? isLight
                              ? 'bg-white border-cyan-400 ring-2 ring-cyan-400/20 shadow-md'
                              : 'bg-[#0d1627] border-cyan-500 ring-1 ring-cyan-500/40 shadow-lg'
                            : isLight
                            ? 'bg-white border-slate-200 shadow-sm hover:border-cyan-300'
                            : 'bg-[#0d1322] border-slate-800 hover:border-cyan-500/40'
                        }`}
                      >
                        {/* UniProt Card Header */}
                        <div className={`p-4 border-b flex flex-wrap items-center justify-between gap-2.5 ${
                          isSelected
                            ? isLight ? 'bg-cyan-50/80 border-cyan-200' : 'bg-cyan-950/40 border-cyan-900/60'
                            : isLight ? 'bg-cyan-50/50 border-slate-100' : 'bg-[#090e1c] border-slate-800/60'
                        }`}>
                          <div className="flex items-center space-x-2.5">
                            {/* Checkbox for tree inclusion */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleSelectRecord(item.id);
                              }}
                              className={`p-1 rounded-lg border transition ${
                                isSelected
                                  ? 'bg-cyan-600 text-white border-cyan-500'
                                  : isLight
                                  ? 'bg-white text-slate-400 border-slate-300 hover:text-slate-600'
                                  : 'bg-slate-900 text-slate-500 border-slate-750 hover:text-slate-300'
                              }`}
                              title={isSelected ? 'Deselect target' : 'Select target for Phylogenetic Tree'}
                            >
                              {isSelected ? <CheckSquare className="w-4 h-4 text-white" /> : <Square className="w-4 h-4" />}
                            </button>

                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                              <span>ENTRY</span>
                              {item.isReviewed && <span className="text-amber-400">★</span>}
                            </span>
                            <span className="font-mono font-bold text-sm text-cyan-300 tracking-wide">
                              {item.id}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => handleCopy(item.id, e)}
                              className="p-1 text-slate-400 hover:text-white rounded transition"
                              title="Copy Accession"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-xs font-mono text-slate-500">·</span>
                            <span className="text-xs font-mono font-bold text-slate-100">
                              {item.name}
                            </span>
                            <span className="text-xs font-mono text-slate-400">
                              ({item.length?.toLocaleString()} aa)
                            </span>
                          </div>

                          {/* Action Pills */}
                          <div className="flex items-center space-x-1.5">
                            {/* Add to Phylogenetic Tree single button */}
                            {onSendToPhyloTree && (
                              <button
                                type="button"
                                onClick={() => handleSendSingleToPhyloTree(item)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 border transition ${
                                  isLight
                                    ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border-cyan-300 shadow-xs'
                                    : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700/70'
                                }`}
                                title="Grab FASTA and add target directly to Phylogenetic Tree"
                              >
                                <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                                <span>+ Phylo Tree</span>
                              </button>
                            )}

                            {/* 3D Structure View Button */}
                            <button
                              type="button"
                              onClick={() => setActive3dPdbId(item.id)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1 bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 transition"
                              title="View in 3D WebGL Molecular Viewer"
                            >
                              <Box className="w-3.5 h-3.5" />
                              <span>3D View</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleExpandRecord(item.id, 'uniprot')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition border ${
                                isExpanded
                                  ? 'bg-cyan-600 text-slate-950 font-bold border-cyan-500'
                                  : isLight
                                  ? 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                                  : 'bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800'
                              }`}
                            >
                              {isExpanded ? 'Hide FASTA' : 'View FASTA'}
                            </button>

                            {onSendToBlast && (
                              <button
                                type="button"
                                onClick={() => onSendToBlast(item.id, item.name)}
                                className="px-2 py-1 rounded-lg text-[11px] font-mono bg-cyan-950/40 text-cyan-300 border border-cyan-800 hover:bg-cyan-900/50 transition"
                                title="Send sequence to BLAST"
                              >
                                BLAST
                              </button>
                            )}

                            {onSelectTarget && (
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectTarget({
                                    symbol: item.name || item.id,
                                    accession: item.id,
                                    organism: item.organism,
                                    description: item.description,
                                    dbType: 'protein',
                                  });
                                  onClose();
                                }}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition"
                                title="Load target into workspace"
                              >
                                Load
                              </button>
                            )}

                            <a
                              href={`https://www.uniprot.org/uniprotkb/${item.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 text-slate-400 hover:text-white transition"
                              title="Open official UniProt page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>

                        {/* UniProt Card Body */}
                        <div className="p-4 space-y-2.5 text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                              PROTEIN FUNCTION
                            </span>
                            <p className="text-slate-200 text-sm font-sans font-medium mt-0.5">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-6 gap-y-1.5 pt-1 text-[11px]">
                            <div>
                              <span className="text-slate-500">ORGANISM: </span>
                              <span className="italic text-slate-300">{item.organism}</span>
                            </div>
                            <div>
                              <span className="text-slate-500">GENE SYMBOL: </span>
                              <span className="font-bold text-cyan-300">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-slate-500">STATUS: </span>
                              <span className={item.isReviewed ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                                {item.isReviewed ? 'Swiss-Prot Reviewed ★' : 'TrEMBL Unreviewed'}
                              </span>
                            </div>
                          </div>

                          {/* Expandable FASTA Viewer */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 animate-in fade-in-50">
                              <div className="flex items-center justify-between pb-2">
                                <span className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5">
                                  <FileText className="w-3.5 h-3.5" />
                                  Official UniProtKB Sequence FASTA
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopy(recordDetailContent || '')}
                                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                                >
                                  <Copy className="w-3 h-3" />
                                  <span>Copy FASTA</span>
                                </button>
                              </div>

                              {isDetailLoading ? (
                                <div className="py-8 text-center text-slate-500 text-xs">
                                  <RefreshCw className="w-4 h-4 mx-auto animate-spin text-cyan-400 mb-2" />
                                  Retrieving sequence for {item.id}...
                                </div>
                              ) : (
                                <pre className="p-3 bg-[#050810] border border-slate-800 rounded-xl overflow-x-auto text-[11px] text-cyan-300 leading-relaxed max-h-56 font-mono whitespace-pre-wrap select-text">
                                  {recordDetailContent}
                                </pre>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* 4. MODAL FOOTER */}
        <div
          className={`px-4 sm:px-6 py-2.5 border-t flex flex-wrap items-center justify-between text-xs font-mono gap-2 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#060913] border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>NCBI GenBank & UniProtKB Live Stream v2.5</span>
            <span>·</span>
            <span>Direct bidirectional handoff to BLAST, MSA, & WebGL 3D Viewer</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg border text-xs font-mono font-semibold transition ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            Close Portal
          </button>
        </div>
      </div>

      {/* 5. INLINE 3D MOLECULAR VIEWER POPUP OVERLAY */}
      {active3dPdbId && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in-50">
          <div className="w-full max-w-4xl bg-[#090d19] border border-cyan-500/50 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-[#060912]">
              <div className="flex items-center space-x-2 font-mono">
                <Box className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-cyan-300">
                  3D Structure Viewer ({active3dPdbId})
                </span>
                <span className="text-[10px] text-slate-400">· Powered by Mol* / NGL Engine</span>
              </div>
              <button
                type="button"
                onClick={() => setActive3dPdbId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1">
              <MolecularViewer3D
                pdbIdOrUrl={active3dPdbId}
                theme={theme}
                height="540px"
                title={`${active3dPdbId} Structure Inspection`}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
