/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Trash2, Lock, LogOut } from 'lucide-react';
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
  const[inputText, setInputText] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const[email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 1. Auth durumunu takip et
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  },[]);

  // 2. Verileri çek
  useEffect(() => {
    const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MatchUpdate)));
    });
    return () => unsubscribe();
  },