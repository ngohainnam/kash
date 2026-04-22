"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FolderOpen,
  MessageSquare,
  TrendingUp,
  BarChart2,
  Target,
  Activity,
} from "lucide-react";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "/", icon: TrendingUp, label: "Home" },
  { href: "/dashboard", icon: Activity, label: "Dashboard" },
  { href: "/files", icon: FolderOpen, label: "Files" },
  { href: "/chats", icon: MessageSquare, label: "Chats" },
  { href: "/visualize", icon: BarChart2, label: "Visualize" },
  { href: "/budget", icon: Target, label: "Budget" },
];

export default function Navbar() {
  const path = usePathname();
  const { isSignedIn } = useAuth();

  return (
    <header className="navbar">
      <nav className="inner">
        {/* Left: brand + links */}
        <div className="left">
          <Link href="/" className="brand">
            <div className="logo-wrap">
              <TrendingUp size={15} color="#fff" strokeWidth={2.5} />
            </div>
            <span className="name">KASH</span>
          </Link>

          <ul className="links">
            {NAV.map(({ href, icon: Icon, label }) => {
              const active = path === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={`nav-link${active ? " active" : ""}`}
                  >
                    <Icon size={14} strokeWidth={active ? 2.5 : 1.8} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Right: auth */}
        <div className="actions">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <Button variant="ghost" size="sm" className="text-xs font-semibold px-4 py-2" style={{ color: "var(--text-secondary)" }}>
                  Sign in
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="text-xs font-semibold px-4 py-2" style={{ background: "var(--accent)", color: "#fff", border: "none" }}>
                  Get started
                </Button>
              </SignUpButton>
            </>
          ) : (
            <>
              <span className="badge">AI-powered</span>
              <UserButton
                appearance={{ elements: { avatarBox: "w-7 h-7" } }}
              />
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

