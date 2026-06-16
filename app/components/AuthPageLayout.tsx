"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import { BellisMark } from "./BellisMark";

const DEMO_EMAIL = "alex@bellis.xyz";
const DEMO_PASSWORD = "aleX!2026";

interface AuthPageLayoutProps {
  children: ReactNode;
  eyebrow: string;
  title: string;
  description: string;
  demoHeading?: string;
}

interface CopyCredentialProps {
  label: string;
  value: string;
}

function CopyCredential({ label, value }: CopyCredentialProps) {
  const [copied, setCopied] = useState(false);

  async function copyValue() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-[0.14em] text-black/35">
        {label}
      </dt>
      <dd className="mt-2 flex items-center gap-2 rounded-[10px] bg-[#F1F0EC] p-1.5 pl-3">
        <span className="min-w-0 flex-1 truncate font-mono text-sm text-black/80">
          {value}
        </span>
        <button
          type="button"
          onClick={copyValue}
          aria-label={`Copy ${label.toLowerCase()}`}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-black/[0.08] bg-white text-black/55 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-[#fbfaf7] hover:text-black/80"
          title={copied ? "Copied" : `Copy ${label.toLowerCase()}`}
        >
          {copied ? (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </dd>
    </div>
  );
}

export const clerkAuthAppearance = {
  elements: {
    rootBox: "w-full",
    cardBox: "w-full",
    card: "mx-auto w-full max-w-full sm:max-w-[440px] border-0 shadow-none",
    footer: "hidden",
  },
};

export function AuthPageLayout({
  children,
  eyebrow,
  title,
  description,
  demoHeading,
}: AuthPageLayoutProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#EDECE8] px-4 py-6 text-[#1C1C1C] sm:px-8 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1040px] flex-col justify-start sm:min-h-[calc(100vh-4rem)] lg:justify-center">
        <div className="mb-5 flex items-center justify-between gap-4 sm:mb-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px]">
              <BellisMark size={28} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-bold leading-5 text-black/85">Bellis</div>
              <div className="truncate text-xs font-medium leading-5 text-black/45">English learning assistant</div>
            </div>
          </div>
          <Link
            href="/about"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-[12px] border border-black/[0.08] bg-white px-4 text-sm font-bold text-black/65 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:bg-[#fbfaf7] hover:text-black/85"
          >
            About
          </Link>
        </div>

        <section className="grid w-full overflow-hidden rounded-[22px] border border-black/[0.08] bg-white shadow-[0_24px_80px_rgba(36,36,30,0.13)] lg:min-h-[620px] lg:grid-cols-[minmax(420px,1fr)_390px]">
          <div className="order-2 flex min-w-0 items-center justify-center px-0 py-0 sm:px-5 sm:py-8 lg:order-1 lg:min-h-0 lg:px-10">
            {children}
          </div>

          <aside className="order-1 flex min-w-0 border-b border-black/[0.08] bg-[#F6F5F1] p-5 sm:p-8 lg:order-2 lg:border-b-0 lg:border-l lg:p-10">
            <div className="flex h-full w-full flex-col justify-between gap-5 sm:gap-10">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-[#546d5a]">
                  {eyebrow}
                </p>
                <h1 className="m-0 max-w-none text-2xl font-bold leading-[1.08] tracking-normal text-black/85 sm:max-w-[280px] sm:text-3xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-none text-sm leading-6 text-black/55 sm:mt-4 sm:max-w-[300px]">
                  {description}
                </p>
              </div>

              <div>
                {demoHeading && (
                  <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-black/35">
                    {demoHeading}
                  </p>
                )}
                <dl className="rounded-[16px] border border-black/[0.08] bg-white p-5 shadow-[0_12px_34px_rgba(36,36,30,0.08)]">
                  <div className="border-b border-black/[0.07] pb-4">
                    <CopyCredential label="Email" value={DEMO_EMAIL} />
                  </div>
                  <div className="pt-4">
                    <CopyCredential label="Password" value={DEMO_PASSWORD} />
                  </div>
                </dl>
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
