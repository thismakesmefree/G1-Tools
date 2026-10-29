import React from 'react';
import { X, History, Trash2, ArrowRight, Clock, Dna } from 'lucide-react';
import { SavedPipelineRun } from '../types/bioinformatics';

interface SavedRunsModalProps {
  runs: SavedPipelineRun[];
  isOpen: boolean;
  onClose: () => void;
  onRestoreRun: (run: SavedPipelineRun) => void;
  onClearRuns: () => void;
}

export const SavedRunsModal: React.FC<SavedRunsModalProps> = ({
  runs,
  isOpen,
  onClose,
  onRestoreRun,
  onClearRuns,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-xl bg-[#0d1320] border border-cyan-500/40 rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-[#101726] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Saved Pipeline Executions ({runs.length})
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Runs List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
          {runs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
              <Dna className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              No saved pipeline executions yet.
              <p className="text-[11px] text-slate-600 mt-1">
                Click "Save Session" in the top bar to record active calculations and parameters.
              </p>
            </div>
          ) : (
            runs.map((run) => (
              <div
                key={run.id}
                className="bg-[#101524] border border-slate-800 hover:border-cyan-500/50 rounded p-3 transition flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-cyan-400 font-display text-sm">
                      {run.geneSymbol}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {run.mutation}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                        run.ddGValue < 0
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                          : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      ΔΔG {run.ddGValue}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 mt-1 flex items-center space-x-2">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{run.timestamp}</span>
                    <span className="text-slate-600">·</span>
                    <span className="text-slate-400">Mode: {run.engineMode}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onRestoreRun(run);
                    onClose();
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-cyan-300 text-xs font-mono transition flex items-center space-x-1"
                >
                  <span>Load</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#101726] border-t border-slate-800 flex items-center justify-between text-xs">
          {runs.length > 0 ? (
            <button
              onClick={onClearRuns}
              className="text-rose-400 hover:text-rose-300 flex items-center space-x-1 text-[11px] font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear History</span>
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
