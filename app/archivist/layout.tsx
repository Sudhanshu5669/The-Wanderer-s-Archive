import { getSession } from "@/lib/auth";
import { ArchivistHeader } from "@/components/site/ArchivistHeader";

export const dynamic = "force-dynamic";

export default async function ArchivistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return (
    <>
      {session && <ArchivistHeader />}
      {children}
    </>
  );
}
