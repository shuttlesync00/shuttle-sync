import { AppShell } from "@/components/layout/app-shell";
import { getUser } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login");

  return <AppShell>{children}</AppShell>;
}
