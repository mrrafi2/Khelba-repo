import React, { useEffect, useRef, useState } from "react";
import { CHAR_LIST, MAP_LIST } from "./config";
import type { CharacterKey, MapKey } from "./config";
import { useAuth } from "../../../context/AuthContext";
import { database } from "../../../firebase";
import { ref as dbRef, onValue } from "firebase/database";


type Props = {
  selectedChar: CharacterKey;
  selectedMap: MapKey;
  onChangeChar: (c: CharacterKey) => void;
  onChangeMap: (m: MapKey) => void;
  onStart: () => void;
};

function useSwipe(
  ref: React.RefObject<HTMLDivElement>,
  onLeft: () => void,
  onRight: () => void
) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX: number | null = null;
    function handleTouchStart(e: TouchEvent) {
      startX = e.touches[0].clientX;
    }
    function handleTouchEnd(e: TouchEvent) {
      if (startX == null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 36) {
        dx < 0 ? onRight() : onLeft();
      }
      startX = null;
    }
    el.addEventListener("touchstart", handleTouchStart);
    el.addEventListener("touchend", handleTouchEnd);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [ref, onLeft, onRight]);
}

function useSlider<T>(list: T[], selectedKey: string) {
  const idx = list.findIndex((c: any) => c.key === selectedKey);
  const [current, setCurrent] = useState(idx >= 0 ? idx : 0);
  useEffect(() => {
    setCurrent(idx >= 0 ? idx : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey, list]);
  const goPrev = () => setCurrent((i) => Math.max(0, i - 1));
  const goNext = () => setCurrent((i) => Math.min(list.length - 1, i + 1));
  return { current, setCurrent, goPrev, goNext };
}

export default function GameMenu({
  selectedChar,
  selectedMap,
  onChangeChar,
  onChangeMap,
  onStart,
}: Props) {
  const charSlider = useSlider(CHAR_LIST, selectedChar);
  const mapSlider = useSlider(MAP_LIST, selectedMap);

  const [menuLoading, setMenuLoading] = useState(true);
  const [menuLoadProgress, setMenuLoadProgress] = useState(0);
  const loaderCancelRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  const charTrackRef = useRef<HTMLDivElement>(null);
  const mapTrackRef = useRef<HTMLDivElement>(null);

  // unique selection panel refs
  const charPanelRef = useRef<HTMLDivElement>(null);
  const mapPanelRef = useRef<HTMLDivElement>(null);

    // Auth + DB: realtime read of user's total coins
  const { currentUser } = useAuth();
  const [totalCoins, setTotalCoins] = useState<number | null>(null);
  const coinsLoadingRef = useRef(true);

  useEffect(() => {
    const uid = currentUser?.uid ?? null;
    if (!uid) {
      setTotalCoins(null);
      coinsLoadingRef.current = false;
      return;
    }

    coinsLoadingRef.current = true;
    const r = dbRef(database, `users/${uid}/coins`);
    const unsub = onValue(r, (snap) => {
      const v = snap.val();
      const parsed = typeof v === "number" ? v : parseInt(String(v || "0"), 10) || 0;
      setTotalCoins(parsed);
      coinsLoadingRef.current = false;
    }, (err) => {
      console.warn('coin listener error', err);
      setTotalCoins(0);
      coinsLoadingRef.current = false;
    });

    return () => unsub();
  }, [currentUser?.uid]);


  const centerSelected = (
    trackRef: React.RefObject<HTMLDivElement>,
    currentIdx: number
  ) => {
    const track = trackRef.current;
    if (!track) return;
    const viewport = track.parentElement as HTMLElement | null;
    if (!viewport) return;
    const items = Array.from(track.children) as HTMLElement[];
    if (items.length === 0) return;
    const itemRect = items[0].getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(track).gap || "14") || 14;
    const itemW = itemRect.width;
    const totalOffset = currentIdx * (itemW + gap);
    // We want the selected item centered in the viewport
    const viewportCenter = viewport.clientWidth / 2;
    const transformX = viewportCenter - itemW / 2 - totalOffset;
    track.style.transform = `translateX(${transformX}px)`;
  };

  useEffect(() => {
    centerSelected(charTrackRef, charSlider.current);
  }, [charSlider.current]);

  useEffect(() => {
    centerSelected(mapTrackRef, mapSlider.current);
  }, [mapSlider.current]);

  useEffect(() => {
    const onResize = () => {
      centerSelected(charTrackRef, charSlider.current);
      centerSelected(mapTrackRef, mapSlider.current);
    };
    window.addEventListener("resize", onResize);
    onResize();
    return () => window.removeEventListener("resize", onResize);
  }, [charSlider.current, mapSlider.current]);

  // preload a single image and resolve when done (or onerror)
  function preloadImage(src: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve();
      img.onerror = () => resolve(); // resolve on error to avoid blocking
      img.src = src;
    });
  }

  async function preloadMenuAssets(showLoader = true) {
    // cancel any previous run
    loaderCancelRef.current.cancelled = false;
    if (showLoader) {
      setMenuLoading(true);
      setMenuLoadProgress(0);
    }

    const charSrcs = CHAR_LIST.map((c) => c.preview);
    const mapSrcs = MAP_LIST.map((m) => m.preview);
    const all = Array.from(new Set([...charSrcs, ...mapSrcs])); // unique

    let done = 0;
    const total = all.length || 1;

    for (const src of all) {
      if (loaderCancelRef.current.cancelled) break;

      // small per-image timeout fallback to avoid hanging forever
      await Promise.race([
        preloadImage(src),
        new Promise<void>((res) => setTimeout(res, 3000)), // 3s fallback
      ]);
      done++;
      setMenuLoadProgress(Math.round((done / total) * 100));
    }

    if (!loaderCancelRef.current.cancelled) {
      setMenuLoadProgress(100);
      await new Promise((r) => setTimeout(r, 120));
      setMenuLoading(false);
    } else {
      setMenuLoading(false);
    }
  }

  // ---------- helpers: change selection AND notify parent ----------
  // These must live inside the component so they can access charSlider, mapSlider, onChangeChar etc.
  const lastCharRef = useRef<string | null>(null);
  const lastMapRef = useRef<string | null>(null);

  function selectCharIndex(newIndex: number) {
    const idx = Math.max(0, Math.min(CHAR_LIST.length - 1, newIndex));
    charSlider.setCurrent(idx);
    const key = CHAR_LIST[idx].key;
    if (lastCharRef.current !== key) {
      lastCharRef.current = key;
      onChangeChar(key);
    }
    centerSelected(charTrackRef, idx);
  }
  function prevChar() {
    selectCharIndex(charSlider.current - 1);
  }
  function nextChar() {
    selectCharIndex(charSlider.current + 1);
  }

  function selectMapIndex(newIndex: number) {
    const idx = Math.max(0, Math.min(MAP_LIST.length - 1, newIndex));
    mapSlider.setCurrent(idx);
    const key = MAP_LIST[idx].key;
    if (lastMapRef.current !== key) {
      lastMapRef.current = key;
      onChangeMap(key);
    }
    centerSelected(mapTrackRef, idx);
  }
  function prevMap() {
    selectMapIndex(mapSlider.current - 1);
  }
  function nextMap() {
    selectMapIndex(mapSlider.current + 1);
  }

  // wire swipes to wrappers so swiping also notifies parent
  useSwipe(charTrackRef, prevChar, nextChar);
  useSwipe(mapTrackRef, prevMap, nextMap);

  // Inject retro-dark styles
  useEffect(() => {
    const id = "gm-retro-styles";
    if (document.getElementById(id)) return;
    const style = document.createElement("style");
    style.id = id;
    style.innerHTML = `
      /* Retro cartoonish dark theme */
      :root{ --bg:#0b0f1a; --panel:#0f1724; --muted:#9aa6b2; --neon:#ffd23f; --accent1:#ff6b6b; --accent2:#6be4ff; }

      .game-menu{ display:flex; gap:20px; padding:28px; justify-content:center; align-items:flex-start; flex-wrap:wrap; width:90%; box-sizing:border-box; background: linear-gradient(180deg, rgba(8,10,14,0.8), rgba(3,5,9,0.9)); }

      .top-bar{ position:absolute; right:18px; top:14px; display:flex; gap:12px; align-items:center; z-index:130 }
.coin-badge{ display:flex; align-items:center; gap:10px; padding:8px 12px; border-radius:28px; background: linear-gradient(90deg, rgba(255,210,63,0.12), rgba(255,255,255,0.02)); border:1px solid rgba(255,210,63,0.12); box-shadow: 0 8px 28px rgba(0,0,0,0.6); backdrop-filter: blur(4px); }
.coin-icon{ width:26px; height:26px; display:inline-grid; place-items:center; border-radius:8px; padding:4px; background:linear-gradient(180deg,#fff4c2,#ffd54f); box-shadow: 0 6px 18px rgba(0,0,0,0.6); font-weight:900; color:#6b3f00; }

.coin-number{ font-weight:900; color: #c7cfcfff; font-family: 'Press Start 2P', monospace; font-size:0.92rem; letter-spacing:0.02em }
.coin-skeleton{ width:80px; height:16px; background:linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.06)); border-radius:8px }


      .menu-card{ background: radial-gradient(1200px 400px at 10% 10%, rgba(255,255,255,0.02), transparent 10%), linear-gradient(180deg, rgba(255,255,255,0.015), rgba(255,255,255,0.01)); border:2px solid rgba(255,255,255,0.03); border-radius:18px; padding:18px; min-width:300px; max-width:560px; flex:1 1 320px; position:relative;  overflow:visible; margin-top:2rem; }

      /* CRT scanlines */
      .menu-card::before{ content:''; position:absolute; inset:0; background-image: linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px); background-size:100% 4px; pointer-events:none; mix-blend-mode:overlay; opacity:0.6; border-radius:18px }
      .menu-heading{ text-align:center; font-size:1.28rem; color:var(--neon); margin-bottom:6px; letter-spacing:0.04em; font-weight:900; font-family: 'Press Start 2P', 'Luckiest Guy', system-ui, -apple-system, sans-serif; text-transform:uppercase; text-shadow: 0 2px 0 rgba(0,0,0,0.8), 0 0 8px rgba(255,210,63,0.08); }
      .menu-sub{ text-align:center; font-size:0.82rem; color:var(--muted); margin-bottom:10px }
      .menu-outer{ display:flex; gap:14px }

      .slider-section{ display:flex; align-items:center; gap:15px; position:relative; }
      .viewport{ overflow:hidden; flex:1 1 auto; }
      .slider-track{ display:flex; gap:14px; align-items:center; will-change:transform; transition: transform 460ms cubic-bezier(.2,.9,.25,1); padding:8px 2px; }

      /* arrows — chunky retro buttons */
      .slider-arrow{ background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:3px solid rgba(0,0,0,0.6); color:var(--neon); font-size:1.15rem; border-radius:10px; width:46px; height:46px; display:flex; align-items:center; justify-content:center; cursor:pointer; box-shadow: 0 10px 30px rgba(0,0,0,0.8), inset 0 2px 0 rgba(255,255,255,0.02); }
      .slider-arrow:disabled{ opacity:0.3; cursor:default }

      /* item cards: heavy outline, comic stroke, pixel-ish label */
      .slider-item{ flex:0 0 auto; width:165px; border-radius:12px; padding:12px; display:flex; flex-direction:column; align-items:center; gap:14px; cursor:pointer; transform-origin:center center; transition: transform 260ms cubic-bezier(.2,.9,.25,1), box-shadow 260ms; border:4px solid rgba(0,0,0,0.6); background: linear-gradient(180deg, #ebebebf0, #f2fffde6); box-shadow: 0 8px 18px rgba(0,0,0,0.7), 0 0 0 4px rgba(255,255,255,0.01) inset; }

      .slider-item img{ width:100px; height:100px; object-fit:cover; border-radius:6px; border:3px solid #bae7f4ec; box-shadow: 0 6px 16px rgba(0,0,0,0.8); image-rendering: pixelated; }
      
      .slider-item .label{ font-weight:900; color:#ffdca6; font-size:0.86rem; text-align:center; font-family: 'Press Start 2P', monospace; text-transform:none }
      .slider-item .short{ font-size:0.72rem; color:var(--muted); text-align:center }

      /* selected style — pop-out with comic burst and outline */
      .slider-item.selected{ transform: translateY(-12px) scale(1.18); box-shadow: 0 28px 48px rgba(0,0,0,0.8), 0 0 28px rgba(255,107,107,0.05); border-color: rgba(255,210,63,0.95); }

      /* Unique selection panel — retro badge overlay */
      .selection-panel{ position:absolute; right:-44px; top:12px; width:200px; height:120px; background: linear-gradient(180deg, rgba(10,12,18,0.95), rgba(25,22,30,0.95)); border-radius:12px; padding:8px; border:3px solid rgba(255,210,63,0.12); box-shadow: 0 20px 50px rgba(0,0,0,0.8); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; z-index:30; display:none }
      .selection-panel .badge{ width:86px; height:54px; border-radius:8px; overflow:hidden; border:3px solid rgba(0,0,0,0.7); box-shadow: 0 8px 18px rgba(0,0,0,0.8); }
      .selection-panel .name{ color:#ffd23f; font-weight:900; font-family: 'Press Start 2P', monospace; font-size:0.62rem; text-align:center }
      .selection-panel .desc{ color:var(--muted); font-size:0.66rem; text-align:center }

      /* pointer/tail like a cartoon speech bubble */
      .selection-panel::after{ content:''; position:absolute; left:-14px; top:36px; width:24px; height:24px; background:linear-gradient(180deg, rgba(10,12,18,0.95), rgba(25,22,30,0.95)); transform:rotate(45deg); border-left:3px solid rgba(255,210,63,0.06); border-bottom:3px solid rgba(255,210,63,0.06); }

      .start-section{ margin-top:16px; display:flex; justify-content:center }
      .start-btn{ padding:12px 20px; border-radius:12px; background: linear-gradient(90deg, var(--accent1), var(--accent2)); color:#071021; font-weight:900; border:none; cursor:pointer; box-shadow: 0 12px 30px rgba(0,0,0,0.8); font-family: 'Press Start 2P', monospace }
      .start-btn:hover{ transform:translateY(-2px) }

      @media (max-width:1000px){ .selection-panel{ right:8px; top:-46px; width:170px; height:100px } }
      @media (max-width:760px){ .game-menu{ padding:16px } .menu-card{ max-width:100% } .selection-panel{ position:relative; right:0; top:0; margin-bottom:8px; width:100%; height:auto; flex-direction:row; justify-content:flex-start; gap:16px; padding:10px }
        .selection-panel .badge{ width:70px; height:50px } .slider-item{ width:120px } .slider-item img{ width:80px; height:56px }
      }
      @media (max-width:420px){ .slider-item{ width:100px } .slider-item img{ width:72px; height:48px, gap:15px } .slider-arrow{ width:38px; height:38px } }

      /* Loader overlay */
.menu-loader-overlay{
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  background: linear-gradient(180deg, rgba(2,4,8,0.6), rgba(2,4,8,0.85));
  z-index:120;
}
.menu-loader-card{
  width:360px;
  max-width:92%;
  padding:18px;
  border-radius:12px;
  background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
  border:2px solid rgba(255,255,255,0.03);
  box-shadow: 0 20px 60px rgba(0,0,0,0.7);
  display:flex;
  flex-direction:column;
  gap:12px;
  align-items:center;
}
.loader-bar{ width:100%; height:12px; background:rgba(255,255,255,0.05); border-radius:8px; overflow:hidden; border:1px solid rgba(0,0,0,0.55); }
.loader-fill{ height:100%; width:0%; background: linear-gradient(90deg, rgba(255,210,63,0.95), rgba(255,107,107,0.95)); transition: width 280ms linear; }
.loader-text{ color:var(--muted); font-size:0.9rem; text-align:center; }
.menu-loader-card .start-btn{ margin-top:6px; padding:8px 12px; font-size:0.86rem; }

    `;
    document.head.appendChild(style);
    return () => document.getElementById(id)?.remove();
  }, []);

  // keyboard nav for accessibility — now uses wrappers so parent is informed
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        prevChar();
      } else if (e.key === "ArrowRight") {
        nextChar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // intentionally depend on charSlider.current so changes to selection update the closure
  }, [charSlider.current]);

  // preload on mount
  useEffect(() => {
    preloadMenuAssets(true);
    return () => {
      loaderCancelRef.current.cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedCharObj = CHAR_LIST[charSlider.current] || CHAR_LIST[0];
  const selectedMapObj = MAP_LIST[mapSlider.current] || MAP_LIST[0];

  return (
    <div className="game-menu">

      <div className="top-bar">
        <div className="coin-badge" title="Total coins">
          <div className="coin-icon">⭐</div>
          {totalCoins === null ? (
            <div className="coin-skeleton" aria-hidden="true" />
          ) : (
            <div className="coin-number" aria-live="polite">{totalCoins}</div>
          )}
        </div>
      </div>

      {menuLoading && (
        <div className="menu-loader-overlay" role="status" aria-live="polite">
          <div className="menu-loader-card">
            <div className="loader-bar">
              <div className="loader-fill" style={{ width: `${menuLoadProgress}%` }} />
            </div>
            <div className="loader-text">Loading assets — {menuLoadProgress}%</div>
            <button
              className="start-btn"
              onClick={() => {
                loaderCancelRef.current.cancelled = true;
                preloadMenuAssets(true);
              }}
            >
              Reload assets
            </button>
          </div>
        </div>
      )}

      <div className="menu-card" aria-label="Character selection card">
        <div className="menu-heading">RUNNER</div>
        <div className="menu-sub">Retro runners: pick your sprite</div>

        {/* unique selection panel for character */}
        <div ref={charPanelRef} className="selection-panel" aria-hidden={false}>
          <div className="badge">
            <img
              src={selectedCharObj.preview}
              alt={selectedCharObj.label}
              style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="name">{selectedCharObj.label}</div>
            <div className="desc">Level {(charSlider.current + 1)}</div>
          </div>
        </div>

        <div className="slider-section">
          <button className="slider-arrow" onClick={prevChar} disabled={charSlider.current === 0} aria-label="Previous Character">
            ◀
          </button>
          <div className="viewport">
            <div className="slider-track" ref={charTrackRef} role="list">
              {CHAR_LIST.map((c, idx) => (
                <div
                  key={c.key}
                  role="listitem"
                  tabIndex={0}
                  className={`slider-item ${idx === charSlider.current ? "selected" : ""}`}
                  onClick={() => {
                    charSlider.setCurrent(idx);
                    onChangeChar(c.key);
                  }}
                  onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                      charSlider.setCurrent(idx);
                      onChangeChar(c.key);
                    }
                  }}
                >
                  <img src={c.preview} alt={c.label} />
                  <div className="label" style={{  color: "#4d4d4dff" }}>{c.label}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            className="slider-arrow"
            onClick={nextChar}
            disabled={charSlider.current === CHAR_LIST.length - 1}
            aria-label="Next Character"
          >
            ▶
          </button>
        </div>
      </div>

      <div className="menu-card" aria-label="Map selection card">
        <div className="menu-heading">MAP</div>
        <div className="menu-sub">Choose your battleground</div>

        {/* unique selection panel for map (mirrors style but with short desc) */}
        <div ref={mapPanelRef} className="selection-panel" aria-hidden={false}>
          <div className="badge">
            <img
              src={selectedMapObj.preview}
              alt={selectedMapObj.label}
              style={{ width: "100%", height: "100%", objectFit: "cover", imageRendering: "pixelated" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div className="name">{selectedMapObj.label}</div>
            <div className="desc">{selectedMapObj.short || "Unknown"}</div>
          </div>
        </div>

        <div className="slider-section">
          <button className="slider-arrow" onClick={prevMap} disabled={mapSlider.current === 0} aria-label="Previous Map">
            ◀
          </button>
          <div className="viewport">
            <div className="slider-track" ref={mapTrackRef} role="list">
              {MAP_LIST.map((m, idx) => (
                <div
                  key={m.key}
                  role="listitem"
                  tabIndex={0}
                  className={`slider-item ${idx === mapSlider.current ? "selected" : ""}`}
                  onClick={() => {
                    mapSlider.setCurrent(idx);
                    onChangeMap(m.key);
                  }}
                >
                  <img src={m.preview} alt={m.label} />
                  <div className="label" style={{  color: "#4d4d4dff" }}>{m.label} </div>
                  <div className="short">{m.short}</div>
                </div>
              ))}
            </div>
          </div>
          <button
            className="slider-arrow"
            onClick={nextMap}
            disabled={mapSlider.current === MAP_LIST.length - 1}
            aria-label="Next Map"
          >
            ▶
          </button>
        </div>

        <div className="start-section">
          <button className="start-btn" onClick={onStart}>
            START RUN
          </button>
        </div>
      </div>
    </div>
  );
}
