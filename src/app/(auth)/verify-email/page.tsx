import { AuthShell } from "@/components/auth/auth-shell";
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Check your email"
      subtitle="We have sent a verification link to your inbox."
      footer={<div className="space-y-2 text-sm"><p>Once verified, you can sign in to Shuttle Sync.</p><Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">Go to sign in</Link></div>}
    >
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">Please verify your email before signing in.</div>
    </AuthShell>
  );
}
