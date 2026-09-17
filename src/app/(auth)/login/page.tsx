import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/features/auth/login-form";
import Link from "next/link";

export default function LoginPage() {
  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue managing your badminton ecosystem."
      footer={
        <p>
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-700">
            Create account
          </Link>
        </p>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
