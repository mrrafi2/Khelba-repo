// pages/games/sketch.tsx
"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import React from "react";

const SketchGame = dynamic(() => import("../../SketchGame/SketchGame"), { ssr: false });

type Props = {
  user: { uid: string; email?: string | null; name?: string | null } | null;
} | {}; // Allow empty props

/**
 * Robust extractor: looks for a numeric score inside the gameover panel.
 * Handles <strong>, <span>, or plain text like "You survived 12 seconds".
 */
function parseScoreFromNode(root: ParentNode | null): number | null {
  try {
    if (!root) return null;

    // 1) try strong elements inside .gameover-card
    const strong = (root as Element).querySelector?.(".gameover-card strong");
    if (strong) {
      const t = strong.textContent?.trim() ?? "";
      const n = parseInt(t.replace(/[^\d-]/g, ""), 10);
      if (!Number.isNaN(n)) return n;
    }

    // 2) try any numeric span inside the card
    const span = (root as Element).querySelector?.(".gameover-card span");
    if (span) {
      const t = span.textContent?.trim() ?? "";
      const n = parseInt(t.replace(/[^\d-]/g, ""), 10);
      if (!Number.isNaN(n)) return n;
    }

    // 3) fallback: search card text for the first integer
    const card = (root as Element).querySelector?.(".gameover-card");
    if (card) {
      const txt = card.textContent || "";
      const m = txt.match(/(-?\d{1,7})/);
      if (m) return parseInt(m[1], 10);
    }

    // 4) last resort: whole-root numeric search
    const allText = (root as Element).textContent || "";
    const mm = allText.match(/(-?\d{1,7})/);
    if (mm) return parseInt(mm[1], 10);
  } catch (err) {
    // swallow parse errors; return null to indicate failure
  }
  return null;
}

export default function SketchPage({ user }: Props) {
  const router = useRouter();
  const savedRef = useRef(false); // guard to ensure single save per run
  const containerRef = useRef<HTMLDivElement | null>(null);

  const onGameOver = useCallback(async (score: number) => {
    // mark saved to avoid duplicates
    savedRef.current = true;
    try {
      await fetch("/api/games/save-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ game: "sketch", score }),
        credentials: "same-origin",
      });
    } catch (err) {
      console.error("Save failed:", err);
    }
    // navigate to leaderboard (optional)
    router.push("/leaderboard?game=sketch");
  }, [router]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    // reset guard when mounting / re-entering page
    savedRef.current = false;

    const observer = new MutationObserver((mutations) => {
      if (savedRef.current) return;
      for (const m of mutations) {
        for (const n of Array.from(m.addedNodes)) {
          if (!(n instanceof Element)) continue;
          // If the element or its subtree contains the gameover panel, try parse
          if (n.classList?.contains("gameover-card") || n.querySelector?.(".gameover-card")) {
            const score = parseScoreFromNode(n);
            if (score !== null) {
              onGameOver(score);
              return;
            } else {
              // fallback: try parsing the whole observed root
              const fallback = parseScoreFromNode(root);
              if (fallback !== null) {
                onGameOver(fallback);
                return;
              }
            }
          }
        }
      }

      // also run a safety check: if overlay already in DOM (rare)
      if (!savedRef.current) {
        const maybe = root.querySelector(".gameover-card");
        if (maybe) {
          const score = parseScoreFromNode(root);
          if (score !== null) onGameOver(score);
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    const attrObserver = new MutationObserver(() => {
      if (savedRef.current) return;
      const maybe = root.querySelector(".gameover-card");
      if (maybe) {
        const score = parseScoreFromNode(root);
        if (score !== null) onGameOver(score);
      }
    });
    attrObserver.observe(root, { attributes: true, subtree: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      attrObserver.disconnect();
    };
  }, [onGameOver]);

  return (
    <div style={{ padding: 12 }}>
      <div ref={containerRef}>
        {/* Render existing SketchGame component without changing it */}
        <SketchGame user={user} />
      </div>
    </div>
  );
}
