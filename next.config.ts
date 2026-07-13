import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // better-sqlite3 is a native addon; keep it external so Next doesn't try to
  // bundle it. (At deploy time on Postgres this is harmless.)
  serverExternalPackages: ["better-sqlite3", "@prisma/adapter-better-sqlite3"],
  images: {
    // Allow locally-uploaded media (dev) and, later, remote blob hosts.
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
