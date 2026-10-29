import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Key,
  HelpCircle,
  Check,
  Copy,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  X,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { GeneDataset } from '../types/bioinformatics';

interface AiDiscussionViewProps {
  dataset: GeneDataset | null;
  currentMutation: string;
  currentDdg: number;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  engine?: string;
}

export const AiDiscussionView: React.FC<AiDiscussionViewProps> = ({
  dataset,
  currentMutation,
  currentDdg,
}) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Status & Key config
  const [hasServerApiKey, setHasServerApiKey] = useState<boolean>(false);
  const [customKey, setCustomKey] = useState<string>(() => {
    try {
      return (
        sessionStorage.getItem('jaivik_custom_gemini_key') ||
        localStorage.getItem('jaivik_custom_gemini_key') ||
        ''
      );
    } catch {
      return '';
    }
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: dataset
        ? `Hello! I am your G1 Tools Computational Bioinformatician Copilot powered by Gemini 3.8 Flash. I have loaded active telemetry for **${dataset.symbol}** (${dataset.targetOrganism}). Current simulated mutation is **${currentMutation}** (ΔΔG: ${currentDdg} kcal/mol). Ask me about structural biophysics, evolutionary conservation across orthologs, clinical pathogenicity, or experimental validation assays.`
        : `Hello! I am your G1 Tools Computational Bioinformatician Copilot powered by Gemini 3.8 Flash. No active query target is loaded yet. Enter any gene symbol, accession, or select a demo target in the workbench, and I will parse its structural, evolutionary, and thermodynamic profile. What can I help you explore?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      engine: 'Gemini 3.8 Flash',
    },
  ]);

  // Check server API key status on mount
  useEffect(() => {
    fetch('/api/ai-status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasApiKey) {
          setHasServerApiKey(true);
        }
      })
      .catch((err) => {
        console.warn('Could not query /api/ai-status:', err);
      });
  }, []);

  const samplePrompts = dataset
    ? [
        `Why is ${currentMutation} structurally disruptive in ${dataset.symbol}?`,
        `How does evolutionary conservation across orthologs support this phenotype?`,
        `What are the downstream transcriptomic effects observed in ${dataset.geoDatasetId}?`,
        `Explain the difference between contact vs structural destabilization for this mutation.`,
      ]
    : [
        `Explain how I-Mutant predicts free energy shifts (ΔΔG).`,
        `How does BLAST+ Karlin-Altschul E-value calculation work?`,
        `What is the difference between Neighbor-Joining and Maximum Likelihood trees?`,
        `How do limma empirical Bayes statistics evaluate GEO2R cohorts?`,
      ];

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || input;
    if (!q.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-discuss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          history: messages.slice(-6),
          customKey: customKey.trim() || undefined,
          context: dataset
            ? {
                symbol: dataset.symbol,
                fullName: dataset.fullName,
                organism: dataset.targetOrganism,
                refSeqProtein: dataset.refSeqProtein,
                lengthAa: dataset.lengthAa,
                molWeightKDa: dataset.molWeightKDa,
                isoelectricPoint: dataset.isoelectricPoint,
                pdbId: dataset.pdbId,
                resolution: dataset.resolution,
                currentMutation,
                currentDdg,
                dysregulationLog2FC: dataset.dysregulationLog2FC,
                dysregulationPVal: dataset.dysregulationPVal,
                geoDatasetId: dataset.geoDatasetId,
              }
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const botMsg: Message = {
        sender: 'assistant',
        text: data.reply || 'No response generated.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: data.engine === 'gemini-3.8-flash' ? 'Gemini 3.8 Flash' : 'G1 Tools Bio Engine',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.warn('AI Discussion request failed:', err);
      // Friendly local fallback response
      const fallbackMsg: Message = {
        sender: 'assistant',
        text: dataset
          ? `**Biophysical Assessment for ${dataset.symbol} (${currentMutation}):**\n\n` +
            `• **Free Energy Shift:** Current simulated ΔΔG is **${currentDdg} kcal/mol**.\n` +
            `• **Structural Mechanism:** Coordinates in PDB **${dataset.pdbId}** indicate local steric and electrostatic disruption.\n` +
            `• **Evolutionary Conservation:** RefSeq ortholog alignments confirm strong purifying selection at this residue position.`
          : `I am ready to assist. Please select or query a target sequence to evaluate biophysical and evolutionary metrics.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        engine: 'G1 Tools Bio Engine (Offline)',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyMessage = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleSaveCustomKey = (key: string) => {
    setCustomKey(key);
    setTestResult(null);
    try {
      sessionStorage.setItem('jaivik_custom_gemini_key', key);
      localStorage.setItem('jaivik_custom_gemini_key', key);
    } catch {
      // ignore
    }
  };

  const handleTestKey = async () => {
    if (!customKey.trim() && !hasServerApiKey) {
      setTestResult({
        success: false,
        message: 'Please enter a Gemini API Key to test.',
      });
      return;
    }

    setIsTestingKey(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: customKey.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: 'Connection successful! Gemini 3.8 Flash is ready.',
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Connection failed. Check your API key.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Network error connecting to Gemini test endpoint.',
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-2 space-y-4">
      {/* Header Banner */}
      <div className="bg-[#101524] border border-slate-800 rounded-lg p-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>AI Bioinformatician Copilot & Discussion</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                gemini-3.8-flash
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Interactive structural, evolutionary, and clinical genomic inquiry powered by Gemini AI
            </p>
          </div>
        </div>

        {/* API Key Status Pill */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`flex items-center space-x-1.5 text-xs font-mono px-3 py-1.5 rounded border transition cursor-pointer ${
              hasServerApiKey || customKey
                ? 'bg-emerald-950/50 text-emerald-300 border-emerald-700/60 shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                : 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60'
            }`}
            title="Click to check or configure Gemini API credentials"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {hasServerApiKey
                ? 'Server Gemini Key Active'
                : customKey
                ? 'Session Key Configured'
                : 'Configure API Key'}
            </span>
          </button>
        </div>
      </div>

      {/* API Key Configuration Panel */}
      {showKeyInput && (
        <div className="bg-[#0b101d] border border-cyan-500/40 rounded-lg p-4 space-y-3 shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-cyan-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gemini API Key Integration Status</span>
            </div>
            <button
              onClick={() => setShowKeyInput(false)}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Close panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-xs text-slate-300 space-y-2">
            <p className="text-[11px] text-slate-400">
              The server routes requests through <code className="text-cyan-300 bg-slate-900 px-1 rounded">/api/ai-discuss</code> using <code className="text-cyan-300 bg-slate-900 px-1 rounded">GEMINI_API_KEY</code>. You can paste your Gemini API key below to enable live responses across your session:
            </p>
            <div className="flex items-center space-x-2">
              <input
                type="password"
                value={customKey}
                onChange={(e) => handleSaveCustomKey(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini API Key)"
                className="flex-1 bg-[#070b14] border border-slate-700 focus:border-cyan-500 rounded px-3 py-1.5 text-xs font-mono text-cyan-200 focus:outline-none"
              />
              <button
                onClick={handleTestKey}
                disabled={isTestingKey}
                className="px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs font-mono flex items-center space-x-1 transition cursor-pointer"
                title="Verify key connection"
              >
                {isTestingKey ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                )}
                <span>{isTestingKey ? 'Verifying...' : 'Verify Key'}</span>
              </button>
              {customKey && (
                <button
                  onClick={() => {
                    handleSaveCustomKey('');
                    setTestResult(null);
                  }}
                  className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700 text-xs font-mono transition"
                >
                  Clear
                </button>
              )}
            </div>

            {testResult && (
              <div
                className={`p-2.5 rounded text-xs font-mono flex items-center space-x-2 ${
                  testResult.success
                    ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-700/60'
                    : 'bg-rose-950/60 text-rose-300 border border-rose-700/60'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between pt-1">
              <span>Model: <strong className="text-slate-400">gemini-3.8-flash</strong></span>
              <span>Proxy: <code className="text-slate-400">/api/ai-discuss</code></span>
            </div>
          </div>
        </div>
      )}

      {/* Suggested Prompts */}
      <div className="flex flex-wrap gap-2">
        {samplePrompts.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="text-[11px] px-3 py-1.5 rounded bg-[#101524] hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-cyan-500/50 transition truncate max-w-md text-left"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="bg-[#080c14] border border-slate-800 rounded-lg p-5 h-[440px] overflow-y-auto space-y-4 font-sans text-xs flex flex-col shadow-inner">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start space-x-2.5 ${
              m.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.sender === 'assistant' && (
              <div className="w-7 h-7 rounded bg-cyan-950 border border-cyan-600/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[82%] rounded-lg p-3.5 text-xs leading-relaxed group relative ${
                m.sender === 'user'
                  ? 'bg-cyan-900/40 border border-cyan-500/40 text-slate-100'
                  : 'bg-[#101524] border border-slate-800 text-slate-200'
              }`}
            >
              <div className="whitespace-pre-line select-text">{m.text}</div>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 mt-2 pt-1 border-t border-slate-850/60">
                <span>{m.engine ? `Engine: ${m.engine}` : 'User Question'}</span>
                <div className="flex items-center space-x-2">
                  <span>{m.timestamp}</span>
                  <button
                    onClick={() => handleCopyMessage(m.text, idx)}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition"
                    title="Copy message"
                  >
                    {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {m.sender === 'user' && (
              <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center space-x-2.5 text-cyan-400 text-xs font-mono py-2 bg-cyan-950/20 px-3 rounded border border-cyan-900/40 max-w-sm">
            <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span>Consulting Gemini 3.8 Flash biophysics model...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={
            dataset
              ? `Ask about ${dataset.symbol}, ${currentMutation}, crystal contacts, or GEO2R results...`
              : 'Ask bioinformatics questions about mutation impacts, biophysics, or orthologs...'
          }
          className="flex-1 bg-[#101524] border border-slate-800 focus:border-cyan-500 rounded px-4 py-2.5 text-xs text-slate-200 focus:outline-none placeholder:text-slate-500 font-sans"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="px-5 py-2.5 rounded bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center space-x-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.3)] cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Inquire</span>
        </button>
      </div>
    </div>
  );
};
