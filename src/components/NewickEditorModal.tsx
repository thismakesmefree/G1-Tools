import React, { useState } from 'react';
import { X, GitFork, Check, RotateCcw } from 'lucide-react';

interface NewickEditorModalProps {
  currentNewick: string;
  defaultNewick: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newick: string) => void;
}

export const NewickEditorModal: React.FC<NewickEditorModalProps> = ({
  currentNewick,
  defaultNewick,
  isOpen,
  onClose,
  onSave,
}) => {
  const [text, setText] = useState(currentNewick);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleValidateAndSave = () => {
    // Quick syntax validation: balance parentheses
    const openCount = (text.match(/\(/g) || []).length;
    const closeCount = (text.match(/\)/g) || []).length;
    if (openCount !== closeCount) {
      setError(`Unbalanced parentheses: ${openCount} '(' vs ${closeCount} ')'`);
      return;
    }
    setError(null);
    onSave(text);
    onClose();
  };

  const handleReset = () => {
    setText(defaultNewick);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl bg-[#0d1320] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitFork className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Edit Newick Tree Representation
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 text-xs">
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Format: Standard Newick with branch lengths (subs/site) and bootstrap labels.
            Modify cladogram branches or paste custom phylogenetic tree output from Clustal-Omega or FastTree.
          </p>

          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError(null);
            }}
            rows={5}
            className="w-full bg-[#070b12] border border-slate-700 focus:border-cyan-500 rounded p-3 font-mono text-xs text-cyan-300 focus:outline-none leading-relaxed select-text"
          />

          {error && (
            <div className="p-2 rounded bg-rose-950/60 border border-rose-800 text-rose-300 text-[11px] font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#101726] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="text-slate-400 hover:text-slate-200 flex items-center space-x-1 text-xs font-mono"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
            >
              Cancel
            </button>
            <button
              onClick={handleValidateAndSave}
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold text-xs flex items-center space-x-1.5 transition"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Tree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
