import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/NavBar";
import { ClerkProvider } from "@clerk/nextjs";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "KASH",
  description: "Know exactly where every dollar goes. AI-powered bank statement analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={geist.variable}>
        <body className="flex flex-col min-h-screen" style={{ background: "var(--bg-base)" }}>
          <Navbar />
          <main className="flex-1 w-full">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
