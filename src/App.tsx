/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  CheckCircle,
  RefreshCw,
  Upload,
  FileText,
  Database,
  X,
  Box,
  Dna,
  AlignLeft,
  GitFork,
  Activity,
  BarChart2,
  Layers,
} from 'lucide-react';
import { GENE_FIXTURES } from './data/geneFixtures';
import { GeneDataset, MutationPreset, SavedPipelineRun } from './types/bioinformatics';
import { calculateDeltaDeltaG } from './utils/bioMath';
import {
  fetchProteinFromAPI,
  buildDatasetFromSequence,
  NcbiCandidate,
} from './services/bioServices';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { MetricCards } from './components/MetricCards';
import { ModuleTargetOverview } from './components/ModuleTargetOverview';
import { ModuleBlastSearch } from './components/ModuleBlastSearch';
import { ModuleMsaAlignment } from './components/ModuleMsaAlignment';
import { ModulePhyloTree } from './components/ModulePhyloTree';
import { ModuleDeltaDeltaG } from './components/ModuleDeltaDeltaG';
import { ModulePdbViewer } from './components/ModulePdbViewer';
import { ModuleGeoVolcano } from './components/ModuleGeoVolcano';
import { RawFastaModal } from './components/RawFastaModal';
import { FastaInputModal } from './components/FastaInputModal';
import { NcbiSearchModal } from './components/NcbiSearchModal';
import { ExportModal } from './components/ExportModal';
import { SavedRunsModal } from './components/SavedRunsModal';
import { NewickEditorModal } from './components/NewickEditorModal';
import { SequenceTranslatorModal } from './components/SequenceTranslatorModal';
import { KnowledgeHubView } from './components/KnowledgeHubView';
import { AiDiscussionView } from './components/AiDiscussionView';
import { NativeDatabaseLensModal } from './components/NativeDatabaseLensModal';

type SuiteStage = '3d' | 'overview' | 'homology' | 'phylo' | 'stability' | 'geo' | 'all';

const SUITE_STAGES: Array<{ id: SuiteStage; label: string; icon: any }> = [
  { id: '3d', label: '3D Structure & AlphaFold', icon: Box },
  { id: 'overview', label: 'Sequence & Overview', icon: Dna },
  { id: 'stability', label: 'ΔΔG Free Energy', icon: Activity },
  { id: 'homology', label: 'BLAST+ & Alignment', icon: AlignLeft },
  { id: 'phylo', label: 'Phylogenetic Tree', icon: GitFork },
  { id: 'geo', label: 'GEO2R Volcano', icon: BarChart2 },
  { id: 'all', label: 'Full Stack View', icon: Layers },
];

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('jaivik_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  });
  const isLight = theme === 'light';

  useEffect(() => {
    try {
      localStorage.setItem('jaivik_theme', theme);
    } catch {}
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Default to TP53 on launch so 3D structure and metrics render immediately
  const [geneKey, setGeneKey] = useState<string>('TP53');
  const [searchInput, setSearchInput] = useState<string>('TP53');
  const [engineMode, setEngineMode] = useState<'demo' | 'live'>('live');
  const [moleculeType, setMoleculeType] = useState<'DNA' | 'PROTEIN'>('PROTEIN');
  const [activeTab, setActiveTab] = useState<ActiveTab>('suite');
  const [suiteStage, setSuiteStage] = useState<SuiteStage>('3d');
  const [isFetchingTarget, setIsFetchingTarget] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  const [customDatasets, setCustomDatasets] = useState<Record<string, GeneDataset>>({});

  const activeDataset: GeneDataset | null = geneKey
    ? customDatasets[geneKey] || GENE_FIXTURES[geneKey] || GENE_FIXTURES['TP53']
    : GENE_FIXTURES['TP53'];

  const [selectedPreset, setSelectedPreset] = useState<MutationPreset | undefined>(
    activeDataset?.mutationPresets?.[0]
  );
  const [wtAa, setWtAa] = useState<string>(activeDataset?.mutationPresets?.[0]?.wt || 'R');
  const [pos, setPos] = useState<number>(activeDataset?.mutationPresets?.[0]?.pos || 175);
  const [mutAa, setMutAa] = useState<string>(activeDataset?.mutationPresets?.[0]?.mut || 'H');
  const [tempC, setTempC] = useState<number>(25);
  const [pH, setPH] = useState<number>(7.0);

  const [currentNewick, setCurrentNewick] = useState<string>(
    activeDataset?.defaultNewick || '();'
  );

  const [selectedBlastHitAccessions, setSelectedBlastHitAccessions] = useState<string[]>([]);
  const [selectedMsaSpeciesKeys, setSelectedMsaSpeciesKeys] = useState<string[]>([]);

  const [isRawFastaOpen, setIsRawFastaOpen] = useState(false);
  const [isFastaInputOpen, setIsFastaInputOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSavedRunsOpen, setIsSavedRunsOpen] = useState(false);
  const [isNewickEditorOpen, setIsNewickEditorOpen] = useState(false);
  const [isTranslatorOpen, setIsTranslatorOpen] = useState(false);
  const [isLensModalOpen, setIsLensModalOpen] = useState(false);

  const [phyloTaxa, setPhyloTaxa] = useState<any[]>([]);
  const [isNcbiSearchOpen, setIsNcbiSearchOpen] = useState(false);
  const [searchCandidates] = useState<NcbiCandidate[]>([]);
  const [activeSearchQuery, setActiveSearchQuery] = useState<string>('');

  const [savedRuns, setSavedRuns] = useState<SavedPipelineRun[]>(() => {
    try {
      const saved = localStorage.getItem('jaivik_saved_runs');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    if (!geneKey) return;
    const ds = customDatasets[geneKey] || GENE_FIXTURES[geneKey];
    if (ds) {
      setSearchInput(ds.symbol);
      const p = ds.mutationPresets[0];
      setSelectedPreset(p);
      setWtAa(p.wt);
      setPos(p.pos);
      setMutAa(p.mut);
      setCurrentNewick(ds.defaultNewick);
      if (ds.blastHits?.length) {
        setSelectedBlastHitAccessions(ds.blastHits.slice(0, 4).map((h) => h.accession));
      }
      if (ds.msaSequences?.length) {
        setSelectedMsaSpeciesKeys(ds.msaSequences.slice(0, 4).map((s) => s.speciesKey));
      }
    }
  }, [geneKey, customDatasets]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3500);
  };

  const handleLoadTarget = async (rawInput: string, isDirectDemo: boolean = false) => {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      showToast('Enter a gene symbol, PDB code, or UniProt accession');
      return;
    }

    const upper = trimmed.toUpperCase();

    if (GENE_FIXTURES[upper]) {
      setGeneKey(upper);
      showToast(`Loaded ${upper} dataset & 3D coordinates`);
      return;
    }
    if (upper.includes('SPIKE') || upper.includes('COV')) {
      setGeneKey('Spike (CoV2)');
      showToast('Loaded SARS-CoV-2 Spike dataset');
      return;
    }
    if (upper.includes('BRCA')) {
      setGeneKey('BRCA1');
      showToast('Loaded BRCA1 dataset');
      return;
    }
    if (customDatasets[upper]) {
      setGeneKey(upper);
      showToast(`Loaded cached dataset for ${upper}`);
      return;
    }

    if (!isDirectDemo) {
      setActiveSearchQuery(trimmed);
      setIsLensModalOpen(true);
    }
  };

  const handleSelectCandidate = async (candidate: NcbiCandidate) => {
    setIsFetchingTarget(true);
    showToast(`Loading ${candidate.geneSymbol} (${candidate.accession})...`);

    try {
      const upperSym = candidate.geneSymbol.toUpperCase();
      if (candidate.taxId === 9606 && GENE_FIXTURES[upperSym]) {
        setGeneKey(upperSym);
        return;
      }

      if (candidate.sequence && candidate.sequence.length > 15) {
        const ds = buildDatasetFromSequence(
          candidate.geneSymbol,
          candidate.proteinName,
          candidate.organism,
          candidate.accession,
          `NM_${candidate.accession.slice(0, 6)}`,
          candidate.sequence
        );
        setCustomDatasets((prev) => ({ ...prev, [candidate.geneSymbol]: ds }));
        setGeneKey(candidate.geneSymbol);
      } else {
        const ds = await fetchProteinFromAPI(candidate.accession);
        if (ds) {
          setCustomDatasets((prev) => ({ ...prev, [ds.symbol]: ds }));
          setGeneKey(ds.symbol);
        }
      }
    } catch (err) {
      showToast(`Error loading candidate: ${err}`);
    } finally {
      setIsFetchingTarget(false);
    }
  };

  const handleApplyTranslatedTarget = (symbol: string, proteinSequence: string) => {
    try {
      setIsFetchingTarget(true);
      const ds = buildDatasetFromSequence(
        symbol,
        `Translated Target ${symbol}`,
        'Homo sapiens (Translated CDS)',
        `TR_${symbol.slice(0, 6)}`,
        `NM_TR_${symbol.slice(0, 6)}`,
        proteinSequence
      );
      setCustomDatasets((prev) => ({ ...prev, [symbol]: ds }));
      setGeneKey(symbol);
      setSearchInput(symbol);
      setMoleculeType('PROTEIN');
      showToast(`Applied translated protein ${symbol} (${proteinSequence.length} aa)`);
    } finally {
      setIsFetchingTarget(false);
    }
  };

  const ddgResult = activeDataset
    ? calculateDeltaDeltaG(wtAa, mutAa, tempC, pH, pos)
    : { ddG: -2.38, category: 'Destabilizing' as const, consequence: 'Disrupts core packing' };

  const currentDdgNumber = activeDataset ? ddgResult.ddG : -2.38;
  const currentCategory = activeDataset ? ddgResult.category : 'Destabilizing';
  const currentConsequence = activeDataset ? ddgResult.consequence : 'Disrupts core packing';
  const currentMutationLabel = activeDataset ? `${wtAa}${pos}${mutAa}` : 'R175H';

  const handleSelectPreset = (preset: MutationPreset) => {
    setSelectedPreset(preset);
    setWtAa(preset.wt);
    setPos(preset.pos);
    setMutAa(preset.mut);
    showToast(`Applied mutation ${preset.label}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLoadTarget(searchInput, false);
  };

  const handleSelectGene = (gene: string) => {
    if (gene === 'CUSTOM_LOAD') {
      setIsFastaInputOpen(true);
      return;
    }
    setGeneKey(gene);
    showToast(`Switched target to ${gene}`);
  };

  const handleToggleBlastHit = (accession: string) => {
    setSelectedBlastHitAccessions((prev) =>
      prev.includes(accession) ? prev.filter((a) => a !== accession) : [...prev, accession]
    );
  };

  const handleSelectAllBlastHits = () => {
    if (!activeDataset?.blastHits) return;
    setSelectedBlastHitAccessions(activeDataset.blastHits.map((h) => h.accession));
  };

  const handleClearBlastHits = () => {
    setSelectedBlastHitAccessions([]);
  };

  const handleToggleMsaSpecies = (speciesKey: string) => {
    setSelectedMsaSpeciesKeys((prev) =>
      prev.includes(speciesKey)
        ? prev.length <= 2
          ? prev
          : prev.filter((s) => s !== speciesKey)
        : [...prev, speciesKey]
    );
  };

  const handleSelectAllMsaSpecies = () => {
    if (!activeDataset?.msaSequences) return;
    setSelectedMsaSpeciesKeys(activeDataset.msaSequences.map((s) => s.speciesKey));
  };

  const handleSaveSession = () => {
    if (!activeDataset) return;
    const newRun: SavedPipelineRun = {
      id: `run-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      geneSymbol: activeDataset.symbol,
      geneName: activeDataset.fullName,
      engineMode,
      mutation: currentMutationLabel,
      ddGValue: currentDdgNumber,
      log2FC: activeDataset.dysregulationLog2FC || 0,
      blastHitsCount: activeDataset.blastHits?.length || 0,
      notes: `WT ${wtAa} -> Mut ${mutAa} @ Position ${pos}`,
    };

    const updated = [newRun, ...savedRuns];
    setSavedRuns(updated);
    try {
      localStorage.setItem('jaivik_saved_runs', JSON.stringify(updated));
    } catch {}
    showToast(`Saved session for ${activeDataset.symbol}`);
  };

  const handleRestoreRun = (run: SavedPipelineRun) => {
    if (GENE_FIXTURES[run.geneSymbol]) {
      setGeneKey(run.geneSymbol);
    }
    setEngineMode(run.engineMode);
    showToast(`Restored run: ${run.geneSymbol}`);
  };

  const handleClearRuns = () => {
    setSavedRuns([]);
    try {
      localStorage.removeItem('jaivik_saved_runs');
    } catch {}
    showToast('Cleared saved runs');
  };

  const handleToggleEngine = () => {
    const next = engineMode === 'demo' ? 'live' : 'demo';
    setEngineMode(next);
    showToast(next === 'live' ? 'Live NCBI & AlphaFold DB v6 Stream' : 'Fast Local Fixtures Mode');
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased flex flex-col selection:bg-[#76B900]/30 selection:text-white transition-colors duration-200 ${
        isLight ? 'bg-[#f6f8f5] text-slate-800' : 'bg-[#0A0B09] text-[#E4EBE0]'
      }`}
    >
      {/* Top Header */}
      <Header
        currentGene={activeDataset?.symbol || 'TP53'}
        engineMode={engineMode}
        onToggleEngine={handleToggleEngine}
        onSelectGene={handleSelectGene}
        onSaveSession={handleSaveSession}
        onOpenSavedRuns={() => setIsSavedRunsOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenTranslator={() => setIsTranslatorOpen(true)}
        savedRunsCount={savedRuns.length}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          engineMode={engineMode}
          onToggleEngine={handleToggleEngine}
          savedRunsCount={savedRuns.length}
          moleculeType={moleculeType}
          onOpenTranslator={() => setIsTranslatorOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          theme={theme}
        />

        {/* Main Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 max-w-[1440px] mx-auto w-full">
          {/* 60FPS Toast Notification */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                className="fixed bottom-5 right-5 z-50 bg-[#10130E] border border-[#76B900] text-[#8ED600] px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 text-xs font-mono"
              >
                <CheckCircle className="w-4 h-4 text-[#76B900]" />
                <span>{toastMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Conditional View by Sidebar Active Tab */}
          {activeTab === 'knowledge' ? (
            <KnowledgeHubView />
          ) : activeTab === 'ai' ? (
            <AiDiscussionView
              dataset={activeDataset}
              currentMutation={currentMutationLabel}
              currentDdg={currentDdgNumber}
            />
          ) : activeTab === 'saved' ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl mx-auto py-4"
            >
              <div className="bg-[#10130E] border border-[#22281E] rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Saved Pipeline Executions</h2>
                  <p className="text-xs text-slate-400">
                    Review or restore previous computational runs
                  </p>
                </div>
                {savedRuns.length > 0 && (
                  <button
                    onClick={handleClearRuns}
                    className="text-xs font-mono text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>
              {savedRuns.length === 0 ? (
                <div className="text-center py-16 text-slate-500 text-xs bg-[#10130E] border border-[#22281E] rounded-2xl">
                  No saved runs yet. Click &quot;Save&quot; in the top bar to bookmark your analysis.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {savedRuns.map((run) => (
                    <motion.div
                      key={run.id}
                      whileHover={{ y: -2 }}
                      className="bg-[#10130E] border border-[#22281E] rounded-xl p-3.5 flex items-center justify-between"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-[#76B900] text-sm">{run.geneSymbol}</span>
                          <span className="text-xs font-mono text-slate-300">{run.mutation}</span>
                          <span className="text-xs font-mono text-rose-400">ΔΔG {run.ddGValue}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{run.timestamp}</div>
                      </div>
                      <button
                        onClick={() => {
                          handleRestoreRun(run);
                          setActiveTab('suite');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#76B900] text-black font-bold text-xs font-mono transition cursor-pointer"
                      >
                        Load Target
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <>
              {/* 1. SLEEK UNIFIED COMMAND & TARGET BAR (Low Clutter) */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`border rounded-2xl p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 ${
                  isLight
                    ? 'bg-white border-slate-200 shadow-xs'
                    : 'bg-[#10130E] border-[#22281E] shadow-lg'
                }`}
              >
                {/* Search Capsule */}
                <form
                  onSubmit={handleSearchSubmit}
                  className={`flex-1 flex items-center rounded-xl px-3.5 py-1.5 border transition-all ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 focus-within:border-[#76B900] focus-within:bg-white'
                      : 'bg-[#0A0B09] border-[#262C22] focus-within:border-[#76B900]'
                  }`}
                >
                  <Search className="w-4 h-4 shrink-0 mr-2.5 text-[#76B900]" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="Search gene, UniProt, or PDB ID (e.g. TP53, BRCA1, KRAS, EGFR, INS)..."
                    className={`flex-1 bg-transparent text-xs font-mono focus:outline-none uppercase tracking-wide ${
                      isLight ? 'text-slate-900 font-semibold' : 'text-white placeholder:text-slate-500'
                    }`}
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="p-1 mr-1 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isFetchingTarget}
                    className="px-4 py-1.5 rounded-lg bg-[#76B900] hover:bg-[#8ED600] text-black font-bold text-xs font-mono flex items-center gap-1.5 shrink-0 transition cursor-pointer"
                  >
                    {isFetchingTarget ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Search className="w-3.5 h-3.5" />
                    )}
                    <span>Load</span>
                  </button>
                </form>

                {/* Quick Target Chips + Essential Modals */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2">
                  <div className="flex items-center gap-1 bg-[#0A0B09] p-1 rounded-xl border border-[#22281E]">
                    {(
                      [
                        { key: 'TP53', label: 'TP53' },
                        { key: 'BRCA1', label: 'BRCA1' },
                        { key: 'KRAS', label: 'KRAS' },
                        { key: 'EGFR', label: 'EGFR' },
                        { key: 'INS', label: 'INS' },
                        { key: 'Spike (CoV2)', label: 'Spike' },
                      ] as const
                    ).map((demo) => {
                      const isActive = activeDataset?.symbol === demo.key;
                      return (
                        <button
                          key={demo.key}
                          type="button"
                          onClick={() => handleLoadTarget(demo.key, true)}
                          className={`relative font-mono text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                            isActive ? 'text-black font-bold' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {isActive && (
                            <motion.div
                              layoutId="quickDemoChip"
                              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                              className="absolute inset-0 rounded-lg bg-[#76B900]"
                            />
                          )}
                          <span className="relative z-10">{demo.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsLensModalOpen(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 bg-[#76B900]/15 hover:bg-[#76B900]/25 text-[#8ED600] border border-[#76B900]/40 transition cursor-pointer"
                      title="Live NCBI & UniProt Database Lens"
                    >
                      <Database className="w-3.5 h-3.5 text-[#76B900]" />
                      <span>DB Lens</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFastaInputOpen(true)}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1 bg-[#0A0B09] hover:bg-[#161B13] text-slate-300 border border-[#262C22] transition cursor-pointer"
                      title="Input custom FASTA sequence"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#76B900]" />
                      <span className="hidden sm:inline">FASTA</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsRawFastaOpen(true)}
                      className="p-1.5 rounded-xl bg-[#0A0B09] hover:bg-[#161B13] text-slate-400 hover:text-white border border-[#262C22] transition cursor-pointer"
                      title="View Raw FASTA"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>

              {/* 2. 4 ESSENTIAL METRIC CARDS */}
              <MetricCards
                dataset={activeDataset}
                currentDdg={currentDdgNumber}
                currentMutationLabel={currentMutationLabel}
                currentPhenotype={
                  selectedPreset?.structuralImpact || activeDataset?.hotspotPhenotype || 'Active'
                }
                theme={theme}
                onJumpTo3D={() => {
                  setActiveTab('suite');
                  setSuiteStage('3d');
                }}
              />

              {/* 3. FLUID 60FPS STAGE SELECTOR (Only shown when in 'suite' tab to prevent stacking all 7 heavy modules at once) */}
              {activeTab === 'suite' && (
                <div
                  className={`p-1.5 rounded-2xl border flex flex-wrap items-center gap-1 ${
                    isLight
                      ? 'bg-white border-slate-200 shadow-xs'
                      : 'bg-[#10130E] border-[#22281E]'
                  }`}
                >
                  {SUITE_STAGES.map((stage) => {
                    const isActive = suiteStage === stage.id;
                    const Icon = stage.icon;
                    return (
                      <button
                        key={stage.id}
                        type="button"
                        onClick={() => setSuiteStage(stage.id)}
                        className={`relative px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                          isActive
                            ? 'text-black'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="suiteStageIndicator"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-0 rounded-xl bg-[#76B900] shadow-[0_0_16px_rgba(118,185,0,0.35)]"
                          />
                        )}
                        <Icon className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">{stage.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 4. ANIMATED STAGE CONTENT (60FPS Spring Transitions) */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeTab}-${suiteStage}-${activeDataset?.symbol}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-6"
                >
                  {/* 3D Structure & AlphaFold View (Default Hero View) */}
                  {(activeTab === 'pdb' ||
                    (activeTab === 'suite' && (suiteStage === '3d' || suiteStage === 'all'))) && (
                    <ModulePdbViewer
                      dataset={activeDataset}
                      moleculeType={moleculeType}
                      theme={theme}
                    />
                  )}

                  {/* Target Overview & Sequence Dock */}
                  {(activeTab === 'target' ||
                    (activeTab === 'suite' &&
                      (suiteStage === 'overview' || suiteStage === 'all'))) && (
                    <ModuleTargetOverview
                      dataset={activeDataset}
                      theme={theme}
                      onSelectResidueForMutation={(p, char) => {
                        setPos(p);
                        setWtAa(char);
                        showToast(`Selected residue #${p} (${char}) for ΔΔG simulation`);
                      }}
                    />
                  )}

                  {/* Thermodynamic ΔΔG Free Energy */}
                  {(activeTab === 'stability' ||
                    (activeTab === 'suite' &&
                      (suiteStage === 'stability' || suiteStage === 'all'))) && (
                    <ModuleDeltaDeltaG
                      dataset={activeDataset}
                      theme={theme}
                      selectedPreset={selectedPreset}
                      onSelectPreset={handleSelectPreset}
                      wtAa={wtAa}
                      setWtAa={setWtAa}
                      pos={pos}
                      setPos={setPos}
                      mutAa={mutAa}
                      setMutAa={setMutAa}
                      tempC={tempC}
                      setTempC={setTempC}
                      pH={pH}
                      setPH={setPH}
                      currentDdg={currentDdgNumber}
                      currentCategory={currentCategory}
                      currentConsequence={currentConsequence}
                      isLocked={moleculeType === 'DNA'}
                      onUnlockProtein={() => {
                        setMoleculeType('PROTEIN');
                        showToast('Switched to PROTEIN mode');
                      }}
                    />
                  )}

                  {/* Homology: BLAST+ & Multiple Sequence Alignment */}
                  {(activeTab === 'blast' ||
                    (activeTab === 'suite' &&
                      (suiteStage === 'homology' || suiteStage === 'all'))) && (
                    <ModuleBlastSearch
                      dataset={activeDataset}
                      selectedHitAccessions={selectedBlastHitAccessions}
                      onToggleHitSelection={handleToggleBlastHit}
                      onSelectAllHits={handleSelectAllBlastHits}
                      onClearHitSelection={handleClearBlastHits}
                      onProceedToMsa={() => setActiveTab('msa')}
                      theme={theme}
                    />
                  )}

                  {(activeTab === 'msa' ||
                    (activeTab === 'suite' &&
                      (suiteStage === 'homology' || suiteStage === 'all'))) && (
                    <ModuleMsaAlignment
                      dataset={activeDataset}
                      selectedMsaSpeciesKeys={selectedMsaSpeciesKeys}
                      onToggleSpeciesSelection={handleToggleMsaSpecies}
                      onSelectAllSpecies={handleSelectAllMsaSpecies}
                      onProceedToPhylo={() => {
                        if (activeTab === 'suite') setSuiteStage('phylo');
                        else setActiveTab('phylo');
                      }}
                      theme={theme}
                    />
                  )}

                  {/* Phylogenetic Tree */}
                  {(activeTab === 'phylo' ||
                    (activeTab === 'suite' &&
                      (suiteStage === 'phylo' || suiteStage === 'all'))) && (
                    <ModulePhyloTree
                      dataset={activeDataset}
                      theme={theme}
                      onOpenNewickEditor={() => setIsNewickEditorOpen(true)}
                      onOpenDbLens={() => setIsLensModalOpen(true)}
                      importedTaxa={phyloTaxa}
                      onClearImportedTaxa={() => setPhyloTaxa([])}
                    />
                  )}

                  {/* GEO2R Volcano Plot */}
                  {(activeTab === 'geo' ||
                    (activeTab === 'suite' && (suiteStage === 'geo' || suiteStage === 'all'))) && (
                    <ModuleGeoVolcano
                      dataset={activeDataset}
                      theme={theme}
                      onExportTsv={() => setIsExportOpen(true)}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      {/* Modals */}
      <NcbiSearchModal
        isOpen={isNcbiSearchOpen}
        onClose={() => setIsNcbiSearchOpen(false)}
        query={activeSearchQuery}
        candidates={searchCandidates}
        isLoading={isFetchingTarget}
        onSelectCandidate={handleSelectCandidate}
        onDirectAccessionSubmit={(acc) => handleLoadTarget(acc, false)}
      />

      <FastaInputModal
        isOpen={isFastaInputOpen}
        onClose={() => setIsFastaInputOpen(false)}
        onSubmit={(query) => {
          setIsFastaInputOpen(false);
          handleLoadTarget(query);
        }}
        isLoading={isFetchingTarget}
      />

      <RawFastaModal
        dataset={activeDataset}
        isOpen={isRawFastaOpen}
        onClose={() => setIsRawFastaOpen(false)}
      />

      <ExportModal
        dataset={activeDataset}
        currentDdg={currentDdgNumber}
        currentMutation={currentMutationLabel}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <SavedRunsModal
        runs={savedRuns}
        isOpen={isSavedRunsOpen}
        onClose={() => setIsSavedRunsOpen(false)}
        onRestoreRun={handleRestoreRun}
        onClearRuns={handleClearRuns}
      />

      <NewickEditorModal
        currentNewick={currentNewick}
        defaultNewick={activeDataset?.defaultNewick || '();'}
        isOpen={isNewickEditorOpen}
        onClose={() => setIsNewickEditorOpen(false)}
        onSave={(updated) => {
          setCurrentNewick(updated);
          showToast('Updated phylogenetic Newick tree');
        }}
      />

      <SequenceTranslatorModal
        isOpen={isTranslatorOpen}
        onClose={() => setIsTranslatorOpen(false)}
        dataset={activeDataset}
        onApplyTranslatedTarget={handleApplyTranslatedTarget}
      />

      <NativeDatabaseLensModal
        isOpen={isLensModalOpen}
        onClose={() => setIsLensModalOpen(false)}
        initialQuery={activeSearchQuery || searchInput || 'TP53'}
        theme={theme}
        onSelectTarget={async (target) => {
          setSearchInput(target.symbol);
          setIsFetchingTarget(true);
          try {
            const ds = await fetchProteinFromAPI(target.accession);
            if (ds) {
              setCustomDatasets((prev) => ({ ...prev, [ds.symbol]: ds }));
              setGeneKey(ds.symbol);
              showToast(`Loaded ${ds.symbol} (${ds.targetOrganism})`);
            } else {
              const fallback = buildDatasetFromSequence(
                target.symbol,
                target.description || `${target.symbol} target`,
                target.organism || 'Homo sapiens',
                target.accession,
                `NM_${target.accession.slice(0, 6)}`,
                target.sequence ||
                  'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGP'
              );
              setCustomDatasets((prev) => ({ ...prev, [target.symbol]: fallback }));
              setGeneKey(target.symbol);
              showToast(`Loaded sequence scaffold for ${target.symbol}`);
            }
          } catch {
            setGeneKey(target.symbol);
          } finally {
            setIsFetchingTarget(false);
          }
        }}
        onSendToBlast={(acc, name) => {
          setActiveTab('blast');
          showToast(`Target ${name || acc} dispatched to BLAST+`);
        }}
        onAddToMsa={(item) => {
          setActiveTab('msa');
          showToast(`Queued ${item.name} into MSA`);
        }}
        onView3DStructure={(pdbId) => {
          setActiveTab('pdb');
          showToast(`Activated 3D structure coordinates for ${pdbId}`);
        }}
        onSendToPhyloTree={(incomingTaxa) => {
          setPhyloTaxa((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const newItems = incomingTaxa.filter((t) => !existingIds.has(t.id));
            return [...prev, ...newItems];
          });
          setActiveTab('phylo');
          showToast(`Added ${incomingTaxa.length} target(s) to Phylogenetic Tree`);
        }}
      />
    </div>
  );
}
