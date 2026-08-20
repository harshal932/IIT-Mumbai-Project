import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@/app/globals.css";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "LocalLoop — Location-Based Community Problem Solving",
  description:
    "Report, discover, verify, and solve local community and personal problems with nearby neighbors, NGOs, and authorities.",
  keywords: ["community", "local problems", "civic tech", "neighborhood", "location-based"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100 font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
