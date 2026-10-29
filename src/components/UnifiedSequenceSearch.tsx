import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Dna,
  Atom,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RotateCcw,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Info,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export type SearchDataType = 'protein' | 'gene';

export interface UnifiedSearchResultItem {
  id: string; // Accession / Identifier (e.g. P04637, NM_000546.6)
  name: string; // Gene symbol or primary designation (e.g. TP53, BRCA1)
  description: string; // Functional definition or transcript title
  organism: string; // Scientific organism name
  length: number; // Length (aa for protein, bp for gene)
  type: 'protein' | 'nucleotide';
  source: 'UniProtKB' | 'NCBI Nuccore';
  isReviewed?: boolean;
  taxId?: number;
  raw?: any;
}

export interface UnifiedSequenceSearchProps {
  initialType?: SearchDataType;
  initialQuery?: string;
  onSelectResult?: (result: UnifiedSearchResultItem) => void;
  onViewStructure?: (accessionOrId: string) => void;
  className?: string;
  theme?: 'dark' | 'light';
}

export const UnifiedSequenceSearch: React.FC<UnifiedSequenceSearchProps> = ({
  initialType = 'protein',
  initialQuery = 'TP53',
  onSelectResult,
  onViewStructure,
  className = '',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Toggle state: 'protein' (UniProt) vs 'gene' (NCBI nuccore)
  const [searchType, setSearchType] = useState<SearchDataType>(initialType);
  const [query, setQuery] = useState<string>(initialQuery);

  // Filters for Protein (UniProt)
  const [proteinReviewedOnly, setProteinReviewedOnly] = useState<boolean>(true);
  const [organismFilter, setOrganismFilter] = useState<string>('human');

  // Filters for Gene/Nucleotide (NCBI)
  const [geneRefSeqOnly, setGeneRefSeqOnly] = useState<boolean>(true);

  // Collapsible Filters State (collapsed by default for clean view, or expandable)
  const [isFiltersOpen, setIsFiltersOpen] = useState<boolean>(false);

  // Active filter count
  const activeFiltersCount =
    (organismFilter ? 1 : 0) +
    (searchType === 'protein' ? (proteinReviewedOnly ? 1 : 0) : (geneRefSeqOnly ? 1 : 0));

  const handleResetFilters = () => {
    setOrganismFilter('');
    if (searchType === 'protein') {
      setProteinReviewedOnly(false);
    } else {
      setGeneRefSeqOnly(false);
    }
  };

  // Pagination states
  const [pageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [cursorHistory, setCursorHistory] = useState<string[]>(['']);
  const [currentCursor, setCurrentCursor] = useState<string>('');
  const [nextCursor, setNextCursor] = useState<string>('');

  // Results & status
  const [results, setResults] = useState<UnifiedSearchResultItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Perform search (either UniProt or NCBI)
  const executeSearch = useCallback(
    async (pageToLoad: number = 1, cursorOverride?: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setIsLoading(true);
      setErrorMessage(null);

      try {
        if (searchType === 'protein') {
          // 1. Query UniProt REST API (100 results per page)
          const cursorToUse = cursorOverride !== undefined ? cursorOverride : currentCursor;
          const params = new URLSearchParams({
            query: trimmed,
            size: String(pageSize),
            reviewed: String(proteinReviewedOnly),
            organism: organismFilter,
          });
          if (cursorToUse) {
            params.append('cursor', cursorToUse);
          }

          let data: any = null;
          // Try server proxy first
          try {
            const proxyRes = await fetch(`/api/uniprot-search?${params.toString()}`, {
              signal: AbortSignal.timeout(6000),
            });
            if (proxyRes.ok) {
              data = await proxyRes.json();
            }
          } catch (e) {
            // Fallback to direct client-side fetch if proxy unavailable
          }

          if (!data || !data.success) {
            // Direct UniProtKB fallback
            let constructedQuery = trimmed;
            if (proteinReviewedOnly) constructedQuery = `(${constructedQuery}) AND (reviewed:true)`;
            if (organismFilter) constructedQuery = `(${constructedQuery}) AND (${organismFilter})`;

            const directParams = new URLSearchParams({
              query: constructedQuery,
              size: String(pageSize),
              format: 'json',
              fields: 'accession,id,gene_names,protein_name,organism_name,length,reviewed',
            });
            if (cursorToUse) directParams.append('cursor', cursorToUse);

            const directRes = await fetch(`https://rest.uniprot.org/uniprotkb/search?${directParams.toString()}`, {
              headers: { Accept: 'application/json' },
            });
            if (!directRes.ok) throw new Error(`UniProt API responded with ${directRes.status}`);

            const directData = await directRes.json();
            const rawList: any[] = directData?.results || [];

            const linkHeader = directRes.headers.get('link') || '';
            const match = linkHeader.match(/cursor=([^&>]+)/);
            const directNextCursor = match ? match[1] : '';

            data = {
              success: true,
              total: rawList.length * 10,
              nextCursor: directNextCursor,
              results: rawList.map((entry) => ({
                id: entry.primaryAccession || entry.uniProtkbId,
                name: entry.genes?.[0]?.geneName?.value || entry.uniProtkbId?.split('_')[0] || entry.primaryAccession,
                description:
                  entry.proteinDescription?.recommendedName?.fullName?.value ||
                  entry.proteinDescription?.submissionNames?.[0]?.fullName?.value ||
                  `UniProt ${entry.primaryAccession}`,
                organism: entry.organism?.scientificName + (entry.organism?.commonName ? ` (${entry.organism.commonName})` : ''),
                taxId: entry.organism?.taxonId,
                length: entry.sequence?.length || 0,
                type: 'protein' as const,
                source: 'UniProtKB' as const,
                isReviewed: entry.entryType === 'UniProtKB reviewed (Swiss-Prot)',
              })),
            };
          }

          setResults(data.results || []);
          setTotalCount(data.total || data.results?.length || 0);
          setNextCursor(data.nextCursor || '');
        } else {
          // 2. Query NCBI nuccore via E-Utilities (100 results per page with retstart offset)
          const retstart = (pageToLoad - 1) * pageSize;
          const params = new URLSearchParams({
            term: trimmed,
            retstart: String(retstart),
            retmax: String(pageSize),
            organism: organismFilter,
            refseqOnly: String(geneRefSeqOnly),
          });

          let data: any = null;
          try {
            const proxyRes = await fetch(`/api/ncbi-nuccore-search?${params.toString()}`, {
              signal: AbortSignal.timeout(6000),
            });
            if (proxyRes.ok) {
              data = await proxyRes.json();
            }
          } catch (e) {
            // Fallback
          }

          if (!data || !data.success) {
            // Direct NCBI E-utilities client fallback
            let term = trimmed;
            if (organismFilter) term = `(${term}) AND "${organismFilter}"[Organism]`;
            if (geneRefSeqOnly) term = `(${term}) AND srcdb_refseq[Properties]`;

            const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=nuccore&term=${encodeURIComponent(
              term
            )}&retstart=${retstart}&retmax=${pageSize}&retmode=json`;
            const sRes = await fetch(sUrl);
            const sData = await sRes.json();
            const idList: string[] = sData?.esearchresult?.idlist || [];
            const count = parseInt(sData?.esearchresult?.count || '0', 10);

            if (idList.length > 0) {
              const uUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=nuccore&id=${idList.join(
                ','
              )}&retmode=json`;
              const uRes = await fetch(uUrl);
              const uData = await uRes.json();
              const uids: string[] = uData?.result?.uids || idList;

              data = {
                success: true,
                total: count,
                results: uids
                  .map((uid) => {
                    const item = uData?.result?.[uid];
                    if (!item) return null;
                    const accession = item.caption || item.accessionversion || item.accession;
                    return {
                      id: accession,
                      name: accession,
                      description: item.title || `Nucleotide sequence ${accession}`,
                      organism: item.organism || 'Unknown',
                      taxId: item.taxid,
                      length: item.slen || 0,
                      type: 'nucleotide' as const,
                      source: 'NCBI Nuccore' as const,
                      isReviewed: accession.startsWith('NM_') || accession.startsWith('NC_'),
                    };
                  })
                  .filter(Boolean),
              };
            } else {
              data = { success: true, total: 0, results: [] };
            }
          }

          setResults(data.results || []);
          setTotalCount(data.total || data.results?.length || 0);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error querying database');
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    },
    [query, searchType, proteinReviewedOnly, organismFilter, geneRefSeqOnly, pageSize, currentCursor]
  );

  // Trigger search on mount or type toggle
  useEffect(() => {
    setCurrentPage(1);
    setCurrentCursor('');
    setCursorHistory(['']);
    executeSearch(1, '');
  }, [searchType, proteinReviewedOnly, organismFilter, geneRefSeqOnly]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setCurrentCursor('');
    setCursorHistory(['']);
    executeSearch(1, '');
  };

  // Next page (100 results)
  const handleNextPage = () => {
    if (searchType === 'protein') {
      if (!nextCursor) return;
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      setCursorHistory((prev) => [...prev, nextCursor]);
      setCurrentCursor(nextCursor);
      executeSearch(nextPage, nextCursor);
    } else {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      executeSearch(nextPage);
    }
  };

  // Previous page
  const handlePrevPage = () => {
    if (currentPage <= 1) return;
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);

    if (searchType === 'protein') {
      const prevCursor = cursorHistory[prevPage - 1] || '';
      setCurrentCursor(prevCursor);
      executeSearch(prevPage, prevCursor);
    } else {
      executeSearch(prevPage);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 select-none ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-[#0b101d] border-slate-800 text-slate-200 shadow-xl'
      } ${className}`}
    >
      {/* 1. TOP HEADER & PROTEIN / GENE TOGGLE */}
      <div className={`p-4 md:p-5 border-b space-y-4 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                searchType === 'protein'
                  ? isLight
                    ? 'bg-cyan-50 border border-cyan-300 text-cyan-700'
                    : 'bg-cyan-950/80 border border-cyan-800/60 text-cyan-400'
                  : isLight
                  ? 'bg-purple-50 border border-purple-300 text-purple-700'
                  : 'bg-purple-950/80 border border-purple-800/60 text-purple-400'
              }`}
            >
              {searchType === 'protein' ? <Atom className="w-5 h-5" /> : <Dna className="w-5 h-5" />}
            </div>
            <div>
              <h2 className={`text-base font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Unified Sequence Search
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Query UniProtKB (Proteins) or NCBI Nuccore (Genes) · 100 results per page with pagination
              </p>
            </div>
          </div>

          {/* CLEAN TOGGLE AT TOP: "Protein" vs "Gene" */}
          <div
            className={`flex items-center rounded-xl p-1 border font-mono text-xs transition-colors ${
              isLight ? 'bg-slate-100 border-slate-300' : 'bg-[#070b14] border-slate-750'
            }`}
          >
            <button
              type="button"
              onClick={() => setSearchType('protein')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                searchType === 'protein'
                  ? isLight
                    ? 'bg-white text-cyan-800 shadow-sm border border-cyan-300'
                    : 'bg-cyan-600 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.5)]'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Atom className="w-3.5 h-3.5" />
              <span>Protein (UniProt)</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchType('gene')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all ${
                searchType === 'gene'
                  ? isLight
                    ? 'bg-white text-purple-800 shadow-sm border border-purple-300'
                    : 'bg-purple-600 text-slate-950 shadow-[0_0_12px_rgba(168,85,247,0.5)]'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Dna className="w-3.5 h-3.5" />
              <span>Gene (NCBI Nuccore)</span>
            </button>
          </div>
        </div>

        {/* 2. SEARCH BAR & FILTERS */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search
                className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                  isLight ? 'text-slate-400' : 'text-slate-500'
                }`}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  searchType === 'protein'
                    ? 'Search protein by gene symbol, accession, or keyword (e.g. TP53, BRCA1, EGFR)...'
                    : 'Search nucleotide by accession, locus, or organism (e.g. NM_000546, NC_000017, TP53)...'
                }
                className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs font-mono border focus:outline-none transition ${
                  isLight
                    ? 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600'
                    : 'bg-[#070b14] border-slate-750 text-slate-100 placeholder:text-slate-500 focus:border-cyan-500'
                }`}
              />
            </div>

            {/* COLLAPSIBLE FILTER TOGGLE BUTTON */}
            <button
              type="button"
              onClick={() => setIsFiltersOpen((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 shrink-0 transition border ${
                isFiltersOpen
                  ? isLight
                    ? 'bg-slate-200 text-slate-900 border-slate-400'
                    : 'bg-slate-800 text-cyan-300 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : activeFiltersCount > 0
                  ? isLight
                    ? 'bg-cyan-50 text-cyan-800 border-cyan-300 hover:bg-cyan-100'
                    : 'bg-cyan-950/60 text-cyan-300 border-cyan-800 hover:bg-cyan-900/60'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-[#070b14] hover:bg-slate-800/60 text-slate-300 border-slate-750'
              }`}
              title={isFiltersOpen ? 'Collapse Filter Controls' : 'Expand Filter Controls'}
              aria-expanded={isFiltersOpen}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isLight ? 'bg-cyan-600 text-white' : 'bg-cyan-400 text-slate-950'
                  }`}
                >
                  {activeFiltersCount}
                </span>
              )}
              {isFiltersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-5 py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center space-x-1.5 shrink-0 transition ${
                searchType === 'protein'
                  ? isLight
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-xs'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                  : isLight
                  ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-xs'
                  : 'bg-purple-500 hover:bg-purple-400 text-slate-950 shadow-[0_0_12px_rgba(168,85,247,0.3)]'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>

          {/* COLLAPSIBLE FILTER PANEL */}
          {isFiltersOpen && (
            <div
              className={`p-3.5 rounded-xl border space-y-3 transition-all duration-200 animate-in fade-in-50 ${
                isLight ? 'bg-slate-50 border-slate-300 shadow-xs' : 'bg-[#070c17] border-slate-750 shadow-inner'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2.5 border-slate-200 dark:border-slate-800">
                <span className={`text-[11px] font-bold flex items-center gap-1.5 uppercase tracking-wider ${
                  isLight ? 'text-slate-700' : 'text-slate-300'
                }`}>
                  <Filter className="w-3 h-3 text-cyan-500" />
                  Search Filter Criteria
                </span>

                <div className="flex items-center space-x-2">
                  {activeFiltersCount > 0 && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={`text-[11px] font-mono flex items-center space-x-1 px-2 py-0.5 rounded transition ${
                        isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                      title="Clear active filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen(false)}
                    className={`text-[11px] font-mono px-2 py-0.5 rounded border transition ${
                      isLight ? 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Done
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
                {/* Organism Selector & Presets */}
                <div className="space-y-1.5">
                  <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Target Organism
                  </label>
                  <select
                    value={organismFilter}
                    onChange={(e) => setOrganismFilter(e.target.value)}
                    className={`w-full rounded-lg px-2.5 py-1.5 text-xs border focus:outline-none transition ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0b101c] border-slate-700 text-slate-200'
                    }`}
                  >
                    <option value="human">Homo sapiens (Human)</option>
                    <option value="mouse">Mus musculus (Mouse)</option>
                    <option value="zebrafish">Danio rerio (Zebrafish)</option>
                    <option value="rat">Rattus norvegicus (Rat)</option>
                    <option value="drosophila">Drosophila melanogaster</option>
                    <option value="">All Organisms (Unrestricted)</option>
                  </select>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {['human', 'mouse', 'zebrafish', ''].map((org) => (
                      <button
                        key={org}
                        type="button"
                        onClick={() => setOrganismFilter(org)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          organismFilter === org
                            ? isLight
                              ? 'bg-cyan-600 text-white border-cyan-700 font-bold'
                              : 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold'
                            : isLight
                            ? 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {org === '' ? 'All' : org.charAt(0).toUpperCase() + org.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Database Specific Filters */}
                <div className="space-y-1.5 sm:col-span-2">
                  <label className={`block text-[11px] font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                    Curation & Annotation Quality
                  </label>

                  {searchType === 'protein' ? (
                    <div className="space-y-2 pt-0.5">
                      <label className={`flex items-start space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                        proteinReviewedOnly
                          ? isLight
                            ? 'bg-cyan-50/80 border-cyan-300 text-cyan-900'
                            : 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300'
                          : isLight
                          ? 'bg-white border-slate-200 text-slate-700'
                          : 'bg-[#0b101c] border-slate-800 text-slate-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={proteinReviewedOnly}
                          onChange={(e) => setProteinReviewedOnly(e.target.checked)}
                          className="mt-0.5 rounded text-cyan-600 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold flex items-center gap-1">
                            <span>Swiss-Prot Reviewed Only</span>
                            <span className="text-amber-500">★</span>
                          </div>
                          <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Excludes unreviewed computer-annotated TrEMBL entries, retaining high-confidence experimental curator records.
                          </p>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-0.5">
                      <label className={`flex items-start space-x-2.5 p-2 rounded-lg border cursor-pointer transition ${
                        geneRefSeqOnly
                          ? isLight
                            ? 'bg-purple-50/80 border-purple-300 text-purple-900'
                            : 'bg-purple-950/40 border-purple-800/80 text-purple-300'
                          : isLight
                          ? 'bg-white border-slate-200 text-slate-700'
                          : 'bg-[#0b101c] border-slate-800 text-slate-300'
                      }`}>
                        <input
                          type="checkbox"
                          checked={geneRefSeqOnly}
                          onChange={(e) => setGeneRefSeqOnly(e.target.checked)}
                          className="mt-0.5 rounded text-purple-600 focus:ring-0"
                        />
                        <div>
                          <div className="font-bold">
                            <span>NCBI RefSeq Curated Records Only</span>
                          </div>
                          <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Restricts query to curated reference sequences (NM_, NC_, NR_) with verified transcript models.
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ACTIVE FILTER SUMMARY & RESULTS STATUS BAR */}
          <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Collapsed filter chips */}
              {activeFiltersCount > 0 ? (
                <>
                  <span className={`text-[10px] font-semibold flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Active:
                  </span>
                  {organismFilter && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      isLight ? 'bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-900 text-slate-300 border-slate-800'
                    }`}>
                      {organismFilter === 'human' ? 'Homo sapiens' : organismFilter}
                      <button
                        type="button"
                        onClick={() => setOrganismFilter('')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Remove organism filter"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchType === 'protein' && proteinReviewedOnly && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300 font-bold' : 'bg-cyan-950/80 text-cyan-300 border-cyan-800 font-bold'
                    }`}>
                      Reviewed ★
                      <button
                        type="button"
                        onClick={() => setProteinReviewedOnly(false)}
                        className="hover:opacity-75"
                        title="Disable reviewed only"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {searchType === 'gene' && geneRefSeqOnly && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                      isLight ? 'bg-purple-50 text-purple-800 border-purple-300 font-bold' : 'bg-purple-950/80 text-purple-300 border-purple-800 font-bold'
                    }`}>
                      RefSeq Curated
                      <button
                        type="button"
                        onClick={() => setGeneRefSeqOnly(false)}
                        className="hover:opacity-75"
                        title="Disable RefSeq only"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsFiltersOpen((prev) => !prev)}
                    className={`text-[10px] underline ml-1 ${
                      isLight ? 'text-cyan-700 hover:text-cyan-900' : 'text-cyan-400 hover:text-cyan-300'
                    }`}
                  >
                    {isFiltersOpen ? 'Hide' : 'Edit'}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsFiltersOpen(true)}
                  className={`text-[11px] flex items-center gap-1 underline transition ${
                    isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Add filters (organism, reviewed)...</span>
                </button>
              )}
            </div>

            {/* Results Counter & Pagination header */}
            <div className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              <span>
                Page {currentPage} · Showing {results.length} of {totalCount > 0 ? totalCount.toLocaleString() : results.length} items
              </span>
            </div>
          </div>
        </form>
      </div>

      {/* ERROR MESSAGE */}
      {errorMessage && (
        <div className={`p-3 m-4 rounded-xl text-xs font-mono border ${
          isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-950/40 border-amber-800 text-amber-300'
        }`}>
          {errorMessage}
        </div>
      )}

      {/* 3. UNIFIED CONSISTENT RESULTS TABLE (Does not care whether data is from NCBI or UniProt) */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className={`text-[10px] uppercase tracking-wider border-b ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-[#080d19] border-slate-800 text-slate-400'
          }`}>
            <tr>
              <th className="px-4 py-2.5">ID / Accession</th>
              <th className="px-4 py-2.5">Designation</th>
              <th className="px-4 py-2.5">Description</th>
              <th className="px-4 py-2.5">Organism</th>
              <th className="px-4 py-2.5 text-right">Length</th>
              <th className="px-4 py-2.5 text-center">Source</th>
              <th className="px-4 py-2.5 text-center">Action</th>
            </tr>
          </thead>

          <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/60'}`}>
            {isLoading && results.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500 font-mono text-xs">
                  <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-cyan-500" />
                  Loading 100 results from {searchType === 'protein' ? 'UniProtKB REST API' : 'NCBI Nuccore'}...
                </td>
              </tr>
            ) : results.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-500 font-mono text-xs">
                  No records found matching "{query}". Try adjusting your search term or organism filter.
                </td>
              </tr>
            ) : (
              results.map((item) => {
                const isCopied = copiedId === item.id;
                return (
                  <tr
                    key={item.id}
                    onClick={() => onSelectResult?.(item)}
                    className={`cursor-pointer transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-cyan-950/20'
                    }`}
                  >
                    {/* ID */}
                    <td className="px-4 py-2.5 font-bold">
                      <div className="flex items-center space-x-1.5">
                        <span className={item.type === 'protein' ? (isLight ? 'text-cyan-800' : 'text-cyan-300') : (isLight ? 'text-purple-800' : 'text-purple-300')}>
                          {item.id}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(item.id, e)}
                          className={`p-1 rounded transition ${isLight ? 'hover:bg-slate-200 text-slate-400' : 'hover:bg-slate-800 text-slate-500'}`}
                          title="Copy Accession"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </td>

                    {/* Designation / Gene Symbol */}
                    <td className="px-4 py-2.5 font-bold font-sans">
                      <span className={isLight ? 'text-slate-900' : 'text-slate-100'}>
                        {item.name}
                      </span>
                    </td>

                    {/* Description */}
                    <td className="px-4 py-2.5 max-w-xs md:max-w-md truncate font-sans" title={item.description}>
                      <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
                        {item.description}
                      </span>
                    </td>

                    {/* Organism */}
                    <td className="px-4 py-2.5 italic text-[11px] truncate max-w-[160px]" title={item.organism}>
                      <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
                        {item.organism}
                      </span>
                    </td>

                    {/* Length (consistent formatting: aa or bp) */}
                    <td className={`px-4 py-2.5 text-right font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                      {item.length.toLocaleString()} {item.type === 'protein' ? 'aa' : 'bp'}
                    </td>

                    {/* Source & Reviewed Badge */}
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border inline-block ${
                          item.source === 'UniProtKB'
                            ? item.isReviewed
                              ? isLight
                                ? 'bg-cyan-100 text-cyan-900 border-cyan-300'
                                : 'bg-cyan-950 text-cyan-300 border-cyan-700'
                              : isLight
                              ? 'bg-slate-100 text-slate-700 border-slate-300'
                              : 'bg-slate-900 text-slate-400 border-slate-800'
                            : isLight
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-purple-950 text-purple-300 border-purple-800'
                        }`}
                      >
                        {item.source} {item.isReviewed ? '★' : ''}
                      </span>
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center space-x-1.5">
                        {item.type === 'protein' && onViewStructure && (
                          <button
                            type="button"
                            onClick={() => onViewStructure(item.id)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition border ${
                              isLight
                                ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border-cyan-300'
                                : 'bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border-cyan-800'
                            }`}
                            title="Inspect in 3D Molecular Viewer"
                          >
                            3D View
                          </button>
                        )}
                        <a
                          href={
                            item.source === 'UniProtKB'
                              ? `https://www.uniprot.org/uniprotkb/${item.id}`
                              : `https://www.ncbi.nlm.nih.gov/nuccore/${item.id}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className={`p-1 rounded transition ${
                            isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400'
                          }`}
                          title="Open database entry"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. PAGINATION FOOTER (100 results per page) */}
      <div className={`p-4 border-t flex flex-wrap items-center justify-between text-xs font-mono gap-3 ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800/80 bg-[#080d19]'
      }`}>
        <div className={`flex items-center space-x-2 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
          <span>
            Displaying page <strong>{currentPage}</strong> (100 results/page)
          </span>
          {searchType === 'protein' && nextCursor && (
            <span className="text-[10px] text-cyan-500">· Cursor pagination active</span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition ${
              currentPage > 1 && !isLoading
                ? isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous 100</span>
          </button>

          <span className={`px-2.5 py-1 rounded-lg border font-bold ${
            isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0f1424] border-slate-750 text-cyan-300'
          }`}>
            {currentPage}
          </span>

          <button
            type="button"
            onClick={handleNextPage}
            disabled={(searchType === 'protein' && !nextCursor) || results.length < pageSize || isLoading}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border transition ${
              ((searchType === 'protein' && nextCursor) || (searchType === 'gene' && results.length >= pageSize)) && !isLoading
                ? isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'opacity-40 cursor-not-allowed border-transparent text-slate-500'
            }`}
          >
            <span>Next 100</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
