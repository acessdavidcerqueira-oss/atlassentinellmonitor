"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/features/state/auth-store";
import { AtlasProvider } from "@/features/state/atlas-store";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AtlasProvider>{children}</AtlasProvider>
    </AuthProvider>
  );
}
