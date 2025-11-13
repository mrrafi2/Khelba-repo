 "use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import styles from "../styles/login.module.css";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    try {
      setError("");
      setLoading(true);
      await login(email, password);
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Failed to login!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        <div className={styles.cardContainer}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3>Login</h3>
            </div>

            <div className={styles.cardBody}>
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.inputGroup}>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    aria-label="email"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.formInput}
                    placeholder="Enter your password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    aria-label="password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                  <button
                    type="reset"
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => {
                      setEmail("");
                      setPassword("");
                    }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <p className={styles.footerText}>
                  Don&apos;t have an account? <Link href="/signup">Sign-up</Link> instead!
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;