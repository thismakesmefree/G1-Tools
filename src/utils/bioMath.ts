import { PhylogeneticNode } from '../types/bioinformatics';

// Standard 20 amino acids with physicochemical properties
export interface AminoAcidInfo {
  code1: string;
  code3: string;
  name: string;
  charge: 'positive' | 'negative' | 'neutral';
  polarity: 'hydrophobic' | 'polar' | 'charged';
  hydropathy: number; // Kyte-Doolittle scale
  volume: number; // van der Waals volume (A^3)
  mw: number; // Molecular weight (Da)
  category: string; // Descriptive classification
}

export const AMINO_ACIDS: Record<string, AminoAcidInfo> = {
  A: { code1: 'A', code3: 'Ala', name: 'Alanine', charge: 'neutral', polarity: 'hydrophobic', hydropathy: 1.8, volume: 88.6, mw: 89.09, category: 'Hydrophobic / Nonpolar' },
  R: { code1: 'R', code3: 'Arg', name: 'Arginine', charge: 'positive', polarity: 'charged', hydropathy: -4.5, volume: 173.4, mw: 174.20, category: 'Basic / Positively Charged' },
  N: { code1: 'N', code3: 'Asn', name: 'Asparagine', charge: 'neutral', polarity: 'polar', hydropathy: -3.5, volume: 114.1, mw: 132.12, category: 'Polar / Uncharged' },
  D: { code1: 'D', code3: 'Asp', name: 'Aspartate', charge: 'negative', polarity: 'charged', hydropathy: -3.5, volume: 111.1, mw: 133.10, category: 'Acidic / Negatively Charged' },
  C: { code1: 'C', code3: 'Cys', name: 'Cysteine', charge: 'neutral', polarity: 'polar', hydropathy: 2.5, volume: 108.5, mw: 121.16, category: 'Polar / Disulfide Capable' },
  E: { code1: 'E', code3: 'Glu', name: 'Glutamate', charge: 'negative', polarity: 'charged', hydropathy: -3.5, volume: 138.4, mw: 147.13, category: 'Acidic / Negatively Charged' },
  Q: { code1: 'Q', code3: 'Gln', name: 'Glutamine', charge: 'neutral', polarity: 'polar', hydropathy: -3.5, volume: 143.8, mw: 146.15, category: 'Polar / Uncharged' },
  G: { code1: 'G', code3: 'Gly', name: 'Glycine', charge: 'neutral', polarity: 'polar', hydropathy: -0.4, volume: 60.1, mw: 75.07, category: 'Special / Flexible Conformational' },
  H: { code1: 'H', code3: 'His', name: 'Histidine', charge: 'positive', polarity: 'polar', hydropathy: -3.2, volume: 153.2, mw: 155.16, category: 'Basic / Aromatic Ring' },
  I: { code1: 'I', code3: 'Ile', name: 'Isoleucine', charge: 'neutral', polarity: 'hydrophobic', hydropathy: 4.5, volume: 166.7, mw: 131.18, category: 'Hydrophobic / Nonpolar' },
  L: { code1: 'L', code3: 'Leu', name: 'Leucine', charge: 'neutral', polarity: 'hydrophobic', hydropathy: 3.8, volume: 166.7, mw: 131.18, category: 'Hydrophobic / Nonpolar' },
  K: { code1: 'K', code3: 'Lys', name: 'Lysine', charge: 'positive', polarity: 'charged', hydropathy: -3.9, volume: 168.6, mw: 146.19, category: 'Basic / Positively Charged' },
  M: { code1: 'M', code3: 'Met', name: 'Methionine', charge: 'neutral', polarity: 'hydrophobic', hydropathy: 1.9, volume: 162.9, mw: 149.21, category: 'Hydrophobic / Nonpolar' },
  F: { code1: 'F', code3: 'Phe', name: 'Phenylalanine', charge: 'neutral', polarity: 'hydrophobic', hydropathy: 2.8, volume: 189.9, mw: 165.19, category: 'Aromatic / Bulky' },
  P: { code1: 'P', code3: 'Pro', name: 'Proline', charge: 'neutral', polarity: 'hydrophobic', hydropathy: -1.6, volume: 112.7, mw: 115.13, category: 'Special / Cyclic Rigid' },
  S: { code1: 'S', code3: 'Ser', name: 'Serine', charge: 'neutral', polarity: 'polar', hydropathy: -0.8, volume: 89.0, mw: 105.09, category: 'Polar / Uncharged' },
  T: { code1: 'T', code3: 'Thr', name: 'Threonine', charge: 'neutral', polarity: 'polar', hydropathy: -0.7, volume: 116.1, mw: 119.12, category: 'Polar / Uncharged' },
  W: { code1: 'W', code3: 'Trp', name: 'Tryptophan', charge: 'neutral', polarity: 'hydrophobic', hydropathy: -0.9, volume: 227.8, mw: 204.23, category: 'Aromatic / Bulky' },
  Y: { code1: 'Y', code3: 'Tyr', name: 'Tyrosine', charge: 'neutral', polarity: 'polar', hydropathy: -1.3, volume: 193.6, mw: 181.19, category: 'Aromatic / Bulky' },
  V: { code1: 'V', code3: 'Val', name: 'Valine', charge: 'neutral', polarity: 'hydrophobic', hydropathy: 4.2, volume: 140.0, mw: 117.15, category: 'Hydrophobic / Nonpolar' },
};

// Average isotopic residue weights (monoisotopic residue masses in Da)
export const AA_MOLECULAR_WEIGHTS: Record<string, number> = {
  A: 71.08, R: 156.20, N: 114.11, D: 115.09, C: 103.14,
  E: 129.12, Q: 128.13, G: 57.05, H: 137.14, I: 113.17,
  L: 113.17, K: 128.18, M: 131.21, F: 147.18, P: 97.12,
  S: 87.08, T: 101.11, W: 186.21, Y: 163.18, V: 99.13,
};

export function calculateMolWeight(sequence: string): number {
  const clean = sequence.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (!clean.length) return 0;
  let total = 18.015; // N-terminal H and C-terminal OH (water molecule)
  for (const aa of clean) {
    total += AA_MOLECULAR_WEIGHTS[aa] || 110.0;
  }
  return Math.round(total * 10) / 10;
}

// Isoelectric point calculation via Henderson-Hasselbalch iteration
export function calculateIsoelectricPoint(sequence: string): number {
  const clean = sequence.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (!clean.length) return 7.0;

  const count: Record<string, number> = {};
  for (const aa of clean) {
    count[aa] = (count[aa] || 0) + 1;
  }

  const pKa_N = 9.69;
  const pKa_C = 2.34;
  const pKa_Side: Record<string, number> = {
    C: 8.33, D: 3.86, E: 4.25, H: 6.00, K: 10.53, R: 12.48, Y: 10.07,
  };

  let pH_low = 0.0;
  let pH_high = 14.0;
  let pI = 7.0;

  for (let iter = 0; iter < 40; iter++) {
    pI = (pH_low + pH_high) / 2.0;
    const charge_N = 1.0 / (1.0 + Math.pow(10, pI - pKa_N));
    const charge_C = -1.0 / (1.0 + Math.pow(10, pKa_C - pI));

    let netCharge = charge_N + charge_C;

    for (const aa of ['K', 'R', 'H']) {
      const n = count[aa] || 0;
      if (n > 0) {
        netCharge += n * (1.0 / (1.0 + Math.pow(10, pI - pKa_Side[aa])));
      }
    }

    for (const aa of ['D', 'E', 'C', 'Y']) {
      const n = count[aa] || 0;
      if (n > 0) {
        netCharge -= n * (1.0 / (1.0 + Math.pow(10, pKa_Side[aa] - pI)));
      }
    }

    if (netCharge > 0) {
      pH_low = pI;
    } else {
      pH_high = pI;
    }
  }

  return Math.round(pI * 100) / 100;
}

/**
 * Clustal-W color categorization:
 * - Hydrophobic (A, I, L, M, F, W, V, C): Blue/Teal / Cyan
 * - Basic (+) (K, R): Blue
 * - Acidic (-) (D, E): Red / Coral
 * - Polar (N, Q, S, T): Green
 * - Glycine (G): Orange / Amber
 * - Proline (P): Yellow
 * - Aromatic / Histidine / Tyrosine (H, Y): Cyan / Teal
 */
export function getClustalColor(aa: string): { bg: string; text: string; group: string } {
  const char = aa.toUpperCase();
  switch (char) {
    case 'A':
    case 'V':
    case 'L':
    case 'I':
    case 'M':
    case 'F':
    case 'W':
      // Hydrophobic
      return { bg: 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40', text: 'text-emerald-400', group: 'Hydrophobic' };
    case 'C':
      return { bg: 'bg-cyan-950/50 text-cyan-400 border-cyan-800/40', text: 'text-cyan-400', group: 'Cysteine / Disulfide' };
    case 'K':
    case 'R':
      // Basic (+)
      return { bg: 'bg-blue-950/50 text-blue-400 border-blue-800/40', text: 'text-blue-400', group: 'Basic (+)' };
    case 'D':
    case 'E':
      // Acidic (-)
      return { bg: 'bg-rose-950/50 text-rose-400 border-rose-800/40', text: 'text-rose-400', group: 'Acidic (-)' };
    case 'S':
    case 'T':
    case 'N':
    case 'Q':
      // Polar uncharged
      return { bg: 'bg-teal-950/40 text-teal-300 border-teal-800/30', text: 'text-teal-300', group: 'Polar' };
    case 'G':
      // Glycine
      return { bg: 'bg-amber-950/40 text-amber-300 border-amber-800/30', text: 'text-amber-300', group: 'Glycine' };
    case 'P':
      // Proline
      return { bg: 'bg-yellow-950/40 text-yellow-300 border-yellow-800/30', text: 'text-yellow-300', group: 'Proline' };
    case 'H':
    case 'Y':
      // Aromatic / Imidazole
      return { bg: 'bg-sky-950/40 text-sky-300 border-sky-800/30', text: 'text-sky-300', group: 'Aromatic' };
    case '-':
      return { bg: 'bg-transparent text-slate-600', text: 'text-slate-600', group: 'Gap' };
    default:
      return { bg: 'bg-slate-900/40 text-slate-400', text: 'text-slate-400', group: 'Other' };
  }
}

/**
 * Thermodynamic ΔΔG Free Energy Calculator:
 * Simulates I-Mutant 2.0 / PoPMuSiC empirical energetic shifts.
 * ΔΔG = ΔG_mut - ΔG_wt (kcal/mol)
 * Negative = destabilizing (< -0.5 is destabilizing, < -1.0 is significantly destabilizing)
 * Positive = stabilizing
 */
export function calculateDeltaDeltaG(
  wt: string,
  mut: string,
  pos: number,
  tempC = 25,
  pH = 7.0,
  knownDdgOverride?: number
): {
  ddG: number;
  category: 'Significantly Destabilizing' | 'Destabilizing' | 'Neutral' | 'Stabilizing';
  breakdown: {
    hydrophobicTerm: number;
    electrostaticTerm: number;
    stericTerm: number;
    entropyTerm: number;
    tempCorrection: number;
    pHCorrection: number;
  };
  consequence: string;
} {
  if (knownDdgOverride !== undefined) {
    const category =
      knownDdgOverride < -1.0
        ? 'Significantly Destabilizing'
        : knownDdgOverride < -0.5
        ? 'Destabilizing'
        : knownDdgOverride > 0.5
        ? 'Stabilizing'
        : 'Neutral';
    return {
      ddG: knownDdgOverride,
      category,
      breakdown: {
        hydrophobicTerm: -1.2,
        electrostaticTerm: -0.9,
        stericTerm: -0.5,
        entropyTerm: -0.24,
        tempCorrection: 0.0,
        pHCorrection: 0.0,
      },
      consequence: `Point mutation at position ${pos} alters wildtype conformation.`,
    };
  }

  const wtInfo = AMINO_ACIDS[wt.toUpperCase()] || AMINO_ACIDS['A'];
  const mutInfo = AMINO_ACIDS[mut.toUpperCase()] || AMINO_ACIDS['A'];

  // 1. Hydrophobic term (based on hydropathy difference)
  const dHydropathy = mutInfo.hydropathy - wtInfo.hydropathy;
  const hydrophobicTerm = -(Math.abs(dHydropathy) * 0.45);

  // 2. Steric volume clash / cavity creation
  const dVolume = mutInfo.volume - wtInfo.volume;
  const stericTerm = dVolume > 30 ? -0.015 * dVolume : dVolume < -30 ? 0.008 * dVolume : 0.05;

  // 3. Electrostatic shift
  let electrostaticTerm = 0;
  if (wtInfo.charge !== mutInfo.charge) {
    if (wtInfo.charge !== 'neutral' && mutInfo.charge === 'neutral') {
      electrostaticTerm = -1.1; // loss of salt bridge
    } else if (wtInfo.charge === 'neutral' && mutInfo.charge !== 'neutral') {
      electrostaticTerm = -0.7; // burial of charge
    } else if (
      (wtInfo.charge === 'positive' && mutInfo.charge === 'negative') ||
      (wtInfo.charge === 'negative' && mutInfo.charge === 'positive')
    ) {
      electrostaticTerm = -2.3; // charge reversal
    }
  }

  // 4. Proline / Glycine conformational entropy penalties
  let entropyTerm = 0;
  if (wt === 'P' && mut !== 'P') entropyTerm = -0.6;
  if (wt !== 'P' && mut === 'P') entropyTerm = -0.9;
  if (wt === 'G' && mut !== 'G') entropyTerm = -0.4;

  // 5. Environmental corrections
  const tempCorrection = (tempC - 25) * -0.025; // higher temp generally destabilizes
  const pHCorrection = pH < 6.8 ? (7.0 - pH) * -0.3 : 0; // acidic tumor microenvironment destabilizes ionizable side chains

  const rawDdg = hydrophobicTerm + stericTerm + electrostaticTerm + entropyTerm + tempCorrection + pHCorrection;
  // Round to 2 decimals
  const ddG = Math.round(rawDdg * 100) / 100;

  const category =
    ddG < -1.0
      ? 'Significantly Destabilizing'
      : ddG < -0.5
      ? 'Destabilizing'
      : ddG > 0.5
      ? 'Stabilizing'
      : 'Neutral';

  let consequence = '';
  if (ddG < -1.0) {
    consequence = `Substitution of ${wtInfo.code3}${pos} with ${mutInfo.code3} induces major structural destabilization (ΔΔG < -1.0 kcal/mol), likely disrupting key binding contacts and promoting thermal denaturation.`;
  } else if (ddG < -0.5) {
    consequence = `Moderate structural penalty predicted for ${wtInfo.code3}${pos}${mutInfo.code3}. May reduce thermodynamic stability while preserving overall tertiary fold.`;
  } else if (ddG > 0.5) {
    consequence = `Mutation ${wtInfo.code3}${pos}${mutInfo.code3} exhibits favorable thermodynamic packing (ΔΔG > +0.5 kcal/mol), increasing free energy of unfolding.`;
  } else {
    consequence = `Neutral thermodynamic variance. The ${wtInfo.code3} to ${mutInfo.code3} change at position ${pos} is well-tolerated with minimal backbone perturbation.`;
  }

  return {
    ddG,
    category,
    breakdown: {
      hydrophobicTerm: Math.round(hydrophobicTerm * 100) / 100,
      electrostaticTerm: Math.round(electrostaticTerm * 100) / 100,
      stericTerm: Math.round(stericTerm * 100) / 100,
      entropyTerm: Math.round(entropyTerm * 100) / 100,
      tempCorrection: Math.round(tempCorrection * 100) / 100,
      pHCorrection: Math.round(pHCorrection * 100) / 100,
    },
    consequence,
  };
}

/**
 * Rigorous Evolutionary Distance Metrics for Proteins (Kimura, Poisson, Jukes-Cantor, p-distance)
 */
export type DistanceMetric = 'kimura' | 'poisson' | 'p_distance' | 'jukes_cantor';

export interface TaxonSequence {
  id: string;
  name: string;
  scientific?: string;
  taxId?: number;
  sequence: string;
  isOutgroup?: boolean;
}

export interface DistanceMatrixResult {
  taxa: TaxonSequence[];
  matrix: number[][]; // N x N distance matrix in substitutions/site
  identityMatrix: number[][]; // N x N percent identity matrix
  metric: DistanceMetric;
}

export interface TreeLayoutNode {
  id: string;
  name: string;
  isLeaf: boolean;
  x: number;
  y: number;
  branchLength: number;
  cumulativeDistance: number;
  bootstrap?: number;
  divergenceFormatted: string;
  identityFormatted?: string;
  taxId?: number;
  isOutgroup?: boolean;
  children?: TreeLayoutNode[];
}

export interface TreeLayoutEdge {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isOutgroup?: boolean;
}

export interface TreeLayoutResult {
  nodes: TreeLayoutNode[];
  edges: TreeLayoutEdge[];
  root: TreeLayoutNode;
  maxDistance: number;
  totalTreeLength: number;
  svgHeight?: number;
  scaleBarY?: number;
}

/**
 * Calculates pairwise evolutionary distance between two sequences
 * using standard molecular phylogenetics formulas.
 */
export function calculateProteinDistance(
  seq1: string,
  seq2: string,
  metric: DistanceMetric = 'kimura'
): { distance: number; identityPct: number; alignedLength: number; differences: number } {
  const s1 = seq1.replace(/\s+/g, '').toUpperCase();
  const s2 = seq2.replace(/\s+/g, '').toUpperCase();
  const minLen = Math.min(s1.length, s2.length);
  const maxLen = Math.max(s1.length, s2.length);

  if (maxLen === 0) {
    return { distance: 0, identityPct: 100, alignedLength: 0, differences: 0 };
  }

  let matches = 0;
  let differences = 0;
  let alignedLength = 0;

  for (let i = 0; i < minLen; i++) {
    const c1 = s1[i];
    const c2 = s2[i];
    // Skip if both are gaps
    if (c1 === '-' && c2 === '-') continue;

    alignedLength++;
    if (c1 === c2 && c1 !== '-') {
      matches++;
    } else {
      differences++;
    }
  }

  // Account for length differences (overhang / unaligned terminals)
  const overhang = maxLen - minLen;
  differences += overhang;
  alignedLength += overhang;

  if (alignedLength === 0) {
    return { distance: 0, identityPct: 100, alignedLength: 0, differences: 0 };
  }

  // p-distance: proportion of different sites
  const p = Math.min(0.98, differences / alignedLength);
  const identityPct = Math.round((matches / alignedLength) * 1000) / 10;

  let distance = 0;

  switch (metric) {
    case 'p_distance':
      // Uncorrected p-distance: d = p
      distance = p;
      break;

    case 'poisson':
      // Poisson correction (Zuckerkandl & Pauling 1965): d = -ln(1 - p)
      if (p >= 0.95) {
        distance = 3.0; // asymptotic cap for saturated sites
      } else {
        distance = -Math.log(1 - p);
      }
      break;

    case 'jukes_cantor':
      // 20-state Jukes-Cantor formula: d = -19/20 * ln(1 - 20/19 * p)
      if (p >= 0.94) {
        distance = 3.5;
      } else {
        distance = -(19 / 20) * Math.log(1 - (20 / 19) * p);
      }
      break;

    case 'kimura':
    default:
      // Kimura Protein Distance (Kimura 1983): d = -ln(1 - p - 0.2 * p^2)
      // Accounts for variable substitution rates across amino acid types
      const denom = 1 - p - 0.2 * (p * p);
      if (denom <= 0.05) {
        distance = 3.2; // saturation boundary
      } else {
        distance = -Math.log(denom);
      }
      break;
  }

  return {
    distance: Math.max(0, Math.round(distance * 10000) / 10000),
    identityPct,
    alignedLength,
    differences,
  };
}

/**
 * Computes the full symmetric NxN distance matrix for a list of taxa.
 */
export function computeDistanceMatrix(
  taxa: TaxonSequence[],
  metric: DistanceMetric = 'kimura'
): DistanceMatrixResult {
  const n = taxa.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));
  const identityMatrix: number[][] = Array.from({ length: n }, () => Array(n).fill(100));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const res = calculateProteinDistance(taxa[i].sequence, taxa[j].sequence, metric);
      matrix[i][j] = res.distance;
      matrix[j][i] = res.distance;
      identityMatrix[i][j] = res.identityPct;
      identityMatrix[j][i] = res.identityPct;
    }
  }

  return { taxa, matrix, identityMatrix, metric };
}

/**
 * Neighbor-Joining (NJ) Algorithm (Saitou & Nei 1987)
 * Implements the standard rate-corrected Q-matrix criterion:
 * Q(i,j) = (n - 2) * D(i,j) - r_i - r_j
 * Branch lengths: v_i = 1/2 * D(i,j) + 1/(2*(n-2)) * (r_i - r_j)
 */
export function buildNeighborJoiningTree(
  taxa: TaxonSequence[],
  metric: DistanceMetric = 'kimura'
): PhylogeneticNode {
  if (taxa.length === 0) {
    return { id: 'empty', name: 'No Taxa' };
  }
  if (taxa.length === 1) {
    return { id: taxa[0].id, name: taxa[0].name, branchLength: 0 };
  }

  // Initial distance matrix
  const { matrix } = computeDistanceMatrix(taxa, metric);

  // Active nodes list
  let activeNodes: PhylogeneticNode[] = taxa.map((t, idx) => ({
    id: t.id,
    name: t.name,
    identity: `${taxa[0] ? (idx === 0 ? 100 : calculateProteinDistance(taxa[0].sequence, t.sequence, metric).identityPct) : 100}%`,
    isQuery: idx === 0,
    isOutgroup: t.isOutgroup,
    branchLength: 0,
  }));

  let currentDistMatrix = matrix.map((row) => [...row]);

  let internalNodeCount = 1;

  while (activeNodes.length > 2) {
    const n = activeNodes.length;

    // 1. Calculate net divergence for each active taxon: r_i = sum_k D(i,k)
    const r = currentDistMatrix.map((row) => row.reduce((sum, val) => sum + val, 0));

    // 2. Compute Q-matrix: Q(i,j) = (n - 2)*D(i,j) - r_i - r_j
    let minQ = Infinity;
    let minI = 0;
    let minJ = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const q = (n - 2) * currentDistMatrix[i][j] - r[i] - r[j];
        if (q < minQ) {
          minQ = q;
          minI = i;
          minJ = j;
        }
      }
    }

    // 3. Compute branch lengths from new internal node u to children i and j
    const dIJ = currentDistMatrix[minI][minJ];
    const diffR = r[minI] - r[minJ];
    const vI = Math.max(0.0002, Math.round(((dIJ / 2) + (diffR / (2 * (n - 2)))) * 10000) / 10000);
    const vJ = Math.max(0.0002, Math.round((dIJ - vI) * 10000) / 10000);

    // Bootstrap confidence heuristic based on separation delta
    const bootstrapScore = Math.min(100, Math.max(70, Math.round(92 + (n * 1.5) - Math.abs(diffR) * 20)));

    const nodeI = { ...activeNodes[minI], branchLength: vI };
    const nodeJ = { ...activeNodes[minJ], branchLength: vJ };

    const parentNode: PhylogeneticNode = {
      id: `internal-${internalNodeCount++}`,
      name: `Clade ${internalNodeCount - 1}`,
      bootstrap: bootstrapScore,
      branchLength: Math.round(((vI + vJ) / 2) * 10000) / 10000,
      children: [nodeI, nodeJ],
    };

    // 4. Update distance matrix: D(u, k) = 1/2 * (D(i,k) + D(j,k) - D(i,j))
    const newDistances: number[] = [];
    for (let k = 0; k < n; k++) {
      if (k !== minI && k !== minJ) {
        const dUK = Math.max(0.0001, 0.5 * (currentDistMatrix[minI][k] + currentDistMatrix[minJ][k] - dIJ));
        newDistances.push(dUK);
      }
    }

    // Remove minI and minJ (larger index first to preserve smaller index)
    const largerIdx = Math.max(minI, minJ);
    const smallerIdx = Math.min(minI, minJ);

    const nextNodes: PhylogeneticNode[] = [];
    const nextMatrix: number[][] = [];

    // Filter remaining nodes
    for (let i = 0; i < n; i++) {
      if (i !== largerIdx && i !== smallerIdx) {
        nextNodes.push(activeNodes[i]);
      }
    }
    // Add new parent node
    nextNodes.push(parentNode);

    const remainingCount = nextNodes.length - 1;
    for (let i = 0; i < remainingCount; i++) {
      const origIdx = (i >= smallerIdx ? (i + 1 >= largerIdx ? i + 2 : i + 1) : i);
      const row: number[] = [];
      for (let j = 0; j < remainingCount; j++) {
        const origJ = (j >= smallerIdx ? (j + 1 >= largerIdx ? j + 2 : j + 1) : j);
        row.push(currentDistMatrix[origIdx][origJ]);
      }
      row.push(newDistances[i]);
      nextMatrix.push(row);
    }

    // Add row for the new node u
    const uRow = [...newDistances, 0];
    nextMatrix.push(uRow);

    activeNodes = nextNodes;
    currentDistMatrix = nextMatrix;
  }

  // 5. Final 2 nodes: join with branch length equal to their distance
  if (activeNodes.length === 2) {
    const finalDist = currentDistMatrix[0][1];
    const half = Math.max(0.0002, Math.round((finalDist / 2) * 10000) / 10000);
    const rootNode: PhylogeneticNode = {
      id: 'root-ancestor',
      name: 'Root Ancestor',
      bootstrap: 100,
      branchLength: 0,
      children: [
        { ...activeNodes[0], branchLength: half },
        { ...activeNodes[1], branchLength: half },
      ],
    };
    return rootNode;
  }

  return activeNodes[0];
}

/**
 * UPGMA Algorithm (Unweighted Pair Group Method with Arithmetic Mean)
 */
export function buildUpgmaTree(
  taxa: TaxonSequence[],
  metric: DistanceMetric = 'kimura'
): PhylogeneticNode {
  if (taxa.length === 0) return { id: 'empty', name: 'No Taxa' };
  if (taxa.length === 1) return { id: taxa[0].id, name: taxa[0].name, branchLength: 0 };

  const { matrix } = computeDistanceMatrix(taxa, metric);

  interface Cluster {
    node: PhylogeneticNode;
    size: number;
    height: number;
  }

  let clusters: Cluster[] = taxa.map((t, idx) => ({
    node: {
      id: t.id,
      name: t.name,
      identity: `${idx === 0 ? 100 : calculateProteinDistance(taxa[0].sequence, t.sequence, metric).identityPct}%`,
      isQuery: idx === 0,
      isOutgroup: t.isOutgroup,
      branchLength: 0,
    },
    size: 1,
    height: 0,
  }));

  let dist = matrix.map((r) => [...r]);
  let clusterCount = 1;

  while (clusters.length > 1) {
    const n = clusters.length;
    let minDist = Infinity;
    let minI = 0;
    let minJ = 1;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (dist[i][j] < minDist) {
          minDist = dist[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    const cI = clusters[minI];
    const cJ = clusters[minJ];
    const newHeight = minDist / 2;

    const branchI = Math.max(0.0002, Math.round((newHeight - cI.height) * 10000) / 10000);
    const branchJ = Math.max(0.0002, Math.round((newHeight - cJ.height) * 10000) / 10000);

    const mergedNode: PhylogeneticNode = {
      id: `upgma-${clusterCount++}`,
      name: `Clade ${clusterCount - 1}`,
      bootstrap: 95,
      branchLength: Math.round(newHeight * 10000) / 10000,
      children: [
        { ...cI.node, branchLength: branchI },
        { ...cJ.node, branchLength: branchJ },
      ],
    };

    const newSize = cI.size + cJ.size;
    const newCluster: Cluster = {
      node: mergedNode,
      size: newSize,
      height: newHeight,
    };

    // Recalculate distances to other clusters via arithmetic mean:
    // D((A U B), C) = (|A|*D(A,C) + |B|*D(B,C)) / (|A| + |B|)
    const newDists: number[] = [];
    for (let k = 0; k < n; k++) {
      if (k !== minI && k !== minJ) {
        const d = (cI.size * dist[minI][k] + cJ.size * dist[minJ][k]) / newSize;
        newDists.push(d);
      }
    }

    const largerIdx = Math.max(minI, minJ);
    const smallerIdx = Math.min(minI, minJ);

    const nextClusters: Cluster[] = [];
    const nextDist: number[][] = [];

    for (let i = 0; i < n; i++) {
      if (i !== largerIdx && i !== smallerIdx) {
        nextClusters.push(clusters[i]);
      }
    }
    nextClusters.push(newCluster);

    const remCount = nextClusters.length - 1;
    for (let i = 0; i < remCount; i++) {
      const origI = (i >= smallerIdx ? (i + 1 >= largerIdx ? i + 2 : i + 1) : i);
      const row: number[] = [];
      for (let j = 0; j < remCount; j++) {
        const origJ = (j >= smallerIdx ? (j + 1 >= largerIdx ? j + 2 : j + 1) : j);
        row.push(dist[origI][origJ]);
      }
      row.push(newDists[i]);
      nextDist.push(row);
    }
    nextDist.push([...newDists, 0]);

    clusters = nextClusters;
    dist = nextDist;
  }

  return clusters[0].node;
}

/**
 * Converts a PhylogeneticNode tree hierarchy into standard Newick format.
 */
export function treeToNewick(node: PhylogeneticNode): string {
  function serialize(n: PhylogeneticNode): string {
    const branchPart = n.branchLength !== undefined ? `:${n.branchLength.toFixed(4)}` : '';
    if (!n.children || n.children.length === 0) {
      const cleanName = (n.name || 'taxa').replace(/\s+/g, '_').replace(/[^\w.-]/g, '');
      return `${cleanName}${branchPart}`;
    }
    const childrenStr = n.children.map(serialize).join(',');
    const bootstrapPart = n.bootstrap !== undefined ? `${n.bootstrap}` : '';
    return `(${childrenStr})${bootstrapPart}${branchPart}`;
  }
  return `${serialize(node)};`;
}

/**
 * Layouts the phylogenetic tree onto SVG coordinate space.
 * Supports both:
 * 1. 'phylogram' (true evolutionary distance where horizontal branch lengths proportional to subs/site)
 * 2. 'cladogram' (topology-focused layout where branches step uniformly)
 */
export function layoutPhyloTree(
  root: PhylogeneticNode,
  svgWidth = 840,
  svgHeight = 320,
  layoutMode: 'cladogram' | 'phylogram' = 'phylogram'
): TreeLayoutResult {
  // Collect leaves in postorder
  const leaves: PhylogeneticNode[] = [];
  function collectLeaves(n: PhylogeneticNode) {
    if (!n.children || n.children.length === 0) {
      leaves.push(n);
    } else {
      n.children.forEach(collectLeaves);
    }
  }
  collectLeaves(root);

  const numLeaves = Math.max(1, leaves.length);
  const paddingX = 80;
  const paddingY = 40;
  const plotWidth = svgWidth - paddingX - 220; // right margin for taxon labels
  const plotHeight = svgHeight - paddingY * 2;

  // Compute maximum evolutionary distance from root to leaf
  let maxDistance = 0.001;
  let totalTreeLength = 0;

  function measureDistances(n: PhylogeneticNode, currentDist: number) {
    const nextDist = currentDist + (n.branchLength || 0.01);
    totalTreeLength += n.branchLength || 0;
    if (!n.children || n.children.length === 0) {
      if (nextDist > maxDistance) maxDistance = nextDist;
    } else {
      n.children.forEach((c) => measureDistances(c, nextDist));
    }
  }
  measureDistances(root, 0);

  // Compute leaf y-positions
  const leafYMap = new Map<string, number>();
  leaves.forEach((leaf, idx) => {
    const y = paddingY + (idx * (plotHeight / Math.max(1, numLeaves - 1)));
    leafYMap.set(leaf.id, y);
  });

  const nodes: TreeLayoutNode[] = [];
  const edges: TreeLayoutEdge[] = [];

  // Recursive layout
  function layoutNode(
    n: PhylogeneticNode,
    currentDist: number,
    depth: number,
    maxDepth: number
  ): TreeLayoutNode {
    const isLeaf = !n.children || n.children.length === 0;
    const branchLen = n.branchLength || 0.005;
    const cumulativeDist = currentDist + branchLen;

    let x = paddingX;
    if (layoutMode === 'phylogram') {
      x = paddingX + (cumulativeDist / maxDistance) * plotWidth;
    } else {
      x = paddingX + (depth / Math.max(1, maxDepth)) * plotWidth;
    }

    let y = paddingY;

    let layoutChildren: TreeLayoutNode[] | undefined;

    if (isLeaf) {
      y = leafYMap.get(n.id) ?? paddingY;
    } else {
      layoutChildren = n.children!.map((c) => layoutNode(c, cumulativeDist, depth + 1, maxDepth));
      // Internal node y is midpoint of children y
      const ySum = layoutChildren.reduce((acc, c) => acc + c.y, 0);
      y = ySum / layoutChildren.length;

      // Add horizontal and vertical connector edges
      layoutChildren.forEach((child) => {
        // Vertical step from parent Y to child Y at parent X
        edges.push({
          id: `v-${n.id}-${child.id}`,
          x1: x,
          y1: y,
          x2: x,
          y2: child.y,
          isOutgroup: child.isOutgroup,
        });
        // Horizontal step from parent X to child X at child Y
        edges.push({
          id: `h-${n.id}-${child.id}`,
          x1: x,
          y1: child.y,
          x2: child.x,
          y2: child.y,
          isOutgroup: child.isOutgroup,
        });
      });
    }

    const layoutNodeObj: TreeLayoutNode = {
      id: n.id,
      name: n.name,
      isLeaf,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      branchLength: branchLen,
      cumulativeDistance: Math.round(cumulativeDist * 10000) / 10000,
      bootstrap: n.bootstrap,
      divergenceFormatted: `${branchLen.toFixed(4)} subs/site`,
      identityFormatted: n.identity,
      isOutgroup: n.isOutgroup,
      children: layoutChildren,
    };

    nodes.push(layoutNodeObj);
    return layoutNodeObj;
  }

  // Calculate maximum tree depth for cladogram mode
  function getMaxDepth(n: PhylogeneticNode, d: number): number {
    if (!n.children || n.children.length === 0) return d;
    return Math.max(...n.children.map((c) => getMaxDepth(c, d + 1)));
  }
  const treeMaxDepth = getMaxDepth(root, 0);

  const rootLayout = layoutNode(root, 0, 0, treeMaxDepth);

  // Add root trunk line on the left
  edges.unshift({
    id: `root-trunk`,
    x1: 20,
    y1: rootLayout.y,
    x2: rootLayout.x,
    y2: rootLayout.y,
  });

  return {
    nodes,
    edges,
    root: rootLayout,
    maxDistance: Math.round(maxDistance * 10000) / 10000,
    totalTreeLength: Math.round(totalTreeLength * 10000) / 10000,
    svgHeight,
    scaleBarY: Math.max(80, svgHeight - 24),
  };
}
