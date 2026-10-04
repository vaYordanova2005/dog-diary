import Link from "next/link";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { PasswordField } from "@/components/PasswordField";

async function changePassword(formData: FormData) {
  "use server";

  const session = await requireUser();
  const userId = session.user?.id;
  if (!userId) redirect("/logout");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) redirect("/password?error=weak");
  if (newPassword !== confirmPassword) redirect("/password?error=mismatch");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) redirect("/logout");

  const matches = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!matches) redirect("/password?error=current");

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 10) },
  });

  redirect("/password?success=1");
}

const errorMessages: Record<string, string> = {
  weak: "The new password must be at least 6 characters.",
  mismatch: "The new passwords don't match.",
  current: "The current password is wrong.",
};

export default async function PasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireUser();
  const { error, success } = await searchParams;
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Link
          href="/"
          className="rounded-md bg-[#ff964f] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#f2803a]"
        >
          ← Back
        </Link>
        <h1 className="inline-block rounded-md bg-[#fbe4cf] px-4 py-2 text-2xl font-semibold">
          Change password
        </h1>
      </div>

      {errorMessage && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
      )}
      {success && (
        <p className="mb-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Password changed successfully.
        </p>
      )}

      <form
        action={changePassword}
        className="flex flex-col gap-4 rounded-lg border border-[#fbe4cf] bg-[#fff1e3] p-5"
      >
        <PasswordField
          id="currentPassword"
          name="currentPassword"
          placeholder="Current password"
          autoComplete="current-password"
        />
        <PasswordField
          id="newPassword"
          name="newPassword"
          placeholder="New password"
          autoComplete="new-password"
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Confirm new password"
          autoComplete="new-password"
        />
        <button
          type="submit"
          className="mt-2 rounded-md bg-[#ff964f] px-4 py-2 text-sm font-medium text-white hover:bg-[#f2803a]"
        >
          Change password
        </button>
      </form>
    </main>
  );
}
