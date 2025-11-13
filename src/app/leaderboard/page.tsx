"use client";

import React, { useEffect, useMemo, useState } from "react";
import { database } from "../../firebase";
import { ref as dbRef, onValue, off } from "firebase/database";
import styles from "../../Components/styles/leaderboard.module.css";


type RunnerEntry = {
  uid: string;
  displayName: string;
  totalScore: number;
  coins: number;
  runnerScore: number;
};

type SketchRound = {
  uid: string;
  displayName: string;
  score: number;
  hits?: number | null;
  createdAt: number;
  roundId?: string;
};

export default function LeaderboardPage() {
  const [tab, setTab] = useState<"runner" | "sketch">("runner");
  const [loading, setLoading] = useState(true);
  const [runnerList, setRunnerList] = useState<RunnerEntry[]>([]);
  const [sketchRounds, setSketchRounds] = useState<SketchRound[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const usersRef = dbRef(database, "users");

    const unsub = onValue(
      usersRef,
      (snap) => {
        const raw = snap.val();
        if (!raw) {
          setRunnerList([]);
          setSketchRounds([]);
          setLoading(false);
          return;
        }

        const runners: RunnerEntry[] = [];
        const rounds: SketchRound[] = [];

        for (const uid of Object.keys(raw)) {
          const u = raw[uid] || {};
          const displayName = u.displayName || u.name || uid.substring(0, 6);

          const totalScore = Number(u.totalScore || 0);
          const coins = Number(u.coins || 0);
          const runnerScore = totalScore + coins * 10;

          runners.push({ uid, displayName, totalScore, coins, runnerScore });

          if (u.sketch && typeof u.sketch === "object") {
            for (const rndId of Object.keys(u.sketch)) {
              const r = u.sketch[rndId];
              if (!r) continue;
              const s = Number(r.score ?? r.duration ?? 0);
              const createdAt = Number(r.createdAt || 0) || 0;
              if (Number.isFinite(s) && s >= 0) {
                rounds.push({ uid, displayName, score: s, hits: r.hits ?? null, createdAt, roundId: rndId });
              }
            }
          }
        }

        runners.sort((a, b) => b.runnerScore - a.runnerScore);
        rounds.sort((a, b) => b.score - a.score || b.createdAt - a.createdAt);

        setRunnerList(runners);
        setSketchRounds(rounds);
        setLoading(false);
      },
      (err) => {
        console.error("Leaderboard DB read failed:", err);
        setError("Failed to read leaderboard data. Check DB rules or network.");
        setLoading(false);
      }
    );

    return () => {
      try {
        off(usersRef);
      } catch {}
      unsub && unsub();
    };
  }, []);

  const top3Runner = useMemo(() => runnerList.slice(0, 3), [runnerList]);
  const restRunner = useMemo(() => runnerList.slice(3), [runnerList]);
  const top3Sketch = useMemo(() => sketchRounds.slice(0, 3), [sketchRounds]);
  const restSketch = useMemo(() => sketchRounds.slice(3), [sketchRounds]);

  function formatDate(ts: number) {
    if (!ts) return "-";
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return String(ts);
    }
  }

  return (
    <div className={styles.pageWrap}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Leaderboards</h1>
          <p className={styles.subtitle}>Retro cartoonish ranking for Runner & Sketch</p>
        </div>
        <div className={styles.tabs} role="tablist">
          <button className={`${styles.tab} ${tab === "runner" ? styles.active : ""}`} onClick={() => setTab("runner")}>Runner</button>
          <button className={`${styles.tab} ${tab === "sketch" ? styles.active : ""}`} onClick={() => setTab("sketch")}>Sketch</button>
        </div>
      </div>

      {loading && <div className={styles.loading}>Loading leaderboard…</div>}
      {error && <div className={styles.error}>{error}</div>}

      <main className={styles.main}>
        {tab === "runner" && (
          <section className={styles.section}>
            <div className={styles.topGrid}>
              {top3Runner.map((r, i) => (
                <div key={r.uid} className={`${styles.podium} ${styles[`podium${i + 1}`]}`}>
                  <div className={styles.badge}>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</div>
                  <div className={styles.pName}>{r.displayName}</div>
                  <div className={styles.pStat}>Total: <strong>{r.totalScore}</strong></div>
                  <div className={styles.pStat}>Coins: <strong>{r.coins}</strong></div>
                  <div className={styles.rankScore}>{Math.round(r.runnerScore)}</div>
                </div>
              ))}
            </div>

            <div className={styles.listCard}>
              <div className={styles.listHead}>
                
              </div>

              <div className={styles.listBody}>
                {restRunner.map((r, idx) => (
                  <div key={r.uid} className={styles.row}>
                    <div>{idx + 4}</div>
                    <div className={styles.player}>{r.displayName}</div>
                    <div className={styles.right}>{r.totalScore}</div>
                    <div className={styles.right}>{r.coins}</div>
                    <div className={`${styles.right} ${styles.bold}`}>{Math.round(r.runnerScore)}</div>
                  </div>
                ))}

                {runnerList.length === 0 && !loading && <div className={styles.empty}>No runner data available.</div>}
              </div>
            </div>
          </section>
        )}

        {tab === "sketch" && (
          <section className={styles.section}>
            <div className={styles.topGrid}>
              {top3Sketch.map((r, i) => (
                <div key={`${r.uid}-${r.roundId || i}`} className={`${styles.podium} ${styles[`podium${i + 1}`]}`}>
                  <div className={styles.badge}>{i === 0 ? "🏆" : i === 1 ? "🥈" : "🥉"}</div>
                  <div className={styles.pName}>{r.displayName}</div>
                  <div className={styles.pStat}>Round: <strong>{r.score}s</strong></div>
                  <div className={styles.pWhen}>{formatDate(r.createdAt)}</div>
                </div>
              ))}
            </div>

            <div className={styles.listCard}>
              <div className={styles.listHead}>
                <div>#</div>
                <div>Player</div>
                <div className={styles.right}>Score(s)</div>
                <div className={styles.right}>When</div>
                <div className={styles.right}>Hits</div>
              </div>

              <div className={styles.listBody}>
                {sketchRounds.map((r, idx) => (
                  <div key={`${r.uid}-${r.roundId || idx}`} className={styles.row}>
                    <div>{idx + 1}</div>
                    <div className={styles.player}>{r.displayName}</div>
                    <div className={styles.right}>{r.score}s</div>
                    <div className={styles.rightSmall}>{formatDate(r.createdAt)}</div>
                    <div className={styles.right}>{r.hits ?? "-"}</div>
                  </div>
                ))}
                {sketchRounds.length === 0 && !loading && <div className={styles.empty}>No sketch rounds found.</div>}
              </div>
            </div>
          </section>
        )}
      </main>

    </div>
  );
}
