import type { Metadata } from "next";
import { fontVariables } from "@/lib/fonts";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Sudhanshu's Wanderer Archives";

export const metadata: Metadata = {
  title: { default: siteName, template: `%s · ${siteName}` },
  description:
    "The Wanderer's Archive — an immersive collection of stories by Sudhanshu. Mythology, horror, true crime, investigation, and fiction, each page themed to its tale.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={fontVariables}>{children}</body>
    </html>
  );
}
