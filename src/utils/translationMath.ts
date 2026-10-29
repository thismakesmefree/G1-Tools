// Standard Genetic Code & Codon Translation Tables

export interface CodonTranslation {
  codon: string;
  aa1: string;
  aa3: string;
  name: string;
}

export const GENETIC_CODE: Record<string, { aa1: string; aa3: string; name: string }> = {
  // Phenylalanine
  TTT: { aa1: 'F', aa3: 'Phe', name: 'Phenylalanine' },
  TTC: { aa1: 'F', aa3: 'Phe', name: 'Phenylalanine' },
  // Leucine
  TTA: { aa1: 'L', aa3: 'Leu', name: 'Leucine' },
  TTG: { aa1: 'L', aa3: 'Leu', name: 'Leucine' },
  CTT: { aa1: 'L', aa3: 'Leu', name: 'Leucine' },
  CTC: { aa1: 'L', aa3: 'Leu', name: 'Leucine' },
  CTA: { aa1: 'L', aa3: 'Leu', name: 'Leucine' },
  CTG: { aa1: 'L', aa3: 'Leu', name: 'Leucine' },
  // Isoleucine
  ATT: { aa1: 'I', aa3: 'Ile', name: 'Isoleucine' },
  ATC: { aa1: 'I', aa3: 'Ile', name: 'Isoleucine' },
  ATA: { aa1: 'I', aa3: 'Ile', name: 'Isoleucine' },
  // Methionine (Start)
  ATG: { aa1: 'M', aa3: 'Met', name: 'Methionine (Start)' },
  // Valine
  GTT: { aa1: 'V', aa3: 'Val', name: 'Valine' },
  GTC: { aa1: 'V', aa3: 'Val', name: 'Valine' },
  GTA: { aa1: 'V', aa3: 'Val', name: 'Valine' },
  GTG: { aa1: 'V', aa3: 'Val', name: 'Valine' },
  // Serine
  TCT: { aa1: 'S', aa3: 'Ser', name: 'Serine' },
  TCC: { aa1: 'S', aa3: 'Ser', name: 'Serine' },
  TCA: { aa1: 'S', aa3: 'Ser', name: 'Serine' },
  TCG: { aa1: 'S', aa3: 'Ser', name: 'Serine' },
  AGT: { aa1: 'S', aa3: 'Ser', name: 'Serine' },
  AGC: { aa1: 'S', aa3: 'Ser', name: 'Serine' },
  // Proline
  CCT: { aa1: 'P', aa3: 'Pro', name: 'Proline' },
  CCC: { aa1: 'P', aa3: 'Pro', name: 'Proline' },
  CCA: { aa1: 'P', aa3: 'Pro', name: 'Proline' },
  CCG: { aa1: 'P', aa3: 'Pro', name: 'Proline' },
  // Threonine
  ACT: { aa1: 'T', aa3: 'Thr', name: 'Threonine' },
  ACC: { aa1: 'T', aa3: 'Thr', name: 'Threonine' },
  ACA: { aa1: 'T', aa3: 'Thr', name: 'Threonine' },
  ACG: { aa1: 'T', aa3: 'Thr', name: 'Threonine' },
  // Alanine
  GCT: { aa1: 'A', aa3: 'Ala', name: 'Alanine' },
  GCC: { aa1: 'A', aa3: 'Ala', name: 'Alanine' },
  GCA: { aa1: 'A', aa3: 'Ala', name: 'Alanine' },
  GCG: { aa1: 'A', aa3: 'Ala', name: 'Alanine' },
  // Tyrosine
  TAT: { aa1: 'Y', aa3: 'Tyr', name: 'Tyrosine' },
  TAC: { aa1: 'Y', aa3: 'Tyr', name: 'Tyrosine' },
  // Stop Codons
  TAA: { aa1: '*', aa3: 'Stop', name: 'Stop (Ochre)' },
  TAG: { aa1: '*', aa3: 'Stop', name: 'Stop (Amber)' },
  TGA: { aa1: '*', aa3: 'Stop', name: 'Stop (Opal)' },
  // Histidine
  CAT: { aa1: 'H', aa3: 'His', name: 'Histidine' },
  CAC: { aa1: 'H', aa3: 'His', name: 'Histidine' },
  // Glutamine
  CAA: { aa1: 'Q', aa3: 'Gln', name: 'Glutamine' },
  CAG: { aa1: 'Q', aa3: 'Gln', name: 'Glutamine' },
  // Asparagine
  AAT: { aa1: 'N', aa3: 'Asn', name: 'Asparagine' },
  AAC: { aa1: 'N', aa3: 'Asn', name: 'Asparagine' },
  // Lysine
  AAA: { aa1: 'K', aa3: 'Lys', name: 'Lysine' },
  AAG: { aa1: 'K', aa3: 'Lys', name: 'Lysine' },
  // Aspartic Acid
  GAT: { aa1: 'D', aa3: 'Asp', name: 'Aspartic Acid' },
  GAC: { aa1: 'D', aa3: 'Asp', name: 'Aspartic Acid' },
  // Glutamic Acid
  GAA: { aa1: 'E', aa3: 'Glu', name: 'Glutamic Acid' },
  GAG: { aa1: 'E', aa3: 'Glu', name: 'Glutamic Acid' },
  // Cysteine
  TGT: { aa1: 'C', aa3: 'Cys', name: 'Cysteine' },
  TGC: { aa1: 'C', aa3: 'Cys', name: 'Cysteine' },
  // Tryptophan
  TGG: { aa1: 'W', aa3: 'Trp', name: 'Tryptophan' },
  // Arginine
  CGT: { aa1: 'R', aa3: 'Arg', name: 'Arginine' },
  CGC: { aa1: 'R', aa3: 'Arg', name: 'Arginine' },
  CGA: { aa1: 'R', aa3: 'Arg', name: 'Arginine' },
  CGG: { aa1: 'R', aa3: 'Arg', name: 'Arginine' },
  AGA: { aa1: 'R', aa3: 'Arg', name: 'Arginine' },
  AGG: { aa1: 'R', aa3: 'Arg', name: 'Arginine' },
  // Glycine
  GGT: { aa1: 'G', aa3: 'Gly', name: 'Glycine' },
  GGC: { aa1: 'G', aa3: 'Gly', name: 'Glycine' },
  GGA: { aa1: 'G', aa3: 'Gly', name: 'Glycine' },
  GGG: { aa1: 'G', aa3: 'Gly', name: 'Glycine' },
};

// Common human codon optimization frequency table (highest frequency codon per amino acid in Homo sapiens)
export const HUMAN_OPTIMAL_CODONS: Record<string, string> = {
  A: 'GCC', // Alanine (40%)
  R: 'CGC', // Arginine (19%)
  N: 'AAC', // Asparagine (53%)
  D: 'GAC', // Aspartate (54%)
  C: 'TGC', // Cysteine (55%)
  E: 'GAG', // Glutamate (58%)
  Q: 'CAG', // Glutamine (75%)
  G: 'GGC', // Glycine (34%)
  H: 'CAC', // Histidine (58%)
  I: 'ATC', // Isoleucine (48%)
  L: 'CTG', // Leucine (40%)
  K: 'AAG', // Lysine (58%)
  M: 'ATG', // Methionine (100%)
  F: 'TTC', // Phenylalanine (55%)
  P: 'CCC', // Proline (33%)
  S: 'AGC', // Serine (24%)
  T: 'ACC', // Threonine (36%)
  W: 'TGG', // Tryptophan (100%)
  Y: 'TAC', // Tyrosine (57%)
  V: 'GTG', // Valine (47%)
  '*': 'TGA', // Stop (52%)
};

// Degenerate IUPAC reverse translation codons
export const IUPAC_DEGENERATE_CODONS: Record<string, string> = {
  A: 'GCN',
  R: 'MGN',
  N: 'AAY',
  D: 'GAY',
  C: 'TGY',
  E: 'GAR',
  Q: 'CAR',
  G: 'GGN',
  H: 'CAY',
  I: 'ATH',
  L: 'YTN',
  K: 'AAR',
  M: 'ATG',
  F: 'TTY',
  P: 'CCN',
  S: 'WSN',
  T: 'ACN',
  W: 'TGG',
  Y: 'TAY',
  V: 'GTN',
  '*': 'TRR',
};

// Helper: Calculate reverse complement of DNA sequence
export function getReverseComplement(dna: string): string {
  const complementMap: Record<string, string> = {
    A: 'T',
    T: 'A',
    U: 'A',
    C: 'G',
    G: 'C',
    N: 'N',
    R: 'Y',
    Y: 'R',
    S: 'S',
    W: 'W',
    K: 'M',
    M: 'K',
    B: 'V',
    V: 'B',
    D: 'H',
    H: 'D',
  };

  const clean = dna.toUpperCase().replace(/\s+/g, '');
  return clean
    .split('')
    .reverse()
    .map((c) => complementMap[c] || 'N')
    .join('');
}

// Translate DNA sequence into protein in a specific reading frame (1, 2, or 3)
export function translateDnaToProtein(
  dna: string,
  frame: 1 | 2 | 3 = 1,
  stopChar: string = '*'
): {
  proteinSeq: string;
  codons: { codon: string; aa: string; pos: number }[];
  startCodonPositions: number[];
  stopCodonPositions: number[];
} {
  const cleanDna = dna.toUpperCase().replace(/[^ATCGU]/g, '').replace(/U/g, 'T');
  const offset = frame - 1;
  const codons: { codon: string; aa: string; pos: number }[] = [];
  const startCodonPositions: number[] = [];
  const stopCodonPositions: number[] = [];
  let proteinSeq = '';

  for (let i = offset; i + 3 <= cleanDna.length; i += 3) {
    const codon = cleanDna.slice(i, i + 3);
    const info = GENETIC_CODE[codon];
    const aa = info ? (info.aa1 === '*' ? stopChar : info.aa1) : 'X';
    const aaIndex = codons.length + 1;

    codons.push({ codon, aa, pos: aaIndex });
    proteinSeq += aa;

    if (codon === 'ATG') startCodonPositions.push(aaIndex);
    if (aa === stopChar) stopCodonPositions.push(aaIndex);
  }

  return {
    proteinSeq,
    codons,
    startCodonPositions,
    stopCodonPositions,
  };
}

// 6-Frame translation (Frames +1, +2, +3 and Frames -1, -2, -3)
export interface SixFrameTranslationResult {
  forward1: string;
  forward2: string;
  forward3: string;
  reverse1: string;
  reverse2: string;
  reverse3: string;
  longestOrf: {
    frame: string;
    protein: string;
    startDnaPos: number;
    lengthAa: number;
  } | null;
}

export function translateSixFrames(dna: string): SixFrameTranslationResult {
  const cleanDna = dna.toUpperCase().replace(/[^ATCGU]/g, '').replace(/U/g, 'T');
  const revComp = getReverseComplement(cleanDna);

  const f1 = translateDnaToProtein(cleanDna, 1).proteinSeq;
  const f2 = translateDnaToProtein(cleanDna, 2).proteinSeq;
  const f3 = translateDnaToProtein(cleanDna, 3).proteinSeq;

  const r1 = translateDnaToProtein(revComp, 1).proteinSeq;
  const r2 = translateDnaToProtein(revComp, 2).proteinSeq;
  const r3 = translateDnaToProtein(revComp, 3).proteinSeq;

  // Simple ORF detection (between M and *)
  const frames = [
    { name: '+1', seq: f1 },
    { name: '+2', seq: f2 },
    { name: '+3', seq: f3 },
    { name: '-1', seq: r1 },
    { name: '-2', seq: r2 },
    { name: '-3', seq: r3 },
  ];

  let longestOrf: SixFrameTranslationResult['longestOrf'] = null;

  for (const fr of frames) {
    const matches = fr.seq.match(/M[^*]*(\*|$)/g);
    if (matches) {
      for (const m of matches) {
        const cleanM = m.replace(/\*$/, '');
        if (!longestOrf || cleanM.length > longestOrf.lengthAa) {
          longestOrf = {
            frame: fr.name,
            protein: cleanM,
            startDnaPos: fr.seq.indexOf(cleanM) * 3 + 1,
            lengthAa: cleanM.length,
          };
        }
      }
    }
  }

  return {
    forward1: f1,
    forward2: f2,
    forward3: f3,
    reverse1: r1,
    reverse2: r2,
    reverse3: r3,
    longestOrf,
  };
}

// Back-translation (Protein -> Nucleotide DNA)
export function reverseTranslateProtein(
  protein: string,
  mode: 'human_optimal' | 'degenerate' = 'human_optimal'
): {
  dnaSeq: string;
  gcContent: number;
  lengthNt: number;
  breakdown: { aa: string; codon: string }[];
} {
  const cleanProt = protein.toUpperCase().replace(/[^A-Z*]/g, '');
  const breakdown: { aa: string; codon: string }[] = [];
  let dnaSeq = '';
  let gcCount = 0;

  for (const aa of cleanProt) {
    const codon =
      mode === 'human_optimal'
        ? HUMAN_OPTIMAL_CODONS[aa] || 'NNN'
        : IUPAC_DEGENERATE_CODONS[aa] || 'NNN';

    breakdown.push({ aa, codon });
    dnaSeq += codon;

    for (const char of codon) {
      if (char === 'G' || char === 'C') gcCount++;
    }
  }

  const lengthNt = dnaSeq.length;
  const gcContent = lengthNt > 0 ? Math.round((gcCount / lengthNt) * 1000) / 10 : 0;

  return {
    dnaSeq,
    gcContent,
    lengthNt,
    breakdown,
  };
}

// Calculate GC content and base counts
export function calculateNucleotideMetrics(dna: string): {
  gcPercent: number;
  length: number;
  counts: { a: number; t: number; g: number; c: number; other: number };
} {
  const clean = dna.toUpperCase().replace(/\s+/g, '');
  let a = 0;
  let t = 0;
  let g = 0;
  let c = 0;
  let other = 0;

  for (const ch of clean) {
    if (ch === 'A') a++;
    else if (ch === 'T' || ch === 'U') t++;
    else if (ch === 'G') g++;
    else if (ch === 'C') c++;
    else other++;
  }

  const total = a + t + g + c;
  const gcPercent = total > 0 ? Math.round(((g + c) / total) * 1000) / 10 : 0;

  return {
    gcPercent,
    length: clean.length,
    counts: { a, t, g, c, other },
  };
}
