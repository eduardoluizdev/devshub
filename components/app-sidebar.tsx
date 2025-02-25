"use client";

import Link from "next/link";
import { Home, MessageCircle, Settings } from "lucide-react";
import { SignOut } from "@/components/sign-out";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
}

const NavLink = ({ href, icon, label, isActive }: NavLinkProps) => (
  <Link
    href={href}
    className={cn(
      "flex items-center gap-2 hover:bg-primary/10 rounded-md p-2 transition-colors duration-300",
      isActive && "bg-primary/10 text-primary"
    )}
  >
    {icon} {label}
  </Link>
);

const AppSidebar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session?.user) {
    return null;
  }

  const navLinks = [
    { href: "/", icon: <Home />, label: "Home" },
    { href: "/configuration", icon: <Settings />, label: "Configuração" },
    { href: "/whatsapp", icon: <MessageCircle />, label: "Whatsapp" },
  ];

  return (
    <aside className="flex flex-col flex-1 w-full h-screen max-w-[300px] px-4 py-2 bg-white border-r border-gray-200">
      <nav className="flex flex-col gap-2">
        {navLinks.map((link) => (
          <NavLink
            key={link.href}
            {...link}
            isActive={pathname === link.href}
          />
        ))}
      </nav>

      <div className="flex flex-col gap-2 mt-auto">
        <SignOut />
      </div>
    </aside>
  );
};

export default AppSidebar;
