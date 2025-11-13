import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef } from "react";

const RunnerGame = dynamic(() => import("../RunnerGame/RunnerGame"), { ssr: false });

type UserType =
  | {
      uid: string;
      email?: string | null;
      name?: string | null;
    }
  | null;

type Props = {
  user?: UserType;
};

export default function RunnerPage({ user }: Props) {
  const router = useRouter();
  const savedRef = useRef<boolean>(false);

  const onRoundEnd = useCallback(
    async (data: { score: number; coins: number }) => {
      if (savedRef.current) return;
      savedRef.current = true;

      try {
        const payload = {
          game: "runner",
          score: data.score ?? 0,
          coins: data.coins ?? 0,
          uid: user?.uid ?? null,
        };

        const res = await fetch("/api/games/save-score", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        });

        if (!res.ok) {
          console.warn("Save-score responded with non-OK status", res.status);
        }
      } catch (err) {
        console.error("Failed to save round result:", err);
      }

   
    },
    [router, user]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new MutationObserver((mutations: MutationRecord[]) => {
      if (savedRef.current) return;

      for (const m of mutations) {
        for (const node of Array.from(m.addedNodes)) {
          if (!(node instanceof Element)) continue;
          const el = node as Element;

          if (el.classList?.contains("gameover-card") || el.querySelector?.(".gameover-card")) {
            try {
              const strong = el.querySelector("strong");
              const txt = strong?.textContent?.trim() ?? "";
              const score = parseInt(txt.replace(/[^0-9]/g, "")) || 0;

              let coins = 0;
              const coinsEl = el.querySelector(".coins");
              if (coinsEl) coins = parseInt((coinsEl.textContent || "").replace(/[^0-9]/g, "")) || 0;

              onRoundEnd({ score, coins });
              return;
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    });

    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [onRoundEnd]);

  return (
    <div >
      <div ref={containerRef}>
        <RunnerGame user={user ?? null} onRoundEnd={onRoundEnd} />
      </div>
    </div>
  );
}
