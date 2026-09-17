"use client";

import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checking, setChecking] = useState(true);
  const email = useMemo(() => searchParams.get("email") ?? "your email", [searchParams]);

  useEffect(() => {
    const supabase = createClient();

    async function checkSession() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email_confirmed_at) {
        router.replace("/dashboard");
        return;
      }

      setChecking(false);
    }

    void checkSession();
  }, [router]);

  return (
    <AuthShell
      title="Check your email"
      subtitle={checking ? "Checking your verification status..." : "We have sent a verification link to your inbox."}
      footer={<div className="space-y-2 text-sm"><p>Once verified, you can sign in to Shuttle Sync.</p><Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">Go to sign in</Link></div>}
    >
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
        {checking ? "Please wait while we confirm your email status." : `A verification email was sent to ${email}. Please confirm it before signing in.`}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<AuthShell title="Check your email" subtitle="Loading..." footer={null}><div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">Loading verification status...</div></AuthShell>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
