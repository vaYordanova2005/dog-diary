import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { auth, signOut } from "@/auth";
import { Logo } from "@/components/Logo";
import { isDemoMode } from "@/lib/demo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Dog Diary",
  description: "Medical profiles of animals for a veterinary clinic",
};

const roleLabel: Record<string, string> = {
  ADMIN: "Administrator",
  DOCTOR: "Doctor",
  INTERN: "Intern",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        {session?.user && (
          <header className="border-b border-orange-200 bg-[#FFDBBB]">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <Logo className="h-8 w-8" />
                The Dog Diary
              </Link>
              <div className="flex items-center gap-4 text-sm text-zinc-600">
                <span>
                  {session.user.name}
                  {role && roleLabel[role] && roleLabel[role] !== session.user.name && (
                    <span className="ml-2 rounded-full bg-white/70 px-2 py-0.5 text-xs text-zinc-500">
                      {roleLabel[role]}
                    </span>
                  )}
                </span>
                {!isDemoMode() && (
                  <Link href="/password" className="hover:text-zinc-900 hover:underline">
                    Change password
                  </Link>
                )}
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/login" });
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-md border border-[#f2803a] bg-[#ff964f] px-3 py-1.5 text-white hover:bg-[#f2803a]"
                  >
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </header>
        )}
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
