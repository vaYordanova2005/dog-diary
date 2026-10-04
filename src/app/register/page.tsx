import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { signIn } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PasswordField } from "@/components/PasswordField";
import { Logo } from "@/components/Logo";

async function register(formData: FormData) {
  "use server";

  const name = String(formData.get("name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const clinicCode = String(formData.get("clinicCode") ?? "").trim();

  const requiredCode = process.env.REGISTRATION_CODE;
  if (!requiredCode && process.env.NODE_ENV === "production") {
    // Without a code set, the online version doesn't allow registration at all
    redirect("/register?error=closed");
  }
  if (requiredCode && clinicCode !== requiredCode) {
    redirect("/register?error=code");
  }

  if (!name || !username || !password) {
    redirect("/register?error=missing");
  }

  if (password.length < 6) {
    redirect("/register?error=weak");
  }

  if (password !== confirmPassword) {
    redirect("/register?error=mismatch");
  }

  const existing = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existing) {
    redirect("/register?error=exists");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      name,
      username,
      passwordHash,
      role: "INTERN",
    },
  });

  try {
    await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login");
    }
    throw error;
  }

  redirect("/");
}

const errorMessages: Record<string, string> = {
  missing: "Please fill in all fields.",
  weak: "The password must be at least 6 characters.",
  mismatch: "The passwords don't match.",
  exists: "An account with this username already exists.",
  code: "Wrong clinic code.",
  closed: "Registration is disabled. Contact the clinic.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : undefined;
  const needsCode = !!process.env.REGISTRATION_CODE;

  return (
    <div
      className="flex flex-1 items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url(/images/login-background.png)" }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
        <Logo className="mx-auto mb-4 h-20 w-24" />

        <h1 className="mb-1 text-2xl font-bold text-zinc-900">
          The Dog Diary
        </h1>
        <p className="mb-6 text-sm text-zinc-500">Create a new account</p>

        {errorMessage && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <form action={register} className="flex flex-col gap-4 text-left">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
              </svg>
            </span>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Name"
              className="w-full rounded-full border border-transparent bg-zinc-100 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[#fac898] focus:bg-white"
            />
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
            </span>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Username"
              className="w-full rounded-full border border-transparent bg-zinc-100 py-3 pl-10 pr-4 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[#fac898] focus:bg-white"
            />
          </div>

          <PasswordField autoComplete="new-password" />

          <PasswordField
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm password"
            autoComplete="new-password"
          />

          {needsCode && (
            <input
              id="clinicCode"
              name="clinicCode"
              type="password"
              required
              autoComplete="off"
              placeholder="Clinic code"
              className="w-full rounded-full border border-transparent bg-zinc-100 px-4 py-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-500 focus:border-[#fac898] focus:bg-white"
            />
          )}

          <button
            type="submit"
            className="mt-2 rounded-full bg-[#fac898] px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#f19c47]"
          >
            Sign up
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#f19c47] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
