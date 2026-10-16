'use client';

import { useState } from 'react';
import { MessageSquareWarning, Lightbulb } from 'lucide-react';
import PageHeader from '@/components/warga/PageHeader';
import TiketList from '@/components/warga/TiketList';

export default function LayananPage() {
  const [tab, setTab] = useState<'aduan' | 'usulan'>('aduan');

  const tabs = [
    { key: 'aduan' as const, label: 'Aduan', icon: MessageSquareWarning, desc: 'Laporkan keluhan & masalah di lingkungan RT secara privat ke Admin.' },
    { key: 'usulan' as const, label: 'Usulan', icon: Lightbulb, desc: 'Sampaikan ide & usulan pembangunan untuk kemajuan RT.' },
  ];

  const active = tabs.find((t) => t.key === tab)!;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Layanan"
        description="Sampaikan aduan maupun usulan warga kepada pengurus RT, dan pantau perkembangannya."
      />

      {/* Tab switcher */}
      <div className="grid grid-cols-2 gap-3">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-left p-4 rounded-xl border transition ${
                isActive
                  ? 'bg-navy-900 border-navy-900 text-white shadow-pop'
                  : 'bg-surface border-navy-100 text-navy-900 shadow-card hover:border-navy-200'
              }`}
            >
              <Icon size={22} className={isActive ? 'text-accent' : 'text-navy-400'} />
              <span className="block font-display font-bold mt-2.5">{t.label}</span>
              <span className={`block text-xs mt-1 leading-snug ${isActive ? 'text-navy-300' : 'text-navy-500'}`}>
                {t.desc}
              </span>
            </button>
          );
        })}
      </div>

      <TiketList key={tab} tipe={tab} />
    </div>
  );
}