"use client";

import React from "react";
import styles from "../../Components/styles/about.module.css";
import Link from "next/link";

export default function AboutPage(): JSX.Element {
  const yearFounded = 2024;
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>About Us</h1>
          <p className={styles.subtitle}>Small team. Clear goals. Honest games.</p>
          <div className={styles.note}>Established {yearFounded} · Focused on privacy-first, fast web games</div>
        </header>

        <article className={styles.article}>
          <section className={styles.section}>
            <h2>Who we are</h2>
            <p>
              We are a compact team of engineers, designers and artists who build focused web games and small interactive
              experiences. We aim for durable, elegant design: things that load quickly, run smoothly on modest hardware, and
              reward repeat play. Our work favors craftsmanship over flash — carefully tuned mechanics, readable code, and clean art.
            </p>

            <p>
              Our product decisions are guided by a few simple rules: respect players' time, protect their data, and be transparent about how
              we make money. That means: minimal data collection, clear opt-ins for tracking and ads, and a straightforward paid tier
              where players can remove ads and access extras.
            </p>
          </section>

          <section className={styles.section}>
            <h2>What we build</h2>
            <p>
              Short-form web games that are easy to pick up and return to — endless runners, sketch-and-defend playgrounds, and compact
              minigames that sit comfortably in a browser tab or a mobile break. We prioritize clarity of interaction, responsive input,
              and predictable difficulty curves so players feel rewarded by skill and practice, not by luck.
            </p>

            <p>
              We ship small, iterative updates instead of massive reworks. That keeps the experience stable and lets us improve features
              based on real player feedback.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Design & technical approach</h2>
            <p>
              We prefer simple, pragmatic technology: modern React/Next for UI, compact client-side game loops, and Firebase for lightweight
              social features (scores, leaderboards, and optional profile data). Our front-end bundles are optimized for low latency and
              careful device detection to provide high frame-rate interactions on mid-range phones.
            </p>

            <p>
              Accessibility and internationalization matter: we test with keyboard navigation, scale-friendly UI, and readable Bengali and
              English text where appropriate. Performance budgets and progressive enhancement guide every release.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Privacy & monetization</h2>
            <p>
              We take a privacy-first approach. Only minimal account information (display name, email when provided, UID) and gameplay data
              (score, coins, per-round records) are stored. You control consent for analytics and personalized ads through a simple toggle
              in the settings.
            </p>

            <p>
              Monetization strategies are chosen to minimize friction: a clear premium tier for players who want an ad-free experience and
              cosmetic rewards, modest contextual ads in non-gameplay screens, and affiliate links in clearly labelled pages. We avoid
              invasive tracking and never sell raw personal data.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Community & support</h2>
            <p>
              We listen. Bug reports, suggestions, and design feedback are prioritized — small teams move fast and the best improvements
              come from players. For support or privacy requests, contact <Link href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</Link>.
            </p>

            <p>
              If you're interested in collaborations, art contributions, or hosting competitions, reach out. We welcome partners who value
              clear, respectful monetization and high-quality player experience.
            </p>
          </section>

          <section className={styles.sectionBottom}>
            <h2>Developer notes (brief)</h2>
            <p>
              Our codebase uses reusable components and a shared asset pipeline so new games can be built quickly. We favour server-side
              aggregation for leaderboards to avoid exposing private fields. This approach keeps public leaderboards compact and safe.
            </p>

            <p className={styles.small}>© {new Date().getFullYear()} Brain Games Co. — Built with care.</p>
          </section>
        </article>

        <footer className={styles.footer}>
          
          <div> <Link href="/privacy" className={styles.link}>Privacy</Link> </div>
          
        </footer>
      </div>
    </main>
  );
}

