/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

type MatchUpdate = {
  id: number;
  text: string;
  timestamp: string;
  tag?: string;
};

export default function App() {
  const [updates, setUpdates] = useState<MatchUpdate[]>(() => {
    const saved = localStorage.getItem('matchUpdates');
    return saved ? JSON.parse(saved) : [];
  });
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    localStorage.setItem('matchUpdates', JSON.stringify(updates));
  }, [updates]);

  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'GOAL': return 'bg-emerald-950/50 text-emerald-300 border-emerald-900';
      case 'İLK YARI SONUCU': return 'bg-blue-950/50 text-blue-300 border-blue-900';
      case 'MAÇ BAŞLADI': return 'bg-orange-950/50 text-orange-300 border-orange-900';
      case '2. YARI BAŞLADI': return 'bg-amber-950/50 text-amber-300 border-amber-900';
      case 'PENALTI': return 'bg-yellow-950/50 text-yellow-300 border-yellow-900';
      case 'VAR': return 'bg-cyan-950/50 text-cyan-300 border-cyan-900';
      case 'MAÇ SONUCU': return 'bg-purple-950/50 text-purple-300 border-purple-900';
      case 'KIRMIZI KART': return 'bg-red-950/50 text-red-300 border-red-900';
      default: return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const handleSave = () => {
    if (inputText.trim() === '') return;

    let tag: string | undefined;
    let cleanText = inputText;

    const triggers = [
      { phrase: 'maçı başladı.', tag: 'MAÇ BAŞLADI', remove: true },
      { phrase: '(İLK YARI SONUCU)', tag: 'İLK YARI SONUCU', remove: true },
      { phrase: 'İLK YARI SONUCU', tag: 'İLK YARI SONUCU', remove: true },
      { phrase: '(2. YARI BAŞLADI)', tag: '2. YARI BAŞLADI', remove: true },
      { phrase: '2. YARI BAŞLADI', tag: '2. YARI BAŞLADI', remove: true },
      { phrase: '(MAÇ SONUCU)', tag: 'MAÇ SONUCU', remove: true },
      { phrase: 'MAÇ SONUCU', tag: 'MAÇ SONUCU', remove: true },
      { phrase: 'GOAL!', tag: 'GOAL', remove: true },
      { phrase: '🟥', tag: 'KIRMIZI KART', remove: true },
      { phrase: 'penaltı kazandı.', tag: 'PENALTI', remove: false },
      { phrase: 'VAR', tag: 'VAR', remove: true },
    ];

    for (const trigger of triggers) {
      if (inputText.includes(trigger.phrase)) {
        tag = trigger.tag;
        if (trigger.remove) {
          cleanText = inputText.replace(trigger.phrase, '').trim();
        } else {
          cleanText = inputText;
        }
        break;
      }
    }

    const newUpdate: MatchUpdate = {
      id: Date.now(),
      text: cleanText,
      timestamp: new Date().toLocaleString('tr-TR'),
      tag,
    };

    setUpdates([newUpdate, ...updates]);
    setInputText('');
  };

  const handleDelete = (id: number) => {
    setUpdates(updates.filter((update) => update.id !== id));
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <header className="max-w-3xl mx-auto mb-8 border-b border-neutral-800 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-white">Canlı Maç Anlatımı</h1>
      </header>

      <main className="space-y-6">
        <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex gap-2 items-center">
          <button onClick={() => setInputText((prev) => prev + '🟨')} className="cursor-pointer hover:bg-neutral-800 p-1 rounded">🟨</button>
          <button onClick={() => setInputText((prev) => prev + '🟥')} className="cursor-pointer hover:bg-neutral-800 p-1 rounded">🟥</button>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.ctrlKey && e.key === 'Enter') {
                handleSave();
              }
            }}
            placeholder="Maçtan önemli bir anı yazın..."
            className="flex-grow bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm focus:ring-1 focus:ring-neutral-600 outline-none resize-none h-20"
          />
          <button
            onClick={handleSave}
            className="bg-white text-black font-medium px-4 py-2 rounded text-sm hover:bg-neutral-200 self-start"
          >
            Kaydet
          </button>
        </div>

        <section className="space-y-3 px-6">
          {updates.length === 0 ? (
            <p className="text-neutral-500 text-center py-10 text-sm">Henüz bir anlatım girilmedi.</p>
          ) : (
            updates.map((update) => (
              <div
                key={update.id}
                className="bg-neutral-900 border-l-4 border-neutral-600 p-4 rounded-r-lg flex items-start justify-between gap-4 animate-in fade-in slide-in-from-left-2 duration-300"
              >
                <div className="flex items-start gap-4">
                  <span className="font-mono text-xs text-neutral-400 mt-0.5 whitespace-nowrap w-40">
                    [{update.timestamp}]
                  </span>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {update.tag && (
                      <span className={`font-bold mr-2 border rounded px-1.5 py-0.5 text-[0.7rem] uppercase tracking-wider w-32 inline-block text-center ${getTagColor(update.tag)}`}>
                        {update.tag}
                      </span>
                    )}
                    {update.text}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(update.id)}
                  className="text-neutral-600 hover:text-red-500 transition-colors"
                  aria-label="Sil"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
