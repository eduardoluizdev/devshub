"use client";

import { signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function SignOut() {
  const handleSignOut = async () => {
    await signOut();
    toast.success("Deslogado com sucesso");
  };

  return (
    <Button onClick={handleSignOut} className="w-full cursor-pointer">
      <LogOut /> Sair
    </Button>
  );
}
