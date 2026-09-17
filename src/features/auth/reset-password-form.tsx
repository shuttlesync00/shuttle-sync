"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { useToast } from "@/hooks/use-toast";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations/auth";
import { updatePassword } from "@/services/auth-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

export function ResetPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema), defaultValues: { password: "", confirmPassword: "" } });

  async function onSubmit(values: ResetPasswordFormValues) {
    const { error } = await updatePassword(values.password);
    if (error) {
      toast({ title: error.message, type: "error" });
      return;
    }
    toast({ title: "Password updated successfully", type: "success" });
    router.push("/login");
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <AuthInput
        label="New Password"
        type={showPassword ? "text" : "password"}
        autoComplete="new-password"
        error={errors.password?.message}
        endAdornment={
          <button
            type="button"
            aria-label={showPassword ? "Hide new password" : "Show new password"}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
            onClick={() => setShowPassword((visible) => !visible)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        }
        {...register("password")}
      />
      <AuthInput
        label="Confirm New Password"
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
      <AuthButton type="submit" isLoading={isSubmitting}>Update password</AuthButton>
    </form>
  );
}
