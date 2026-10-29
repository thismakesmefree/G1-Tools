import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  LayoutDashboard,
  Database,
  Search,
  AlignLeft,
  GitFork,
  Activity,
  Box,
  BarChart2,
  BookOpen,
  MessageSquare,
  History,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

export type ActiveTab =
  | 'suite'
  | 'target'
  | 'blast'
  | 'msa'
  | 'phylo'
  | 'stability'
  | 'pdb'
  | 'geo'
  | 'knowledge'
  | 'ai'
  | 'saved';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  engineMode: 'demo' | 'live';
  onToggleEngine: () => void;
  savedRunsCount: number;
  moleculeType?: 'DNA' | 'PROTEIN';
  onOpenTranslator?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  theme?: 'dark' | 'light';
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  savedRunsCount,
  isCollapsed = false,
  onToggleCollapse,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = isCollapsed ?? internalCollapsed;
  const toggleCollapse = onToggleCollapse ?? (() => setInternalCollapsed(!internalCollapsed));

  const navItems: Array<{
    id: ActiveTab;
    label: string;
    icon: any;
    badge?: string | null;
  }> = [
    { id: 'suite', label: 'Workbench Suite', icon: LayoutDashboard },
    { id: 'pdb', label: '3D AlphaFold & PDB', icon: Box, badge: 'v6' },
    { id: 'target', label: 'Target & Sequence', icon: Database },
    { id: 'stability', label: 'ΔΔG Free Energy', icon: Activity },
    { id: 'blast', label: 'NCBI BLAST+', icon: Search },
    { id: 'msa', label: 'Multi-Alignment', icon: AlignLeft },
    { id: 'phylo', label: 'Phylogenetic Tree', icon: GitFork },
    { id: 'geo', label: 'GEO2R Volcano', icon: BarChart2 },
    { id: 'ai', label: 'AI Co-Scientist', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen },
    {
      id: 'saved',
      label: 'Saved Sessions',
      icon: History,
      badge: savedRunsCount > 0 ? String(savedRunsCount) : null,
    },
  ];

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 224 }}
      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
      className={`shrink-0 border-r flex flex-col justify-between select-none min-h-[calc(100vh-3.5rem)] text-xs overflow-hidden ${
        isLight
          ? 'bg-white border-slate-200 text-slate-700'
          : 'bg-[#0A0B09] border-[#22281E] text-slate-300'
      }`}
    >
      <div className="p-2.5 space-y-2">
        <div className="flex items-center justify-between px-1.5 py-1">
          {!collapsed && (
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-semibold">
              MODULES
            </span>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-1.5 rounded-lg hover:bg-[#161B13] text-slate-400 hover:text-[#76B900] transition cursor-pointer ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`relative w-full flex items-center rounded-xl transition-colors cursor-pointer ${
                  collapsed
                    ? 'justify-center p-2.5'
                    : 'justify-between px-3 py-2 text-[12px]'
                } ${
                  isActive
                    ? isLight
                      ? 'text-slate-900 font-bold'
                      : 'text-white font-semibold'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-slate-400 hover:text-white hover:bg-[#121610]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebarActivePill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className={`absolute inset-0 rounded-xl border ${
                      isLight
                        ? 'bg-[#76B900]/15 border-[#76B900]/40'
                        : 'bg-[#76B900]/15 border-[#76B900]/50 shadow-[0_0_14px_rgba(118,185,0,0.18)]'
                    }`}
                  />
                )}
                <div className="relative z-10 flex items-center space-x-2.5 truncate">
                  <Icon
                    className={`shrink-0 ${collapsed ? 'w-4 h-4' : 'w-4 h-4'} ${
                      isActive ? 'text-[#76B900]' : 'text-slate-400'
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!collapsed && item.badge && (
                  <span className="relative z-10 text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#76B900]/20 text-[#8ED600] border border-[#76B900]/40 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {!collapsed && (
        <div
          className={`p-3 border-t text-[10px] font-mono flex items-center justify-between ${
            isLight ? 'border-slate-200 text-slate-500' : 'border-[#22281E] text-slate-500'
          }`}
        >
          <span>AlphaFold DB</span>
          <span className="text-[#76B900] font-bold">v6 WebGL Active</span>
        </div>
      )}
    </motion.aside>
  );
};
