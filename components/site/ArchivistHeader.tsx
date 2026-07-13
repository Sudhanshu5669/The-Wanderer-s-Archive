import Link from "next/link";

export function ArchivistHeader() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "rgba(8,7,11,0.6)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
      }}
    >
      <div
        className="site-container"
        style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}
      >
        <Link href="/archivist" className="display" style={{ color: "var(--gold-soft)" }}>
          ⚵ The Study
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <Link href="/" className="tag">
            View Shelf ↗
          </Link>
          <form action="/api/auth/logout" method="post" style={{ display: "inline" }}>
            <button className="tag" type="submit" style={{ cursor: "pointer", background: "transparent" }}>
              Log out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
