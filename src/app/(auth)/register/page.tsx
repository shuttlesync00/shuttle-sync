import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/features/auth/register-form";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Start organizing tournaments, teams, and live scoring."
      footer={
        <p>
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
    </AuthShell>
  );
}
