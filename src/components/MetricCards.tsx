import React from 'react';
import { motion } from 'motion/react';
import { Dna, Box, Activity, Flame } from 'lucide-react';
import { GeneDataset } from '../types/bioinformatics';

interface MetricCardsProps {
  dataset: GeneDataset | null;
  currentDdg: number;
  currentMutationLabel: string;
  currentPhenotype: string;
  theme?: 'dark' | 'light';
  onJumpTo3D?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  dataset,
  currentDdg,
  currentMutationLabel,
  currentPhenotype,
  theme = 'dark',
  onJumpTo3D,
}) => {
  const isLight = theme === 'light';
  const isDdgDestabilizing = currentDdg < 0;
  const isExpressionUp = (dataset?.dysregulationLog2FC ?? 0) >= 0;

  const cards = [
    {
      id: 'target',
      label: 'ACTIVE TARGET',
      value: dataset ? dataset.symbol : 'TP53',
      sub: dataset ? dataset.fullName : 'Cellular tumor antigen p53',
      meta: dataset ? `${dataset.refSeqTranscript} · ${dataset.targetOrganism}` : 'NM_000546.6',
      icon: Dna,
      accent: 'text-[#76B900]',
    },
    {
      id: 'structure',
      label: '3D FOLD & MASS',
      value: dataset ? `PDB ${dataset.pdbId}` : 'PDB 1TUP',
      sub: dataset ? `${dataset.lengthAa} aa · ${dataset.molWeightKDa} kDa` : '393 aa · 43.7 kDa',
      meta: dataset ? `Resolution ${dataset.resolution} · AlphaFold v6` : 'AlphaFold DB v6 Ready',
      icon: Box,
      accent: 'text-[#8ED600]',
      onClick: onJumpTo3D,
    },
    {
      id: 'ddg',
      label: 'THERMODYNAMIC ΔΔG',
      value: dataset ? `${currentDdg > 0 ? `+${currentDdg}` : currentDdg} kcal/mol` : '-2.38 kcal/mol',
      sub: dataset ? `Variant ${currentMutationLabel}` : 'Variant R175H',
      meta: currentPhenotype && currentPhenotype !== 'NIL' ? currentPhenotype : 'Destabilizing core fold',
      icon: Flame,
      accent: isDdgDestabilizing ? 'text-rose-400' : 'text-[#76B900]',
    },
    {
      id: 'expression',
      label: 'TRANSCRIPTOMIC LOG₂FC',
      value: dataset
        ? `${isExpressionUp ? `+${dataset.dysregulationLog2FC}` : dataset.dysregulationLog2FC} log₂FC`
        : '+2.84 log₂FC',
      sub: dataset ? `Adj. p-val ${dataset.dysregulationPVal}` : 'GEO2R Differential Cohort',
      meta: dataset ? dataset.clinicalDisease : 'Oncology Expression Profile',
      icon: Activity,
      accent: isExpressionUp ? 'text-[#76B900]' : 'text-amber-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 select-none">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.35,
              delay: idx * 0.04,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{ y: -3, transition: { duration: 0.18 } }}
            onClick={card.onClick}
            className={`rounded-2xl p-4 border relative overflow-hidden flex flex-col justify-between transition-colors ${
              card.onClick ? 'cursor-pointer' : ''
            } ${
              isLight
                ? 'bg-white border-slate-200 hover:border-[#76B900] shadow-xs'
                : 'bg-[#10130E] border-[#22281E] hover:border-[#76B900]/50 shadow-lg'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-semibold">
                {card.label}
              </span>
              <div className="w-6 h-6 rounded-lg bg-[#76B900]/10 border border-[#76B900]/25 flex items-center justify-center text-[#76B900]">
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="my-2">
              <motion.div
                key={card.value}
                initial={{ opacity: 0.5, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`text-xl font-bold font-display tracking-tight ${
                  isLight ? 'text-slate-900' : card.accent
                }`}
              >
                {card.value}
              </motion.div>
              <div
                className={`text-xs truncate mt-0.5 ${
                  isLight ? 'text-slate-600' : 'text-slate-300'
                }`}
                title={card.sub}
              >
                {card.sub}
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 truncate">{card.meta}</div>
          </motion.div>
        );
      })}
    </div>
  );
};
