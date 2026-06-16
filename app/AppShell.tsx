"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignInButton, SignOutButton, SignUpButton, UserAvatar, useUser } from "@clerk/nextjs";
import { BellisMark } from "./components/BellisMark";
import { Sparkles } from "./animations/Sparkles";
import { Clouds } from "./animations/Clouds";
import { Flowers } from "./animations/Flowers";
import { ModeSwitch, type Mode } from "./animations/ModeSwitch";

function NavIcon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

const DeckIcon = () => (
  <NavIcon>
    <path d="M5 5.5h14a2.5 2.5 0 0 1 2.5 2.5v7.5A2.5 2.5 0 0 1 19 18H10l-5 3v-3A2.5 2.5 0 0 1 2.5 15.5V8A2.5 2.5 0 0 1 5 5.5Z" />
    <line x1="7.5" y1="10" x2="16.5" y2="10" />
    <line x1="7.5" y1="13.5" x2="13.5" y2="13.5" />
  </NavIcon>
);

const AnalyticsIcon = () => (
  <NavIcon>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6"  y1="20" x2="6"  y2="14" />
  </NavIcon>
);

const AboutIcon = () => (
  <NavIcon>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <line x1="12" y1="7" x2="12.01" y2="7" />
  </NavIcon>
);

const SidebarIcon = ({ expanded }: { expanded: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"
    className="shrink-0">
    {expanded ? (
      <polyline points="15 6 9 12 15 18" />
    ) : (
      <polyline points="9 6 15 12 9 18" />
    )}
  </svg>
);

const NAV = [
  { href: "/", label: "Learning Space",  Icon: DeckIcon      },
  { href: "/analytics",  label: "Analytics",  Icon: AnalyticsIcon },
  { href: "/about", label: "About", Icon: AboutIcon },
] as const;

const DEFAULT_MODE: Mode = "sparkle";
const MODE_STORAGE_KEY = "bellis_animation_mode";

function isMode(value: string | null): value is Mode {
  return value === "default" || value === "sparkle" || value === "flower" || value === "cloud";
}

function capitalizeName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

interface AppShellProps {
  children: ReactNode;
  lockScroll?: boolean;
}

export function AppShell({ children, lockScroll = false }: AppShellProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === "undefined") return DEFAULT_MODE;
    const savedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    return isMode(savedMode) ? savedMode : DEFAULT_MODE;
  });
  const [accountOpen, setAccountOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mobileAccountMenuRef = useRef<HTMLDivElement>(null);
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");
  const isPublicAboutPage = pathname === "/about";

  useEffect(() => {
    localStorage.setItem(MODE_STORAGE_KEY, mode);
  }, [mode]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || isAuthPage || isPublicAboutPage) return;

    const primaryEmail = user.primaryEmailAddress?.emailAddress;
    if (primaryEmail) localStorage.removeItem("lexica_user");
  }, [isAuthPage, isLoaded, isPublicAboutPage, isSignedIn, user?.primaryEmailAddress?.emailAddress]);

  useEffect(() => {
    if (!accountOpen) return;

    function closeAccountMenu(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !accountMenuRef.current?.contains(target) &&
        !mobileAccountMenuRef.current?.contains(target)
      ) {
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", closeAccountMenu);
    return () => document.removeEventListener("mousedown", closeAccountMenu);
  }, [accountOpen]);

  if (!isLoaded) return null;
  if (isAuthPage || isPublicAboutPage) return <>{children}</>;
  if (!isSignedIn || !user) {
    return (
      <div className="relative min-h-screen bg-page">
        <div className="fixed top-[18px] right-[18px] z-10 flex items-center gap-2">
          <SignInButton>
            <button className="h-9 cursor-pointer rounded-[12px] border border-black/[0.07] bg-white px-[14px] font-sans text-[13px] font-[650] text-black/85">
              Sign in
            </button>
          </SignInButton>
          <SignUpButton>
            <button className="h-9 cursor-pointer rounded-[12px] border-0 bg-accent px-[14px] font-sans text-[13px] font-[650] text-white">
              Sign up
            </button>
          </SignUpButton>
        </div>
        {children}
      </div>
    );
  }

  const firstName =
    capitalizeName(
      user.firstName ||
      user.fullName?.split(" ")[0] ||
      user.primaryEmailAddress?.emailAddress.split("@")[0] ||
      "there"
    );

  return (
    <div className="flex h-screen overflow-hidden bg-page font-sans">

      {/* ── Floating Sidebar ── */}
      <nav
        className={`z-50 my-3 ml-3 hidden h-[calc(100vh-24px)] shrink-0 flex-col items-center overflow-visible rounded-[20px] border border-black/[0.07] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-[width] duration-[220ms] ease-out md:flex ${
          sidebarExpanded ? "w-52" : "w-16"
        }`}
      >

        {/* Logo mark + sidebar toggle */}
        <div
          className={`flex w-full shrink-0 items-center gap-2.5 pt-4 ${
            sidebarExpanded ? "justify-between px-3" : "justify-center px-0"
          }`}
        >
          {sidebarExpanded && (
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white">
                <BellisMark size={28} />
              </div>
              <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-[750] text-black/85">
                Bellis
              </div>
            </div>
          )}
          <button
            type="button"
            aria-label={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarExpanded}
            title={sidebarExpanded ? "Collapse sidebar" : "Expand sidebar"}
            onClick={() => setSidebarExpanded((expanded) => !expanded)}
            className="flex h-[42px] w-[42px] shrink-0 cursor-pointer items-center justify-center rounded-[13px] border-0 bg-transparent text-black/50 opacity-100 hover:bg-black/[0.06] hover:text-black/85"
          >
            <SidebarIcon expanded={sidebarExpanded} />
          </button>
        </div>

        <div className="my-[14px] h-px w-[calc(100%-20px)] bg-black/[0.06]" />

        {/* Nav items */}
        <div className="flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto px-2.5">
          {NAV.map(item => {
            const active = pathname == item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                className={`flex h-[42px] w-full shrink-0 items-center gap-3 rounded-[13px] text-[13px] font-[650] no-underline transition-colors ${
                  sidebarExpanded ? "justify-start px-3" : "justify-center px-0"
                } ${
                  active
                    ? "bg-accent text-white"
                    : "bg-transparent text-black/50 hover:bg-black/[0.06] hover:text-black/85"
                }`}
              >
                <item.Icon />
                {sidebarExpanded && (
                  <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="my-[14px] h-px w-[calc(100%-20px)] bg-black/[0.06]" />

        {/* Bottom: Clerk user control */}
        <div
          className={`flex w-full shrink-0 flex-col items-center gap-2.5 pb-4 ${
            sidebarExpanded ? "px-2.5" : "px-0"
          }`}
        >
          <div
            ref={accountMenuRef}
            title={user.fullName || user.primaryEmailAddress?.emailAddress || "Account"}
            className={`relative flex h-[42px] w-full shrink-0 items-center rounded-[13px] bg-transparent ${
              sidebarExpanded ? "justify-start" : "justify-center"
            }`}
          >
            <button
              type="button"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((open) => !open)}
              className={`flex h-[42px] w-full cursor-pointer items-center gap-2.5 rounded-[13px] border-0 bg-transparent ${
                sidebarExpanded ? "justify-start px-2.5" : "justify-center px-0"
              }`}
            >
              <span className="flex h-[34px] w-[34px] shrink-0">
                <UserAvatar />
              </span>
              {sidebarExpanded && (
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-left font-sans text-[13px] font-[650] text-black/85">
                  {firstName}
                </span>
              )}
            </button>
            {accountOpen && (
              <div
                role="menu"
                className={`absolute bottom-0 z-[1000] w-[280px] overflow-hidden rounded-[14px] border border-black/[0.07] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16),0_4px_16px_rgba(0,0,0,0.08)] ${
                  sidebarExpanded ? "left-[calc(100%+12px)]" : "left-[54px]"
                }`}
              >
                <div className="flex items-center gap-3 border-b border-black/[0.06] px-[18px] py-4">
                  <div className="h-10 w-10 shrink-0">
                    <UserAvatar />
                  </div>
                  <div className="min-w-0">
                    <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-black/85">
                      {user.fullName || firstName}
                    </div>
                    <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-black/50">
                      {user.primaryEmailAddress?.emailAddress}
                    </div>
                  </div>
                </div>
                <SignOutButton>
                  <button
                    type="button"
                    role="menuitem"
                    className="flex h-[52px] w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-[18px] text-left font-sans text-sm font-[650] text-black/85 hover:bg-black/[0.06]"
                  >
                    <NavIcon>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </NavIcon>
                    Sign out
                  </button>
                </SignOutButton>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Main content ── */}
      <div className="flex h-screen flex-1 flex-col overflow-hidden">
        {/* Greeting header */}
        <div className="relative z-10 flex shrink-0 items-start justify-between gap-4 px-4 py-3 md:items-center md:px-8 md:py-[18px]">
          <div className="pointer-events-none absolute inset-0 z-0 hidden overflow-visible md:block">
            {mode === "sparkle"    && <Sparkles />}
            {mode === "flower"     && <Flowers />}
            {mode === "cloud"      && <Clouds />}
          </div>

          <div className="relative z-10 min-w-0">
            <h1 className="m-0 text-[22px] font-bold leading-tight tracking-[-0.03em] text-black/85 md:text-[23px]">
              Hello, {firstName}!
            </h1>
            <p className="mt-[3px] mb-0 text-xs tracking-[0.005em] text-black/50">
              Search, save, and build lasting knowledge.
            </p>
          </div>
          <div className="relative z-10 hidden shrink-0 items-center gap-4 md:flex">
            <ModeSwitch mode={mode} onChange={setMode} />
          </div>
        </div>

        <main className={`page-scroll min-h-0 flex-1 overflow-x-hidden bg-page pb-20 md:pb-0 ${lockScroll ? "overflow-y-hidden" : "overflow-y-auto"}`}>
          {children}
        </main>
      </div>

      <nav className="fixed right-3 bottom-3 left-3 z-50 flex h-16 items-center justify-around rounded-[22px] border border-black/[0.07] bg-white/95 px-2 shadow-[0_12px_36px_rgba(0,0,0,0.16)] backdrop-blur md:hidden">
        {NAV.map(item => {
          const active = pathname == item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={`flex h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-[15px] text-[10px] font-bold transition-colors ${
                active ? "bg-accent text-white" : "text-black/50 hover:bg-black/[0.06] hover:text-black/85"
              }`}
            >
              <item.Icon />
              <span className="max-w-16 truncate">{item.label === "Learning Space" ? "Learn" : item.label}</span>
            </Link>
          );
        })}

        <div ref={mobileAccountMenuRef} className="relative">
          <button
            type="button"
            aria-label="Account menu"
            aria-expanded={accountOpen}
            title={user.fullName || user.primaryEmailAddress?.emailAddress || "Account"}
            onClick={() => setAccountOpen((open) => !open)}
            className="flex h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-[15px] text-[10px] font-bold text-black/50 transition-colors hover:text-black/85"
          >
            <span className="flex h-[26px] w-[26px] shrink-0">
              <UserAvatar />
            </span>
            <span>Account</span>
          </button>

          {accountOpen && (
            <div
              role="menu"
              className="fixed right-3 bottom-[88px] z-[1000] w-[min(320px,calc(100vw-24px))] overflow-hidden rounded-[16px] border border-black/[0.07] bg-white shadow-[0_16px_48px_rgba(0,0,0,0.16),0_4px_16px_rgba(0,0,0,0.08)]"
            >
              <div className="flex items-center gap-3 border-b border-black/[0.06] px-[18px] py-4">
                <div className="h-10 w-10 shrink-0">
                  <UserAvatar />
                </div>
                <div className="min-w-0">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold text-black/85">
                    {user.fullName || firstName}
                  </div>
                  <div className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-black/50">
                    {user.primaryEmailAddress?.emailAddress}
                  </div>
                </div>
              </div>
              <SignOutButton>
                <button
                  type="button"
                  role="menuitem"
                  className="flex h-[52px] w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-[18px] text-left font-sans text-sm font-[650] text-black/85 hover:bg-black/[0.06]"
                >
                  <NavIcon>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </NavIcon>
                  Sign out
                </button>
              </SignOutButton>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}
