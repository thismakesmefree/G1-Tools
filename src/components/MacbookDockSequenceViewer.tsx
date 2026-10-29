import React, { useState, useRef, useMemo } from 'react';
import { AMINO_ACIDS, getClustalColor, AminoAcidInfo } from '../utils/bioMath';
import {
  Info,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap,
  Activity,
  Atom,
  ShieldAlert,
  Dna,
  ExternalLink,
  Layers,
  Check,
} from 'lucide-react';

interface DomainRegion {
  name: string;
  start: number;
  end: number;
  color: string;
}

interface MacbookDockSequenceViewerProps {
  sequence: string;
  label?: string;
  startPos?: number;
  selectedPos?: number;
  onSelectResidue?: (pos: number, char: string) => void;
  hotspots?: number[];
  domains?: DomainRegion[];
  type?: 'PROTEIN' | 'DNA';
}

// Genetic codon mapping for standard 20 amino acids
const AA_CODONS: Record<string, string[]> = {
  A: ['GCU', 'GCC', 'GCA', 'GCG'],
  R: ['CGU', 'CGC', 'CGA', 'CGG', 'AGA', 'AGG'],
  N: ['AAU', 'AAC'],
  D: ['GAU', 'GAC'],
  C: ['UGU', 'UGC'],
  E: ['GAA', 'GAG'],
  Q: ['CAA', 'CAG'],
  G: ['GGU', 'GGC', 'GGA', 'GGG'],
  H: ['CAU', 'CAC'],
  I: ['AUU', 'AUC', 'AUA'],
  L: ['UUA', 'UUG', 'CUU', 'CUC', 'CUA', 'CUG'],
  K: ['AAA', 'AAG'],
  M: ['AUG'],
  F: ['UUU', 'UUC'],
  P: ['CCU', 'CCC', 'CCA', 'CCG'],
  S: ['UCU', 'UCC', 'UCA', 'UCG', 'AGU', 'AGC'],
  T: ['ACU', 'ACC', 'ACA', 'ACG'],
  W: ['UGG'],
  Y: ['UAU', 'UAC'],
  V: ['GUU', 'GUC', 'GUA', 'GUG'],
};

// Secondary structure propensities
const AA_PROPENSITIES: Record<string, { helix: string; sheet: string; turn: string }> = {
  A: { helix: 'High (Former)', sheet: 'Medium', turn: 'Low' },
  R: { helix: 'Medium-High', sheet: 'Medium', turn: 'Medium' },
  N: { helix: 'Low', sheet: 'Low', turn: 'High (Turns)' },
  D: { helix: 'Medium', sheet: 'Low', turn: 'High (Turns)' },
  C: { helix: 'Medium', sheet: 'High (Disulfides)', turn: 'Medium' },
  E: { helix: 'Very High (Former)', sheet: 'Low', turn: 'Medium' },
  Q: { helix: 'High', sheet: 'Medium', turn: 'Medium' },
  G: { helix: 'Very Low (Breaker)', sheet: 'Low', turn: 'Extremely High' },
  H: { helix: 'Medium', sheet: 'Medium', turn: 'Medium' },
  I: { helix: 'Medium', sheet: 'Very High (Former)', turn: 'Low' },
  L: { helix: 'Very High (Former)', sheet: 'High', turn: 'Low' },
  K: { helix: 'High', sheet: 'Low', turn: 'Medium' },
  M: { helix: 'High (Former)', sheet: 'Medium', turn: 'Low' },
  F: { helix: 'Medium', sheet: 'Very High (Aromatic)', turn: 'Low' },
  P: { helix: 'Extremely Low (Breaker)', sheet: 'Low', turn: 'Very High (Kinks)' },
  S: { helix: 'Low', sheet: 'Medium', turn: 'High' },
  T: { helix: 'Medium', sheet: 'High', turn: 'Medium' },
  W: { helix: 'Medium', sheet: 'High (Aromatic)', turn: 'Low' },
  Y: { helix: 'Medium', sheet: 'Very High (Aromatic)', turn: 'Low' },
  V: { helix: 'Medium', sheet: 'Extremely High', turn: 'Low' },
};

export const MacbookDockSequenceViewer: React.FC<MacbookDockSequenceViewerProps> = ({
  sequence,
  label = 'Interactive Sequence Analysis Viewer (macOS Dock Magnification)',
  startPos = 1,
  selectedPos,
  onSelectResidue,
  hotspots = [],
  domains = [],
  type = 'PROTEIN',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [internalSelectedPos, setInternalSelectedPos] = useState<number | null>(
    selectedPos || startPos
  );
  const [windowOffset, setWindowOffset] = useState<number>(0);
  const windowSize = 48; // number of residues visible in the dock

  const cleanSeq = useMemo(() => {
    return sequence.replace(/[^A-Za-z-]/g, '').toUpperCase();
  }, [sequence]);

  const totalLength = cleanSeq.length;
  const maxOffset = Math.max(0, totalLength - windowSize);

  // Synchronize external selectedPos
  React.useEffect(() => {
    if (selectedPos !== undefined && selectedPos !== null) {
      setInternalSelectedPos(selectedPos);
      // Auto-center window if selectedPos is outside view
      if (selectedPos < startPos + windowOffset || selectedPos >= startPos + windowOffset + windowSize) {
        const desiredOffset = Math.max(0, Math.min(maxOffset, selectedPos - startPos - Math.floor(windowSize / 2)));
        setWindowOffset(desiredOffset);
      }
    }
  }, [selectedPos, startPos, windowSize, maxOffset]);

  // Subsequence currently in dock view
  const visibleSeq = useMemo(() => {
    return cleanSeq.slice(windowOffset, windowOffset + windowSize);
  }, [cleanSeq, windowOffset, windowSize]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    setMouseX(x);
  };

  const handleMouseLeave = () => {
    setMouseX(null);
    setHoveredIndex(null);
  };

  // Inspect currently hovered residue
  const hoveredResidue = useMemo(() => {
    if (hoveredIndex === null) return null;
    const globalPos = startPos + windowOffset + hoveredIndex;
    const char = visibleSeq[hoveredIndex] || '';
    const info = AMINO_ACIDS[char];
    const isHotspot = hotspots.includes(globalPos);
    const domain = domains.find((d) => globalPos >= d.start && globalPos <= d.end);
    const codons = AA_CODONS[char] || [];
    const propensities = AA_PROPENSITIES[char];

    return {
      char,
      globalPos,
      info,
      isHotspot,
      domain,
      codons,
      propensities,
      indexInDock: hoveredIndex,
    };
  }, [hoveredIndex, startPos, windowOffset, visibleSeq, hotspots, domains]);

  // Active / selected residue detail
  const activeSelectedResidue = useMemo(() => {
    const targetPos = internalSelectedPos || startPos;
    const seqIdx = targetPos - startPos;
    if (seqIdx < 0 || seqIdx >= cleanSeq.length) return null;

    const char = cleanSeq[seqIdx] || '';
    const info = AMINO_ACIDS[char];
    const isHotspot = hotspots.includes(targetPos);
    const domain = domains.find((d) => targetPos >= d.start && targetPos <= d.end);
    const codons = AA_CODONS[char] || [];
    const propensities = AA_PROPENSITIES[char];
    const indexInDock = targetPos - startPos - windowOffset;

    return {
      char,
      globalPos: targetPos,
      info,
      isHotspot,
      domain,
      codons,
      propensities,
      indexInDock,
    };
  }, [internalSelectedPos, startPos, cleanSeq, hotspots, domains, windowOffset]);

  // The residue to highlight in floating dock balloon: prefer hovered, fallback to active selected residue
  const popupResidue = hoveredResidue || (activeSelectedResidue && activeSelectedResidue.indexInDock >= 0 && activeSelectedResidue.indexInDock < visibleSeq.length ? activeSelectedResidue : null);

  const handleResidueClick = (pos: number, char: string) => {
    setInternalSelectedPos(pos);
    if (onSelectResidue) {
      onSelectResidue(pos, char);
    }
  };

  return (
    <div className="bg-[#0b101c] border border-cyan-900/50 rounded-2xl p-4 md:p-5 space-y-4 select-none shadow-[0_4px_30px_rgba(0,0,0,0.6)] relative">
      {/* Top Controls & Navigation Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#22d3ee]" />
          <div>
            <h3 className="text-xs font-bold font-mono text-cyan-300 tracking-wide flex items-center gap-1.5">
              <span>{label}</span>
              <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
                (macOS Dock Enlarge Physics + Instant Selected Residue Pop-Up)
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Hover to trigger dynamic dock enlargement · Click any residue to pop up and lock detailed residue inspector
            </p>
          </div>
        </div>

        {/* Window Range & Slider Buttons */}
        <div className="flex items-center space-x-2 text-[11px] font-mono">
          <span className="text-slate-400">
            Residues <strong className="text-cyan-300">{startPos + windowOffset}</strong> -{' '}
            <strong className="text-cyan-300">
              {Math.min(totalLength, startPos + windowOffset + windowSize - 1)}
            </strong>{' '}
            of {totalLength} aa
          </span>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setWindowOffset((prev) => Math.max(0, prev - 24))}
              disabled={windowOffset === 0}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
              title="Slide Left (Previous 24 Residues)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setWindowOffset((prev) => Math.min(maxOffset, prev + 24))}
              disabled={windowOffset >= maxOffset}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition"
              title="Slide Right (Next 24 Residues)"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Domain Quick Jump Chips */}
      {domains.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>Functional Domains:</span>
          </span>
          {domains.map((dom) => (
            <button
              key={dom.name}
              onClick={() => {
                const targetOffset = Math.max(0, Math.min(maxOffset, dom.start - startPos));
                setWindowOffset(targetOffset);
                handleResidueClick(dom.start, cleanSeq[dom.start - startPos] || 'A');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-700 transition flex items-center gap-1.5"
            >
              <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: dom.color }} />
              <span>{dom.name}</span>
              <span className="text-slate-500 text-[9px]">[{dom.start}-{dom.end}]</span>
            </button>
          ))}
        </div>
      )}

      {/* The MacBook Dock Strip Container */}
      <div
        className="relative pt-20 pb-5 px-3 overflow-visible bg-[#070b13] rounded-2xl border border-slate-800 flex items-end justify-center min-h-[135px]"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Subtle shelf line below dock items */}
        <div className="absolute bottom-2.5 left-4 right-4 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/25 to-transparent pointer-events-none" />

        <div className="flex items-end space-x-[2px] w-full justify-between max-w-full">
          {visibleSeq.split('').map((char, idx) => {
            const globalPos = startPos + windowOffset + idx;
            const isSelected = internalSelectedPos === globalPos;
            const isHotspot = hotspots.includes(globalPos);

            // Compute macOS dock magnification scale and translate-Y based on cursor distance
            let scale = 1.0;
            let translateY = 0;

            if (mouseX !== null && containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const itemWidth = rect.width / visibleSeq.length;
              const itemCenterX = (idx + 0.5) * itemWidth;
              const dist = Math.abs(mouseX - itemCenterX);
              const sigma = itemWidth * 2.6; // Gaussian kernel radius

              // Gaussian magnification falloff
              const mag = Math.exp(-(dist * dist) / (2 * sigma * sigma));
              scale = 1.0 + mag * 1.65; // scales from 1.0x up to 2.65x!
              translateY = -mag * 32; // pops upward like macOS dock!

              // If selected, add an extra lift when hovered nearby
              if (isSelected) {
                scale = Math.max(scale, 1.4);
                translateY = Math.min(translateY, -16);
              }
            } else if (isSelected) {
              // Keep selected residue prominently popped up like active macOS Dock item
              scale = 1.65;
              translateY = -24;
            }

            const clustal = type === 'PROTEIN' ? getClustalColor(char) : { bg: 'bg-cyan-900/70 text-cyan-200' };

            return (
              <div
                key={idx}
                onMouseEnter={() => setHoveredIndex(idx)}
                onClick={() => handleResidueClick(globalPos, char)}
                style={{
                  transform: `translateY(${translateY}px) scale(${scale})`,
                  transformOrigin: 'bottom center',
                  zIndex: isSelected ? 45 : Math.round(scale * 15),
                }}
                className={`flex-1 min-w-[13px] max-w-[28px] h-9 rounded-md flex flex-col items-center justify-center font-mono font-bold cursor-pointer transition-transform duration-100 ease-out origin-bottom relative group ${
                  isSelected
                    ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-950 shadow-[0_0_20px_rgba(6,182,212,1)] z-40'
                    : 'hover:brightness-110'
                } ${isHotspot ? 'ring-1 ring-rose-500' : ''} ${clustal.bg}`}
              >
                {/* Hotspot indicator pip */}
                {isHotspot && (
                  <span className="absolute -top-1 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e] animate-pulse" />
                )}

                {/* Selected active dock indicator beacon (macOS dot below active app) */}
                {isSelected && (
                  <span className="absolute -bottom-2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-ping" />
                )}

                {/* Residue character */}
                <span className="text-[12px] leading-none select-none">
                  {char}
                </span>

                {/* Small position indicator revealed when magnified */}
                {(scale > 1.35 || isSelected) && (
                  <span className="text-[7px] text-slate-300 font-mono tracking-tighter absolute -bottom-3 select-none">
                    {globalPos}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Floating macOS-Style Dock Pop-Up Balloon for selected or hovered residue */}
        {popupResidue && containerRef.current && popupResidue.indexInDock >= 0 && popupResidue.indexInDock < visibleSeq.length && (
          <div
            className="absolute -top-16 z-50 pointer-events-none transform -translate-x-1/2 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${Math.max(
                80,
                Math.min(
                  containerRef.current.clientWidth - 80,
                  ((popupResidue.indexInDock + 0.5) / visibleSeq.length) * containerRef.current.clientWidth
                )
              )}px`,
            }}
          >
            <div className="bg-[#0f172a]/95 backdrop-blur-md border border-cyan-400/80 rounded-xl px-3.5 py-2 shadow-[0_0_25px_rgba(6,182,212,0.45)] text-center text-xs font-mono whitespace-nowrap">
              <div className="flex items-center space-x-2 justify-center">
                <span className="font-bold text-cyan-300 text-sm bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-500/50">
                  {popupResidue.char}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-white font-semibold">
                  {popupResidue.info?.code3 || popupResidue.char} ({popupResidue.info?.name || 'Residue'})
                </span>
                <span className="text-cyan-400 font-bold">#{popupResidue.globalPos}</span>
                {popupResidue.globalPos === internalSelectedPos && (
                  <span className="text-[9px] bg-cyan-500 text-slate-950 font-bold px-1.5 py-0.2 rounded-full">
                    Selected
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-300 flex items-center justify-center gap-2 mt-1">
                <span>{popupResidue.info?.polarity || 'Neutral'}</span>
                <span>·</span>
                <span>Hydropathy: {popupResidue.info?.hydropathy}</span>
                <span>·</span>
                <span>MW: {popupResidue.info?.mw} Da</span>
                {popupResidue.isHotspot && (
                  <span className="text-rose-400 font-bold flex items-center gap-0.5">
                    <Zap className="w-3 h-3" /> Hotspot
                  </span>
                )}
              </div>
              {/* Pointer beak below balloon */}
              <div className="w-2.5 h-2.5 bg-[#0f172a] border-r border-b border-cyan-400/80 transform rotate-45 mx-auto -mb-2 mt-1" />
            </div>
          </div>
        )}
      </div>

      {/* Selected Residue Deep Pop-Up Inspector Card (Shows complete detail when selected) */}
      {activeSelectedResidue ? (
        <div className="bg-[#0e1526] border-2 border-cyan-500/50 rounded-xl p-3.5 space-y-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-2 shadow-lg">
          {/* Header of selected residue */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-300 font-bold text-lg shadow-[0_0_12px_rgba(6,182,212,0.5)]">
                {activeSelectedResidue.char}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-100 text-sm font-display">
                    Selected: {activeSelectedResidue.info?.name || 'Residue'} ({activeSelectedResidue.info?.code3} / {activeSelectedResidue.char})
                  </span>
                  <span className="bg-cyan-950 text-cyan-300 border border-cyan-700 text-[11px] px-2 py-0.5 rounded font-bold">
                    Position #{activeSelectedResidue.globalPos}
                  </span>
                  {activeSelectedResidue.isHotspot && (
                    <span className="bg-rose-950 text-rose-300 border border-rose-700 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 shadow-[0_0_8px_rgba(244,63,94,0.4)]">
                      <Zap className="w-3 h-3 text-rose-400" />
                      <span>Pathogenic Hotspot Mutation</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Chemical Classification: <strong className="text-slate-200">{activeSelectedResidue.info?.category}</strong>
                </p>
              </div>
            </div>

            {/* Quick action button */}
            <div className="flex items-center space-x-2">
              <span className="text-[10px] text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-1 rounded">
                Active in Workspace
              </span>
            </div>
          </div>

          {/* Grid of Physicochemical & Structural Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px]">
            {/* 1. Polarity & Charge */}
            <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Polarity & Charge</span>
              <div className="text-slate-200 font-semibold">
                {activeSelectedResidue.info?.polarity?.toUpperCase()}
              </div>
              <div className="text-[10px] text-cyan-400">
                Charge: {activeSelectedResidue.info?.charge} (pH 7.4)
              </div>
            </div>

            {/* 2. Hydropathy Score */}
            <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Hydropathy (Kyte-Doolittle)</span>
              <div className="text-slate-200 font-semibold flex items-center gap-1">
                <span>{activeSelectedResidue.info?.hydropathy}</span>
                <span className="text-[10px] text-slate-400">
                  {Number(activeSelectedResidue.info?.hydropathy) > 0 ? '(Hydrophobic)' : '(Hydrophilic)'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500">
                Scale: -4.5 (Arg) to +4.5 (Ile)
              </div>
            </div>

            {/* 3. Molecular Mass & Volume */}
            <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Mass & VdW Volume</span>
              <div className="text-slate-200 font-semibold">
                {activeSelectedResidue.info?.mw} Da
              </div>
              <div className="text-[10px] text-slate-400">
                Volume: {activeSelectedResidue.info?.volume} Å³
              </div>
            </div>

            {/* 4. Triplet Codons */}
            <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-slate-500 uppercase block">Genetic Codons</span>
              <div className="text-purple-300 font-semibold truncate" title={activeSelectedResidue.codons.join(', ')}>
                {activeSelectedResidue.codons.slice(0, 3).join(', ')}
                {activeSelectedResidue.codons.length > 3 && ` +${activeSelectedResidue.codons.length - 3}`}
              </div>
              <div className="text-[10px] text-slate-500">
                Total Codons: {activeSelectedResidue.codons.length}
              </div>
            </div>
          </div>

          {/* Secondary Structure Propensity & Domain Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-1">
            <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">Secondary Structure Propensity</span>
                <span className="text-slate-200">
                  Helix: {activeSelectedResidue.propensities?.helix || 'Normal'} · Sheet: {activeSelectedResidue.propensities?.sheet || 'Normal'}
                </span>
              </div>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>

            <div className="bg-[#080d18] border border-slate-800 rounded-lg p-2.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block">UniProt / GenBank Domain</span>
                <span className="text-amber-300 font-semibold">
                  {activeSelectedResidue.domain ? activeSelectedResidue.domain.name : 'Inter-domain Flexible Region'}
                </span>
              </div>
              <Atom className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-2 text-[11px] font-mono text-slate-500 flex items-center justify-center gap-1.5 bg-[#080d18] rounded-xl border border-slate-850 p-2">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click any residue in the macOS dock strip above to open its deep biophysical & structural inspector</span>
        </div>
      )}
    </div>
  );
};
