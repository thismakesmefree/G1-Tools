export interface BlastHit {
  accession: string;
  organism: string;
  description: string;
  maxScore: number;
  queryCover: string;
  eValue: string;
  perIdentity: string;
  significance: 'High Significance' | 'Moderate' | 'Low' | 'Non-Significant';
}

export interface MsaSequence {
  speciesKey: string;
  speciesName: string;
  header: string;
  sequence: string;
}

export interface PhylogeneticNode {
  id: string;
  name: string;
  bootstrap?: number;
  branchLength?: number;
  divergence?: string;
  identity?: string;
  children?: PhylogeneticNode[];
  isQuery?: boolean;
  isOutgroup?: boolean;
}

export interface MutationPreset {
  label: string;
  tag: string;
  wt: string;
  pos: number;
  mut: string;
  ddG: number;
  category: 'Significantly Destabilizing' | 'Destabilizing' | 'Neutral' | 'Stabilizing';
  consequence: string;
  structuralImpact: string;
}

export interface VolcanoPoint {
  gene: string;
  log2FC: number;
  pVal: number;
  negLog10P: number;
  adjP: number;
  status: 'up' | 'down' | 'ns';
  category: string;
}

export interface GeneDataset {
  symbol: string;
  fullName: string;
  targetOrganism: string;
  taxId: number;
  isoform: string;
  refSeqTranscript: string;
  refSeqProtein: string;
  lengthAa: number;
  molWeightKDa: number;
  isoelectricPoint: number;
  pdbId: string;
  resolution: string;
  dysregulationLog2FC: number;
  dysregulationPVal: string;
  clinicalDisease: string;
  hotspotMutation: string;
  hotspotDdG: number;
  hotspotPhenotype: string;
  fastaHeader: string;
  fastaSequence: string;
  blastHits: BlastHit[];
  msaPositionRange: string;
  msaSequences: MsaSequence[];
  msaConsensus: string;
  defaultNewick: string;
  phyloTree: PhylogeneticNode;
  mutationPresets: MutationPreset[];
  geoDatasetId: string;
  geoCutoff: string;
  geoModeratedT: number;
  geoBStat: number;
  geoTargetStats: {
    log2FC: number;
    elevationText: string;
    adjP: string;
    pSignificanceText: string;
    tStat: string;
    dfText: string;
    bStat: string;
    lodText: string;
    pathwaySignatures: {
      gene: string;
      log2FC: string;
      pVal: string;
    }[];
  };
  volcanoPoints: VolcanoPoint[];
}

export interface SavedPipelineRun {
  id: string;
  timestamp: string;
  geneSymbol: string;
  geneName: string;
  engineMode: 'demo' | 'live';
  ddGValue: number;
  mutation: string;
  log2FC: number;
  blastHitsCount: number;
  notes?: string;
}
