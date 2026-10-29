import React from 'react';
import { motion } from 'motion/react';
import {
  Dna,
  Save,
  History,
  Download,
  ArrowLeftRight,
  Sun,
  Moon,
} from 'lucide-react';

interface HeaderProps {
  currentGene: string;
  engineMode: 'demo' | 'live';
  onToggleEngine: () => void;
  onSelectGene: (gene: string) => void;
  onSaveSession: () => void;
  onOpenSavedRuns: () => void;
  onOpenExport: () => void;
  onOpenTranslator?: () => void;
  savedRunsCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

const QUICK_TARGETS = ['TP53', 'BRCA1', 'KRAS', 'EGFR', 'Spike (CoV2)'] as const;

export const Header: React.FC<HeaderProps> = ({
  currentGene,
  engineMode,
  onToggleEngine,
  onSelectGene,
  onSaveSession,
  onOpenSavedRuns,
  onOpenExport,
  onOpenTranslator,
  savedRunsCount,
  theme = 'dark',
  onToggleTheme,
}) => {
  const isLight = theme === 'light';

  return (
    <header
      className={`sticky top-0 z-30 h-14 backdrop-blur-xl border-b px-5 flex items-center justify-between text-xs select-none transition-colors duration-200 ${
        isLight
          ? 'bg-white/90 border-slate-200 text-slate-800'
          : 'bg-[#0A0B09]/90 border-[#22281E] text-slate-200'
      }`}
    >
      {/* Left: Brand Logo & Active Target Pill */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2.5">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#76B900]/15 border border-[#76B900]/50 text-[#76B900] shadow-[0_0_12px_rgba(118,185,0,0.25)]"
          >
            <Dna className="w-4 h-4" />
          </motion.div>
          <div className="leading-tight">
            <div className="flex items-center space-x-1.5">
              <span
                className={`font-bold tracking-tight text-sm font-display ${
                  isLight ? 'text-slate-900' : 'text-white'
                }`}
              >
                G1 Tools
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#76B900]/15 text-[#8ED600] border border-[#76B900]/30 font-bold">
                3D + Genomics
              </span>
            </div>
          </div>
        </div>

        {/* Animated Quick-Select Target Bar */}
        <div className="hidden lg:flex items-center space-x-1 pl-3 border-l border-[#22281E]">
          {QUICK_TARGETS.map((gene) => {
            const isActive = currentGene === gene;
            return (
              <button
                key={gene}
                onClick={() => onSelectGene(gene)}
                className={`relative font-mono text-[11px] px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  isActive
                    ? 'text-black font-bold'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="headerTargetPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-lg bg-[#76B900] shadow-[0_0_10px_rgba(118,185,0,0.35)]"
                  />
                )}
                <span className="relative z-10">{gene}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Streamlined Action Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleEngine}
          className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] transition cursor-pointer ${
            isLight
              ? 'bg-slate-50 border-slate-200 text-slate-700'
              : 'bg-[#10130E] border-[#22281E] text-slate-300 hover:border-[#76B900]/40'
          }`}
          title="Switch between Live NCBI/AlphaFold stream and local fixtures"
        >
          <span className="w-2 h-2 rounded-full bg-[#76B900] animate-pulse" />
          <span>{engineMode === 'live' ? 'Live API' : 'Fast Demo'}</span>
        </button>

        {onOpenTranslator && (
          <button
            onClick={onOpenTranslator}
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition text-[11px] font-medium cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                : 'bg-[#10130E] hover:bg-[#161B13] text-slate-300 border-[#22281E]'
            }`}
            title="6-Frame DNA ⇄ Protein Translator"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#76B900]" />
            <span>Translator</span>
          </button>
        )}

        <button
          onClick={onSaveSession}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition text-[11px] font-medium border cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#10130E] hover:bg-[#161B13] text-slate-300 border-[#22281E]'
          }`}
          title="Save current session"
        >
          <Save className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          onClick={onOpenSavedRuns}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg transition text-[11px] font-medium border cursor-pointer ${
            isLight
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
              : 'bg-[#10130E] hover:bg-[#161B13] text-slate-300 border-[#22281E]'
          }`}
          title="Saved runs"
        >
          <History className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono text-[10px] text-[#8ED600] font-bold">{savedRunsCount}</span>
        </button>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onOpenExport}
          className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-[#76B900] hover:bg-[#8ED600] text-black font-bold transition shadow-[0_0_12px_rgba(118,185,0,0.35)] text-[11px] cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </motion.button>

        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-[#10130E] hover:bg-[#161B13] text-slate-300 border-[#22281E]'
            }`}
            title={`Switch to ${isLight ? 'Dark' : 'Light'} Mode`}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-[#76B900]" />}
          </button>
        )}
      </div>
    </header>
  );
};
