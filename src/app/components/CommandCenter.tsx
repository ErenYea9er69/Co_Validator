import React from 'react';

export type TabId = 'dossier' | 'scoreboard' | 'sprint' | 'assumptions' | 'competitors' | 'benchmarks' | 'pitchdeck' | 'pivot' | 'investor';

interface CommandCenterProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'scoreboard', label: 'Scoreboard', icon: '📊' },
  { id: 'dossier', label: 'Full Dossier', icon: '📋' },
  { id: 'sprint', label: 'Sprint Plan', icon: '🎯' },
  { id: 'assumptions', label: 'Assumptions', icon: '🧪' },
  { id: 'competitors', label: 'Competitors', icon: '🔭' },
  { id: 'benchmarks', label: 'Benchmarks', icon: '📈' },
  { id: 'pitchdeck', label: 'Pitch Deck', icon: '🎤' },
  { id: 'pivot', label: 'Pivot Lab', icon: '🔄' },
  { id: 'investor', label: 'Investor Match', icon: '💰' },
];

export default function CommandCenter({ activeTab, setActiveTab }: CommandCenterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8 animate-fade-in print:hidden justify-center bg-black/40 p-2 rounded-2xl border border-white/5 mx-auto max-w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            activeTab === tab.id
              ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              : 'bg-white/5 text-gray-500 hover:bg-white/10 hover:text-gray-300'
          }`}
        >
          <span className="text-base">{tab.icon}</span>
          <span className="hidden md:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
