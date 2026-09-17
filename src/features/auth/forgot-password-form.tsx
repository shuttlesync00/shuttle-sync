"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { useToast } from "@/hooks/use-toast";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations/auth";
import { resetPasswordEmail } from "@/services/auth-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

export function ForgotPasswordForm() {
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema), defaultValues: { email: "" } });

  async function onSubmit(values: ForgotPasswordFormValues) {
    const { error } = await resetPasswordEmail(values.email);
    if (error) {
      toast({ title: error.message, type: "error" });
      return;
    }
    toast({ title: "We have sent a password reset email.", type: "success" });
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <AuthInput label="Email Address" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
      <AuthButton type="submit" isLoading={isSubmitting}>Send reset link</AuthButton>
    </form>
  );
}
