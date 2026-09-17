"use client";

import { updatePassword } from "@/services/auth-service";
import { CheckCircle2, LockKeyhole, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

export function ProfilePasswordEditor() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordMessage(null);
    if (newPassword.length < 8) {
      setPasswordMessage("New password must be at least 8 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirm password must match.");
      return;
    }

    setIsSubmittingPassword(true);
    const result = await updatePassword(newPassword);
    setIsSubmittingPassword(false);
    if (result.error) {
      setPasswordMessage(result.error.message || "Unable to change password.");
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setShowPasswordForm(false);
    setPasswordMessage("Password updated successfully.");
  }

  return (
    <section className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.05)] sm:p-8">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Security</p>
          <h2 className="mt-2 text-2xl font-semibold text-zinc-900">Password</h2>
          <p className="mt-1 text-sm text-zinc-500">Manage your account password.</p>
        </div>
      </div>
      <button type="button" onClick={() => setShowPasswordForm((open) => !open)} className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"><LockKeyhole className="h-4 w-4" />Change password</button>
      {showPasswordForm ? (
        <form onSubmit={handlePasswordSubmit} className="mt-5 grid gap-4 rounded-2xl bg-zinc-50 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="text-sm font-medium text-zinc-700">New password<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 outline-none focus:border-emerald-500" /></label>
          <label className="text-sm font-medium text-zinc-700">Confirm password<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 outline-none focus:border-emerald-500" /></label>
          <button type="submit" disabled={isSubmittingPassword} className="h-11 rounded-full bg-emerald-500 px-4 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60">{isSubmittingPassword ? "Updating..." : "Update password"}</button>
        </form>
      ) : null}
      {passwordMessage ? <p className={`mt-3 flex items-center gap-2 text-sm ${passwordMessage.includes("successfully") ? "text-emerald-600" : "text-red-600"}`}>{passwordMessage.includes("successfully") ? <CheckCircle2 className="h-4 w-4" /> : <X className="h-4 w-4" />}{passwordMessage}</p> : null}
    </section>
  );
}
