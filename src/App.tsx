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

    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    // 🔥 CANLI SAYFA
    const liveQuery = query(
      collection(db, "updates"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeLive = onSnapshot(liveQuery, (snapshot) => {

      setUpdates(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MatchUpdate))
      );

    });

    // 🔥 LİSTELER SAYFASI
    const listQuery = query(
      collection(db, "lists"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeLists = onSnapshot(listQuery, (snapshot) => {

      setListUpdates(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as MatchUpdate))
      );

    });

    return () => {
      unsubscribeLive();
      unsubscribeLists();
    };

  }, []);

  const getTagColor = (tag: string) => {

    switch (tag) {

      case 'GOAL':
        return 'bg-emerald-950/50 text-emerald-300 border-emerald-900';

      case 'İLK YARI SONUCU':
        return 'bg-blue-950/50 text-blue-300 border-blue-900';

      case 'MAÇ BAŞLADI':
        return 'bg-orange-950/50 text-orange-300 border-orange-900';

      case '2. YARI BAŞLADI':
        return 'bg-amber-950/50 text-amber-300 border-amber-900';

      case 'PENALTI':
        return 'bg-yellow-950/50 text-yellow-300 border-yellow-900';

      case 'VAR':
        return 'bg-cyan-950/50 text-cyan-300 border-cyan-900';

      case 'MAÇ SONUCU':
        return 'bg-purple-950/50 text-purple-300 border-purple-900';

      case 'KIRMIZI KART':
        return 'bg-red-950/50 text-red-300 border-red-900';

      case 'PENALTI KAÇTI':
        return 'bg-orange-950/50 text-orange-300 border-orange-900';

      case 'SON DAKİKA':
        return 'bg-black-950/50 text-white border-gray-900';

      case 'DURDURULDU':
        return 'bg-black-950/50 text-cyan-300 border-gray-900';

      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  const handleUpdate = async () => {

    if (!editId || inputText.trim() === '' || !user) return;

    const collectionName =
      activePage === 'live'
        ? 'updates'
        : 'lists';

    await updateDoc(
      doc(db, collectionName, editId),
      {
        text: inputText
      }
    );

    setEditId(null);
    setInputText('');
  };

  const handleSave = async () => {

    if (inputText.trim() === '' || !user) return;

    // 🔥 DÜZENLEME MODU
    if (editId) {

      const collectionName =
        activePage === 'live'
          ? 'updates'
          : 'lists';

      await updateDoc(
        doc(db, collectionName, editId),
        {
          text: inputText
        }
      );

      setEditId(null);
      setInputText('');

      return;
    }

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

      { phrase: 'penaltıyı kaçırdı.', tag: 'PENALTI KAÇTI', remove: false },

      { phrase: 'SON DAKİKA |', tag: 'SON DAKİKA', remove: true },

      { phrase: 'durduruldu.', tag: 'DURDURULDU', remove: false },

      { phrase: 'VAR', tag: 'VAR', remove: true },

    ];

    for (const trigger of triggers) {

      if (inputText.includes(trigger.phrase)) {

        tag = trigger.tag;

        if (trigger.remove) {
          cleanText = inputText.replace(trigger.phrase, '').trim();
        }

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

    const collectionName =
      activePage === 'live'
        ? 'updates'
        : 'lists';

    await addDoc(collection(db, collectionName), {

      text: cleanText,

      timestamp,

      tag: tag || null,

      createdAt: Date.now()

    });

    setInputText('');
  };

  return (

    <div className="min-h-screen bg-black text-white p-4 font-sans">

      {/* HEADER */}
      <header className="flex justify-between items-center mb-8 w-full">

        <div className="flex items-center gap-4">

          <h1 className="text-3xl font-bold">
            Canlı Maç Anlatımı
          </h1>

          {/* 🔥 LİSTELER BUTONU */}
          <button
            onClick={() => {

              setEditId(null);
              setInputText('');

              setActivePage(
                activePage === 'live'
                  ? 'lists'
                  : 'live'
              );
            }}
            className="bg-neutral-800 hover:bg-neutral-700 px-4 py-2 rounded flex items-center gap-2 text-sm font-bold"
          >
            <List size={18} />

            {activePage === 'live'
              ? 'Listeler'
              : 'Canlı Sayfa'}
          </button>

        </div>

        {user ? (

          <button
            onClick={() => signOut(auth)}
            className="text-sm bg-red-900/50 px-4 py-2 rounded flex items-center gap-2"
          >
            <LogOut size={16} />
            Çıkış Yap
          </button>

        ) : (

          <div className="flex gap-2">

            <input
              type="email"
              placeholder="Email"
              onChange={(e) => setEmail(e.target.value)}
              className="bg-neutral-800 p-2 text-sm rounded w-32"
            />

            <input
              type="password"
              placeholder="Şifre"
              onChange={(e) => setPassword(e.target.value)}
              className="bg-neutral-800 p-2 text-sm rounded w-32"
            />

            <button
              onClick={() =>
                signInWithEmailAndPassword(auth, email, password)
              }
              className="bg-blue-600 px-4 py-2 text-sm rounded flex items-center gap-1 font-bold"
            >
              <LogIn size={16} />
              Giriş
            </button>

          </div>

        )}
      </header>

      <main className="space-y-8 w-full">

        {/* METİN KUTUSU */}
        {user && (

          <div className="w-full bg-neutral-900 p-4 rounded-lg flex gap-3 items-center">

            <div className="flex flex-col gap-2">

              <button
                onClick={() => setInputText((p) => p + '🟨')}
                className="text-2xl hover:bg-neutral-800 p-1 rounded"
              >
                🟨
              </button>

              <button
                onClick={() => setInputText((p) => p + '🟥')}
                className="text-2xl hover:bg-neutral-800 p-1 rounded"
              >
                🟥
              </button>

            </div>

            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {

                if (e.ctrlKey && e.key === 'Enter') {
                  handleSave();
                }

              }}
              className="flex-grow bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-base outline-none resize-none h-24"
              placeholder="Örn: GOAL! Top ağlarda... (Ctrl+Enter ile kaydet)"
            />

            <button
              onClick={editId ? handleUpdate : handleSave}
              className="bg-white text-black px-6 py-3 rounded text-base font-bold self-start hover:bg-neutral-200"
            >
              {editId ? 'Güncelle' : 'Kaydet'}
            </button>

          </div>

        )}

        {/* 🔥 CANLI SAYFA */}
        {activePage === 'live' && (

          <section className="w-full space-y-4">

            {updates.map((update) => (

              <div
                key={update.id}
                className="bg-neutral-900/50 p-5 w-full flex justify-between items-start gap-6"
              >

                <div className="flex items-start gap-4 w-full">

                  <span className="text-sm text-neutral-400 font-mono mt-1 whitespace-nowrap">
                    [{update.timestamp}]
                  </span>

                  <div className="flex-1">

                    <p className="text-lg break-words">

                      {update.tag && (

                        <span
                          className={`inline-block w-40 mr-3 px-3 py-1 rounded text-sm font-bold uppercase text-center ${getTagColor(update.tag)}`}
                        >
                          {update.tag}
                        </span>

                      )}

                      {update.text}

                    </p>

                  </div>

                </div>

                {user && (

                  <div className="flex items-center gap-2">

                    <button
                      onClick={() => {

                        setEditId(update.id);
                        setInputText(update.text);

                      }}
                      className="text-neutral-500 hover:text-yellow-400 p-2"
                    >
                      <Pencil size={20} />
                    </button>

                    <button
                      onClick={() =>
                        deleteDoc(doc(db, "updates", update.id))
                      }
                      className="text-neutral-500 hover:text-red-500 p-2"
                    >
                      <Trash2 size={20} />
                    </button>

                  </div>

                )}

              </div>

            ))}

          </section>

        )}

        {/* 🔥 LİSTELER SAYFASI */}
        {activePage === 'lists' && (

          <section className="w-full overflow-x-auto">

            <div className="flex gap-4 items-start min-w-max">

              {listUpdates.map((update) => (

                <div
                  key={update.id}
                  className="w-[420px] min-h-[220px] bg-neutral-900 border border-neutral-800 rounded-xl p-5 flex flex-col justify-between"
                >

                  <div className="space-y-4">

                    <div className="flex items-center justify-between gap-3">

                      {update.tag && (

                        <span
                          className={`px-3 py-1 rounded text-sm font-bold uppercase text-center ${getTagColor(update.tag)}`}
                        >
                          {update.tag}
                        </span>

                      )}

                      <span className="text-xs text-neutral-500">
                        {update.timestamp}
                      </span>

                    </div>

                    <p className="text-lg break-words leading-relaxed">
                      {update.text}
                    </p>

                  </div>

                  {user && (

                    <div className="flex justify-end gap-2 mt-6">

                      <button
                        onClick={() => {

                          setEditId(update.id);
                          setInputText(update.text);

                        }}
                        className="text-neutral-500 hover:text-yellow-400 p-2"
                      >
                        <Pencil size={20} />
                      </button>

                      <button
                        onClick={() =>
                          deleteDoc(doc(db, "lists", update.id))
                        }
                        className="text-neutral-500 hover:text-red-500 p-2"
                      >
                        <Trash2 size={20} />
                      </button>

                    </div>

                  )}

                </div>

              ))}

            </div>

          </section>

        )}

      </main>

    </div>
  );
}