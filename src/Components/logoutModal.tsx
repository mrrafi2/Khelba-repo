// src/Components/logout/LogoutModal.tsx
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./styles/logout.module.css";

type Props = {
  id?: string;
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
};

export default function LogoutModal({ id, open, onClose, onConfirm }: Props) {
  const [confirming, setConfirming] = useState(false);
  const modalRef = useRef<HTMLDivElement | null>(null);
  const yesBtnRef = useRef<HTMLButtonElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

    const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);


  // Create a portal container on mount (only in the browser)
  useEffect(() => {
    if (typeof document === "undefined") return;
    const el = document.createElement("div");
    el.className = styles.__portalContainer__ || "logout-portal-container";
    containerRef.current = el;
    document.body.appendChild(el);
    return () => {
      if (containerRef.current && containerRef.current.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      containerRef.current = null;
    };
  }, []);

  // Close on Escape / confirm on Enter — keep as you had it
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter") {
        if (!confirming) {
          handleYes();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, confirming, onClose]);

  // Focus + scroll lock + restore previous focus
  useEffect(() => {
    if (!open) {
      // restore scroll and focus
      try {
        document.body.style.overflow = "";
      } catch {}
      if (previousActiveRef.current) {
        try {
          previousActiveRef.current.focus();
        } catch {}
      }
      setConfirming(false);
      return;
    }

    // save previously focused element
    previousActiveRef.current = (document.activeElement as HTMLElement) ?? null;

    // lock scroll
    try {
      document.body.style.overflow = "hidden";
    } catch {}

    // focus yes button shortly after opening
    setTimeout(() => yesBtnRef.current?.focus(), 60);

    return () => {
      try {
        document.body.style.overflow = "";
      } catch {}
    };
  }, [open]);

  // Simple focus trap: loop Tab focus within modal
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const root = modalRef.current;
      if (!root) return;
      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.offsetParent !== null);

      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function handleYes() {
    if (confirming) return;
    setConfirming(true);

    try {
      // keep sync with your CSS animation duration
      await new Promise((res) => setTimeout(res, 700));
      await onConfirm();
    } catch (err) {
      console.error("Error during confirm:", err);
    } finally {
      setConfirming(false);
    }
  }

  if (!open || !containerRef.current) return null;

  const modal = (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
      className={styles.modalBackdrop}
      onClick={(e) => {
        // click on backdrop closes if target is backdrop
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalCard} ref={modalRef}>
        <div className={styles.modalHeader}>
          <div className={styles.iconBox} aria-hidden="true">
            <div className={styles.pixelHeart} />
            <div className={styles.star} />
            <div className={styles.starSmall} />
          </div>
          <h2 id="logout-modal-title" className={styles.title}>
            You sure you want to quit?
          </h2>
        </div>

        <p className={styles.message}>
          Logging out will end your session. Any unsaved progress may be lost.
          Are you sure you want to leave the game?
        </p>

        <div className={styles.actions}>
          <button
            ref={yesBtnRef}
            className={`${styles.btn} ${styles.btnConfirm} ${confirming ? styles.confirmBurst : ""}`}
            onClick={handleYes}
            aria-disabled={confirming}
            type="button"
          >
            {confirming ? "Confirming..." : "Yes, log me out"}
            <span className={styles.coin} aria-hidden="true" />
          </button>

          <button
            className={`${styles.btn} ${styles.btnCancel}`}
            onClick={() => {
              if (confirming) return;
              onClose();
            }}
            type="button"
          >
            No, stay
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, containerRef.current);
}
