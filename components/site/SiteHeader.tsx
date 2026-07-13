import Link from "next/link";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Sudhanshu's Wanderer Archives";

export function SiteHeader({ showArchivist = true }: { showArchivist?: boolean }) {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--line)",
        background: "rgba(8,7,11,0.6)",
        backdropFilter: "blur(8px)",
        position: "sticky",
        top: 0,
        zIndex: 20,
      }}
    >
      <div
        className="site-container"
        style={{
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Link href="/" className="display" style={{ fontSize: "1.05rem", color: "var(--gold-soft)" }}>
          ❦ {siteName}
        </Link>
        {showArchivist && (
          <Link href="/archivist" className="tag" style={{ textDecoration: "none" }}>
            Archivist
          </Link>
        )}
      </div>
    </header>
  );
}
