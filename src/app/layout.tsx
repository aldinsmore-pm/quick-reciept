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
  title: "Quick Reciept — Landscape Receipts",
  description: "Snap or upload receipts and get instant, itemized expense capture for landscaping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
          <header className="border-b bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-sm bg-emerald-600" />
                <span className="font-semibold">Quick Reciept</span>
              </div>
              <nav className="text-sm text-gray-600">
                <a href="https://cookbook.openai.com" target="_blank" rel="noreferrer" className="hover:text-gray-900">Docs</a>
              </nav>
            </div>
          </header>
          <main>{children}</main>
          <footer className="mt-16 border-t bg-white/60">
            <div className="mx-auto max-w-5xl px-6 py-6 text-sm text-gray-600 flex items-center justify-between">
              <span>© {new Date().getFullYear()} Quick Reciept</span>
              <span>Built with Next.js, Tesseract, and GPT‑5</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
