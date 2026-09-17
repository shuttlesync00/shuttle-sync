import { AuthShell } from "@/components/auth/auth-shell";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";
import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot password"
      subtitle="Enter your email and we will send you a reset link."
      footer={
        <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
