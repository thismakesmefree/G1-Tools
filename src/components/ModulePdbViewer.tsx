import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Box,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  ArrowLeftRight,
  Database,
  Download,
  FileCode,
  Focus,
  Layers,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { GeneDataset } from '../types/bioinformatics';
import {
  MolecularViewer3D,
  StructureMeta,
  AlphaFoldPredictionMeta,
  ClickedResidueInfo,
} from './MolecularViewer3D';

interface ModulePdbViewerProps {
  dataset: GeneDataset | null;
  moleculeType?: 'DNA' | 'PROTEIN';
  theme?: 'dark' | 'light';
}

interface StructuralAnnotation {
  id: string;
  residuePos: number;
  label: string;
  category: 'Active Site' | 'Hotspot' | 'Binding Pocket' | 'PTM' | 'Domain';
  color: string;
  notes: string;
}

const UNIPROT_MAP: Record<
  string,
  { uniprot: string; pdbId: string; name: string; defaultPlddt: number }
> = {
  TP53: {
    uniprot: 'P04637',
    pdbId: '1TUP',
    name: 'Cellular tumor antigen p53',
    defaultPlddt: 76.8,
  },
  BRCA1: {
    uniprot: 'P38398',
    pdbId: '1JNX',
    name: 'Breast cancer type 1 susceptibility protein',
    defaultPlddt: 64.5,
  },
  EGFR: {
    uniprot: 'P00533',
    pdbId: '1M17',
    name: 'Epidermal growth factor receptor',
    defaultPlddt: 82.4,
  },
  KRAS: {
    uniprot: 'P01116',
    pdbId: '4OBE',
    name: 'GTPase KRas',
    defaultPlddt: 92.6,
  },
  INS: {
    uniprot: 'P01308',
    pdbId: '1TRZ',
    name: 'Insulin',
    defaultPlddt: 86.4,
  },
  'Spike (CoV2)': {
    uniprot: 'P0DTC2',
    pdbId: '6VXX',
    name: 'Spike glycoprotein (SARS-CoV-2)',
    defaultPlddt: 81.2,
  },
};

const CODON_TABLE: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

function translateDnaToProtein(dnaSeq: string, frame: number = 0): string {
  const clean = dnaSeq.toUpperCase().replace(/[^ATCG]/g, '');
  let protein = '';
  for (let i = frame; i + 2 < clean.length; i += 3) {
    const codon = clean.substring(i, i + 3);
    const aa = CODON_TABLE[codon] || 'X';
    if (aa === '*') break;
    protein += aa;
  }
  return protein;
}

export const ModulePdbViewer: React.FC<ModulePdbViewerProps> = ({
  dataset,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Default to RCSB 1TUP or AlphaFold v6 seamlessly
  const [backendSource, setBackendSource] = useState<'alphafold' | 'rcsb'>('rcsb');
  const [activeUniProt, setActiveUniProt] = useState<string>('P04637');
  const [activePdbId, setActivePdbId] = useState<string>('1TUP');
  const [viewerTarget, setViewerTarget] = useState<string>('1TUP');

  const [loadedMeta, setLoadedMeta] = useState<StructureMeta | null>(null);
  const [afPrediction, setAfPrediction] = useState<AlphaFoldPredictionMeta | null>(null);
  const [highlightedResidue, setHighlightedResidue] = useState<number | null>(null);
  const [clickedResidue, setClickedResidue] = useState<ClickedResidueInfo | null>(null);

  // Collapsible drawers to keep default view ultra-clean
  const [showAddPinForm, setShowAddPinForm] = useState<boolean>(false);
  const [showTranslator, setShowTranslator] = useState<boolean>(false);
  const [showPaePreview, setShowPaePreview] = useState<boolean>(false);

  const [dnaInput, setDnaInput] = useState<string>(
    'ATGGAGGAGCCGCAGTCAGATCCTAGCGTCGAGCCCCCTCTGAGTCAGGAAACATTTTCAGACCTATGGAAACTACTTCCTGAAAACAACGTTCTGTCCCCCTTGCCGTCCCAAGCAATGGATGATTTGATGCTGTCCCCGGACGATATTGAACAATGGTTCACTGAAGACCCAGGTCCA'
  );
  const [translatedProtein, setTranslatedProtein] = useState<string>('');

  const [annotations, setAnnotations] = useState<StructuralAnnotation[]>([
    {
      id: 'ann-1',
      residuePos: 175,
      label: 'R175H Zn-Pocket',
      category: 'Hotspot',
      color: '#f43f5e',
      notes: 'Disrupts L2-L3 loop & zinc coordination',
    },
    {
      id: 'ann-2',
      residuePos: 248,
      label: 'R248W Minor Groove',
      category: 'Active Site',
      color: '#76B900',
      notes: 'Direct minor groove DNA contact',
    },
    {
      id: 'ann-3',
      residuePos: 273,
      label: 'R273H Major Groove',
      category: 'Hotspot',
      color: '#38bdf8',
      notes: 'Arg side-chain DNA half-site anchor',
    },
  ]);

  const [newResiduePos, setNewResiduePos] = useState<number>(175);
  const [newLabel, setNewLabel] = useState<string>('');
  const [newCategory, setNewCategory] = useState<StructuralAnnotation['category']>('Active Site');
  const [newNotes, setNewNotes] = useState<string>('');

  const fetchAlphaFoldBackendMeta = async (uniprotOrGene: string) => {
    try {
      const resp = await fetch(
        `/api/alphafold-prediction?id=${encodeURIComponent(uniprotOrGene)}`
      );
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success) {
          setAfPrediction(data);
          setActiveUniProt(data.uniprotAccession || uniprotOrGene);
        }
      }
    } catch {
      // handled gracefully
    }
  };

  useEffect(() => {
    const sym = dataset?.symbol || 'TP53';
    const mapped = UNIPROT_MAP[sym] || {
      uniprot: 'P04637',
      pdbId: dataset?.pdbId || '1TUP',
      name: dataset?.fullName || 'Cellular tumor antigen p53',
      defaultPlddt: 84.5,
    };
    setActiveUniProt(mapped.uniprot);
    setActivePdbId(dataset?.pdbId || mapped.pdbId);

    if (backendSource === 'alphafold') {
      setViewerTarget(`AF-${mapped.uniprot}-F1`);
    } else {
      setViewerTarget(dataset?.pdbId || mapped.pdbId);
    }
    fetchAlphaFoldBackendMeta(mapped.uniprot);
  }, [dataset]);

  const handleSwitchBackend = (mode: 'alphafold' | 'rcsb') => {
    setBackendSource(mode);
    if (mode === 'alphafold') {
      setViewerTarget(`AF-${activeUniProt}-F1`);
    } else {
      setViewerTarget(activePdbId);
    }
  };

  const handleAddAnnotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    const colorMap: Record<StructuralAnnotation['category'], string> = {
      Hotspot: '#f43f5e',
      'Active Site': '#76B900',
      'Binding Pocket': '#38bdf8',
      PTM: '#f59e0b',
      Domain: '#a855f7',
    };
    const newAnn: StructuralAnnotation = {
      id: `ann-${Date.now()}`,
      residuePos: Number(newResiduePos) || 1,
      label: newLabel.trim(),
      category: newCategory,
      color: colorMap[newCategory] || '#76B900',
      notes: newNotes.trim() || 'Pinned 3D locus',
    };
    setAnnotations((prev) => [...prev, newAnn]);
    setHighlightedResidue(newAnn.residuePos);
    setNewLabel('');
    setNewNotes('');
    setShowAddPinForm(false);
  };

  const activeAf = loadedMeta?.alphafold || afPrediction;
  const meanPlddt =
    activeAf?.globalMetricValue != null
      ? Number(activeAf.globalMetricValue).toFixed(1)
      : '84.2';

  const vHighPct = Math.round(((activeAf?.fractionPlddtVeryHigh ?? 0.45) || 0) * 100);
  const confPct = Math.round(((activeAf?.fractionPlddtConfident ?? 0.28) || 0) * 100);
  const lowPct = Math.round(((activeAf?.fractionPlddtLow ?? 0.14) || 0) * 100);
  const vLowPct = Math.round(((activeAf?.fractionPlddtVeryLow ?? 0.13) || 0) * 100);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={`border rounded-2xl p-5 space-y-4 transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
          : 'bg-[#10130E] border-[#22281E] text-slate-200 shadow-xl'
      }`}
    >
      {/* 1. CLEAN UNIFIED HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#76B900]/15 border border-[#76B900]/50 text-[#76B900] shadow-[0_0_15px_rgba(118,185,0,0.2)]">
            <Box className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className={`text-base font-bold tracking-tight font-display ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                3D Molecular Structure & AlphaFold Workbench
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-bold bg-[#76B900]/15 text-[#8ED600] border border-[#76B900]/30">
                Mean pLDDT {meanPlddt}
              </span>
            </div>
            {/* Compact 4-band confidence bar */}
            <div className="flex items-center gap-2 mt-1">
              <div className="w-36 h-1.5 rounded-full overflow-hidden flex bg-[#1A2016]">
                <div style={{ width: `${vHighPct}%` }} className="bg-[#0053D6] h-full" />
                <div style={{ width: `${confPct}%` }} className="bg-[#65CBF3] h-full" />
                <div style={{ width: `${lowPct}%` }} className="bg-[#FFDB13] h-full" />
                <div style={{ width: `${vLowPct}%` }} className="bg-[#FF7D45] h-full" />
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                {activeAf?.entryId || `AF-${activeUniProt}-F1`} · PDB {activePdbId}
              </span>
            </div>
          </div>
        </div>

        {/* Right Controls: Backend Switcher + Quick Links */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          {/* Segmented Source Switcher with 60FPS layoutId pill */}
          <div className="inline-flex p-1 rounded-xl bg-[#0A0B09] border border-[#262C22]">
            {(
              [
                { id: 'rcsb', label: `RCSB PDB (${activePdbId})`, icon: Layers },
                { id: 'alphafold', label: `AlphaFold v6 (${activeUniProt})`, icon: Database },
              ] as const
            ).map((tab) => {
              const active = backendSource === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleSwitchBackend(tab.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    active ? 'text-black' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="pdbBackendSwitch"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-lg bg-[#76B900] shadow-[0_0_12px_rgba(118,185,0,0.35)]"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {activeAf?.cifUrl && (
            <a
              href={activeAf.cifUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-xl border border-[#262C22] bg-[#0A0B09] hover:border-[#76B900] text-slate-300 hover:text-[#8ED600] flex items-center gap-1 transition"
              title="Download AlphaFold DB v6 mmCIF coordinates"
            >
              <Download className="w-3.5 h-3.5 text-[#76B900]" />
              <span className="hidden sm:inline">mmCIF</span>
            </a>
          )}

          {activeAf?.paeImageUrl && (
            <button
              type="button"
              onClick={() => setShowPaePreview((p) => !p)}
              className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1 transition cursor-pointer ${
                showPaePreview
                  ? 'bg-[#76B900]/20 border-[#76B900] text-[#8ED600] font-bold'
                  : 'border-[#262C22] bg-[#0A0B09] text-slate-300 hover:border-[#76B900]'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-[#76B900]" />
              <span>PAE Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible PAE Matrix Drawer */}
      <AnimatePresence>
        {showPaePreview && activeAf?.paeImageUrl && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#0A0B09] border border-[#262C22] p-3.5 rounded-xl text-xs font-mono">
              <img
                src={activeAf.paeImageUrl}
                alt={`PAE Matrix for ${activeAf.entryId}`}
                className="w-36 h-36 rounded-lg border border-[#2A3126] object-contain bg-white shrink-0"
              />
              <div className="space-y-1">
                <h4 className="font-bold text-white">
                  Predicted Aligned Error (PAE) · {activeAf.entryId}
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Dark blocks along the diagonal represent rigid globular domains; lighter bands
                  denote flexible inter-domain linkers.
                </p>
                {activeAf.paeDocUrl && (
                  <a
                    href={activeAf.paeDocUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#8ED600] hover:underline font-bold pt-1 text-[11px]"
                  >
                    <FileCode className="w-3 h-3" />
                    <span>Download PAE v{activeAf.latestVersion || 6} JSON</span>
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. FULL-WIDTH REUSABLE 3D WEBGL VIEWPORT */}
      <MolecularViewer3D
        pdbId={backendSource === 'rcsb' ? viewerTarget : undefined}
        pdbIdOrUrl={viewerTarget}
        initialRepresentation="cartoon"
        initialColorScheme="plddt"
        annotations={annotations}
        highlightedResidue={highlightedResidue}
        theme={theme}
        height="540px"
        showControls={true}
        allowSearch={true}
        title={
          loadedMeta
            ? `${loadedMeta.id} — ${dataset?.symbol || '3D Structure'}`
            : `${dataset?.symbol || 'TP53'} (${viewerTarget})`
        }
        onLoaded={(meta) => {
          setLoadedMeta(meta);
          if (meta.alphafold) {
            setAfPrediction(meta.alphafold);
          }
        }}
        onResidueClick={(info) => {
          setClickedResidue(info);
          setNewResiduePos(info.resno);
          setHighlightedResidue(info.resno);
        }}
      />

      {/* 3. COMPACT 3D HOTSPOT PINS BAR + EXPANDABLE TOOLS */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold mr-1">
            <Tag className="w-3.5 h-3.5 text-[#76B900]" /> 3D Pins:
          </span>

          {annotations.map((ann) => {
            const isSelected = highlightedResidue === ann.residuePos;
            return (
              <motion.div
                key={ann.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() =>
                  setHighlightedResidue(isSelected ? null : ann.residuePos)
                }
                className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                  isSelected
                    ? 'border-[#76B900] bg-[#76B900]/15 text-white shadow-[0_0_12px_rgba(118,185,0,0.2)]'
                    : isLight
                    ? 'bg-slate-50 border-slate-200 hover:border-[#76B900] text-slate-800'
                    : 'bg-[#0A0B09] border-[#262C22] hover:border-[#76B900]/60 text-slate-300'
                }`}
                title={ann.notes}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: ann.color }}
                />
                <span className="font-bold text-[11px]">{ann.label}</span>
                <span className="text-[10px] text-[#8ED600]">#{ann.residuePos}</span>
                <Focus className="w-3 h-3 text-slate-500" />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                  }}
                  className="text-slate-500 hover:text-rose-400 ml-0.5"
                  title="Remove pin"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            );
          })}

          <button
            type="button"
            onClick={() => setShowAddPinForm((p) => !p)}
            className="px-2.5 py-1.5 rounded-xl border border-dashed border-[#76B900]/50 text-[#8ED600] hover:bg-[#76B900]/10 text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pin Residue</span>
          </button>
        </div>

        {/* Toggle Optional DNA -> Protein Translator */}
        <button
          type="button"
          onClick={() => setShowTranslator((p) => !p)}
          className="px-3 py-1.5 rounded-xl border border-[#262C22] bg-[#0A0B09] hover:border-[#76B900]/50 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition cursor-pointer"
        >
          <ArrowLeftRight className="w-3.5 h-3.5 text-[#76B900]" />
          <span>ORF Codon Translator</span>
          {showTranslator ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expandable Add 3D Pin Form */}
      <AnimatePresence>
        {showAddPinForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddAnnotation}
            className="overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-[#0A0B09] border border-[#262C22] flex flex-wrap items-end gap-3 text-xs font-mono">
              <div className="w-28">
                <label className="text-[10px] block mb-1 text-slate-400">Residue #</label>
                <input
                  type="number"
                  min={1}
                  max={2500}
                  value={newResiduePos}
                  onChange={(e) => setNewResiduePos(parseInt(e.target.value, 10) || 1)}
                  className="w-full rounded-lg px-2.5 py-1.5 bg-[#121610] border border-[#2A3126] text-white focus:outline-none focus:border-[#76B900]"
                />
              </div>
              <div className="w-40">
                <label className="text-[10px] block mb-1 text-slate-400">Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full rounded-lg px-2.5 py-1.5 bg-[#121610] border border-[#2A3126] text-[#8ED600] focus:outline-none focus:border-[#76B900]"
                >
                  <option value="Active Site">Active Site</option>
                  <option value="Hotspot">Mutation Hotspot</option>
                  <option value="Binding Pocket">Binding Pocket</option>
                  <option value="PTM">PTM Site</option>
                </select>
              </div>
              <div className="flex-1 min-w-[180px]">
                <label className="text-[10px] block mb-1 text-slate-400">Marker Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g. Catalytic Dyad / L3 Loop..."
                  className="w-full rounded-lg px-2.5 py-1.5 bg-[#121610] border border-[#2A3126] text-white focus:outline-none focus:border-[#76B900]"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-[#76B900] hover:bg-[#8ED600] text-black font-bold transition cursor-pointer"
              >
                Add Pin
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Expandable DNA -> Protein Translator Drawer */}
      <AnimatePresence>
        {showTranslator && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3.5 rounded-xl bg-[#0A0B09] border border-[#262C22] space-y-2.5 text-xs font-mono">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={dnaInput}
                  onChange={(e) => setDnaInput(e.target.value)}
                  placeholder="Enter DNA coding sequence (ATCG)..."
                  className="flex-1 border rounded-lg px-3 py-1.5 bg-[#121610] border-[#2A3126] focus:border-[#76B900] text-slate-200 focus:outline-none uppercase"
                />
                <button
                  type="button"
                  onClick={() => setTranslatedProtein(translateDnaToProtein(dnaInput, 0))}
                  className="px-4 py-1.5 rounded-lg bg-[#76B900] hover:bg-[#8ED600] text-black font-bold flex items-center justify-center gap-1.5 shrink-0 transition cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Translate DNA → Peptide</span>
                </button>
              </div>
              {translatedProtein && (
                <div className="p-2.5 rounded-lg bg-[#121610] border border-[#2A3126] text-[11px] flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-bold text-[#76B900]">Peptide: </span>
                    <span className="text-white">{translatedProtein}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">
                    {translatedProtein.length} aa
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
};
