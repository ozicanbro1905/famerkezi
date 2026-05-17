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

  const handleLogin = async () => {
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { alert("Giriş başarısız!"); }
  };

  const handleSave = async () => {
    if (inputText.trim() === '' || !user) return;
    await addDoc(collection(db, "updates"), {
      text: inputText,
      timestamp: new Date().toLocaleString('tr-TR'),
      createdAt: Date.now()
    });
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 font-sans">
      <header className="max-w-3xl mx-auto mb-8 border-b border-neutral-800 pb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Canlı Maç Anlatımı</h1>
        {user ? (
          <button onClick={() => signOut(auth)} className="text-xs bg-red-900/50 px-3 py-1 rounded flex items-center gap-1"><LogOut size={14} />Çıkış Yap</button>
        ) : (
          <div className="flex gap-2">
            <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} className="bg-neutral-800 p-1 text-xs rounded w-24" />
            <input type="password" placeholder="Şifre" onChange={(e) => setPassword(e.target.value)} className="bg-neutral-800 p-1 text-xs rounded w-24" />
            <button onClick={handleLogin} className="bg-blue-600 px-3 py-1 text-xs rounded flex items-center gap-1"><LogIn size={14} />Giriş</button>
          </div>
        )}
      </header>

      <main className="space-y-6">
        {user && (
          <div className="max-w-3xl mx-auto bg-neutral-900 border border-neutral-800 p-4 rounded-lg flex gap-2">
            <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className="flex-grow bg-neutral-950 border border-neutral-800 rounded px-3 py-2 text-sm outline-none" placeholder="Yeni bir gelişme yaz..." />
            <button onClick={handleSave} className="bg-white text-black px-4 py-2 rounded text-sm font-bold">Kaydet</button>
          </div>
        )}

        <section className="max-w-3xl mx-auto space-y-3">
          {updates.map((update) => (
            <div key={update.id} className="bg-neutral-900 border-l-4 border-neutral-700 p-4 rounded-r-lg flex justify-between items-center">
              <p className="text-sm">{update.text} <span className="text-neutral-500 text-xs ml-2">[{update.timestamp}]</span></p>
              {user && <button onClick={() => deleteDoc(doc(db, "updates", update.id))} className="text-red-500"><Trash2 size={16} /></button>}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}