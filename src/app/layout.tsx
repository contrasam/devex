import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DevEx — Gamified Team Productivity Ticker",
  description: "Track your team's demand like a stock market. Assign tasks, watch valuations rise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
