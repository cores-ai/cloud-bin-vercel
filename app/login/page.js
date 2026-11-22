"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [granted, setGranted] = useState(false);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];
  const router = useRouter();

  useEffect(() => {
    // Focus first input on mount
    inputRefs[0]?.current?.focus();
  }, []);

  const handleInput = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1); // Take last character entered
    setDigits(newDigits);
    setError(false);

    // Auto-advance to next box
    if (value && index < 3) {
      inputRefs[index + 1]?.current?.focus();
    }

    // Auto-submit when all 4 digits filled
    const fullPin = newDigits.join("");
    if (fullPin.length === 4) {
      submitPasscode(fullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs[index - 1]?.current?.focus();
    }
  };

  const submitPasscode = async (pin) => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: pin }),
      });

      if (res.ok) {
        setGranted(true);
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 300);
      } else {
        setError(true);
        setDigits(["", "", "", ""]);
        inputRefs[0]?.current?.focus();
      }
    } catch {
      setError(true);
      setDigits(["", "", "", ""]);
      inputRefs[0]?.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className={`login-card ${error ? "shake" : ""} ${granted ? "unlocked" : ""}`}>
        <div className="login-brand">
          <span className="brand-dot" />
          <span>Cloud Bin // GATE_01</span>
        </div>

        <h1 className="login-title">Security Check</h1>
        <p className="login-sub">Enter 4-digit passcode to unlock vault</p>

        {/* 4 Digit Boxes */}
        <div className="pin-container">
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={inputRefs[idx]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              disabled={loading || granted}
              onChange={(e) => handleInput(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className={`pin-box ${error ? "pin-err" : ""} ${digit ? "pin-filled" : ""}`}
            />
          ))}
        </div>

        {/* Status Message */}
        <div className="login-status">
          {granted ? (
            <span className="status-granted">[ACCESS_GRANTED // REDIRECTING]</span>
          ) : error ? (
            <span className="status-error">[ACCESS_DENIED // INVALID_PIN]</span>
          ) : loading ? (
            <span className="status-loading">[VERIFYING_HASH...]</span>
          ) : (
            <span className="status-idle">&bull; COOKIE_AUTH: REMEMBERED FOR 1 YEAR</span>
          )}
        </div>
      </div>
    </div>
  );
}
