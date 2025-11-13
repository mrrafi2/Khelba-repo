// src/app/providers.tsx
"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "../context/AuthContext";
import Loader from "../Components/loader";

function AuthGate({ children }: React.PropsWithChildren<{}>) {
  const { currentUser, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const publicRoutes = ["/login", "/signup", "/about", "/terms", "/privacy", "/contact"];

  useEffect(() => {
    if (!loading) {
      if (!currentUser && !publicRoutes.includes(pathname)) {
        router.replace("/login");
      }

      if (currentUser && (pathname === "/login" || pathname === "/signup")) {
        router.replace("/");
      }
    }
  }, [currentUser, loading, pathname, router]);

  if (loading) {
    return (
     <Loader />
    );
  }

  return <>{children}</>;
}

export default function Providers({ children }: React.PropsWithChildren<{}>) {
  return (
    <AuthProvider>
      <AuthGate>
        <AppLayout>{children}</AppLayout>
      </AuthGate>
    </AuthProvider>
  );
}

function AppLayout({ children }: React.PropsWithChildren<{}>) {
  const { currentUser } = useAuth();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      
      <main style={{ flex: 1 }}>{children}</main>

     
    </div>
  );
}



