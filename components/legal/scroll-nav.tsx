"use client";

// components/legal/scroll-nav.tsx
// Shared "use client" component — handles:
//   1. Sticky sidebar with active-section highlight (IntersectionObserver)
//   2. Collapsible mobile TOC
//
// Used by both privacy-policy/page.tsx and terms-of-service/page.tsx.
// The page files themselves stay as pure Server Components.

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SectionMeta = { id: string; short: string };

interface ScrollNavProps {
  sections: SectionMeta[];
  /** href + label for the cross-link at the bottom of the sidebar */
  crossLink: { href: string; label: string };
}

// ─── Sidebar (desktop) ────────────────────────────────────────────────────────

function Sidebar({
  sections,
  crossLink,
  activeId,
}: ScrollNavProps & { activeId: string }) {
  return (
    <nav className="sticky top-20 hidden lg:flex flex-col gap-0.5 w-52 shrink-0 pt-1">
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 px-3 mb-2">
        On this page
      </p>

      {sections.map((s, i) => (
        <a
          key={s.id}
          href={`#${s.id}`}
          className={cn(
            "flex items-center gap-2.5 rounded-sm px-3 py-1.5 text-sm transition-all duration-150",
            activeId === s.id
              ? "bg-border/60 text-foreground font-medium"
              : "text-muted-foreground hover:text-foreground hover:bg-border/30"
          )}
        >
          <span
            className={cn(
              "font-mono text-[10px] shrink-0 transition-colors",
              activeId === s.id ? "text-foreground/60" : "text-muted-foreground/40"
            )}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          {s.short}
        </a>
      ))}

      <div className="mt-6 border-t pt-4 px-3">
        <p className="text-[11px] text-muted-foreground/60 leading-relaxed">
          Also see our{" "}
          <Link
            href={crossLink.href}
            className="text-foreground/70 underline underline-offset-2 hover:text-foreground transition-colors"
          >
            {crossLink.label}
          </Link>
        </p>
      </div>
    </nav>
  );
}

// ─── Mobile TOC ───────────────────────────────────────────────────────────────

function MobileToc({ sections }: { sections: SectionMeta[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden mb-8 border rounded-sm bg-card shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
          Contents
        </span>
        <span className="text-muted-foreground text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t divide-y divide-border/50">
          {sections.map((s, i) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-border/20 transition-colors"
            >
              <span className="font-mono text-[10px] text-muted-foreground/40 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              {s.short}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Combined export ──────────────────────────────────────────────────────────

/**
 * Renders:
 *  - A sticky sidebar nav on lg+ screens with live active-section tracking
 *  - A collapsible TOC on mobile (rendered as a sibling, not inside the sidebar)
 *
 * Usage (inside a Server Component layout):
 *
 *   <div className="flex gap-10 ...">
 *     <ScrollNav sections={sectionsMeta} crossLink={{ href: "/terms-of-service", label: "Terms of Service" }} />
 *     <div className="min-w-0 flex-1 divide-y divide-border/50">
 *       {/* static section blocks *\/}
 *     </div>
 *   </div>
 *
 * The mobile TOC is rendered inside the flex container but only visible on < lg.
 */
export function ScrollNav({ sections, crossLink }: ScrollNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      <Sidebar sections={sections} crossLink={crossLink} activeId={activeId} />
      {/* Mobile TOC sits inside the main flex row but only shows on < lg */}
      {/* We render it as an absolutely-positioned wrapper so it doesn't break the flex layout */}
    </>
  );
}

// ─── Page-specific wrappers (re-exported for cleaner imports) ─────────────────

export function PrivacyScrollNav({ sections }: { sections: SectionMeta[] }) {
  return (
    <ScrollNav
      sections={sections}
      crossLink={{ href: "/terms-of-service", label: "Terms of Service" }}
    />
  );
}

export function ToSScrollNav({ sections }: { sections: SectionMeta[] }) {
  return (
    <ScrollNav
      sections={sections}
      crossLink={{ href: "/privacy-policy", label: "Privacy Policy" }}
    />
  );
}

// ─── Mobile TOC export (used directly in page body, above section list) ───────

export function LegalMobileToc({ sections }: { sections: SectionMeta[] }) {
  return <MobileToc sections={sections} />;
}