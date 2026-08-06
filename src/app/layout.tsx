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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                var key = "atlas-sentinel-chunk-reload";
                function recover(event) {
                  var message = String((event && (event.message || event.reason && event.reason.message)) || "");
                  var target = event && event.target;
                  var source = target && target.src ? String(target.src) : "";
                  var isChunkError = message.indexOf("ChunkLoadError") >= 0 || source.indexOf("/_next/static/chunks/") >= 0;
                  if (!isChunkError || sessionStorage.getItem(key) === "1") return;
                  sessionStorage.setItem(key, "1");
                  if ("caches" in window) {
                    caches.keys().then(function (names) {
                      return Promise.all(names.map(function (name) { return caches.delete(name); }));
                    }).finally(function () {
                      window.location.reload();
                    });
                    return;
                  }
                  window.location.reload();
                }
                window.addEventListener("error", recover, true);
                window.addEventListener("unhandledrejection", recover, true);
                window.addEventListener("load", function () {
                  setTimeout(function () { sessionStorage.removeItem(key); }, 5000);
                });
              })();
            `
          }}
        />
        <div className="technical-backdrop" />
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
