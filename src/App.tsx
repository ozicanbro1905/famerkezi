/**
 * @license
 * SPDX-License-Identifier: Apache-2.0 
 */

import { useState, useEffect } from 'react';
import { Trash2, LogIn, LogOut, Pencil, List } from 'lucide-react';
import { auth, db } from './firebase';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User
} from "firebase/auth";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';

type MatchUpdate = {
  id: string;
  text: string;
  timestamp: string;
  tag?: string;
  createdAt: number;
};

const LIVE_TRIGGERS = [
  { phrase: 'maçı başladı.', tag: 'MAÇ BAŞLADI', remove: true },
  { phrase: 'İLK YARI SONUCU', tag: 'İLK YARI SONUCU', remove: true },
  { phrase: '2. YARI BAŞLADI', tag: '2. YARI BAŞLADI', remove: true },
  { phrase: 'MAÇ SONUCU', tag: 'MAÇ SONUCU', remove: true },
  { phrase: 'GOAL!', tag: 'GOAL', remove: true },
  { phrase: '🟥', tag: 'KIRMIZI KART', remove: true },
  { phrase: 'penaltı kazandı.', tag: 'PENALTI', remove: false },
  { phrase: 'penaltıyı kaçırdı.', tag: 'PENALTI KAÇTI', remove: false },
  { phrase: 'SON DAKİKA |', tag: 'SON DAKİKA', remove: true },
  { phrase: 'durduruldu.', tag: 'DURDURULDU', remove: false },
  { phrase: 'VAR', tag: 'VAR', remove: true },
];

const LIST_TRIGGERS = [
  { phrase: 'SONUÇLAR', tag: 'SONUÇLAR', remove: false },
  { phrase: 'MAÇLAR', tag: 'MAÇLAR', remove: false },
  { phrase: 'PUAN DURUMU', tag: 'PUAN DURUMU', remove: false },
  { phrase: 'GOL KRALLIĞI', tag: 'GOL KRALLIĞI', remove: false },
  { phrase: 'ASİST KRALLIĞI', tag: 'ASİST KRALLIĞI', remove: false },
  { phrase: 'PERFORMANSLAR', tag: 'PERFORMANSLAR', remove: false },
];

export default function App() {
  const [updates, setUpdates] = useState<MatchUpdate[]>([]);
  const [listUpdates, setListUpdates] = useState<MatchUpdate[]>([]);
  const [inputText, setInputText] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<'live' | 'lists'>('live');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, setUser);

    const liveQuery = query(
      collection(db, "updates"),
      orderBy("createdAt", "desc")
    );

    const listQuery = query(
      collection(db, "lists"),
      orderBy("createdAt", "desc")
    );

    const unsubLive = onSnapshot(liveQuery, snap =>
      setUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchUpdate)))
    );

    const unsubLists = onSnapshot(listQuery, snap =>
      setListUpdates(snap.docs.map(d => ({ id: d.id, ...d.data() } as MatchUpdate)))
    );

    return () => {
      unsubAuth();
      unsubLive();
      unsubLists();
    };
  }, []);

  const getTagColor = (tag?: string) => {
    switch (tag) {
      case 'GOAL': return 'bg-emerald-950/50 text-emerald-300 border-emerald-900';
      case 'İLK YARI SONUCU': return 'bg-blue-950/50 text-blue-300 border-blue-900';
      case 'MAÇ BAŞLADI': return 'bg-orange-950/50 text-orange-300 border-orange-900';
      case '2. YARI BAŞLADI': return 'bg-amber-950/50 text-amber-300 border-amber-900';
      case 'PENALTI': return 'bg-yellow-950/50 text-yellow-300 border-yellow-900';
      case 'VAR': return 'bg-cyan-950/50 text-cyan-300 border-cyan-900';
      case 'MAÇ SONUCU': return 'bg-purple-950/50 text-purple-300 border-purple-900';
      case 'KIRMIZI KART': return 'bg-red-950/50 text-red-300 border-red-900';
      case 'PENALTI KAÇTI': return 'bg-orange-950/50 text-orange-300 border-orange-900';
      case 'SON DAKİKA': return 'bg-neutral-950/50 text-white border-neutral-900';
      case 'DURDURULDU': return 'bg-neutral-950/50 text-cyan-300 border-neutral-900';
      default: return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const parseText = (text: string, page: 'live' | 'lists') => {
    const triggers = page === 'live' ? LIVE_TRIGGERS : LIST_TRIGGERS;

    let clean = text;
    let tag: string | undefined;

    for (const t of triggers) {
      if (text.includes(t.phrase)) {
        tag = t.tag;
        if (t.remove) clean = text.replace(t.phrase, '').trim();
        break;
      }
    }

    return { clean, tag };
  };

  const timestamp = () => {
    const now = new Date();
    return `${now.toLocaleDateString('tr-TR')} ${now.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })}`;
  };

  const handleSave = async () => {
    if (!inputText.trim() || !user) return;

    const collectionName = activePage === 'live' ? 'updates' : 'lists';

    if (editId) {
      await updateDoc(doc(db, collectionName, editId), {
        text: inputText
      });

      setEditId(null);
      setInputText('');
      return;
    }

    const { clean, tag } =
      parseText(inputText, activePage);

    await addDoc(collection(db, collectionName), {
      text: clean,
      timestamp: timestamp(),
      tag: tag || null,
      createdAt: Date.now()
    });

    setInputText('');
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 font-sans">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Canlı Maç Anlatımı</h1>

        <button
          onClick={() => {
            setEditId(null);
            setInputText('');
            setActivePage(p => p === 'live' ? 'lists' : 'live');
          }}
          className="bg-neutral-800 px-4 py-2 rounded flex items-center gap-2"
        >
          <List size={18} />
          {activePage === 'live' ? 'Listeler' : 'Canlı'}
        </button>

        {user ? (
          <button onClick={() => signOut(auth)} className="bg-red-800 px-3 py-2 rounded">
            Çıkış
          </button>
        ) : (
          <div className="flex gap-2">
            <input onChange={e => setEmail(e.target.value)} placeholder="Email" />
            <input onChange={e => setPassword(e.target.value)} placeholder="Şifre" />
            <button onClick={() => signInWithEmailAndPassword(auth, email, password)}>
              Giriş
            </button>
          </div>
        )}
      </header>

      {/* INPUT */}
      {user && (
        <div className="flex gap-2 mb-6">
          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            className="flex-1 bg-neutral-900 p-3"
          />

          <button onClick={handleSave} className="bg-white text-black px-4">
            {editId ? 'Güncelle' : 'Kaydet'}
          </button>
        </div>
      )}

      {/* LIVE */}
      {activePage === 'live' && (
        updates.map(item => (
          <div key={item.id} className="bg-neutral-900 p-3 mb-2 flex justify-between">
            <div>
              <span className={getTagColor(item.tag)}>{item.tag}</span>
              <span className="ml-2">{item.text}</span>
            </div>

            {user && (
              <div className="flex gap-2">
                <button onClick={() => {
                  setEditId(item.id);
                  setInputText(item.text);
                }}>
                  <Pencil />
                </button>

                <button onClick={() =>
                  deleteDoc(doc(db, "updates", item.id))
                }>
                  <Trash2 />
                </button>
              </div>
            )}
          </div>
        ))
      )}

      {/* LISTS */}
      {activePage === 'lists' && (
        listUpdates.map(item => (
          <div key={item.id} className="bg-neutral-900 p-3 mb-2 flex justify-between">
            <div>
              <span className={getTagColor(item.tag)}>{item.tag}</span>
              <span className="ml-2">{item.text}</span>
            </div>

            {user && (
              <div className="flex gap-2">
                <button onClick={() => {
                  setEditId(item.id);
                  setInputText(item.text);
                }}>
                  <Pencil />
                </button>

                <button onClick={() =>
                  deleteDoc(doc(db, "lists", item.id))
                }>
                  <Trash2 />
                </button>
              </div>
            )}
          </div>
        ))
      )}

    </div>
  );
}