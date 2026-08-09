"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { db } from "@/lib/db";

const OWNER_EMAIL = "ytdb@jamessparkes.com";

export function AuthModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    if (email.trim().toLowerCase() !== OWNER_EMAIL) {
      setError("This library isn't open for editing by other accounts.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl">Sign in</h2>
          <button onClick={onClose} title="Close" className="rounded p-1.5 text-[var(--text-dim)] hover:bg-[var(--surface-hover)]">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {step === "email" ? (
          <form onSubmit={sendCode} className="flex flex-col gap-3">
            <p className="text-xs text-[var(--text-faint)]">Sign in to add, edit, or delete channels. Viewing is always open.</p>
            <input
              type="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="self-end text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded disabled:opacity-40"
            >
              send code
            </button>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-3">
            <p className="text-xs text-[var(--text-faint)]">Enter the code sent to {email}.</p>
            <input
              type="text"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Code"
              className="rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="self-end text-xs font-mono text-[var(--accent)] px-3 py-1.5 border border-[var(--accent-line)] rounded disabled:opacity-40"
            >
              verify
            </button>
          </form>
        )}
      </div>
    </>
  );
}
