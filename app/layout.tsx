import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import AppSidebar from "@/components/app-sidebar";
import { SessionProvider } from "next-auth/react";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Devshub",
  description:
    "Devshub is a platform for developers to share their projects and get feedback from other developers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SessionProvider>
      <html lang="pt-BR">
        <body className={`${inter.variable}`}>
          <div className="flex w-full h-full">
            <AppSidebar />
            <div className="flex flex-col flex-1 w-full h-[calc(100vh-1rem)] px-4 py-2">
              {children}
            </div>
          </div>
          <Toaster />
        </body>
      </html>
    </SessionProvider>
  );
}
