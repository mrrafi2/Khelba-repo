// src/Components/pages/Signup.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import styles from "../styles/signup.module.css";

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [agree, setAgree] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { signup } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match!");
      return;
    }
    if (!agree) {
      setError("You must agree to the terms and conditions.");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await signup(email, password, username);
      // signup should create session / set currentUser in AuthContext
      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Failed to create an account!");
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
              <h3>Create an Account</h3>
            </div>

            <div className={styles.cardBody}>
              <form onSubmit={handleSubmit} className={styles.form} noValidate>
                {/* Username */}
                <div className={styles.inputGroup}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Enter your username"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    aria-label="username"
                  />
                  <div className={styles.invalidFeedback}>Please enter a username.</div>
                </div>

                {/* Email */}
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
                  <div className={styles.invalidFeedback}>Please enter a valid email.</div>
                </div>

                {/* Password */}
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
                  <div className={styles.invalidFeedback}>Please enter a password.</div>
                </div>

                <div className={styles.inputGroup}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.formInput}
                    placeholder="Confirm password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    aria-label="confirm password"
                  />
                  <div className={styles.invalidFeedback}>Please confirm your password.</div>
                </div>

                {/* show password & agree */}
                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    id="showPassword"
                    checked={showPassword}
                    onChange={() => setShowPassword((prev) => !prev)}
                  />
                  <label htmlFor="showPassword" className={styles.checkboxLabel}>
                    Show Password
                  </label>
                </div>

                <div className={styles.checkboxGroup}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    id="agree"
                    checked={agree}
                    onChange={() => setAgree((prev) => !prev)}
                    required
                  />
                  <label htmlFor="agree" className={styles.checkboxLabel}>
                    I agree to the{" "}
                    <Link href="/terms">terms and conditions</Link>
                  </label>
                </div>

                {/* Buttons */}
                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={`${styles.button} ${styles.buttonPrimary}`}
                    disabled={loading}
                  >
                    {loading ? "Creating..." : "Sign Up"}
                  </button>

                  <button
                    type="reset"
                    className={`${styles.button} ${styles.buttonSecondary}`}
                    onClick={() => {
                      setUsername("");
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                      setAgree(false);
                    }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <p className={styles.footerText}>
                  Already have an account? <Link href="/login">Log In</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
