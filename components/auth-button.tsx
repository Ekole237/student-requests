"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { LogoutButton } from "./logout-button";
import { useEffect, useState } from "react";
import { useUserStore } from "@/stores/user";

export function AuthButton() {
  const [isClient, setIsClient] = useState(false);
  const { userName, userEmail, fetchUserRole } = useUserStore();

  useEffect(() => {
    setIsClient(true);
    fetchUserRole();
  }, [fetchUserRole]);

  if (!isClient) {
    return null;
  }

  return userEmail ? (
    <div className="flex items-center gap-4">
      Hey, {userName || userEmail}!
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant={"outline"}>
        <Link href="/auth/login">Sign in</Link>
      </Button>
      <Button asChild size="sm" variant={"default"}>
        <Link href="/auth/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}
