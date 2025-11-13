"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import GameThumbnail from "../gameThumb";
import LogoutButton from "../logout";
import styles from "../styles/home.module.css";
import { database } from "../../firebase";
import { ref, get } from "firebase/database";
import { motion, AnimatePresence } from "framer-motion";
import { FaGamepad, FaTrophy, FaPlay, FaPause } from "react-icons/fa";
import Lottie from "lottie-react";
import controllerAnim from "../../app/lottie/Controller.json";
import Image from "next/image";
import logo from "../../app/logo/logo.jpg";
import title from "../../app/logo/typog.png";
import { Poppins } from "next/font/google";

type UserProfile = {
  displayName?: string | null;
  email?: string | null;
  uid?: string | null;
  createdAt?: number | null;
};

const poppins = Poppins({
  weight: ["700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export default function Home() {

  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [openProfile, setOpenProfile] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  const lottieRef = useRef<any>(null);
  const [lottiePlaying, setLottiePlaying] = useState(true);
  const heroRef = useRef<HTMLElement | null>(null);

  const router = useRouter();


  useEffect(() => {
    async function fetchProfile() {
      if (!currentUser?.uid) {
        setProfile(null);
        return;
      }
      setLoadingProfile(true);
      try {
        const snap = await get(ref(database, `users/${currentUser.uid}`));
        if (snap.exists()) setProfile(snap.val() as UserProfile);
        else
          setProfile({
            displayName: currentUser.displayName ?? null,
            email: currentUser.email ?? null,
            uid: currentUser.uid,
          });
      } catch (err) {
        console.warn("Failed to load profile:", err);
        setProfile({
          displayName: currentUser.displayName ?? null,
          email: currentUser.email ?? null,
          uid: currentUser.uid,
        });
      } finally {
        setLoadingProfile(false);
      }
    }
    fetchProfile();
  }, [currentUser]);

  const displayName = profile?.displayName ?? currentUser?.displayName ?? "Player";
  const createdAt = profile?.createdAt ? new Date(profile.createdAt).toLocaleString() : null;

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    function onMove(e: PointerEvent) {
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width - 0.5; // -0.5..0.5
      const my = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.setProperty("--mx", (mx * 20).toFixed(2) + "px");
      el.style.setProperty("--my", (my * 12).toFixed(2) + "px");
    }
    function onLeave() {
      el.style.setProperty("--mx", "0px");
      el.style.setProperty("--my", "0px");
    }
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <main className={styles.root}>
      {/* Background canvas / effect (keeps existing BackgroundScene) */}
      <BackgroundScene className={styles.bg} />

      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.brandRow}>
          {/* Brand / logo (unchanged) */}
          <div className={styles.brand}>
            <div className={styles.badge} aria-hidden="false" aria-label="Khelba logo badge">
              <Image
                src={logo}
                alt="Khelba"
                width={48}
                height={48}
                className={styles.logoImg}
                priority={false}
                draggable={false}
              />

              {/* SVG metallic overlay (keeps your SVG mark) */}
              <svg className={styles.logoSvg} viewBox="0 0 100 100" role="img" aria-hidden="true">
                <defs>
                  <linearGradient id="metalA" x1="0" x2="1">
                    <stop offset="0" stopColor="#a6d8ff" />
                    <stop offset="0.45" stopColor="#60a6ff" />
                    <stop offset="1" stopColor="#1646ff" />
                  </linearGradient>
                  <linearGradient id="metalB" x1="0" x2="1">
                    <stop offset="0" stopColor="#eaf6ff" stopOpacity="0.95" />
                    <stop offset="0.6" stopColor="#8fcfff" stopOpacity="0.6" />
                    <stop offset="1" stopColor="#0b3fff" stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                <circle cx="50" cy="50" r="40" fill="url(#metalA)" opacity="0.88" />
                <ellipse cx="42" cy="36" rx="22" ry="10" fill="url(#metalB)" opacity="0.85" transform="rotate(-22 42 36)" />
                <g className={styles.ring} transform="translate(50,50)">
                  <path d="M-36 0 A36 36 0 0 1 36 0" stroke="rgba(255,255,255,0.12)" strokeWidth="4" fill="none" strokeLinecap="round" />
                </g>
              </svg>

              <span className={styles.orb} aria-hidden="true" />
              <span className={`${styles.orb} ${styles.orb2}`} aria-hidden="true" />
              <span className={`${styles.orb} ${styles.orb3}`} aria-hidden="true" />
            </div>
          </div>

          {/* top-right compact menu row (Games tab) */}
          <div className={styles.headerRightTop}>
            <motion.div
              className={styles.navTab}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            >
              <Link href="/games" className={`${styles.iconLink} ${styles.tabLink}`}>
                <span className={styles.tabIconText}>
                  <FaGamepad aria-hidden="true" size={18} />
                  <span className={styles.tabLabel}></span>
                </span>
                <span aria-hidden="true" className={styles.tabSpark} />
              </Link>
            </motion.div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
              <button
                ref={profileRef}
                aria-expanded={openProfile}
                aria-controls="profile-overlay"
                aria-haspopup="dialog"
                onClick={() => setOpenProfile((s) => !s)}
                className={styles.profileIconBtn}
                title="Profile"
                type="button"
              >
                {/* Solid modern profile icon that 'draws' itself then pulses */}
                <svg
                  className={styles.profileSvg}
                  viewBox="0 0 100 100"
                  role="img"
                  aria-hidden="false"
                  focusable="false"
                >
                  <defs>
                    <linearGradient id="retroYellowA" x1="0" x2="1">
                      <stop offset="0%" stopColor="#fff2b8" />
                      <stop offset="45%" stopColor="#ffd166" />
                      <stop offset="100%" stopColor="#ffb84d" />
                    </linearGradient>

                    <linearGradient id="retroYellowB" x1="0" x2="1">
                      <stop offset="0%" stopColor="#ffe9a2" stopOpacity="0.95" />
                      <stop offset="100%" stopColor="#ffb84d" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>

                  {/* outer rim for shimmer */}
                  <circle
                    className={styles.profileRim}
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="url(#retroYellowB)"
                    strokeWidth="2.6"
                    strokeLinecap="round"
                  />

                  {/* stroke outline that draws in (head + shoulders path) */}
                  <g className={styles.personStrokeGroup} fill="none" strokeLinecap="round" strokeLinejoin="round">
                    {/* head outline (circle stroke) */}
                    <circle
                      className={styles.personHeadStroke}
                      cx="50"
                      cy="34"
                      r="12.6"
                      stroke="rgba(13,11,6,0.95)"
                      strokeWidth="2.8"
                      vectorEffect="non-scaling-stroke"
                    />

                    {/* torso path (shoulders + torso) */}
                    <path
                      className={styles.personTorsoStroke}
                      d="M25 70 C25 54, 35 46, 50 46 C65 46, 75 54, 75 70 L75 74 C75 78, 66 82, 50 82 C34 82, 25 78, 25 74 Z"
                      stroke="rgba(13,11,6,0.95)"
                      strokeWidth="2.8"
                      vectorEffect="non-scaling-stroke"
                    />
                  </g>

                  {/* fill shapes that fade-in after stroke draws */}
                  <g className={styles.personFillGroup} fill="url(#retroYellowA)">
                    <circle className={styles.personHeadFill} cx="50" cy="34" r="11.6" opacity="0" />
                    <path
                      className={styles.personTorsoFill}
                      d="M26 72 C26 56, 36 48, 50 48 C64 48, 74 56, 74 72 L74 76 C74 80, 66 84, 50 84 C34 84, 26 80, 26 76 Z"
                      opacity="0"
                    />
                  </g>

                  {/* soft shadow under the badge for depth */}
                  <ellipse className={styles.personShadow} cx="50" cy="88" rx="20" ry="4" fill="rgba(2,6,20,0.45)" opacity="0.8" />

                  <g className={styles.iconParticles} aria-hidden="true" fill="#fff8d9" opacity="0.9">
                    <circle className={styles.p1} cx="14" cy="20" r="1.6" />
                    <circle className={styles.p2} cx="86" cy="28" r="1.2" />
                    <circle className={styles.p3} cx="68" cy="78" r="1.4" />
                  </g>
                </svg>
              </button>

              {/* Logout remains visible to the right of the profile icon */}
              <LogoutButton />
            </div>
          </div>
        </div>

        <div className={styles.headerRight}></div>
      </header>

      {/* HERO */}
      <section ref={heroRef} className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroLeft}>
          <h2
            id="hero-title"
            className={styles.heroTitle}
            style={{
              fontFamily: "var(--font-poppins), system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
              fontSize: "38px",
              fontWeight: 800,
              color: "#eaf6ff",
              letterSpacing: "-0.4px",
              lineHeight: 1.05,
              textShadow: "0 10px 30px rgba(2,8,20,0.45), 0 1px 0 rgba(255,255,255,0.06)",
              background: "linear-gradient(180deg, rgba(255,255,255,0.95), rgba(200,230,255,0.6))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              filter: "drop-shadow(0 6px 18px rgba(12,24,46,0.45))",
              margin: 0,
            }}
          >
            Welcome back
            <br />

            <Image src={title} alt="Khelba" width={200} height={54} style={{ display: "inline-block", verticalAlign: "middle", marginLeft: "0px", position: "relative", left: "-3px", marginTop: "33px" }} />
          </h2>

          <p
            className={styles.heroLead}
            style={{
              fontFamily: "cursive",
              fontSize: "13px",
              fontWeight: 500,
              lineHeight: 1.55,
              color: "rgba(210,225,245,0.94)",
              maxWidth: "56ch",
              margin: "0 0 20px 0",
              letterSpacing: "0.3px",
              textShadow: "0 6px 20px rgba(4,10,24,0.45)",
              opacity: 0.98,
              transform: "translateZ(0)",
              WebkitFontSmoothing: "antialiased",
              marginTop: "11px",
            }}
          >
            Jump into your favorite game. Challenge friends, climb leaderboards,
            <br />and enjoy endless fun—all from your browser.
          </p>

          <br />

          <div className={styles.ctaRow}>
            <Link href="#games" className={`${styles.cta} ${styles.ctaPrimary}`}>
              <FaGamepad /> Play Now
            </Link>

            <button
              type="button"
              aria-pressed={!lottiePlaying}
              aria-label={lottiePlaying ? "Pause device demo" : "Play device demo"}
              className={`${styles.cta} ${styles.ctaGhost}`}
              onClick={() => {
                if (!lottieRef.current) return;
                if (lottiePlaying) {
                  lottieRef.current.pause();
                  setLottiePlaying(false);
                } else {
                  lottieRef.current.play();
                  setLottiePlaying(true);
                }
              }}
              title={lottiePlaying ? "Pause device demo" : "Play device demo"}
            >
              {lottiePlaying ? (
                <>
                  <FaPause className={styles.ctaIcon} aria-hidden="true" />
                  <span className={styles.ctaLabel}>Pause</span>
                </>
              ) : (
                <>
                  <FaPlay className={styles.ctaIcon} aria-hidden="true" />
                  <span className={styles.ctaLabel}>Play</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className={styles.heroRight} style={{ marginTop: "20px" }}>
          <div
            className={styles.deviceMock}
            role="figure"
            aria-label="Gameplay preview"
            tabIndex={0}
          >
            <div className={styles.deviceRim} />

            <div className={styles.screen} onClick={() => {
              if (!lottieRef.current) return;
              if (lottiePlaying) {
                lottieRef.current.pause();
                setLottiePlaying(false);
              } else {
                lottieRef.current.play();
                setLottiePlaying(true);
              }
            }}>
              <div className={styles.lottieWrap} aria-hidden="false">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={controllerAnim}
                  loop={true}
                  autoplay={true}
                  style={{ width: "100%", height: "100%", pointerEvents: "none" }}
                />
              </div>

              <span className={styles.spark} />
              <span className={styles.tiny} />
              <span className={styles.tiny2} />
            </div>
          </div>
        </div>
      </section>

      <br />
      <br />
      {/* LIBRARY */}
      <section className={styles.library} id="games">
        <h3 className={styles.sectionTitle}>Games</h3>
        <br />
        <br />
        <div className={styles.grid}>
          <GameThumbnail
            slug="runner"
            title="Lafao Run"
            description="Run, jump and survive the chaos! "
            imgSrc="/thumbs/lafao.jpg"
          />

          <GameThumbnail
            slug="sketch"
            title="DrawGuard"
            description="Protect the hero with your quick sketches."
            imgSrc="/thumbs/sketch.jpg"
          />
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div>
          <Link href="/about" className={styles.footerLink}>About</Link>
          <Link href="/privacy" className={styles.footerLink}>Privacy</Link>
          <Link href="/terms" className={styles.footerLink}>Terms</Link>
          <Link href="/contact" className={styles.footerLink}>Contact</Link>
        </div>
        <small className={styles.copy}>© Khelba</small>
      </footer>

      {/* PROFILE OVERLAY - animated presence */}
      <AnimatePresence>
        {openProfile && (
          <>
            {/* backdrop */}
            <motion.div
              key="profile-backdrop"
              className={styles.profileOverlayBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setOpenProfile(false)}
            />

            {/* card anchored to header top-right */}
            <motion.aside
              id="profile-overlay"
              role="dialog"
              aria-label="Profile menu"
              className={styles.profileCard}
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 480, damping: 36 }}
              style={{ position: "fixed", right: 18, top: 78, zIndex: 120 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div className={styles.profileName}>{displayName}</div>
                  <div className={styles.profileEmail}>{currentUser?.email ?? "No email"}</div>
                </div>
              </div>
              <br />

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button 
                 onClick={() => {
                  setOpenProfile(false);         // close overlay immediately
                  router.push("/leaderboard");   // navigate client-side
                 }}
                 className={styles.menuRow}>
                  <FaTrophy className={styles.menuIcon} />
                  <span>Leaderboard</span>
                </button>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button className={`${styles.btn} ${styles.btnConfirm}`} onClick={() => { /* optional quick action */ }}>
                  Settings
                </button>

                <button
                  className={`${styles.btn} ${styles.btnCancel}`}
                  onClick={async () => {
                    setOpenProfile(false);
                    await (async () => { /* call your logout handler if you want here or use LogoutButton inside overlay */ })();
                  }}
                >
                  Close
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}

// ----------------------------------------------------------------------

function BackgroundScene({ className }: { className?: string }) {

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });
  const rafRef = useRef<number | null>(null);
  const starsRef = useRef<any[]>([]);
  const shootingStarsRef = useRef<any[]>([]);
  const particlesRef = useRef<any[]>([]);
  const hexagonsRef = useRef<any[]>([]);
  const gridLinesRef = useRef<any[]>([]);
  const lastRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true })!;
    let mounted = true;

    function setupSize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      // Use window size as base for background effects
      const width = Math.max(360, window.innerWidth);
      const height = Math.max(400, window.innerHeight);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function initStars() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const count = isMobile ? 50 : 80;
      starsRef.current = [];
      for (let i = 0; i < count; i++) {
        starsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: Math.random() * (isMobile ? 1.2 : 2) + 0.4,
          speed: 4 + Math.random() * (isMobile ? 8 : 16),
          hue: 180 + Math.random() * 100,
          alpha: 0.3 + Math.random() * 0.7,
          twinkle: Math.random() * 2 * Math.PI,
        });
      }
    }

    function initShootingStars() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      shootingStarsRef.current = [];
      for (let i = 0; i < 3; i++) {
        shootingStarsRef.current.push(createShootingStar(w, h));
      }
    }

    function createShootingStar(w: number, h: number) {
      return {
        x: Math.random() * w,
        y: -50,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 3,
        length: 40 + Math.random() * 60,
        alpha: 0.6 + Math.random() * 0.4,
        hue: 180 + Math.random() * 80,
        active: Math.random() > 0.5,
      };
    }

    function initParticles() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const count = isMobile ? 30 : 40;
      particlesRef.current = [];
      for (let i = 0; i < count; i++) {
        particlesRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          r: 1 + Math.random() * 2,
          hue: 200 + Math.random() * 60,
          alpha: 0.2 + Math.random() * 0.4,
          pulse: Math.random() * Math.PI * 2,
        });
      }
    }

    function initHexagons() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      hexagonsRef.current = [];
      for (let i = 0; i < (isMobile ? 5 : 6); i++) {
        hexagonsRef.current.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: 20 + Math.random() * 40,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          alpha: 0.05 + Math.random() * 0.1,
          hue: 200 + Math.random() * 80,
        });
      }
    }

    function initGridLines() {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      gridLinesRef.current = [];
      const spacing = 80;
      for (let x = 0; x < w; x += spacing) {
        gridLinesRef.current.push({ x1: x, y1: 0, x2: x, y2: h, type: "vertical", offset: 0 });
      }
      for (let y = 0; y < h; y += spacing) {
        gridLinesRef.current.push({ x1: 0, y1: y, x2: w, y2: y, type: "horizontal", offset: 0 });
      }
    }

    // safeGradient helper to avoid non-finite errors
    function safeCreateRadialGradient(
      ctx: CanvasRenderingContext2D,
      x0: number,
      y0: number,
      r0: number,
      x1: number,
      y1: number,
      r1: number
    ): CanvasGradient | null {
      const vals = [x0, y0, r0, x1, y1, r1].map((v) => Number(v));
      if (!vals.every(Number.isFinite)) return null;
      // clamp radii
      if (vals[2] <= 0) vals[2] = 0.001;
      if (vals[5] <= 0) vals[5] = 0.001;
      try {
        return ctx.createRadialGradient(vals[0], vals[1], vals[2], vals[3], vals[4], vals[5]);
      } catch (e) {
        console.warn("safeCreateRadialGradient failed", e, { vals });
        return null;
      }
    }

    function safeCreateLinearGradient(
      ctx: CanvasRenderingContext2D,
      x0: number,
      y0: number,
      x1: number,
      y1: number
    ): CanvasGradient | null {
      const vals = [x0, y0, x1, y1].map((v) => Number(v));
      if (!vals.every(Number.isFinite)) return null;
      try {
        return ctx.createLinearGradient(vals[0], vals[1], vals[2], vals[3]);
      } catch (e) {
        console.warn("safeCreateLinearGradient failed", e, { vals });
        return null;
      }
    }

    function draw(now: number) {
      if (!mounted) return;
      const dt = Math.min(40, now - lastRef.current) / 1000;
      lastRef.current = now;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      // guard: if canvas dimensions are not ready, skip drawing this frame
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#050510");
      g.addColorStop(0.3, "#0a0a20");
      g.addColorStop(0.7, "#0d0d28");
      g.addColorStop(1, "#060612");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      drawGridLines(ctx, dt);
      drawBlob(ctx, w * 0.08, h * 0.1, Math.min(400, Math.max(140, w * 0.45)), "#1a0540", 0.15);
      drawBlob(ctx, w * 0.9, h * 0.15, Math.min(250, Math.max(80, w * 0.14)), "#d6336c", 0.12);
      drawBlob(ctx, w * 0.92, h * 0.86, Math.min(450, Math.max(140, w * 0.6)), "#003366", 0.09);

      drawHexagons(ctx, dt);
      drawParticles(ctx, dt, w, h);
      drawShootingStars(ctx, dt, w, h);
      drawStars(ctx, dt, w, h);
      drawScanLines(ctx, w, h, now);
      drawConnectionLines(ctx);

      rafRef.current = requestAnimationFrame(draw);
    }

    function drawGridLines(ctx: CanvasRenderingContext2D, dt: number) {
      ctx.save();
      ctx.strokeStyle = "rgba(100, 150, 255, 0.03)";
      ctx.lineWidth = 1;
      for (let line of gridLinesRef.current) {
        line.offset += dt * 20;
        if (line.offset > 80) line.offset = 0;
        ctx.beginPath();
        if (line.type === "vertical") {
          ctx.moveTo(line.x1, line.y1 + line.offset);
          ctx.lineTo(line.x2, line.y2);
        } else {
          ctx.moveTo(line.x1 + line.offset, line.y1);
          ctx.lineTo(line.x2, line.y2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawHexagons(ctx: CanvasRenderingContext2D, dt: number) {
      for (let hex of hexagonsRef.current) {
        hex.rotation += hex.rotationSpeed;
        ctx.save();
        ctx.translate(hex.x, hex.y);
        ctx.rotate(hex.rotation);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i;
          const x = Math.cos(angle) * hex.size;
          const y = Math.sin(angle) * hex.size;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.strokeStyle = `hsla(${hex.hue}, 70%, 60%, ${hex.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawParticles(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number) {
      const px = Number(pointerRef.current.x || 0);
      const py = Number(pointerRef.current.y || 0);
      const active = pointerRef.current.active ? 1.0 : 0.0;

      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;

      for (let p of particlesRef.current) {
        p.pulse += dt * 2;
        const pulseScale = Math.sin(p.pulse) * 0.5 + 0.5;

        p.x += p.vx + ((px - w / 2) / w) * (active * 0.5);
        p.y += p.vy + ((py - h / 2) / h) * (active * 0.5);

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        // draw core particle
        ctx.beginPath();
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha * (0.6 + pulseScale * 0.4)})`;
        ctx.arc(p.x, p.y, p.r * (1 + pulseScale * 0.3), 0, Math.PI * 2);
        ctx.fill();

        // gradient halo - guarded
        const cx = Number(p.x);
        const cy = Number(p.y);
        const cr = Number(p.r);
        if (![cx, cy, cr].every(Number.isFinite) || cr <= 0) {
          // skip gradient but keep core
          continue;
        }

        const grad = safeCreateRadialGradient(ctx, cx, cy, 0, cx, cy, cr * 4);
        if (!grad) continue;
        grad.addColorStop(0, `hsla(${p.hue}, 80%, 65%, ${p.alpha * 0.3})`);
        grad.addColorStop(1, `hsla(${p.hue}, 80%, 65%, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, cr * 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawShootingStars(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number) {
      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
      for (let ss of shootingStarsRef.current) {
        if (!ss.active && Math.random() < 0.001) {
          ss.active = true;
          ss.x = Math.random() * w;
          ss.y = -50;
          ss.vx = (Math.random() - 0.5) * 4;
          ss.vy = 2 + Math.random() * 3;
        }

        if (ss.active) {
          ss.x += ss.vx * 60 * dt;
          ss.y += ss.vy * 60 * dt;

          // guard linear gradient inputs
          const lx0 = Number(ss.x);
          const ly0 = Number(ss.y);
          const lx1 = Number(ss.x - ss.vx * ss.length);
          const ly1 = Number(ss.y - ss.vy * ss.length);
          const lGrad = safeCreateLinearGradient(ctx, lx0, ly0, lx1, ly1);
          if (!lGrad) {
            // fallback simple stroke
            ctx.strokeStyle = `hsla(${ss.hue}, 85%, 70%, ${ss.alpha})`;
          } else {
            lGrad.addColorStop(0, `hsla(${ss.hue}, 85%, 70%, ${ss.alpha})`);
            lGrad.addColorStop(0.5, `hsla(${ss.hue}, 85%, 70%, ${ss.alpha * 0.5})`);
            lGrad.addColorStop(1, `hsla(${ss.hue}, 85%, 70%, 0)`);
            ctx.strokeStyle = lGrad;
          }

          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(ss.x, ss.y);
          ctx.lineTo(ss.x - ss.vx * ss.length, ss.y - ss.vy * ss.length);
          ctx.stroke();

          if (ss.y > h + 100) ss.active = false;
        }
      }
    }

    function drawStars(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number) {
      const px = Number(pointerRef.current.x || 0);
      const py = Number(pointerRef.current.y || 0);
      const active = pointerRef.current.active ? 1.0 : 0.0;

      if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;

      for (let i = 0; i < starsRef.current.length; i++) {
        const s = starsRef.current[i];
        s.twinkle += dt * 3;
        const tw = Math.sin(s.twinkle) * 0.5 + 0.5;
        const brightness = s.alpha * (0.5 + tw * 0.5);

        // safety cast
        const sx = Number(s.x);
        const sy = Number(s.y);
        const sr = Number(s.r);
        if (![sx, sy, sr].every(Number.isFinite) || sr <= 0) {
          console.warn("Skipping star: invalid numeric values", { i, s, canvasW: w, canvasH: h });
          continue;
        }

        const ox = ((px - w / 2) / w) * (active * (sr * 8));
        const oy = ((py - h / 2) / h) * (active * (sr * 8));
        const safeOx = Math.max(-1e6, Math.min(1e6, ox));
        const safeOy = Math.max(-1e6, Math.min(1e6, oy));
        const gradR = sr * 3;

        if (!Number.isFinite(safeOx) || !Number.isFinite(safeOy) || !Number.isFinite(gradR)) {
          console.warn("Skipping star gradient due to non-finite computed params", { sx, sy, sr, safeOx, safeOy, gradR, w, h });
          continue;
        }

        const grd = safeCreateRadialGradient(ctx, sx + safeOx, sy + safeOy, 0, sx + safeOx, sy + safeOy, gradR);
        if (!grd) {
          // fallback: simple fill circle
          ctx.beginPath();
          ctx.fillStyle = `hsla(${s.hue}, 90%, 75%, ${brightness})`;
          ctx.arc(sx + safeOx, sy + safeOy, sr * (1 + tw * 0.5), 0, Math.PI * 2);
          ctx.fill();
          continue;
        }

        grd.addColorStop(0, `hsla(${s.hue}, 85%, 65%, ${brightness})`);
        grd.addColorStop(0.5, `hsla(${s.hue}, 85%, 65%, ${brightness * 0.5})`);
        grd.addColorStop(1, `hsla(${s.hue}, 85%, 65%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx + safeOx, sy + safeOy, gradR, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `hsla(${s.hue}, 90%, 75%, ${brightness * 1.2})`;
        ctx.arc(sx + safeOx, sy + safeOy, sr * (1 + tw * 0.5), 0, Math.PI * 2);
        ctx.fill();

        // drift speed update after drawing
        s.y += dt * (s.speed * 0.3);
        if (s.y > h + 10) {
          s.y = -10;
          s.x = Math.random() * w;
        }
      }
    }

    function drawScanLines(ctx: CanvasRenderingContext2D, w: number, h: number, now: number) {
      const offset = (now * 0.05) % 60;
      ctx.save();
      ctx.strokeStyle = "rgba(100, 200, 255, 0.02)";
      ctx.lineWidth = 1;
      for (let y = -60 + offset; y < h; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawConnectionLines(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.strokeStyle = "rgba(120, 180, 255, 0.08)";
      ctx.lineWidth = 1;
      const points = [...particlesRef.current.slice(0, 15), ...starsRef.current.slice(0, 10)];
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.globalAlpha = 1 - dist / 150;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    function drawBlob(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string, alpha = 1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 8; i++) {
        const s = size * (0.15 + i * 0.12);
        const a = alpha * (0.08 + i * 0.12);
        // guard params
        const gx0 = cx - s * 0.25;
        const gy0 = cy - s * 0.15;
        const g = safeCreateRadialGradient(ctx, gx0, gy0, s * 0.01, cx, cy, s);
        if (!g) continue;
        g.addColorStop(0, hexToRgba(color, a * 1.4));
        g.addColorStop(0.5, hexToRgba(color, a * 0.5));
        g.addColorStop(1, hexToRgba("#000000", 0.0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function handlePointerMove(e: PointerEvent) {
      pointerRef.current.active = true;
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
    }
    function handlePointerLeave() {
      pointerRef.current.active = false;
    }

    function handleResize() {
      setupSize();
      initStars();
      initShootingStars();
      initParticles();
      initHexagons();
      initGridLines();
    }

    setupSize();
    initStars();
    initShootingStars();
    initParticles();
    initHexagons();
    initGridLines();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", handleResize);

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className={className} aria-hidden>
      <canvas ref={canvasRef} />
    </div>
  );
}

function hexToRgba(hex: string, alpha = 1) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
