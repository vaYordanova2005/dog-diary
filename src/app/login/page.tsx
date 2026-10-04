import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { LoginForm } from "@/components/LoginForm";
import { Logo } from "@/components/Logo";

async function login(formData: FormData) {
  "use server";

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  try {
    await signIn("credentials", {
      username,
      password,
      remember: remember ? "true" : "false",
      redirect: false,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect("/login?error=1");
    }
    throw error;
  }

  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  // Same rule as in /register: online without a code, registration is disabled
  const registrationOpen =
    !!process.env.REGISTRATION_CODE || process.env.NODE_ENV !== "production";

  return (
    <div
      className="flex flex-1 items-center justify-center bg-cover bg-center px-4"
      style={{ backgroundImage: "url(/images/login-background.png)" }}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white/95 p-8 text-center shadow-xl backdrop-blur-sm">
        <Logo className="mx-auto mb-4 h-20 w-24" />

        <h1 className="mb-6 text-2xl font-bold text-zinc-900">
          The Dog Diary
        </h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            Wrong username or password.
          </p>
        )}

        <LoginForm action={login} />

        {registrationOpen && (
        <p className="mt-6 text-sm text-zinc-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-[#f19c47] hover:underline">
            Sign up
          </Link>
        </p>
        )}
      </div>
    </div>
  );
}
