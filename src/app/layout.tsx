import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { SetupNotice } from "@/components/setup-notice";
import { TimeZoneReporter } from "@/components/time-zone-reporter";
import { APP_FULL_NAME, APP_TAGLINE } from "@/config/app";
import { setupProblems } from "@/lib/setup-status";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: APP_FULL_NAME, template: `%s · GOE V3 Practice` },
  description: `${APP_FULL_NAME} – ${APP_TAGLINE}`,
  // Private app: keep it out of search results.
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0c0e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const problems = setupProblems();
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <TimeZoneReporter />
        {problems.length > 0 ? <SetupNotice problems={problems} /> : children}
      </body>
    </html>
  );
}
