import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Radha Naam Jaap | Daily Devotional Counter",
  description: "Radha Naam hi jeevan ka sahara hai. Track your daily jaap, set targets, and maintain your streak with this beautiful devotional counter app.",
  keywords: ["Radha", "Naam", "Jaap", "Counter", "Devotional", "Krishna", "Prayer"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#FF6F00" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌸</text></svg>" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
