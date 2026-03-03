// app/terms-of-service/page.tsx
// NO "use client" — this is a Server Component.
// Interactive sidebar & mobile TOC are handled by <ToSScrollNav> (client component).

import { cn } from "@/lib/utils";
import { FullWidthDivider } from "@/components/ui/landing/full-width-divider";
import { GridPattern } from "@/components/ui/landing/grid-pattern";
import { HeaderWrapper } from "@/components/header-wrapper";
import { Footer } from "@/components/footer";
import Link from "next/link";
import { ToSScrollNav } from "@/components/legal/scroll-nav"; // client component

// ─── Data ─────────────────────────────────────────────────────────────────────

const EFFECTIVE_DATE = "July 18, 2025";

export const sectionsMeta = [
  { id: "acceptance",    short: "Acceptance"           },
  { id: "eligibility",   short: "Eligibility"          },
  { id: "accounts",      short: "Accounts"             },
  { id: "permitted-use", short: "Permitted Use"        },
  { id: "prohibited",    short: "Prohibited Conduct"   },
  { id: "content",       short: "User Content"         },
  { id: "assessments",   short: "Assessments"          },
  { id: "ip",            short: "Intellectual Property"},
  { id: "third-party",   short: "Third-Party Services" },
  { id: "disclaimers",   short: "Disclaimers"          },
  { id: "liability",     short: "Liability"            },
  { id: "termination",   short: "Termination"          },
  { id: "governing-law", short: "Governing Law"        },
  { id: "changes",       short: "Changes"              },
  { id: "contact",       short: "Contact"              },
];

// ─── Section content ──────────────────────────────────────────────────────────

function Acceptance() {
  return (
    <p>
      By accessing or using the PlaceTrix platform ("Service"), you agree to be bound by
      these Terms of Service ("Terms") and our{" "}
      <Link href="/privacy-policy">Privacy Policy</Link>, incorporated by reference. If
      you do not agree, you may not use the Service. These Terms constitute a binding
      agreement between you and PlaceTrix.
    </p>
  );
}

function Eligibility() {
  return (
    <>
      <p>
        The Service is available exclusively to students, faculty, Training & Placement
        Officers (TPOs), and administrators of educational institutions ("Institutions")
        that have a valid agreement with PlaceTrix.
      </p>
      <p>
        You must be at least 13 years of age to use the Service. By using it, you confirm
        that you meet these requirements and that your Institution has authorized your access.
      </p>
    </>
  );
}

function Accounts() {
  return (
    <>
      <p>
        Accounts are provisioned by your Institution. You are solely responsible for
        maintaining the confidentiality of your credentials and all activity under your
        account.
      </p>
      <ul>
        <li>Notify your TPO or Administrator immediately of any unauthorized account use.</li>
        <li>Do not share or transfer your account credentials to any other person.</li>
        <li>PlaceTrix is not liable for losses arising from your failure to secure your credentials.</li>
      </ul>
    </>
  );
}

function PermittedUse() {
  return (
    <>
      <p>You may use the Service only for its intended purposes, including:</p>
      <ul>
        <li>Taking mock tests and assessments to prepare for placements.</li>
        <li>Tracking your academic progress and placement readiness.</li>
        <li>Applying for placement opportunities facilitated through the platform.</li>
        <li>Attending and managing placement-related events.</li>
        <li>Uploading and managing your resume and academic records.</li>
      </ul>
    </>
  );
}

function Prohibited() {
  return (
    <>
      <p>You agree <strong>not</strong> to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose or in violation of applicable regulations.</li>
        <li>Attempt unauthorized access to any part of the Service or its connected systems.</li>
        <li>Reverse-engineer, decompile, or disassemble any software associated with the Service.</li>
        <li>Upload viruses, malware, or any other malicious code.</li>
        <li>Impersonate any person or entity, or misrepresent your institutional affiliation.</li>
        <li>Share, publish, or distribute assessment questions, answers, or any proprietary platform content.</li>
        <li>Interfere with or disrupt the integrity or performance of the Service or its infrastructure.</li>
        <li>Use automated bots or scripts to access the Service without prior written consent.</li>
      </ul>
    </>
  );
}

function Content() {
  return (
    <>
      <p>
        You retain ownership of content you submit (e.g., resumes, profile information).
        By submitting content, you grant PlaceTrix a limited, non-exclusive, royalty-free
        license to store, process, and display that content solely to provide the Service.
      </p>
      <p>
        You represent that you have all necessary rights to the content you submit and that
        it does not infringe any third-party rights or violate any applicable law.
      </p>
    </>
  );
}

function Assessments() {
  return (
    <>
      <p>By participating in any assessment, you agree to:</p>
      <ul>
        <li>Complete all assessments independently without unauthorized assistance.</li>
        <li>Not share, reproduce, screenshot, or distribute any assessment content in any form.</li>
        <li>Accept that your results may be shared with your Institution's TPO and Administrators.</li>
      </ul>
      <p>
        Violation of academic integrity may result in immediate suspension or permanent
        termination of your account, as determined by your Institution and PlaceTrix.
      </p>
    </>
  );
}

function IntellectualProperty() {
  return (
    <p>
      All content, features, and functionality of the Service — including text, graphics,
      logos, question banks, UI design, and underlying software — are the exclusive property
      of PlaceTrix and/or its licensors, protected by applicable intellectual property laws.
      You may not reproduce, distribute, modify, or commercially exploit any part of the
      Service without prior written consent from PlaceTrix.
    </p>
  );
}

function ThirdParty() {
  return (
    <p>
      The Service relies on third-party providers including Google Cloud Platform and
      Firebase, subject to their own terms and privacy policies. PlaceTrix is not
      responsible for the practices, availability, or content of any third-party service.
      Links within the platform are provided for convenience only and do not constitute
      an endorsement.
    </p>
  );
}

function Disclaimers() {
  return (
    <>
      <p>
        The Service is provided on an "as is" and "as available" basis without warranties
        of any kind, express or implied. PlaceTrix expressly disclaims all warranties,
        including merchantability, fitness for a particular purpose, and non-infringement.
      </p>
      <p>
        PlaceTrix does not warrant that the Service will be uninterrupted, error-free, or
        free of harmful components. Placement outcomes are not guaranteed.
      </p>
    </>
  );
}

function Liability() {
  return (
    <p>
      To the maximum extent permitted by applicable law, PlaceTrix and its affiliates,
      officers, employees, agents, and licensors shall not be liable for any indirect,
      incidental, special, consequential, or punitive damages — including loss of data,
      profits, or goodwill — arising from your use of or inability to use the Service,
      even if advised of the possibility of such damages.
    </p>
  );
}

function Termination() {
  return (
    <p>
      PlaceTrix or your Institution may suspend or terminate your access at any time, for
      any reason, without prior notice or liability. Upon termination, your right to use
      the Service immediately ceases. Sections on Intellectual Property, Disclaimers,
      Limitation of Liability, and Governing Law survive termination.
    </p>
  );
}

function GoverningLaw() {
  return (
    <p>
      These Terms are governed by the laws of India, without regard to conflict of law
      principles. Any dispute shall be subject to the exclusive jurisdiction of the
      competent courts in Nashik, Maharashtra, India. You agree to first attempt informal
      resolution by contacting us before initiating formal proceedings.
    </p>
  );
}

function ChangesSection() {
  return (
    <p>
      We reserve the right to modify these Terms at any time. Material changes will update
      the "Effective Date" above and be notified via the app. Continued use after the
      effective date constitutes your acceptance. If you do not agree to updated Terms,
      you must stop using the Service.
    </p>
  );
}

function ContactSection() {
  return (
    <>
      <p>
        If you have questions about these Terms, first contact your Institution's TPO or
        Administrator. For matters requiring direct communication with PlaceTrix:
      </p>
      <p>
        <a href="mailto:business@360viewtech.in">
          business@360viewtech.in
        </a>
      </p>
    </>
  );
}

const sectionContent: Record<string, React.ReactNode> = {
  acceptance:      <Acceptance />,
  eligibility:     <Eligibility />,
  accounts:        <Accounts />,
  "permitted-use": <PermittedUse />,
  prohibited:      <Prohibited />,
  content:         <Content />,
  assessments:     <Assessments />,
  ip:              <IntellectualProperty />,
  "third-party":   <ThirdParty />,
  disclaimers:     <Disclaimers />,
  liability:       <Liability />,
  termination:     <Termination />,
  "governing-law": <GoverningLaw />,
  changes:         <ChangesSection />,
  contact:         <ContactSection />,
};

const sectionTitles: Record<string, string> = {
  acceptance:      "Acceptance of Terms",
  eligibility:     "Eligibility",
  accounts:        "User Accounts",
  "permitted-use": "Permitted Use",
  prohibited:      "Prohibited Conduct",
  content:         "User-Submitted Content",
  assessments:     "Assessments & Academic Integrity",
  ip:              "Intellectual Property",
  "third-party":   "Third-Party Services",
  disclaimers:     "Disclaimers",
  liability:       "Limitation of Liability",
  termination:     "Termination",
  "governing-law": "Governing Law & Disputes",
  changes:         "Changes to These Terms",
  contact:         "Contact Us",
};

// ─── Section Block ────────────────────────────────────────────────────────────

const proseClasses = cn(
  "text-sm leading-[1.8] text-muted-foreground",
  "[&_p]:mb-3 [&_p:last-child]:mb-0",
  "[&_ul]:mb-3 [&_ul]:space-y-1.5 [&_ul]:pl-4",
  "[&_li]:relative [&_li]:pl-3",
  "[&_li]:before:absolute [&_li]:before:left-0 [&_li]:before:top-[0.6em]",
  "[&_li]:before:size-1 [&_li]:before:rounded-full [&_li]:before:bg-border",
  "[&_strong]:font-medium [&_strong]:text-foreground/80",
  "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4",
  "[&_a]:hover:text-foreground/70 [&_a]:transition-colors"
);

function SectionBlock({ id, index }: { id: string; index: number }) {
  return (
    <article id={id} className="relative scroll-mt-24 py-10 first:pt-0">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-mono text-[11px] text-muted-foreground/50 shrink-0">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {sectionTitles[id]}
      </h2>
      <div className={proseClasses}>{sectionContent[id]}</div>
    </article>
  );
}

// ─── Page (Server Component) ──────────────────────────────────────────────────

export default function TermsOfServicePage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden supports-[overflow:clip]:overflow-clip">
      <HeaderWrapper />

      <main
        className={cn(
          "relative mx-auto w-full max-w-4xl grow",
          "sm:before:absolute sm:before:-inset-y-14 sm:before:-left-px sm:before:w-px sm:before:bg-border",
          "sm:after:absolute sm:after:-inset-y-14 sm:after:-right-px sm:after:w-px sm:after:bg-border"
        )}
      >
        {/* ── Editorial Hero ─────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b px-4 pb-10 pt-14 sm:px-8 sm:pt-16 md:px-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 opacity-25">
            <GridPattern className="size-full stroke-border" height={32} width={32} x={0} y={0} />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,theme(--color-foreground/.07),transparent)]"
          />

          <div className="fade-in slide-in-from-bottom-6 animate-in fill-mode-backwards delay-100 duration-500 ease-out flex items-center gap-2 mb-5">
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted-foreground/60 border rounded-sm px-2 py-0.5">
              Legal
            </span>
            <span className="text-muted-foreground/40 text-xs">·</span>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              Effective {EFFECTIVE_DATE}
            </span>
          </div>

          <h1 className="fade-in slide-in-from-bottom-6 animate-in fill-mode-backwards delay-200 duration-500 ease-out text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl max-w-2xl">
            Terms of
            <br />
            <span className="text-muted-foreground/40">Service</span>
          </h1>

          <p className="fade-in slide-in-from-bottom-6 animate-in fill-mode-backwards delay-300 duration-500 ease-out mt-5 max-w-lg text-sm text-muted-foreground leading-relaxed sm:text-base">
            The rules and expectations for using PlaceTrix. By accessing the Service,
            you agree to be bound by these Terms.
          </p>

          <div className="fade-in slide-in-from-bottom-6 animate-in fill-mode-backwards delay-400 duration-500 ease-out mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t pt-5 text-[11px] font-mono text-muted-foreground/50">
            <span>Last updated: {EFFECTIVE_DATE}</span>
            <span className="hidden sm:inline">·</span>
            <span>{sectionsMeta.length} sections</span>
            <span className="hidden sm:inline">·</span>
            <Link
              href="/privacy-policy"
              className="text-foreground/60 hover:text-foreground transition-colors underline underline-offset-2"
            >
              Privacy Policy →
            </Link>
          </div>
        </section>

        {/* ── Body ──────────────────────────────────────────────── */}
        <div className="flex gap-0 lg:gap-10 px-4 sm:px-8 md:px-10 py-10">
          <ToSScrollNav sections={sectionsMeta} />

          <div className="min-w-0 flex-1 divide-y divide-border/50">
            {sectionsMeta.map((s, i) => (
              <SectionBlock key={s.id} id={s.id} index={i} />
            ))}
          </div>
        </div>


        <Footer />
      </main>
    </div>
  );
}