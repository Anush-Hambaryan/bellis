"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

interface RedirectWhenSignedInProps {
  redirectTo?: string;
}

export function RedirectWhenSignedIn({
  redirectTo = "/",
}: RedirectWhenSignedInProps) {
  const { isLoaded, isSignedIn } = useUser();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      window.location.replace(redirectTo);
    }
  }, [isLoaded, isSignedIn, redirectTo]);

  return null;
}
