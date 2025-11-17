"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User,
  getAuth,
} from "firebase/auth";
import { auth, database } from "../firebase";
import { ref, set, runTransaction, onDisconnect,  push, } from "firebase/database";


export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  signup: (email: string, password: string, username: string) => Promise<any>;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
  updateDisplayName: (newDisplayName: string) => Promise<void>;
   addCoins?: (n?: number) => void;
   addScore?: (amount?: number, flushNow?: boolean) => void;

}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

function removeSplashOnce() {
  try {
    const splash = document.getElementById("brainiac-splash");
    if (!splash) return;
    splash.classList.add("hide");
    setTimeout(() => {
      if (splash.parentNode) splash.parentNode.removeChild(splash);
    }, 1120);
  } catch {
    // silent fail — don't crash the app if DOM isn't available
  }
}

async function createSessionOnServer(idToken: string) {
  return fetch("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
    credentials: "same-origin",
  });
}

async function clearServerSession() {
  return fetch("/api/logout", { method: "POST", credentials: "same-origin" });
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Keep the client-side state in sync with Firebase Auth
    const authInstance = getAuth();
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setCurrentUser(user);
      setLoading(false);
      // Small UX: remove splash screen once we know auth state
      setTimeout(removeSplashOnce, 50);
    });
    return () => unsubscribe();
  }, []);


  //coin batching logic
  const pendingCoinsRef = React.useRef<number>(0);
  const flushTimerRef = React.useRef<number | null>(null);
  const isFlushingRef = React.useRef(false);

  const FLUSH_INTERVAL = 3000;
  const FLUSH_IMMEDIATE_THRESHOLD = 5;

  async function flushPendingCoins(uid: string | null) {
    if (!uid) return;
    if (pendingCoinsRef.current <= 0) return;
    if (isFlushingRef.current) return;

    isFlushingRef.current = true;
    const delta = pendingCoinsRef.current;
    pendingCoinsRef.current = 0;

    try {
      const coinRef = ref(database, `users/${uid}/coins`);
      await runTransaction(coinRef, (current) => {
        const cur = typeof current === "number" ? current : parseInt(String(current || "0"), 10) || 0;
        return cur + delta;
      });

      const metaRef = ref(database, `users/${uid}/lastCoinAt`);
      set(metaRef, Date.now()).catch(() => {});
    } catch (err) {
      console.warn("flushPendingCoins failed — re-queueing", err);
      
      pendingCoinsRef.current += delta;
      scheduleFlush(); 
    } finally {
      isFlushingRef.current = false;
    }
  }

  function scheduleFlush() {
    if (flushTimerRef.current) return;
    flushTimerRef.current = window.setTimeout(() => {
      flushTimerRef.current = null;
      const uid = auth.currentUser?.uid ?? null;
      if (uid) flushPendingCoins(uid);
    }, FLUSH_INTERVAL);
  }

  function addCoins(n = 1) {
    const uid = auth.currentUser?.uid ?? null;

    pendingCoinsRef.current += n;

    if (pendingCoinsRef.current >= FLUSH_IMMEDIATE_THRESHOLD && uid) {
      flushPendingCoins(uid);
      return;
    }

    // schedule a regular flush if we have a valid uid
    if (uid) scheduleFlush();
    else {
      try {
        const key = "pending_coins_offline";
        const saved = parseInt(localStorage.getItem(key) || "0", 10) || 0;
        localStorage.setItem(key, String(saved + n));
      } catch (e) { /* ignore */ }
    }
  }

  useEffect(() => {
    const uid = auth.currentUser?.uid ?? null;
    if (!uid) return;
    try {
      const key = "pending_coins_offline";
      const pendingLocal = parseInt(localStorage.getItem(key) || "0", 10) || 0;
      if (pendingLocal > 0) {
        pendingCoinsRef.current += pendingLocal;
        localStorage.removeItem(key);
        flushPendingCoins(uid);
      }
    } catch (e) { /* ignore */ }

    if (pendingCoinsRef.current > 0) flushPendingCoins(uid);

    try {
      const userMetaRef = ref(database, `users/${uid}/lastSeen`);
      onDisconnect(userMetaRef).set(Date.now()).catch(()=>{});
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);

    // --- score-buffer --
  const pendingScoreRef = React.useRef<number>(0);
  const scoreFlushTimerRef = React.useRef<number | null>(null);
  const isScoreFlushingRef = React.useRef(false);

  const SCORE_FLUSH_INTERVAL = 2000; 
  const SCORE_IMMEDIATE_THRESHOLD = 500; 

  async function flushPendingScore(uid: string | null) {
    if (!uid) return;
    if (pendingScoreRef.current <= 0) return;
    if (isScoreFlushingRef.current) return;

    isScoreFlushingRef.current = true;
    const delta = pendingScoreRef.current;
    pendingScoreRef.current = 0;

    try {
      const scoreRef = ref(database, `users/${uid}/totalScore`);
      await runTransaction(scoreRef, (current) => {
        const cur = typeof current === "number" ? current : parseInt(String(current || "0"), 10) || 0;
        return cur + delta;
      });

      const metaRef = ref(database, `users/${uid}/lastScoreAt`);
      set(metaRef, Date.now()).catch(()=>{});
    } catch (err) {
      console.warn("flushPendingScore failed — re-queueing", err);
      // re-queue
      pendingScoreRef.current += delta;
      scheduleScoreFlush();
    } finally {
      isScoreFlushingRef.current = false;
    }
  }

  function scheduleScoreFlush() {
    if (scoreFlushTimerRef.current) return;
    scoreFlushTimerRef.current = window.setTimeout(() => {
      scoreFlushTimerRef.current = null;
      const uid = auth.currentUser?.uid ?? null;
      if (uid) flushPendingScore(uid);
    }, SCORE_FLUSH_INTERVAL);
  }

  function addScore(amount = 0, flushNow = false) {
    if (!amount || amount <= 0) return; // nothing to do

    const uid = auth.currentUser?.uid ?? null;
    pendingScoreRef.current += Math.floor(amount);

    if (flushNow && uid) {
      flushPendingScore(uid);
      return;
    }

    if (pendingScoreRef.current >= SCORE_IMMEDIATE_THRESHOLD && uid) {
      // big enough to flush immediately
      flushPendingScore(uid);
      return;
    }

    if (uid) {
      scheduleScoreFlush();
    } else {
      // not signed in — keep locally for later sync
      try {
        const key = "pending_score_offline";
        const saved = parseInt(localStorage.getItem(key) || "0", 10) || 0;
        localStorage.setItem(key, String(saved + amount));
      } catch (e) { /* ignore */ }
    }
  }

  // when user signs in, flush any local pending score
  useEffect(() => {
    const uid = auth.currentUser?.uid ?? null;
    if (!uid) return;
    try {
      const key = "pending_score_offline";
      const pendingLocal = parseInt(localStorage.getItem(key) || "0", 10) || 0;
      if (pendingLocal > 0) {
        pendingScoreRef.current += pendingLocal;
        localStorage.removeItem(key);
        flushPendingScore(uid);
      }
    } catch (e) { /* ignore */ }

    if (pendingScoreRef.current > 0) flushPendingScore(uid);

    // optional onDisconnect metadata
    try {
      const userMetaRef = ref(database, `users/${uid}/lastSeen`);
      onDisconnect(userMetaRef).set(Date.now()).catch(()=>{});
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.uid]);


  // save a sketch round and optionally bump an aggregate total
async function saveSketchRound(payload: { score: number; hits?: number; createdAt?: number }) {
  if (!auth.currentUser) throw new Error("Not authenticated");
  const uid = auth.currentUser.uid;
  const nodeRef = push(ref(database, `users/${uid}/sketch`));
  const toSave = {
    score: payload.score,
    hits: payload.hits ?? 0,
    createdAt: payload.createdAt ?? Date.now(),
  };
  await set(nodeRef, toSave);

  // Optional: atomically update a totalScore (aggregate)
  try {
    const totalRef = ref(database, `users/${uid}/sketch_total`);
    await runTransaction(totalRef, (current) => {
      return (current || 0) + (toSave.score || 0);
    });
  } catch (err) {
    console.warn("Failed to update sketch_total:", err);
  }

  return nodeRef.key;
}



  async function signup(email: string, password: string, username: string) {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    // Update profile on client
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: username });
      setCurrentUser(auth.currentUser);
    }

    // Optionally write a minimal record to Realtime Database
    try {
      if (auth.currentUser && database) {
        await set(ref(database, `users/${auth.currentUser.uid}`), {
          displayName: username,
          email,
          uid: auth.currentUser.uid,
          createdAt: Date.now(),
        });
      }
    } catch (dbErr) {
      // Don't block signup if DB write fails — log and continue
      console.warn("Failed to write user to DB:", dbErr);
    }

    // Create a server session (session cookie) for SSR-protected pages
    try {
      if (auth.currentUser) {
        const idToken = await auth.currentUser.getIdToken(true);
        const res = await createSessionOnServer(idToken);
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.warn("Server session creation failed", await res.text());
        }
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to create server session:", err);
    }

    return userCred;
  }

  // Login: sign in via Firebase client, create server session
  async function login(email: string, password: string) {
    const userCred = await signInWithEmailAndPassword(auth, email, password);

    if (auth.currentUser) {
      setCurrentUser(auth.currentUser);
      try {
        const idToken = await auth.currentUser.getIdToken(true);
        const res = await createSessionOnServer(idToken);
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.warn("Server session creation failed on login", await res.text());
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Failed to create server session on login:", err);
      }
    }

    return userCred;
  }

  // Logout: clear server session cookie, sign out client
  async function logout() {
    try {
      await clearServerSession(); // clear server cookie
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to clear server session:", err);
    }
    await signOut(auth);
    setCurrentUser(null);
  }

  // Update display name both client-side and optionally server-side DB
  async function updateDisplayName(newDisplayName: string) {
    if (!auth.currentUser) return Promise.reject(new Error("No authenticated user"));
    await updateProfile(auth.currentUser, { displayName: newDisplayName });
    setCurrentUser(auth.currentUser);

    // Optionally update Realtime DB entry
    try {
      if (database) {
        await set(ref(database, `users/${auth.currentUser.uid}`), {
          displayName: newDisplayName,
          email: auth.currentUser.email ?? null,
          uid: auth.currentUser.uid,
          updatedAt: Date.now(),
        });
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to update user in DB:", err);
    }
  }

  const value: AuthContextType & { saveSketchRound?: typeof saveSketchRound }  = {
    currentUser,
    loading,
    signup,
    login,
    logout,
    updateDisplayName,
    addCoins,
    addScore,
    saveSketchRound,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};