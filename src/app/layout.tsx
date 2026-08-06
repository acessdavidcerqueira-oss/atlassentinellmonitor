import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/app/providers";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "ATLAS SENTINEL | Executive CTI",
  description: "Executive CTI & Digital Threat Intelligence command center",
  icons: {
    icon: "/atlas-sentinel-logo.png"
  }
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <div className="technical-backdrop" />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
