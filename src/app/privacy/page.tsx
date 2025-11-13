"use client";

import React, { JSX, useEffect, useState } from "react";
import styles from "../../Components/styles/privacy.module.css";
import Link from "next/link";



export default function PrivacyPage(): JSX.Element {
  const [consent, setConsent] = useState<{ analytics: boolean | null }>(() => {
    try {
      const raw = localStorage.getItem("privacyConsent");
      return raw ? JSON.parse(raw) : { analytics: null };
    } catch {
      return { analytics: null };
    }
  });

  useEffect(() => {
    if (consent && typeof window !== "undefined") {
      try {
        localStorage.setItem("privacyConsent", JSON.stringify(consent));
      } catch {}
    }
  }, [consent]);

  function acceptAll() {
    setConsent({ analytics: true });
    // load analytics or ad scripts here if needed
  }
  function declineAll() {
    setConsent({ analytics: false });
  }

  const lastUpdated = "November 4, 2025";

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Privacy Policy & Monetization</h1>
            <p className={styles.lead}>Transparent, developer-friendly policy that balances user trust and sustainable monetization.</p>
            <div className={styles.meta}>Last updated: <time>{lastUpdated}</time></div>
          </div>
        </header>

        <nav className={styles.quickNav} aria-label="Quick sections">
          <a href="#summary">Summary</a>
          <a href="#data-collected">Data Collected</a>
          <a href="#use">How We Use Data</a>
          <a href="#monetization">Monetization</a>
          <a href="#rights">Your Rights</a>
        </nav>

        <article className={styles.article}>
          <section id="summary" className={styles.section}>
            <h2 className={styles.h2}>Executive summary</h2>
            <p>
              We store minimal personal data to run the site (display name, email, UID) and gameplay data (scores, coins, sketch rounds) in Firebase Realtime Database. We use analytics and optionally ads to fund development. We never sell personally
              identifiable information. This policy explains what we store, how we protect it, and how it affects monetization.
            </p>
          </section>

          <section id="data-collected" className={styles.section}>
            <h2 className={styles.h2}>Data we collect</h2>

            <div className={styles.gridTwo}>
              <div className={styles.card}>
                <h3>Account data</h3>
                <p>Display name, email (if provided), UID. Used for login, profile and support.</p>
              </div>

              <div className={styles.card}>
                <h3>Gameplay data</h3>
                <p>Total coins, per-round sketch scores (each round stored with unique id & timestamp), runner totalScore — used for leaderboards and analytics.</p>
              </div>

              <div className={styles.card}>
                <h3>Device & Usage</h3>
                <p>IP (for abuse mitigation), user agent, errors, and aggregated metrics for performance tuning.</p>
              </div>

              <div className={styles.card}>
                <h3>Cookies & Storage</h3>
                <p>Session cookies, localStorage for preferences, and opt-in flags for analytics/ads.</p>
              </div>
            </div>
          </section>

          <section id="use" className={styles.section}>
            <h2 className={styles.h2}>How we use data</h2>
            <ol className={styles.list}>
              <li><strong>Core service:</strong> authentication, saving scores and restoring progress.</li>
              <li><strong>Leaderboards & social features:</strong> show displayName, score, and timestamp; sketch leaderboard uses per-round scores.</li>
              <li><strong>Security & fraud prevention:</strong> detect cheaters, rate-limit, and block abuse.</li>
              <li><strong>Improvements:</strong> aggregate analytics to prioritize fixes and features.</li>
              <li><strong>Monetization:</strong> power ads, affiliate links, and premium features while minimizing personal data exposure.</li>
            </ol>
          </section>

          <section id="monetization" className={styles.section}>
            <h2 className={styles.h2}>Monetization — approach and privacy safeguards</h2>

            <p className={styles.leadSmall}>
              Monetization funds the product. Below are recommended strategies that keep privacy central while maximizing revenue potential.
            </p>

            <div className={styles.gridTwo}>
              <div className={styles.cardPremium}>
                <h3>Premium (one-time / subscription)</h3>
                <p>
                  Best UX and highest conversion: a paid tier removes ads, grants cosmetic items, or unlocks advanced features. Use a PCI-compliant processor (Stripe/PayPal). Store only a transaction ID and receipt metadata in the DB — never raw payment data.
                </p>
                <ul>
                  <li>Offer a 7-14 day trial.</li>
                  <li>Show clear refund & cancellation process.</li>
                </ul>
              </div>

              <div className={styles.cardAds}>
                <h3>Contextual Ads (low privacy impact)</h3>
                <p>
                  Contextual or non-personalized ads are preferred: they rely on page content rather than personal profiles. Limit ads to menus and breaks (not during active gameplay). Provide an explicit opt-out toggle for personalized ads.
                </p>
                <ul>
                  <li>Request permission for personalized ads.</li>
                  <li>Respect Do Not Track and consent banners.</li>
                </ul>
              </div>

              <div className={styles.cardAffiliate}>
                <h3>Affiliate & Sponsorship</h3>
                <p>
                  Place affiliate links in blog posts, store pages, or non-gameplay screens. Disclose affiliate relationships. Track conversions with aggregated non-identifying metrics.
                </p>
              </div>

              <div className={styles.cardData}>
                <h3>Analytics for monetization</h3>
                <p>
                  Use anonymized cohort analysis to optimize funnels. Avoid sharing raw user-level data with ad partners. Use hashed identifiers when necessary and maintain a deletion window for ad-related identifiers.
                </p>
              </div>
            </div>

            <div className={styles.noteBox}>
              <strong>Pro tip:</strong> Combining a generous free tier and a tasteful premium removes friction and increases lifetime value. Ads + premium hybrid usually performs best.
            </div>
          </section>

          <section id="leaderboard-safety" className={styles.section}>
            <h2 className={styles.h2}>Leaderboards & public data</h2>
            <p>
              Do not expose emails or sensitive user data. Two recommended patterns:
            </p>
            <ol className={styles.list}>
              <li>
                <strong>Server-side aggregation:</strong> Use a server or Cloud Function to maintain <code>/public/leaderboards</code> with only {`{displayName, coins, totalScore, createdAt}`}. Clients read from this public node.
              </li>
              <li>
                <strong>Limited client reads:</strong> If you allow client reads on <code>/users</code>, ensure minimal fields are present and your rules prevent exposing emails or private details.
              </li>
            </ol>
          </section>

          <section id="rights" className={styles.section}>
            <h2 className={styles.h2}>User rights & requests</h2>
            <p>We honor requests to access, export, correct, or delete your data. To request, contact support (see bottom).</p>
            <ul className={styles.listSmall}>
              <li>Export: we provide your account and gameplay data as JSON.</li>
              <li>Delete: we remove profile and gameplay data (public aggregated snapshots may remain anonymized).</li>
              <li>Opt-out: disable analytics and personalized ads via consent controls.</li>
            </ul>
          </section>

          <section id="security" className={styles.section}>
            <h2 className={styles.h2}>Security & retention</h2>
            <p>
              We use TLS in transit, Firebase security rules, and follow principle of least privilege. Retention: account data retained until deletion; analytics rolled up and retained up to 12 months by default.
            </p>
          </section>

          <section id="gdpr" className={styles.section}>
            <h2 className={styles.h2}>Compliance (GDPR/CCPA)</h2>
            <p>
              If you are an EU/CA resident, you may request data access, portability or deletion. For ad networks that qualify as "sale" under CCPA, provide a clear opt-out mechanism ("Do Not Sell My Personal Information").
            </p>
          </section>

          <section id="implementation" className={styles.section}>
            <h2 className={styles.h2}>Developer implementation notes</h2>
            <h4>Recommended DB structure (public aggregator)</h4>
            <pre className={styles.codeBlock}>{`public/leaderboards/runner/{ uid }: { displayName, totalScore, coins, updatedAt }
public/leaderboards/sketch/{ entryId }: { displayName, score, createdAt }
`}</pre>

            <h4>Sample client-side write (add sketch round)</h4>
            <pre className={styles.codeBlock}>{`import { push, ref, set } from 'firebase/database';
const node = ref(database, 'users/' + uid + '/sketch');
const newRef = push(node);
set(newRef, { score: seconds, hits: hitsCount, createdAt: Date.now() });
// Optionally trigger server-side function to update public aggregator
`}</pre>

            <h4>Consent & loading third-party scripts</h4>
            <p>
              Block ad/analytics scripts until consent. Store consent in localStorage and honor it across sessions. Example key: <code>privacyConsent</code>.
            </p>
          </section>

          <section id="contact" className={styles.sectionBottom}>
            <h2 className={styles.h2}>Contact</h2>
            <p>
              For data requests or questions contact <a href="mailto:privacy@yourdomain.com">privacy@yourdomain.com</a>. We respond to verified requests within 30 days.
            </p>
            <div className={styles.actions}>

              <Link className={styles.btnPrimary} href="/">Back to home</Link>
              
              <a className={styles.btnGhost} href="mailto:privacy@yourdomain.com">Request data export</a>
            </div>
          </section>
        </article>

        {/* Consent banner - non-blocking and simple */}
        {consent && consent.analytics === null && (
          <div className={styles.consent} role="dialog" aria-live="polite">
            <div>
              <strong>We use cookies</strong>
              <div className={styles.consentText}>We use analytics and optional ads to fund the game. You can accept or decline tracking.</div>
            </div>
            <div className={styles.consentActions}>
              <button className={styles.btnGhost} onClick={declineAll}>Decline</button>
              <button className={styles.btnPrimary} onClick={acceptAll}>Accept</button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}


