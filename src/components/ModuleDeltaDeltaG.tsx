import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Flame,
  ShieldAlert,
  Zap,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Search,
  Thermometer,
  Droplet,
  Info,
  Lock,
} from 'lucide-react';
import { GeneDataset, MutationPreset } from '../types/bioinformatics';
import { calculateDeltaDeltaG, AMINO_ACIDS, getClustalColor } from '../utils/bioMath';

interface ModuleDeltaDeltaGProps {
  dataset: GeneDataset | null;
  selectedPreset?: MutationPreset;
  onSelectPreset: (preset: MutationPreset) => void;
  wtAa: string;
  setWtAa: (aa: string) => void;
  pos: number;
  setPos: (pos: number) => void;
  mutAa: string;
  setMutAa: (aa: string) => void;
  tempC: number;
  setTempC: (temp: number) => void;
  pH: number;
  setPH: (pH: number) => void;
  currentDdg: number;
  currentCategory: string;
  currentConsequence: string;
  isLocked?: boolean;
  onUnlockProtein?: () => void;
  theme?: 'dark' | 'light';
}

export const ModuleDeltaDeltaG: React.FC<ModuleDeltaDeltaGProps> = ({
  dataset,
  selectedPreset,
  onSelectPreset,
  wtAa,
  setWtAa,
  pos,
  setPos,
  mutAa,
  setMutAa,
  tempC,
  setTempC,
  pH,
  setPH,
  currentDdg,
  currentCategory,
  currentConsequence,
  isLocked = false,
  onUnlockProtein,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  if (!dataset) {
    return (
      <section className="bg-[#101524] border border-slate-800 rounded-lg p-5 md:p-6 space-y-5 select-none transition-all duration-300">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-6 h-6 rounded bg-purple-950/70 border border-purple-800/50 flex items-center justify-center text-purple-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100 tracking-tight">
                Module 3: Protein Free Energy Stability (I-Mutant ΔΔG Simulator)
              </h2>
              <p className="text-[11px] text-slate-400">
                Interactive sequence mutation browser · Predict free energy shifts (ΔΔG in kcal/mol)
              </p>
            </div>
          </div>
          <span className="bg-slate-900 text-slate-500 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800">
            Engine: NIL · SVM-T Mode
          </span>
        </div>

        {/* NIL Interactive Sequence & Model Schematic */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left: Sequence Track & Residue Controls Placeholder */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-[#080c14] border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-slate-500" />
                  <span>Interactive Sequence Track</span>
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Residues: NIL · Window: NIL
                </span>
              </div>

              {/* Ghost Amino Acid Blocks */}
              <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 py-2">
                {Array.from({ length: 16 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col items-center justify-center p-2 rounded bg-slate-900/60 border border-slate-800 text-slate-600 font-mono text-xs opacity-60"
                  >
                    <span className="text-[9px] text-slate-600">#{idx + 1}</span>
                    <span className="font-bold text-slate-500">NIL</span>
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-500 font-mono text-center pt-1 border-t border-slate-850">
                Awaiting query sequence. Enter a protein query above or select a demo to click and mutate residues.
              </div>
            </div>

            {/* Simulated Parameters Form */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-[#0a0e18] border border-slate-800/80 rounded-lg p-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">WT Residue</span>
                <span className="text-slate-400 font-bold">NIL</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Position</span>
                <span className="text-slate-400 font-bold">NIL</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Mut Residue</span>
                <span className="text-slate-400 font-bold">NIL</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Temp (°C)</span>
                <span className="text-slate-400 font-bold">25°C</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">pH</span>
                <span className="text-slate-400 font-bold">7.0</span>
              </div>
            </div>
          </div>

          {/* Right: Thermodynamic Prediction Card (NIL) */}
          <div className="bg-[#0b101c] border border-slate-800 rounded-lg p-4 space-y-4 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
                THERMODYNAMIC FREE ENERGY PREDICTION
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="text-xs font-mono text-slate-400">Predicted ΔΔG:</div>
                <div className="text-2xl font-bold font-display text-slate-400">NIL kcal/mol</div>
                <div className="text-[11px] text-slate-500">Classification: NIL</div>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono border-t border-slate-800 pt-3">
              <div className="flex justify-between text-slate-500">
                <span>Model Confidence:</span>
                <span className="text-slate-400">NIL</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Solvation Energy:</span>
                <span className="text-slate-400">NIL</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Van der Waals Shift:</span>
                <span className="text-slate-400">NIL</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Extract pure sequence
  const rawSeq = dataset.fastaSequence.replace(/[^A-Za-z]/g, '').toUpperCase();
  const totalAa = rawSeq.length || dataset.lengthAa;

  // Windowing for sequence viewer (showing e.g. 60 residues at a time with smooth slider/prev/next)
  const windowSize = 48;
  const initialWindowStart = Math.max(0, Math.min(pos - Math.floor(windowSize / 2), totalAa - windowSize));
  const [windowStart, setWindowStart] = useState<number>(initialWindowStart);

  // Floating Popup state
  const [popupActive, setPopupActive] = useState<boolean>(false);
  const [activePopupResidue, setActivePopupResidue] = useState<{
    char: string;
    pos: number;
  }>({ char: wtAa, pos });

  // Temporary mutation in popup
  const [tempMutAa, setTempMutAa] = useState<string>(mutAa);
  const [tempTempC, setTempTempC] = useState<number>(tempC);
  const [tempPH, setTempPH] = useState<number>(pH);

  // Sync window when pos changes externally (e.g. clicking preset)
  useEffect(() => {
    if (pos < windowStart + 1 || pos > windowStart + windowSize) {
      setWindowStart(Math.max(0, Math.min(pos - Math.floor(windowSize / 2), totalAa - windowSize)));
    }
    setActivePopupResidue({ char: wtAa, pos });
    setTempMutAa(mutAa);
  }, [pos, wtAa, mutAa, totalAa]);

  // Handle clicking a residue on the sequence track
  const handleResidueClick = (char: string, residuePos: number) => {
    setActivePopupResidue({ char, pos: residuePos });
    setWtAa(char);
    setPos(residuePos);
    // Suggest a mutation candidate
    const candidate = char === 'R' ? 'H' : char === 'H' ? 'A' : char === 'C' ? 'G' : 'A';
    setTempMutAa(candidate);
    setPopupActive(true);
  };

  // Live preview calculation inside popup
  const previewDdg = calculateDeltaDeltaG(
    activePopupResidue.char,
    tempMutAa,
    activePopupResidue.pos,
    tempTempC,
    tempPH
  );

  // Apply mutation from popup
  const handleApplyMutation = () => {
    setWtAa(activePopupResidue.char);
    setPos(activePopupResidue.pos);
    setMutAa(tempMutAa);
    setTempC(tempTempC);
    setPH(tempPH);
    setPopupActive(false);
  };

  // Grouped amino acids for the interactive "Change it to?" picker
  const aaGroups = [
    {
      name: 'Hydrophobic & Aliphatic',
      color: 'text-emerald-400',
      border: 'border-emerald-800/40',
      bg: 'bg-emerald-950/30',
      list: ['A', 'V', 'L', 'I', 'M', 'F', 'W', 'P'],
    },
    {
      name: 'Basic (+ Charge)',
      color: 'text-sky-400',
      border: 'border-sky-800/40',
      bg: 'bg-sky-950/30',
      list: ['K', 'R', 'H'],
    },
    {
      name: 'Acidic (- Charge)',
      color: 'text-rose-400',
      border: 'border-rose-800/40',
      bg: 'bg-rose-950/30',
      list: ['D', 'E'],
    },
    {
      name: 'Polar & Uncharged',
      color: 'text-teal-300',
      border: 'border-teal-800/40',
      bg: 'bg-teal-950/30',
      list: ['S', 'T', 'N', 'Q', 'C', 'Y'],
    },
    {
      name: 'Special / Flexible',
      color: 'text-amber-300',
      border: 'border-amber-800/40',
      bg: 'bg-amber-950/30',
      list: ['G'],
    },
  ];

  // Hotspot positions map
  const hotspotPositions = new Map<number, string>();
  dataset.mutationPresets.forEach((p) => {
    hotspotPositions.set(p.pos, p.label);
  });

  // Clamped percentage for needle gauge (-5.0 to +5.0)
  const clampedDdg = Math.max(-5, Math.min(5, currentDdg));
  const sliderPercentage = ((clampedDdg + 5) / 10) * 100;

  // Windowed slice of sequence
  const visibleResidues = rawSeq.slice(windowStart, windowStart + windowSize).split('');

  return (
    <section className={`bg-[#101524] border border-slate-800 rounded p-4 space-y-4 select-none relative ${isLocked ? 'overflow-hidden' : ''}`}>
      {/* Greyed out Locked Overlay for DNA mode */}
      {isLocked && (
        <div className="absolute inset-0 bg-[#070a12]/85 backdrop-blur-[2px] z-30 rounded flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-700/80">
          <div className="w-14 h-14 rounded-full bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 mb-3 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
            <Lock className="w-7 h-7" />
          </div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/50 text-amber-300 font-mono text-[10px] uppercase font-bold tracking-wider mb-2">
            Module Greyed Out in DNA Mode
          </div>
          <h3 className="text-base font-bold text-slate-100 font-display">
            Module 3: Protein Free Energy Stability (I-Mutant ΔΔG)
          </h3>
          <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed">
            Thermodynamic folding stability calculations (<span className="text-purple-300 font-mono">ΔΔG in kcal/mol</span>) require translated amino acid sequences and tertiary protein structure. In <strong>DNA mode</strong>, sequence stability simulation is deactivated.
          </p>
          {onUnlockProtein && (
            <button
              type="button"
              onClick={onUnlockProtein}
              className="mt-4 px-5 py-2.5 rounded bg-purple-600 hover:bg-purple-500 text-slate-950 font-bold text-xs font-mono flex items-center space-x-2 transition shadow-[0_0_16px_rgba(168,85,247,0.5)] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Switch to PROTEIN Mode to Unlock Simulator</span>
            </button>
          )}
        </div>
      )}

      {/* Module Header */}
      <div className={`flex flex-wrap items-center justify-between gap-2 border-b pb-3 ${
        isLight ? 'border-slate-200' : 'border-slate-800/80'
      } ${isLocked ? 'opacity-40 grayscale' : ''}`}>
        <div className="flex items-center space-x-2.5">
          {/* Selector 10 & Selector 9 */}
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
            isLight
              ? 'bg-purple-50 border border-purple-300 text-purple-700 shadow-xs'
              : 'bg-purple-950/70 border border-purple-800/50 text-purple-400'
          }`}>
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className={`text-sm font-semibold tracking-tight ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
              Module 3: Protein Free Energy Stability (I-Mutant ΔΔG Simulator)
            </h2>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Interactive sequence mutation browser · Click any residue to mutate & adjust conditions
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            isLocked
              ? (isLight ? 'bg-slate-100 text-slate-500 border-slate-300' : 'bg-slate-900 text-slate-500 border-slate-800')
              : (isLight ? 'bg-purple-50 text-purple-800 border-purple-300 font-bold' : 'bg-purple-950/60 text-purple-300 border-purple-800/50')
          }`}>
            {isLocked ? 'Locked (DNA Mode)' : 'SVM Biophysical Engine · Unlocked'}
          </span>
        </div>
      </div>

      <div className={isLocked ? 'opacity-30 grayscale pointer-events-none filter blur-[0.5px]' : ''}>
      {/* Preset Selection Buttons (Selector 11) */}
      <div>
        <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 flex items-center justify-between ${
          isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'
        }`}>
          <span>SELECT CLINICAL MUTATION PRESET:</span>
          <span className={`lowercase text-[10px] ${isLight ? 'text-cyan-800 font-medium' : 'text-cyan-400/80'}`}>
            or click any residue on the sequence track below
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {dataset.mutationPresets.map((preset) => {
            const isSelected = selectedPreset?.label === preset.label;
            return (
              <button
                key={preset.label}
                onClick={() => {
                  onSelectPreset(preset);
                  setWindowStart(
                    Math.max(0, Math.min(preset.pos - Math.floor(windowSize / 2), totalAa - windowSize))
                  );
                }}
                className={`p-2 rounded text-left border transition-all ${
                  isSelected
                    ? (isLight
                        ? 'bg-cyan-100 border-cyan-400 text-cyan-950 font-bold shadow-xs'
                        : 'bg-cyan-950/70 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.25)]')
                    : (isLight
                        ? 'bg-white border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800'
                        : 'bg-[#0a0e17]/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60')
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-mono text-xs font-bold ${
                      isSelected
                        ? (isLight ? 'text-cyan-950 font-bold' : 'text-cyan-300')
                        : (isLight ? 'text-slate-900 font-bold' : 'text-slate-200')
                    }`}
                  >
                    {preset.label}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      isSelected
                        ? (isLight ? 'bg-cyan-200 text-cyan-900 border-cyan-400 font-bold' : 'bg-cyan-900/50 text-cyan-200 border-cyan-700')
                        : (isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-400 border-slate-700')
                    }`}
                  >
                    {preset.tag}
                  </span>
                </div>
                <div className={`text-[10px] mt-1 truncate ${isLight ? 'text-slate-600 font-medium' : 'text-slate-400'}`}>
                  {preset.ddG < 0 ? `${preset.ddG} kcal/mol` : `+${preset.ddG} kcal/mol`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* VISUAL INTERACTIVE SEQUENCE TRACK (Selector 12) */}
      <div className={`border rounded-lg p-3 space-y-2 relative transition-colors ${
        isLight ? 'bg-slate-50 border-slate-200 shadow-xs' : 'bg-[#080c14] border-cyan-900/40'
      }`}>
        <div className="flex flex-wrap items-center justify-between text-xs gap-2">
          <div className="flex items-center space-x-2">
            <span className={`font-bold font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${
              isLight ? 'text-cyan-900' : 'text-cyan-400'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${isLight ? 'text-cyan-700' : 'text-cyan-400'}`} />
              <span>Interactive Sequence Track</span>
            </span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isLight ? 'bg-white text-slate-800 border-slate-300 font-semibold' : 'text-slate-400 bg-slate-900 border-slate-800'
            }`}>
              Showing {windowStart + 1} - {Math.min(totalAa, windowStart + windowSize)} of {totalAa} aa
            </span>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2 font-mono text-xs">
            <button
              onClick={() => setWindowStart((prev) => Math.max(0, prev - 24))}
              disabled={windowStart === 0}
              className={`p-1 rounded border disabled:opacity-40 transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Previous 24 residues"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Scrub Slider */}
            <input
              type="range"
              min={0}
              max={Math.max(0, totalAa - windowSize)}
              value={windowStart}
              onChange={(e) => setWindowStart(parseInt(e.target.value) || 0)}
              className={`w-28 sm:w-44 h-1 rounded-lg cursor-pointer ${
                isLight ? 'accent-cyan-600 bg-slate-300' : 'accent-cyan-400 bg-slate-800'
              }`}
            />

            <button
              onClick={() => setWindowStart((prev) => Math.min(Math.max(0, totalAa - windowSize), prev + 24))}
              disabled={windowStart >= totalAa - windowSize}
              className={`p-1 rounded border disabled:opacity-40 transition ${
                isLight ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
              title="Next 24 residues"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Jump to active mutation button */}
            <button
              onClick={() => {
                setWindowStart(Math.max(0, Math.min(pos - Math.floor(windowSize / 2), totalAa - windowSize)));
                setPopupActive(true);
              }}
              className={`text-[10px] px-2 py-0.5 rounded border transition font-semibold ${
                isLight ? 'bg-cyan-100 hover:bg-cyan-200 text-cyan-950 border-cyan-400' : 'bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border-cyan-700'
              }`}
            >
              Focus #{pos}
            </button>
          </div>
        </div>

        {/* The Sequence Ribbon Grid */}
        <div className="overflow-x-auto py-1">
          <div className="flex flex-wrap gap-1.5 min-w-[700px] justify-start items-center">
            {visibleResidues.map((char, index) => {
              const currentPos = windowStart + index + 1;
              const isSelected = currentPos === pos;
              const isHotspot = hotspotPositions.has(currentPos);
              const colorInfo = getClustalColor(char);

              return (
                <button
                  key={currentPos}
                  onClick={() => handleResidueClick(char, currentPos)}
                  className={`group relative flex flex-col items-center justify-center w-8 h-12 rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950 border-2 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.6)] scale-110 z-10'
                      : 'bg-[#101524] border border-slate-800/80 hover:border-cyan-500/60 hover:bg-slate-800 hover:scale-105'
                  }`}
                  title={`Position ${currentPos}: ${char} (${AMINO_ACIDS[char]?.name || 'Residue'}) · Click to Mutate`}
                >
                  {/* Position number on top */}
                  <span
                    className={`text-[8px] font-mono leading-none ${
                      isSelected ? 'text-cyan-300 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {currentPos}
                  </span>

                  {/* Residue character */}
                  <span
                    className={`text-sm font-bold font-mono my-0.5 ${
                      isSelected ? 'text-white' : colorInfo.text
                    }`}
                  >
                    {char}
                  </span>

                  {/* Hotspot indicator dot */}
                  {isHotspot ? (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_#fbbf24]" />
                  ) : (
                    <span className="w-1 h-1 rounded-full bg-slate-700 opacity-60" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-850">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Cataloged Clinical Hotspot</span>
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-2 h-2 rounded bg-cyan-950 border border-cyan-400" />
              <span>Selected Active Residue ({wtAa}{pos} → {mutAa})</span>
            </span>
          </div>
          <span className="text-slate-400">
            Click any amino acid above to launch the <strong>"Change it to?"</strong> editor
          </span>
        </div>
      </div>

      {/* FLOATING IN-PLACE RESIDUE MUTATION POPUP ("Change it to?") */}
      {popupActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl bg-[#0d1320] border-2 border-cyan-500/70 rounded-xl shadow-[0_0_35px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Popup Header */}
            <div className="px-5 py-3.5 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500 flex items-center justify-center text-cyan-400 font-bold font-mono text-sm shadow-[0_0_10px_rgba(6,182,212,0.4)]">
                  {activePopupResidue.char}{activePopupResidue.pos}
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                    <span>Mutate Residue #{activePopupResidue.pos}</span>
                    <span className="text-cyan-400">({AMINO_ACIDS[activePopupResidue.char]?.name})</span>
                    <span className="text-slate-500">→</span>
                    <span className="text-amber-300 font-mono text-xs">Change it to?</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Select target mutant amino acid & environmental conditions
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPopupActive(false)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Popup Body */}
            <div className="p-4 space-y-4 overflow-y-auto">
              {/* 20 Amino Acid Interactive Keypad */}
              <div className="space-y-2.5">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>SELECT TARGET AMINO ACID:</span>
                  <span className="text-slate-300">
                    Selected: <strong className="text-cyan-400 font-mono">{tempMutAa} ({AMINO_ACIDS[tempMutAa]?.name})</strong>
                  </span>
                </div>

                <div className="space-y-2">
                  {aaGroups.map((group) => (
                    <div key={group.name} className="space-y-1">
                      <div className={`text-[9px] font-mono uppercase font-semibold ${group.color}`}>
                        {group.name}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {group.list.map((code) => {
                          const info = AMINO_ACIDS[code];
                          const isCurrentMut = tempMutAa === code;
                          const isOriginalWt = activePopupResidue.char === code;

                          return (
                            <button
                              key={code}
                              onClick={() => setTempMutAa(code)}
                              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded font-mono text-xs transition border ${
                                isCurrentMut
                                  ? 'bg-cyan-600 text-slate-950 border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.6)] scale-105'
                                  : isOriginalWt
                                  ? 'bg-slate-900 text-slate-400 border-slate-700 opacity-70'
                                  : 'bg-[#101524] text-slate-200 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                              }`}
                            >
                              <span className="font-bold">{code}</span>
                              <span className="text-[10px] opacity-80">({info?.code3})</span>
                              {isOriginalWt && (
                                <span className="text-[8px] bg-slate-800 px-1 rounded text-slate-400">WT</span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Environmental Condition Toggles in Popup */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                {/* Temperature */}
                <div className="bg-[#080c14] border border-slate-800 rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                      <span>Temperature:</span>
                    </span>
                    <span className="text-cyan-300 font-bold">{tempTempC}°C</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                    {[
                      { val: 25, label: '25°C (Std)' },
                      { val: 37, label: '37°C (Body)' },
                      { val: 42, label: '42°C (Heat)' },
                    ].map((t) => (
                      <button
                        key={t.val}
                        onClick={() => setTempTempC(t.val)}
                        className={`py-1 rounded text-center border transition ${
                          tempTempC === t.val
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* pH Condition */}
                <div className="bg-[#080c14] border border-slate-800 rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Droplet className="w-3.5 h-3.5 text-cyan-400" />
                      <span>pH Condition:</span>
                    </span>
                    <span className="text-cyan-300 font-bold">pH {tempPH}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                    {[
                      { val: 7.0, label: '7.0 (Neutral)' },
                      { val: 6.5, label: '6.5 (Tumor)' },
                    ].map((p) => (
                      <button
                        key={p.val}
                        onClick={() => setTempPH(p.val)}
                        className={`py-1 rounded text-center border transition truncate ${
                          tempPH === p.val
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                            : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Popover Prediction Preview */}
              <div className="bg-[#101524] border border-slate-700 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase">
                    SIMULATED PREDICTION FOR {activePopupResidue.char}{activePopupResidue.pos}{tempMutAa}:
                  </div>
                  <div className="text-xs font-semibold mt-0.5 flex items-center space-x-1.5">
                    <span
                      className={
                        previewDdg.ddG < -1.0
                          ? 'text-rose-400 font-bold'
                          : previewDdg.ddG < 0
                          ? 'text-amber-400'
                          : 'text-emerald-400 font-bold'
                      }
                    >
                      {previewDdg.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xl font-bold font-display ${
                      previewDdg.ddG < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {previewDdg.ddG > 0 ? `+${previewDdg.ddG}` : previewDdg.ddG}{' '}
                    <span className="text-[10px] font-mono text-slate-400 font-normal">kcal/mol</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Popup Footer */}
            <div className="px-5 py-3 bg-[#101726] border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setPopupActive(false)}
                className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                Cancel
              </button>

              <button
                onClick={handleApplyMutation}
                className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.4)]"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply {activePopupResidue.char}{activePopupResidue.pos}{tempMutAa} to Workspace</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Prediction & Gauge Display Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
        {/* Left Quick Overview (5 cols) */}
        <div className="lg:col-span-5 space-y-3 bg-[#0a0e17]/60 border border-slate-800/80 rounded p-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] font-mono text-slate-400 uppercase">ACTIVE MUTATION POINT:</span>
            <button
              onClick={() => {
                setActivePopupResidue({ char: wtAa, pos });
                setPopupActive(true);
              }}
              className="text-[10px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Edit via Popover ↗</span>
            </button>
          </div>

          <div className="flex items-center justify-between bg-[#101524] border border-slate-800 rounded p-3">
            <div className="text-center">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Wildtype</div>
              <div className="text-xl font-bold font-mono text-slate-100">{wtAa}</div>
              <div className="text-[9px] text-slate-400">{AMINO_ACIDS[wtAa]?.code3}</div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-mono text-slate-400">Position</span>
              <span className="text-base font-bold font-mono text-cyan-300">#{pos}</span>
              <span className="text-[9px] text-slate-500">of {totalAa} aa</span>
            </div>

            <div className="text-center">
              <div className="text-[9px] font-mono text-slate-400 uppercase">Mutant</div>
              <div className="text-xl font-bold font-mono text-rose-400">{mutAa}</div>
              <div className="text-[9px] text-slate-400">{AMINO_ACIDS[mutAa]?.code3}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#101524] border border-slate-800 rounded p-2">
              <div className="text-[9px] text-slate-400">Temperature</div>
              <div className="text-slate-200 font-bold mt-0.5">{tempC}°C</div>
            </div>
            <div className="bg-[#101524] border border-slate-800 rounded p-2">
              <div className="text-[9px] text-slate-400">pH Microenv</div>
              <div className="text-slate-200 font-bold mt-0.5">pH {pH}</div>
            </div>
          </div>
        </div>

        {/* Right Output Card (7 cols) */}
        <div className="lg:col-span-7 bg-[#080c14] border border-slate-800/90 rounded p-4 flex flex-col justify-between space-y-3">
          {/* Top Classification */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                PREDICTED STABILITY SHIFT
              </div>
              <div className="text-xs font-semibold text-rose-400 font-mono mt-0.5 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>{currentCategory} (ΔΔG &lt; -1.0)</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-2xl font-bold font-display text-rose-400 tracking-tight">
                {currentDdg > 0 ? `+${currentDdg}` : currentDdg}{' '}
                <span className="text-xs font-mono text-slate-400 font-normal">kcal / mol (ΔΔG)</span>
              </div>
            </div>
          </div>

          {/* Continuous Gradient Needle Scale */}
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[9px] font-mono text-slate-400">
              <span className="text-rose-400">-5.0 (Destabilizing)</span>
              <span className="text-slate-500">0.0 (Neutral)</span>
              <span className="text-emerald-400">+5.0 (Stabilizing)</span>
            </div>

            {/* Gradient bar */}
            <div className="relative h-2 rounded-full w-full bg-gradient-to-r from-rose-500 via-amber-400 via-50% to-emerald-400 overflow-visible shadow-inner">
              {/* Pointer Marker */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-slate-900 shadow-[0_0_8px_rgba(255,255,255,0.9)] transition-all duration-300"
                style={{ left: `${sliderPercentage}%` }}
              />
            </div>
          </div>

          {/* Molecular Consequence Callout */}
          <div className="bg-slate-900/60 border border-slate-800 rounded p-2.5 text-xs">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-mono text-[10px] font-semibold mb-1">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>Molecular Consequence:</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentConsequence}
            </p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};
