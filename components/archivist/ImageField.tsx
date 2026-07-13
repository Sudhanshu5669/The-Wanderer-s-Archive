"use client";

import { useState } from "react";

export function ImageField({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data.url) setUrl(data.url);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="lbl">{label}</label>
      <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            style={{ width: 44, height: 66, objectFit: "cover", borderRadius: 4, border: "1px solid var(--line)" }}
          />
        ) : (
          <div
            style={{
              width: 44,
              height: 66,
              borderRadius: 4,
              border: "1px dashed var(--line)",
              display: "grid",
              placeItems: "center",
              color: "var(--muted)",
              fontSize: "0.7rem",
            }}
          >
            none
          </div>
        )}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.4rem" }}>
          <input
            className="field"
            name={name}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste an image URL, or upload →"
          />
          <label className="btn" style={{ alignSelf: "flex-start", fontSize: "0.8rem", padding: "0.3rem 0.7rem" }}>
            {busy ? "Uploading…" : "Upload image"}
            <input type="file" accept="image/*" onChange={onFile} hidden />
          </label>
        </div>
      </div>
    </div>
  );
}
