import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  ExternalLink,
  Database,
  Cpu,
  Atom,
  Activity,
  Dna,
  Search,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  ArrowLeftRight,
  FlaskConical,
  Filter,
  Check,
  Award,
} from 'lucide-react';
import { GENETIC_CODE, HUMAN_OPTIMAL_CODONS } from '../utils/translationMath';
import { AMINO_ACIDS } from '../utils/bioMath';

export const KnowledgeHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'algorithms' | 'translation' | 'codons' | 'amino_acids' | 'case_studies' | 'quiz'
  >('algorithms');
  const [searchQuery, setSearchQuery] = useState('');
  const [aminoAcidFilter, setAminoAcidFilter] = useState<'all' | 'hydrophobic' | 'polar' | 'acidic' | 'basic' | 'aromatic'>('all');

  // Quiz state
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const quizQuestions = [
    {
      id: 1,
      question: 'What does an I-Mutant ΔΔG value of -2.84 kcal/mol indicate regarding protein folding stability?',
      options: [
        'The mutation severely stabilizes the fold by creating extra salt bridges',
        'The mutation is severely destabilizing (< -1.0 kcal/mol) and disrupts core structural integrity',
        'The mutation causes zero thermodynamic shift (neutral polymorphism)',
        'The mutation only alters translational elongation speed without affecting folding',
      ],
      correct: 1,
      explanation: 'In thermodynamic stability analysis, ΔΔG = ΔG(mutant) - ΔG(wildtype). Negative values below -1.0 kcal/mol indicate severe destabilization, frequently causing local unfolding or loss of cofactor/DNA coordination.',
    },
    {
      id: 2,
      question: 'In BLAST+ statistical significance, what does an E-value of 1e-178 signify?',
      options: [
        'The match is non-significant noise that should be rejected',
        'There is a 178% probability of sequencing artifact',
        'The expected number of chance alignments with this score in a database of this size is virtually zero (extreme biological homology)',
        'The query sequence has 178 mismatches with the database hit',
      ],
      correct: 2,
      explanation: 'The Expectation value (E) represents the number of distinct alignments with a score equal to or better than S expected by chance. An E-value near 0 (e.g. 1e-178) confirms true evolutionary homology.',
    },
    {
      id: 3,
      question: 'Why does the standard genetic code have 64 codons encoding only 20 standard amino acids?',
      options: [
        'Each amino acid is strictly encoded by exactly 3 unique codons',
        'Codon degeneracy: multiple synonymous codons encode the same amino acid, primarily differing at the 3rd wobble position',
        '44 codons are non-functional junk sequences',
        'The genetic code changes every 1,000 generations through random drift',
      ],
      correct: 1,
      explanation: 'The genetic code is degenerate (redundant). For example, Leucine, Arginine, and Serine are each encoded by 6 different codons. This redundancy buffers coding sequences against deleterious point mutations, particularly at the 3rd nucleotide position (Crick wobble hypothesis).',
    },
    {
      id: 4,
      question: 'In Neighbor-Joining (NJ) phylogenetic cladograms, what does a bootstrap value of 100 on a bifurcation denote?',
      options: [
        'The two species diverged exactly 100 million years ago',
        '100% of pseudo-replicate resampled alignments supported that specific clade grouping',
        'The branch length is 100 nucleotide substitutions per site',
        'There are 100 orthologous gene copies in that organism',
      ],
      correct: 1,
      explanation: 'Felsenstein bootstrap resampling generates 1,000 alignment replicates with replacement. A score of 100/100 means that the clade bifurcation was recovered in 100% of resampled iterations, indicating maximum topological confidence.',
    },
    {
      id: 5,
      question: 'Why does the oncogenic BRAF V600E mutation cause constitutive kinase hyperactivity?',
      options: [
        'Val600 is replaced by acidic Glutamate (E), mimicking phosphorylation in the activation segment',
        'Val600 prevents ATP from entering the catalytic pocket',
        'Val600 causes the entire kinase to degrade in the lysosome',
        'Val600 only occurs in prokaryotes',
      ],
      correct: 0,
      explanation: 'The substitution of neutral Valine with negatively charged Glutamate (V600E) in the activation loop introduces negative charge that mimics regulatory phosphorylation, locking the kinase domain in an active catalytic conformation ~500-fold more active than wild-type.',
    },
    {
      id: 6,
      question: 'When translating an uncharacterized double-stranded DNA molecule, why must all 6 reading frames be checked?',
      options: [
        'Each DNA strand has 3 potential triplet reading frames (offsets 0, 1, 2) across both forward (5\'→3\') and reverse-complement strands',
        'Because cells only use 6-nucleotide codons during mitosis',
        'Because 3 frames are for lipids and 3 frames are for sugars',
        'Only viral genomes require 6 reading frames',
      ],
      correct: 0,
      explanation: 'Because DNA is double-stranded and antiparallel without a priori known transcript orientation, forward frames (+1, +2, +3) and reverse complement frames (-1, -2, -3) each yield distinct protein translations. The longest continuous open reading frame (ORF) without premature stops typically represents the biologically active coding sequence.',
    },
  ];

  // Filtered Codons
  const filteredCodons = useMemo(() => {
    const q = searchQuery.trim().toUpperCase();
    return Object.entries(GENETIC_CODE).filter(([codon, info]) => {
      if (!q) return true;
      return (
        codon.includes(q) ||
        info.aa1.toUpperCase().includes(q) ||
        info.aa3.toUpperCase().includes(q)
      );
    });
  }, [searchQuery]);

  // Filtered Amino Acids
  const filteredAminoAcids = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return Object.entries(AMINO_ACIDS).filter(([code, aa]) => {
      // Category filter
      if (aminoAcidFilter === 'hydrophobic' && aa.category !== 'Hydrophobic / Nonpolar') return false;
      if (aminoAcidFilter === 'polar' && aa.category !== 'Polar / Uncharged') return false;
      if (aminoAcidFilter === 'acidic' && aa.category !== 'Acidic / Negatively Charged') return false;
      if (aminoAcidFilter === 'basic' && aa.category !== 'Basic / Positively Charged') return false;
      if (aminoAcidFilter === 'aromatic' && aa.category !== 'Aromatic / Bulky') return false;

      // Search query
      if (!q) return true;
      return (
        code.toLowerCase().includes(q) ||
        aa.code3.toLowerCase().includes(q) ||
        aa.name.toLowerCase().includes(q) ||
        aa.category.toLowerCase().includes(q)
      );
    });
  }, [aminoAcidFilter, searchQuery]);

  // Score calculation
  const quizScore = useMemo(() => {
    let count = 0;
    quizQuestions.forEach((q) => {
      if (quizAnswers[q.id] === q.correct) count++;
    });
    return count;
  }, [quizAnswers]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Title Header */}
      <div className="bg-[#101524] border border-slate-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
              <span>G1 Tools Computational Genomics Knowledge Hub</span>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                v2.4 Comprehensive Reference
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Theoretical foundations, thermodynamic biophysics, 6-frame translation, and clinical genomic literature
            </p>
          </div>
        </div>

        {/* Global Instant Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search theory, codon, AA, or variant..."
            className="w-full bg-[#080c14] border border-slate-700 focus:border-cyan-500 rounded pl-9 pr-3 py-1.5 text-xs font-mono text-cyan-200 placeholder:text-slate-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800 pb-2 text-xs font-mono">
        {[
          { id: 'algorithms', label: '1. Core Algorithms', icon: Cpu },
          { id: 'translation', label: '2. DNA ⇄ Protein Translation', icon: ArrowLeftRight },
          { id: 'codons', label: '3. Genetic Code & Codons', icon: Dna },
          { id: 'amino_acids', label: '4. 20 Amino Acids Matrix', icon: Atom },
          { id: 'case_studies', label: '5. Clinical Hotspot Studies', icon: ShieldAlert },
          { id: 'quiz', label: '6. Mastery Quiz', icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded transition cursor-pointer ${
                isActive
                  ? 'bg-cyan-600 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Algorithms & Equations */}
      {activeTab === 'algorithms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* BLAST+ */}
            <div className="bg-[#101524] border border-slate-800 hover:border-cyan-500/40 transition-all rounded-lg p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center space-x-2 text-cyan-400 font-semibold">
                <Database className="w-4 h-4" />
                <h3 className="text-sm font-display">Module 1: NCBI BLAST+ (Karlin-Altschul Statistics)</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Basic Local Alignment Search Tool (BLAST+) aligns query residues against sequence libraries using BLOSUM62 scoring matrices. The Expectation value ($E$) is modeled by:
              </p>
              <div className="bg-[#080c14] border border-slate-800 rounded p-3 font-mono text-[11px] text-cyan-300 shadow-inner">
                E = K · m · n · e^(-λ · S)
              </div>
              <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                <li><strong>m:</strong> Effective query sequence length</li>
                <li><strong>n:</strong> Total amino acids in the database</li>
                <li><strong>S:</strong> Raw alignment score computed from BLOSUM62 substitutions and gap costs</li>
                <li><strong>K, λ:</strong> Karlin-Altschul natural scaling constants</li>
              </ul>
            </div>

            {/* Neighbor-Joining Tree */}
            <div className="bg-[#101524] border border-slate-800 hover:border-emerald-500/40 transition-all rounded-lg p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center space-x-2 text-emerald-400 font-semibold">
                <Cpu className="w-4 h-4" />
                <h3 className="text-sm font-display">Module 2: Neighbor-Joining (Saitou & Nei Algorithm)</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                The Neighbor-Joining (NJ) method builds additive phylogenetic trees from evolutionary distance matrices without assuming an ultrametric molecular clock.
              </p>
              <div className="bg-[#080c14] border border-slate-800 rounded p-3 font-mono text-[11px] text-emerald-300 shadow-inner">
                Q(i, j) = (n - 2) · d(i, j) - ∑ d(i, k) - ∑ d(j, k)
              </div>
              <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                <li><strong>Q-matrix:</strong> Determines which pair of taxa ($i, j$) to cluster next</li>
                <li><strong>1,000 Bootstrap Replicates:</strong> Resamples alignment columns with replacement</li>
                <li><strong>Confidence:</strong> Node values &gt; 95% demonstrate decisive topological robustness</li>
              </ul>
            </div>

            {/* Thermodynamic ΔΔG */}
            <div className="bg-[#101524] border border-slate-800 hover:border-purple-500/40 transition-all rounded-lg p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center space-x-2 text-purple-400 font-semibold">
                <Atom className="w-4 h-4" />
                <h3 className="text-sm font-display">Module 3: Protein Free Energy Stability (I-Mutant ΔΔG)</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                Simulates unfolding Gibbs free energy changes caused by single point mutations using Support Vector Machine (SVM-T) biophysical potentials:
              </p>
              <div className="bg-[#080c14] border border-slate-800 rounded p-3 font-mono text-[11px] text-purple-300 shadow-inner">
                ΔΔG = ΔG(mutant) - ΔG(wildtype) [kcal/mol]
              </div>
              <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                <li><strong>ΔΔG &lt; -1.0 kcal/mol:</strong> Severely destabilizing (conformational unfold or loss of function)</li>
                <li><strong>-1.0 to +1.0 kcal/mol:</strong> Neutral or tolerable thermodynamic perturbation</li>
                <li><strong>ΔΔG &gt; +1.0 kcal/mol:</strong> Hyper-stabilizing mutant</li>
              </ul>
            </div>

            {/* GEO2R Limma */}
            <div className="bg-[#101524] border border-slate-800 hover:border-rose-500/40 transition-all rounded-lg p-4 space-y-2.5 shadow-sm">
              <div className="flex items-center space-x-2 text-rose-400 font-semibold">
                <Activity className="w-4 h-4" />
                <h3 className="text-sm font-display">Module 4: NCBI GEO & GEO2R (Limma Empirical Bayes)</h3>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                High-throughput transcriptomic profiling calculates moderated t-statistics and log₂ odds (B-statistic) across clinical neoplasm vs normal cohorts:
              </p>
              <div className="bg-[#080c14] border border-slate-800 rounded p-3 font-mono text-[11px] text-rose-300 shadow-inner">
                B = log(Odds differential expression / non-differential)
              </div>
              <ul className="text-slate-400 text-[11px] space-y-1 list-disc list-inside">
                <li><strong>Benjamini-Hochberg FDR:</strong> Controls false discovery rate across 20,000+ transcripts</li>
                <li><strong>Cutoff Matrix:</strong> |log₂FC| &gt; 1.5 and adjusted $p$ &lt; 0.01</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: DNA ⇄ Protein Translation Theory */}
      {activeTab === 'translation' && (
        <div className="space-y-4 text-xs">
          <div className="bg-[#101524] border border-slate-800 rounded-lg p-5 space-y-3">
            <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Biochemical Translation Mechanics & 6-Frame Reading</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              Protein synthesis converts genetic instructions encoded in mRNA nucleotide triplets into covalently linked amino acid polypeptide chains. In genomic bioinformatics, translating an unannotated nucleotide stream requires evaluating <strong>all six possible reading frames</strong> to identify the functional open reading frame (ORF).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0b101c] border border-slate-800 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Forward Reading Frames (+1, +2, +3)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Reading frames on the forward 5'→3' strand differ by initial nucleotide offset:
              </p>
              <ul className="text-[10px] font-mono text-slate-400 space-y-1">
                <li>• Frame +1: Reads triplets starting at index 0</li>
                <li>• Frame +2: Reads triplets starting at index 1</li>
                <li>• Frame +3: Reads triplets starting at index 2</li>
              </ul>
              <p className="text-[10px] text-slate-500">
                A single nucleotide deletion or insertion shifts the reading frame (+1 → +2), causing catastrophic downstream missense or premature termination.
              </p>
            </div>

            <div className="bg-[#0b101c] border border-slate-800 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-cyan-400 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Reverse Complement Frames (-1, -2, -3)
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Because eukaryotic DNA is antiparallel, the coding strand may reside on the reverse complement:
              </p>
              <ul className="text-[10px] font-mono text-slate-400 space-y-1">
                <li>• 5'-ATGC...-3' complements to 3'-TACG...-5'</li>
                <li>• Reversing yields 5'-...GCAT-3'</li>
                <li>• Evaluated with offsets 0, 1, and 2</li>
              </ul>
              <p className="text-[10px] text-slate-500">
                Enables scanning for genes located on the opposite genomic strand without prior RNA-seq coordinates.
              </p>
            </div>

            <div className="bg-[#0b101c] border border-slate-800 rounded-lg p-4 space-y-2">
              <h4 className="font-bold text-purple-400 text-xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Back-Translation & Codon Optimization
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Converting a protein sequence back into DNA requires resolving codon degeneracy:
              </p>
              <ul className="text-[10px] font-mono text-slate-400 space-y-1">
                <li>• <strong>Human-Optimal:</strong> Selects the most frequent tRNA-matched codon in <em>Homo sapiens</em></li>
                <li>• <strong>IUPAC Degenerate:</strong> Synthesizes ambiguity codes (R, Y, S, W, K, M, N) preserving all possibilities</li>
              </ul>
              <p className="text-[10px] text-slate-500">
                Essential for recombinant expression vector design and primer synthesis.
              </p>
            </div>
          </div>

          <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-2">
            <h4 className="font-bold text-slate-200 text-xs">Standard IUPAC Ambiguity Codes</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 font-mono text-[10px]">
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">R</span>: A or G (Purine)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">Y</span>: C or T (Pyrimidine)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">S</span>: G or C (Strong 3H)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">W</span>: A or T (Weak 2H)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">K</span>: G or T (Keto)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">M</span>: A or C (Amino)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">B</span>: C, G, or T (not A)
              </div>
              <div className="p-1.5 rounded bg-[#080c14] border border-slate-800">
                <span className="text-cyan-400 font-bold">N</span>: Any nucleotide
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Genetic Code & Codons */}
      {activeTab === 'codons' && (
        <div className="space-y-4">
          <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-2">
            <h3 className="font-bold text-slate-100 text-sm">The Universal Genetic Code (64 Triplet Codons)</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sixty-one codons encode the 20 canonical amino acids; three codons (TAA, TAG, TGA) function as translation stop signals. Methionine (ATG) serves as the universal initiation signal. Use the search bar above to filter codons by sequence or amino acid code.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
            {filteredCodons.map(([codon, info]) => {
              const isStart = codon === 'ATG';
              const isStop = info.aa1 === '*';
              const humanOptimal = HUMAN_OPTIMAL_CODONS[info.aa1] === codon;

              return (
                <div
                  key={codon}
                  className={`p-2.5 rounded-lg border text-xs font-mono flex flex-col justify-between transition ${
                    isStart
                      ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                      : isStop
                      ? 'bg-rose-950/40 border-rose-500/60 text-rose-300'
                      : 'bg-[#0b101c] border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold tracking-wider">{codon}</span>
                    {humanOptimal && (
                      <span className="text-[8px] bg-cyan-950 text-cyan-300 px-1 rounded border border-cyan-800" title="Human Optimal Codon">
                        opt
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-cyan-300 font-bold">
                    {info.aa1} <span className="text-[10px] text-slate-400">({info.aa3})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: 20 Amino Acids & Properties */}
      {activeTab === 'amino_acids' && (
        <div className="space-y-4">
          <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-100 text-sm">The 20 Standard Amino Acids: Biophysical Properties</h3>
                <p className="text-xs text-slate-300">
                  Residues categorized by side chain chemistry, charge at physiological pH (7.4), hydropathy index (Kyte-Doolittle), and molecular weights.
                </p>
              </div>

              {/* Filter pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                {[
                  { id: 'all', label: 'All (20)' },
                  { id: 'hydrophobic', label: 'Hydrophobic' },
                  { id: 'polar', label: 'Polar' },
                  { id: 'acidic', label: 'Acidic (-)' },
                  { id: 'basic', label: 'Basic (+)' },
                  { id: 'aromatic', label: 'Aromatic' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setAminoAcidFilter(f.id as any)}
                    className={`px-2.5 py-1 rounded transition border cursor-pointer ${
                      aminoAcidFilter === f.id
                        ? 'bg-cyan-600 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg bg-[#0a0e18]">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#0f1422] text-[10px] uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5">1-Letter</th>
                  <th className="p-2.5">3-Letter</th>
                  <th className="p-2.5">Full Name</th>
                  <th className="p-2.5">Charge (pH 7.4)</th>
                  <th className="p-2.5">Hydropathy</th>
                  <th className="p-2.5">Mol. Wt. (Da)</th>
                  <th className="p-2.5">Side Chain Character</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px] text-slate-300">
                {filteredAminoAcids.map(([code, aa]) => (
                  <tr key={code} className="hover:bg-cyan-950/20 transition">
                    <td className="p-2.5 font-bold text-cyan-400">{code}</td>
                    <td className="p-2.5 text-slate-200">{aa.code3}</td>
                    <td className="p-2.5 text-slate-300 font-sans">{aa.name}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          aa.charge === 'positive'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : aa.charge === 'negative'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {aa.charge}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300">{aa.hydropathy}</td>
                    <td className="p-2.5 text-slate-300">{aa.mw}</td>
                    <td className="p-2.5 text-slate-400 font-sans">{aa.category}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 5: Clinical Hotspot Studies */}
      {activeTab === 'case_studies' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* TP53 R273H */}
            <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-400 text-sm">TP53: R273H & R175H Hotspots</span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                  Oncogenic Driver
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                <strong>R273H:</strong> A classic "contact mutation". Arg273 directly inserts into the minor groove of DNA. When mutated to Histidine, sequence-specific DNA binding affinity drops 100-fold without completely destroying the tertiary β-sandwich fold.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                <strong>R175H:</strong> A classic "structural mutation". Arg175 coordinates the central zinc atom. Mutating Arg175 causes global collapse of the DNA-binding domain and thermodynamic instability (ΔΔG &lt; -3.0 kcal/mol).
              </p>
            </div>

            {/* EGFR T790M */}
            <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-400 text-sm">EGFR: T790M Gatekeeper Mutation</span>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                  Drug Resistance
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                In non-small cell lung carcinoma (NSCLC), the T790M point mutation at the ATP-binding pocket creates steric hindrance that sterically blocks 1st-generation TKIs (Gefitinib, Erlotinib) while simultaneously boosting ATP binding affinity.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Solved by 3rd-generation covalent inhibitors (Osimertinib) that selectively alkylate Cys797.
              </p>
            </div>

            {/* BRAF V600E */}
            <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400 text-sm">BRAF: V600E Kinase Constitutive Activation</span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                  Melanoma & CRC Driver
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Val600 is replaced by negatively charged Glutamate (E), mimicking the regulatory phosphorylation of Thr599/Ser602 in the activation segment. This destabilizes the inactive kinase conformation and renders BRAF constitutively monomer-active without RAS-GTP priming.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Targeted by Vemurafenib/Dabrafenib in combination with MEK inhibitors (Trametinib).
              </p>
            </div>

            {/* KRAS G12D */}
            <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-400 text-sm">KRAS: G12D & G12C GTPase Locking</span>
                <span className="text-[10px] font-mono bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">
                  Constitutive Activation
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Gly12 mutations in KRAS impair intrinsic GTP hydrolysis and block GAP-mediated GTPase acceleration, freezing KRAS in the active, GTP-bound signaling state that continuously fires MAPK/ERK cascades.
              </p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Covalent inhibitors like Sotorasib and Adagrasib specifically trap the inactive GDP-bound state of KRAS G12C.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Bioinformatician Mastery Quiz */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          <div className="bg-[#101524] border border-slate-800 rounded-lg p-4 space-y-1">
            <h3 className="font-bold text-slate-100 text-sm flex items-center justify-between">
              <span>Bioinformatics & Genomics Mastery Self-Assessment</span>
              {quizSubmitted && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              Test your understanding of phylogenetic algorithms, 6-frame translation, thermodynamic ΔΔG values, and sequence statistics.
            </p>
          </div>

          <div className="space-y-4">
            {quizQuestions.map((q) => {
              const selectedOpt = quizAnswers[q.id];
              const isCorrect = selectedOpt === q.correct;

              return (
                <div key={q.id} className="bg-[#0b101c] border border-slate-800 rounded-lg p-4 space-y-3">
                  <div className="text-xs font-semibold text-slate-200">
                    <span className="text-cyan-400 font-mono font-bold mr-2">Q{q.id}.</span>
                    <span>{q.question}</span>
                  </div>

                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => {
                      const isChosen = selectedOpt === oIdx;
                      return (
                        <button
                          key={oIdx}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: oIdx })}
                          className={`w-full text-left p-2.5 rounded text-xs font-sans transition flex items-center justify-between border cursor-pointer ${
                            isChosen
                              ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 font-medium'
                              : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <span>{opt}</span>
                          {isChosen && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && selectedOpt !== undefined && (
                    <div
                      className={`p-3 rounded text-xs ${
                        isCorrect ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300' : 'bg-rose-950/50 border border-rose-800 text-rose-300'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1.5 mb-1">
                        <span>{isCorrect ? '✓ Correct Answer!' : '✗ Incorrect'}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setQuizSubmitted(true)}
                className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs font-mono shadow-[0_0_12px_rgba(6,182,212,0.4)] transition cursor-pointer"
              >
                Submit Answers & Review Explanations
              </button>

              {quizSubmitted && (
                <button
                  onClick={() => {
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 text-xs font-mono hover:bg-slate-700 transition cursor-pointer"
                >
                  Reset Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
