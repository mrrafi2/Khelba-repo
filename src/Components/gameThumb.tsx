// components/GameThumbnail.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import styles from "./styles/gamethumb.module.css";

type Props = {
  slug: string;
  title: string;
  imgSrc: string;
  description?: string;
  score?: number | null;
  isNew?: boolean;
};

const GameThumbnail: React.FC<Props> = ({ slug, title, imgSrc, description, score = null, isNew = false }) => {
  return (
    <Link href={`/games/${slug}`} aria-label={`Open ${title} game`}>
      <div className={styles.card} data-game={slug}>
        <div className={styles.media} aria-hidden="false">
          <Image src={imgSrc} alt={title} fill className={styles.image} sizes="(max-width: 480px) 200px, 300px" priority={false} />
          <div className={styles.overlay} aria-hidden="true">
            <div className={styles.playBadge} aria-hidden="true" role="img" title="Play">

              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M5 3v18l15-9L5 3z" fill="currentColor" />
              </svg>
            </div>

            <div className={styles.ribbons} aria-hidden="true">
              {isNew && <span className={styles.newBadge}>NEW</span>}
              {score !== null && <span className={styles.scoreBadge}>★ {score}</span>}

            </div>
          </div>
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{title}</h3>
          {description && <p className={styles.desc}>{description}</p>}
        </div>
      </div>
    </Link>
  );
};

export default GameThumbnail;
