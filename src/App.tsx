/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Trash2, LogIn, LogOut } from 'lucide-react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';

type MatchUpdate = {
  id: string;
  text: string;
  timestamp: string;
  tag?: string;
  createdAt: number;
};

export default function App() {
  const [updates, setUpdates] = useState<MatchUpdate[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => setUser(currentUser));

    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchUpdate)));
    });

    return () => unsubscribe();
  }, []);

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

  const handleSave = async () => {
    if (inputText.trim() === '' || !user) return;

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
        if (trigger.remove) cleanText = inputText.replace(trigger.phrase, '').trim();
        break;
      }
    }

    const now = new Date();

    const timestamp =
      `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })}`;

    await addDoc(collection(db, "updates"), {
      text: cleanText,
      timestamp,
      tag: tag || null,
      createdAt: Date.now()
    });

    setInputText('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <header className="max-w-3xl mx-auto mb-8 border-b border-neutral-800 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Canlı Maç Anlatımı</h1>

        {user ? (
          <button
            onClick={() => signOut(auth)}
            className="text-xs bg-red-900/50 px-3 py-1 rounded flex items-center gap-1"
          >
            <LogOut size={14} />Çıkış Yap
          </button>
        ) : (
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-800 p-1 text-xs rounded w-24"
            />
            <input
              type="password"
              placeholder="Şifre"
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-800 p-1 text-xs rounded w-24"
            />
            <button
              onClick={() => signInWithEmailAndPassword(auth, email, password)}
              className="bg-blue-600 px-3 py-1 text-xs rounded flex items-center gap-1"
            >
              <LogIn size={14} />Giriş
            </button>
          </div>
        )}
      </header>

      <main className="space-y-6">
        {user && (
          <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex gap-2 items-center">
            <div className="flex flex-col gap-2">
              <button onClick={() => setInputText((p) => p + '🟨')} className="text-xl hover:bg-neutral-800 p-1 rounded">🟨</button>
              <button onClick={() => setInputText((p) => p + '🟥')} className="text-xl hover:bg-neutral-800 p-1 rounded">🟥</button>
            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => { if (e.ctrlKey && e.key === 'Enter') handleSave(); }}
              className="flex-grow bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm outline-none resize-none h-20"
              placeholder="Örn: GOAL! Top ağlarda... (Ctrl+Enter ile kaydet)"
            />

            <button
              onClick={handleSave}
              className="bg-white text-black px-4 py-2 rounded text-sm font-bold self-start"
            >
              Kaydet
            </button>
          </div>
        )}

        <section className="max-w-3xl mx-auto space-y-3">
          {updates.map((update) => (
            <div
              key={update.id}
              className="bg-neutral-900 border-l-4 border-neutral-700 p-4 rounded-r-lg flex justify-between items-start gap-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-xs text-neutral-500 font-mono mt-1 w-28 text-right">
                  [{update.timestamp}]
                </span>

                <p className="text-sm">
                  {update.tag && (
                    <span className={`inline-block mr-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase w-32 text-center ${getTagColor(update.tag)}`}>
                      {update.tag}
                    </span>
                  )}
                  {update.text}
                </p>
              </div>

              {user && (
                <button
                  onClick={() => deleteDoc(doc(db, "updates", update.id))}
                  className="text-neutral-600 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}