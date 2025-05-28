"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { getDefaultStore } from "jotai";
import { tokenAtom } from "@/lib/atoms/auth";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    // Rehydrate token from localStorage on app initialization
    const store = getDefaultStore();
    const storedToken = localStorage.getItem("auth_token");
    if (storedToken) {
      try {
        const parsedToken = JSON.parse(storedToken);
        store.set(tokenAtom, parsedToken);
      } catch (error) {
        console.error("Error rehydrating token:", error);
      }
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
