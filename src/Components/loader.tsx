"use client";

import React, { useEffect, useRef, useState } from "react";
import Lottie from "lottie-react";
import styles from "./styles/loader.module.css";
import { FaPlay, FaPause } from "react-icons/fa";

export default function Loader() {
  const [animationData, setAnimationData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true); // shows spinner while true
  const [playing, setPlaying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lottieRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function loadAnimation() {
      setLoading(true);
      setError(null);

      // Try dynamic import from app folder first (works if JSON was placed inside `src/app/lottie/loader.json`)
      try {
        const mod = await import("../app/lottie/loader.json");
        if (!mounted) return;
        const data = (mod && (mod.default ?? mod)) || mod;
        setAnimationData(data);
        // short delay to ensure paint so spinner doesn't flicker
        requestAnimationFrame(() => requestAnimationFrame(() => mounted && setLoading(false)));
        return;
      } catch (err) {
      }

      try {
        const resp = await fetch("/animations/loader.json", { cache: "no-store" });
        if (!mounted) return;
        if (!resp.ok) throw new Error("Failed to fetch Lottie");
        const json = await resp.json();
        setAnimationData(json);
        requestAnimationFrame(() => requestAnimationFrame(() => mounted && setLoading(false)));
        return;
      } catch (err: any) {
        if (!mounted) return;
        setError("Failed to load animation");
        setLoading(false);
      }
    }

    loadAnimation();

    return () => {
      mounted = false;
    };
  }, []);

  // sync playing state to lottie ref
  useEffect(() => {
    try {
      if (playing) lottieRef.current?.play();
      else lottieRef.current?.pause();
    } catch (e) {
      // ignore
    }
  }, [playing]);

  // If user prefers reduced motion — keep playing = false (no autoplay)
  useEffect(() => {
    const mq = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    const setPref = () => {
      if (mq && mq.matches) setPlaying(false);
    };
    setPref();
    if (mq && mq.addEventListener) mq.addEventListener("change", setPref);
    else if (mq && mq.addListener) mq.addListener(setPref);
    return () => {
      if (mq && mq.removeEventListener) mq.removeEventListener("change", setPref);
      else if (mq && mq.removeListener) mq.removeListener(setPref);
    };
  }, []);

  return (
    <div className={styles.loaderWrap} role="status" aria-live="polite">
      {/* cosmic backdrop */}
      <div className={styles.cosmicBg} aria-hidden="true" />

      <div className={styles.centerCard}>
        {/* spinner visible while loading OR when there's an error */}
        {loading && (
          <div className={styles.spinnerWrap} aria-hidden="true">
            <div className={styles.metalSpinner} />
            <div className={styles.spinnerLabel}>Loading</div>
          </div>
        )}

        {/* show a simple error fallback if both methods fail */}
        {!loading && error && (
          <div className={styles.errorFallback}>
            <div className={styles.metalSpinner} />
            <div className={styles.errText}>Could not load animation</div>
          </div>
        )}

        {/* Lottie player (render only when animationData loaded) */}
        {animationData && (
          <div className={styles.playerInner}>
            <div className={styles.lottieWrap}>
              <Lottie
                lottieRef={lottieRef}
                animationData={animationData}
                loop={true}
                autoplay={playing}
                style={{ width: "100%", height: "100%", pointerEvents: "none" }}
              />
            </div>

           
          </div>
        )}
      </div>

      <span className={styles.srOnly}>Loading</span>
    </div>
  );
}
