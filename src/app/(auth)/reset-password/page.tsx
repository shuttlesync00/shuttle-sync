import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
