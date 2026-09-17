import { getMissingEnv } from "@/lib/env";
import { AppProviders } from "@/providers/app-providers";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Shuttle Sync",
  description: "Badminton management platform architecture MVP",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const missing = getMissingEnv();
  if (missing.length > 0) {
    return (
      <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
        <body className="min-h-full bg-zinc-950 text-zinc-100">
          <div className="mx-auto max-w-3xl p-8">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
              <h1 className="text-2xl font-semibold">Missing environment variables</h1>
              <p className="mt-2 text-zinc-400">The application requires the following environment variables to be set for local development and authentication to work correctly:</p>
              <ul className="mt-4 list-disc pl-6">
                {missing.map((v) => (
                  <li key={v} className="text-zinc-200"><code className="rounded bg-zinc-800 px-2 py-1 text-sm">{v}</code></li>
                ))}
              </ul>
              <p className="mt-4 text-zinc-400">Create a <code className="rounded bg-zinc-800 px-2 py-1 text-sm">.env.local</code> file in the project root and add these keys. See <code className="rounded bg-zinc-800 px-2 py-1 text-sm">.env.example</code> for an example.</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-950 text-zinc-100">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
