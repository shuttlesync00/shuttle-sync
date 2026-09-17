"use client";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthInput } from "@/components/auth/auth-input";
import { useToast } from "@/hooks/use-toast";
import { playerSchema, type PlayerFormValues } from "@/lib/validations/player";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

export function PlayerForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PlayerFormValues>({
    resolver: zodResolver(playerSchema),
    defaultValues: {
      photoUrl: "",
      fullName: "",
      gender: "MALE",
      dateOfBirth: "",
      phoneNumber: "",
      preferredHand: "RIGHT",
      playingLevel: "INTERMEDIATE",
      city: "",
      state: "",
      country: "",
    },
  });

  async function onSubmit(values: PlayerFormValues) {
    const response = await fetch("/api/players", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      toast({ title: payload?.error ?? "Unable to save player", type: "error" });
      return;
    }

    toast({ title: "Player saved", type: "success" });
    router.push(`/players/${payload.id}`);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 md:grid-cols-2">
        <AuthInput label="Photo URL (optional)" error={errors.photoUrl?.message} {...register("photoUrl")} />
        <AuthInput label="Full Name" error={errors.fullName?.message} {...register("fullName")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-zinc-700">Gender</span>
          <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("gender")}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
        <AuthInput label="Date of Birth" type="date" error={errors.dateOfBirth?.message} {...register("dateOfBirth")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <AuthInput label="Mobile Number" type="tel" error={errors.phoneNumber?.message} {...register("phoneNumber")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-zinc-700">Preferred Hand</span>
          <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("preferredHand")}>
            <option value="RIGHT">Right</option>
            <option value="LEFT">Left</option>
          </select>
        </label>
        <label className="block text-sm">
          <span className="mb-2 block font-medium text-zinc-700">Playing Level</span>
          <select className="h-12 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4" {...register("playingLevel")}>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
            <option value="PROFESSIONAL">Professional</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AuthInput label="City" error={errors.city?.message} {...register("city")} />
        <AuthInput label="State" error={errors.state?.message} {...register("state")} />
        <AuthInput label="Country" error={errors.country?.message} {...register("country")} />
      </div>

      <AuthButton type="submit" isLoading={isSubmitting}>Save Player</AuthButton>
    </form>
  );
}
