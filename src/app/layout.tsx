import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Studio – KI-Social-Media-Management",
  description: "KI-gestütztes Social-Media-Management für Facebook, Instagram und LinkedIn",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
