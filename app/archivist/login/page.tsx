"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const params = new URLSearchParams(window.location.search);
      router.push(params.get("from") || "/archivist");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      setBusy(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "2rem",
      }}
    >
      <form
        onSubmit={onSubmit}
        style={{
          width: "100%",
          maxWidth: 380,
          padding: "2rem",
          border: "1px solid var(--line)",
          borderRadius: "0.9rem",
          background: "rgba(0,0,0,0.3)",
        }}
      >
        <h1 className="display" style={{ margin: "0 0 0.3rem", color: "var(--gold-soft)", fontSize: "1.5rem" }}>
          The Archivist&rsquo;s Study
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 0 }}>
          Only the Wanderer may pass.
        </p>

        <div style={{ marginTop: "1.25rem" }}>
          <label className="lbl" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            className="field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </div>
        <div style={{ marginTop: "0.9rem" }}>
          <label className="lbl" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p style={{ color: "#ffb4ac", fontSize: "0.85rem", marginTop: "0.9rem" }}>{error}</p>
        )}

        <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "1.25rem", justifyContent: "center" }} disabled={busy}>
          {busy ? "Entering…" : "Enter"}
        </button>
      </form>
    </main>
  );
}
