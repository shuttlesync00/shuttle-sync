"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { useToast } from "@/hooks/use-toast";
import { registerSchema, type RegisterFormValues } from "@/lib/validations/auth";
import { signUpWithEmail } from "@/services/auth-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function RegisterForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", phoneNumber: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    const { data, error } = await signUpWithEmail(values.email, values.password, values.fullName, values.phoneNumber);
    if (error) {
      toast({ title: error.message, type: "error" });
      return;
    }
    if (data.user) {
      toast({ title: "Check your inbox to verify your email", type: "success" });
      router.push("/verify-email");
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <AuthInput label="Full Name" autoComplete="name" error={errors.fullName?.message} {...register("fullName")} />
      <AuthInput label="Email Address" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <AuthInput label="Phone Number" type="tel" autoComplete="tel" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
      <AuthInput
        label="Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
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
      <AuthInput
        label="Confirm Password"
        type={showConfirmPassword ? "text" : "password"}
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        endAdornment={
          <button
            type="button"
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
            onClick={() => setShowConfirmPassword((visible) => !visible)}
          >
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...register("confirmPassword")}
      />
      <AuthButton type="submit" isLoading={isSubmitting}>Create account</AuthButton>
    </form>
  );
}
