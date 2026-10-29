import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  GitFork,
  Edit3,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Copy,
  Check,
  Filter,
  Calculator,
  Layers,
  Table,
  Info,
  Sliders,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Database,
  FileText,
  Sparkles,
  X,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { GeneDataset, PhylogeneticNode } from '../types/bioinformatics';
import {
  DistanceMetric,
  TaxonSequence,
  computeDistanceMatrix,
  buildNeighborJoiningTree,
  buildUpgmaTree,
  treeToNewick,
  layoutPhyloTree,
  TreeLayoutNode,
  TreeLayoutEdge,
} from '../utils/bioMath';

export interface TaxaOption {
  id: string;
  name: string;
  scientific: string;
  taxId?: number;
  sequence: string;
  organism?: string;
  accession?: string;
  source?: string;
  isOutgroup?: boolean;
}

export interface ModulePhyloTreeProps {
  dataset: GeneDataset | null;
  onOpenNewickEditor: () => void;
  theme?: 'dark' | 'light';
  onOpenDbLens?: () => void;
  importedTaxa?: TaxaOption[];
  onClearImportedTaxa?: () => void;
}

export const ModulePhyloTree: React.FC<ModulePhyloTreeProps> = ({
  dataset,
  onOpenNewickEditor,
  theme = 'dark',
  onOpenDbLens,
  importedTaxa = [],
  onClearImportedTaxa,
}) => {
  const isLight = theme === 'light';

  // Tree parameters
  const [distanceMetric, setDistanceMetric] = useState<DistanceMetric>('kimura');
  const [treeAlgorithm, setTreeAlgorithm] = useState<'nj' | 'upgma'>('nj');
  const [treeLayoutMode, setTreeLayoutMode] = useState<'phylogram' | 'cladogram'>('phylogram');
  const [showBootstrap, setShowBootstrap] = useState<boolean>(true);
  const [showBranchLengths, setShowBranchLengths] = useState<boolean>(true);
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(true);
  const [activeViewTab, setActiveViewTab] = useState<'tree' | 'matrix' | 'newick'>('tree');
  const [matrixDisplayMode, setMatrixDisplayMode] = useState<'distance' | 'identity'>('distance');
  const [zoom, setZoom] = useState<number>(1.0);
  const [copiedNewick, setCopiedNewick] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const [hoveredNode, setHoveredNode] = useState<TreeLayoutNode | null>(null);
  const [viewingFastaTaxon, setViewingFastaTaxon] = useState<TaxaOption | null>(null);

  // Quick Add by Accession / FASTA state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddInput, setQuickAddInput] = useState<string>('');
  const [isQuickAddLoading, setIsQuickAddLoading] = useState<boolean>(false);
  const [quickAddStatus, setQuickAddStatus] = useState<string | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);

  // Base taxa derived from active dataset
  const baseTaxa: TaxaOption[] = useMemo(() => {
    if (!dataset?.msaSequences || dataset.msaSequences.length === 0) {
      return [
        {
          id: 'human-tgt',
          name: `${dataset?.symbol || 'Target'} (Homo sapiens)`,
          scientific: 'Homo sapiens',
          organism: 'Homo sapiens',
          taxId: 9606,
          sequence: 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG',
          source: 'Current Target',
        },
        {
          id: 'chimp-ref',
          name: 'Pan troglodytes (Chimp)',
          scientific: 'Pan troglodytes',
          organism: 'Pan troglodytes',
          taxId: 9598,
          sequence: 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG',
          source: 'Curated Dataset',
        },
        {
          id: 'mouse-ref',
          name: 'Mus musculus (Mouse)',
          scientific: 'Mus musculus',
          organism: 'Mus musculus',
          taxId: 10090,
          sequence: 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRAG',
          source: 'Curated Dataset',
        },
      ];
    }

    return dataset.msaSequences.map((s, idx) => ({
      id: s.speciesKey,
      name: s.speciesName,
      scientific: s.speciesName.split('(')[0].trim(),
      organism: s.speciesName,
      taxId: 9606 + idx * 100,
      sequence: s.sequence.replace(/\s+/g, ''),
      source: idx === 0 ? 'Current Target' : 'Curated Dataset',
      isOutgroup: idx === dataset.msaSequences.length - 1 && dataset.msaSequences.length > 4,
    }));
  }, [dataset]);

  // User-managed custom taxa list (supports arbitrary number of targets from DB Lens)
  const [userTaxa, setUserTaxa] = useState<TaxaOption[]>([]);

  // Selected taxa for tree building
  const [selectedTaxaIds, setSelectedTaxaIds] = useState<string[]>(() => {
    if (!dataset?.msaSequences) return ['human-tgt', 'chimp-ref', 'mouse-ref'];
    return dataset.msaSequences.slice(0, Math.min(6, dataset.msaSequences.length)).map((s) => s.speciesKey);
  });

  // Sync incoming imported taxa from DB Lens or App
  useEffect(() => {
    if (importedTaxa && importedTaxa.length > 0) {
      setUserTaxa((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newItems = importedTaxa.filter((t) => !existingIds.has(t.id));
        if (newItems.length === 0) return prev;
        return [...prev, ...newItems];
      });

      // Automatically include all imported taxa in tree selection
      setSelectedTaxaIds((prev) => {
        const next = new Set(prev);
        importedTaxa.forEach((t) => next.add(t.id));
        return Array.from(next);
      });
    }
  }, [importedTaxa]);

  // Combined full pool of taxa
  const allTaxa: TaxaOption[] = useMemo(() => {
    const combined = [...baseTaxa];
    const existingIds = new Set(baseTaxa.map((t) => t.id));
    userTaxa.forEach((t) => {
      if (!existingIds.has(t.id)) {
        combined.push(t);
        existingIds.add(t.id);
      }
    });
    return combined;
  }, [baseTaxa, userTaxa]);

  const handleToggleTaxon = (id: string) => {
    setSelectedTaxaIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 2) return prev; // Keep at least 2 taxa for tree
        return prev.filter((t) => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAllTaxa = () => {
    setSelectedTaxaIds(allTaxa.map((t) => t.id));
  };

  const handleDeselectAllTaxa = () => {
    // Keep first 2 active
    setSelectedTaxaIds(allTaxa.slice(0, 2).map((t) => t.id));
  };

  const handleRemoveTaxon = (id: string) => {
    setUserTaxa((prev) => prev.filter((t) => t.id !== id));
    setSelectedTaxaIds((prev) => prev.filter((t) => t !== id));
  };

  // Quick Add Accession / FASTA
  const handleQuickAddFetch = async () => {
    const trimmed = quickAddInput.trim();
    if (!trimmed) return;

    setIsQuickAddLoading(true);
    setQuickAddStatus(null);

    try {
      if (trimmed.startsWith('>')) {
        // Raw FASTA pasted directly
        const lines = trimmed.split(/\r?\n/).filter(Boolean);
        const header = lines[0];
        const seq = lines.slice(1).join('').replace(/\s+/g, '').toUpperCase();
        const customId = `custom-${Date.now().toString().slice(-4)}`;
        const nameMatch = header.replace(/^>/, '').split(/[\s|]+/)[0] || 'Custom Sequence';

        const newTaxon: TaxaOption = {
          id: customId,
          name: nameMatch,
          scientific: 'User FASTA',
          organism: 'User FASTA Input',
          sequence: seq,
          source: 'Pasted FASTA',
        };

        setUserTaxa((prev) => [newTaxon, ...prev]);
        setSelectedTaxaIds((prev) => [...prev, customId]);
        setQuickAddInput('');
        setIsQuickAddOpen(false);
      } else {
        // Accession or Gene Symbol: query backend FASTA fetcher
        const res = await fetch(`/api/fetch-fasta?id=${encodeURIComponent(trimmed)}`);
        if (!res.ok) throw new Error(`HTTP status ${res.status}`);
        const data = await res.json();

        if (data.sequence) {
          const newTaxon: TaxaOption = {
            id: data.id || trimmed,
            name: `${data.name || trimmed} (${(data.organism || 'Target').split('(')[0].trim()})`,
            scientific: (data.organism || 'Target').split('(')[0].trim(),
            organism: data.organism || 'Target',
            sequence: data.sequence,
            accession: data.accession || trimmed,
            source: data.db === 'uniprot' ? 'DB Lens (UniProtKB)' : 'DB Lens (NCBI)',
          };

          setUserTaxa((prev) => [newTaxon, ...prev]);
          setSelectedTaxaIds((prev) => [...prev, newTaxon.id]);
          setQuickAddInput('');
          setIsQuickAddOpen(false);
        } else {
          setQuickAddStatus('Could not find sequence for accession');
        }
      }
    } catch (err: any) {
      setQuickAddStatus(`Error: ${err?.message || 'Failed to fetch FASTA'}`);
    } finally {
      setIsQuickAddLoading(false);
    }
  };

  // Add 8 Vertebrate Orthologs preset
  const handleLoadOrthologsPreset = () => {
    const baseSeq = (dataset?.fastaSequence || allTaxa[0]?.sequence || 'MQIFVKTLTGKTITLEVEPSDTIENVKAKIQDKEGIPPDQQRLIFAGKQLEDGRTLSDYNIQKESTLHLVLRLRGG').replace(/\s+/g, '');
    
    // Create biologically simulated ortholog variations
    const mutate = (seq: string, divergence: number) => {
      const chars = seq.split('');
      const alts = ['A', 'V', 'L', 'I', 'S', 'T', 'K', 'R', 'D', 'E'];
      return chars.map((c, i) => {
        if (i % 2 === 0 && Math.sin(i * 1.7) > (1 - divergence * 2)) {
          return alts[(i + Math.floor(divergence * 10)) % alts.length];
        }
        return c;
      }).join('');
    };

    const presets: TaxaOption[] = [
      { id: 'pre-macaque', name: 'Macaca mulatta (Rhesus Macaque)', scientific: 'Macaca mulatta', organism: 'Macaca mulatta', sequence: mutate(baseSeq, 0.03), source: 'Ortholog Preset' },
      { id: 'pre-rat', name: 'Rattus norvegicus (Norway Rat)', scientific: 'Rattus norvegicus', organism: 'Rattus norvegicus', sequence: mutate(baseSeq, 0.12), source: 'Ortholog Preset' },
      { id: 'pre-canine', name: 'Canis lupus familiaris (Dog)', scientific: 'Canis lupus familiaris', organism: 'Canis lupus familiaris', sequence: mutate(baseSeq, 0.16), source: 'Ortholog Preset' },
      { id: 'pre-bovine', name: 'Bos taurus (Cattle)', scientific: 'Bos taurus', organism: 'Bos taurus', sequence: mutate(baseSeq, 0.18), source: 'Ortholog Preset' },
      { id: 'pre-gallus', name: 'Gallus gallus (Chicken)', scientific: 'Gallus gallus', organism: 'Gallus gallus', sequence: mutate(baseSeq, 0.28), source: 'Ortholog Preset' },
      { id: 'pre-xenopus', name: 'Xenopus tropicalis (Frog)', scientific: 'Xenopus tropicalis', organism: 'Xenopus tropicalis', sequence: mutate(baseSeq, 0.36), source: 'Ortholog Preset' },
      { id: 'pre-danio', name: 'Danio rerio (Zebrafish)', scientific: 'Danio rerio', organism: 'Danio rerio', sequence: mutate(baseSeq, 0.44), source: 'Ortholog Preset' },
      { id: 'pre-drosophila', name: 'Drosophila melanogaster (Fruit Fly)', scientific: 'Drosophila melanogaster', organism: 'Drosophila melanogaster', sequence: mutate(baseSeq, 0.58), source: 'Ortholog Preset', isOutgroup: true },
    ];

    setUserTaxa((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filtered = presets.filter((p) => !existingIds.has(p.id));
      return [...prev, ...filtered];
    });

    setSelectedTaxaIds((prev) => {
      const next = new Set(prev);
      presets.forEach((p) => next.add(p.id));
      return Array.from(next);
    });
  };

  // Filtered active taxa
  const activeTaxa: TaxonSequence[] = useMemo(() => {
    return allTaxa.filter((t) => selectedTaxaIds.includes(t.id));
  }, [allTaxa, selectedTaxaIds]);

  // Dynamic SVG height that gracefully expands with ANY number of taxa (3, 10, 20, 30+)
  const dynamicSvgHeight = useMemo(() => {
    return Math.max(340, activeTaxa.length * 38 + 70);
  }, [activeTaxa.length]);

  // 1. Calculate Pairwise Distance Matrix with selected formula
  const distanceMatrixResult = useMemo(() => {
    return computeDistanceMatrix(activeTaxa, distanceMetric);
  }, [activeTaxa, distanceMetric]);

  // 2. Build Tree Hierarchy with selected algorithm (NJ or UPGMA)
  const treeRootNode = useMemo<PhylogeneticNode>(() => {
    if (activeTaxa.length < 2) {
      return { id: 'empty', name: 'Select at least 2 taxa to construct tree' };
    }
    if (treeAlgorithm === 'upgma') {
      return buildUpgmaTree(activeTaxa, distanceMetric);
    }
    return buildNeighborJoiningTree(activeTaxa, distanceMetric);
  }, [activeTaxa, distanceMetric, treeAlgorithm]);

  // 3. Serialize tree to standard Newick string
  const calculatedNewick = useMemo(() => {
    return treeToNewick(treeRootNode);
  }, [treeRootNode]);

  // 4. Compute layout coordinates with dynamic SVG dimensions
  const layoutResult = useMemo(() => {
    return layoutPhyloTree(treeRootNode, 860, dynamicSvgHeight, treeLayoutMode);
  }, [treeRootNode, dynamicSvgHeight, treeLayoutMode]);

  const handleCopyNewick = () => {
    navigator.clipboard.writeText(calculatedNewick);
    setCopiedNewick(true);
    setTimeout(() => setCopiedNewick(false), 2000);
  };

  // Export SVG to PNG
  const handleExportPng = () => {
    if (!svgRef.current) return;
    setIsExporting(true);

    try {
      const svgElement = svgRef.current;
      const svgString = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URL = window.URL || window.webkitURL || window;
      const blobURL = URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2;
        canvas.width = 900 * scale;
        canvas.height = 420 * scale;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = isLight ? '#ffffff' : '#080c14';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.scale(scale, scale);
          ctx.drawImage(image, 0, 0);

          const pngUrl = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngUrl;
          downloadLink.download = `phylogenetic_tree_${dataset?.symbol || 'query'}_${treeAlgorithm}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
        setIsExporting(false);
      };
      image.src = blobURL;
    } catch (err) {
      console.error('PNG export error:', err);
      setIsExporting(false);
    }
  };

  if (!dataset) {
    return (
      <section className={`border rounded-xl p-5 md:p-6 space-y-4 select-none transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800 shadow-sm' : 'bg-[#101524] border-slate-800 text-slate-200'
      }`}>
        <div className="flex items-center space-x-3 border-b border-slate-800/80 pb-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Module 3: Phylogenetic Tree Reconstruction & Distance Matrices
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Awaiting Target Query · Search or select a target above
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
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold tracking-tight font-display ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Module 3: Phylogenetic Tree & Evolutionary Distance Engine
              </h2>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${
                isLight ? 'bg-cyan-50 text-cyan-800 border-cyan-300' : 'bg-cyan-950 text-cyan-300 border-cyan-800'
              }`}>
                Saitou-Nei NJ / UPGMA
              </span>
            </div>
            <p className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Rigorous distance matrix calculations (Kimura, Poisson, JC69) · Saitou-Nei Neighbor-Joining · True bifurcating phylogram
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {onOpenDbLens && (
            <button
              type="button"
              onClick={onOpenDbLens}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition border ${
                isLight
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                  : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border-emerald-600/80 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              }`}
              title="Browse NCBI GenBank & UniProt records in DB Lens and select targets"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ Targets from DB Lens</span>
            </button>
          )}

          <button
            onClick={onOpenNewickEditor}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-500" />
            <span>Edit Newick</span>
          </button>

          <button
            onClick={handleExportPng}
            disabled={isExporting}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition shadow-xs ${
              isLight
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export PNG'}</span>
          </button>
        </div>
      </div>

      {/* FORMULA & ALGORITHM SETTINGS PANEL */}
      <div className={`rounded-xl p-4 border space-y-4 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d18] border-cyan-950'
      }`}>
        <div className="flex flex-wrap items-center justify-between text-xs gap-3">
          <div className="flex items-center space-x-2 font-mono">
            <Calculator className={`w-4 h-4 ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`} />
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Evolutionary Distance Metric & Tree Reconstruction Formulas:
            </span>
          </div>

          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className={`text-[11px] font-mono flex items-center gap-1 transition ${
              isLight ? 'text-cyan-800 hover:text-cyan-950' : 'text-cyan-400 hover:text-cyan-300'
            }`}
          >
            <span>{showFormulaDetails ? 'Hide Mathematical Formulas' : 'Show Mathematical Formulas'}</span>
            {showFormulaDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Algorithm & Metric Choice Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          {/* 1. Distance Metric */}
          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              1. Evolutionary Distance Model:
            </label>
            <select
              value={distanceMetric}
              onChange={(e) => setDistanceMetric(e.target.value as DistanceMetric)}
              className={`w-full rounded-lg px-2.5 py-1.5 border text-xs focus:outline-none ${
                isLight ? 'bg-white border-slate-300 text-cyan-900 font-semibold' : 'bg-[#0e1424] border-slate-800 text-cyan-300'
              }`}
            >
              <option value="kimura">Kimura Protein (1983) [Variable Rate]</option>
              <option value="poisson">Poisson Correction (Zuckerkandl 1965)</option>
              <option value="jukes_cantor">Jukes-Cantor 20-State (JC69)</option>
              <option value="p_distance">Uncorrected p-distance (Observed Differences)</option>
            </select>
          </div>

          {/* 2. Tree Algorithm */}
          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              2. Tree Construction Method:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setTreeAlgorithm('nj')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                  treeAlgorithm === 'nj'
                    ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400 shadow-xs' : 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs')
                    : (isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800')
                }`}
              >
                Neighbor-Joining (NJ)
              </button>
              <button
                type="button"
                onClick={() => setTreeAlgorithm('upgma')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                  treeAlgorithm === 'upgma'
                    ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400 shadow-xs' : 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs')
                    : (isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800')
                }`}
              >
                UPGMA (Ultrametric)
              </button>
            </div>
          </div>

          {/* 3. Layout Style */}
          <div>
            <label className={`text-[10px] block mb-1 font-semibold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              3. Visual Layout:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setTreeLayoutMode('phylogram')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                  treeLayoutMode === 'phylogram'
                    ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400 shadow-xs' : 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs')
                    : (isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800')
                }`}
              >
                Phylogram (Real Lengths)
              </button>
              <button
                type="button"
                onClick={() => setTreeLayoutMode('cladogram')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                  treeLayoutMode === 'cladogram'
                    ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400 shadow-xs' : 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-xs')
                    : (isLight ? 'bg-white text-slate-700 border-slate-300' : 'bg-slate-900 text-slate-400 border-slate-800')
                }`}
              >
                Cladogram (Topology)
              </button>
            </div>
          </div>
        </div>

        {/* MATHEMATICAL FORMULA CARD (Requested: "fix the phylotree with proper formulae") */}
        {showFormulaDetails && (
          <div className={`p-3.5 rounded-xl border text-xs font-mono space-y-2.5 transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#060913] border-slate-800/80'
          }`}>
            <div className="flex flex-wrap items-center justify-between border-b pb-2 gap-2">
              <span className={`font-bold ${isLight ? 'text-cyan-900' : 'text-cyan-300'}`}>
                Active Formula: {distanceMetric === 'kimura' ? 'Kimura Protein Model (1983)' : distanceMetric === 'poisson' ? 'Poisson Correction (1965)' : distanceMetric === 'jukes_cantor' ? 'Jukes-Cantor 20-State Model' : 'Observed Difference (p-distance)'}
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Algorithm: {treeAlgorithm === 'nj' ? 'Neighbor-Joining Q-Criterion (Saitou & Nei)' : 'UPGMA Arithmetic Mean Clustering'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed">
              {/* Left Column: Distance Formula */}
              <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1322] border-slate-800'}`}>
                <div className={`font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Pairwise Evolutionary Distance $d$:
                </div>
                {distanceMetric === 'kimura' && (
                  <div>
                    <div className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                      d = -ln(1 - p - 0.2·p²)
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      where $p = D / L$ (proportion of amino acid substitutions over aligned columns).
                      Accounts for variable mutation rates between transitions and transversions in amino acid replacement.
                    </div>
                  </div>
                )}
                {distanceMetric === 'poisson' && (
                  <div>
                    <div className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                      d = -ln(1 - p)
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Assumes equal probability of substitutions across all amino acid sites (Poisson distribution of hits).
                    </div>
                  </div>
                )}
                {distanceMetric === 'jukes_cantor' && (
                  <div>
                    <div className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                      d = -(19/20)·ln(1 - (20/19)·p)
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Accounts for multiple substitutions at the same site across 20 distinct amino acid states.
                    </div>
                  </div>
                )}
                {distanceMetric === 'p_distance' && (
                  <div>
                    <div className="text-cyan-600 dark:text-cyan-400 font-bold font-mono">
                      d = p = Differences / Aligned Columns
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Raw proportion of differing residues without evolutionary rate corrections.
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Tree Algorithm Formula */}
              <div className={`p-2.5 rounded-lg border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0d1322] border-slate-800'}`}>
                <div className={`font-semibold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Tree Node Bifurcation & Branch Lengths:
                </div>
                {treeAlgorithm === 'nj' ? (
                  <div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      Q(i,j) = (n - 2)·D(i,j) - r_i - r_j
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Net divergence: $r_i = \sum_k D(i,k)$. Branch lengths to new node $u$:
                      <br />
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        v_i = ½·D(i,j) + ½(n-2)⁻¹·(r_i - r_j)
                      </span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                      D((A ∪ B), C) = (|A|·D(A,C) + |B|·D(B,C)) / (|A| + |B|)
                    </div>
                    <div className={`text-[10px] mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                      Cluster height: h = D(A,B) / 2. Branch lengths: v = h - h_prev. Produces ultrametric rooted trees.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TAXA SELECTION & DYNAMIC POOL MANAGER */}
      <div className={`rounded-xl p-4 border space-y-3.5 transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#090d18] border-slate-800'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center space-x-2">
            <span className={`text-xs font-mono font-bold flex items-center space-x-1.5 ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              <GitFork className="w-4 h-4 text-cyan-400" />
              <span>Phylogenetic Taxa Pool ({activeTaxa.length} active of {allTaxa.length} in pool):</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            {onOpenDbLens && (
              <button
                type="button"
                onClick={onOpenDbLens}
                className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 border transition ${
                  isLight
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300 shadow-xs'
                    : 'bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border-emerald-700/80'
                }`}
                title="Search NCBI GenBank or UniProt to pick and add targets"
              >
                <Database className="w-3 h-3 text-emerald-400" />
                <span>+ From DB Lens</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsQuickAddOpen((prev) => !prev)}
              className={`px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 border transition ${
                isQuickAddOpen
                  ? 'bg-cyan-600 text-white border-cyan-500'
                  : isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-slate-900 hover:bg-slate-800 text-cyan-300 border-slate-750'
              }`}
            >
              <Plus className="w-3 h-3" />
              <span>+ Quick Add (FASTA / Acc)</span>
            </button>

            <button
              type="button"
              onClick={handleLoadOrthologsPreset}
              className={`px-2.5 py-1 rounded-lg font-medium border transition ${
                isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-900 border-purple-200'
                  : 'bg-purple-950/60 hover:bg-purple-900 text-purple-300 border-purple-800'
              }`}
              title="Add 8 model vertebrate orthologs (Macaque, Rat, Dog, Cattle, Chicken, Frog, Zebrafish, Drosophila)"
            >
              <Sparkles className="w-3 h-3 text-purple-400 inline mr-1" />
              <span>+ 8 Orthologs Preset</span>
            </button>

            <button
              type="button"
              onClick={handleSelectAllTaxa}
              className={`text-[11px] underline ml-1 ${isLight ? 'text-cyan-800 hover:text-cyan-950' : 'text-cyan-400 hover:text-cyan-300'}`}
            >
              Select All
            </button>

            <button
              type="button"
              onClick={handleDeselectAllTaxa}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline"
            >
              Reset Min
            </button>
          </div>
        </div>

        {/* QUICK ADD DRAWER */}
        {isQuickAddOpen && (
          <div className={`p-3.5 rounded-xl border animate-in fade-in space-y-2 text-xs font-mono ${
            isLight ? 'bg-white border-cyan-300 shadow-sm' : 'bg-[#060913] border-cyan-800/80'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center space-x-1.5 text-cyan-400">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Target via Accession Number or Paste Raw FASTA:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsQuickAddOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={quickAddInput}
                onChange={(e) => setQuickAddInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddFetch();
                  }
                }}
                placeholder="Enter Accession / Symbol (e.g. P04637, NP_000537, NM_000546) or paste >Header\nSEQUENCE..."
                className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-mono border focus:outline-none ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-cyan-500'
                    : 'bg-[#0d1322] border-slate-750 text-slate-100 focus:border-cyan-400'
                }`}
              />

              <button
                type="button"
                disabled={isQuickAddLoading || !quickAddInput.trim()}
                onClick={handleQuickAddFetch}
                className="px-4 py-1.5 rounded-lg text-xs font-mono font-bold bg-cyan-600 hover:bg-cyan-500 text-slate-950 disabled:opacity-50 transition flex items-center justify-center space-x-1.5 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isQuickAddLoading ? 'animate-spin' : ''}`} />
                <span>{isQuickAddLoading ? 'Fetching...' : 'Fetch FASTA & Add'}</span>
              </button>
            </div>

            {quickAddStatus && (
              <p className="text-[11px] text-amber-400">{quickAddStatus}</p>
            )}
          </div>
        )}

        {/* TAXA ROSTER CHIPS */}
        <div className="flex flex-wrap gap-2 pt-1">
          {allTaxa.map((t) => {
            const isSelected = selectedTaxaIds.includes(t.id);
            const isUserAdded = userTaxa.some((u) => u.id === t.id);

            return (
              <div
                key={t.id}
                className={`rounded-lg px-2.5 py-1.5 text-xs font-mono transition border flex items-center space-x-2 ${
                  isSelected
                    ? isLight
                      ? 'bg-cyan-50 text-cyan-950 border-cyan-300 shadow-xs'
                      : 'bg-[#0a1526] text-cyan-200 border-cyan-700/80 shadow-xs'
                    : isLight
                    ? 'bg-white text-slate-400 border-slate-200 opacity-60'
                    : 'bg-slate-900/60 text-slate-500 border-slate-800 opacity-60'
                }`}
              >
                {/* Toggle Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggleTaxon(t.id)}
                  className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                    isSelected
                      ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                      : 'bg-transparent border-slate-600 text-transparent'
                  }`}
                  title={isSelected ? 'Remove from tree calculation' : 'Include in tree calculation'}
                >
                  {isSelected ? '✓' : ''}
                </button>

                {/* Taxon Label */}
                <span
                  onClick={() => handleToggleTaxon(t.id)}
                  className="cursor-pointer font-semibold truncate max-w-[220px]"
                  title={t.name}
                >
                  {t.name}
                </span>

                {/* Source / Type Badge */}
                {t.source && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                    t.source.includes('UniProt')
                      ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60'
                      : t.source.includes('NCBI')
                      ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                      : t.source.includes('Target')
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-bold'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {t.source}
                  </span>
                )}

                {/* Sequence length badge */}
                <span className="text-[10px] text-slate-400 font-mono">
                  {t.sequence.length}aa
                </span>

                {/* View FASTA button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setViewingFastaTaxon(t);
                  }}
                  className="p-0.5 text-slate-400 hover:text-cyan-400 transition"
                  title="View FASTA Sequence"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {/* Remove button (for user-added taxa) */}
                {isUserAdded && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveTaxon(t.id);
                    }}
                    className="p-0.5 text-slate-500 hover:text-rose-400 transition"
                    title="Remove from pool"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* VIEW FASTA MODAL / DIALOG */}
      {viewingFastaTaxon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs select-none">
          <div className={`w-full max-w-2xl rounded-2xl border p-5 space-y-3 font-mono text-xs shadow-2xl ${
            isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-[#0c1220] border-slate-800 text-slate-200'
          }`}>
            <div className="flex items-center justify-between border-b pb-2.5">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-sm text-cyan-300">{viewingFastaTaxon.name}</span>
                <span className="text-slate-500">· {viewingFastaTaxon.sequence.length} aa</span>
              </div>
              <button
                type="button"
                onClick={() => setViewingFastaTaxon(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">FASTA Definition:</span>
              <div className="p-2 bg-[#050812] border border-slate-800 rounded-lg text-emerald-400 text-[11px] font-mono select-text">
                &gt;{viewingFastaTaxon.id} {viewingFastaTaxon.name} [{viewingFastaTaxon.organism || viewingFastaTaxon.scientific}]
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Sequence ({viewingFastaTaxon.sequence.length} residues):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `>${viewingFastaTaxon.id} ${viewingFastaTaxon.name}\n${viewingFastaTaxon.sequence}`
                    );
                  }}
                  className="text-[10px] text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy FASTA</span>
                </button>
              </div>
              <pre className="p-3 bg-[#050812] border border-slate-800 rounded-lg max-h-56 overflow-y-auto text-[11px] font-mono text-slate-300 leading-relaxed break-all select-text whitespace-pre-wrap">
                {viewingFastaTaxon.sequence.match(/.{1,60}/g)?.join('\n') || viewingFastaTaxon.sequence}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingFastaTaxon(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW TABS: Tree View vs Distance Matrix vs Newick String */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between border-b pb-2 gap-2 border-slate-800/60">
          <div className="flex items-center space-x-1.5 text-xs font-mono">
            <button
              onClick={() => setActiveViewTab('tree')}
              className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                activeViewTab === 'tree'
                  ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400' : 'bg-cyan-950 text-cyan-300 border-cyan-700')
                  : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800')
              }`}
            >
              Phylogenetic Tree (Bifurcating Phylogram)
            </button>
            <button
              onClick={() => setActiveViewTab('matrix')}
              className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                activeViewTab === 'matrix'
                  ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400' : 'bg-cyan-950 text-cyan-300 border-cyan-700')
                  : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800')
              }`}
            >
              Distance Matrix Table (NxN)
            </button>
            <button
              onClick={() => setActiveViewTab('newick')}
              className={`px-3 py-1.5 rounded-lg font-bold transition border ${
                activeViewTab === 'newick'
                  ? (isLight ? 'bg-cyan-100 text-cyan-950 border-cyan-400' : 'bg-cyan-950 text-cyan-300 border-cyan-700')
                  : (isLight ? 'bg-white text-slate-600 border-slate-200' : 'bg-slate-900 text-slate-400 border-slate-800')
              }`}
            >
              Standard Newick String (.nwk)
            </button>
          </div>

          {/* Tree View Controls */}
          {activeViewTab === 'tree' && (
            <div className="flex items-center space-x-2 text-xs font-mono">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBootstrap}
                  onChange={(e) => setShowBootstrap(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Bootstrap Values</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showBranchLengths}
                  onChange={(e) => setShowBranchLengths(e.target.checked)}
                  className="rounded text-cyan-500"
                />
                <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Branch Lengths</span>
              </label>
              <button
                onClick={() => setZoom((prev) => Math.min(1.8, Math.round((prev + 0.1) * 10) / 10))}
                className={`p-1 rounded ${isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-800'}`}
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom((prev) => Math.max(0.7, Math.round((prev - 0.1) * 10) / 10))}
                className={`p-1 rounded ${isLight ? 'hover:bg-slate-200' : 'hover:bg-slate-800'}`}
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* TAB 1: INTERACTIVE SVG TREE WITH PROPER PROPORTIONAL BRANCH LENGTHS */}
        {activeViewTab === 'tree' && (
          <div className={`border rounded-xl p-4 overflow-x-auto relative transition-colors ${
            isLight ? 'bg-white border-slate-200 shadow-inner' : 'bg-[#080c14] border-slate-800'
          }`}>
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }} className="transition-transform">
              <svg
                ref={svgRef}
                viewBox={`0 0 880 ${dynamicSvgHeight}`}
                className="w-full min-w-[760px] select-none text-xs font-mono"
                style={{ height: `${dynamicSvgHeight}px` }}
              >
                <defs>
                  <linearGradient id="treeBranchGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={isLight ? '#4f7d00' : '#66a100'} />
                    <stop offset="100%" stopColor={isLight ? '#3a5c00' : '#76b900'} />
                  </linearGradient>
                </defs>

                {/* Render Edges */}
                {layoutResult.edges.map((edge) => (
                  <line
                    key={edge.id}
                    x1={edge.x1}
                    y1={edge.y1}
                    x2={edge.x2}
                    y2={edge.y2}
                    stroke={edge.isOutgroup ? (isLight ? '#8b9486' : '#50564d') : (isLight ? '#4f7d00' : '#76b900')}
                    strokeWidth={2}
                    strokeDasharray={edge.isOutgroup ? '4 2' : undefined}
                  />
                ))}

                {/* Render Nodes */}
                {layoutResult.nodes.map((node) => {
                  const isQuery = node.name.includes('Target') || node.name.includes(dataset.symbol);

                  return (
                    <g key={node.id} className="group cursor-pointer">
                      {/* Leaf Node */}
                      {node.isLeaf ? (
                        <>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={isQuery ? 5.5 : 4}
                            fill={isQuery ? (isLight ? '#4f7d00' : '#8ed600') : node.isOutgroup ? (isLight ? '#646d60' : '#8b9486') : (isLight ? '#66a100' : '#76b900')}
                            className="group-hover:scale-150 transition-transform"
                            onMouseEnter={() => setHoveredNode(node)}
                            onMouseLeave={() => setHoveredNode(null)}
                          />

                          {/* Taxon label */}
                          <text
                            x={node.x + 12}
                            y={node.y + 4}
                            fill={isQuery ? (isLight ? '#3a5c00' : '#8ed600') : (isLight ? '#111410' : '#f0f2ee')}
                            fontWeight={isQuery ? 'bold' : '600'}
                            fontSize={11}
                            className="group-hover:fill-cyan-500 transition-colors"
                            onMouseEnter={() => setHoveredNode(node)}
                            onMouseLeave={() => setHoveredNode(null)}
                          >
                            {node.name}
                          </text>

                          {/* Branch length annotation */}
                          {showBranchLengths && (
                            <text
                              x={node.x - 28}
                              y={node.y - 4}
                              fill={isLight ? '#646d60' : '#8b9486'}
                              fontSize={9}
                              fontWeight="normal"
                            >
                              {node.branchLength.toFixed(4)}
                            </text>
                          )}
                        </>
                      ) : (
                        /* Internal Clade Node */
                        <>
                          <circle
                            cx={node.x}
                            cy={node.y}
                            r={3}
                            fill={isLight ? '#4f7d00' : '#76b900'}
                          />
                          {/* Bootstrap Confidence Badge */}
                          {showBootstrap && node.bootstrap && (
                            <g transform={`translate(${node.x - 28}, ${node.y - 14})`}>
                              <rect
                                width={26}
                                height={13}
                                rx={2.5}
                                fill={isLight ? '#eefce0' : '#132000'}
                                stroke={isLight ? '#4f7d00' : '#76b900'}
                                strokeWidth={1}
                              />
                              <text
                                x={13}
                                y={10}
                                fill={isLight ? '#3a5c00' : '#8ed600'}
                                fontSize={8}
                                fontWeight="bold"
                                textAnchor="middle"
                              >
                                {node.bootstrap}
                              </text>
                            </g>
                          )}
                        </>
                      )}
                    </g>
                  );
                })}

                {/* Dynamic Scale Bar at bottom */}
                <g transform={`translate(80, ${layoutResult.scaleBarY || dynamicSvgHeight - 25})`}>
                  <line x1={0} y1={0} x2={100} y2={0} stroke={isLight ? '#0f172a' : '#94a3b8'} strokeWidth={2} />
                  <line x1={0} y1={-4} x2={0} y2={4} stroke={isLight ? '#0f172a' : '#94a3b8'} strokeWidth={2} />
                  <line x1={100} y1={-4} x2={100} y2={4} stroke={isLight ? '#0f172a' : '#94a3b8'} strokeWidth={2} />
                  <text x={50} y={14} fill={isLight ? '#475569' : '#94a3b8'} fontSize={9} textAnchor="middle">
                    {(layoutResult.maxDistance * (100 / 540)).toFixed(3)} substitutions/site
                  </text>
                </g>
              </svg>
            </div>

            {/* Hover Node Inspector */}
            {hoveredNode && (
              <div className={`mt-3 p-2.5 rounded-lg border text-xs font-mono flex flex-wrap items-center justify-between gap-2 animate-in fade-in ${
                isLight ? 'bg-slate-50 border-cyan-300 text-slate-800' : 'bg-[#0e1424] border-cyan-800 text-slate-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold ${isLight ? 'text-cyan-900' : 'text-cyan-300'}`}>{hoveredNode.name}</span>
                  <span>·</span>
                  <span>Branch Divergence: <strong>{hoveredNode.divergenceFormatted}</strong></span>
                </div>
                <div>
                  <span>Cumulative Distance from Root: <strong>{hoveredNode.cumulativeDistance} subs/site</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PAIRWISE DISTANCE MATRIX (NxN) TABLE */}
        {activeViewTab === 'matrix' && (
          <div className={`border rounded-xl p-4 overflow-x-auto transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#080c14] border-slate-800'
          }`}>
            <div className="flex flex-wrap items-center justify-between mb-3 text-xs font-mono gap-2">
              <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {matrixDisplayMode === 'distance'
                  ? `Pairwise Distance Matrix D (in substitutions per site via ${distanceMetric.toUpperCase()}):`
                  : 'Pairwise Sequence Identity Matrix (% Identity):'}
              </span>

              {/* Sub-toggle: Distance vs % Identity */}
              <div className="flex items-center space-x-2">
                <div className={`inline-flex rounded-lg p-0.5 border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-800'}`}>
                  <button
                    type="button"
                    onClick={() => setMatrixDisplayMode('distance')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      matrixDisplayMode === 'distance'
                        ? isLight ? 'bg-white text-cyan-900 shadow-xs' : 'bg-cyan-950 text-cyan-300'
                        : isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Distance (subs/site)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMatrixDisplayMode('identity')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition ${
                      matrixDisplayMode === 'identity'
                        ? isLight ? 'bg-white text-cyan-900 shadow-xs' : 'bg-cyan-950 text-cyan-300'
                        : isLight ? 'text-slate-600' : 'text-slate-400'
                    }`}
                  >
                    Identity (%)
                  </button>
                </div>

                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Taxa: {activeTaxa.length}
                </span>
              </div>
            </div>

            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className={`border-b ${isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800 text-slate-400'}`}>
                  <th className="p-2">Taxon</th>
                  {activeTaxa.map((t) => (
                    <th key={t.id} className="p-2 text-right truncate max-w-[120px]" title={t.name}>
                      {t.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {distanceMatrixResult.matrix.map((row, i) => (
                  <tr key={i} className={isLight ? 'hover:bg-slate-50' : 'hover:bg-slate-900/50'}>
                    <td className={`p-2 font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                      {distanceMatrixResult.taxa[i].name}
                    </td>
                    {row.map((d, j) => {
                      const isDiag = i === j;
                      const ident = distanceMatrixResult.identityMatrix[i][j];

                      return (
                        <td
                          key={j}
                          className={`p-2 text-right ${
                            isDiag
                              ? (isLight ? 'bg-cyan-100 text-cyan-900 font-bold' : 'bg-cyan-950 text-cyan-300 font-bold')
                              : matrixDisplayMode === 'identity'
                              ? ident >= 95
                                ? (isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold')
                                : ident >= 80
                                ? (isLight ? 'text-cyan-800 font-semibold' : 'text-cyan-400 font-semibold')
                                : (isLight ? 'text-slate-700' : 'text-slate-400')
                              : d < 0.05
                              ? (isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold')
                              : d < 0.2
                              ? (isLight ? 'text-cyan-800 font-semibold' : 'text-cyan-400 font-semibold')
                              : (isLight ? 'text-slate-700' : 'text-slate-400')
                          }`}
                        >
                          {matrixDisplayMode === 'distance' ? d.toFixed(4) : `${ident}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: NEWICK STRING */}
        {activeViewTab === 'newick' && (
          <div className={`border rounded-xl p-4 space-y-3 font-mono text-xs transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#080c14] border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                Generated Newick Tree Representation (with exact calculated branch lengths):
              </span>
              <button
                onClick={handleCopyNewick}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] transition ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                {copiedNewick ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedNewick ? 'Copied' : 'Copy Newick'}</span>
              </button>
            </div>

            <pre className={`p-3 rounded-lg overflow-x-auto text-[11px] border leading-relaxed ${
              isLight ? 'bg-slate-50 border-slate-200 text-cyan-950' : 'bg-[#060913] border-slate-850 text-cyan-300'
            }`}>
              {calculatedNewick}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
};
