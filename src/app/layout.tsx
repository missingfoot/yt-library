import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Channel Library",
  description: "Browse, filter, and tag your YouTube channel subscriptions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
