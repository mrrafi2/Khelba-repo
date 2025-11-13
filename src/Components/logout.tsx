// components/LogoutButton.tsx
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import LogoutModal from "./logoutModal";
import styles from "./styles/logout.module.css";


export default function LogoutButton() {
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function handleConfirmLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      router.replace("/login");
    }
  }

  return (
    <>
      <button
        className={styles.logoutBtn}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="logout-modal"
        type="button"
      >
       <span className={styles.controller} aria-hidden="true">
  <svg width="29" height="29" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Circular portal frame */}
    <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="1.6" opacity="0.3"/>
    
    {/* Inner segmented energy ring */}
    <path d="M14 2 a12 12 0 0 1 0 24 a12 12 0 0 1 0 -24" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" strokeLinecap="round">
      <animateTransform attributeName="transform" type="rotate" from="0 14 14" to="360 14 14" dur="2s" repeatCount="indefinite"/>
    </path>

    {/* Logout arrow jumping out */}
    <path d="M10 14h8M18 10l6 4-6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite"/>
    </path>

    {/* Tiny energy sparks */}
    <circle cx="8" cy="6" r="1.2" fill="currentColor">
      <animate attributeName="r" values="1.2;2;1.2" dur="0.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="20" cy="22" r="1.2" fill="currentColor">
      <animate attributeName="r" values="1.2;2;1.2" dur="1s" repeatCount="indefinite"/>
    </circle>
  </svg>
</span>


      </button>

      <LogoutModal
        id="logout-modal"
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
}
