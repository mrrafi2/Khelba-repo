"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "../../Components/styles/gamespage.module.css";

type GameDef = {
  slug: string;
  title: string;
  images: string[];
  description: string;
  score?: number | null;
  isNew?: boolean;
};

const GAMES: GameDef[] = [
  {
    slug: "runner",
    title: "Runner",
    images: [
      "/assets/games/runner/shot-1.jpg",
      "/assets/games/runner/shot-2.jpg",
      "/assets/games/runner/shot-3.jpg",
    ],
    description: "Fast-paced retro runner — dodge obstacles, collect coins, climb leaderboards.",
    score: 123,
    isNew: false,
  },
  {
    slug: "sketch",
    title: "Sketch Shield",
    images: [
      "/assets/games/sketch/shot-1.jpg",
      "/assets/games/sketch/shot-2.jpg",
    ],
    description: "Draw shields to protect the hero. Skillful anchoring wins matches.",
    score: 74,
    isNew: true,
  },
  // add more game definitions here as you expand
];

function useAutoAdvance(length: number, delay = 4200) {
  const [idx, setIdx] = useState(0);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (length <= 1) return;
    timer.current = window.setInterval(() => setIdx((i) => (i + 1) % length), delay) as unknown as number;
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [length, delay]);

  return [idx, setIdx] as const;
}

function GameCard({ g }: { g: GameDef }) {
  const [slide, setSlide] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (!playing || hover) return;
    const id = window.setInterval(() => setSlide((s) => (s + 1) % g.images.length), 3500);
    return () => window.clearInterval(id);
  }, [g.images.length, playing, hover]);

  return (
    <article className={styles.card} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <Link href={`/games/${g.slug}`} className={styles.mediaLink} aria-label={`Play ${g.title}`}>
        <div className={styles.media}>
          <div className={styles.carousel} role="list">
            {g.images.map((src, i) => (
              <div
                key={src}
                role="listitem"
                className={`${styles.slide} ${i === slide ? styles.active : ""}`}
                aria-hidden={i === slide ? "false" : "true"}
              >
                {/* next/image with layout fill for responsive covers */}
                <Image src={src} alt={`${g.title} screenshot ${i + 1}`} fill sizes="(max-width:600px) 280px, 420px" className={styles.image} priority={i === 0} />
              </div>
            ))}
          </div>

          <div className={styles.overlay}>
            <div className={styles.playBadge} aria-hidden>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
              </svg>
            </div>

            <div className={styles.ribbons}>
              {g.isNew && <span className={styles.newBadge}>NEW</span>}
              {typeof g.score === "number" && <span className={styles.scoreBadge}>★ {g.score}</span>}
            </div>

            <div className={styles.controls}>
              <button
                className={styles.ctrlBtn}
                aria-label="previous image"
                onClick={(e) => {
                  e.preventDefault();
                  setSlide((s) => (s - 1 + g.images.length) % g.images.length);
                }}
              >
                ‹
              </button>
              <button
                className={styles.ctrlBtn}
                aria-label={playing ? "pause slideshow" : "play slideshow"}
                onClick={(e) => {
                  e.preventDefault();
                  setPlaying((p) => !p);
                }}
              >
                {playing ? "❚❚" : "▶"}
              </button>
              <button
                className={styles.ctrlBtn}
                aria-label="next image"
                onClick={(e) => {
                  e.preventDefault();
                  setSlide((s) => (s + 1) % g.images.length);
                }}
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </Link>

      <div className={styles.body}>
        <h3 className={styles.title}>{g.title}</h3>
        <p className={styles.desc}>{g.description}</p>
        <div className={styles.metaRow}>
          <Link href={`/games/${g.slug}`} className={styles.playLink}>
            Play now
          </Link>

          <Link href={`/games/${g.slug}#info`} className={styles.detailsLink}>
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function GamesPage(): JSX.Element {
  // hero carousel: featured shots of games
  const heroImages = GAMES.flatMap((g) => g.images.slice(0, 1)).filter(Boolean);
  const [heroIdx] = useAutoAdvance(heroImages.length || 1, 4800);

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroText}>
            <h1 className={styles.hTitle}>Games — pick your play</h1>
            <p className={styles.hLead}>Short sessions, big personality. Tap a card to jump straight into the action.</p>
          </div>
    </div>
      </header>

      <section className={styles.grid} aria-label="Available games">
        {GAMES.map((g) => (
          <GameCard key={g.slug} g={g} />
        ))}
      </section>

      <footer className={styles.footer}>
        <div>Find more in the <Link href="/leaderboard">Leaderboard</Link> and your profile.</div>
      </footer>
    </main>
  );
}
