"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { useToast } from "@/hooks/use-toast";
import { loginSchema, type LoginFormValues } from "@/lib/validations/auth";
import { signInWithEmail } from "@/services/auth-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    const { data, error } = await signInWithEmail(values.email, values.password);
    if (error) {
      toast({ title: error.message.includes("Email not confirmed") ? "Please verify your email before signing in." : error.message, type: "error" });
      return;
    }
    if (data.session) {
      toast({ title: "Signed in successfully", type: "success" });
      router.replace("/dashboard");
      router.refresh();
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <AuthInput label="Email Address" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <AuthInput
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        error={errors.password?.message}
        endAdornment={
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...register("password")}
      />
      <div className="flex justify-end text-sm"><a href="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-700">Forgot password?</a></div>
      <AuthButton type="submit" isLoading={isSubmitting}>Sign in</AuthButton>
    </form>
  );
}
